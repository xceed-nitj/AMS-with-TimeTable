// client/src/attendancemodule/editSessionDates.jsx

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { theme as T, cssReset } from './config';

const apiUrl        = getEnvironment();
const ALLOTMENT_API = `${apiUrl}/timetablemodule/allotment`;
const USER_API      = `${apiUrl}/user/getuser`;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CSS = `
  ${cssReset}
  @keyframes toastIn { from { opacity:0; transform:translateY(-20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes modalIn { from { opacity:0; transform:translateY(-8px) scale(0.99); } to { opacity:1; transform:translateY(0) scale(1); } }

  .session-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; animation: fadeIn .4s ease both; }
  .session-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(26,31,60,0.05); margin-bottom: 20px; animation: fadeIn .4s ease both; }
  .session-card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid ${T.border}; background: ${T.surfaceAlt}; }
  .session-grid { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; padding: 20px; }
  .form-control { display: flex; flex-direction: column; gap: 6px; }

  .term-date-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid ${T.border}; gap: 20px; }
  .term-date-row:last-child { border-bottom: none; }

  .native-input, .native-select {
    width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid ${T.border};
    background: #f8f9fd; color: ${T.text}; font-family: ${T.fontBody}; font-size: 14px; outline: none; transition: border-color 0.2s;
  }
  .native-input:focus, .native-select:focus { border-color: ${T.borderFocus}; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); }

  .native-btn {
    padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 14px;
    cursor: pointer; font-family: ${T.fontBody}; transition: opacity 0.2s; display: inline-flex; align-items: center; justify-content: center;
  }
  .native-btn:hover { opacity: 0.88; }
  .native-btn:disabled { opacity: 0.5; cursor: not-allowed; }

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
    z-index: 999999;
    padding: 14px 22px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    display: flex; align-items: center; gap: 12px;
    font-size: 13.5px; font-weight: 600;
    color: #ffffff !important;
    animation: toastIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .custom-global-modal-overlay {
    position: fixed !important;
    top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(15, 23, 42, 0.45) !important;
    backdrop-filter: blur(5px) !important;
    -webkit-backdrop-filter: blur(5px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999999 !important;
    margin: 0 !important;
    padding: 20px !important;
    box-sizing: border-box !important;
  }
  .custom-global-modal-box {
    background: ${T.surface} !important;
    border: 1px solid ${T.border} !important;
    border-radius: 12px !important;
    padding: 24px !important;
    max-width: 440px !important; 
    width: 100% !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15) !important;
    animation: modalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both !important;
    box-sizing: border-box !important;
  }

  @media (max-width: 768px) {
    .session-grid { grid-template-columns: 1fr; }
    .term-date-row { flex-direction: column; align-items: flex-start; gap: 12px; }
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
  
  const [tempStartDate,     setTempStartDate]     = useState('');
  const [tempEndDate,       setTempEndDate]       = useState('');

  const [nonWorkingDays,    setNonWorkingDays]    = useState([]);

  const [isEditingStart,    setIsEditingStart]    = useState(false);
  const [isEditingEnd,      setIsEditingEnd]      = useState(false);

  const [holidayStartDate,  setHolidayStartDate]  = useState('');
  const [holidayEndDate,    setHolidayEndDate]    = useState('');
  const [newRemark,         setNewRemark]         = useState('');

  const [editingRowDate,    setEditingRowDate]    = useState(null);
  const [editDateValue,     setEditDateValue]     = useState('');
  const [editRemarkValue,   setEditRemarkValue]   = useState('');

  const [pendingDeleteDate, setPendingDeleteDate] = useState(null);

  const fmt = (d) => {
    try {
      if (!d) return '';
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) return '';
      return dateObj.toISOString().split('T')[0];
    } catch { return ''; }
  };

  const getNextDay = (dateStr) => {
    try {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    } catch { return ''; }
  };

  const formatToIndianStandardString = (dateStr) => {
    try {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day   = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year  = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch { return dateStr; }
  };

  const displayDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch { return dateStr; }
  };

  const generateWeekendsForRange = (startStr, endStr, currentDaysList) => {
    if (!startStr || !endStr || startStr > endStr) return currentDaysList;
    const existingDates = new Set(currentDaysList.map(item => item.date));
    let cursor          = new Date(startStr);
    const end           = new Date(endStr);
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
      return [...currentDaysList, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));
    }
    return currentDaysList;
  };

  // ── 1. Role check ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(USER_API, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const roles = d?.user?.role || [];
        setIsAuthorized(roles.includes('iams-admin'));
      })
      .catch(() => setIsAuthorized(false));
  }, []);

  // ── 2. Load sessions list ──────────────────────────────────────────────────
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
        setIsEditingStart(false);
        setIsEditingEnd(false);

        const res = await fetch(
          `${ALLOTMENT_API}?session=${encodeURIComponent(sessionName)}`,
          { credentials: 'include' },
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data   = await res.json();
        const record = Array.isArray(data) ? data[0] : data;

        if (!record) { setAllotmentId(null); return; }

        setAllotmentId(record._id);
        const fetchedStart = fmt(record.startingDate);
        const fetchedEnd   = fmt(record.endingDate);
        
        setStartingDate(fetchedStart);
        setEndingDate(fetchedEnd);
        setTempStartDate(fetchedStart); 
        setTempEndDate(fetchedEnd);

        const parsed = (record.nonWorkingDays || []).map(item => {
          if (item && typeof item === 'object' && item.date) {
            return { date: fmt(item.date), remark: item.remark || 'Holiday' };
          }
          return { date: fmt(item), remark: 'Holiday' };
        }).filter(item => item.date !== '');

        let initialConfiguredDays = parsed;
        if (parsed.length === 0 && fetchedStart && fetchedEnd) {
          initialConfiguredDays = generateWeekendsForRange(fetchedStart, fetchedEnd, parsed);
        }

        setNonWorkingDays(initialConfiguredDays);
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

  const saveToBackendDatabaseDirectly = async (targetStartingDate, targetEndingDate, targetNonWorkingDaysList) => {
    if (!allotmentId) return false;
    setIsSaving(true);
    try {
      const res = await fetch(`${ALLOTMENT_API}/${allotmentId}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          startingDate:   targetStartingDate || null,
          endingDate:     targetEndingDate   || null,
          nonWorkingDays: targetNonWorkingDaysList,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save operation failed');
      }
      triggerToast('success', 'Changes saved successfully.');
      return true;
    } catch (e) {
      triggerToast('error', e.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const triggerToast = (type, text) => {
    setSaveMsg({ type, text });
    setTimeout(() => setSaveMsg(null), 4500);
  };

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    setAllotmentId(null);
    setStartingDate('');
    setEndingDate('');
    setTempStartDate('');
    setTempEndDate('');
    setNonWorkingDays([]);
    setSaveMsg(null);
    navigate(val
      ? `/attendance/edit-session-dates?session=${encodeURIComponent(val)}`
      : '/attendance/edit-session-dates',
    );
  };

  const handleAddNonWorkingDay = async () => {
    if (!holidayStartDate) return;

    if (startingDate && endingDate) {
      if (holidayStartDate < startingDate || holidayStartDate > endingDate) {
        triggerToast('error', `Date must fall within the term context range (${formatToIndianStandardString(startingDate)} to ${formatToIndianStandardString(endingDate)}).`);
        return;
      }
      if (holidayEndDate && (holidayEndDate < startingDate || holidayEndDate > endingDate)) {
        triggerToast('error', 'End date parameter falls outside the semester bounds.');
        return;
      }
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
        triggerToast('error', `${formatToIndianStandardString(isoStr)} registry entry already exists.`);
        return;
      }
      toAdd.push({ date: isoStr, remark: remarkText });
      cursor.setDate(cursor.getDate() + 1);
    }

    if (toAdd.length > 0) {
      const updatedDays = [...nonWorkingDays, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));
      setNonWorkingDays(updatedDays);
      await saveToBackendDatabaseDirectly(startingDate, endingDate, updatedDays);
    }
    setHolidayStartDate('');
    setHolidayEndDate('');
    setNewRemark('');
  };

  const handleSaveInlineEdit = async (originalDate) => {
    if (!editDateValue) return;

    if (startingDate && endingDate && (editDateValue < startingDate || editDateValue > endingDate)) {
      triggerToast('error', `Date must stay within the term boundaries (${formatToIndianStandardString(startingDate)} to ${formatToIndianStandardString(endingDate)}).`);
      return;
    }

    const updatedDays = nonWorkingDays.map(item =>
      item.date === originalDate
        ? { date: editDateValue, remark: editRemarkValue.trim() || 'Holiday' }
        : item,
    ).sort((a, b) => a.date.localeCompare(b.date));

    setNonWorkingDays(updatedDays);
    setEditingRowDate(null);
    await saveToBackendDatabaseDirectly(startingDate, endingDate, updatedDays);
  };

  const handleConfirmedDeletion = async () => {
    if (!pendingDeleteDate) return;
    
    const updatedDays = nonWorkingDays.filter(item => item.date !== pendingDeleteDate);
    setNonWorkingDays(updatedDays);
    setPendingDeleteDate(null);

    await saveToBackendDatabaseDirectly(startingDate, endingDate, updatedDays);
    triggerToast('success', 'Holiday entry removed successfully.');
  };

  const handleSaveStartDateOnly = async () => {
    if (tempStartDate === endingDate) {
      triggerToast('error', 'Start and end dates cannot evaluate to the same value.');
      return;
    }
    if (tempStartDate > endingDate) {
      triggerToast('error', 'Start date cannot exceed session termination bounds.');
      return;
    }
    
    setStartingDate(tempStartDate); 
    setIsEditingStart(false);

    const updatedDaysWithWeekends = generateWeekendsForRange(tempStartDate, endingDate, nonWorkingDays);
    setNonWorkingDays(updatedDaysWithWeekends);
    await saveToBackendDatabaseDirectly(tempStartDate, endingDate, updatedDaysWithWeekends);
  };

  const handleSaveEndDateOnly = async () => {
    if (startingDate === tempEndDate) {
      triggerToast('error', 'Start and end dates cannot evaluate to the same value.');
      return;
    }
    if (startingDate > tempEndDate) {
      triggerToast('error', 'Termination target date must succeed commencement date.');
      return;
    }
    
    setEndingDate(tempEndDate); 
    setIsEditingEnd(false);

    const updatedDaysWithWeekends = generateWeekendsForRange(startingDate, tempEndDate, nonWorkingDays);
    setNonWorkingDays(updatedDaysWithWeekends);
    await saveToBackendDatabaseDirectly(startingDate, tempEndDate, updatedDaysWithWeekends);
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
        Verifying security clearance level…
      </div>
    );
  }

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

        {/* Toast Notification */}
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

        {/* Header Setup */}
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

        {/* Master States */}
        {!sessionName ? (
          <div className="session-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            Select a session above to load its configuration.
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>
            Loading configuration data…
          </div>
        ) : !allotmentId ? (
          <div className="session-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.danger, fontSize: 13 }}>
            No allotment record found for this session.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Term duration segment */}
            <div className="session-card">
              <div className="session-card-header">
                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                  Term Duration Context
                </span>
              </div>
              
              {/* Start Date Row */}
              <div className="term-date-row">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    Start Date
                  </label>
                  {isEditingStart ? (
                    <input
                      type="date"
                      className="native-input"
                      value={tempStartDate} 
                      onChange={e => setTempStartDate(e.target.value)}
                      max={endingDate} 
                      style={{ maxWidth: '300px' }}
                    />
                  ) : (
                    /* ── 🌟 RESTORED 100% ORIGINAL YEAR FORMAT DISPLAYS ── */
                    <div style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                      {startingDate
                        ? new Date(startingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })
                        : <span style={{ color: T.textMuted, fontWeight: 400 }}>Not set</span>}
                    </div>
                  )}
                </div>
                <div>
                  {isEditingStart ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="native-btn"
                        onClick={handleSaveStartDateOnly}
                        style={{ background: T.success, color: '#fff', padding: '8px 14px', fontSize: '12px' }}
                      >
                        Save Date
                      </button>
                      <button
                        className="native-btn"
                        onClick={() => setIsEditingStart(false)}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, padding: '8px 14px', fontSize: '12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="native-btn"
                      onClick={() => { setTempStartDate(startingDate); setIsEditingStart(true); }}
                      style={{ background: T.accent, color: '#fff', padding: '8px 14px', fontSize: '12px' }}
                    >
                      Edit Date
                    </button>
                  )}
                </div>
              </div>

              {/* End Date Row */}
              <div className="term-date-row">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                    End Date
                  </label>
                  {isEditingEnd ? (
                    <input
                      type="date"
                      className="native-input"
                      value={tempEndDate} 
                      onChange={e => setTempEndDate(e.target.value)}
                      min={startingDate} 
                      style={{ maxWidth: '300px' }}
                    />
                  ) : (
                    /* ── 🌟 RESTORED 100% ORIGINAL YEAR FORMAT DISPLAYS ── */
                    <div style={{ padding: '10px 14px', background: T.bg, borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                      {endingDate
                        ? new Date(endingDate).toLocaleDateString('en-IN', { dateStyle: 'long' })
                        : <span style={{ color: T.textMuted, fontWeight: 400 }}>Not set</span>}
                    </div>
                  )}
                </div>
                <div>
                  {isEditingEnd ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="native-btn"
                        onClick={handleSaveEndDateOnly}
                        style={{ background: T.success, color: '#fff', padding: '8px 14px', fontSize: '12px' }}
                      >
                        Save Date
                      </button>
                      <button
                        className="native-btn"
                        onClick={() => setIsEditingEnd(false)}
                        style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textMuted, padding: '8px 14px', fontSize: '12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="native-btn"
                      onClick={() => { setTempEndDate(endingDate); setIsEditingEnd(true); }}
                      style={{ background: T.accent, color: '#fff', padding: '8px 14px', fontSize: '12px' }}
                    >
                      Edit Date
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Non-working days configuration */}
            <div className="session-card">
              <div className="session-card-header">
                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                  Non-Working Days Configuration
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: T.accent }}>
                    {visibleHolidaysCount} mapped
                  </span>
                </span>
              </div>

              {/* Add Entry row element */}
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
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="native-input"
                    value={holidayStartDate}
                    onChange={e => setHolidayStartDate(e.target.value)}
                    min={startingDate}
                    max={endingDate}
                  />
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    className="native-input"
                    value={holidayEndDate}
                    onChange={e => setHolidayEndDate(e.target.value)}
                    disabled={!holidayStartDate} 
                    min={holidayStartDate ? getNextDay(holidayStartDate) : startingDate} 
                    max={endingDate} 
                  />
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Remark / Label
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
                  + Add Non-Working Day
                </button>
              </div>

              {/* Monthly grid tracker card displays */}
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
                                    min={startingDate}
                                    max={endingDate}
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
                                      onClick={() => setPendingDeleteDate(item.date)}
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

            </div>

          </div>
        )}
      </div>

      {/* ── Custom Global Viewport Portal Delete Confirmation Modal ── */}
      {pendingDeleteDate && (
        <div className="custom-global-modal-overlay">
          <div className="custom-global-modal-box">
            <div style={{ fontSize: '16px', fontWeight: 700, color: T.text, marginBottom: '10px', fontFamily: T.fontBody }}>
              Delete Non-Working Day
            </div>
            <div style={{ fontSize: '13.5px', color: T.textMuted, lineHeight: '1.5', marginBottom: '24px', fontFamily: T.fontBody }}>
              Are you sure you want to permanently remove the non-working day registry for <strong style={{ color: T.text }}>{displayDate(pendingDeleteDate)}</strong>?
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPendingDeleteDate(null)}
                style={{
                  background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569',
                  padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: T.fontBody
                }}
              >
                Cancel, Keep Entry
              </button>
              <button
                onClick={handleConfirmedDeletion}
                style={{
                  background: '#ef4444', border: 'none', color: '#ffffff',
                  padding: '10px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: T.fontBody
                }}
              >
                Yes, Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}