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
    const [recFormat,    setRecFormat]    = useState('video+audio');

    const [sessionRecIds, setSessionRecIds] = useState(new Set());
    const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recordingHistory') || '[]'); } catch { return []; }
});

useEffect(() => {
    localStorage.setItem('recordingHistory', JSON.stringify(history));
}, [history]);

  const [activeTab, setActiveTab] = useState('Recordings');
  const [mainTab,   setMainTab]   = useState('Recording');
  const [scheduleDate,      setScheduleDate]      = useState('');
const [schedules,         setSchedules]         = useState([]);
const [scheduleLoading,   setScheduleLoading]   = useState(false);
const [showScheduleModal, setShowScheduleModal] = useState(false);

// ── Scheduler tab state ────────────────────────────────────────────────────
const [schedDay,         setSchedDay]         = useState('');
const [schedRoom,        setSchedRoom]        = useState('');
const [schedPeriod,      setSchedPeriod]      = useState('');
const [schedAllDay,      setSchedAllDay]      = useState(false);
const [schedFormat,      setSchedFormat]      = useState('video+audio');
const [schedCamsByRoom,  setSchedCamsByRoom]  = useState({});
const [schedCamsLoading, setSchedCamsLoading] = useState(false);
const [schedSubmitting,  setSchedSubmitting]  = useState(false);

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

const loadAllCameras = useCallback(async () => {
    setSchedCamsLoading(true);
    try {
        const res = await apiFetch(CAM_API);
        const data = res.ok ? await res.json() : [];
        const cams = Array.isArray(data) ? data : [];
        const byRoom = {};
        cams.forEach(c => {
            if (c.roomId && c.streamUrl) {
                if (!byRoom[c.roomId]) byRoom[c.roomId] = [];
                byRoom[c.roomId].push(c);
            }
        });
        setSchedCamsByRoom(byRoom);
    } catch {}
    setSchedCamsLoading(false);
}, []);

useEffect(() => {
    if (mainTab === 'Scheduler') loadAllCameras();
}, [mainTab, loadAllCameras]);

    // ── Build label string ─────────────────────────────────────────────────
    const label = [degree, department, year, selectedRoom, period]
        .filter(Boolean).join('_').toUpperCase().replace(/\s+/g,'_');

    // ── Start / stop ───────────────────────────────────────────────────────
    async function handleStart() {
        if (!selectedCam?.streamUrl) return;
        const res = await apiFetch(`${REC_API}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rtspUrl: selectedCam.streamUrl, label, format: recFormat }),
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
            setHistory(prev => [{ label: stoppedRec.label, stoppedAt, duration, filename: stoppedRec.filename, format: stoppedRec.format, department, year, selectedRoom }, ...prev]);
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

async function handleSchedulerSubmit() {
    if (!schedDay || !schedRoom) return;
    const periods = schedAllDay ? Object.keys(SLOT_SCHEDULE) : [schedPeriod];
    if (!schedAllDay && !schedPeriod) return;

    const cam = (schedCamsByRoom[schedRoom] || [])[0];
    if (!cam?.streamUrl) {
        showToast('No camera registered for this room', 'error');
        return;
    }

    setSchedSubmitting(true);
    let ok = 0;
    for (const p of periods) {
        try {
            const lbl = `ROOM_${schedRoom}_${p}`.toUpperCase().replace(/\s+/g, '_');
            const res = await apiFetch(SCHEDULE_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rtspUrl: cam.streamUrl, label: lbl, period: p, scheduledDate: schedDay, format: schedFormat }),
            });
            if (res.ok) { ok++; }
            else { const e = await res.json(); showToast(e.error || `Failed for ${p}`, 'error'); }
        } catch { showToast(`Failed to schedule ${p}`, 'error'); }
    }
    if (ok > 0) {
        showToast(schedAllDay ? `All-day: ${ok} periods scheduled` : 'Recording scheduled ✓', 'success');
        if (!schedAllDay) setSchedPeriod('');
        refreshSchedules();
    }
    setSchedSubmitting(false);
}

    async function handleDownload(url, suggestedName, type) {
        showToast(type === 'audio' ? 'Preparing audio…' : 'Downloading video…', 'info');
        try {
            const res = await apiFetch(url);
            if (!res.ok) {
                let errMsg = `Download failed (${res.status})`;
                try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
                showToast(errMsg, 'error');
                return;
            }
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = suggestedName || '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
        } catch {
            showToast('Download failed — check server connection', 'error');
        }
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

            {/* ── Top-level tabs ── */}
            <div style={{ display: 'flex', borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
                {[{ id: 'Recording', icon: '⏺' }, { id: 'Scheduler', icon: '🗓' }].map(({ id, icon }) => (
                    <button
                        key={id}
                        onClick={() => setMainTab(id)}
                        style={{
                            padding: '12px 32px', fontSize: 14, fontWeight: 700,
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: mainTab === id ? T.accent : T.textMuted,
                            borderBottom: mainTab === id ? `2px solid ${T.accent}` : '2px solid transparent',
                            marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7,
                        }}
                    >
                        <span>{icon}</span> {id}
                    </button>
                ))}
            </div>

            {mainTab === 'Recording' && (<>

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

  

            {/* ── Actions ── */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                {/* Format selector */}
                <div style={{ marginBottom: 14 }}>
                    <label style={styles.label}>Recording Format</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[
                            { id: 'video+audio', label: '🎬 Video + Audio' },
                            { id: 'video',       label: '📹 Video Only' },
                            { id: 'audio',       label: '🎵 Audio Only' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setRecFormat(opt.id)}
                                disabled={isRecording}
                                style={{
                                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                    cursor: isRecording ? 'not-allowed' : 'pointer',
                                    border: `1px solid ${recFormat === opt.id ? T.accent : T.border}`,
                                    background: recFormat === opt.id ? T.accentDim : 'transparent',
                                    color: recFormat === opt.id ? T.accent : T.textMuted,
                                    opacity: isRecording ? 0.55 : 1,
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
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
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                                    <div style={{ fontSize: 10, color: T.textMuted, textAlign: 'right' }}>
                                        {rec.format === 'video' ? '📹 Video Only' : rec.format === 'audio' ? '🎵 Audio Only' : '🎬 Video + Audio'}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {rec.format !== 'audio' && (
                                            <button onClick={() => handleDownload(`${REC_API}/download/${encodeURIComponent(rec.filename)}`, rec.filename, 'video')}
                                                style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>
                                                ⬇ Video
                                            </button>
                                        )}
                                        {rec.format !== 'video' && (
                                            <button onClick={() => handleDownload(`${REC_API}/audio/${encodeURIComponent(rec.filename)}`, rec.filename.replace(/\.mp4$/i, '.mp3'), 'audio')}
                                                style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: 'rgba(16,185,129,0.09)', color: T.success, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}>
                                                🎵 Audio
                                            </button>
                                        )}
                                    </div>
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
                                    {h.format !== 'audio' && (
                                        <button onClick={() => handleDownload(`${REC_API}/download/${encodeURIComponent(fname)}`, fname, 'video')} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>⬇ Video</button>
                                    )}
                                    {h.format !== 'video' && (
                                        <button onClick={() => handleDownload(`${REC_API}/audio/${encodeURIComponent(fname)}`, fname.replace(/\.mp4$/i, '.mp3'), 'audio')} style={{ padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.09)', color: T.success, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}>🎵 Audio</button>
                                    )}
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

        </>)}

        {/* ── Scheduler tab ── */}
        {mainTab === 'Scheduler' && (
            <div style={styles.card}>
                {/* Form row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
                    <div>
                        <label style={styles.label}>Day</label>
                        <input
                            type="date"
                            value={schedDay}
                            onChange={e => setSchedDay(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            style={styles.input}
                        />
                    </div>
                    <div>
                        <label style={styles.label}>Room No.</label>
                        {schedCamsLoading ? (
                            <div style={{ fontSize: 13, color: T.textMuted, padding: '10px 0' }}>Loading rooms…</div>
                        ) : (
                            <select value={schedRoom} onChange={e => setSchedRoom(e.target.value)} style={styles.select}>
                                <option value="">Select room…</option>
                                {Object.keys(schedCamsByRoom).sort().map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div>
                        <label style={styles.label}>Period</label>
                        <select
                            value={schedPeriod}
                            onChange={e => setSchedPeriod(e.target.value)}
                            disabled={schedAllDay}
                            style={{ ...styles.select, opacity: schedAllDay ? 0.45 : 1 }}
                        >
                            <option value="">Select period…</option>
                            {Object.entries(SLOT_SCHEDULE).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* All-day toggle */}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 20, userSelect: 'none' }}>
                    <span
                        onClick={() => { setSchedAllDay(v => !v); if (!schedAllDay) setSchedPeriod(''); }}
                        style={{
                            width: 42, height: 24, borderRadius: 14, position: 'relative',
                            background: schedAllDay ? T.accent : T.border,
                            transition: 'background 0.2s', flexShrink: 0, cursor: 'pointer',
                        }}
                    >
                        <span style={{
                            position: 'absolute', top: 3, left: schedAllDay ? 21 : 3,
                            width: 18, height: 18, borderRadius: '50%', background: '#fff',
                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        }} />
                    </span>
                    <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>Record All Day</span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>(schedules all 8 periods)</span>
                </label>

                {/* Format selector */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Recording Format</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {[
                            { id: 'video+audio', label: '🎬 Video + Audio' },
                            { id: 'video',       label: '📹 Video Only' },
                            { id: 'audio',       label: '🎵 Audio Only' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setSchedFormat(opt.id)}
                                style={{
                                    padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer',
                                    border: `1px solid ${schedFormat === opt.id ? T.accent : T.border}`,
                                    background: schedFormat === opt.id ? T.accentDim : 'transparent',
                                    color: schedFormat === opt.id ? T.accent : T.textMuted,
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Camera preview */}
                {schedRoom && (
                    <div style={{ marginBottom: 16, padding: '8px 12px', background: T.bg, borderRadius: 6, fontSize: 12 }}>
                        {(schedCamsByRoom[schedRoom] || []).length === 0 ? (
                            <span style={{ color: T.danger }}>No cameras registered for room "{schedRoom}"</span>
                        ) : (
                            <span style={{ color: T.textMuted }}>
                                Camera: <span style={{ color: T.text, fontWeight: 600, fontFamily: T.fontMono }}>
                                    {schedCamsByRoom[schedRoom][0].cameraId || schedCamsByRoom[schedRoom][0].streamUrl}
                                </span>
                                {schedCamsByRoom[schedRoom].length > 1 && ` (+${schedCamsByRoom[schedRoom].length - 1} more)`}
                            </span>
                        )}
                    </div>
                )}

                {/* Submit */}
                <button
                    onClick={handleSchedulerSubmit}
                    disabled={schedSubmitting || !schedDay || !schedRoom || (!schedAllDay && !schedPeriod) || (schedCamsByRoom[schedRoom] || []).length === 0}
                    style={{
                        ...styles.btnPrimary,
                        minWidth: 180,
                        opacity: (schedSubmitting || !schedDay || !schedRoom || (!schedAllDay && !schedPeriod) || (schedCamsByRoom[schedRoom] || []).length === 0) ? 0.45 : 1,
                        marginBottom: 24,
                    }}
                >
                    {schedSubmitting ? '⏳ Scheduling…' : schedAllDay ? '⏰ Schedule All Day' : '⏰ Schedule Recording'}
                </button>

                {/* Schedule list */}
                {schedules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: T.textMuted, fontSize: 13 }}>
                        No scheduled recordings yet
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            All Scheduled ({schedules.filter(s => s.status === 'scheduled' || s.status === 'recording').length} pending · {schedules.filter(s => s.status === 'done').length} done)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                            {[...schedules].sort((a, b) => {
                                const order = { recording: 0, scheduled: 1, done: 2, error: 3 };
                                return (order[a.status] ?? 9) - (order[b.status] ?? 9);
                            }).map(s => (
                                <div key={s.scheduleId} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 14px', borderRadius: 8,
                                    background: s.status === 'done' ? 'rgba(16,185,129,0.06)' : s.status === 'recording' ? 'rgba(239,68,68,0.06)' : T.bg,
                                    border: `1px solid ${s.status === 'done' ? 'rgba(16,185,129,0.3)' : s.status === 'recording' ? 'rgba(239,68,68,0.3)' : T.border}`,
                                }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: s.status === 'recording' ? '#ef4444' : s.status === 'done' ? '#10b981' : s.status === 'error' ? '#ef4444' : '#7c3aed' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text, wordBreak: 'break-all' }}>{s.label}</div>
                                        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.fontMono, marginTop: 2 }}>
                                            {s.scheduledDate} · {s.startTime}–{s.endTime} · <span style={{ textTransform: 'capitalize', color: s.status === 'recording' ? '#ef4444' : s.status === 'done' ? '#10b981' : T.textMuted }}>{s.status}</span>
                                        </div>
                                    </div>
                                    {s.status === 'scheduled' && (
                                        <button onClick={() => handleCancelSchedule(s.scheduleId)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer', flexShrink: 0 }}>
                                            ✕ Cancel
                                        </button>
                                    )}
                                    {s.status === 'done' && (() => {
                                        const fname = recordings.find(r => r.label === s.label && r.status === 'done')?.filename;
                                        const fmt = s.format || 'video+audio';
                                        return fname ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                                                <div style={{ fontSize: 9, color: T.textMuted }}>
                                                    {fmt === 'video' ? '📹 Video Only' : fmt === 'audio' ? '🎵 Audio Only' : '🎬 V+A'}
                                                </div>
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    {fmt !== 'audio' && (
                                                        <button onClick={() => handleDownload(`${REC_API}/download/${encodeURIComponent(fname)}`, fname, 'video')}
                                                            style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: T.accentDim, color: T.accent, border: `1px solid ${T.accent}30`, cursor: 'pointer' }}>⬇ Video</button>
                                                    )}
                                                    {fmt !== 'video' && (
                                                        <button onClick={() => handleDownload(`${REC_API}/audio/${encodeURIComponent(fname)}`, fname.replace(/\.mp4$/i, '.mp3'), 'audio')}
                                                            style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.09)', color: T.success, border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}>🎵 Audio</button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', flexShrink: 0 }}>✓ Done</span>
                                        );
                                    })()}
                                    {s.status === 'recording' && <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', flexShrink: 0 }}>● Recording</span>}
                                    {s.status === 'error' && <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', flexShrink: 0 }}>✕ Error</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
        </div>

        
    );
}