// client/src/attendancemodule/camera.jsx
// Camera data-entry page for the attendance camera routes.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset } from './config';

const apiUrl = getEnvironment();
const CAMERA_API = `${apiUrl}/attendancemodule/cameras`;
const ROOM_API = `${apiUrl}/timetablemodule/masterroom`;

const POSITIONS = [
    { value: 'front-left', label: 'Front Left' },
    { value: 'front-right', label: 'Front Right' },
];

const PROTOCOLS = [
    { value: 'rtsp', label: 'RTSP' },
    { value: 'http_mjpeg', label: 'HTTP MJPEG' },
    { value: 'onvif', label: 'ONVIF' },
];

const STATUS_OPTIONS = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'maintenance', label: 'Maintenance' },
];

const DEFAULT_FORM = {
    cameraId: '',
    roomId: '',
    position: 'front-left',
    pairedWith: '',
    streamUrl: '',
    protocol: 'rtsp',
    ipAddress: '',
    port: '554',
    resolutionWidth: '1920',
    resolutionHeight: '1080',
    fps: '25',
    isActive: true,
    status: 'offline',
};

const protocolPorts = {
    rtsp: '554',
    http_mjpeg: '80',
    onvif: '8899',
};

const statusColor = (status) => {
    if (status === 'online') return 'success';
    if (status === 'maintenance') return 'warning';
    return 'danger';
};

const formatDateTime = (value) => {
    if (!value) return 'Not recorded';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Invalid date';
    return parsed.toLocaleString();
};

function Field({ label, children, hint }) {
    return (
        <div>
            <label style={styles.label}>{label}</label>
            {children}
            {hint && <div style={{ marginTop: 5, color: theme.textMuted, fontSize: 11 }}>{hint}</div>}
        </div>
    );
}

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

function PageToggle({ active }) {
    return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <a
                href="/camera"
                style={{
                    ...(active === 'data' ? styles.btnPrimary : styles.btnGhost),
                    display: 'inline-block',
                    textDecoration: 'none',
                }}
            >
                Data Entry
            </a>
            <a
                href="/camera/preview"
                style={{
                    ...(active === 'preview' ? styles.btnPrimary : styles.btnGhost),
                    display: 'inline-block',
                    textDecoration: 'none',
                }}
            >
                Live Preview
            </a>
        </div>
    );
}

function duplicateMessage(details) {
    if (details?.cameraId) return `Camera ID "${details.cameraId}" already exists. Choose a different Camera ID or click the saved row to update it.`;
    if (details?.roomId && details?.position) return `A camera already exists for ${details.roomId} at ${details.position}. Each room can only have one camera per position.`;
    if (details?.roomId) return `A camera already exists for room ${details.roomId}.`;
    return 'This camera already exists. Please check the saved camera list before creating a new one.';
}

function RoomPicker({ rooms, value, onChange, disabled }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const filteredRooms = useMemo(() => {
        const needle = search.trim().toLowerCase();
        if (!needle) return rooms.slice(0, 80);
        return rooms
            .filter((room) => {
                const text = [room.room, room.building, room.dept, room.type].filter(Boolean).join(' ');
                return text.toLowerCase().includes(needle);
            })
            .slice(0, 80);
    }, [rooms, search]);

    const selectedRoom = rooms.find((room) => room.room === value);

    return (
        <div style={{ position: 'relative' }}>
            <input
                placeholder={rooms.length ? 'Search and select room...' : 'Loading rooms...'}
                value={open ? search : value}
                onChange={(e) => {
                    setSearch(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => {
                    setSearch('');
                    setOpen(true);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && search.trim()) {
                        e.preventDefault();
                        onChange(search.trim().toUpperCase());
                        setOpen(false);
                    }
                }}
                onBlur={() => setTimeout(() => setOpen(false), 160)}
                disabled={disabled}
                style={styles.input}
            />

            {selectedRoom && !open && (
                <div style={{ marginTop: 6, color: theme.textMuted, fontSize: 11 }}>
                    {selectedRoom.building || 'Building missing'}{selectedRoom.type ? ` · ${selectedRoom.type}` : ''}
                </div>
            )}

            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    marginTop: 6,
                    maxHeight: 260,
                    overflowY: 'auto',
                    background: '#11172a',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    boxShadow: '0 16px 42px rgba(0,0,0,0.45)',
                }}>
                    {filteredRooms.map((room) => (
                        <div
                            key={room._id || room.room}
                            onMouseDown={() => {
                                onChange(room.room);
                                setSearch('');
                                setOpen(false);
                            }}
                            style={{
                                padding: '10px 13px',
                                cursor: 'pointer',
                                borderBottom: `1px solid ${theme.border}`,
                                background: room.room === value ? theme.accentDim : 'transparent',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = theme.accentDim; }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = room.room === value ? theme.accentDim : 'transparent';
                            }}
                        >
                            <div style={{ color: theme.text, fontSize: 13, fontWeight: 700 }}>{room.room}</div>
                            <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 3 }}>
                                {[room.building, room.type, room.dept].filter(Boolean).join(' · ') || 'No metadata'}
                            </div>
                        </div>
                    ))}

                    {!filteredRooms.length && (
                        <div style={{ padding: 13, color: theme.textMuted, fontSize: 12 }}>
                            No matching room. Press Enter to use &quot;{search.trim()}&quot; manually.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Camera() {
    const [form, setForm] = useState(DEFAULT_FORM);
    const [rooms, setRooms] = useState([]);
    const [cameras, setCameras] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const [filters, setFilters] = useState({ roomId: '', status: '', isActive: '' });
    const toastTimer = useRef(null);

    const showToast = useCallback((msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 4500);
    }, []);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    const selectedRoom = useMemo(
        () => rooms.find((room) => room.room === form.roomId),
        [rooms, form.roomId],
    );

    const pairedOptions = useMemo(
        () => cameras
            .map((camera) => camera.cameraId)
            .filter((cameraId) => cameraId && cameraId !== form.cameraId),
        [cameras, form.cameraId],
    );

    const updateForm = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const fetchJson = async (url, options = {}) => {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error(duplicateMessage(data.details));
            }
            throw new Error(data.error || data.message || `Request failed (${response.status})`);
        }
        return data;
    };

    const fetchRooms = useCallback(async () => {
        setRoomsLoading(true);
        try {
            const data = await fetchJson(ROOM_API);
            const sorted = Array.isArray(data)
                ? data
                    .filter((room) => room?.room)
                    .sort((a, b) => String(a.room).localeCompare(String(b.room)))
                : [];
            setRooms(sorted);
        } catch (error) {
            showToast(`Could not load room dropdown: ${error.message}`, 'error');
        } finally {
            setRoomsLoading(false);
        }
    }, [showToast]);

    const fetchCameras = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.roomId) params.set('roomId', filters.roomId);
            if (filters.status) params.set('status', filters.status);
            if (filters.isActive) params.set('isActive', filters.isActive);
            const url = params.toString() ? `${CAMERA_API}?${params}` : CAMERA_API;
            const data = await fetchJson(url);
            setCameras(Array.isArray(data) ? data : []);
        } catch (error) {
            showToast(`Could not load cameras: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [filters, showToast]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    useEffect(() => {
        fetchCameras();
    }, [fetchCameras]);

    const fillFormFromCamera = (camera) => {
        setSelectedCamera(camera);
        setForm({
            cameraId: camera.cameraId || '',
            roomId: camera.roomId || '',
            position: camera.position || 'front-left',
            pairedWith: camera.pairedWith || '',
            streamUrl: camera.streamUrl || '',
            protocol: camera.protocol || 'rtsp',
            ipAddress: camera.ipAddress || '',
            port: String(camera.port || protocolPorts[camera.protocol] || '554'),
            resolutionWidth: String(camera.resolution?.width || 1920),
            resolutionHeight: String(camera.resolution?.height || 1080),
            fps: String(camera.fps || 25),
            isActive: Boolean(camera.isActive),
            status: camera.status || 'offline',
        });
    };

    const resetForm = () => {
        setSelectedCamera(null);
        setForm(DEFAULT_FORM);
    };

    const buildPayload = () => {
        const payload = {
            cameraId: form.cameraId.trim().toUpperCase(),
            roomId: form.roomId.trim().toUpperCase(),
            position: form.position,
            pairedWith: form.pairedWith.trim().toUpperCase(),
            streamUrl: form.streamUrl.trim(),
            protocol: form.protocol,
            ipAddress: form.ipAddress.trim(),
            port: Number(form.port),
            resolution: {
                width: Number(form.resolutionWidth),
                height: Number(form.resolutionHeight),
            },
            fps: Number(form.fps),
            isActive: Boolean(form.isActive),
            status: form.status,
        };

        if (!payload.pairedWith) delete payload.pairedWith;
        return payload;
    };

    const validatePayload = (payload) => {
        if (!payload.cameraId) return 'Camera ID is required';
        if (!payload.roomId) return 'Room is required';
        if (!payload.streamUrl) return 'Stream URL is required';
        if (!payload.ipAddress) return 'IP address is required';
        if (!Number.isFinite(payload.port) || payload.port < 1 || payload.port > 65535) {
            return 'Port must be between 1 and 65535';
        }
        if (!Number.isFinite(payload.resolution.width) || payload.resolution.width < 1) {
            return 'Resolution width must be valid';
        }
        if (!Number.isFinite(payload.resolution.height) || payload.resolution.height < 1) {
            return 'Resolution height must be valid';
        }
        if (!Number.isFinite(payload.fps) || payload.fps < 1 || payload.fps > 120) {
            return 'FPS must be between 1 and 120';
        }
        return null;
    };

    const saveCamera = async () => {
        const payload = buildPayload();
        const validationError = validatePayload(payload);
        if (validationError) {
            showToast(validationError, 'error');
            return;
        }

        setSaving(true);
        try {
            const isUpdate = Boolean(selectedCamera?._id);
            const url = isUpdate ? `${CAMERA_API}/${selectedCamera._id}` : CAMERA_API;
            const method = isUpdate ? 'PATCH' : 'POST';
            const data = await fetchJson(url, { method, body: JSON.stringify(payload) });
            fillFormFromCamera(data);
            showToast(
                isUpdate
                    ? `Camera ${data.cameraId || payload.cameraId} updated successfully.`
                    : `Camera ${data.cameraId || payload.cameraId} created successfully.`
            );
            fetchCameras();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteCamera = async (camera = selectedCamera) => {
        if (!camera?._id) {
            showToast('Select a camera before deleting', 'error');
            return;
        }
        if (!window.confirm(`Delete ${camera.cameraId}? This cannot be undone.`)) return;
        setLoading(true);
        try {
            const data = await fetchJson(`${CAMERA_API}/${camera._id}`, { method: 'DELETE' });
            showToast(`Deleted ${data.cameraId || camera.cameraId}`);
            if (selectedCamera?._id === camera._id) resetForm();
            fetchCameras();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyProtocol = (protocol) => {
        setForm((prev) => ({
            ...prev,
            protocol,
            port: prev.port && prev.port !== protocolPorts[prev.protocol] ? prev.port : protocolPorts[protocol],
        }));
    };

    return (
        <div style={styles.page}>
            <style>{`
                ${cssReset}
                .camera-hero {
                    position: relative;
                    overflow: hidden;
                    border-radius: 18px;
                    border: 1px solid ${theme.border};
                    background:
                        radial-gradient(circle at 12% 20%, rgba(56, 189, 248, 0.22), transparent 28%),
                        radial-gradient(circle at 80% 10%, rgba(52, 211, 153, 0.15), transparent 25%),
                        linear-gradient(135deg, #101528 0%, #090c16 100%);
                    padding: 28px;
                    margin-bottom: 22px;
                    animation: fadeIn 0.35s ease-out;
                }
                .camera-hero::after {
                    content: "";
                    position: absolute;
                    inset: auto -12% -45% 35%;
                    height: 190px;
                    background: repeating-linear-gradient(90deg, rgba(56,189,248,0.08), rgba(56,189,248,0.08) 1px, transparent 1px, transparent 18px);
                    transform: rotate(-8deg);
                    pointer-events: none;
                }
                .camera-grid {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr);
                    gap: 18px;
                    align-items: start;
                }
                .camera-form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 14px;
                }
                .camera-filter-grid {
                    display: grid;
                    grid-template-columns: 1.1fr 0.8fr 0.7fr auto;
                    gap: 12px;
                    align-items: end;
                }
                .camera-table {
                    width: 100%;
                    border-collapse: collapse;
                    min-width: 820px;
                }
                .camera-table th {
                    color: ${theme.textMuted};
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    text-align: left;
                    padding: 10px 12px;
                    border-bottom: 1px solid ${theme.border};
                }
                .camera-table td {
                    color: ${theme.text};
                    font-size: 13px;
                    padding: 12px;
                    border-bottom: 1px solid ${theme.border};
                    vertical-align: top;
                }
                .camera-row {
                    cursor: pointer;
                    transition: background 0.16s ease, transform 0.16s ease;
                }
                .camera-row:hover {
                    background: rgba(56, 189, 248, 0.07);
                }
                .camera-selected {
                    background: rgba(56, 189, 248, 0.12);
                }
                .camera-actions {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .camera-mini-btn {
                    padding: 7px 10px;
                    border-radius: 6px;
                    border: 1px solid ${theme.border};
                    background: transparent;
                    color: ${theme.textMuted};
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }
                .camera-mini-btn:hover {
                    border-color: ${theme.accent};
                    color: ${theme.accent};
                }
                @media (max-width: 980px) {
                    .camera-grid,
                    .camera-form-grid,
                    .camera-filter-grid {
                        grid-template-columns: 1fr;
                    }
                    .camera-hero {
                        padding: 20px;
                    }
                }
            `}</style>

            <Toast toast={toast} />

            <section className="camera-hero">
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ ...styles.badge('accent'), display: 'inline-flex', marginBottom: 12 }}>
                        Backend connected: /attendancemodule/cameras
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em', marginBottom: 8 }}>
                        Camera Data Entry
                    </div>
                    <div style={{ color: theme.textMuted, maxWidth: 820, fontSize: 14, lineHeight: 1.7 }}>
                        Register classroom cameras and pair the two front angles. Room, protocol, position, status and active state are controlled dropdowns; network details remain manual because every camera deployment is different.
                    </div>
                    <PageToggle active="data" />
                </div>
            </section>

            <div className="camera-grid">
                <section style={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                        <div>
                            <div style={styles.heading}>{selectedCamera ? 'Edit Camera' : 'Add Camera'}</div>
                            <div style={styles.subheading}>
                                {selectedCamera ? `Editing ${selectedCamera.cameraId}` : 'Create a new camera record and bind it to a known room.'}
                            </div>
                        </div>
                        <button type="button" onClick={resetForm} style={styles.btnGhost}>New</button>
                    </div>

                    <div className="camera-form-grid">
                        <Field label="Camera ID" hint="Manual: unique code like LT103-L.">
                            <input
                                value={form.cameraId}
                                onChange={(e) => updateForm('cameraId', e.target.value.toUpperCase())}
                                placeholder="LT103-L"
                                style={styles.input}
                            />
                        </Field>

                        <Field label="Room" hint={selectedRoom ? `${selectedRoom.building || 'Building'} is filled by backend.` : 'Dropdown from master rooms.'}>
                            <RoomPicker
                                rooms={rooms}
                                value={form.roomId}
                                onChange={(value) => updateForm('roomId', value)}
                                disabled={roomsLoading}
                            />
                        </Field>

                        <Field label="Position">
                            <select value={form.position} onChange={(e) => updateForm('position', e.target.value)} style={styles.select}>
                                {POSITIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </Field>

                        <Field label="Paired With" hint="Optional: choose the opposite angle camera.">
                            <input
                                list="camera-id-options"
                                value={form.pairedWith}
                                onChange={(e) => updateForm('pairedWith', e.target.value.toUpperCase())}
                                placeholder="LT103-R"
                                style={styles.input}
                            />
                            <datalist id="camera-id-options">
                                {pairedOptions.map((cameraId) => <option key={cameraId} value={cameraId} />)}
                            </datalist>
                        </Field>

                        <Field label="Protocol">
                            <select value={form.protocol} onChange={(e) => applyProtocol(e.target.value)} style={styles.select}>
                                {PROTOCOLS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </Field>

                        <Field label="IP Address" hint="Manual: private campus camera IP.">
                            <input
                                value={form.ipAddress}
                                onChange={(e) => updateForm('ipAddress', e.target.value)}
                                placeholder="10.10.177.249"
                                style={styles.input}
                            />
                        </Field>

                        <Field label="Port">
                            <input
                                type="number"
                                min="1"
                                max="65535"
                                value={form.port}
                                onChange={(e) => updateForm('port', e.target.value)}
                                style={styles.input}
                            />
                        </Field>

                        <Field label="FPS">
                            <input
                                type="number"
                                min="1"
                                max="120"
                                value={form.fps}
                                onChange={(e) => updateForm('fps', e.target.value)}
                                style={styles.input}
                            />
                        </Field>

                        <Field label="Resolution Width">
                            <input
                                type="number"
                                min="1"
                                value={form.resolutionWidth}
                                onChange={(e) => updateForm('resolutionWidth', e.target.value)}
                                style={styles.input}
                            />
                        </Field>

                        <Field label="Resolution Height">
                            <input
                                type="number"
                                min="1"
                                value={form.resolutionHeight}
                                onChange={(e) => updateForm('resolutionHeight', e.target.value)}
                                style={styles.input}
                            />
                        </Field>

                        <Field label="Active State">
                            <select
                                value={String(form.isActive)}
                                onChange={(e) => updateForm('isActive', e.target.value === 'true')}
                                style={styles.select}
                            >
                                <option value="true">Active</option>
                                <option value="false">Inactive</option>
                            </select>
                        </Field>

                        <Field label="Status">
                            <select value={form.status} onChange={(e) => updateForm('status', e.target.value)} style={styles.select}>
                                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </Field>
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <Field label="Stream URL" hint="Manual: credentials and path vary per camera. Preview uses this saved URL.">
                            <input
                                value={form.streamUrl}
                                onChange={(e) => updateForm('streamUrl', e.target.value)}
                                placeholder="rtsp://user:password@10.10.177.249:554/video/live?channel=1&subtype=0"
                                style={styles.input}
                            />
                        </Field>
                    </div>

                    <div className="camera-actions" style={{ marginTop: 18 }}>
                        <button type="button" onClick={saveCamera} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
                            {selectedCamera ? 'Update Camera' : 'Create Camera'}
                        </button>
                        {selectedCamera && (
                            <button type="button" onClick={() => deleteCamera()} disabled={loading} style={styles.btnDanger}>
                                Delete
                            </button>
                        )}
                    </div>
                </section>

            </div>

            <section style={{ ...styles.card, marginTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
                    <div>
                        <div style={styles.heading}>Saved Cameras</div>
                        <div style={styles.subheading}>
                            This table shows camera records already saved in the backend. Click a row to load it into the form for editing, or open its feed from the separate preview page.
                        </div>
                    </div>
                    <button type="button" onClick={fetchCameras} style={styles.btnGhost}>{loading ? 'Refreshing...' : 'Refresh'}</button>
                </div>

                <div className="camera-filter-grid" style={{ marginBottom: 16 }}>
                    <Field label="Filter Room">
                        <RoomPicker
                            rooms={rooms}
                            value={filters.roomId}
                            onChange={(value) => setFilters((prev) => ({ ...prev, roomId: value }))}
                            disabled={roomsLoading}
                        />
                    </Field>
                    <Field label="Filter Status">
                        <select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))} style={styles.select}>
                            <option value="">All statuses</option>
                            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Filter Active">
                        <select value={filters.isActive} onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))} style={styles.select}>
                            <option value="">All states</option>
                            <option value="true">Active only</option>
                            <option value="false">Inactive only</option>
                        </select>
                    </Field>
                    <button type="button" onClick={() => setFilters({ roomId: '', status: '', isActive: '' })} style={styles.btnGhost}>Clear</button>
                </div>

                <div style={{ overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: 10 }}>
                    <table className="camera-table">
                        <thead>
                            <tr>
                                <th>Camera</th>
                                <th>Room</th>
                                <th>Position</th>
                                <th>Network</th>
                                <th>Status</th>
                                <th>Pair</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cameras.map((camera) => (
                                <tr
                                    key={camera._id}
                                    className={`camera-row ${selectedCamera?._id === camera._id ? 'camera-selected' : ''}`}
                                    onClick={() => fillFormFromCamera(camera)}
                                >
                                    <td>
                                        <div style={{ fontWeight: 800 }}>{camera.cameraId}</div>
                                        <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>{camera._id}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700 }}>{camera.roomId}</div>
                                        <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>{camera.building || 'No building'}</div>
                                    </td>
                                    <td>{camera.position}</td>
                                    <td>
                                        <div style={{ color: theme.accent, fontWeight: 700 }}>{camera.protocol}</div>
                                        <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 4 }}>
                                            {camera.ipAddress}:{camera.port} · {camera.resolution?.width || '-'}x{camera.resolution?.height || '-'} · {camera.fps || '-'}fps
                                        </div>
                                    </td>
                                    <td>
                                        <StatusBadge status={camera.status} />
                                        <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 6 }}>
                                            {camera.isActive ? 'Active' : 'Inactive'} · {formatDateTime(camera.lastHeartbeat)}
                                        </div>
                                    </td>
                                    <td>{camera.pairedWith || '-'}</td>
                                    <td>
                                        <div className="camera-actions" onClick={(e) => e.stopPropagation()}>
                                            <button type="button" className="camera-mini-btn" onClick={() => fillFormFromCamera(camera)}>Edit</button>
                                            <a
                                                className="camera-mini-btn"
                                                href={`/camera/preview?cameraId=${encodeURIComponent(camera.cameraId)}`}
                                                style={{ textDecoration: 'none' }}
                                            >
                                                Preview
                                            </a>
                                            <button type="button" className="camera-mini-btn" onClick={() => deleteCamera(camera)} style={{ color: theme.danger }}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {!cameras.length && (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: 26, color: theme.textMuted }}>
                                        {loading ? 'Loading cameras...' : 'No cameras found. Create the first one above.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
