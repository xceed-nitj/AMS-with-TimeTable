// client/src/attendancemodule/groundtruthgen_rtsp.jsx
// Live RTSP stream ground truth acquisition — select camera, start/stop,
// auto-stops when every detected person has reached the target image count.

import { useState, useEffect, useCallback, useRef } from 'react';
import getEnvironment from '../getenvironment';
import { API_BASE, DEGREES, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import { useBatchYears } from './useBatchYears';

const _apiUrl    = getEnvironment();
const CAMERA_API = `${_apiUrl}/attendancemodule/cameras`;
const ROOM_API   = `${_apiUrl}/timetablemodule/masterroom`;
const fetch = (input, init = {}) => window.fetch(input, {
    credentials: 'include',
    ...init,
});

// ─── Add your cameras here ────────────────────────────────────────────────────
const CAMERAS = [
    { id: 'cam_main',    label: 'Main Hall — Front', url: 'rtsp://127.0.0.1:8554/live' },
    { id: 'cam_side',    label: 'LT103L',  url: 'rtsp://admin:Admin%401234%23@10.10.177.249:554/video/live?channel=1&subtype=0&rtsp_transport=tcp'},
    { id: 'cam_lab1',    label: 'LT103R',             url: 'rtsp://admin:Admin%401234%23@10.10.177.250:554/video/live?channel=1&subtype=0&rtsp_transport=tcp' },
    { id: 'cam_lab2',    label: 'Lab 2',             url: 'rtsp://192.168.1.103:554/stream1' },
    { id: 'cam_seminar', label: 'Seminar Hall',      url: 'rtsp://192.168.1.104:554/stream1' },
];

// ─── Combined-mode camera pair ────────────────────────────────────────────────
const COMBINED_CAMERAS = ['cam_side', 'cam_lab1'];  // LT103L ↔ LT103R
const COMBINED_SWITCH_INTERVAL = 5 * 60;            // 5 minutes in seconds

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
    const prevRunning = useRef(false);
    const retryTimer  = useRef(null);

    useEffect(() => {
        if (isRunning && !prevRunning.current) {
            setLoaded(false);
            setSessionKey(k => k + 1);
        }
        if (!isRunning) {
            setLoaded(false);
            clearTimeout(retryTimer.current);
        }
        prevRunning.current = isRunning;
    }, [isRunning]);

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
            // malformed JSON — skip
        }
    }

    return { events, remaining };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GroundTruthRTSP({ fixedDepartment = '', fixedRoomDepartment = '' }) {
    const [degree,     setDegree]     = useState('BTECH');
    const [department, setDepartment] = useState(fixedDepartment);
    const { departments, deptLoading, deptError } = useDepartments();
    const { batchYears, batchYearsLoading } = useBatchYears();
    const [year,       setYear]       = useState('');
    const [cameraId,   setCameraId]   = useState(CAMERAS[0].id);

    const [detSize,    setDetSize]    = useState(320);
    const [frameSkip,  setFrameSkip]  = useState(10);
    const [targetImgs, setTargetImgs] = useState(10);
    const [minSamples, setMinSamples] = useState(3);
    const [clusterThr, setClusterThr] = useState(0.45);

    const [gtJobId,       setGtJobId]       = useState(null);

    const [status,        setStatus]        = useState('idle');  // idle | running | stopping | retrying | done | error
    const [log,           setLog]           = useState([]);
    const [persons,       setPersons]       = useState({});
    const [summary,       setSummary]       = useState(null);
    const [toast,         setToast]         = useState(null);
    const [retryCount,    setRetryCount]    = useState(0);
    const [retryCountdown, setRetryCountdown] = useState(0);

    // ── Combined-mode state ───────────────────────────────────────────────────
    const [combinedMode,     setCombinedMode]     = useState(false);
    const [combinedIdx,      setCombinedIdx]      = useState(0);       // index into COMBINED_CAMERAS
    const [switchCountdown,  setSwitchCountdown]  = useState(0);       // seconds until next camera switch
    const combinedTimerRef   = useRef(null);   // the 1-second tick interval
    const combinedAbortRef   = useRef(false);  // flag to cancel the cycle

    // ── Room-mode state ───────────────────────────────────────────────────────
    const [rooms,         setRooms]         = useState([]);
    const [roomsLoading,  setRoomsLoading]  = useState(false);
    const [selectedRoom,  setSelectedRoom]  = useState('');   // room _id
    const [roomCameras,   setRoomCameras]   = useState([]);   // normalized {id,label,url}[]
    const [roomCamsLoad,  setRoomCamsLoad]  = useState(false);
    const [roomMode,      setRoomMode]      = useState(false);
    const [roomCamIdx,    setRoomCamIdx]    = useState(0);
    const [roomSwCount,   setRoomSwCount]   = useState(0);
    const roomModeAbort   = useRef(false);
    const roomModeTimer   = useRef(null);

    const logRef          = useRef(null);
    const abortRef        = useRef(null);
    const retryTimerRef   = useRef(null);
    const retryTickRef    = useRef(null);
    const handleStartRef  = useRef(null);

    const RETRY_DELAY = 5;

    useEffect(() => {
        if (fixedDepartment) setDepartment(fixedDepartment);
    }, [fixedDepartment]);

    const clearRetry = useCallback(() => {
        if (retryTimerRef.current)  { clearTimeout(retryTimerRef.current);   retryTimerRef.current  = null; }
        if (retryTickRef.current)   { clearInterval(retryTickRef.current);   retryTickRef.current   = null; }
        setRetryCountdown(0);
    }, []);

    useEffect(() => () => {
        clearRetry();
        clearInterval(combinedTimerRef.current);
        clearInterval(roomModeTimer.current);
    }, [clearRetry]);

    // ── Fetch rooms on mount ──────────────────────────────────────────────────
    useEffect(() => {
        setRoomsLoading(true);
        const roomDepartment = fixedRoomDepartment || fixedDepartment;
        const roomUrl = roomDepartment
            ? `${ROOM_API}/dept/${encodeURIComponent(roomDepartment)}`
            : ROOM_API;
        fetch(roomUrl)
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : (data.rooms || []);
                setRooms(list);
            })
            .catch(() => {})
            .finally(() => setRoomsLoading(false));
    }, [fixedDepartment, fixedRoomDepartment]);

    // ── Fetch cameras for selected room ───────────────────────────────────────
    useEffect(() => {
        if (!selectedRoom) { setRoomCameras([]); return; }
        const roomObj = rooms.find(r => r._id === selectedRoom);
        if (!roomObj) { setRoomCameras([]); return; }
        const roomName = String(roomObj.room).trim().toUpperCase();
        setRoomCamsLoad(true);
        fetch(`${CAMERA_API}?roomId=${encodeURIComponent(roomName)}`)
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                // Normalize to {id, label, url} for handleStart compatibility
                setRoomCameras(list.map(c => ({
                    id:    c._id || c.cameraId,
                    label: `${c.roomId || roomObj.room} — ${c.position || c.cameraId}`,
                    url:   c.streamUrl,
                })).filter(c => c.url));
            })
            .catch(() => setRoomCameras([]))
            .finally(() => setRoomCamsLoad(false));
    }, [selectedRoom, rooms]);

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

    // ── stop acquisition (shared by single & combined) ────────────────────────
    const stopStream = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/stop-rtsp-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gtJobId ? { jobId: gtJobId } : {}),
            });
        } catch { /* backend may not respond if already stopped */ }
    }, [gtJobId]);

    // ── single-camera start acquisition ───────────────────────────────────────
    const handleStart = useCallback(async (overrideCamera) => {
        if (!batchName) { showToast('Fill in Degree, Department and Year', 'error'); return; }

        const cam = overrideCamera || selectedCamera;

        clearRetry();
        setStatus('running');
        if (!overrideCamera) {
            // Fresh start — clear previous state (but in cycling modes keep persons across switches)
            if (!combinedMode && !roomMode) {
                setLog([]);
                setPersons({});
                setSummary(null);
            }
        }

        const controller = new AbortController();
        abortRef.current = controller;

        addLog(`▶ Connecting to ${cam.label}…`, theme.accent);
        let currentJobId = null;
        try {
            const previewRes = await Promise.race([
                fetch(`${API_BASE}/start-preview`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rtspUrl: cam.url }),
                }),
                new Promise((_, rej) => setTimeout(() => rej(new Error('preview timeout')), 4000)),
            ]);
            if (!previewRes.ok) {
                addLog('⚠ Preview stream unavailable', theme.textMuted);
            } else {
                const previewData = await previewRes.json().catch(() => ({}));
                if (previewData.jobId) {
                    currentJobId = previewData.jobId;
                    setGtJobId(previewData.jobId);
                }
            }
        } catch (e) {
            addLog(`⚠ Preview: ${e.message}`, theme.textMuted);
        }

        await new Promise(r => setTimeout(r, 200));
        try {
            const response = await fetch(`${API_BASE}/extract-rtsp-stream`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                signal:  controller.signal,
                body: JSON.stringify({
                    rtspUrl:             cam.url,
                    batch:               batchName,
                    detSize,
                    frameSkip,
                    targetImgsPerPerson: targetImgs,
                    minSamples,
                    clusterThreshold:    clusterThr,
                    jobId:               currentJobId || '',
                }),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                throw new Error(`Server error ${response.status}${text ? ': ' + text : ''}`);
            }

            const reader  = response.body.getReader();
            const decoder = new TextDecoder();
            let   buffer  = '';

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
                            setRetryCount(0);
                            // In cycling modes (combined / room), don't set status to 'done' here —
                            // the cycle manager will handle the switch or final stop.
                            if (!combinedMode && !roomMode) {
                                setStatus('done');
                            }
                            setSummary({
                                peopleDetected: ev.people_detected,
                                imagesSaved:    ev.images_saved,
                                batchDir:       ev.batch_dir,
                                elapsedSec:     ev.elapsed_sec,
                                framesRead:     ev.frames_read,
                            });
                            addLog(`✅ ${ev.message}`, theme.success);
                            if (!combinedMode && !roomMode) {
                                showToast(`${ev.people_detected} people — ${ev.images_saved} images saved`);
                            }
                            break;

                        case 'job_id':
                            // Fallback: set jobId from SSE if start-preview failed to return one
                            if (ev.jobId && !currentJobId) setGtJobId(ev.jobId);
                            break;

                        case 'error':
                            addLog(`❌ ${ev.message}`, theme.danger);
                            showToast(ev.message, 'error');
                            break;

                        default:
                            break;
                    }
                }
            }

            if (abortRef.current && !controller.signal.aborted) {
                if (!combinedMode && !roomMode) {
                    setStatus(s => s === 'running' ? 'done' : s);
                }
            }

        } catch (err) {
            if (err.name === 'AbortError') {
                addLog(`⏹ Stream stopped (${cam.label})`, theme.textMuted);
                if (!combinedMode && !roomMode) {
                    setRetryCount(0);
                    setStatus('done');
                }
            } else {
                const attempt = retryCount + 1;
                setRetryCount(attempt);
                addLog(`❌ ${err.message} — retrying in ${RETRY_DELAY}s (attempt ${attempt})…`, theme.danger);
                setStatus('retrying');
                setRetryCountdown(RETRY_DELAY);

                retryTickRef.current = setInterval(() => {
                    setRetryCountdown(n => {
                        if (n <= 1) { clearInterval(retryTickRef.current); retryTickRef.current = null; return 0; }
                        return n - 1;
                    });
                }, 1000);

                retryTimerRef.current = setTimeout(() => {
                    // Pass the same camera so room-mode retries don't fall back
                    // to selectedCamera (which is undefined for DB-id cameras).
                    handleStartRef.current?.(cam);
                }, RETRY_DELAY * 1000);
            }
        }
    }, [batchName, selectedCamera, detSize, frameSkip, targetImgs, minSamples, clusterThr, addLog, retryCount, clearRetry, combinedMode, roomMode]);

    handleStartRef.current = handleStart;

    // ── room-mode: cycle through room cameras ─────────────────────────────────
    const handleStartRoomMode = useCallback(async () => {
        if (!batchName) { showToast('Fill in Degree, Department and Year', 'error'); return; }
        if (roomCameras.length === 0) { showToast('No cameras found for this room', 'error'); return; }

        setRoomMode(true);
        roomModeAbort.current = false;
        setRoomCamIdx(0);
        setLog([]);
        setPersons({});
        setSummary(null);
        setRetryCount(0);
        clearRetry();

        const runRoomCycle = async (startIdx) => {
            let idx = startIdx;
            while (!roomModeAbort.current) {
                const cam = roomCameras[idx % roomCameras.length];
                if (!cam) break;

                setRoomCamIdx(idx % roomCameras.length);
                setCameraId(cam.id);
                addLog(`🔄 Room mode — switching to ${cam.label}`, '#0ea5e9');

                setRoomSwCount(COMBINED_SWITCH_INTERVAL);
                clearInterval(roomModeTimer.current);

                const countdownDone = new Promise((resolve) => {
                    roomModeTimer.current = setInterval(() => {
                        setRoomSwCount(n => {
                            if (n <= 1) {
                                clearInterval(roomModeTimer.current);
                                roomModeTimer.current = null;
                                resolve();
                                return 0;
                            }
                            return n - 1;
                        });
                    }, 1000);
                });

                handleStartRef.current(cam);
                await countdownDone;

                if (roomModeAbort.current) break;

                addLog(`⏸ Stopping ${cam.label} for camera switch…`, '#0ea5e9');
                if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
                await stopStream();
                await new Promise(r => setTimeout(r, 1500));

                if (roomModeAbort.current) break;
                idx++;
            }

            if (!roomModeAbort.current) {
                setRoomMode(false);
                setStatus('done');
            }
        };

        runRoomCycle(0);
    }, [batchName, roomCameras, addLog, clearRetry, stopStream]);

    // ── stop (user-initiated) ─────────────────────────────────────────────────
    const handleStop = useCallback(async () => {
        clearRetry();
        setRetryCount(0);

        // If combined mode is active, cancel the cycle
        if (combinedMode) {
            combinedAbortRef.current = true;
            clearInterval(combinedTimerRef.current);
            combinedTimerRef.current = null;
            setCombinedMode(false);
            setSwitchCountdown(0);
        }

        // If room mode is active, cancel the cycle
        if (roomMode) {
            roomModeAbort.current = true;
            clearInterval(roomModeTimer.current);
            roomModeTimer.current = null;
            setRoomMode(false);
            setRoomSwCount(0);
        }

        setStatus('stopping');
        addLog('⏹ Sending stop signal — waiting for final save…', theme.textMuted);

        // Abort the fetch stream
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }

        await stopStream();
        setStatus('done');
    }, [addLog, clearRetry, combinedMode, roomMode, stopStream]);

    // ── combined-mode: start cycling ──────────────────────────────────────────
    const handleStartCombined = useCallback(async () => {
        if (!batchName) { showToast('Fill in Degree, Department and Year', 'error'); return; }

        // Reset state
        setCombinedMode(true);
        combinedAbortRef.current = false;
        setCombinedIdx(0);
        setLog([]);
        setPersons({});
        setSummary(null);
        setRetryCount(0);
        clearRetry();

        const runCycle = async (startIdx) => {
            let idx = startIdx;

            while (!combinedAbortRef.current) {
                const camId = COMBINED_CAMERAS[idx % COMBINED_CAMERAS.length];
                const cam   = CAMERAS.find(c => c.id === camId);
                if (!cam) break;

                setCombinedIdx(idx % COMBINED_CAMERAS.length);
                setCameraId(camId);
                addLog(`🔄 Combined mode — switching to ${cam.label}`, '#f0c040');

                // Start the countdown timer
                setSwitchCountdown(COMBINED_SWITCH_INTERVAL);
                clearInterval(combinedTimerRef.current);

                const countdownDone = new Promise((resolve) => {
                    combinedTimerRef.current = setInterval(() => {
                        setSwitchCountdown(n => {
                            if (n <= 1) {
                                clearInterval(combinedTimerRef.current);
                                combinedTimerRef.current = null;
                                resolve();
                                return 0;
                            }
                            return n - 1;
                        });
                    }, 1000);
                });

                // Start streaming this camera (don't clear persons/log on switch)
                // We fire handleStart but also need to abort it after the interval
                const streamPromise = handleStartRef.current(cam);

                // Wait for the switch interval to elapse
                await countdownDone;

                if (combinedAbortRef.current) break;

                // Stop the current stream before switching
                addLog(`⏸ Stopping ${cam.label} for camera switch…`, '#f0c040');
                if (abortRef.current) {
                    abortRef.current.abort();
                    abortRef.current = null;
                }
                await stopStream();

                // Brief pause to let backend clean up
                await new Promise(r => setTimeout(r, 1500));

                if (combinedAbortRef.current) break;

                idx++;
            }

            // Cycle ended
            if (!combinedAbortRef.current) {
                setCombinedMode(false);
                setStatus('done');
            }
        };

        runCycle(0);
    }, [batchName, addLog, clearRetry, stopStream]);

    const isRunning   = status === 'running';
    const isStopping  = status === 'stopping';
    const isRetrying  = status === 'retrying';
    const isDone      = status === 'done';
    const isError     = status === 'error';
    const isIdle      = status === 'idle';

    const totalPersons       = Object.keys(persons).length;
    const donePersons        = Object.values(persons).filter(p => p.done).length;
    const allDone            = totalPersons > 0 && donePersons === totalPersons;
    const totalImagesSession = Object.values(persons).reduce((s, p) => s + (p.count || 0), 0);

    // Format mm:ss for switch countdown
    const switchMM = String(Math.floor(switchCountdown / 60)).padStart(2, '0');
    const switchSS = String(switchCountdown % 60).padStart(2, '0');

    // Active camera label in combined mode
    const combinedActiveCam = combinedMode
        ? CAMERAS.find(c => c.id === COMBINED_CAMERAS[combinedIdx])
        : null;

    // Active camera in room mode
    const roomActiveCam = roomMode ? roomCameras[roomCamIdx] : null;
    const roomSwMM = String(Math.floor(roomSwCount / 60)).padStart(2, '0');
    const roomSwSS = String(roomSwCount % 60).padStart(2, '0');
    const roomObj  = rooms.find(r => r._id === selectedRoom);

    // Whether any cycling mode is active
    const anyMode  = combinedMode || roomMode;

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
                <div style={styles.heading}>Ground Truth Acquisition</div>
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
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: fixedDepartment ? '1fr 1fr' : '1fr 1fr 1fr',
                    gap: 16,
                    marginBottom: 20,
                }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    {!fixedDepartment && (
                        <div>
                            <label style={styles.label}>Department</label>
                            <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select} disabled={deptLoading}>
                                <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select…'}</option>
                                {departments.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                            </select>
                            {deptError && <div style={{ fontSize: '11px', color: theme.danger, marginTop: 4 }}>{deptError}</div>}
                        </div>
                    )}
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

                {/* ── Room selector (optional) ── */}
                <div style={{ marginBottom: 20 }}>
                    <label style={styles.label}>
                        Room
                        <span style={{ marginLeft: 6, fontSize: '10px', color: theme.textMuted, fontWeight: 400, textTransform: 'none' }}>
                            — optional: auto-switches between room cameras
                        </span>
                    </label>
                    <select
                        value={selectedRoom}
                        onChange={e => { setSelectedRoom(e.target.value); setRoomMode(false); }}
                        style={styles.select}
                        disabled={roomsLoading || isRunning || isStopping || anyMode}
                    >
                        <option value="">— No room (manual selection below) —</option>
                        {rooms.map(r => (
                            <option key={r._id} value={r._id}>
                                {r.room}{r.building ? ` · ${r.building}` : ''}{r.type ? ` (${r.type})` : ''}
                            </option>
                        ))}
                    </select>

                    {/* Room cameras info */}
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
                                    <strong>{roomCameras.length}</strong> camera{roomCameras.length > 1 ? 's' : ''} found —{' '}
                                    {roomCameras.map(c => c.label).join(', ')}
                                    {roomCameras.length > 1 && <span style={{ color: theme.textMuted }}> · auto-switches every 5 min</span>}
                                </span>
                            ) : (
                                <span style={{ color: theme.danger }}>No cameras registered for this room</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Camera selector — shown only when no room selected */}
                {!selectedRoom && (
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
                )}

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
            <LivePreview apiBase={API_BASE} isRunning={isRunning} jobId={gtJobId} />

            {/* ── Action buttons ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>

                {/* Start button — adapts based on room selection */}
                <button
                    onClick={() => {
                        if (selectedRoom && roomCameras.length > 0) {
                            handleStartRoomMode();
                        } else {
                            handleStart();
                        }
                    }}
                    disabled={isRunning || isStopping || isRetrying || !batchName || anyMode
                        || (selectedRoom && roomCameras.length === 0 && !roomCamsLoad)}
                    style={{
                        ...styles.btnPrimary,
                        opacity: (isRunning || isStopping || isRetrying || !batchName || anyMode) ? 0.5 : 1,
                        minWidth: 200,
                    }}
                >
                    {(isRunning && !anyMode) ? (
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

                {/* Combined L+R button — only when no room is selected */}
                {!selectedRoom && (
                <button
                    onClick={handleStartCombined}
                    disabled={isRunning || isStopping || isRetrying || !batchName || anyMode}
                    style={{
                        padding: '10px 24px', borderRadius: 8,
                        cursor: (isRunning || isStopping || isRetrying || !batchName || anyMode) ? 'default' : 'pointer',
                        fontSize: '14px', fontWeight: 700,
                        border: 'none',
                        background: combinedMode
                            ? '#0284c7'
                            : (isRunning || isStopping || isRetrying || !batchName) ? '#94a3b8' : '#0ea5e9',
                        color: '#ffffff',
                        boxShadow: combinedMode ? '0 2px 8px rgba(2,132,199,0.4)' : '0 2px 8px rgba(14,165,233,0.3)',
                        transition: 'all 0.15s',
                        opacity: (isRunning || isStopping || isRetrying || !batchName) && !combinedMode ? 0.5 : 1,
                        minWidth: 200,
                        display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                    }}
                >
                    {combinedMode ? (
                        <>
                            <span style={{
                                width: 14, height: 14,
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#ffffff',
                                borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                                display: 'inline-block',
                            }} />
                            Combined ({combinedActiveCam?.label}) {switchMM}:{switchSS}
                        </>
                    ) : '🔄 Combined L ↔ R'}
                </button>
                )}

                <button
                    onClick={handleStop}
                    disabled={!isRunning && !isRetrying && !anyMode}
                    style={{
                        padding: '10px 24px', borderRadius: 8,
                        cursor: (isRunning || isRetrying || anyMode) ? 'pointer' : 'default',
                        fontSize: '14px', fontWeight: 700, border: 'none',
                        background: (isRunning || isRetrying || anyMode) ? '#ef4444' : '#fca5a5',
                        color: '#ffffff',
                        boxShadow: (isRunning || isRetrying || anyMode) ? '0 2px 8px rgba(239,68,68,0.4)' : 'none',
                        transition: 'all 0.15s',
                        opacity: (isRunning || isRetrying || anyMode) ? 1 : 0.45,
                        minWidth: 120,
                    }}
                >
                    {isStopping ? '⏳ Stopping…' : '⏹ Stop'}
                </button>
            </div>

            {/* ── Combined-mode banner ── */}
            {combinedMode && isRunning && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                    padding: '12px 16px', borderRadius: 8,
                    background: 'rgba(240,192,64,0.08)',
                    border: '1px solid rgba(240,192,64,0.4)',
                }}>
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>🔄</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0c040' }}>
                            Combined Mode — {combinedActiveCam?.label}
                        </div>
                        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 2 }}>
                            Switching to {CAMERAS.find(c => c.id === COMBINED_CAMERAS[(combinedIdx + 1) % COMBINED_CAMERAS.length])?.label} in{' '}
                            <span style={{ fontWeight: 700, color: '#f0c040', fontFamily: theme.fontMono }}>
                                {switchMM}:{switchSS}
                            </span>
                            {' '}· persons are preserved across switches
                        </div>
                    </div>
                </div>
            )}

            {/* ── Room-mode banner ── */}
            {roomMode && isRunning && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                    padding: '12px 16px', borderRadius: 8,
                    background: 'rgba(14,165,233,0.06)',
                    border: '1px solid rgba(14,165,233,0.35)',
                }}>
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>🏫</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0ea5e9' }}>
                            Room Mode — {roomObj?.room || 'Room'} · {roomActiveCam?.label}
                        </div>
                        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 2 }}>
                            {roomCameras.length > 1 ? (
                                <>
                                    Next camera in{' '}
                                    <span style={{ fontWeight: 700, color: '#0ea5e9', fontFamily: theme.fontMono }}>
                                        {roomSwMM}:{roomSwSS}
                                    </span>
                                    {' '}· {roomCameras[(roomCamIdx + 1) % roomCameras.length]?.label}
                                    {' '}· persons preserved across switches
                                </>
                            ) : 'Single camera — no switching needed'}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Auto-retry banner ── */}
            {isRetrying && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                    padding: '12px 16px', borderRadius: 8,
                    background: theme.dangerDim, border: `1px solid ${theme.danger}`,
                }}>
                    <span style={{ fontSize: '20px', lineHeight: 1 }}>⚠</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: theme.danger }}>
                            Network error — reconnecting in {retryCountdown}s
                        </div>
                        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 2 }}>
                            Attempt #{retryCount} · persons kept from previous run
                        </div>
                    </div>
                    <button
                        onClick={handleStop}
                        style={{
                            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                            fontSize: '12px', fontWeight: 700,
                            border: `1px solid ${theme.danger}`,
                            background: 'transparent', color: theme.danger,
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* ── Live status panel ── */}
            {(isRunning || isStopping || isRetrying || isDone || isError) && (
                <div style={{
                    ...styles.card, marginBottom: 20,
                    borderColor: isRunning ? theme.accent : isDone ? theme.success : isRetrying ? theme.danger : theme.danger,
                }}>
                    {/* Status bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <Dot
                            color={isRunning ? theme.accent : isDone ? theme.success : theme.danger}
                            pulse={isRunning || isStopping}
                        />
                        <span style={{
                            fontWeight: 700, fontSize: '14px',
                            color: isRunning ? theme.accent : isDone ? theme.success : theme.danger,
                        }}>
                            {isRunning   && `Acquiring from ${roomMode ? roomActiveCam?.label : selectedCamera?.label}…`}
                            {isStopping  && 'Stopping stream…'}
                            {isRetrying  && `Reconnecting… (attempt #${retryCount})`}
                            {isDone      && 'Acquisition complete'}
                            {isError     && 'Acquisition failed'}
                        </span>

                        {/* Live counters */}
                        {totalPersons > 0 && (
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {/* Total images acquired this session */}
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
                                {/* Clusters / persons detected */}
                                <span style={{
                                    fontSize: '12px', fontWeight: 700,
                                    padding: '3px 10px', borderRadius: 20,
                                    background: 'rgba(168,85,247,0.09)',
                                    color: '#a855f7',
                                    border: '1px solid rgba(168,85,247,0.25)',
                                }}>
                                    {totalPersons} clusters
                                </span>
                                {/* Done badge */}
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
                        Select batch → optionally pick a room → set target images → click "Start Acquisition"
                        <br />
                        Stream stops automatically once every person reaches the target
                        <br />
                        <span style={{ color: '#0ea5e9' }}>🏫 Room mode</span> auto-switches between all cameras in the room every 5 min
                        <br />
                        <span style={{ color: '#f0c040' }}>🔄 Combined L ↔ R</span> alternates LT103L and LT103R every 5 min (manual mode)
                    </div>
                </div>
            )}
        </div>
    );
}
