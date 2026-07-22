// client/src/attendancemodule/groundtruthgen_rtsp.jsx
// Live RTSP stream ground truth acquisition.
//
// Acquisition runs SERVER-SIDE: the browser starts a job, attaches to observe
// its live progress, and can reattach after a reload or from another login.
// A job keeps running (up to 60 min, or until Stop) even when this tab is
// switched away or closed — the server owns the lifecycle, not this page.
// See server/.../controllers/gtAcquisitionManager.js.

import { useState, useEffect, useCallback, useRef } from 'react';
import getEnvironment from '../getenvironment';
import { API_BASE, DEGREES, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import { useBatchYears } from './useBatchYears';

const _apiUrl    = getEnvironment();
const CAMERA_API = `${_apiUrl}/attendancemodule/cameras`;
const CAMERA_ROOMS_API = `${CAMERA_API}/rooms`;
const OTHER_CONTROLS_API = `${_apiUrl}/attendancemodule/settings/other-controls`;
const GT_CONFIG_API = `${_apiUrl}/api/v1/ml/gt-config`;   // ML Fine Tuning — GT Acquisition

// Current minutes-of-day (0–1439) in Asia/Kolkata, independent of the
// browser timezone — mirrors the server-side timeWindowGuard.
function nowMinIST() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(new Date());
    const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0);
    return ((h % 24) * 60 + m) % (24 * 60);
}

function timeStrToMin(hhmm, fallback) {
    if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return fallback;
    const [h, m] = hhmm.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
    return h * 60 + m;
}

// Format a duration in seconds as H:MM:SS (or M:SS under an hour).
function fmtDuration(totalSec) {
    const s = Math.max(0, Math.floor(totalSec || 0));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const p2 = n => String(n).padStart(2, '0');
    return hh > 0 ? `${hh}:${p2(mm)}:${p2(ss)}` : `${mm}:${p2(ss)}`;
}

const fetch = (input, init = {}) => window.fetch(input, {
    credentials: 'include',
    ...init,
});

const MODE_LABEL = { single: 'Single camera', combined: 'Combined (2 cameras)', room: 'Room (all cameras)' };

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
const LivePreview = ({ apiBase, isRunning, jobId }) => {
    const [showPreview, setShowPreview] = useState(true);
    const [loaded, setLoaded]           = useState(false);
    const [sessionKey, setSessionKey]   = useState(0);
    const prevKey     = useRef(null);
    const retryTimer  = useRef(null);

    // Restart the <img> whenever the active Python job changes (camera switch)
    // or acquisition (re)starts.
    useEffect(() => {
        if (isRunning && jobId && jobId !== prevKey.current) {
            setLoaded(false);
            setSessionKey(k => k + 1);
        }
        if (!isRunning) {
            setLoaded(false);
            clearTimeout(retryTimer.current);
        }
        prevKey.current = jobId;
    }, [isRunning, jobId]);

    useEffect(() => () => clearTimeout(retryTimer.current), []);

    const handleImgError = useCallback(() => {
        setLoaded(false);
        clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
            setSessionKey(k => k + 1);
        }, 3000);
    }, []);

    const handleImgLoad = useCallback(() => {
        setLoaded(true);
    }, []);

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
                    background: '#000', minHeight: 120,
                }}>
                    {(!isRunning || !loaded) && (
                        <div style={{
                            position: isRunning ? 'absolute' : 'relative',
                            inset: 0, zIndex: 2,
                            width: '100%', aspectRatio: isRunning ? undefined : '16/9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#555', fontSize: '13px',
                            background: isRunning ? 'rgba(0,0,0,0.6)' : '#000',
                        }}>
                            {isRunning ? '⏳ Connecting to stream…' : 'Preview available once acquisition starts'}
                        </div>
                    )}

                    {isRunning && jobId && (
                        <img
                            key={sessionKey}
                            src={`${apiBase}/rtsp-preview?jobId=${encodeURIComponent(jobId)}`}
                            alt="Live RTSP Preview"
                            style={{ width: '100%', display: 'block' }}
                            onLoad={handleImgLoad}
                            onError={handleImgError}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

// ─── SSE line parser ──────────────────────────────────────────────────────────
function extractSSEEvents(buffer) {
    const events = [];
    const parts = buffer.split('\n\n');
    const remaining = parts.pop();

    for (const part of parts) {
        const dataLine = part.split('\n').find(l => l.startsWith('data: '));
        if (!dataLine) continue;
        const jsonStr = dataLine.slice(6).trim();
        if (!jsonStr) continue;
        try {
            events.push(JSON.parse(jsonStr));
        } catch {
            // skip
        }
    }

    return { events, remaining };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GroundTruthRTSP({ fixedDepartment = '' }) {
    const [degree,     setDegree]     = useState('BTECH');
    const [degrees, setDegrees] = useState([]);
    const [department, setDepartment] = useState(fixedDepartment);
    const { departments, deptLoading, deptError } = useDepartments();
    const { batchYears, batchYearsLoading } = useBatchYears();
    const [year,       setYear]       = useState('');
    const [cameraId,   setCameraId]   = useState('');

    const [detSize,    setDetSize]    = useState(320);
    const [frameSkip,  setFrameSkip]  = useState(10);
    const [targetImgs, setTargetImgs] = useState(10);
    const [minSamples, setMinSamples] = useState(3);
    const [clusterThr, setClusterThr] = useState(0.45);

    // ── Attached job (the one this page is currently observing) ──────────────
    const [acquisitionId,   setAcquisitionId]   = useState(null);
    const [status,          setStatus]          = useState('idle');  // idle | running | stopping | done
    const [mode,            setMode]            = useState(null);     // single | combined | room
    const [pythonJobId,     setPythonJobId]     = useState(null);
    const [activeCameraLabel, setActiveCameraLabel] = useState('');
    const [startedAt,       setStartedAt]       = useState(null);
    const [elapsedSec,      setElapsedSec]      = useState(0);
    const [jobTarget,       setJobTarget]       = useState(targetImgs);

    const [log,           setLog]           = useState([]);
    const [persons,       setPersons]       = useState({});
    const [summary,       setSummary]       = useState(null);
    const [toast,         setToast]         = useState(null);

    // ── All active/recent jobs the user may see (for reopen + multi-user) ────
    const [activeJobs,    setActiveJobs]    = useState([]);

    // Optional 08:30–17:30 IST acquisition window (admin toggle, default off).
    const [gtWindow, setGtWindow] = useState({ enabled: false, start: '08:30', end: '17:30' });
    const [nowMin, setNowMin] = useState(nowMinIST());

    const [registeredRooms,   setRegisteredRooms]   = useState([]);
    const [registeredCameras, setRegisteredCameras] = useState([]);
    const [roomsLoading,      setRoomsLoading]      = useState(false);
    const [selectedRoom,      setSelectedRoom]      = useState('');

    const [roomCameras,   setRoomCameras]   = useState([]);
    const [roomCamsLoad,  setRoomCamsLoad]  = useState(false);

    const logRef        = useRef(null);
    const streamAbort   = useRef(null);   // AbortController for the attached SSE feed
    const attachedIdRef = useRef(null);

    const fetchDegrees = async () => {
        const url = `${_apiUrl}/attendancemodule/settings/batches/degrees`
        const res = await fetch(url, {credentials: "include"})
        const data = await res.json();
        setDegrees(data.degrees);
    }

    useEffect(() => {
        fetchDegrees();
    }, [])

    // Load the acquisition-window restriction and keep the current IST minute
    // fresh (every 30s) so the Start button enables/disables as the window
    // opens or closes without a page reload.
    useEffect(() => {
        fetch(`${OTHER_CONTROLS_API}/`)
            .then(r => r.json())
            .then(d => {
                const s = d?.settings || {};
                setGtWindow({
                    enabled: !!s.groundTruthTimeWindowEnabled,
                    start: s.windowStart || '08:30',
                    end: s.windowEnd || '17:30',
                });
            })
            .catch(() => {});
        const id = setInterval(() => setNowMin(nowMinIST()), 30000);
        return () => clearInterval(id);
    }, []);

    const windowOpen = !gtWindow.enabled || (
        nowMin >= timeStrToMin(gtWindow.start, 510) &&
        nowMin <= timeStrToMin(gtWindow.end, 1050)
    );

    useEffect(() => {
        if (fixedDepartment) setDepartment(fixedDepartment);
    }, [fixedDepartment]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const addLog = useCallback((msg, color = '#ccc') => {
        const time = new Date().toLocaleTimeString();
        setLog(prev => [...prev, { time, msg, color }].slice(-80));
        setTimeout(() => {
            if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
        }, 40);
    }, []);

    // ── Seed tuning dropdowns from the ML Fine Tuning GT config ──────────────
    // The saved gt-config values become this page's defaults; the user can
    // still override per run. If the config can't be loaded we fall back to
    // the built-in defaults above — and say so, per the fallback-visibility
    // rule.
    useEffect(() => {
        fetch(GT_CONFIG_API)
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(cfg => {
                if (cfg.det_size)               setDetSize(cfg.det_size);
                if (cfg.frame_skip)             setFrameSkip(cfg.frame_skip);
                if (cfg.target_imgs_per_person) setTargetImgs(cfg.target_imgs_per_person);
                if (cfg.min_samples)            setMinSamples(cfg.min_samples);
                if (cfg.cluster_threshold)      setClusterThr(cfg.cluster_threshold);
            })
            .catch(() => {
                setToast({ msg: 'ML Fine Tuning GT config unavailable — using built-in defaults', type: 'error' });
                setTimeout(() => setToast(null), 5000);
            });
    }, []);

    // ── LOAD ONLY ROOMS THAT HAVE CAMERAS IN THE REGISTRY ────────────
    useEffect(() => {
        const run = async () => {
            try {
                setRoomsLoading(true);
                const [roomsResponse, camerasResponse] = await Promise.all([
                    fetch(CAMERA_ROOMS_API),
                    fetch(CAMERA_API),
                ]);
                const roomData = roomsResponse.ok ? await roomsResponse.json() : { rooms: [] };
                const cameraData = camerasResponse.ok ? await camerasResponse.json() : [];
                const cameras = (Array.isArray(cameraData) ? cameraData : [])
                    .filter(camera => camera?.streamUrl)
                    .map(camera => ({
                        id: camera._id || camera.cameraId,
                        label: `${camera.cameraId} — ${camera.roomId} (${camera.position})`,
                        url: camera.streamUrl,
                    }));

                setRegisteredRooms(Array.isArray(roomData.rooms) ? roomData.rooms : []);
                setRegisteredCameras(cameras);
                setCameraId(previous => (
                    cameras.some(camera => camera.id === previous)
                        ? previous
                        : (cameras[0]?.id || '')
                ));
            } catch {
                setRegisteredRooms([]);
                setRegisteredCameras([]);
                setCameraId('');
            } finally {
                setRoomsLoading(false);
            }
        };

        run();
    }, []);

    // Fetch cameras for the strictly selected allotment string
    useEffect(() => {
        if (!selectedRoom) { setRoomCameras([]); return; }

        setRoomCamsLoad(true);
        fetch(`${CAMERA_API}?roomId=${encodeURIComponent(selectedRoom.trim().toUpperCase())}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setRoomCameras(list.map(c => ({
                    id:    c._id || c.cameraId,
                    label: `${c.roomId || selectedRoom} — ${c.position || c.cameraId}`,
                    url:   c.streamUrl,
                })).filter(c => c.url));
            })
            .catch(() => setRoomCameras([]))
            .finally(() => setRoomCamsLoad(false));
    }, [selectedRoom]);

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const selectedCamera = registeredCameras.find(c => c.id === cameraId);

    // ── Map the server's job status to this page's local status ──────────────
    const mapStatus = (s) => (s === 'running' || s === 'stopping') ? s : 'done';

    // ── Attach to a server job and stream its live events ────────────────────
    const attachToJob = useCallback(async (id) => {
        // Tear down any previous attachment.
        if (streamAbort.current) { streamAbort.current.abort(); streamAbort.current = null; }

        attachedIdRef.current = id;
        setAcquisitionId(id);

        const controller = new AbortController();
        streamAbort.current = controller;

        try {
            const res = await fetch(`${API_BASE}/gt-acquisition/stream?acquisitionId=${encodeURIComponent(id)}`, {
                signal: controller.signal,
            });
            if (!res.ok || !res.body) return;

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const { events, remaining } = extractSSEEvents(buffer);
                buffer = remaining;

                for (const ev of events) {
                    // Ignore late events from a job we've since detached from.
                    if (attachedIdRef.current !== id) continue;
                    switch (ev.type) {
                        case 'snapshot':
                            setStatus(mapStatus(ev.status));
                            setMode(ev.mode || null);
                            setPersons(ev.persons || {});
                            setStartedAt(ev.startedAt || null);
                            setJobTarget(ev.target || targetImgs);
                            setActiveCameraLabel(ev.activeCameraLabel || '');
                            setPythonJobId(ev.pythonJobId || null);
                            setSummary(ev.summary || null);
                            setLog((ev.log || []).map(l => ({ time: l.time, msg: l.msg, color: l.color })));
                            break;
                        case 'job_id':
                            if (ev.jobId) setPythonJobId(ev.jobId);
                            break;
                        case 'camera_switch':
                            setActiveCameraLabel(ev.activeCameraLabel || '');
                            addLog(`🔄 Switched to ${ev.activeCameraLabel}`, '#f0c040');
                            break;
                        case 'person_update':
                            setPersons(prev => ({
                                ...prev,
                                [ev.person_id]: { count: ev.count, done: ev.done },
                            }));
                            if (ev.done) addLog(`✅ ${ev.person_id} reached ${ev.count} images`, theme.success);
                            break;
                        case 'frame':
                            if (ev.faces_this_frame > 0)
                                addLog(`🎞 Frame ${ev.frame} — ${ev.faces_this_frame} face(s)`, '#aaa');
                            break;
                        case 'stage':
                            addLog(`▶ ${ev.message}`, theme.accent);
                            break;
                        case 'progress':
                            addLog(`📊 ${ev.message}`, '#aaa');
                            break;
                        case 'error':
                            addLog(`❌ ${ev.message}`, theme.danger);
                            break;
                        case 'gt_config_seeded':
                            // ML service filled omitted knobs from the saved
                            // GT config — surface the fallback to the user.
                            addLog(`⚙ ${ev.message}`, '#f0c040');
                            showToast(ev.message, 'success');
                            break;
                        case 'done':
                            setStatus('done');
                            setMode(null);
                            setSummary({
                                peopleDetected: ev.peopleDetected,
                                imagesSaved:    ev.imagesSaved,
                                batchDir:       ev.batchDir,
                                elapsedSec:     ev.elapsedSec,
                            });
                            addLog(`✅ ${ev.message}`, theme.success);
                            break;
                        default:
                            break;
                    }
                }
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                // Stream ended (job finished or server closed) — refresh the list.
                refreshActiveJobs();
            }
        }
    }, [addLog, targetImgs]);   // eslint-disable-line react-hooks/exhaustive-deps

    // ── Poll the active-jobs list (page reopen + multi-user visibility) ──────
    const refreshActiveJobs = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/gt-acquisition/status`);
            if (!res.ok) return;
            const data = await res.json();
            const jobs = Array.isArray(data.jobs) ? data.jobs : [];
            setActiveJobs(jobs);

            // On first load with nothing attached, auto-attach to the newest
            // running job so a reopened page immediately shows live progress.
            if (!attachedIdRef.current) {
                const running = jobs.find(j => j.status === 'running' || j.status === 'stopping');
                if (running) attachToJob(running.acquisitionId);
            }
        } catch { /* ignore */ }
    }, [attachToJob]);

    useEffect(() => {
        refreshActiveJobs();
        const id = setInterval(refreshActiveJobs, 8000);
        return () => {
            clearInterval(id);
            if (streamAbort.current) streamAbort.current.abort();
        };
    }, [refreshActiveJobs]);

    // ── Live elapsed timer for the attached job ──────────────────────────────
    useEffect(() => {
        if (!startedAt || (status !== 'running' && status !== 'stopping')) {
            if (summary?.elapsedSec != null) setElapsedSec(summary.elapsedSec);
            return;
        }
        const tick = () => setElapsedSec(Math.floor((Date.now() - startedAt) / 1000));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt, status, summary]);

    // ── Start a new server-side job ──────────────────────────────────────────
    const startJob = useCallback(async (jobMode, cameras) => {
        if (!batchName) { showToast('Fill in Degree, Department and Year', 'error'); return; }
        if (!cameras || cameras.length === 0 || !cameras.every(c => c?.url)) {
            showToast('Select a registered camera', 'error'); return;
        }

        setLog([]);
        setPersons({});
        setSummary(null);
        setStatus('running');
        setMode(jobMode);
        setJobTarget(targetImgs);

        try {
            const res = await fetch(`${API_BASE}/gt-acquisition/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: jobMode,
                    batch: batchName,
                    cameras: cameras.map(c => ({ id: c.id, label: c.label, url: c.url })),
                    detSize, frameSkip,
                    targetImgsPerPerson: targetImgs,
                    minSamples, clusterThreshold: clusterThr,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.acquisitionId) {
                setStatus('idle');
                setMode(null);
                showToast(data.error || `Failed to start (${res.status})`, 'error');
                return;
            }
            setStartedAt(Date.now());
            attachToJob(data.acquisitionId);
            refreshActiveJobs();
        } catch (err) {
            setStatus('idle');
            setMode(null);
            showToast(err.message || 'Failed to start acquisition', 'error');
        }
    }, [batchName, detSize, frameSkip, targetImgs, minSamples, clusterThr, attachToJob, refreshActiveJobs]);

    const handleStart = useCallback(() => {
        if (selectedRoom && roomCameras.length > 0) startJob('room', roomCameras);
        else startJob('single', selectedCamera ? [selectedCamera] : []);
    }, [selectedRoom, roomCameras, selectedCamera, startJob]);

    const handleStartCombined = useCallback(() => {
        startJob('combined', registeredCameras.slice(0, 2));
    }, [registeredCameras, startJob]);

    const handleStop = useCallback(async () => {
        if (!acquisitionId) return;
        setStatus('stopping');
        addLog('⏹ Sending stop signal — waiting for final save…', theme.textMuted);
        try {
            await fetch(`${API_BASE}/gt-acquisition/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acquisitionId }),
            });
        } catch { /* the stream will still report the final state */ }
        refreshActiveJobs();
    }, [acquisitionId, addLog, refreshActiveJobs]);

    const isRunning   = status === 'running';
    const isStopping  = status === 'stopping';
    const isDone      = status === 'done';
    const isIdle      = status === 'idle';
    const isBusy      = isRunning || isStopping;

    const combinedMode = mode === 'combined' && isBusy;
    const roomMode     = mode === 'room' && isBusy;

    const totalPersons       = Object.keys(persons).length;
    const donePersons        = Object.values(persons).filter(p => p.done).length;
    const allDone            = totalPersons > 0 && donePersons === totalPersons;
    const totalImagesSession = Object.values(persons).reduce((s, p) => s + (p.count || 0), 0);

    const maxDurationSec = 60 * 60;

    const otherRunningJobs = activeJobs.filter(
        j => (j.status === 'running' || j.status === 'stopping') && j.acquisitionId !== acquisitionId
    );

    return (
        <div style={styles.page}>
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Ground Truth Acquisition</div>
                <div style={styles.subheading}>
                    Acquisition runs on the server for up to 60 minutes (or until you press Stop) —
                    it keeps going even if you switch tabs or close this window. Reopen the page any
                    time to see the running time and images captured per person.
                </div>
            </div>

            {/* ── Active acquisitions (reopen + other users) ─────────────────── */}
            {activeJobs.length > 0 && (
                <div style={{ ...styles.card, marginBottom: 20 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: theme.accent, marginBottom: 10 }}>
                        🟢 Active Acquisitions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {activeJobs.map(j => {
                            const attached = j.acquisitionId === acquisitionId;
                            const live = j.status === 'running' || j.status === 'stopping';
                            return (
                                <div key={j.acquisitionId} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                                    padding: '10px 14px', borderRadius: 8,
                                    background: attached ? theme.accentDim || (theme.accent + '18') : theme.bg,
                                    border: `1px solid ${attached ? theme.accent : theme.border}`,
                                }}>
                                    <Dot color={live ? theme.success : theme.textMuted} pulse={live} />
                                    <div style={{ minWidth: 200 }}>
                                        <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>
                                            {j.batch}
                                        </div>
                                        <div style={{ fontSize: '11px', color: theme.textMuted }}>
                                            {MODE_LABEL[j.mode] || j.mode}
                                            {j.activeCameraLabel ? ` · ${j.activeCameraLabel}` : ''}
                                            {j.startedByName ? ` · ${j.startedByName}` : ''}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '12px', fontWeight: 700, fontFamily: theme.fontMono,
                                            padding: '3px 10px', borderRadius: 20,
                                            background: theme.accentDim, color: theme.accent,
                                        }}>
                                            ⏱ {fmtDuration(j.elapsedSec)}
                                        </span>
                                        <span style={{
                                            fontSize: '12px', fontWeight: 700,
                                            padding: '3px 10px', borderRadius: 20,
                                            background: theme.bg, color: theme.textMuted,
                                            border: `1px solid ${theme.border}`,
                                        }}>
                                            {j.totalImages} imgs · {j.doneCount}/{j.personCount} done
                                        </span>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 600, color:
                                                j.status === 'running' ? theme.success
                                                : j.status === 'stopping' ? '#f59e0b' : theme.textMuted,
                                        }}>
                                            {j.status}
                                        </span>
                                        {!attached && (
                                            <button
                                                onClick={() => attachToJob(j.acquisitionId)}
                                                style={{
                                                    fontSize: '12px', fontWeight: 700, padding: '5px 14px',
                                                    borderRadius: 6, cursor: 'pointer',
                                                    border: `1px solid ${theme.accent}`,
                                                    background: 'transparent', color: theme.accent,
                                                }}
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div style={{
                ...styles.card, marginBottom: 24,
                opacity: isBusy ? 0.6 : 1,
                pointerEvents: isBusy ? 'none' : 'auto',
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 16,
                    marginBottom: 20,
                }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {degrees.map(d => <option key={d._id} value={d.degreeName}>{d.degreeName}</option>)}
                        </select>
                    </div>
                    {!fixedDepartment ? (
                        <div>
                            <label style={styles.label}>Department</label>
                            <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select} disabled={deptLoading}>
                                <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select…'}</option>
                                {departments.map((d) => {
                                    const normalisedDepartment = d.replace(/_/g, " ")
                                    const selectedDegree = degrees.find(d => d.degreeName === degree);
                                    const branch = selectedDegree?.branches?.find( b => b.dept === normalisedDepartment );
                                    return (
                                        <option key={d} value={d}>
                                            {branch?.branchName || normalisedDepartment}
                                        </option>
                                    );
                                })}
                            </select>
                            {deptError && <div style={{ fontSize: '11px', color: theme.danger, marginTop: 4 }}>{deptError}</div>}
                        </div>
                    )
                    :
                    (
                      <div>
                          <label style={styles.label}>Department</label>
                          <div style={styles.select} disabled={deptLoading}>
                              <span>
                                {deptLoading ? "Loading..." : fixedDepartment?.replaceAll('_',' ')}
                              </span>
                            </div>
                            {deptError && <div style={{ fontSize: '11px', color: theme.danger, marginTop: 4 }}>{deptError}</div>}
                        </div>
                    )
                  }
                    <div>
                        <label style={styles.label}>Year (Batch)</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {batchYearsLoading
                                ? <option>Loading…</option>
                                : batchYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>
                        Room
                        <span style={{ marginLeft: 6, fontSize: '10px', color: theme.textMuted, fontWeight: 400, textTransform: 'none' }}>
                            — optional: rooms with registered cameras
                        </span>
                    </label>

                    <select
                        value={selectedRoom}
                        onChange={e => setSelectedRoom(e.target.value)}
                        style={styles.select}
                        disabled={roomsLoading || isBusy}
                    >
                        <option value="">{roomsLoading ? 'Loading registered rooms…' : '— No room (manual selection below) —'}</option>
                        {registeredRooms.map(room => (
                            <option key={room} value={room}>{room}</option>
                        ))}
                    </select>

                    {selectedRoom && (
                        <div style={{
                            marginTop: 8, padding: '8px 12px', borderRadius: 6,
                            background: roomCamsLoad ? theme.bg : roomCameras.length > 0 ? 'rgba(14,165,233,0.06)' : theme.dangerDim,
                            border: `1px solid ${roomCameras.length > 0 ? 'rgba(14,165,233,0.25)' : theme.danger}`,
                            fontSize: '12px',
                        }}>
                            {roomCamsLoad ? (
                                <span style={{ color: theme.textMuted }}>Loading cameras…</span>
                            ) : roomCameras.length > 0 ? (
                                <span style={{ color: '#0ea5e9' }}>
                                    <strong>{roomCameras.length}</strong> camera{roomCameras.length > 1 ? 's' : ''} routed — the server switches between them every 5 min
                                </span>
                            ) : (
                                <span style={{ color: theme.danger }}>No cameras registered for room "{selectedRoom}"</span>
                            )}
                        </div>
                    )}
                </div>

                {!selectedRoom && !fixedDepartment && (
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>Camera</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                        {registeredCameras.map(cam => (
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
                        {!roomsLoading && registeredCameras.length === 0 && (
                            <span style={{ color: theme.textMuted, fontSize: '12px' }}>No registered cameras found</span>
                        )}
                    </div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 5, fontFamily: theme.fontMono }}>
                        {selectedCamera?.url}
                    </div>
                </div>
                )}

                {!fixedDepartment && (
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>
                        Target Images per Person
                        <span style={{ marginLeft: 6, fontSize: '11px', color: theme.textMuted, fontWeight: 400 }}>
                            — target count shown per person; acquisition keeps collecting new people until you Stop or 60 min
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
                )}

                {!fixedDepartment && (
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
                )}

                {!fixedDepartment && (
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
                )}

                {!fixedDepartment && (
                <div style={{
                    padding: '10px 16px', background: theme.bg, borderRadius: '6px',
                    fontSize: '13px', fontFamily: theme.fontMono,
                }}>
                    <span style={{ color: theme.textMuted }}>Folder: </span>
                    <span style={{ color: batchName ? theme.accent : theme.textMuted, fontWeight: 600 }}>
                        ground_truth/{batchName || '…'}/person_001/ … person_NNN/
                    </span>
                </div>
                )}
            </div>

            <LivePreview apiBase={API_BASE} isRunning={isRunning} jobId={pythonJobId} />

            {!windowOpen && (
                <div style={{
                    marginBottom: 16,
                    padding: '10px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    background: 'rgba(239,68,68,0.10)',
                    color: theme.danger,
                    border: `1px solid rgba(239,68,68,0.30)`,
                }}>
                    ⛔ Ground Truth acquisition is restricted to {gtWindow.start}–{gtWindow.end} IST. The Start button is disabled outside this window.
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <button
                    onClick={handleStart}
                    disabled={isBusy || !batchName || !windowOpen
                        || (!selectedRoom && !selectedCamera)
                        || (selectedRoom && roomCameras.length === 0 && !roomCamsLoad)}
                    title={!windowOpen ? `Ground Truth acquisition is restricted to ${gtWindow.start}–${gtWindow.end} IST` : undefined}
                    style={{
                        ...styles.btnPrimary,
                        opacity: (isBusy || !batchName || !windowOpen) ? 0.5 : 1,
                        minWidth: 200,
                    }}
                >
                    {isBusy ? (
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
                    ) : selectedRoom && roomCameras.length > 0
                        ? `📡 Start Room Acquisition`
                        : '📡 Start Acquisition'}
                </button>

                {!selectedRoom && (
                <button
                    onClick={handleStartCombined}
                    disabled={isBusy || !batchName || !windowOpen || registeredCameras.length < 2}
                    title={!windowOpen ? `Ground Truth acquisition is restricted to ${gtWindow.start}–${gtWindow.end} IST` : undefined}
                    style={{
                        padding: '10px 24px', borderRadius: 8,
                        cursor: (isBusy || !batchName || !windowOpen || registeredCameras.length < 2) ? 'default' : 'pointer',
                        fontSize: '14px', fontWeight: 700,
                        border: 'none',
                        background: (isBusy || !batchName || !windowOpen) ? '#94a3b8' : '#0ea5e9',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
                        transition: 'all 0.15s',
                        opacity: (isBusy || !batchName || !windowOpen) ? 0.5 : 1,
                        minWidth: 200,
                    }}
                >
                    🔄 Combine First Two Cameras
                </button>
                )}

                <button
                    onClick={handleStop}
                    disabled={!isBusy}
                    style={{
                        padding: '10px 24px', borderRadius: 8,
                        cursor: isBusy ? 'pointer' : 'default',
                        fontSize: '14px', fontWeight: 700, border: 'none',
                        background: isBusy ? '#ef4444' : '#fca5a5',
                        color: '#ffffff',
                        boxShadow: isBusy ? '0 2px 8px rgba(239,68,68,0.4)' : 'none',
                        transition: 'all 0.15s',
                        opacity: isBusy ? 1 : 0.45,
                        minWidth: 120,
                    }}
                >
                    {isStopping ? '⏳ Stopping…' : '⏹ Stop'}
                </button>
            </div>

            {(combinedMode || roomMode) && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                    padding: '12px 16px', borderRadius: 8,
                    background: roomMode ? 'rgba(14,165,233,0.06)' : 'rgba(240,192,64,0.08)',
                    border: `1px solid ${roomMode ? 'rgba(14,165,233,0.35)' : 'rgba(240,192,64,0.4)'}`,
                }}>
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>{roomMode ? '🏫' : '🔄'}</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: roomMode ? '#0ea5e9' : '#f0c040' }}>
                            {roomMode ? 'Room Mode' : 'Combined Mode'}{activeCameraLabel ? ` — ${activeCameraLabel}` : ''}
                        </div>
                        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 2 }}>
                            The server switches cameras every 5 min · persons are preserved across switches
                        </div>
                    </div>
                </div>
            )}

            {(isRunning || isStopping || isDone) && (
                <div style={{
                    ...styles.card, marginBottom: 20,
                    borderColor: isRunning ? theme.accent : isDone ? theme.success : theme.accent,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <Dot
                            color={isRunning ? theme.accent : isDone ? theme.success : theme.accent}
                            pulse={isRunning || isStopping}
                        />
                        <span style={{
                            fontWeight: 700, fontSize: '14px',
                            color: isRunning ? theme.accent : isDone ? theme.success : theme.accent,
                        }}>
                            {isRunning   && `Acquiring${activeCameraLabel ? ` from ${activeCameraLabel}` : ''}…`}
                            {isStopping  && 'Stopping stream…'}
                            {isDone      && 'Acquisition complete'}
                        </span>

                        <span style={{
                            fontSize: '12px', fontWeight: 700, fontFamily: theme.fontMono,
                            padding: '3px 10px', borderRadius: 20,
                            background: theme.accentDim, color: theme.accent,
                        }}>
                            ⏱ {fmtDuration(elapsedSec)} / {fmtDuration(maxDurationSec)}
                        </span>

                        {totalPersons > 0 && (
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{
                                    fontSize: '12px', fontWeight: 700,
                                    padding: '3px 10px', borderRadius: 20,
                                    background: theme.accentDim,
                                    color: theme.accent,
                                    border: `1px solid ${theme.accent}40`,
                                    fontFamily: theme.fontMono,
                                }}>
                                    {totalImagesSession} imgs
                                </span>
                                <span style={{
                                    fontSize: '12px', fontWeight: 700,
                                    padding: '3px 10px', borderRadius: 20,
                                    background: 'rgba(168,85,247,0.09)',
                                    color: '#a855f7',
                                    border: '1px solid rgba(168,85,247,0.25)',
                                }}>
                                    {totalPersons} people
                                </span>
                                <span style={{
                                    fontSize: '12px', fontWeight: 700,
                                    padding: '3px 10px', borderRadius: 20,
                                    background: allDone ? theme.successDim : theme.bg,
                                    color:      allDone ? theme.success    : theme.textMuted,
                                    border: `1px solid ${allDone ? theme.success : theme.border}`,
                                }}>
                                    {donePersons}/{totalPersons} done
                                </span>
                            </div>
                        )}
                    </div>

                    {totalPersons > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                            {Object.entries(persons)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([id, { count }]) => (
                                    <PersonCard key={id} id={id} count={count} target={jobTarget} />
                                ))}
                        </div>
                    )}

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

            {isDone && summary && (
                <div style={{ ...styles.card, borderColor: theme.success, background: theme.successDim, marginBottom: 20 }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: theme.success, marginBottom: 12 }}>
                        ✅ Acquisition Complete
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                        {[
                            { label: 'People Detected', value: summary.peopleDetected },
                            { label: 'Images Saved',    value: summary.imagesSaved    },
                            { label: 'Time Taken',      value: fmtDuration(summary.elapsedSec) },
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
                        onClick={() => {
                            setStatus('idle'); setSummary(null); setPersons({}); setLog([]);
                            setAcquisitionId(null); attachedIdRef.current = null; setMode(null);
                            setStartedAt(null); setElapsedSec(0); setPythonJobId(null);
                            if (streamAbort.current) { streamAbort.current.abort(); streamAbort.current = null; }
                            refreshActiveJobs();
                        }}
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

            {isIdle && otherRunningJobs.length === 0 && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                    <div style={{ fontSize: '40px', marginBottom: 12, opacity: 0.4 }}>📡</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>Ready to acquire</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>
                        Select batch → optionally pick a room → set target images → click "Start Acquisition"
                        <br />
                        Acquisition runs on the server for up to 60 min and continues if you close this tab
                        <br />
                        <span style={{ color: '#0ea5e9' }}>🏫 Room mode</span> auto-switches between all cameras in the room every 5 min
                        <br />
                        <span style={{ color: '#f0c040' }}>🔄 Combined</span> alternates the first two cameras every 5 min
                    </div>
                </div>
            )}

            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 50,
                    padding: '12px 18px', borderRadius: 8, maxWidth: 360,
                    fontSize: '13px', fontWeight: 600, color: '#fff',
                    background: toast.type === 'error' ? theme.danger : theme.success,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
