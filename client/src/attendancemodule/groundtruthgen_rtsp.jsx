// client/src/attendancemodule/groundtruthgen_rtsp.jsx
// Live RTSP stream ground truth acquisition — select camera, start/stop,
// auto-stops when every detected person has reached the target image count.

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE, DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';

// ─── Add your cameras here ────────────────────────────────────────────────────
const CAMERAS = [
    { id: 'cam_main',    label: 'Main Hall — Front', url: 'rtsp://127.0.0.1:8554/live' },
    { id: 'cam_side',    label: 'Main Hall — Side',  url: 'rtsp://192.168.1.101:554/stream1' },
    { id: 'cam_lab1',    label: 'Lab 1',             url: 'rtsp://192.168.1.102:554/stream1' },
    { id: 'cam_lab2',    label: 'Lab 2',             url: 'rtsp://192.168.1.103:554/stream1' },
    { id: 'cam_seminar', label: 'Seminar Hall',      url: 'rtsp://192.168.1.104:554/stream1' },
];

const TARGET_OPTIONS = [
    { value: 5,  hint: 'Minimal storage — embedding uses all 5' },
    { value: 8,  hint: '5 embed + 3 backup' },
    { value: 10, hint: '5 embed + 5 backup (recommended)' },
    { value: 15, hint: '5 embed + 10 backup for diversity' },
];

const FRAME_SKIP_OPTIONS = [
    { value: 5,   hint: 'Dense sampling — best for short sessions' },
    { value: 10,  hint: 'Balanced — recommended for live streams' },
    { value: 20,  hint: 'Fast, lighter on CPU' },
    { value: 300, hint: 'Minimal CPU usage' },
];

const DET_SIZE_OPTIONS = [
    { value: 320, label: 'Fast (320)',     hint: '~4× faster, good for clear footage' },
    { value: 640, label: 'Accurate (640)', hint: 'Better for small/distant faces' },
];

// ─── tiny status dot ─────────────────────────────────────────────────────────
const Dot = ({ color, pulse = false }) => (
    <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
        background: color, flexShrink: 0,
        animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
);

// ─── person progress card ─────────────────────────────────────────────────────
const PersonCard = ({ id, count, target }) => {
    const pct  = Math.min((count / target) * 100, 100);
    const done = count >= target;
    return (
        <div style={{
            background: done ? theme.successDim : theme.bg,
            border: `1px solid ${done ? theme.success : theme.border}`,
            borderRadius: 8, padding: '10px 14px', minWidth: 130,
        }}>
            <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 4 }}>{id}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: done ? theme.success : theme.accent, lineHeight: 1 }}>
                {count}<span style={{ fontSize: '12px', fontWeight: 400, color: theme.textMuted }}>/{target}</span>
            </div>
            <div style={{ marginTop: 6, height: 4, background: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: 2,
                    background: done ? theme.success : theme.accent,
                    transition: 'width 0.4s ease',
                }} />
            </div>
            {done && <div style={{ fontSize: '10px', color: theme.success, marginTop: 4, fontWeight: 600 }}>✓ Done</div>}
        </div>
    );
};

// ─── Live Preview Component ───────────────────────────────────────────────────
// FIX: Use a single persistent <img> pointed at the MJPEG endpoint instead of
// re-requesting with ?t=timestamp every second.  The MJPEG endpoint is a
// multipart/x-mixed-replace stream — the browser updates the frame automatically
// from a single long-lived connection.  Re-mounting with a new timestamp every
// second caused a flood of parallel HTTP connections that exhausted the backend.
const LivePreview = ({ apiBase, isRunning }) => {
    const [showPreview, setShowPreview] = useState(true);
    // Key changes only when the stream starts so the <img> gets a fresh
    // connection exactly once per acquisition session.
    const [sessionKey, setSessionKey] = useState(0);
    const prevRunning = useRef(false);

    useEffect(() => {
        if (isRunning && !prevRunning.current) {
            setSessionKey(k => k + 1);   // remount img → new MJPEG connection
        }
        prevRunning.current = isRunning;
    }, [isRunning]);

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 8,
            }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: theme.accent }}>
                    📹 Live Preview
                    <span style={{ fontSize: '10px', color: theme.textMuted, marginLeft: 8, fontWeight: 400 }}>
                        colored boxes = zoom regions being scanned
                    </span>
                </div>
                <button
                    onClick={() => setShowPreview(p => !p)}
                    style={{
                        fontSize: '11px', padding: '3px 10px',
                        background: 'transparent', border: `1px solid ${theme.border}`,
                        color: theme.textMuted, borderRadius: 4, cursor: 'pointer',
                    }}
                >
                    {showPreview ? 'Hide' : 'Show'}
                </button>
            </div>
            {showPreview && (
                <div style={{
                    position: 'relative', borderRadius: 8,
                    overflow: 'hidden', border: `1px solid ${theme.accent}`,
                    background: '#000',
                }}>
                    {isRunning ? (
                        // One persistent MJPEG connection per session.
                        // sessionKey forces remount only when acquisition starts.
                        <img
                            key={sessionKey}
                            src={`${apiBase}/rtsp-preview`}
                            alt="Live RTSP Preview"
                            style={{ width: '100%', display: 'block' }}
                            onError={(e) => { e.target.style.opacity = '0.3'; }}
                        />
                    ) : (
                        <div style={{
                            width: '100%', aspectRatio: '16/9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#555', fontSize: '13px',
                        }}>
                            Preview available once acquisition starts
                        </div>
                    )}
                    {/* Zoom legend */}
                    <div style={{
                        position: 'absolute', bottom: 8, right: 8,
                        display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                        {[
                            { color: '#00ff00', label: 'Full frame' },
                            { color: '#0000ff', label: 'Left 2×' },
                            { color: '#ff0000', label: 'Right 2×' },
                            { color: '#ffff00', label: 'Center 2×' },
                            { color: '#00ffff', label: 'Top-left 3×' },
                            { color: '#ff00ff', label: 'Top-right 3×' },
                            { color: '#ff8000', label: 'Top-center 3×' },
                        ].map((z, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'rgba(0,0,0,0.7)',
                                padding: '2px 6px', borderRadius: 3,
                            }}>
                                <div style={{
                                    width: 10, height: 10, borderRadius: 2,
                                    background: z.color, flexShrink: 0,
                                }} />
                                <span style={{ fontSize: '9px', color: '#fff' }}>{z.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── SSE line parser ──────────────────────────────────────────────────────────
// FIX: the original split('\n\n') + find('data: ') approach drops events when
// a TCP chunk boundary falls inside a multi-line SSE event.  This function
// processes a running buffer and returns { events, remaining } so no bytes
// are ever lost between reads.
function extractSSEEvents(buffer) {
    const events = [];
    // SSE events are delimited by double-newline
    const parts = buffer.split('\n\n');
    // Last part is incomplete — keep it in the buffer
    const remaining = parts.pop();

    for (const part of parts) {
        // An SSE event block may have multiple lines; find the data line
        const dataLine = part.split('\n').find(l => l.startsWith('data: '));
        if (!dataLine) continue;
        const jsonStr = dataLine.slice(6).trim();
        if (!jsonStr) continue;
        try {
            events.push(JSON.parse(jsonStr));
        } catch {
            // malformed JSON — skip
        }
    }

    return { events, remaining };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GroundTruthRTSP() {
    const [degree,     setDegree]     = useState('BTECH');
    const [department, setDepartment] = useState('');
    const { departments, deptLoading, deptError } = useDepartments();
    const [year,       setYear]       = useState('');
    const [cameraId,   setCameraId]   = useState(CAMERAS[0].id);

    const [detSize,    setDetSize]    = useState(320);
    const [frameSkip,  setFrameSkip]  = useState(10);
    const [targetImgs, setTargetImgs] = useState(10);
    const [minSamples, setMinSamples] = useState(3);
    const [clusterThr, setClusterThr] = useState(0.45);

    const [status,  setStatus]  = useState('idle');  // idle | running | stopping | done | error
    const [log,     setLog]     = useState([]);
    const [persons, setPersons] = useState({});       // { person_001: { count, done } }
    const [summary, setSummary] = useState(null);
    const [toast,   setToast]   = useState(null);

    const logRef    = useRef(null);
    const abortRef  = useRef(null);   // AbortController for the fetch

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const selectedCamera = CAMERAS.find(c => c.id === cameraId);

    // ── helpers ───────────────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const addLog = useCallback((msg, color = '#ccc') => {
        const time = new Date().toLocaleTimeString();
        setLog(prev => [...prev, { time, msg, color }].slice(-60));
        setTimeout(() => {
            if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 40);
    }, []);

    // ── start acquisition ─────────────────────────────────────────────────────
    const handleStart = useCallback(async () => {
        if (!batchName) { showToast('Fill in Degree, Department and Year', 'error'); return; }

        setStatus('running');
        setLog([]);
        setPersons({});
        setSummary(null);

        const controller = new AbortController();
        abortRef.current = controller;

        addLog(`▶ Connecting to ${selectedCamera.label}…`, theme.accent);

        try {
            const response = await fetch(`${API_BASE}/extract-rtsp-stream`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                signal:  controller.signal,
                body: JSON.stringify({
                    rtspUrl:             selectedCamera.url,
                    batch:               batchName,
                    detSize,
                    frameSkip,
                    targetImgsPerPerson: targetImgs,
                    minSamples,
                    clusterThreshold:    clusterThr,
                }),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`Server error ${response.status}${text ? ': ' + text : ''}`);
            }

            const reader  = response.body.getReader();
            const decoder = new TextDecoder();
            let   buffer  = '';

            // FIX: Use extractSSEEvents() so no events are lost at TCP chunk
            // boundaries.  The original code called split('\n\n') on each
            // decoded chunk independently, which silently dropped events
            // whenever a double-newline was split across two read() calls.
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const { events, remaining } = extractSSEEvents(buffer);
                buffer = remaining;

                for (const ev of events) {
                    switch (ev.type) {

                        case 'stage':
                            addLog(`▶ ${ev.message}`, theme.accent);
                            break;

                        case 'frame':
                            if (ev.faces_this_frame > 0)
                                addLog(`🎞 Frame ${ev.frame} — ${ev.faces_this_frame} face(s) detected`, '#aaa');
                            break;

                        // FIX: person_update arrives for EACH incremental cluster
                        // pass.  We must merge — not replace — person state so
                        // persons detected in earlier passes are not wiped out
                        // when a later pass only updates a subset.
                        case 'person_update':
                            setPersons(prev => ({
                                ...prev,
                                [ev.person_id]: { count: ev.count, done: ev.done },
                            }));
                            if (ev.done)
                                addLog(`✅ ${ev.person_id} reached ${ev.count} images`, theme.success);
                            break;

                        case 'progress':
                            addLog(`📊 ${ev.message}`, '#aaa');
                            break;

                        case 'done':
                            setStatus('done');
                            setSummary({
                                peopleDetected: ev.people_detected,
                                imagesSaved:    ev.images_saved,
                                batchDir:       ev.batch_dir,
                                elapsedSec:     ev.elapsed_sec,
                                framesRead:     ev.frames_read,
                            });
                            addLog(`✅ ${ev.message}`, theme.success);
                            showToast(`${ev.people_detected} people — ${ev.images_saved} images saved`);
                            break;

                        case 'error':
                            // FIX: Don't set status to 'error' on a single backend
                            // error event — the stream may recover.  Only mark
                            // error when the stream itself closes after an error.
                            addLog(`❌ ${ev.message}`, theme.danger);
                            showToast(ev.message, 'error');
                            // If the backend sends a fatal error it will also
                            // close the SSE stream, which ends the read() loop.
                            break;

                        default:
                            break;
                    }
                }
            }

            // Stream closed cleanly by backend (done event already handled above)
            if (abortRef.current && !controller.signal.aborted) {
                // If we somehow exit without a 'done' event, mark done anyway
                setStatus(s => s === 'running' ? 'done' : s);
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                addLog('⏹ Stream stopped by user', theme.textMuted);
                setStatus('done');
            } else {
                addLog(`❌ ${err.message}`, theme.danger);
                showToast('Acquisition failed: ' + err.message, 'error');
                setStatus('error');
            }
        }
    }, [batchName, selectedCamera, detSize, frameSkip, targetImgs, minSamples, clusterThr, addLog]);

    // ── stop acquisition ──────────────────────────────────────────────────────
    const handleStop = useCallback(async () => {
        setStatus('stopping');
        addLog('⏹ Sending stop signal — waiting for final save…', theme.textMuted);
        try {
            await fetch(`${API_BASE}/stop-rtsp-stream`, { method: 'POST' });
        } catch { /* backend may not respond if already stopped */ }
        // Do NOT abort the SSE fetch here. The backend runs a final clustering+save
        // pass after receiving the stop signal and then yields a 'done' event.
        // Aborting the fetch causes GeneratorExit in the Python generator which
        // kills the save pass before any photos are written to disk.
        // The SSE stream will close naturally once the backend sends 'done'.
    }, [addLog]);

    const isRunning  = status === 'running';
    const isStopping = status === 'stopping';
    const isDone     = status === 'done';
    const isError    = status === 'error';
    const isIdle     = status === 'idle';

    const totalPersons = Object.keys(persons).length;
    const donePersons  = Object.values(persons).filter(p => p.done).length;
    const allDone      = totalPersons > 0 && donePersons === totalPersons;

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            <style>{cssReset}
                {`@keyframes spin  { to { transform: rotate(360deg); } }
                  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}
            </style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 999,
                    padding: '12px 24px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 600,
                    background: toast.type === 'error' ? theme.dangerDim : theme.successDim,
                    color:      toast.type === 'error' ? theme.danger    : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Live RTSP Ground Truth</div>
                <div style={styles.subheading}>
                    Acquire face images from a live RTSP camera stream →
                    auto-stops when every detected person reaches the target image count
                </div>
            </div>

            {/* ── Config card ── */}
            <div style={{
                ...styles.card, marginBottom: 24,
                opacity: (isRunning || isStopping) ? 0.6 : 1,
                pointerEvents: (isRunning || isStopping) ? 'none' : 'auto',
            }}>
                {/* Row 1: batch fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select} disabled={deptLoading}>
                            <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select…'}</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {deptError && <div style={{ fontSize: '11px', color: theme.danger, marginTop: 4 }}>{deptError}</div>}
                    </div>
                    <div>
                        <label style={styles.label}>Year (Batch)</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {/* Camera selector */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Camera</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {CAMERAS.map(cam => (
                            <button key={cam.id} onClick={() => setCameraId(cam.id)} title={cam.url} style={{
                                padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, border: '1px solid',
                                borderColor: cameraId === cam.id ? theme.accent : theme.border,
                                background:  cameraId === cam.id ? (theme.accentDim || theme.accent + '22') : 'transparent',
                                color:       cameraId === cam.id ? theme.accent : theme.textMuted,
                                transition: 'all 0.15s',
                            }}>
                                {cam.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 5, fontFamily: theme.fontMono }}>
                        {selectedCamera?.url}
                    </div>
                </div>

                {/* Target images per person */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>
                        Target Images per Person
                        <span style={{ marginLeft: 6, fontSize: '11px', color: theme.textMuted, fontWeight: 400 }}>
                            — stream stops when ALL detected persons reach this count
                        </span>
                    </label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {TARGET_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => setTargetImgs(opt.value)} title={opt.hint} style={{
                                padding: '7px 18px', borderRadius: 6, cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, border: '1px solid',
                                borderColor: targetImgs === opt.value ? theme.accent : theme.border,
                                background:  targetImgs === opt.value ? (theme.accentDim || theme.accent + '22') : 'transparent',
                                color:       targetImgs === opt.value ? theme.accent : theme.textMuted,
                                transition: 'all 0.15s',
                            }}>
                                {opt.value} imgs
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 5 }}>
                        {TARGET_OPTIONS.find(o => o.value === targetImgs)?.hint}
                    </div>
                </div>

                {/* Detection quality */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Detection Quality</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {DET_SIZE_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => setDetSize(opt.value)} title={opt.hint} style={{
                                padding: '7px 18px', borderRadius: 6, cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, border: '1px solid',
                                borderColor: detSize === opt.value ? theme.accent : theme.border,
                                background:  detSize === opt.value ? (theme.accentDim || theme.accent + '22') : 'transparent',
                                color:       detSize === opt.value ? theme.accent : theme.textMuted,
                                transition: 'all 0.15s',
                            }}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Frame skip */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Frame Skip</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {FRAME_SKIP_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => setFrameSkip(opt.value)} title={opt.hint} style={{
                                padding: '7px 18px', borderRadius: 6, cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, border: '1px solid',
                                borderColor: frameSkip === opt.value ? theme.accent : theme.border,
                                background:  frameSkip === opt.value ? (theme.accentDim || theme.accent + '22') : 'transparent',
                                color:       frameSkip === opt.value ? theme.accent : theme.textMuted,
                                transition: 'all 0.15s',
                            }}>
                                Every {opt.value}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Folder preview */}
                <div style={{
                    padding: '10px 16px', background: theme.bg, borderRadius: '6px',
                    fontSize: '13px', fontFamily: theme.fontMono,
                }}>
                    <span style={{ color: theme.textMuted }}>Folder: </span>
                    <span style={{ color: batchName ? theme.accent : theme.textMuted, fontWeight: 600 }}>
                        ground_truth/{batchName || '…'}/person_001/ … person_NNN/
                    </span>
                </div>
            </div>

            {/* Live Preview */}
            <LivePreview apiBase={API_BASE} isRunning={isRunning} />

            {/* ── Action buttons ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button
                    onClick={handleStart}
                    disabled={isRunning || isStopping || !batchName}
                    style={{
                        ...styles.btnPrimary,
                        opacity: (isRunning || isStopping || !batchName) ? 0.5 : 1,
                        minWidth: 200,
                    }}
                >
                    {isRunning ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            <span style={{
                                width: 14, height: 14,
                                border: '2px solid rgba(0,0,0,0.3)',
                                borderTopColor: theme.accentText || '#fff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                display: 'inline-block',
                            }} />
                            Acquiring…
                        </span>
                    ) : '📡 Start Acquisition'}
                </button>

                <button
                    onClick={handleStop}
                    disabled={!isRunning}
                    style={{
                        padding: '10px 24px', borderRadius: 8, cursor: isRunning ? 'pointer' : 'default',
                        fontSize: '14px', fontWeight: 700, border: `1px solid ${theme.danger}`,
                        background: isRunning ? theme.dangerDim : 'transparent',
                        color: isRunning ? theme.danger : theme.border,
                        transition: 'all 0.15s', opacity: isRunning ? 1 : 0.4,
                    }}
                >
                    {isStopping ? '⏳ Stopping…' : '⏹ Stop'}
                </button>
            </div>

            {/* ── Live status panel ── */}
            {(isRunning || isStopping || isDone || isError) && (
                <div style={{
                    ...styles.card, marginBottom: 20,
                    borderColor: isRunning ? theme.accent : isDone ? theme.success : theme.danger,
                }}>
                    {/* Status bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <Dot
                            color={isRunning ? theme.accent : isDone ? theme.success : theme.danger}
                            pulse={isRunning || isStopping}
                        />
                        <span style={{
                            fontWeight: 700, fontSize: '14px',
                            color: isRunning ? theme.accent : isDone ? theme.success : theme.danger,
                        }}>
                            {isRunning  && `Acquiring from ${selectedCamera?.label}…`}
                            {isStopping && 'Stopping stream…'}
                            {isDone     && 'Acquisition complete'}
                            {isError    && 'Acquisition failed'}
                        </span>

                        {totalPersons > 0 && (
                            <span style={{
                                marginLeft: 'auto', fontSize: '12px', fontWeight: 700,
                                padding: '3px 10px', borderRadius: 20,
                                background: allDone ? theme.successDim : theme.bg,
                                color:      allDone ? theme.success    : theme.textMuted,
                                border: `1px solid ${allDone ? theme.success : theme.border}`,
                            }}>
                                {donePersons}/{totalPersons} persons done
                            </span>
                        )}
                    </div>

                    {/* Per-person cards */}
                    {totalPersons > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                            {Object.entries(persons)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([id, { count }]) => (
                                    <PersonCard key={id} id={id} count={count} target={targetImgs} />
                                ))}
                        </div>
                    )}

                    {/* Live log */}
                    <div ref={logRef} style={{
                        maxHeight: 200, overflowY: 'auto',
                        background: '#000', borderRadius: 6,
                        padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '12px',
                    }}>
                        {log.length === 0 && (
                            <span style={{ color: '#555' }}>Waiting for frames…</span>
                        )}
                        {log.map((entry, i) => (
                            <div key={i} style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
                                <span style={{ color: '#555', flexShrink: 0 }}>{entry.time}</span>
                                <span style={{ color: entry.color || '#ccc' }}>{entry.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Summary card ── */}
            {isDone && summary && (
                <div style={{ ...styles.card, borderColor: theme.success, background: theme.successDim, marginBottom: 20 }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: theme.success, marginBottom: 12 }}>
                        ✅ Acquisition Complete
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                        {[
                            { label: 'People Detected', value: summary.peopleDetected },
                            { label: 'Images Saved',    value: summary.imagesSaved    },
                            { label: 'Frames Read',     value: summary.framesRead     },
                            { label: 'Time Taken',      value: `${summary.elapsedSec}s` },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: '#fff', borderRadius: 8,
                                padding: '12px 16px', textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: theme.accent }}>{s.value}</div>
                                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 4 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{
                        padding: '10px 14px', background: theme.bg, borderRadius: 6,
                        fontFamily: theme.fontMono, fontSize: '12px', color: theme.textMuted,
                    }}>
                        Saved to: <span style={{ color: theme.accent }}>{summary.batchDir}</span>
                    </div>
                    <div style={{ marginTop: 12, fontSize: '13px', color: theme.textMuted }}>
                        Folders named <strong style={{ color: theme.text }}>person_001</strong>,&nbsp;
                        <strong style={{ color: theme.text }}>person_002</strong>, … — go to&nbsp;
                        <strong style={{ color: theme.accent }}>Edit Ground Truth</strong>&nbsp;
                        to curate images, then&nbsp;
                        <strong style={{ color: theme.accent }}>Assign Roll Numbers</strong>&nbsp;
                        to map clusters to students.
                    </div>
                    <button
                        onClick={() => { setStatus('idle'); setSummary(null); setPersons({}); setLog([]); }}
                        style={{
                            marginTop: 16, padding: '9px 22px', borderRadius: 8,
                            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                            border: `1px solid ${theme.accent}`,
                            background: theme.accentDim || theme.accent + '22',
                            color: theme.accent,
                        }}
                    >
                        ↩ Start New Session
                    </button>
                </div>
            )}

            {/* ── Empty state ── */}
            {isIdle && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                    <div style={{ fontSize: '40px', marginBottom: 12, opacity: 0.4 }}>📡</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>Ready to acquire</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>
                        Select batch + camera → set target images → click "Start Acquisition"
                        <br />
                        Stream stops automatically once every person reaches the target
                    </div>
                </div>
            )}
        </div>
    );
}