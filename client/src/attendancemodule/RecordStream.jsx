// client/src/attendancemodule/RecordStream.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset, DEGREES } from './config';
import { useDepartments } from './useDepartments';
import { useBatchYears } from './useBatchYears';

const _apiUrl    = getEnvironment();
const CAM_API    = `${_apiUrl}/attendancemodule/cameras`;
const REC_API    = `${_apiUrl}/attendancemodule/cameras/recording`;

const TIMETABLE_API      = `${_apiUrl}/timetablemodule/timetable`;
const CLASSTIMETABLE_API = `${_apiUrl}/timetablemodule/tt`;
const MASTERSEM_API      = `${_apiUrl}/timetablemodule/mastersem`;
const LOCK_API           = `${_apiUrl}/timetablemodule/lock`;

const SCHEDULE_API = `${_apiUrl}/attendancemodule/cameras/recording/schedule`;

const SLOT_SCHEDULE = {
    period1: { label: 'Period 1  (8:30 – 9:30)',   startMin: 510,  endMin: 570  },
    period2: { label: 'Period 2  (9:30 – 10:30)',  startMin: 570,  endMin: 630  },
    period3: { label: 'Period 3  (10:30 – 11:30)', startMin: 630,  endMin: 690  },
    period4: { label: 'Period 4  (11:30 – 12:30)', startMin: 690,  endMin: 750  },
    period5: { label: 'Period 5  (1:30 – 2:30)',   startMin: 810,  endMin: 870  },
    period6: { label: 'Period 6  (2:30 – 3:30)',   startMin: 870,  endMin: 930  },
    period7: { label: 'Period 7  (3:30 – 4:30)',   startMin: 930,  endMin: 990  },
    period8: { label: 'Period 8  (4:30 – 5:30)',   startMin: 990,  endMin: 1050 },
};

const apiFetch = (input, init = {}) =>
    window.fetch(input, { credentials: 'include', ...init });

function fmt(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3)   return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function elapsed(started, now = Date.now()) {
    const s = Math.floor((now / 1000) - started);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2,'0')}:${String(m%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function Toast({ toasts }) {
    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            display: 'flex', flexDirection: 'column', gap: 8,
        }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : t.type === 'info' ? '#6366f1' : '#f59e0b',
                    color: '#fff',
                    animation: 'fadeIn 0.2s ease',

                    display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : t.type === 'info' ? 'ℹ' : '⏳'} {t.msg}
                </div>
            ))}
        </div>
    );
}

export default function RecordStream() {
    const [degree,     setDegree]     = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year,       setYear]       = useState('');
    const [period,     setPeriod]     = useState('');
    const { departments, deptLoading, deptError } = useDepartments();
    const { batchYears, batchYearsLoading }        = useBatchYears();

    const [rooms,         setRooms]         = useState([]);
    const [roomsLoading,  setRoomsLoading]  = useState(false);
    const [selectedRoom,  setSelectedRoom]  = useState('');

    const [roomCameras,  setRoomCameras]  = useState([]);
    const [camLoading,   setCamLoading]   = useState(false);
    const [selectedCam,  setSelectedCam]  = useState(null);   // full camera object

    const [recordings,   setRecordings]   = useState([]);
    const [activeRecId,  setActiveRecId]  = useState(null);

    const [sessionRecIds, setSessionRecIds] = useState(new Set());
    const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recordingHistory') || '[]'); } catch { return []; }
});

useEffect(() => {
    localStorage.setItem('recordingHistory', JSON.stringify(history));
}, [history]);

  const [activeTab, setActiveTab] = useState('Recordings');
  const [scheduleDate,      setScheduleDate]      = useState('');
const [schedules,         setSchedules]         = useState([]);
const [scheduleLoading,   setScheduleLoading]   = useState(false);
const [showScheduleModal, setShowScheduleModal] = useState(false);

    const [toasts, setToasts] = useState([]);
    const toastId = useRef(0);

function showToast(msg, type = 'success') {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
}
    

    const pollRef  = useRef(null);
const tickRef  = useRef(null);
const [now, setNow] = useState(Date.now());

    // ── Load rooms from timetable (same logic as groundtruthgen_rtsp) ──────
    useEffect(() => {
        if (!department) { setRooms([]); return; }
        const normDept = d => String(d||'').trim().toLowerCase().replace(/[\s_\-]+/g,'');
        const target   = normDept(department);
        const deptSpaces = department.replace(/_/g,' ');

        (async () => {
            try {
                setRoomsLoading(true);
                const sessData = await apiFetch(`${TIMETABLE_API}/sess/allsessanddept`).then(r=>r.json());
                const curr = (sessData?.uniqueSessions||[]).find(s=>s.currentSession===true);
                if (!curr?.session) return;
                const allCodes = await apiFetch(`${TIMETABLE_API}/getallcodes/${encodeURIComponent(curr.session)}`).then(r=>r.json());
                const match = (Array.isArray(allCodes)?allCodes:[]).find(t=>normDept(t.dept)===target);
                if (!match?.code) return;
                const semData = await apiFetch(`${MASTERSEM_API}/dept/${encodeURIComponent(deptSpaces)}`).then(r=>r.json());
                const sems = (Array.isArray(semData)?semData:[]).map(s=>s.sem).filter(Boolean);
                const roomSet = new Set();
                const walk = node => {
                    if (!node||typeof node!=='object') return;
                    if (Array.isArray(node)) { node.forEach(walk); return; }
                    if ('room' in node && node.room) roomSet.add(String(node.room).trim().toUpperCase());
                    Object.values(node).forEach(walk);
                };
                await Promise.all(sems.map(async sem => {
                    try {
                        const tt = await apiFetch(`${CLASSTIMETABLE_API}/viewclasstt/${encodeURIComponent(match.code)}/${encodeURIComponent(sem)}`).then(r=>r.json());
                        walk(tt);
                        const lk = await apiFetch(`${LOCK_API}/lockclasstt/${encodeURIComponent(match.code)}/${encodeURIComponent(sem)}`).then(r=>r.json());
                        walk(lk);
                    } catch {}
                }));
                setRooms([...roomSet].sort());
                showToast(`${roomSet.size} rooms loaded`, 'success');
            } catch {}
            finally { setRoomsLoading(false); }
        })();
    }, [department]);

    // ── Load cameras for selected room ─────────────────────────────────────
    useEffect(() => {
        if (!selectedRoom) { setRoomCameras([]); setSelectedCam(null); return; }
        setCamLoading(true);
        apiFetch(`${CAM_API}?roomId=${encodeURIComponent(selectedRoom)}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setRoomCameras(list.filter(c => c.streamUrl));
                if (list.length > 0) setSelectedCam(list[0]);
                else setSelectedCam(null);
            })
            .catch(() => setRoomCameras([]))
            .finally(() => setCamLoading(false));
    }, [selectedRoom]);

    // ── Poll recording list every 4s ───────────────────────────────────────
    const refreshList = useCallback(() => {
        apiFetch(`${REC_API}/list`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setRecordings(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
    refreshList();
    pollRef.current = setInterval(refreshList, 4000);
    tickRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
        clearInterval(pollRef.current);
        clearInterval(tickRef.current);
    };
}, [refreshList]);

    

const refreshSchedules = useCallback(() => {
    apiFetch(`${SCHEDULE_API}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => {
            const list = Array.isArray(data) ? data : [];
            // Save newly done scheduled recordings to History
            setSchedules(prev => {
                list.forEach(s => {
                    const old = prev.find(p => p.scheduleId === s.scheduleId);
                    if (s.status === 'done' && old?.status !== 'done') {
    setHistory(h => {
        const already = h.some(x => x.label === s.label && x.scheduledDate === s.scheduledDate);
        if (already) return h;
        const matchedRec = recordings.find(r => r.label === s.label && r.status === 'done');
        // Calculate duration from the slot definition (startMin → endMin)
        const slotKey = s.period; // e.g. 'period3'
        const slotDef = SLOT_SCHEDULE[slotKey];
        let duration = '—';
       if (slotDef) {
    const totalSec = (slotDef.endMin - slotDef.startMin) * 60;
    const h2 = Math.floor(totalSec / 3600);
    const m2 = Math.floor((totalSec % 3600) / 60);
    const s2 = totalSec % 60;
    duration = `${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}:${String(s2).padStart(2,'0')}`;
} else if (matchedRec?.started) {
    duration = elapsed(matchedRec.started);

            // Fallback: use the scheduled slot length (always 60 min)
            const totalSec = (slotDef.endMin - slotDef.startMin) * 60;
            const h2 = Math.floor(totalSec / 3600);
            const m2 = Math.floor((totalSec % 3600) / 60);
            const s2 = totalSec % 60;
            duration = `${String(h2).padStart(2,'0')}:${String(m2).padStart(2,'0')}:${String(s2).padStart(2,'0')}`;
        }
        return [{ 
            label: s.label, 
            stoppedAt: new Date().toLocaleString(), 
            duration,
            filename: matchedRec?.filename || null,
            department, 
            year, 
            selectedRoom,
            scheduled: true,
        }, ...h];
    });
}
                });
                return list;
            });
        })
        .catch(() => {});
}, [department, year, selectedRoom, recordings]);

useEffect(() => {
    refreshSchedules();
    const t = setInterval(refreshSchedules, 8000);
    return () => clearInterval(t);
}, [refreshSchedules]);

    // ── Build label string ─────────────────────────────────────────────────
    const label = [degree, department, year, selectedRoom, period]
        .filter(Boolean).join('_').toUpperCase().replace(/\s+/g,'_');

    // ── Start / stop ───────────────────────────────────────────────────────
    async function handleStart() {
        if (!selectedCam?.streamUrl) return;
        const res = await apiFetch(`${REC_API}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rtspUrl: selectedCam.streamUrl, label }),
        });
        if (res.ok) {
            const data = await res.json();
            setActiveRecId(data.recordingId);
            setSessionRecIds(prev => new Set([...prev, data.recordingId]));
            showToast('Recording started', 'success');
            refreshList();
        }
    }

    async function handleStop() {
        if (!activeRecId) return;
        const stoppedRec = recordings.find(r => r.recordingId === activeRecId);
        await apiFetch(`${REC_API}/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recordingId: activeRecId }),
        });
        if (stoppedRec) {
            const stoppedAt = new Date().toLocaleString();
            const duration = stoppedRec.started ? elapsed(stoppedRec.started) : '—';
            setHistory(prev => [{ label: stoppedRec.label, stoppedAt, duration, filename: stoppedRec.filename, department, year, selectedRoom }, ...prev]);
        }
        setActiveRecId(null);
        showToast('Recording stopped', 'info');
        setTimeout(refreshList, 1500);
    }

    // ADD after handleStop():
async function handleSchedule() {
    if (!selectedCam?.streamUrl || !period || !scheduleDate) return;
    setScheduleLoading(true);
    try {
        const res = await apiFetch(`${SCHEDULE_API}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                rtspUrl: selectedCam.streamUrl,
                label,
                period,
                scheduledDate: scheduleDate,
            }),
        });
        if (res.ok) {
            showToast('Recording scheduled ✓', 'success');
            setScheduleDate('');
            refreshSchedules();
        } else {
            const err = await res.json();
            showToast(err.error || 'Schedule failed', 'error');
        }
    } catch {
        showToast('Schedule request failed', 'error');
    } finally {
        setScheduleLoading(false);
    }
}

async function handleCancelSchedule(scheduleId) {
    await apiFetch(`${SCHEDULE_API}/${scheduleId}`, { method: 'DELETE' });
    showToast('Schedule cancelled', 'info');
    refreshSchedules();
}

    const isRecording = Boolean(activeRecId);
    const T = theme;

    return (
        <div style={styles.page}>
            <Toast toasts={toasts} />
            <style>{cssReset}{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}> Record Class Stream</div>
                <div style={styles.subheading}>
                    Save an RTSP camera stream for a class period — download video or audio 
                </div>
            </div>

            {/* ── Selection Card ── */}
            <div style={{ ...styles.card, marginBottom: 24, opacity: isRecording ? 0.55 : 1, pointerEvents: isRecording ? 'none' : 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select value={department} onChange={e => { setDepartment(e.target.value); setSelectedRoom(''); }} style={styles.select} disabled={deptLoading}>
                            <option value="">{deptLoading ? 'Loading…' : 'Select…'}</option>
                            {departments.map(d => <option key={d} value={d}>{d.replace(/_/g,' ')}</option>)}
                        </select>
                        {deptError && <div style={{ fontSize: 11, color: T.danger, marginTop: 4 }}>{deptError}</div>}
                    </div>
                    <div>
                        <label style={styles.label}>Year (Batch)</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {batchYearsLoading ? <option>Loading…</option> : batchYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                        <label style={styles.label}>Room</label>
                        {roomsLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg }}>
                                <span style={{ display: 'inline-block', width: 16, height: 16, border: `2px solid ${T.accent}`, borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                <span style={{ fontSize: 13, color: T.textMuted }}>Loading rooms…</span>
                            </div>
                        ) : (
                            <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} style={styles.select} disabled={!department}>
                                <option value="">{!department ? 'Select department first' : 'Select room…'}</option>
                                {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        )}
                    </div>
                     <div>
                        <label style={styles.label}>Period</label>
                        <select value={period} onChange={e => setPeriod(e.target.value)} style={styles.select}>
                            <option value="">Select period…</option>
                            {Object.entries(SLOT_SCHEDULE).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedRoom && (
                    <div style={{ marginBottom: 20 }}>
                        <label style={styles.label}>Camera</label>
                        {camLoading ? (
                            <div style={{ color: T.textMuted, fontSize: 13 }}>Loading cameras…</div>
                        ) : roomCameras.length === 0 ? (
                            <div style={{ color: T.danger, fontSize: 13 }}>No cameras registered for room "{selectedRoom}"</div>
                        ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                                {roomCameras.map(cam => (
                                    <button key={cam._id} onClick={() => setSelectedCam(cam)} style={{
                                        padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
                                        fontSize: 13, fontWeight: 600, border: '1px solid',
                                        borderColor: selectedCam?._id === cam._id ? T.accent : T.border,
                                        background: selectedCam?._id === cam._id ? T.accentDim : 'transparent',
                                        color: selectedCam?._id === cam._id ? T.accent : T.textMuted,
                                    }}>
                                        {cam.position || cam.cameraId || cam.roomId}
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedCam && (
                            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6, fontFamily: T.fontMono }}>
                                {selectedCam.streamUrl}
                            </div>
                        )}
                    </div>
                )}

                <div style={{ padding: '10px 16px', background: T.bg, borderRadius: 6, fontSize: 13, fontFamily: T.fontMono, marginBottom: 0 }}>
                    <span style={{ color: T.textMuted }}>Label: </span>
                    <span style={{ color: label ? T.accent : T.textMuted, fontWeight: 600 }}>{label || '…'}</span>
                </div>
            </div>

  

            {/* ── Card 2: Actions + Schedule ── */}
            <div style={{ ...styles.card, marginBottom: 24 }}>

                {/* Top row: Start/Stop + Schedule button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={handleStart}
                            disabled={isRecording || !selectedCam?.streamUrl || !period || !selectedRoom || !department || !year}
                            style={{
                                ...styles.btnPrimary,
                                opacity: (isRecording || !selectedCam?.streamUrl || !period || !selectedRoom || !department || !year) ? 0.45 : 1,
                                minWidth: 160,
                                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                            }}
                        >
                            {isRecording ? (
                                <>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite', display: 'inline-block' }} />
                                    Recording…
                                </>
                            ) : '⏺ Start Recording'}
                        </button>
                        <button
                            onClick={handleStop}
                            disabled={!isRecording}
                            style={{
                                padding: '10px 22px', borderRadius: 8, cursor: isRecording ? 'pointer' : 'default',
                                fontSize: 14, fontWeight: 700, border: 'none',
                                background: isRecording ? '#ef4444' : '#fca5a5',
                                color: '#fff', opacity: isRecording ? 1 : 0.45,
                            }}
                        >
                            ⏹ Stop
                        </button>
                    </div>

                    <button
                        onClick={() => setShowScheduleModal(true)}
                        disabled={!selectedCam?.streamUrl || !period || !department || !year || !selectedRoom}
                        style={{
                            padding: '9px 18px', borderRadius: 8, border: `1px solid #7c3aed`,
                            background: 'rgba(124,58,237,0.06)', color: '#7c3aed',
                            fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            opacity: (!selectedCam?.streamUrl || !period || !department || !year || !selectedRoom) ? 0.4 : 1,
                        }}
                    >
                        🗓 + Schedule
                    </button>
                </div>

                {/* Scheduled list — only shown if any exist */}
{department && year && selectedRoom &&  schedules.filter(s => {
    if (s.status !== 'done' && s.status !== 'error') return true;
    // Also show today's done/error ones
    const today = new Date().toISOString().split('T')[0];
    return s.scheduledDate === today;
}).length > 0 && (
                    <div style={{ marginTop: 20, borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                       Scheduled ({schedules.filter(s => s.status === 'scheduled' || s.status === 'recording').length} pending · {schedules.filter(s => s.status === 'done').length} done today)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                            {schedules.filter(s => {
    if (s.status !== 'done' && s.status !== 'error') return true;
    const today = new Date().toISOString().split('T')[0];
    return s.scheduledDate === today;
}).sort((a, b) => {
    // Active/scheduled first, done last
    const order = { recording: 0, scheduled: 1, done: 2, error: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9);
}).map(s => (
                                <div key={s.scheduleId} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', borderRadius: 8,
                                    background: s.status === 'done' ? 'rgba(16,185,129,0.06)' : s.status === 'recording' ? 'rgba(239,68,68,0.06)' : T.bg,
                                    border: `1px solid ${s.status === 'done' ? 'rgba(16,185,129,0.3)' : s.status === 'recording' ? 'rgba(239,68,68,0.3)' : T.border}`,
                                }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                        background: s.status === 'recording' ? '#ef4444' : s.status === 'done' ? '#10b981' : s.status === 'error' ? '#ef4444' : '#7c3aed',
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, wordBreak: 'break-all' }}>{s.label}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono, marginTop: 2 }}>
                                            {s.scheduledDate} · {s.startTime}–{s.endTime} · <span style={{ textTransform: 'capitalize', color: s.status === 'recording' ? '#ef4444' : s.status === 'done' ? '#10b981' : T.textMuted }}>{s.status}</span>
                                        </div>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
    {s.status === 'scheduled' && (
        <button onClick={() => handleCancelSchedule(s.scheduleId)} style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
        }}>
            ✕ Cancel
        </button>
    )}
    {s.status === 'done' && (
        <span style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(16,185,129,0.08)', color: '#10b981',
            border: '1px solid rgba(16,185,129,0.25)',
            display: 'inline-block',
        }}>
            ✓ Done
        </span>
    )}
    {s.status === 'recording' && (
        <span style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'inline-block',
        }}>
            ● Recording
        </span>
    )}
    {s.status === 'error' && (
        <span style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: 'rgba(239,68,68,0.08)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.25)',
            display: 'inline-block',
        }}>
            ✕ Error
        </span>
    )}
</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        

           {/* ── Recordings + History tabbed card ── */}
<div style={styles.card}>
    {/* Tab headers */}
    <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        {['Recordings', 'History'].map(tab => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                    padding: '10px 20px', fontSize: 14, fontWeight: 600,
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: activeTab === tab ? T.accent : T.textMuted,
                    borderBottom: activeTab === tab ? `2px solid ${T.accent}` : '2px solid transparent',
                    marginBottom: -1,
                }}
            >
                {tab}
            </button>
        ))}
    </div>

    {/* Recordings tab */}
    {activeTab === 'Recordings' && (
        !department || !year || !selectedRoom ? (
    <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted, fontSize: 13 }}>
        Select department, year and room to view recordings
    </div>
) : recordings.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '40px 0', color: T.textMuted, fontSize: 13 }}>
        No recordings yet — start a recording above
    </div>
) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                  {[...recordings].filter(rec => {
                    // Always show active recording regardless of filters
                    if (rec.recordingId === activeRecId) return true;
if (rec.status === 'recording') return true;   // ← ADD THIS LINE
if (!rec.filename) return true;

                    // Only today's recordings
                    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
// filename format: LABEL_YYYYMMDD_HHMMSS.mp4
// extract YYYYMMDD from second-to-last underscore segment
const parts = rec.filename.replace(/\.mp4$/i, '').split('_');
const recDate = parts.length >= 2 ? parts[parts.length - 2] : '';
if (recDate !== today) return false;

                    // Filter by selected dept/year/room
                    if (!department || !year || !selectedRoom) return false;
                    const prefix = [degree, department, year, selectedRoom]
                        .filter(Boolean).join('_').toUpperCase().replace(/\s+/g, '_');
                    return rec.label?.toUpperCase().startsWith(prefix);
                }).reverse().map(rec => {
                    const isActive = rec.recordingId === activeRecId;
                    return (
                        <div key={rec.recordingId} style={{
                            border: `1px solid ${isActive ? T.accent : T.border}`,
                            borderRadius: 10, padding: '14px 18px',
                            background: isActive ? T.accentDim : T.surface,
                            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                        }}>
                            <span style={{
                                width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                                background: isActive ? '#ef4444' : T.success,
                                animation: isActive ? 'pulse 1s infinite' : 'none',
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 3, wordBreak: 'break-all' }}>
                                    {rec.label}
                                </div>
                                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono }}>
                                    {new Date(rec.started * 1000).toLocaleTimeString()}
                                    {isActive && ` · ${elapsed(rec.started, now)}`}
                                    {rec.sizeBytes > 0 && ` · ${fmt(rec.sizeBytes)}`}
                                    {isActive && ' · recording'}
                                </div>
                            </div>
                            {!isActive && rec.status === 'done' && (
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button onClick={() => { showToast('Downloading video…', 'info'); window.location.href = `${REC_API}/download/${encodeURIComponent(rec.filename)}`; }}
                                        style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>
                                        ⬇ Video
                                    </button>
                                    <button onClick={() => { showToast('Downloading audio…', 'info'); window.location.href = `${REC_API}/audio/${encodeURIComponent(rec.filename)}`; }}
                                        style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.09)', color: T.success, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}>
                                        🎵 Audio
                                    </button>
                                </div>
                            )}
                            {isActive && (
                                <button onClick={handleStop} style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
                                    ⏹ Stop
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        )
    )}

    {/* History tab */}
    {activeTab === 'History' && (() => {
        if (!department || !year || !selectedRoom) {
            return (
                <div style={{ textAlign: 'center', padding: '28px 0', color: T.textMuted, fontSize: 13 }}>
                    Select department, year and room to view history
                </div>
            );
        }
        const filteredHistory = history.filter(h =>
            h.department === department &&
            h.year === year &&
            h.selectedRoom === selectedRoom
        );
        return filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: T.textMuted, fontSize: 13 }}>
               No history for this selection yet
            </div>
        ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                        {filteredHistory.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 14px', background: T.bg, borderRadius: 8, border: `1px solid ${T.border}` }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.success, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: T.text, wordBreak: 'break-all' }}>{h.label}</div>
                            <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono, marginTop: 2 }}>{h.stoppedAt} · {h.duration}</div>
                        </div>
                       {(() => {
                            // Use stored filename, or look up live from recordings by label
                            const fname = h.filename || 
                                recordings.find(r => r.label === h.label && r.status === 'done')?.filename;
                            return fname ? (
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    <button onClick={() => { window.location.href = `${REC_API}/download/${encodeURIComponent(fname)}`; }} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>⬇ Video</button>
                                    <button onClick={() => { window.location.href = `${REC_API}/audio/${encodeURIComponent(fname)}`; }} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.09)', color: T.success, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}>🎵 Audio</button>
                                </div>
                            ) : (
                                <span style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>file unavailable</span>
                            );
                        })()}
                    </div>
                ))}
            </div>
       );
    })()}
    
</div>

{/* ── Schedule Modal ── */}
            {showScheduleModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                    onClick={() => setShowScheduleModal(false)}
                >
                    <div style={{
                        background: '#fff', borderRadius: 14, padding: 28,
                        width: '100%', maxWidth: 480, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                        position: 'relative',
                    }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>🗓 Schedule Recording</div>
                            <button onClick={() => setShowScheduleModal(false)} style={{
                                background: 'none', border: 'none', fontSize: 18,
                                cursor: 'pointer', color: T.textMuted, lineHeight: 1,
                            }}>✕</button>
                        </div>

                        {/* Label preview */}
                        <div style={{ padding: '8px 12px', background: T.bg, borderRadius: 6, fontSize: 12, fontFamily: T.fontMono, color: T.accent, fontWeight: 600, marginBottom: 20, wordBreak: 'break-all' }}>
                            {label}
                        </div>

                        {/* Date */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={styles.label}>Date</label>
                            <input
                                type="date"
                                value={scheduleDate}
                                onChange={e => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                style={styles.input}
                            />
                        </div>

                        {/* Period */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={styles.label}>Period</label>
                            <select value={period} onChange={e => setPeriod(e.target.value)} style={styles.select}>
                                <option value="">Select period…</option>
                                <option value="period1">Period 1 (8:30 – 9:30)</option>
                                <option value="period2">Period 2 (9:30 – 10:30)</option>
                                <option value="period3">Period 3 (10:30 – 11:30)</option>
                                <option value="period4">Period 4 (11:30 – 12:30)</option>
                                <option value="period5">Period 5 (1:30 – 2:30)</option>
                                <option value="period6">Period 6 (2:30 – 3:30)</option>
                                <option value="period7">Period 7 (3:30 – 4:30)</option>
                                <option value="period8">Period 8 (4:30 – 5:30)</option>
                            </select>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowScheduleModal(false)} style={{
                                padding: '9px 20px', borderRadius: 8, border: `1px solid ${T.border}`,
                                background: 'transparent', color: T.textMuted, fontSize: 13,
                                fontWeight: 600, cursor: 'pointer',
                            }}>
                                Cancel
                            </button>
                            <button
                                onClick={async () => { await handleSchedule(); setShowScheduleModal(false); }}
                                disabled={scheduleLoading || !period || !scheduleDate}
                                style={{
                                    padding: '9px 22px', borderRadius: 8, border: 'none',
                                    background: '#7c3aed', color: '#fff', fontSize: 13,
                                    fontWeight: 700, cursor: 'pointer',
                                    opacity: (scheduleLoading || !period || !scheduleDate) ? 0.45 : 1,
                                }}
                            >
                                {scheduleLoading ? '⏳ Scheduling…' : '⏰ Confirm Schedule'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        
    );
}