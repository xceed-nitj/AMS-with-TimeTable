// client/src/attendancemodule/editSessionDates.jsx

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
// Sessions (academic terms like "2024-25 ODD") live in the timetable allotment model
const ALLOTMENT_API = `${apiUrl}/timetablemodule/allotment`;
const USER_API      = `${apiUrl}/user/getuser`;

const T = {
  bg:         '#f5f6fb',
  surface:    '#ffffff',
  surfaceAlt: '#f0f2f9',
  border:     '#e4e8f5',
  text:       '#1a1f3c',
  textMuted:  '#7b84ab',
  fontMono:   "'IBM Plex Mono', monospace",
  fontBody:   "'IBM Plex Sans', 'Segoe UI', sans-serif",
  indigo:     '#6366f1', indigoDim:  'rgba(99,102,241,0.06)',
  sky:        '#0ea5e9', skyDim:     'rgba(14,165,233,0.09)',
  emerald:    '#10b981', emeraldDim: 'rgba(16,185,129,0.09)',
  amber:      '#f59e0b', amberDim:   'rgba(245,158,11,0.09)',
  red:        '#ef4444', redDim:     'rgba(239,68,68,0.06)',
  purple:     '#a855f7', purpleDim:  'rgba(168,85,247,0.09)',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

  .session-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; animation: fadeUp .4s ease both; }
  .session-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(26,31,60,0.05); animation: fadeUp .4s ease both; }
  .session-card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid ${T.border}; background: ${T.surfaceAlt}; }
  .session-grid { display: grid; gap: 20px; grid-template-columns: 1fr 1fr; padding: 20px; }
  .form-control { display: flex; flex-direction: column; gap: 6px; }

  .native-input, .native-select {
    width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid ${T.border};
    background: ${T.surface}; color: ${T.text}; font-family: ${T.fontBody}; font-size: 13px; outline: none; transition: border-color 0.2s;
  }
  .native-input:focus, .native-select:focus { border-color: ${T.indigo}; }

  .native-btn {
    padding: 10px 16px; border-radius: 8px; border: none; font-weight: 600; font-size: 13px;
    cursor: pointer; font-family: ${T.fontBody}; transition: opacity 0.2s;
  }
  .native-btn:hover { opacity: 0.9; }
  .native-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* 🌟 ULTRACLEAN TABLE RESET SYSTEM TO ELIMINATE GLOBAL BORDERS */
  .session-table { 
    width: 100%; 
    border-collapse: collapse !important; 
    font-size: 13px; 
    text-align: left; 
    border: none !important;
  }
  .session-table th { 
    padding: 14px 20px; 
    background: #fdfdfe !important; 
    color: #5c6b94; 
    font-weight: 600; 
    text-transform: uppercase; 
    font-size: 11px; 
    letter-spacing: 0.06em; 
    border: none !important;
    border-bottom: 1px solid #eef2f7 !important; 
  }
  .session-table td { 
    padding: 16px 20px; 
    border: none !important;
    border-bottom: 1px solid #f6f8fc !important; 
    color: #1e293b; 
    vertical-align: middle;
    font-variant-numeric: tabular-nums;
  }
  .session-table tr:last-child td { 
    border-bottom: none !important; 
  }
  .session-table tr:hover td { 
    background: #f8fafc !important; 
  }

  /* 🌟 SMOOTHLY ROUNDED BADGES WITH BALANCED PADDING */
  .badge-tag { 
    display: inline-flex; 
    align-items: center;
    justify-content: center;
    padding: 4px 14px; 
    border-radius: 20px; 
    font-size: 10.5px; 
    font-weight: 600; 
    text-transform: uppercase; 
    letter-spacing: 0.04em; 
  }

  @media (max-width: 768px) { .session-grid { grid-template-columns: 1fr; } }
`;

export default function EditSessionDates() {
  const [searchParams] = useSearchParams();
  const sessionName    = searchParams.get('session');
  const navigate       = useNavigate();

  const isFetching = useRef(false); // true while loading from DB — suppresses weekend auto-add

  const [isAuthorized,   setIsAuthorized]   = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [isLoading,      setIsLoading]      = useState(false);
  const [isSaving,       setIsSaving]       = useState(false);
  const [saveMsg,        setSaveMsg]        = useState(null); // {type:'success'|'error', text}

  const [allotmentId,    setAllotmentId]    = useState(null);
  const [startingDate,   setStartingDate]   = useState('');
  const [endingDate,     setEndingDate]     = useState('');
  const [nonWorkingDays, setNonWorkingDays] = useState([]); // [{date:'YYYY-MM-DD', remark:'...'}]

  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate,   setHolidayEndDate]   = useState('');
  const [newRemark,        setNewRemark]        = useState('');

  const [editingRowDate,  setEditingRowDate]  = useState(null);
  const [editDateValue,   setEditDateValue]   = useState('');
  const [editRemarkValue, setEditRemarkValue] = useState('');

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
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
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

  // ── 2. Load sessions list for dropdown ────────────────────────────────────
  useEffect(() => {
    if (isAuthorized !== true) return;
    fetch(`${ALLOTMENT_API}/session`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]));
  }, [isAuthorized]);

  // ── 3. Fetch allotment record when session is selected ────────────────────
  useEffect(() => {
    if (isAuthorized !== true || !sessionName) return;

    const fetchSessionData = async () => {
      try {
        isFetching.current = true;
        setIsLoading(true);
        setSaveMsg(null);
        // GET /timetablemodule/allotment?session=xxx  returns array
        const res  = await fetch(
          `${ALLOTMENT_API}?session=${encodeURIComponent(sessionName)}`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data   = await res.json();
        const record = Array.isArray(data) ? data[0] : data;

        if (!record) { setAllotmentId(null); return; }

        setAllotmentId(record._id);
        setStartingDate(fmt(record.startingDate));
        setEndingDate(fmt(record.endingDate));

        // nonWorkingDays stored as [{date, remark}] objects
        const parsed = (record.nonWorkingDays || []).map(item => {
          if (item && typeof item === 'object' && item.date) {
            return { date: fmt(item.date), remark: item.remark || 'Holiday Override' };
          }
          return { date: fmt(item), remark: 'Holiday Override' };
        }).filter(item => item.date !== '');

        setNonWorkingDays(parsed);
        isFetching.current = false; // allow weekend auto-add for manual edits from here on
      } catch {
        isFetching.current = false;
        setAllotmentId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [isAuthorized, sessionName]);

  // ── 4. Auto-add weekends when date range changes (manual edits only) ────────
  useEffect(() => {
    if (!startingDate || !endingDate || startingDate > endingDate) return;
    if (isFetching.current) return; // skip during initial DB load — data already has saved weekends

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
        [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date))
      );
    }
  }, [startingDate, endingDate]);

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    setAllotmentId(null);
    setStartingDate('');
    setEndingDate('');
    setNonWorkingDays([]);
    setSaveMsg(null);
    navigate(val ? `/attendance/edit-session-dates?session=${encodeURIComponent(val)}` : '/attendance/edit-session-dates');
  };

  const handleAddNonWorkingDay = () => {
    if (!holidayStartDate) return;

    const start         = new Date(holidayStartDate);
    const end           = holidayEndDate ? new Date(holidayEndDate) : new Date(holidayStartDate);
    const remarkText    = newRemark.trim() || 'Holiday Override';
    const existingDates = new Set(nonWorkingDays.map(item => item.date));
    let   cursor        = new Date(start);
    const toAdd         = [];

    while (cursor <= end) {
      const isoStr = cursor.toISOString().split('T')[0];
      if (!existingDates.has(isoStr)) toAdd.push({ date: isoStr, remark: remarkText });
      cursor.setDate(cursor.getDate() + 1);
    }

    if (toAdd.length > 0) {
      setNonWorkingDays(prev => [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date)));

      setSaveMsg({ 
        type: 'success', 
        text: `Appended ${toAdd.length} day(s) to registry. Remember to click "Save All Changes" below.` 
      });
      
      // 2. Automatically hide the alert after 3.5 seconds
      setTimeout(() => {
        setSaveMsg(null);
      }, 3500);

    }
    setHolidayStartDate('');
    setHolidayEndDate('');
    setNewRemark('');
  };

  const handleSaveInlineEdit = (originalDate) => {
    if (!editDateValue) return;
    setNonWorkingDays(prev =>
      prev.map(item =>
        item.date === originalDate
          ? { date: editDateValue, remark: editRemarkValue.trim() || 'Holiday Override' }
          : item
      ).sort((a, b) => a.date.localeCompare(b.date))
    );
    setEditingRowDate(null);
  };

  const handleRemoveNonWorkingDay = (targetDate) => {
    setNonWorkingDays(prev => prev.filter(item => item.date !== targetDate));
  };

  const handleSave = async () => {
    if (!allotmentId) return;
    if (startingDate && endingDate && startingDate > endingDate) {
      setSaveMsg({ type: 'error', text: 'Starting date cannot be after ending date.' });
      return;
    }
    setIsSaving(true);
    setSaveMsg(null);
    try {
      // PUT /timetablemodule/allotment/:id — role check happens inside the route
      const res = await fetch(`${ALLOTMENT_API}/${allotmentId}`, {
        method:      'PUT',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ startingDate: startingDate || null, endingDate: endingDate || null, nonWorkingDays }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Save failed');
      }
      setSaveMsg({ type: 'success', text: 'Configuration saved successfully.' });

      setTimeout(() => {
        setSaveMsg(null);
      }, 3500);

    } catch (e) {
      setSaveMsg({ type: 'error', text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (isAuthorized === null) {
    return (
      <div style={{ padding: 40, fontFamily: T.fontBody, color: T.textMuted, textAlign: 'center' }}>
        Checking permissions…
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div style={{ padding: 40, fontFamily: T.fontBody, color: T.red, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚫</div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Access Denied</div>
        <div style={{ fontSize: 13, color: T.textMuted }}>Only <strong>iams-admin</strong> users can edit session dates.</div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.fontBody, padding: 'clamp(16px,3vw,32px)' }}>

        {/* Header */}
        <div className="session-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 'clamp(17px,2.5vw,22px)', letterSpacing: '-0.03em', marginBottom: 3 }}>
              Session Timeline Setup
            </div>
            <div style={{ fontSize: 12, color: T.textMuted }}>
              {sessionName ? `Editing: ${sessionName}` : 'Select an academic session to configure'}
            </div>
          </div>

          <div style={{ minWidth: 240 }}>
            <select className="native-select" value={sessionName || ''} onChange={handleDropdownChange} style={{ fontWeight: 600 }}>
              <option value="">Select active term…</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* No session selected */}
        {!sessionName ? (
          <div className="session-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
            Select an academic session from the dropdown above to configure its dates.
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>
            Loading session data…
          </div>
        ) : !allotmentId ? (
          <div className="session-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.red, fontSize: 13 }}>
            Session record not found. Please check the selected term.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Save feedback banner */}
            {saveMsg && (
              <div style={{
                padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: saveMsg.type === 'success' ? T.emeraldDim : T.redDim,
                border:     `1px solid ${saveMsg.type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                color:      saveMsg.type === 'success' ? T.emerald : T.red,
              }}>
                {saveMsg.type === 'success' ? '✓ ' : '✕ '}{saveMsg.text}
              </div>
            )}

            {/* Term Duration */}
            <div className="session-card">
              <div className="session-card-header">
                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                  Term Duration
                </span>
              </div>
              <div className="session-grid">
                <div className="form-control">
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>STARTING DATE</label>
                  <input type="date" className="native-input" value={startingDate} onChange={e => setStartingDate(e.target.value)} />
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>ENDING DATE</label>
                  <input type="date" className="native-input" value={endingDate} onChange={e => setEndingDate(e.target.value)} min={startingDate} />
                </div>
              </div>
            </div>

            {/* Non-working Days */}
            <div className="session-card">
              <div className="session-card-header">
                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                  Non-Working Calendar Registry ({nonWorkingDays.length})
                </span>
              </div>

              {/* Add row */}
              <div className="session-grid" style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', alignItems: 'flex-end', gap: 12 }}>
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted }}>START DATE</label>
                  <input type="date" className="native-input" value={holidayStartDate} onChange={e => setHolidayStartDate(e.target.value)} />
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted }}>END DATE (OPTIONAL)</label>
                  <input type="date" className="native-input" value={holidayEndDate} onChange={e => setHolidayEndDate(e.target.value)} min={holidayStartDate} />
                </div>
                <div className="form-control">
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted }}>REMARK</label>
                  <input type="text" placeholder="e.g. Diwali Break" className="native-input" value={newRemark} onChange={e => setNewRemark(e.target.value)} />
                </div>
                <button className="native-btn" onClick={handleAddNonWorkingDay} disabled={!holidayStartDate} style={{ background: T.indigo, color: '#fff' }}>
                  + Add
                </button>
              </div>

              {/* Table */}
              <div className="table-scroll-container">
                <table className="session-table">
                  <thead>
                    <tr>
                      <th style={{ width: '35%', paddingLeft: '32px' }}>Date</th>
                      <th style={{ width: '45%', textAlign: 'center' }}>Remark</th>
                      <th style={{ width: '20%', textAlign: 'right', paddingRight: '32px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonWorkingDays.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: T.textMuted, padding: 32, fontStyle: 'italic' }}>
                          No non-working days registered yet.
                        </td>
                      </tr>
                    ) : (
                      nonWorkingDays.map((item, index) => (
                        <tr key={index}>
                          {editingRowDate === item.date ? (
                            <>
                              <td style={{ paddingLeft: '32px' }}><input type="date" className="native-input" style={{ padding: '5px 8px' }} value={editDateValue} onChange={e => setEditDateValue(e.target.value)} /></td>
                              <td><input type="text" className="native-input" style={{ padding: '5px 8px' }} value={editRemarkValue} onChange={e => setEditRemarkValue(e.target.value)} /></td>
                              <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                <button onClick={() => handleSaveInlineEdit(item.date)} style={{ background: 'none', border: 'none', color: T.emerald, fontWeight: 700, marginRight: 10, cursor: 'pointer' }}>Save</button>
                                <button onClick={() => setEditingRowDate(null)} style={{ background: 'none', border: 'none', color: T.textMuted, cursor: 'pointer' }}>Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ fontWeight: 500, color: '#1e293b', paddingLeft: '32px' }}>
                                {displayDate(item.date)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge-tag" style={{
                                  background: item.remark === 'Sunday' ? 'rgba(239,68,68,0.07)' : item.remark === 'Saturday' ? 'rgba(99,102,241,0.07)' : T.purpleDim,
                                  color:      item.remark === 'Sunday' ? T.red : item.remark === 'Saturday' ? T.indigo : T.purple,
                                }}>
                                  {item.remark}
                                </span>
                              </td>
                              {/* 🌟 FIXED: Changed alignItem to alignItems to resolve center-locking vectors inside elements */}
                              <td style={{ textAlign: 'right', paddingRight: '32px' }}>
                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                  
                                  {/* Edit Icon Link */}
                                  <button 
                                    onClick={() => { setEditingRowDate(item.date); setEditDateValue(item.date); setEditRemarkValue(item.remark); }}
                                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #3b82f6', background: '#ffffff', color: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}
                                    title="Edit line"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                      <path d="M8.5 1.5a1.2 1.2 0 011.7 1.7L3.5 10H1.5V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                      <line x1="7" y1="3" x2="9" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                    </svg>
                                  </button>

                                  {/* Delete Icon Link */}
                                  <button 
                                    onClick={() => handleRemoveNonWorkingDay(item.date)}
                                    style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #f87171', background: '#ffffff', color: '#f87171', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}
                                    title="Delete line"
                                  >
                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                                      <path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                      <line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                    </svg>
                                  </button>

                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Save button */}
              <div style={{ padding: 16, borderTop: `1px solid ${T.border}`, background: T.surfaceAlt, textAlign: 'right' }}>
                <button
                  className="native-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{ background: T.emerald, color: '#fff', width: '100%', padding: '12px' }}
                >
                  {isSaving ? 'Saving…' : 'Save All Changes →'}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}