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
const CAMERA_ROOMS_API = `${CAMERA_API}/rooms`;
const OTHER_CONTROLS_API = `${_apiUrl}/attendancemodule/settings/other-controls`;

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

const fetch = (input, init = {}) => window.fetch(input, {
    credentials: 'include',
    ...init,
});

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

    const [gtJobId,       setGtJobId]       = useState(null);

    const [status,        setStatus]        = useState('idle');  
    const [log,           setLog]           = useState([]);
    const [persons,       setPersons]       = useState({});
    const [summary,       setSummary]       = useState(null);
    const [toast,         setToast]         = useState(null);
    const [retryCount,    setRetryCount]    = useState(0);
    const [retryCountdown, setRetryCountdown] = useState(0);

    // Optional 08:30–17:30 IST acquisition window (admin toggle, default off).
    const [gtWindow, setGtWindow] = useState({ enabled: false, start: '08:30', end: '17:30' });
    const [nowMin, setNowMin] = useState(nowMinIST());

    const [combinedMode,     setCombinedMode]     = useState(false);
    const [combinedIdx,      setCombinedIdx]      = useState(0);       
    const [switchCountdown,  setSwitchCountdown]  = useState(0);       
    const combinedTimerRef   = useRef(null);   
    const combinedAbortRef   = useRef(false);  

    const [registeredRooms,   setRegisteredRooms]   = useState([]);
    const [registeredCameras, setRegisteredCameras] = useState([]);
    const [roomsLoading,      setRoomsLoading]      = useState(false);
    const [selectedRoom,      setSelectedRoom]      = useState('');

    const [roomCameras,   setRoomCameras]   = useState([]);   
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
    
    const fetchDegrees = async () => {
        const url = `${_apiUrl}/attendancemodule/settings/batches/degrees`
        const res = await fetch(url, {credentials: "include"})
        const data = await res.json();
        setDegrees(data.degrees);
        console.log(data.degrees)
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

    const stopStream = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/stop-rtsp-stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gtJobId ? { jobId: gtJobId } : {}),
            });
        } catch { /* clean fallback trace exit */ }
    }, [gtJobId]);

    const handleStart = useCallback(async (overrideCamera) => {
        if (!batchName) { showToast('Fill in Degree, Department and Year', 'error'); return; }

        const cam = overrideCamera || selectedCamera;
        if (!cam) { showToast('Select a registered camera', 'error'); return; }

        clearRetry();
        setStatus('running');
        if (!overrideCamera) {
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
                // A 403 is a deliberate policy block (e.g. the acquisition
                // time-window restriction) — surface it and do NOT retry.
                if (response.status === 403) {
                    let reason = text;
                    try { reason = JSON.parse(text).error || text; } catch { /* keep raw text */ }
                    const blockErr = new Error(reason || 'Acquisition is not allowed right now.');
                    blockErr.noRetry = true;
                    throw blockErr;
                }
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
            } else if (err.noRetry) {
                // Policy block (e.g. outside the allowed acquisition window) —
                // stop cleanly, no retry loop.
                clearRetry();
                setRetryCount(0);
                addLog(`⛔ ${err.message}`, theme.danger);
                showToast(err.message, 'error');
                setStatus('idle');
                if (combinedMode) setCombinedMode(false);
                if (roomMode) setRoomMode(false);
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
                    handleStartRef.current?.(cam);
                }, RETRY_DELAY * 1000);
            }
        }
    }, [batchName, selectedCamera, detSize, frameSkip, targetImgs, minSamples, clusterThr, addLog, retryCount, clearRetry, combinedMode, roomMode]);

    handleStartRef.current = handleStart;

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

    const handleStop = useCallback(async () => {
        clearRetry();
        setRetryCount(0);

        if (combinedMode) {
            combinedAbortRef.current = true;
            clearInterval(combinedTimerRef.current);
            combinedTimerRef.current = null;
            setCombinedMode(false);
            setSwitchCountdown(0);
        }

        if (roomMode) {
            roomModeAbort.current = true;
            clearInterval(roomModeTimer.current);
            roomModeTimer.current = null;
            setRoomMode(false);
            setRoomSwCount(0);
        }

        setStatus('stopping');
        addLog('⏹ Sending stop signal — waiting for final save…', theme.textMuted);

        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }

        await stopStream();
        setStatus('done');
    }, [addLog, clearRetry, combinedMode, roomMode, stopStream]);

    const handleStartCombined = useCallback(async () => {
        if (!batchName) { showToast('Fill in Degree, Department and Year', 'error'); return; }

        setCombinedMode(true);
        combinedAbortRef.current = false;
        setCombinedIdx(0);
        setLog([]);
        setPersons({});
        setSummary(null);
        setRetryCount(0);
        clearRetry();

        const runCycle = async (startIdx) => {
            const combinedCameras = registeredCameras.slice(0, 2);
            let idx = startIdx;

            while (!combinedAbortRef.current) {
                const cam = combinedCameras[idx % combinedCameras.length];
                if (!cam) break;

                setCombinedIdx(idx % combinedCameras.length);
                setCameraId(cam.id);
                addLog(`🔄 Combined mode — switching to ${cam.label}`, '#f0c040');

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

                handleStartRef.current(cam);
                await countdownDone;

                if (combinedAbortRef.current) break;

                addLog(`⏸ Stopping ${cam.label} for camera switch…`, '#f0c040');
                if (abortRef.current) {
                    abortRef.current.abort();
                    abortRef.current = null;
                }
                await stopStream();

                await new Promise(r => setTimeout(r, 1500));
                if (combinedAbortRef.current) break;

                idx++;
            }

            if (!combinedAbortRef.current) {
                setCombinedMode(false);
                setStatus('done');
            }
        };

        runCycle(0);
    }, [batchName, registeredCameras, addLog, clearRetry, stopStream]);

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

    const switchMM = String(Math.floor(switchCountdown / 60)).padStart(2, '0');
    const switchSS = String(switchCountdown % 60).padStart(2, '0');

    const combinedActiveCam = combinedMode
        ? registeredCameras[combinedIdx]
        : null;

    const roomActiveCam = roomMode ? roomCameras[roomCamIdx] : null;
    const roomSwMM = String(Math.floor(roomSwCount / 60)).padStart(2, '0');
    const roomSwSS = String(roomSwCount % 60).padStart(2, '0');

    const anyMode  = combinedMode || roomMode;

    return (
        <div style={styles.page}>
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Ground Truth Acquisition</div>
                <div style={styles.subheading}>
                    Acquire face images from a live RTSP camera stream →
                    auto-stops when every detected person reaches the target image count
                </div>
            </div>

            <div style={{
                ...styles.card, marginBottom: 24,
                opacity: (isRunning || isStopping) ? 0.6 : 1,
                pointerEvents: (isRunning || isStopping) ? 'none' : 'auto',
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
                        onChange={e => { setSelectedRoom(e.target.value); setRoomMode(false); }}
                        style={styles.select}
                        disabled={roomsLoading || isRunning || isStopping || anyMode}
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
                                    <strong>{roomCameras.length}</strong> camera{roomCameras.length > 1 ? 's' : ''} routed — tap "Start"
                                </span>
                            ) : (
                                <span style={{ color: theme.danger }}>No cameras registered for room "{selectedRoom}"</span>
                            )}
                        </div>
                    )}
                </div>

                {!selectedRoom && (
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

            <LivePreview apiBase={API_BASE} isRunning={isRunning} jobId={gtJobId} />

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
                    onClick={() => {
                        if (selectedRoom && roomCameras.length > 0) {
                            handleStartRoomMode();
                        } else {
                            handleStart();
                        }
                    }}
                    disabled={isRunning || isStopping || isRetrying || !batchName || anyMode
                        || !windowOpen
                        || (!selectedRoom && !selectedCamera)
                        || (selectedRoom && roomCameras.length === 0 && !roomCamsLoad)}
                    title={!windowOpen ? `Ground Truth acquisition is restricted to ${gtWindow.start}–${gtWindow.end} IST` : undefined}
                    style={{
                        ...styles.btnPrimary,
                        opacity: (isRunning || isStopping || isRetrying || !batchName || anyMode || !windowOpen) ? 0.5 : 1,
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

                {!selectedRoom && (
                <button
                    onClick={handleStartCombined}
                    disabled={isRunning || isStopping || isRetrying || !batchName || anyMode || !windowOpen || registeredCameras.length < 2}
                    title={!windowOpen ? `Ground Truth acquisition is restricted to ${gtWindow.start}–${gtWindow.end} IST` : undefined}
                    style={{
                        padding: '10px 24px', borderRadius: 8,
                        cursor: (isRunning || isStopping || isRetrying || !batchName || anyMode || !windowOpen || registeredCameras.length < 2) ? 'default' : 'pointer',
                        fontSize: '14px', fontWeight: 700,
                        border: 'none',
                        background: combinedMode
                            ? '#0284c7'
                            : (isRunning || isStopping || isRetrying || !batchName || !windowOpen) ? '#94a3b8' : '#0ea5e9',
                        color: '#ffffff',
                        boxShadow: combinedMode ? '0 2px 8px rgba(2,132,199,0.4)' : '0 2px 8px rgba(14,165,233,0.3)',
                        transition: 'all 0.15s',
                        opacity: (isRunning || isStopping || isRetrying || !batchName || !windowOpen) && !combinedMode ? 0.5 : 1,
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
                    ) : '🔄 Combine First Two Cameras'}
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
                            Switching to {registeredCameras[(combinedIdx + 1) % Math.min(2, registeredCameras.length)]?.label} in_
                            <span style={{ fontWeight: 700, color: '#f0c040', fontFamily: theme.fontMono }}>
                                {switchMM}:{switchSS}
                            </span>
                            {' '}· persons are preserved across switches
                        </div>
                    </div>
                </div>
            )}

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
                            Room Mode — {selectedRoom} · {roomActiveCam?.label}
                        </div>
                        <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 2 }}>
                            {roomCameras.length > 1 ? (
                                <>
                                    Next camera in_
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

            {(isRunning || isStopping || isRetrying || isDone || isError) && (
                <div style={{
                    ...styles.card, marginBottom: 20,
                    borderColor: isRunning ? theme.accent : isDone ? theme.success : isRetrying ? theme.danger : theme.danger,
                }}>
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
                                    {totalPersons} clusters
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
                                    <PersonCard key={id} id={id} count={count} target={targetImgs} />
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