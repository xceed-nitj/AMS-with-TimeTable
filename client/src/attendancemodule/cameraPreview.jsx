// client/src/attendancemodule/cameraPreview.jsx
// Live camera preview page backed by saved camera records.

import { useCallback, useEffect, useRef, useState } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset } from './config';

const apiUrl = getEnvironment();
const CAMERA_API = `${apiUrl}/attendancemodule/cameras`;

const statusColor = (status) => {
    if (status === 'online') return 'success';
    if (status === 'maintenance') return 'warning';
    return 'danger';
};

function Toast({ toast }) {
    if (!toast) return null;
    const isError = toast.type === 'error';
    const isWarning = toast.type === 'warning';
    const color = isError ? theme.danger : isWarning ? theme.warning : theme.success;
    const bg = isError ? theme.dangerDim : isWarning ? theme.warningDim : theme.successDim;

    return (
        <div style={{
            position: 'fixed',
            top: 82,
            right: 20,
            zIndex: 2147483647,
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            animation: 'fadeIn 0.3s',
            background: bg,
            color,
            border: `1px solid ${color}`,
            maxWidth: 420,
        }}>
            {toast.msg}
        </div>
    );
}

function StatusBadge({ status }) {
    return <span style={styles.badge(statusColor(status))}>{status || 'offline'}</span>;
}

export default function CameraPreview() {
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [previewRunning, setPreviewRunning] = useState(false);
    const [previewQuality, setPreviewQuality] = useState('90');
    const [previewScale, setPreviewScale] = useState('1');
    const [previewKey, setPreviewKey] = useState(0);
    const [filter, setFilter] = useState('');
    const toastTimer = useRef(null);

    const showToast = useCallback((msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 4500);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    const fetchJson = async (url, options = {}) => {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const fallback = response.status >= 500
                ? 'Preview service failed. Check that the backend, python-ml-service, and the camera RTSP port are reachable.'
                : `Request failed (${response.status})`;
            throw new Error(data.error || data.message || fallback);
        }
        return data;
    };

    const fetchCameras = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchJson(`${CAMERA_API}?liveStatus=true`);
            const list = Array.isArray(data) ? data : [];
            setCameras(list);

            const queryCameraId = new URLSearchParams(window.location.search).get('cameraId');
            const preferred = queryCameraId
                ? list.find((camera) => camera.cameraId === queryCameraId)
                : null;
            setSelectedCamera((current) => preferred || current || list[0] || null);
        } catch (error) {
            showToast(`Could not load cameras: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCameras();
    }, [fetchCameras]);

    // Force a new MJPEG connection when quality/scale changes during an active preview.
    useEffect(() => {
        if (previewRunning) setPreviewKey((key) => key + 1);
    }, [previewQuality, previewScale]);

    const filteredCameras = cameras.filter((camera) => {
        const needle = filter.trim().toLowerCase();
        if (!needle) return true;
        return [camera.cameraId, camera.roomId, camera.building, camera.position, camera.status]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(needle);
    });

    const visualScale = Math.max(0.25, Math.min(2, Number(previewScale) || 1));

    const startPreview = async (camera = selectedCamera) => {
        if (!camera?._id) {
            showToast('Select a saved camera before starting preview', 'error');
            return;
        }
        setActionLoading(true);
        try {
            const data = await fetchJson(`${CAMERA_API}/${camera._id}/preview/start`, {
                method: 'POST',
                body: '{}',
            });
            setSelectedCamera(camera);
            setPreviewRunning(true);
            setPreviewKey((key) => key + 1);
            showToast(data?.status === 'ok' ? `Live preview started for ${camera.cameraId}` : `Preview request completed for ${camera.cameraId}`);
        } catch (error) {
            showToast(`Preview could not start: ${error.message}`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const stopPreview = async () => {
        setActionLoading(true);
        try {
            const data = await fetchJson(`${CAMERA_API}/preview/stop`, {
                method: 'POST',
                body: '{}',
            });
            setPreviewRunning(false);
            showToast(data?.message || 'Live preview stopped');
        } catch (error) {
            showToast(`Preview could not stop: ${error.message}`, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <style>{`
                ${cssReset}
                .preview-hero {
                    position: relative;
                    overflow: hidden;
                    border-radius: 18px;
                    border: 1px solid ${theme.border};
                    background:
                        radial-gradient(circle at 20% 18%, rgba(52, 211, 153, 0.20), transparent 30%),
                        radial-gradient(circle at 82% 6%, rgba(56, 189, 248, 0.18), transparent 28%),
                        linear-gradient(135deg, #0f172a 0%, #070a12 100%);
                    padding: 28px;
                    margin-bottom: 22px;
                }
                .preview-grid {
                    display: grid;
                    grid-template-columns: minmax(300px, 0.38fr) minmax(420px, 0.62fr);
                    gap: 18px;
                    align-items: start;
                }
                .camera-card {
                    border: 1px solid ${theme.border};
                    border-radius: 10px;
                    padding: 13px;
                    background: ${theme.bg};
                    cursor: pointer;
                    transition: border 0.16s ease, background 0.16s ease;
                }
                .camera-card:hover,
                .camera-card.active {
                    border-color: ${theme.accent};
                    background: ${theme.accentDim};
                }
                .preview-frame {
                    position: relative;
                    overflow: hidden;
                    border-radius: 14px;
                    border: 1px solid ${previewRunning ? theme.accent : theme.border};
                    background: #02040a;
                    min-height: 420px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .preview-frame img {
                    width: 100%;
                    display: block;
                    object-fit: contain;
                }
                .preview-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .preview-actions-primary,
                .preview-actions-secondary {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .selection-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 14px;
                }
                @media (max-width: 980px) {
                    .preview-grid {
                        grid-template-columns: 1fr;
                    }
                    .selection-grid {
                        grid-template-columns: 1fr;
                    }
                    .preview-frame {
                        min-height: 260px;
                    }
                }
            `}</style>

            <Toast toast={toast} />

            <section className="preview-hero">
                <div style={{ ...styles.badge('success'), display: 'inline-flex', marginBottom: 12 }}>
                    Live feed preview
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>
                    Camera Live Preview
                </div>
                <div style={{ color: theme.textMuted, maxWidth: 820, fontSize: 14, lineHeight: 1.7 }}>
                    Select a saved camera, start the backend preview session, and watch the proxied stream here. If a camera is missing, add it first on the data-entry page.
                </div>
            </section>

            <div className="preview-grid">
                <section style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <div style={styles.heading}>Saved Cameras</div>
                        <button type="button" onClick={fetchCameras} disabled={loading} style={styles.btnGhost}>
                            {loading ? 'Refreshing...' : 'Refresh Camera List'}
                        </button>
                    </div>
                    <div style={styles.subheading}>
                        These are the camera records stored by the data-entry page. Pick one to preview its saved stream URL.
                    </div>

                    <input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Search camera, room, building..."
                        style={{ ...styles.input, marginBottom: 14 }}
                    />

                    <div style={{ display: 'grid', gap: 10, maxHeight: 620, overflowY: 'auto', paddingRight: 4 }}>
                        {filteredCameras.map((camera) => (
                            <div
                                key={camera._id}
                                className={`camera-card ${selectedCamera?._id === camera._id ? 'active' : ''}`}
                                onClick={() => setSelectedCamera(camera)}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, color: theme.text }}>{camera.cameraId}</div>
                                        <div style={{ marginTop: 4, color: theme.textMuted, fontSize: 12 }}>
                                            {camera.roomId} · {camera.position}
                                        </div>
                                    </div>
                                    <StatusBadge status={camera.status} />
                                </div>
                                <div style={{ marginTop: 9, color: theme.textMuted, fontSize: 11 }}>
                                    {camera.ipAddress}:{camera.port} · {camera.protocol}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        startPreview(camera);
                                    }}
                                    disabled={actionLoading}
                                    style={{ ...styles.btnGhost, width: '100%', marginTop: 10 }}
                                >
                                    Start This Feed
                                </button>
                            </div>
                        ))}

                        {!filteredCameras.length && (
                            <div style={{ color: theme.textMuted, fontSize: 13, padding: 18, textAlign: 'center' }}>
                                {loading ? 'Loading saved cameras...' : 'No saved cameras match this search.'}
                            </div>
                        )}
                    </div>
                </section>

                <section style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                        <div>
                            <div style={styles.heading}>
                                {selectedCamera ? selectedCamera.cameraId : 'Select Camera'}
                            </div>
                            <div style={styles.subheading}>
                                {selectedCamera
                                    ? `${selectedCamera.roomId} · ${selectedCamera.building || 'No building'} · ${selectedCamera.streamUrl}`
                                    : 'Choose a saved camera from the left panel.'}
                            </div>
                        </div>
                        {selectedCamera && <StatusBadge status={selectedCamera.status} />}
                    </div>

                    <div className="selection-grid">
                        <div>
                            <label style={styles.label}>Select Camera</label>
                            <select
                                value={selectedCamera?._id || ''}
                                onChange={(e) => {
                                    const next = cameras.find((camera) => camera._id === e.target.value);
                                    setSelectedCamera(next || null);
                                    setPreviewRunning(false);
                                }}
                                style={styles.select}
                            >
                                <option value="">Choose saved camera...</option>
                                {cameras.map((camera) => (
                                    <option key={camera._id} value={camera._id}>
                                        {camera.cameraId} · {camera.roomId} · {camera.position}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Room</label>
                            <input value={selectedCamera?.roomId || ''} readOnly placeholder="Select camera first" style={styles.input} />
                        </div>
                        <div>
                            <label style={styles.label}>Position</label>
                            <input value={selectedCamera?.position || ''} readOnly placeholder="Select camera first" style={styles.input} />
                        </div>
                        <div>
                            <label style={styles.label}>Protocol / IP</label>
                            <input
                                value={selectedCamera ? `${selectedCamera.protocol} · ${selectedCamera.ipAddress}:${selectedCamera.port}` : ''}
                                readOnly
                                placeholder="Select camera first"
                                style={styles.input}
                            />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={styles.label}>Saved Stream URL</label>
                            <input value={selectedCamera?.streamUrl || ''} readOnly placeholder="Select camera first" style={styles.input} />
                        </div>
                    </div>

                    <div className="preview-frame">
                        {previewRunning ? (
                            <img
                                key={previewKey}
                                src={`${CAMERA_API}/preview/stream?quality=${previewQuality}&scale=${previewScale}&t=${previewKey}`}
                                alt="Camera live preview"
                                style={{
                                    transform: `scale(${visualScale})`,
                                    transformOrigin: 'center center',
                                    transition: 'transform 0.18s ease',
                                }}
                                onError={() => showToast('Preview stream is not available yet. Check the ML service and the camera RTSP URL.', 'warning')}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: 24 }}>
                                <div style={{ fontSize: 17, fontWeight: 800, color: theme.text, marginBottom: 8 }}>
                                    No live feed active
                                </div>
                                <div style={{ color: theme.textMuted, fontSize: 13, lineHeight: 1.6 }}>
                                    Press Start Preview after selecting a camera. The backend will connect to the saved stream URL.
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                        <div>
                            <label style={styles.label}>Preview Quality</label>
                            <select value={previewQuality} onChange={(e) => setPreviewQuality(e.target.value)} style={styles.select}>
                                <option value="30">30 - very low bandwidth</option>
                                <option value="45">45 - low bandwidth</option>
                                <option value="60">60 - balanced</option>
                                <option value="75">75 - sharp</option>
                                <option value="90">90 - very sharp</option>
                                <option value="95">95 - maximum</option>
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Preview Scale</label>
                            <select value={previewScale} onChange={(e) => setPreviewScale(e.target.value)} style={styles.select}>
                                <option value="0.25">0.25x</option>
                                <option value="0.5">0.5x</option>
                                <option value="0.75">0.75x</option>
                                <option value="1">1x</option>
                                <option value="1.25">1.25x</option>
                                <option value="1.5">1.5x</option>
                                <option value="2">2x</option>
                            </select>
                        </div>
                    </div>

                    <div className="preview-actions" style={{ marginTop: 14 }}>
                        <div className="preview-actions-primary">
                            <button
                                type="button"
                                onClick={() => startPreview()}
                                disabled={actionLoading || !selectedCamera}
                                style={{ ...styles.btnPrimary, opacity: !selectedCamera || actionLoading ? 0.55 : 1 }}
                            >
                                Start Live Feed
                            </button>
                            <button type="button" onClick={stopPreview} disabled={actionLoading || !previewRunning} style={styles.btnGhost}>
                                Stop Live Feed
                            </button>
                        </div>
                        <div className="preview-actions-secondary">
                            <button
                                type="button"
                                onClick={() => setPreviewKey((key) => key + 1)}
                                disabled={!previewRunning}
                                style={styles.btnGhost}
                            >
                                Reconnect Feed
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
