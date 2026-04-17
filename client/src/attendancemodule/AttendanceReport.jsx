// client/src/attendancemodule/AttendanceReport.jsx
// Input: room + slot + RTSP URL → auto-lookup from LockSem → attendance report

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import getEnvironment from '../getenvironment';

const apiUrl     = getEnvironment();
const REPORT_API = `${apiUrl}/attendancemodule/reports`;
const ML_API     = `${apiUrl}/ml`;
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
const CAMERA_SWITCH_SEC = 30; // must match CAMERA_SWITCH_SEC in rtsp_routes.py
// ── LT103 dual-camera preset (same as groundtruthgen_rtsp) ───────────────────
const LT103L_URL = 'rtsp://admin:Admin%401234%23@10.10.177.249:554/video/live?channel=1&subtype=0&rtsp_transport=tcp';
const LT103R_URL = 'rtsp://admin:Admin%401234%23@10.10.177.250:554/video/live?channel=1&subtype=0&rtsp_transport=tcp';
const SLOT_LABELS = {
    period1: 'Period 1 — 08:30',
    period2: 'Period 2 — 09:30',
    period3: 'Period 3 — 10:30',
    period4: 'Period 4 — 11:30',
    period5: 'Period 5 — 13:30',
    period6: 'Period 6 — 14:30',
    period7: 'Period 7 — 15:30',
    period8: 'Period 8 — 16:30',
};

export default function AttendanceReport() {
    const [tab, setTab] = useState('run');

    // ── Inputs ────────────────────────────────────────────────────
    const [room,     setRoom]     = useState('');
    const [slot,     setSlot]     = useState('');
    const [rtspUrl,  setRtspUrl]  = useState('');
    const [date,     setDate]     = useState(new Date().toISOString().split('T')[0]);
    const [duration, setDuration] = useState(120);
    const [rtspUrl2,         setRtspUrl2]         = useState('');
    const [checkIntervalMin, setCheckIntervalMin] = useState(5);

    // ── Room list from DB ─────────────────────────────────────────
    const [rooms,        setRooms]        = useState([]);
    const [roomSearch,   setRoomSearch]   = useState('');
    const [showRoomDrop, setShowRoomDrop] = useState(false);

    // ── Timetable auto-lookup state ───────────────────────────────
    const [ttStatus, setTtStatus] = useState(null); // null | 'loading' | 'found' | 'notfound'

    // ── Fallback batch (if LockSem lookup fails) ──────────────────
    const [degree,     setDegree]     = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year,       setYear]       = useState('');
    const { departments, deptLoading, deptError } = useDepartments();
    const sanitizeDept = (d) => (d || '').trim().replace(/\s+/g, '_').toUpperCase();
    const manualBatch = degree && department && year
        ? `${degree}_${sanitizeDept(department)}_${year}` : null;

    // ── Run state ─────────────────────────────────────────────────
    const [processing,      setProcessing]      = useState(false);
    const [streamLog,       setStreamLog]       = useState([]);
    const [liveStats,       setLiveStats]       = useState(null);
    const [liveFrame,       setLiveFrame]       = useState(null);
    const [activeCam,       setActiveCam]       = useState(null);   // 1 | 2 | null
    const [camSwitchAt,     setCamSwitchAt]     = useState(null);   // timestamp when last switched
    const [camCountdown,    setCamCountdown]    = useState(0);       // seconds shown in banner
    const camCountdownRef = useRef(null);
    const activeCamRef = useRef(null);
    const rtspUrl2Ref     = useRef('');
    const [snapshots,       setSnapshots]       = useState([]);
    const [previewActive,   setPreviewActive]   = useState(false);
    const [enrolledRollNos, setEnrolledRollNos] = useState('');
    const [showRollInput,   setShowRollInput]   = useState(false);
    const [saving,          setSaving]          = useState(false);
    const [mlResult,        setMlResult]        = useState(null);
    const [savedReport,     setSavedReport]     = useState(null);
    const [derivedCtx,      setDerivedCtx]      = useState(null);

    // ── Session state (multi-run) ─────────────────────────────────
    const [sessionReportId, setSessionReportId] = useState(null);
    const [sessionActive,   setSessionActive]   = useState(false);
    const [sessionChecks,   setSessionChecks]   = useState(0);

    // ── History ───────────────────────────────────────────────────
    const [reports,     setReports]     = useState([]);
    const [histLoading, setHistLoading] = useState(false);
    const [filterBatch, setFilterBatch] = useState('');
    const [filterDate,  setFilterDate]  = useState('');

    // ── Detail ────────────────────────────────────────────────────
    const [detailReport,  setDetailReport]  = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    // ── Fetch room list from DB on mount ──────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch(`${apiUrl}/timetablemodule/lock/rooms`);
                const data = await res.json();
                setRooms(data.rooms || []);
            } catch { /* silently ignore */ }
        })();
    }, []);

    // ── Timetable auto-lookup when room + slot change ─────────────
    useEffect(() => {
        if (!room || !slot) { setDerivedCtx(null); setTtStatus(null); return; }
        const ctrl = new AbortController();
        setTtStatus('loading');
        (async () => {
            try {
                const params = new URLSearchParams({ room, slot });
                const res = await fetch(
                    `${apiUrl}/timetablemodule/lock/attendance-lookup?${params}`,
                    { signal: ctrl.signal }
                );
                if (!res.ok) throw new Error('not found');
                const data = await res.json();
                setDerivedCtx(data);
                setTtStatus('found');
            } catch (e) {
                if (e.name === 'AbortError') return;
                setDerivedCtx(null);
                setTtStatus('notfound');
            }
        })();
        return () => ctrl.abort();
    }, [room, slot]);

    // ── Fetch saved reports ───────────────────────────────────────
    const fetchReports = useCallback(async () => {
        setHistLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterBatch) params.set('batch', filterBatch);
            if (filterDate)  params.set('date',  filterDate);
            const res  = await fetch(`${REPORT_API}?${params}`);
            const data = await res.json();
            setReports(data.reports || []);
        } catch { showToast('Failed to load reports', 'error'); }
        setHistLoading(false);
    }, [filterBatch, filterDate]);

    useEffect(() => { if (tab === 'history') fetchReports(); }, [tab, fetchReports]);

    // ── Auto-poll detail report when session is live ──────────────
    useEffect(() => {
        if (detailReport?.status !== 'live') return;
        const interval = setInterval(async () => {
            try {
                const res     = await fetch(`${REPORT_API}/${detailReport._id}`);
                const updated = await res.json();
                setDetailReport(updated);
                setSessionChecks(updated.slotResults?.length || 0);
            } catch { /* ignore */ }
        }, 10000);  // poll every 10 seconds
        return () => clearInterval(interval);
    }, [detailReport?._id, detailReport?.status]);

    // ── Camera-switch countdown ticker ────────────────────────────────────────
// Python switches cameras every CAMERA_SWITCH_SEC (30s), not every `duration`.
// We count down from CAMERA_SWITCH_SEC using camSwitchAt as the reference point.
useEffect(() => {
    // Only run countdown when processing AND a camera is active AND cam2 is configured
    const hasCam2 = rtspUrl2.trim().length > 0;
if (!processing || !activeCam || !hasCam2) {
    // Still clear the interval, but DO NOT clear camCountdown to 0 if activeCam is set
    // (so the banner stays visible in single-cam mode without countdown)
    if (camCountdownRef.current) { clearInterval(camCountdownRef.current); camCountdownRef.current = null; }
    if (!processing || !activeCam) setCamCountdown(0);
    return;
}
    // (Re)start the ticker whenever camSwitchAt changes (i.e. every real switch)
    if (camCountdownRef.current) { clearInterval(camCountdownRef.current); camCountdownRef.current = null; }
    const switchedAt = camSwitchAt || Date.now();
    camCountdownRef.current = setInterval(() => {
        const elapsed   = Math.floor((Date.now() - switchedAt) / 1000);
        const remaining = Math.max(0, CAMERA_SWITCH_SEC - elapsed);
        setCamCountdown(remaining);
    }, 500); // 500ms tick is more responsive than 1000ms
    return () => { if (camCountdownRef.current) { clearInterval(camCountdownRef.current); camCountdownRef.current = null; } };
}, [processing, activeCam, camSwitchAt, rtspUrl2]);

    

    // ── Run attendance — SSE stream ───────────────────────────────
    const runAttendance = async () => {
        if (!rtspUrl.trim()) { showToast('Paste the RTSP URL', 'error'); return; }
        if (!room)           { showToast('Enter room number', 'error'); return; }
        if (!slot)           { showToast('Select a slot', 'error'); return; }

        const effectiveBatch = derivedCtx?.batch || manualBatch;
        if (!effectiveBatch) {
            showToast('Batch not found — expand "Batch override" and fill in Degree/Dept/Year', 'error');
            return;
        }

        // ── Parse sir's roll number list ──────────────────────────
        const parsedRollNos = enrolledRollNos.trim()
            ? enrolledRollNos.trim().split(/[\n,]+/).map(r => r.trim()).filter(Boolean)
            : [];

        setProcessing(true); setMlResult(null); setSavedReport(null);
        setSnapshots([]); setLiveFrame(null); setPreviewActive(true);
        setStreamLog([]); setLiveStats(null);
        setActiveCam(rtspUrl2.trim() ? 1 : null);  // show cam 1 immediately if dual-cam
        activeCamRef.current = rtspUrl2.trim() ? 1 : null;
        setCamSwitchAt(Date.now());   // start countdown immediately
        setCamCountdown(CAMERA_SWITCH_SEC);
        rtspUrl2Ref.current = rtspUrl2.trim();

        try {
            const response = await fetch(`${ML_API}/run-attendance-rtsp`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rtspUrl:         rtspUrl.trim(),
                    rtspUrl2:        rtspUrl2.trim(),
                    batch:           effectiveBatch,
                    room, slot,
                    date,
                    durationSec:     duration,
                    frameSkip:       10,
                    subject:         derivedCtx?.subject   || '',
                    faculty:         derivedCtx?.faculty   || '',
                    semester:        derivedCtx?.sem        || '',
                    locksemId:       derivedCtx?.locksemId || '',
                    enrolledRollNos: parsedRollNos,  // ← sir's list sent to Python
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                showToast(errData.error || `Server error ${response.status}`, 'error');
                setProcessing(false);
                setPreviewActive(false);
                return;
            }

            const reader  = response.body.getReader();
            const decoder = new TextDecoder();
            let   buffer  = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop();
                for (const part of parts) {
                    const dataLine = part.split('\n').find(l => l.startsWith('data: '));
                    if (!dataLine) continue;
                    try {
                        const ev = JSON.parse(dataLine.slice(6).trim());
                        if (ev.type === 'stage') {
                            setStreamLog(prev => [...prev, ev.message]);
                        }
                        
    if (ev.type === 'frame') {
    setLiveStats({
        frames:    ev.frame,
        faces:     ev.total_embs,
        elapsed:   ev.elapsed,
        remaining: ev.remaining,
    });
    setLiveFrame({
        faces:   ev.faces,
        camera:  ev.camera,
        elapsed: ev.elapsed,
    });
    // Camera switch tracking — use ref so the closure always sees
    // the latest activeCam value, not the stale one from when
    // runAttendance was first called.
    // Always update activeCam on first frame (null → 1) and on real switches
if (ev.camera != null && ev.camera !== activeCamRef.current) {
    activeCamRef.current = ev.camera;
    setActiveCam(ev.camera);
    setCamSwitchAt(Date.now());
}
}
                        if (ev.type === 'done') {
                            setMlResult(ev.result);
                            if (ev.result?.metadata) {
                                setDerivedCtx(prev => ({ ...prev, ...ev.result.metadata }));
                            }
                            setSnapshots(ev.result?.frame_snapshots || []);
                            setPreviewActive(false);
                            showToast('Processed — review and save');
                            setProcessing(false);
                        }
                        if (ev.type === 'error') {
                            showToast(ev.message, 'error');
                            setPreviewActive(false);
                            setProcessing(false);
                        }
                    } catch {}
                }
            }
        } catch (e) {
            showToast('Failed: ' + e.message, 'error');
            setProcessing(false);
        }
    };


    // ── Start multi-run session ───────────────────────────────────
    const startSession = async () => {
        if (!rtspUrl.trim()) { showToast('Paste Camera 1 RTSP URL', 'error'); return; }
        if (!room)           { showToast('Enter room number', 'error'); return; }
        if (!slot)           { showToast('Select a slot', 'error'); return; }

        const effectiveBatch = derivedCtx?.batch || manualBatch;
        if (!effectiveBatch) {
            showToast('Batch not found — fill in Degree/Dept/Year', 'error');
            return;
        }

        const parsedRollNos = enrolledRollNos.trim()
            ? enrolledRollNos.trim().split(/[\n,]+/).map(r => r.trim()).filter(Boolean)
            : [];

        try {
            const res = await fetch(`${REPORT_API}/start-session`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room, slot, date,
                    rtspUrl:         rtspUrl.trim(),
                    rtspUrl2:        rtspUrl2.trim(),
                    durationSec:     duration,
                    checkIntervalMin,
                    batch:           effectiveBatch,
                    department:      derivedCtx?.dept       || department,
                    subject:         derivedCtx?.subject    || '',
                    faculty:         derivedCtx?.faculty    || '',
                    semester:        derivedCtx?.sem         || '',
                    locksemId:       derivedCtx?.locksemId  || '',
                    enrolledRollNos: parsedRollNos,
                }),
            });
            const data = await res.json();
            if (data.error) { showToast(data.error, 'error'); return; }
            setSessionReportId(data.reportId);
            setSessionActive(true);
            setActiveCam(rtspUrl2.trim() ? 1 : null);
            activeCamRef.current = rtspUrl2.trim() ? 1 : null;
            setCamSwitchAt(Date.now());
            setCamCountdown(CAMERA_SWITCH_SEC);
rtspUrl2Ref.current = rtspUrl2.trim();
            setSessionChecks(0);
            showToast(`Session started — checks every ${checkIntervalMin} min`);
            openDetail(data.reportId);
        } catch (e) {
            showToast('Failed to start session: ' + e.message, 'error');
        }
    };

    // ── Stop multi-run session ────────────────────────────────────
    const stopSession = async (reportId) => {
        try {
            await fetch(`${REPORT_API}/stop-session/${reportId}`, { method: 'POST' });
            setSessionActive(false);
            setSessionReportId(null);
            // Refresh detail report to show draft status
            const res     = await fetch(`${REPORT_API}/${reportId}`);
            const updated = await res.json();
            setDetailReport(updated);
            showToast('Session stopped');
        } catch (e) {
            showToast('Failed to stop session: ' + e.message, 'error');
        }
    };

    // ── Save report ───────────────────────────────────────────────
    const saveReport = async () => {
        if (!mlResult) return;
        setSaving(true);
        const ctx = derivedCtx || {};
        try {
            const res = await fetch(`${REPORT_API}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch:      ctx.batch      || manualBatch,
                    department: ctx.dept       || department,
                    semester:   ctx.sem        || '',
                    subject:    ctx.subject    || '',
                    faculty:    ctx.faculty    || '',
                    room, date, timeSlot: slot,
                    locksemId:  ctx.locksemId  || null,
                    videoLink:  rtspUrl.trim(),
                    mlResult,
                }),
            });
            const data = await res.json();
            if (data.error) {
            showToast(data.error, 'error');
            // If a report already exists for this slot, fetch and open it
            if (res.status === 409) {
                const listRes = await fetch(`${REPORT_API}?batch=${encodeURIComponent(ctx.batch || manualBatch)}&date=${date}`);
                const listData = await listRes.json();
                const existing = (listData.reports || []).find(r => r.timeSlot === slot);
                if (existing) openDetail(existing._id);
            }
        } else {
            setSavedReport(data);
            showToast('Report saved');
        }
    } catch { showToast('Save failed', 'error'); }
    setSaving(false);
};

    const openDetail = async (id) => {
        setTab('detail'); setDetailLoading(true); setDetailReport(null);
        try { setDetailReport(await (await fetch(`${REPORT_API}/${id}`)).json()); }
        catch { showToast('Failed to load report', 'error'); }
        setDetailLoading(false);
    };

    const overrideStatus = async (reportId, rollNo, finalStatus) => {
        try {
            const res  = await fetch(`${REPORT_API}/${reportId}/student/${rollNo}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finalStatus }),
            });
            const data = await res.json();
            if (data.error) { showToast(data.error, 'error'); return; }
            setDetailReport(prev => ({
                ...prev,
                finalReport: prev.finalReport.map(s => s.rollNo === rollNo ? { ...s, finalStatus } : s),
                summary: data.summary,
            }));
            showToast(`${rollNo} → ${finalStatus}`);
        } catch { showToast('Override failed', 'error'); }
    };

    const finalizeReport = async (id) => {
        if (!window.confirm('Finalize? Cannot edit after.')) return;
        try {
            const data = await (await fetch(`${REPORT_API}/${id}/finalize`, { method: 'POST' })).json();
            if (data.error) { showToast(data.error, 'error'); return; }
            setDetailReport(prev => ({ ...prev, status: 'finalized' }));
            showToast('Report finalized');
        } catch { showToast('Finalize failed', 'error'); }
    };

    const deleteReport = async (id) => {
        if (!window.confirm('Delete this draft?')) return;
        try {
            const data = await (await fetch(`${REPORT_API}/${id}`, { method: 'DELETE' })).json();
            if (data.error) { showToast(data.error, 'error'); return; }
            showToast('Deleted'); setTab('history'); fetchReports();
        } catch { showToast('Delete failed', 'error'); }
    };

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 999,
                    padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    animation: 'fadeIn 0.3s',
                    background: toast.type === 'error' ? theme.dangerDim  : theme.successDim,
                    color:      toast.type === 'error' ? theme.danger      : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>{toast.msg}</div>
            )}

            <div style={{ marginBottom: 24 }}>
                <div style={styles.heading}>Attendance Reports</div>
                <div style={styles.subheading}>
                    Enter room + slot + RTSP URL — faculty, subject, batch auto-fetched from timetable
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${theme.border}` }}>
                {[['run','Run Attendance'],['history','Saved Reports'],['detail','Report Detail']].map(([id, label]) => (
                    (id !== 'detail' || detailReport) && (
                        <button key={id} onClick={() => setTab(id)} style={{
                            padding: '10px 20px', background: 'transparent', border: 'none',
                            borderBottom: `2px solid ${tab === id ? theme.accent : 'transparent'}`,
                            color: tab === id ? theme.accent : theme.textMuted,
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: -1,
                        }}>{label}</button>
                    )
                ))}
            </div>

            {/* ════ RUN TAB ════ */}
            {tab === 'run' && (
                <div>
                    <div style={{ ...styles.card, marginBottom: 16 }}>
                        <div style={{ ...styles.sectionTitle, marginBottom: 14 }}>Class Identification</div>

                        {/* Room + Slot + Date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                            <div style={{ position: 'relative' }}>
                                <label style={styles.label}>Room No</label>
                                <input
                                    placeholder="Search room..."
                                    value={showRoomDrop ? roomSearch : room}
                                    onChange={e => { setRoomSearch(e.target.value); setShowRoomDrop(true); }}
                                    onFocus={() => { setRoomSearch(''); setShowRoomDrop(true); }}
                                    onBlur={() => setTimeout(() => setShowRoomDrop(false), 150)}
                                    style={styles.input}
                                />
                                {showRoomDrop && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: '#1a2035', border: `1px solid ${theme.border}`,
                                        borderRadius: '6px', zIndex: 100,
                                        maxHeight: 220, overflowY: 'auto',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                    }}>
                                        {rooms
                                            .filter(r => r.toLowerCase().includes(roomSearch.toLowerCase()))
                                            .map(r => (
                                                <div key={r}
                                                    onMouseDown={() => { setRoom(r); setRoomSearch(''); setShowRoomDrop(false); }}
                                                    style={{
                                                        padding: '9px 14px', cursor: 'pointer',
                                                        fontSize: '13px', color: theme.text,
                                                        borderBottom: `1px solid ${theme.border}`,
                                                        background: r === room ? theme.accentDim : 'transparent',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = theme.accentDim}
                                                    onMouseLeave={e => e.currentTarget.style.background = r === room ? theme.accentDim : 'transparent'}
                                                >{r}</div>
                                            ))
                                        }
                                        {rooms.filter(r => r.toLowerCase().includes(roomSearch.toLowerCase())).length === 0 && (
                                            <div style={{ padding: '9px 14px', color: theme.textMuted, fontSize: '12px' }}>
                                                No rooms match "{roomSearch}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={styles.label}>Slot</label>
                                <select value={slot} onChange={e => setSlot(e.target.value)} style={styles.select}>
                                    <option value="">Select slot...</option>
                                    {Object.entries(SLOT_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Date (for saving only)</label>
                                <input type="date" value={date}
                                    onChange={e => setDate(e.target.value)}
                                    style={styles.input} />
                            </div>
                        </div>

                        {/* Timetable lookup status banners */}
                        {ttStatus === 'loading' && (
                            <div style={{
                                padding: '8px 14px', borderRadius: '6px', marginBottom: 14,
                                background: theme.accentDim, border: `1px solid ${theme.accent}`,
                                fontSize: '11px', color: theme.accent,
                            }}>
                                🔍 Looking up timetable for {room} / {SLOT_LABELS[slot]}…
                            </div>
                        )}
                        {ttStatus === 'notfound' && (
                            <div style={{
                                padding: '8px 14px', borderRadius: '6px', marginBottom: 14,
                                background: theme.warningDim, border: `1px solid ${theme.warning}`,
                                fontSize: '12px', color: theme.warning,
                            }}>
                                ⚠️ No timetable entry found for this room/slot — expand "Batch override" below and fill in manually.
                            </div>
                        )}

                        {/* Derived context display after timetable lookup */}
                        {derivedCtx && ttStatus === 'found' && (
                            <div style={{
                                padding: '10px 14px', borderRadius: '6px', marginBottom: 14,
                                background: theme.successDim, border: `1px solid ${theme.success}`,
                                fontSize: '12px', display: 'flex', gap: 20, flexWrap: 'wrap',
                            }}>
                                <span style={{ color: theme.success, fontWeight: 700 }}>✓ Timetable matched</span>
                                {[
                                    ['Batch',   derivedCtx.batch],
                                    ['Subject', derivedCtx.subject],
                                    ['Faculty', derivedCtx.faculty],
                                    ['Sem',     derivedCtx.sem],
                                    ['Dept',    derivedCtx.dept],
                                ].filter(([, v]) => v).map(([k, v]) => (
                                    <span key={k} style={{ color: theme.textMuted }}>
                                        <span style={{ textTransform: 'uppercase', fontSize: '10px' }}>{k}: </span>
                                        <span style={{ color: theme.text, fontWeight: 600 }}>{v}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Fallback batch selector */}
                        <details style={{ marginBottom: 14 }}>
                            <summary style={{ fontSize: '12px', color: theme.textMuted, cursor: 'pointer', marginBottom: 10 }}>
                                ▶ Batch override (if timetable lookup fails)
                            </summary>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 10 }}>
                                <div>
                                    <label style={styles.label}>Degree</label>
                                    <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                                        {DEGREES.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={styles.label}>Department</label>
                                    <select value={department} onChange={e => setDepartment(e.target.value)}
                                        style={styles.select} disabled={deptLoading}>
                                        <option value="">
                                            {deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select...'}
                                        </option>
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    {deptError && (
                                        <div style={{ fontSize: '11px', color: theme.danger, marginTop: 3 }}>{deptError}</div>
                                    )}
                                </div>
                                <div>
                                    <label style={styles.label}>Year</label>
                                    <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                                        <option value="">Select...</option>
                                        {YEARS.map(y => <option key={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            {manualBatch && (
                                <div style={{ marginTop: 10, fontSize: '12px', color: theme.accent, fontFamily: theme.fontMono }}>
                                    Fallback batch: {manualBatch}
                                </div>
                            )}
                        </details>

                        {/* ── Enrolled Roll Numbers — sir's list ── */}
                        <details
                            open={showRollInput}
                            style={{ marginBottom: 14 }}
                            onToggle={e => setShowRollInput(e.target.open)}
                        >
                            <summary style={{ fontSize: '12px', color: theme.accent, cursor: 'pointer', fontWeight: 600, marginBottom: 8 }}>
                                📋 Enrolled Roll Numbers (sir's list — optional but recommended)
                            </summary>
                            <div style={{ marginTop: 10 }}>
                                <label style={styles.label}>
                                    Paste roll numbers — one per line or comma separated.
                                    Only these appear in the report. Faces detected outside this list are flagged.
                                </label>
                                <textarea
                                    value={enrolledRollNos}
                                    onChange={e => setEnrolledRollNos(e.target.value)}
                                    placeholder={'CS001\nCS002\nCS003\n...\nor: CS001, CS002, CS003'}
                                    rows={6}
                                    style={{
                                        ...styles.input,
                                        fontFamily: theme.fontMono,
                                        resize: 'vertical',
                                        marginTop: 6,
                                    }}
                                />
                                {enrolledRollNos.trim() && (
                                    <div style={{ fontSize: '11px', color: theme.accent, marginTop: 4, fontFamily: theme.fontMono }}>
                                        {enrolledRollNos.trim().split(/[\n,]+/).filter(r => r.trim()).length} roll numbers entered
                                    </div>
                                )}
                            </div>
                        </details>

                        {/* Camera URLs + Interval + Duration + Run */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                            <div>
                                <label style={styles.label}>Camera 1 — RTSP URL</label>
                                <input
                                    placeholder="rtsp://...camera1..."
                                    value={rtspUrl}
                                    onChange={e => setRtspUrl(e.target.value)}
                                    style={{ ...styles.input, fontFamily: theme.fontMono }}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Camera 2 — RTSP URL (optional)</label>
                                <input
    placeholder="rtsp://...camera2..."
    value={rtspUrl2}
    onChange={e => { setRtspUrl2(e.target.value); rtspUrl2Ref.current = e.target.value; }}
    style={{ ...styles.input, fontFamily: theme.fontMono }}
/>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'flex-end' }}>
                            <div>
                                <label style={styles.label}>Check interval (mins)</label>
                                <input
                                    type="number" min={1} max={30} value={checkIntervalMin}
                                    onChange={e => setCheckIntervalMin(Number(e.target.value))}
                                    style={styles.input}
                                    placeholder="e.g. 5"
                                />
                            </div>
                            <div>
                                <label style={styles.label}>Duration per check</label>
                                <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={styles.select}>
                                    <option value={30}>30 seconds</option>
                                    <option value={60}>60 seconds</option>
                                    <option value={120}>120 seconds</option>
                                    <option value={180}>180 seconds</option>
                                    <option value={300}>300 seconds</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                    onClick={runAttendance}

                                    disabled={processing || !rtspUrl.trim() || !room || !slot || (!derivedCtx?.batch && !manualBatch)}
                                    style={{
                                        ...styles.btnPrimary, minWidth: 140,
                                        opacity: (processing || !rtspUrl.trim() || !room || !slot || (!derivedCtx?.batch && !manualBatch)) ? 0.5 : 1,
                                    }}
                                >
                                    {processing ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{
                                                width: 13, height: 13,
                                                border: '2px solid rgba(0,0,0,0.3)',
                                                borderTopColor: theme.accentText,
                                                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                                                display: 'inline-block',
                                            }} />
                                            {liveStats 
  ? `${liveStats.remaining}s left…` 
  : activeCam 
    ? `Cam ${activeCam} — starting…` 
    : 'Connecting…'}
                                        </span>
                                    ) : 'Run Once'}
                                </button>
                                <button
    onClick={() => {
        setRtspUrl(LT103L_URL);
        setRtspUrl2(LT103R_URL);
        rtspUrl2Ref.current = LT103R_URL;
    }}
    disabled={processing}
    style={{
        ...styles.btnPrimary,
        minWidth: 140,
        background: '#1a2a1a',
        border: `1px solid ${theme.success}`,
        color: theme.success,
        opacity: processing ? 0.5 : 1,
        fontSize: '12px',
    }}
    title="Fill Camera 1 = LT103L, Camera 2 = LT103R"
>
    📷 Combined L→R
</button>
                                <button
                                    onClick={startSession}
                                    disabled={processing || sessionActive || !rtspUrl.trim() || !room || !slot || (!derivedCtx?.batch && !manualBatch)}
                                    style={{
                                        ...styles.btnPrimary,
                                        minWidth: 140,
                                        background: theme.success,
                                        opacity: (processing || sessionActive || !rtspUrl.trim() || !room || !slot || (!derivedCtx?.batch && !manualBatch)) ? 0.5 : 1,
                                    }}
                                >
                                    {sessionActive ? `Session running…` : `Start Session`}
                                </button>
                            </div>
                        </div>

                        {/* Live stream log while processing */}
                        {processing && streamLog.length > 0 && (
                            <div style={{
                                marginTop: 14, padding: '10px 14px', background: theme.bg,
                                borderRadius: 6, fontFamily: theme.fontMono, fontSize: '12px',
                                color: theme.textMuted, maxHeight: 120, overflowY: 'auto',
                            }}>
                                {streamLog.map((msg, i) => <div key={i}>{msg}</div>)}
                                {liveStats && (
                                    <div style={{ color: theme.accent, marginTop: 4 }}>
                                        Frame {liveStats.frames} | {liveStats.faces} faces | {liveStats.remaining}s remaining
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Live frame preview while processing */}
                    {processing && (
                        <div style={{ ...styles.card, marginBottom: 16 }}>
                            <div style={{ position: 'relative', marginBottom: 12 }}>
                                <img
                                    src={previewActive ? `${ML_API.replace('/ml', '')}/ml/rtsp-frame-preview` : undefined}
                                    alt="Live frame"
                                    style={{
                                        width: '100%', borderRadius: 8,
                                        background: '#0a0e1a', minHeight: 200,
                                        display: 'block', objectFit: 'contain',
                                    }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                                {liveFrame?.camera && (
                                    <div style={{
                                        position: 'absolute', top: 10, left: 10,
                                        background: 'rgba(0,0,0,0.7)',
                                        color: theme.accent, fontSize: '11px',
                                        fontWeight: 700, padding: '4px 10px',
                                        borderRadius: 4, fontFamily: theme.fontMono,
                                    }}>
                                        CAM {liveFrame.camera}
                                    </div>
                                )}
                                {liveFrame !== null && (
                                    <div style={{
                                        position: 'absolute', top: 10, right: 10,
                                        background: liveFrame.faces > 0 ? 'rgba(0,200,100,0.85)' : 'rgba(200,60,60,0.8)',
                                        color: '#fff', fontSize: '12px',
                                        fontWeight: 700, padding: '4px 12px',
                                        borderRadius: 4, fontFamily: theme.fontMono,
                                    }}>
                                        {liveFrame.faces} face{liveFrame.faces !== 1 ? 's' : ''} detected
                                    </div>
                                )}
                            </div>
                            <div style={{
                                display: 'flex', gap: 20, fontSize: '12px',
                                color: theme.textMuted, fontFamily: theme.fontMono,
                                flexWrap: 'wrap', alignItems: 'center',
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: theme.accent,
                                        animation: 'spin 1s linear infinite',
                                        display: 'inline-block',
                                    }} />
                                    Processing…
                                </span>
                                {liveStats && (
                                    <>
                                        <span>Frame <b style={{ color: theme.text }}>{liveStats.frames}</b></span>
                                        <span>Total faces <b style={{ color: theme.success }}>{liveStats.faces}</b></span>
                                        <span>Elapsed <b style={{ color: theme.text }}>{liveStats.elapsed}s</b></span>
                                        <span>Remaining <b style={{ color: theme.warning }}>{liveStats.remaining}s</b></span>
                                    </>
                                )}
                            </div>

      
                        </div>
                    )}
                    {/* ── Camera switch banner (shown during and after processing) ── */}
{activeCam && (
    <div style={{
        marginTop: 12,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderRadius: 8,
        background: activeCam === 1 ? theme.accentDim : 'rgba(240,192,64,0.1)',
        border: `1px solid ${activeCam === 1 ? theme.accent : '#f0c040'}`,
    }}>
        <span style={{ fontSize: '20px', lineHeight: 1 }}>🎥</span>
        <div style={{ flex: 1 }}>
            <div style={{
                fontSize: '13px', fontWeight: 700,
                color: activeCam === 1 ? theme.accent : '#f0c040',
            }}>
                Camera {activeCam} Active
            </div>
            {rtspUrl2.trim() && camCountdown > 0 && (
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 2 }}>
                    Switching to Camera {activeCam === 1 ? 2 : 1} in{' '}
                    <span style={{
                        fontWeight: 700, fontFamily: theme.fontMono,
                        color: activeCam === 1 ? theme.accent : '#f0c040',
                    }}>
                        {String(Math.floor(camCountdown / 60)).padStart(2, '0')}:{String(camCountdown % 60).padStart(2, '0')}
                    </span>
                </div>
            )}
            {!rtspUrl2.trim() && (
                <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 2 }}>
                    Single camera mode
                </div>
            )}
        </div>
        {rtspUrl2.trim() && (
            <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2].map(n => (
                    <span key={n} style={{
                        padding: '3px 12px', borderRadius: '999px',
                        fontSize: '12px', fontWeight: 700, fontFamily: theme.fontMono,
                        background: activeCam === n
                            ? (n === 1 ? theme.accent : '#f0c040')
                            : theme.border,
                        color: activeCam === n
                            ? (n === 1 ? (theme.accentText || '#fff') : '#000')
                            : theme.textMuted,
                        transition: 'all 0.3s',
                    }}>
                        CAM {n}
                    </span>
                ))}
            </div>
        )}
    </div>
)}


                    {mlResult && !processing && (() => {
                        const arr = Object.values(mlResult.attendance || {});
                        const stats = {
                            present:  arr.filter(s => s.status === 'present').length,
                            review:   arr.filter(s => s.status === 'review').length,
                            absent:   arr.filter(s => s.status === 'absent').length,
                            flagged:  arr.filter(s => s.flagged === true).length,
                            total:    arr.length,
                        };
                        return (
                            <div style={{ animation: 'fadeIn 0.4s' }}>
                                <StatBar stats={[
                                    { label: 'Total',   val: stats.total,   color: theme.text    },
                                    { label: 'Present', val: stats.present, color: theme.success  },
                                    { label: 'Review',  val: stats.review,  color: theme.warning  },
                                    { label: 'Absent',  val: stats.absent,  color: theme.danger   },
                                    ...(stats.flagged > 0 ? [{ label: 'Flagged 🚩', val: stats.flagged, color: theme.warning }] : []),
                                ]} theme={theme} styles={styles} />

                                {/* Saved frame snapshots */}
                                {snapshots.length > 0 && (
                                    <div style={{ ...styles.card, marginBottom: 16 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 10 }}>
                                            Captured Frames ({snapshots.length})
                                        </div>
                                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                            {snapshots.map((snap, i) => (
                                                <div key={i} style={{
                                                    background: theme.bg, borderRadius: 6,
                                                    padding: '8px 12px', fontSize: '11px',
                                                    fontFamily: theme.fontMono, color: theme.textMuted,
                                                    border: `1px solid ${theme.border}`,
                                                }}>
                                                    <div style={{ color: theme.accent, fontWeight: 700 }}>
                                                        Cam {snap.cam} — {snap.elapsed_sec}s
                                                    </div>
                                                    <div style={{ color: snap.faces_count > 0 ? theme.success : theme.danger }}>
                                                        {snap.faces_count} face{snap.faces_count !== 1 ? 's' : ''}
                                                    </div>
                                                    <div style={{ color: theme.textMuted, fontSize: '10px', marginTop: 2, wordBreak: 'break-all' }}>
                                                        {snap.path?.split(/[\\/]/).pop()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div style={{
                                    ...styles.card, marginBottom: 16,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', gap: 12,
                                }}>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Save to Database</div>
                                        <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 2 }}>
                                            {derivedCtx
                                                ? `${derivedCtx.batch} · ${derivedCtx.subject || '—'} · ${derivedCtx.faculty || '—'}`
                                                : 'Persist for later review and finalization'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        {savedReport && <span style={{ ...styles.badge('success'), fontSize: '12px' }}>Saved</span>}
                                        <button onClick={saveReport} disabled={saving || !!savedReport}
                                            style={{ ...styles.btnPrimary, opacity: (saving || !!savedReport) ? 0.5 : 1 }}>
                                            {saving ? 'Saving...' : savedReport ? 'Saved' : 'Save Report'}
                                        </button>
                                        {savedReport && (
                                            <button onClick={() => openDetail(savedReport.reportId)} style={styles.btnGhost}>
                                                View Detail
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <AttendanceTable
                                    rows={Object.entries(mlResult.attendance || {}).map(([rollNo, d]) => ({
                                        rollNo,
                                        status:         d.status,
                                        avgConfidence:  d.avg_confidence,
                                        confidenceZone: d.confidence_zone,
                                        firstSeenSec:   d.first_seen_sec,
                                        inList:         d.in_list,
                                        flagged:        d.flagged,
                                        finalStatus:    d.status === 'present' ? 'P'
                                                      : d.status === 'review'  ? 'R' : 'A',
                                    }))}
                                    readOnly theme={theme} styles={styles}
                                />
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* ════ HISTORY TAB ════ */}
            {tab === 'history' && (
                <div>
                    <div style={{ ...styles.card, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label style={styles.label}>Batch</label>
                            <input placeholder="e.g. BTECH_TT_2026" value={filterBatch}
                                onChange={e => setFilterBatch(e.target.value)}
                                style={{ ...styles.input, width: 220 }} />
                        </div>
                        <div>
                            <label style={styles.label}>Date</label>
                            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                                style={{ ...styles.input, width: 180 }} />
                        </div>
                        <button onClick={fetchReports} style={styles.btnPrimary}>Search</button>
                        <button onClick={() => { setFilterBatch(''); setFilterDate(''); }} style={styles.btnGhost}>Clear</button>
                    </div>

                    {histLoading ? (
                        <div style={{ textAlign: 'center', padding: 48, color: theme.textMuted }}>Loading...</div>
                    ) : reports.length === 0 ? (
                        <div style={{ ...styles.card, textAlign: 'center', padding: 48, color: theme.textMuted }}>
                            No reports found.
                        </div>
                    ) : (
                        <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Batch','Date','Slot','Subject','Faculty','P','A','%','Status',''].map(h => (
                                            <th key={h} style={{ padding: '12px 14px', textAlign: 'left',
                                                fontSize: '10px', color: theme.textMuted,
                                                textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(r => (
                                        <tr key={r._id} style={{ borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}
                                            onClick={() => openDetail(r._id)}>
                                            <td style={{ padding: '11px 14px', fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 600,  color: '#010811' }}>{r.batch}</td>

                                            <td style={{ padding: '11px 14px', color: '#021022' }}>{r.date}</td>
                                            <td style={{ padding: '11px 14px', color: theme.textMuted }}>{SLOT_LABELS[r.timeSlot] || r.timeSlot || '—'}</td>
                                            <td style={{ padding: '11px 14px', color: '#010b1c' }}>{r.subject || '—'}</td>
                                            <td style={{ padding: '11px 14px', color: theme.textMuted }}>{r.faculty || '—'}</td>
                                            <td style={{ padding: '11px 14px', color: theme.success, fontWeight: 700 }}>{r.summary?.present ?? '—'}</td>
                                            <td style={{ padding: '11px 14px', color: theme.danger,  fontWeight: 700 }}>{r.summary?.absent  ?? '—'}</td>
                                            <td style={{ padding: '11px 14px', fontFamily: theme.fontMono }}>
                                                {r.summary ? pct(r.summary.present, r.summary.totalStudents) + '%' : '—'}
                                            </td>
                  s                          <td style={{ padding: '11px 14px' }}>
                                                <span style={styles.badge(r.status === 'finalized' ? 'success' : 'warning')}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 14px', color: theme.accent, fontSize: '12px' }}>View</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ════ DETAIL TAB ════ */}
            {tab === 'detail' && (
                <div>
                    {detailLoading && <div style={{ textAlign: 'center', padding: 48, color: theme.textMuted }}>Loading...</div>}
                    {detailReport && !detailLoading && (
                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            <div style={{ ...styles.card, marginBottom: 16 }}>
                                {/* Live session banner */}
                            {detailReport.status === 'live' && (
                                <div style={{
                                    padding: '12px 16px', borderRadius: 8, marginBottom: 16,
                                    background: theme.accentDim, border: `1px solid ${theme.accent}`,
                                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                                }}>
                                    <span style={{
                                        width: 10, height: 10, borderRadius: '50%',
                                        background: theme.accent, display: 'inline-block',
                                        animation: 'spin 1.5s linear infinite',
                                    }} />
                                    <span style={{ color: theme.accent, fontWeight: 700, fontSize: '13px' }}>
                                        Live Session — {detailReport.slotResults?.length || 0} run(s) completed
                                    </span>
                                    <span style={{ fontSize: '12px', color: theme.textMuted }}>
                                        Auto-updating every 10 seconds
                                    </span>
                                    <button
                                        onClick={() => stopSession(detailReport._id)}
                                        style={{ ...styles.btnDanger, padding: '6px 14px', fontSize: '12px', marginLeft: 'auto' }}
                                    >
                                        Stop Session
                                    </button>
                                </div>
                            )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <div style={{ fontFamily: theme.fontMono, fontSize: '18px', fontWeight: 700, marginBottom: 6 }}>
                                            {detailReport.batch}
                                        </div>
                                        <div style={{ display: 'flex', gap: 20, fontSize: '13px', color: theme.textMuted, flexWrap: 'wrap' }}>
                                            {[
                                                ['Date',    detailReport.date],
                                                ['Slot',    SLOT_LABELS[detailReport.timeSlot] || detailReport.timeSlot || '—'],
                                                ['Subject', detailReport.subject  || '—'],
                                                ['Faculty', detailReport.faculty  || '—'],
                                                ['Room',    detailReport.room     || '—'],
                                                ['Sem',     detailReport.semester || '—'],
                                            ].map(([k, v]) => (
                                                <span key={k}>
                                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}: </span>
                                                    <span style={{ color: theme.text, fontWeight: 600 }}>{v}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={styles.badge(detailReport.status === 'finalized' ? 'success' : 'warning')}>
                                            {detailReport.status}
                                        </span>
                                        {detailReport.status !== 'finalized' && (
                                            <>
                                                <button onClick={() => finalizeReport(detailReport._id)}
                                                    style={{ ...styles.btnPrimary, padding: '8px 18px', fontSize: '13px' }}>
                                                    Finalize
                                                </button>
                                                <button onClick={() => deleteReport(detailReport._id)}
                                                    style={{ ...styles.btnDanger, padding: '8px 18px' }}>
                                                    Delete Draft
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <StatBar stats={[
                                { label: 'Total',   val: detailReport.summary?.totalStudents ?? 0, color: theme.text    },
                                { label: 'Present', val: detailReport.summary?.present       ?? 0, color: theme.success },
                                { label: 'Absent',  val: detailReport.summary?.absent        ?? 0, color: theme.danger  },
                                { label: 'Att. %',  val: (detailReport.summary?.attendancePct ?? 0) + '%', color: theme.accent },
                            ]} theme={theme} styles={styles} />

                            {detailReport.slotResults?.length > 0 ? (
                                <MultiRunTable
                                    report={detailReport}
                                    readOnly={detailReport.status === 'finalized'}
                                    onOverride={(rollNo, status) => overrideStatus(detailReport._id, rollNo, status)}
                                    theme={theme} styles={styles}
                                />
                            ) : (
                                <AttendanceTable
                                    rows={detailReport.finalReport || []}
                                    readOnly={detailReport.status === 'finalized'}
                                    onOverride={(rollNo, status) => overrideStatus(detailReport._id, rollNo, status)}
                                    theme={theme} styles={styles}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MultiRunTable({ report, readOnly, onOverride, theme, styles }) {
    const runs = report.slotResults || [];
    const finalLookup = {};
    for (const s of (report.finalReport || [])) {
        finalLookup[s.rollNo] = s;
    }

    // Collect all roll numbers across all runs + finalReport
    const allRollNos = [...new Set([
        ...runs.flatMap(r => r.students.map(s => s.rollNo)),
        ...Object.keys(finalLookup),
    ])].sort();

    // Build lookup: rollNo → runIndex → student record
    const runLookup = {};
    for (const rollNo of allRollNos) {
        runLookup[rollNo] = {};
        for (let ri = 0; ri < runs.length; ri++) {
            runLookup[rollNo][ri] = runs[ri].students.find(s => s.rollNo === rollNo) || null;
        }
    }

    const cellStyle = (status) => ({
        padding: '2px 6px', borderRadius: 4, fontSize: '11px', fontWeight: 600,
        background: status === 'present' ? theme.successDim
                  : status === 'review'  ? theme.warningDim
                  : status === 'absent'  ? theme.dangerDim
                  : theme.accentDim,
        color:      status === 'present' ? theme.success
                  : status === 'review'  ? theme.warning
                  : status === 'absent'  ? theme.danger
                  : theme.accent,
    });

    return (
        <div style={{ ...styles.card, padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: 600 }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}`, background: theme.bg }}>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>#</th>
                        <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Roll No</th>
                        {runs.map((r, i) => (
                            <th key={i} style={{ padding: '10px 12px', textAlign: 'center', fontSize: '10px', color: theme.accent, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderLeft: `1px solid ${theme.border}` }}>
                                Run {i + 1}
                                <div style={{ fontSize: '9px', color: theme.textMuted, fontWeight: 400, marginTop: 2 }}>
                                    {r.processedAt ? new Date(r.processedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </div>
                                <div style={{ fontSize: '9px', color: theme.textMuted, fontWeight: 400 }}>
                                    P:{r.summary?.present ?? 0} A:{r.summary?.absent ?? 0} R:{r.summary?.review ?? 0}
                                </div>
                            </th>
                        ))}
                        <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap', borderLeft: `2px solid ${theme.border}` }}>Final</th>
                        {!readOnly && <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>Override</th>}
                    </tr>
                </thead>
                <tbody>
                    {allRollNos.map((rollNo, idx) => {
                        const final = finalLookup[rollNo];
                        return (
                            <tr key={rollNo} style={{
                                borderBottom: `1px solid ${theme.border}`,
                                background: final?.finalStatus === 'R' ? theme.warningDim : 'transparent',
                            }}>
                                <td style={{ padding: '9px 12px', color: theme.textMuted }}>{idx + 1}</td>
                                <td style={{ padding: '9px 12px', fontFamily: theme.fontMono, fontWeight: 600, color: theme.text }}>{rollNo}</td>
                                {runs.map((_, ri) => {
                                    const s = runLookup[rollNo][ri];
                                    return (
                                        <td key={ri} style={{ padding: '9px 12px', textAlign: 'center', borderLeft: `1px solid ${theme.border}` }}>
                                            {s ? (
                                                <span style={cellStyle(s.status)}>
                                                    {s.status === 'present' ? '✓' : s.status === 'review' ? '?' : s.status === 'absent' ? '✗' : '—'}
                                                    {s.avgConfidence > 0 && (
                                                        <span style={{ marginLeft: 4, fontWeight: 400 }}>
                                                            {(s.avgConfidence * 100).toFixed(0)}%
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span style={{ color: theme.textMuted, fontSize: '11px' }}>—</span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td style={{ padding: '9px 12px', textAlign: 'center', borderLeft: `2px solid ${theme.border}` }}>
                                    {final ? (
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, fontFamily: theme.fontMono,
                                            background: final.finalStatus === 'P' ? theme.successDim : final.finalStatus === 'R' ? theme.warningDim : theme.dangerDim,
                                            color:      final.finalStatus === 'P' ? theme.success    : final.finalStatus === 'R' ? theme.warning    : theme.danger,
                                        }}>
                                            {final.finalStatus}
                                        </span>
                                    ) : <span style={{ color: theme.textMuted }}>—</span>}
                                </td>
                                {!readOnly && (
                                    <td style={{ padding: '9px 12px' }}>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {['P', 'A', 'R'].map(st => (
                                                <button key={st} onClick={() => onOverride(rollNo, st)}
                                                    disabled={final?.finalStatus === st}
                                                    style={{
                                                        padding: '2px 8px', borderRadius: 4, fontSize: '10px',
                                                        fontWeight: 700, cursor: 'pointer', border: 'none',
                                                        fontFamily: theme.fontMono,
                                                        opacity: final?.finalStatus === st ? 0.3 : 1,
                                                        background: st === 'P' ? theme.successDim : st === 'R' ? theme.warningDim : theme.dangerDim,
                                                        color:      st === 'P' ? theme.success    : st === 'R' ? theme.warning    : theme.danger,
                                                    }}>
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function StatBar({ stats, theme, styles }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length},1fr)`, gap: 12, marginBottom: 16 }}>
            {stats.map(s => (
                <div key={s.label} style={{ ...styles.card, textAlign: 'center', padding: '18px 12px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, fontFamily: theme.fontMono }}>{s.val}</div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                </div>
            ))}
        </div>
    );
}

function AttendanceTable({ rows, readOnly, onOverride, theme, styles }) {
    return (
        <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                        {['#', 'Roll No', 'In List', 'ML Status', 'Confidence', 'Zone', 'First Seen', 'Final',
                          !readOnly && 'Override'].filter(Boolean).map(h => (
                            <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px',
                                color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((s, i) => (
                        <tr key={s.rollNo} style={{
                            borderBottom: `1px solid ${theme.border}`,
                            background: s.flagged
                                ? 'rgba(251,191,36,0.07)'
                                : s.finalStatus === 'R'
                                    ? theme.warningDim
                                    : 'transparent',
                        }}>
                            <td style={{ padding: '10px 14px', color: theme.textMuted }}>{i + 1}</td>
                            <td style={{ padding: '10px 14px', fontFamily: theme.fontMono, fontWeight: 600, color: theme.text }}>{s.rollNo}</td>

                            {/* ── In List column ── */}
                            <td style={{ padding: '10px 14px' }}>
                                {s.flagged === true ? (
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                                        background: 'rgba(251,191,36,0.15)', color: theme.warning,
                                    }}>
                                        🚩 Flagged
                                    </span>
                                ) : s.inList === true ? (
                                    <span style={{ fontSize: '12.5px', color: theme.success }}>✓</span>
                                ) : s.inList === false ? (
                                    <span style={{ fontSize: '11px', color: theme.textMuted }}>—</span>
                                ) : (
                                    <span style={{ fontSize: '11px', color: theme.textMuted }}>—</span>
                                )}
                            </td>

                            <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                    background: s.status === 'present'  ? theme.successDim
                                              : s.status === 'review'   ? theme.warningDim
                                              : s.status === 'no_photo' ? theme.accentDim
                                              : theme.dangerDim,
                                    color:      s.status === 'present'  ? theme.success
                                              : s.status === 'review'   ? theme.warning
                                              : s.status === 'no_photo' ? theme.accent
                                              : theme.danger }}>
                                    {s.status === 'no_photo' ? 'no photo' : (s.status || '—')}
                                </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                                {s.avgConfidence > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 70, height: 5, borderRadius: '3px', background: theme.border, overflow: 'hidden' }}>
                                            <div style={{ width: `${s.avgConfidence * 100}%`, height: '100%',
                                                background: s.avgConfidence >= 0.65 ? theme.success : s.avgConfidence >= 0.45 ? theme.warning : theme.danger }} />
                                        </div>
                                        <span style={{ fontFamily: theme.fontMono, fontSize: '12px', color: theme.textMuted }}>
                                            {(s.avgConfidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ) : <span style={{ color: theme.textMuted }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600,
                                color: s.confidenceZone === 'high' ? theme.success : s.confidenceZone === 'medium' ? theme.warning : theme.textMuted }}>
                                {s.confidenceZone || '—'}
                            </td>
                            <td style={{ padding: '10px 14px', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '12px' }}>
                                {s.firstSeenSec != null ? `${Math.floor(s.firstSeenSec / 60)}m ${Math.round(s.firstSeenSec % 60)}s` : '—'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '3.5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                                    fontFamily: theme.fontMono,
                                    background: s.finalStatus === 'P' ? theme.successDim : s.finalStatus === 'R' ? theme.warningDim : theme.dangerDim,
                                    color:      s.finalStatus === 'P' ? theme.success    : s.finalStatus === 'R' ? theme.warning    : theme.danger }}>
                                    {s.finalStatus}
                                </span>
                            </td>
                            {!readOnly && (
                                <td style={{ padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {['P', 'A', 'R'].map(st => (
                                            <button key={st} onClick={() => onOverride(s.rollNo, st)}
                                                disabled={s.finalStatus === st}
                                                style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px',
                                                    fontWeight: 700, cursor: 'pointer', border: 'none',
                                                    fontFamily: theme.fontMono, opacity: s.finalStatus === st ? 0.3 : 1,
                                                    background: st === 'P' ? theme.successDim : st === 'R' ? theme.warningDim : theme.dangerDim,
                                                    color:      st === 'P' ? theme.success    : st === 'R' ? theme.warning    : theme.danger }}>
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}