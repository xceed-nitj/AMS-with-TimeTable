// client/src/attendancemodule/editSessionDates.jsx

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { theme as T, cssReset } from './config';

const apiUrl        = getEnvironment();
const ALLOTMENT_API = `${apiUrl}/timetablemodule/allotment`;
const USER_API      = `${apiUrl}/user/getuser`; // 🌟 Restored for production role verification

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CSS = `
  ${cssReset}
  @keyframes toastIn { from { opacity:0; transform:translateY(-20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }

  .session-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; animation: fadeIn .4s ease both; }
  .session-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(26,31,60,0.05); animation: fadeIn .4s ease both; }
  .session-card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid ${T.border}; background: ${T.surfaceAlt}; }
  .session-grid { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; padding: 20px; }
  .form-control { display: flex; flex-direction: column; gap: 6px; }

  .native-input, .native-select {
    width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid ${T.border};
    background: #f8f9fd; color: ${T.text}; font-family: ${T.fontBody}; font-size: 14px; outline: none; transition: border-color 0.2s;
  }
  .native-input:focus, .native-select:focus { border-color: ${T.borderFocus}; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

  .native-btn {
    padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px;
    cursor: pointer; font-family: ${T.fontBody}; transition: opacity 0.2s;
  }
  .native-btn:hover { opacity: 0.88; }
  .native-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* 🌟 Unchanged: Keeping the exact card grid approved by Sir */
  .monthly-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 14px;
    padding: 20px;
  }
  .month-container {
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .month-title {
    font-size: 12px;
    font-weight: 600;
    color: ${T.accent};
    border-bottom: 1px solid ${T.border};
    padding-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }
  .holiday-item-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    background: ${T.bg};
    border-radius: 8px;
    border: 1px solid ${T.border};
  }
  .holiday-display-layout {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }
  .badge-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .icon-btn {
    width: 24px; height: 24px; border-radius: 5px; border: 1px solid;
    background: ${T.surface};
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0; cursor: pointer; transition: opacity 0.15s;
    flex-shrink: 0;
  }
  .icon-btn:hover { opacity: 0.75; }
  .icon-btn-edit   { border-color: ${T.accent}; color: ${T.accent}; }
  .icon-btn-delete { border-color: ${T.danger}; color: ${T.danger}; }

  .floating-toast-container {
    position: fixed;
    top: 24px; right: 24px;
    z-index: 99999;
    padding: 14px 22px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    display: flex; align-items: center; gap: 12px;
    font-size: 13.5px; font-weight: 600;
    color: #ffffff !important;
    animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @media (max-width: 768px) {
    .session-grid { grid-template-columns: 1fr; }
    .monthly-cards-grid { grid-template-columns: 1fr; }
    .floating-toast-container { left: 16px; right: 16px; top: 16px; }
  }
`;

export default function EditSessionDates() {
  const [searchParams] = useSearchParams();
  const sessionName    = searchParams.get('session');
  const navigate       = useNavigate();

  const isFetching = useRef(false);

  const [isAuthorized,      setIsAuthorized]      = useState(null);
  const [sessions,          setSessions]          = useState([]);
  const [isLoading,         setIsLoading]         = useState(false);
  const [isSaving,          setIsSaving]          = useState(false);
  const [saveMsg,           setSaveMsg]           = useState(null);

  const [allotmentId,       setAllotmentId]       = useState(null);
  const [startingDate,      setStartingDate]      = useState('');
  const [endingDate,        setEndingDate]        = useState('');
  const [nonWorkingDays,    setNonWorkingDays]    = useState([]);

  const [isEditingDuration, setIsEditingDuration] = useState(false);

  const [holidayStartDate,  setHolidayStartDate]  = useState('');
  const [holidayEndDate,    setHolidayEndDate]    = useState('');
  const [newRemark,         setNewRemark]         = useState('');

  const [editingRowDate,    setEditingRowDate]    = useState(null);
  const [editDateValue,     setEditDateValue]     = useState('');
  const [editRemarkValue,   setEditRemarkValue]   = useState('');

  const fmt = (d) => {
    try {
      if (!d) return '';
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch { return ''; }
  };

  const displayDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch { return dateStr; }
  };

  // ── 1. Role check ──────────────────────────────────────────────────────────
  useEffect(() => {
    // 🌟 Restored production authorization flow to securely fetch roles from the API
    fetch(USER_API, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const roles = d?.user?.role || [];
        setIsAuthorized(roles.includes('iams-admin'));
      })
      .catch(() => setIsAuthorized(false));
  }, []);

  // ── 2. Load sessions list and auto-select current term ────────────────────
  useEffect(() => {
    if (isAuthorized !== true) return;
    fetch(`${ALLOTMENT_API}/session`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const parsedSessions = Array.isArray(data) ? data : [];
        setSessions(parsedSessions);

        if (!sessionName && parsedSessions.length > 0) {
          const currentSess = parsedSessions.find(s => s && (s.current || s.isCurrent || s.status === 'active'));
          const defaultName = currentSess
            ? (typeof currentSess === 'object' ? currentSess.name || currentSess.session : currentSess)
            : (typeof parsedSessions[0] === 'object' ? parsedSessions[0].name || parsedSessions[0].session : parsedSessions[0]);

          if (defaultName) {
            navigate(`/attendance/edit-session-dates?session=${encodeURIComponent(defaultName)}`, { replace: true });
          }
        }
      })
      .catch(() => setSessions([]));
  }, [isAuthorized, sessionName, navigate]);

  // ── 3. Fetch allotment record when session is selected ────────────────────
  useEffect(() => {
    if (isAuthorized !== true || !sessionName) return;

    const fetchSessionData = async () => {
      try {
        isFetching.current = true;
        setIsLoading(true);
        setSaveMsg(null);
        setIsEditingDuration(false);

        const res    = await fetch(
          `${ALLOTMENT_API}?session=${encodeURIComponent(sessionName)}`,
          { credentials: 'include' },
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data   = await res.json();
        const record = Array.isArray(data) ? data[0] : data;

        if (!record) { setAllotmentId(null); return; }

        setAllotmentId(record._id);
        setStartingDate(fmt(record.startingDate));
        setEndingDate(fmt(record.endingDate));

        const parsed = (record.nonWorkingDays || []).map(item => {
          if (item && typeof item === 'object' && item.date) {
            return { date: fmt(item.date), remark: item.remark || 'Holiday' };
          }
          return { date: fmt(item), remark: 'Holiday' };
        }).filter(item => item.date !== '');

        setNonWorkingDays(parsed);
        isFetching.current = false;
      } catch {
        isFetching.current = false;
        setAllotmentId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [isAuthorized, sessionName]);

  // ── 4. Auto-add weekends when date range changes ──────────────────────────
  useEffect(() => {
    if (!startingDate || !endingDate || startingDate > endingDate) return;
    if (isFetching.current) return;

    const existingDates = new Set(nonWorkingDays.map(item => item.date));
    let cursor          = new Date(startingDate);
    const end           = new Date(endingDate);
    const toAdd         = [];

    while (cursor <= end) {
      const dow    = cursor.getDay();
      const isoStr = cursor.toISOString().split('T')[0];
      if ((dow === 0 || dow === 6) && !existingDates.has(isoStr)) {
        toAdd.push({ date: isoStr, remark: dow === 0 ? 'Sunday' : 'Saturday' });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (toAdd.length > 0) {
      setNonWorkingDays(prev =>
        [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date)),
      );
    }
  }, [startingDate, endingDate]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const triggerToast = (type, text) => {
    setSaveMsg({ type, text });
    setTimeout(() => setSaveMsg(null), 4500);
  };

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    setAllotmentId(null);
    setStartingDate('');
    setEndingDate('');
    setNonWorkingDays([]);
    setSaveMsg(null);
    navigate(val
      ? `/attendance/edit-session-dates?session=${encodeURIComponent(val)}`
      : '/attendance/edit-session-dates',
    );
  };

  const handleAddNonWorkingDay = () => {
    if (!holidayStartDate) return;

    if (startingDate && endingDate) {
      if (holidayStartDate < startingDate || holidayStartDate > endingDate) {
        triggerToast('error', `Holiday must fall within the term (${startingDate} to ${endingDate}).`);
        return;
      }
      if (holidayEndDate && (holidayEndDate < startingDate || holidayEndDate > endingDate)) {
        triggerToast('error', 'End date falls outside the term range.');
        return;
      }
    }

    if (holidayStartDate === holidayEndDate) {
      triggerToast('error', 'Start date and end date cannot be the same.');
    }

    const start         = new Date(holidayStartDate);
    const end           = holidayEndDate ? new Date(holidayEndDate) : new Date(holidayStartDate);
    const remarkText    = newRemark.trim() || 'Holiday';
    const existingDates = new Set(nonWorkingDays.map(item => item.date));
    let   cursor        = new Date(start);
    const toAdd         = [];

    while (cursor <= end) {
      const isoStr = cursor.toISOString().split('T')[0];
      if (existingDates.has(isoStr)) {
        triggerToast('error', `${isoStr} is already added.`);
        return;
      }
      toAdd.push({ date: isoStr, remark: remarkText });
      cursor.setDate(cursor.getDate() + 1);
    }

    if (toAdd.length > 0) {
      setNonWorkingDays(prev => [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date)));
      triggerToast('success', `Added ${toAdd.length} day${toAdd.length !== 1 ? 's' : ''}. Save changes when ready.`);
    }
    setHolidayStartDate('');
    setHolidayEndDate('');
    setNewRemark('');
  };

  const handleSaveInlineEdit = (originalDate) => {
    if (!editDateValue) return;

    if (startingDate && endingDate && (editDateValue < startingDate || editDateValue > endingDate)) {
      triggerToast('error', `Date must stay within the term (${startingDate} to ${endingDate}).`);
      return;
    }

    setNonWorkingDays(prev =>
      prev.map(item =>
        item.date === originalDate
          ? { date: editDateValue, remark: editRemarkValue.trim() || 'Holiday' }
          : item,
      ).sort((a, b) => a.date.localeCompare(b.date)),
    );
    setEditingRowDate(null);
    triggerToast('success', 'Entry updated.');
  };

  const handleRemoveNonWorkingDay = (targetDate) => {
    setNonWorkingDays(prev => prev.filter(item => item.date !== targetDate));
    triggerToast('success', 'Day removed.');
  };

  const handleSaveDurationChange = () => {
    if (startingDate === endingDate) {
      triggerToast('error', 'Start and end dates cannot be the same.');
      return;
    }
    if (startingDate > endingDate) {
      triggerToast('error', 'End date must be after start date.');
      return;
    }
    setIsEditingDuration(false);
    handleSave();
  };

  const handleSave = async () => {
    if (!allotmentId) return;
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`${ALLOTMENT_API}/${allotmentId}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          startingDate:   startingDate || null,
          endingDate:     endingDate   || null,
          nonWorkingDays,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      triggerToast('success', 'Changes saved successfully.');
    } catch (e) {
      triggerToast('error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getHolidaysByMonthAndYear = (monthIdx, year) =>
    nonWorkingDays.filter(day => {
      const d = new Date(day.date);
      const matchesMonthYear = d.getMonth() === monthIdx && d.getFullYear() === year;
      if (!startingDate || !endingDate) return matchesMonthYear;
      return matchesMonthYear && day.date >= startingDate && day.date <= endingDate;
    });

  const getActiveMonthsTimelineList = () => {
    if (!startingDate || !endingDate) {
      const currentYear = new Date().getFullYear();
      return MONTHS.map((name, idx) => ({
        name, monthIdx: idx, year: currentYear, key: `${currentYear}-${idx}`,
      }));
    }

    const start    = new Date(startingDate);
    const end      = new Date(endingDate);
    const list     = [];
    let   cursor   = new Date(start.getFullYear(), start.getMonth(), 1);
    const endLimit = new Date(end.getFullYear(),   end.getMonth(),   1);
    let   safety   = 0;

    while (cursor <= endLimit && safety < 24) {
      const mIdx = cursor.getMonth();
      const yr   = cursor.getFullYear();
      list.push({ name: MONTHS[mIdx], monthIdx: mIdx, year: yr, key: `${yr}-${mIdx}` });
      cursor.setMonth(cursor.getMonth() + 1);
      safety++;
    }
    return list;
  };

  if (isAuthorized === null) {
    return (
      <div style={{ padding: 40, fontFamily: T.fontBody, color: T.textMuted, textAlign: 'center' }}>
        Checking access…
      </div>
    );
  }

  // 🌟 Restored Production Security Shield: Renders restriction screen if unauthorized
  if (isAuthorized === false) {
    return (
      <div style={{ padding: 40, fontFamily: T.fontBody, color: T.danger, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Access Restrictions Enforced</div>
        <div style={{ fontSize: 13, color: T.textMuted }}>Only accounts holding <strong>iams-admin</strong> clearances can alter session registries.</div>
      </div>
    );
  }

  const activeMonthsTimeline = getActiveMonthsTimelineList();

  const visibleHolidaysCount = nonWorkingDays.filter(day => {
    if (!startingDate || !endingDate) return true;
    return day.date >= startingDate && day.date <= endingDate;
  }).length;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.fontBody, padding: 'clamp(16px,3vw,32px)' }}>

        {/* Toast */}
        {saveMsg && (
          <div
            className="floating-toast-container"
            style={{
              background: saveMsg.type === 'success' ? '#10b981' : '#ef4444',
              border:     'none',
              color:      '#ffffff',
            }}
          >
            <span style={{ fontSize: 16, fontWeight: '700' }}>{saveMsg.type === 'success' ? '✓' : '⚠'}</span>
            <div style={{ fontFamily: T.fontBody, fontSize: '13px', fontWeight: 600 }}>{saveMsg.text}</div>
          </div>
        )}

        {/* Header */}
        <div className="session-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 'clamp(17px,2.5vw,22px)', letterSpacing: '-0.03em', marginBottom: 3, color: T.text }}>
              Session Setup
            </div>
            <div style={{ fontSize: 12, color: T.textMuted }}>
              {sessionName ? `Editing: ${sessionName}` : 'Select a session to configure'}
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 280 }}>
            <select
              className="native-select"
              value={sessionName || ''}
              onChange={handleDropdownChange}
              style={{ fontWeight: 600 }}
            >
              <option value="">Select a session…</option>
              {sessions.map(s => {
                const name   = typeof s === 'object' ? (s.name || s.session) : s;
                const isCurr = typeof s === 'object' ? (s.current || s.isCurrent) : false;
                return (
                  <option key={name} value={name}>
                    {name}{isCurr ? ' ★ Current' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* States */}
        {!sessionName ? (
          <div className="session-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            Select a session above to load its configuration.
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>
            Loading…
          </div>
        ) : !allotmentId ? (
          <div className="session-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.danger, fontSize: 13 }}>
            No allotment record found for this session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Term dates */}
            <div className="session-card">
              <div className="session-card-header">
                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                  Term dates
                </span>
                {!isEditingDuration ? (
                  <button
                    className="native-btn"
                    onClick={() => setIsEditingDuration(true)}
                    style={{ background: T.accent, color: '#fff', padding: '6px 12px', fontSize: '11px' }}
                  >
                    Edit dates
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="native-btn"
                      onClick={handleSaveDurationChange}
                      style={{ background: T.success, color: '#fff', padding: '6px 12px', fontSize: '11px' }}
                    >
                      Save range
                    </button>
                    <button
                      className="native-btn"
                      onClick={() => setIsEditingDuration(false)}
                      style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, padding: '6px 12px', fontSize: '11px' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="session-grid">
                <div className="form-control">
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Start date
                  </label>
                  {isEditingDuration ? (
                    <input
                      type="date"
                      className="native-input"
                      value={startingDate}
                      onChange={e => setStartingDate(e.target.value)}
                    />
                  ) : (
                    <div style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                      {startingDate
                        ? new Date(startingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })
                        : <span style={{ color: T.textMuted, fontWeight: 400 }}>Not set</span>}
                    </div>
                  )}
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    End date
                  </label>
                  {isEditingDuration ? (
                    <input
                      type="date"
                      className="native-input"
                      value={endingDate}
                      onChange={e => setEndingDate(e.target.value)}
                      min={startingDate}
                    />
                  ) : (
                    <div style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                      {endingDate
                        ? new Date(endingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })
                        : <span style={{ color: T.textMuted, fontWeight: 400 }}>Not set</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Non-working days */}
            <div className="session-card">
              <div className="session-card-header">
                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                  Non-working days
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: T.accent }}>
                    {visibleHolidaysCount} mapped
                  </span>
                </span>
              </div>

              {/* Add row */}
              <div
                className="session-grid"
                style={{
                  background: T.surfaceAlt,
                  borderBottom: `1px solid ${T.border}`,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  alignItems: 'flex-end',
                  gap: 12,
                }}
              >
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Start date
                  </label>
                  <input
                    type="date"
                    className="native-input"
                    value={holidayStartDate}
                    onChange={e => setHolidayStartDate(e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    End date (optional)
                  </label>
                  <input
                    type="date"
                    className="native-input"
                    value={holidayEndDate}
                    onChange={e => setHolidayEndDate(e.target.value)}
                    min={holidayStartDate}
                  />
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Remark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Winter Vacation"
                    className="native-input"
                    value={newRemark}
                    onChange={e => setNewRemark(e.target.value)}
                  />
                </div>
                <button
                  className="native-btn"
                  onClick={handleAddNonWorkingDay}
                  disabled={!holidayStartDate}
                  style={{ background: T.accent, color: '#fff' }}
                >
                  + Add range
                </button>
              </div>

              {/* Monthly cards grid */}
              <div className="monthly-cards-grid">
                {activeMonthsTimeline.map(({ name, monthIdx, year, key }) => {
                  const monthlyHolidays = getHolidaysByMonthAndYear(monthIdx, year);
                  return (
                    <div className="month-container" key={key}>
                      <div className="month-title">{name} {year}</div>

                      {monthlyHolidays.length === 0 ? (
                        <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic', padding: '8px 0', textAlign: 'center' }}>
                          No non-working days
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                          {monthlyHolidays.map((item, index) => (
                            <div className="holiday-item-row" key={index}>
                              {editingRowDate === item.date ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <input
                                    type="date"
                                    className="native-input"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                    value={editDateValue}
                                    onChange={e => setEditDateValue(e.target.value)}
                                  />
                                  <input
                                    type="text"
                                    className="native-input"
                                    style={{ padding: '4px 8px', fontSize: 12 }}
                                    value={editRemarkValue}
                                    onChange={e => setEditRemarkValue(e.target.value)}
                                  />
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
                                    <button
                                      onClick={() => handleSaveInlineEdit(item.date)}
                                      style={{ background: 'none', border: 'none', color: T.success, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: T.fontBody }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingRowDate(null)}
                                      style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: T.fontBody }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="holiday-display-layout">
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px', color: T.text, fontFamily: T.fontBody }}>
                                      {displayDate(item.date)}
                                    </div>
                                    <span
                                      className="badge-tag"
                                      style={{
                                        marginTop: 4,
                                        background: item.remark === 'Sunday'   ? T.dangerDim  :
                                                    item.remark === 'Saturday' ? T.accentDim  : T.successDim,
                                        color:      item.remark === 'Sunday'   ? T.danger     :
                                                    item.remark === 'Saturday' ? T.accent     : T.success,
                                      }}
                                    >
                                      {item.remark}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      className="icon-btn icon-btn-edit"
                                      title="Edit"
                                      onClick={() => {
                                        setEditingRowDate(item.date);
                                        setEditDateValue(item.date);
                                        setEditRemarkValue(item.remark);
                                      }}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                        <path d="M8.5 1.5a1.2 1.2 0 011.7 1.7L3.5 10H1.5V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                    <button
                                      className="icon-btn icon-btn-delete"
                                      title="Remove"
                                      onClick={() => handleRemoveNonWorkingDay(item.date)}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 12 13" fill="none">
                                        <path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save footer */}
              <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
                <button
                  className="native-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ background: T.success, color: '#fff', width: '100%', padding: '12px', fontSize: 14 }}
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}