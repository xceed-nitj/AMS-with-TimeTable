import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cssReset, styles, theme } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const ROOMS_API = `${apiUrl}/timetablemodule/lock/rooms`;
const MASTERROOM_API = `${apiUrl}/timetablemodule/masterroom`;
const VERIFY_API = `${apiUrl}/attendancemodule/frame-verification`;
const CLASS_INFO_API = `${apiUrl}/timetablemodule/lock/attendance-lookup`;

const SLOT_LABELS = {
    period1: 'Period 1 - 08:30',
    period2: 'Period 2 - 09:30',
    period3: 'Period 3 - 10:30',
    period4: 'Period 4 - 11:30',
    period5: 'Period 5 - 13:30',
    period6: 'Period 6 - 14:30',
    period7: 'Period 7 - 15:30',
    period8: 'Period 8 - 16:30',
};

const PAGE_CSS = `
    ${cssReset}
    .frame-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
    }
    .frame-chip {
        border: 1px solid ${theme.border};
        background: ${theme.surfaceAlt};
        color: ${theme.textMuted};
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background .15s ease, color .15s ease, border-color .15s ease;
    }
    .frame-chip.active {
        background: ${theme.accentDim};
        border-color: rgba(99,102,241,0.28);
        color: ${theme.accent};
    }
    .frame-thumb:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 22px rgba(26,31,60,0.12);
    }
    @media (max-width: 720px) {
        .frame-filter-grid {
            grid-template-columns: 1fr !important;
        }
        .frame-modal-body {
            grid-template-columns: 1fr !important;
        }
    }
`;

function StatBadge({ label, value, tone = 'default' }) {
    return (
        <span style={styles.badge(tone === 'default' ? undefined : tone)}>
            {label}: {value}
        </span>
    );
}

function EmptyState({ title, subtitle }) {
    return (
        <div style={{
            ...styles.card,
            textAlign: 'center',
            padding: '36px 24px',
            color: theme.textMuted,
        }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 13 }}>{subtitle}</div>
        </div>
    );
}

export default function FrameVerification({ fixedDepartment = '' }) {
    // Deep-link support (e.g. from the ERP Overrides page): ?room=&date=&period=
    // pre-fills the selectors so the linked folder loads without manual clicks.
    const [searchParams] = useSearchParams();
    const [rooms, setRooms] = useState([]);
    const [room, setRoom] = useState(() => searchParams.get('room') || '');
    const [availableDates, setAvailableDates] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [availableFolders, setAvailableFolders] = useState([]);
    const [date, setDate] = useState(() => searchParams.get('date') || '');
    const [period, setPeriod] = useState(() => searchParams.get('period') || '');
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [framesLoading, setFramesLoading] = useState(false);
    const [galleryData, setGalleryData] = useState(null);
    const [activeTab, setActiveTab] = useState('annotated');
    const [modalState, setModalState] = useState({ open: false, tab: 'annotated', index: 0 });
    const [fullscreenActive, setFullscreenActive] = useState(false);
    const [classInfo, setClassInfo] = useState(null);
    const [classInfoLoading, setClassInfoLoading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);
    const modalRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(ROOMS_API);
                const data = await res.json();
                let allRooms = Array.isArray(data.rooms) ? data.rooms : [];

                if (fixedDepartment) {
                    // Dept-admin: only show rooms belonging to their department.
                    // Intersect the locked-timetable room list with the dept's
                    // master room list so we never show a room outside scope.
                    try {
                        const deptRes  = await fetch(`${MASTERROOM_API}/dept/${encodeURIComponent(fixedDepartment)}`);
                        const deptData = await deptRes.json();
                        const deptRoomNames = new Set(
                            (Array.isArray(deptData) ? deptData : [])
                                .map(r => String(r.room || '').trim().toUpperCase())
                        );
                        allRooms = allRooms.filter(r => deptRoomNames.has(String(r).trim().toUpperCase()));
                    } catch (_) {
                        // If the dept room lookup fails, fail safe to an empty list
                        // rather than showing rooms outside the dept-admin's scope.
                        allRooms = [];
                    }
                }

                if (!cancelled) {
                    setRooms(allRooms);
                }
            } catch (_) {
                if (!cancelled) {
                    setRooms([]);
                }
            }
        })();

        return () => { cancelled = true; };
    }, [fixedDepartment]);

    useEffect(() => {
        if (!room) {
            setAvailableDates([]);
            setAvailablePeriods([]);
            setAvailableFolders([]);
            setDate('');
            setPeriod('');
            setGalleryData(null);
            return;
        }

        let cancelled = false;
        setAvailabilityLoading(true);
        setGalleryData(null);

        (async () => {
            try {
                const params = new URLSearchParams({ room });
                const res = await fetch(`${VERIFY_API}/availability?${params.toString()}`);
                const data = await res.json();

                if (cancelled) return;

                const nextDates = Array.isArray(data.dates) ? data.dates : [];
                const nextPeriods = Array.isArray(data.periods) ? data.periods : [];
                const nextFolders = Array.isArray(data.folders) ? data.folders : [];
                setAvailableDates(nextDates);
                setAvailablePeriods(nextPeriods);
                setAvailableFolders(nextFolders);
                setDate((current) => (nextDates.includes(current) ? current : ''));
                setPeriod((current) => (nextPeriods.includes(current) ? current : ''));
            } catch (_) {
                if (cancelled) return;
                setAvailableDates([]);
                setAvailablePeriods([]);
                setAvailableFolders([]);
                setDate('');
                setPeriod('');
            } finally {
                if (!cancelled) setAvailabilityLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [room]);

    useEffect(() => {
        if (!room || !date || !period) {
            setGalleryData(null);
            return;
        }

        let cancelled = false;
        setFramesLoading(true);

        (async () => {
            try {
                const params = new URLSearchParams({ room, date, period });
                const res = await fetch(`${VERIFY_API}/frames?${params.toString()}`);
                const data = await res.json();
                if (!cancelled) {
                    setGalleryData(data);
                    if ((data.annotatedFrames || []).length > 0) {
                        setActiveTab('annotated');
                    } else {
                        setActiveTab('raw');
                    }
                }
            } catch (_) {
                if (!cancelled) {
                    setGalleryData({
                        found: false,
                        folder: '',
                        rawFrames: [],
                        annotatedFrames: [],
                    });
                }
            } finally {
                if (!cancelled) setFramesLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [room, date, period]);

    useEffect(() => {
        if (!room || !period) {
            setClassInfo(null);
            return;
        }

        let cancelled = false;
        setClassInfoLoading(true);

        (async () => {
            try {
                const params = new URLSearchParams({ room, slot: period });
                const res = await fetch(`${CLASS_INFO_API}?${params.toString()}`);
                const data = await res.json();
                if (!cancelled) {
                    setClassInfo({
                        subject: data.subject || '-',
                        faculty: data.faculty || '-',
                        batch: data.batch || '-',
                        degree: data.degree || '-',
                        dept: data.dept || '-',
                    });
                }
            } catch (_) {
                if (!cancelled) {
                    setClassInfo({
                        subject: '-',
                        faculty: '-',
                        batch: '-',
                        degree: '-',
                        dept: '-',
                    });
                }
            } finally {
                if (!cancelled) setClassInfoLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [room, period]);

    const visiblePeriods = date
        ? [...new Set(
            availableFolders
                .filter((item) => item.date === date)
                .map((item) => item.period)
        )].sort((a, b) => {
            const aNum = Number(String(a || '').replace(/^\D+/i, '')) || 0;
            const bNum = Number(String(b || '').replace(/^\D+/i, '')) || 0;
            return aNum - bNum;
        })
        : availablePeriods;

    useEffect(() => {
        if (!period) return;
        if (!visiblePeriods.includes(period)) {
            setPeriod('');
        }
    }, [period, visiblePeriods]);

    useEffect(() => {
        if (!modalState.open) return undefined;

        const shiftIndex = (direction) => {
            setModalState((current) => {
                const list = current.tab === 'annotated'
                    ? (galleryData?.annotatedFrames || [])
                    : (galleryData?.rawFrames || []);

                if (list.length === 0) return current;

                const nextIndex = (current.index + direction + list.length) % list.length;
                return { ...current, index: nextIndex };
            });
        };

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                    return;
                }
                setModalState((current) => ({ ...current, open: false }));
                return;
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                shiftIndex(1);
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                shiftIndex(-1);
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [modalState.open, modalState.index, modalState.tab, galleryData]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setFullscreenActive(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    const rawFrames = galleryData?.rawFrames || [];
    const annotatedFrames = galleryData?.annotatedFrames || [];
    const activeFrames = modalState.tab === 'annotated' ? annotatedFrames : rawFrames;
    const modalFrame = activeFrames[modalState.index] || null;

    function toImageUrl(relativeUrl) {
        return relativeUrl ? `${apiUrl}${relativeUrl}` : '';
    }

    function openModal(tab, index) {
        setModalState({ open: true, tab, index });
    }

    function moveModal(direction) {
        setModalState((current) => {
            const list = current.tab === 'annotated'
                ? (galleryData?.annotatedFrames || [])
                : (galleryData?.rawFrames || []);

            if (list.length === 0) return current;

            const nextIndex = (current.index + direction + list.length) % list.length;
            return { ...current, index: nextIndex };
        });
    }

    async function toggleFullscreen() {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
                return;
            }

            if (modalRef.current?.requestFullscreen) {
                await modalRef.current.requestFullscreen();
            }
        } catch (_) {
            // Ignore browser fullscreen errors and keep the modal usable.
        }
    }

    async function downloadImage() {
        if (!modalFrame) return;

        setDownloadError(null);

        try {
            const imageUrl = toImageUrl(modalFrame.url);
            const response = await fetch(imageUrl);

            if (!response.ok) {
                throw new Error(`Failed to download: ${response.statusText}`);
            }

            const blob = await response.blob();

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = modalFrame.filename || `frame-${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('[Frame Download] Error:', error);
            setDownloadError(error.message || 'Failed to download image');

            setTimeout(() => setDownloadError(null), 5000);
        }
    }

    const selectionReady = room && date && period;

    return (
        <>
            <style>{PAGE_CSS}</style>
            <div style={styles.page}>
                <div style={{ maxWidth: 1440, margin: '0 auto' }}>
                    <div style={{ marginBottom: 24 }}>
                        <div style={styles.heading}>Frame Verification</div>
                        <div style={styles.subheading}>
                            Review saved classroom screenshots by room, date, and period. Switch between raw frames and annotated frames, then inspect them in fullscreen.
                        </div>
                    </div>

                    <div style={{ ...styles.card, marginBottom: 20 }}>
                        <div className="frame-filter-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            gap: 16,
                            alignItems: 'end',
                        }}>
                            <div>
                                <label style={styles.label}>Room</label>
                                <select value={room} onChange={(e) => setRoom(e.target.value)} style={styles.select}>
                                    <option value="">Select room</option>
                                    {rooms.map((roomName) => (
                                        <option key={roomName} value={roomName}>{roomName}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={styles.label}>Date</label>
                                <select
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    style={styles.select}
                                    disabled={!room || availabilityLoading}
                                >
                                    <option value="">
                                        {!room ? 'Select room first' : availabilityLoading ? 'Loading dates...' : 'Select date'}
                                    </option>
                                    {availableDates.map((item) => (
                                        <option key={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={styles.label}>Period</label>
                                <select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    style={styles.select}
                                    disabled={!room || availabilityLoading}
                                >
                                    <option value="">
                                        {!room ? 'Select room first' : availabilityLoading ? 'Loading periods...' : 'Select period'}
                                    </option>
                                    {visiblePeriods.map((item) => (
                                        <option key={item} value={item}>{SLOT_LABELS[item] || item}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectionReady && (
                            <div style={{
                                marginTop: 18,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 10,
                                alignItems: 'center',
                            }}>
                                <StatBadge label="Subject" value={classInfo?.subject || (classInfoLoading ? '...' : '-')} tone="success" />
                                <StatBadge label="Faculty" value={classInfo?.faculty || (classInfoLoading ? '...' : '-')} tone="warning" />
                                <StatBadge label="Batch" value={classInfo?.batch || (classInfoLoading ? '...' : '-')} tone="danger" />
                            </div>
                        )}
                    </div>

                    {!room ? (
                        <EmptyState
                            title="Select a room to begin"
                            subtitle="The page loads room options from the timetable module, then shows only dates and periods that actually exist in the saved frame folders."
                        />
                    ) : null}

                    {room && !availabilityLoading && availableDates.length === 0 && availablePeriods.length === 0 ? (
                        <EmptyState
                            title="No frames available"
                            subtitle="No saved classroom screenshots are available for this room. Frames will appear once attendance sessions are recorded and processed."
                        />
                    ) : null}

                    {room && !selectionReady && (availableDates.length > 0 || availablePeriods.length > 0) ? (
                        <EmptyState
                            title="Select date and period"
                            subtitle="Choose a saved date and period to load the verification gallery."
                        />
                    ) : null}

                    {selectionReady ? (
                        <div style={{ display: 'grid', gap: 20 }}>
                            <div style={{ ...styles.card, padding: 18 }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 12,
                                    flexWrap: 'wrap',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 6 }}>
                                            {room} · {SLOT_LABELS[period] || period} · {date}
                                        </div>
                                        <div style={{ fontSize: 13, color: theme.textMuted }}>
                                            {framesLoading ? 'Loading frames...' : 'Open any image to inspect it in the fullscreen viewer.'}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <button
                                            className={`frame-chip ${activeTab === 'annotated' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('annotated')}
                                            type="button"
                                        >
                                            Annotated Frames ({annotatedFrames.length})
                                        </button>
                                        <button
                                            className={`frame-chip ${activeTab === 'raw' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('raw')}
                                            type="button"
                                        >
                                            Raw Frames ({rawFrames.length})
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {framesLoading ? (
                                <EmptyState
                                    title="Loading verification gallery"
                                    subtitle="Reading the saved images from the existing attendance frame folders."
                                />
                            ) : null}

                            {!framesLoading && activeTab === 'raw' && rawFrames.length === 0 ? (
                                <EmptyState
                                    title="No raw frames for this selection"
                                    subtitle="Try switching to annotated frames or choose another saved date and period."
                                />
                            ) : null}

                            {!framesLoading && activeTab === 'annotated' && annotatedFrames.length === 0 ? (
                                <EmptyState
                                    title="No annotated frames for this selection"
                                    subtitle="Try switching to raw frames or choose another saved date and period."
                                />
                            ) : null}

                            {!framesLoading && activeTab === 'raw' && rawFrames.length > 0 ? (
                                <div className="frame-gallery">
                                    {rawFrames.map((frame, index) => (
                                        <button
                                            key={`${frame.filename}-${index}`}
                                            type="button"
                                            className="frame-thumb"
                                            onClick={() => openModal('raw', index)}
                                            style={{
                                                ...styles.card,
                                                padding: 12,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'transform .15s ease, box-shadow .15s ease',
                                            }}
                                        >
                                            <img
                                                src={toImageUrl(frame.url)}
                                                alt={frame.filename}
                                                style={{
                                                    width: '100%',
                                                    height: 180,
                                                    objectFit: 'cover',
                                                    borderRadius: 10,
                                                    border: `1px solid ${theme.border}`,
                                                    marginBottom: 12,
                                                    background: theme.surfaceAlt,
                                                }}
                                            />
                                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 8 }}>
                                                {frame.filename}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {frame.camera != null ? <StatBadge label="Cam" value={frame.camera} tone="success" /> : null}
                                                {frame.elapsedSec != null ? <StatBadge label="Sec" value={frame.elapsedSec} tone="warning" /> : null}
                                                {frame.facesCount != null ? <StatBadge label="Faces" value={frame.facesCount} tone="danger" /> : null}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : null}

                            {!framesLoading && activeTab === 'annotated' && annotatedFrames.length > 0 ? (
                                <div className="frame-gallery">
                                    {annotatedFrames.map((frame, index) => (
                                        <button
                                            key={`${frame.filename}-${index}`}
                                            type="button"
                                            className="frame-thumb"
                                            onClick={() => openModal('annotated', index)}
                                            style={{
                                                ...styles.card,
                                                padding: 12,
                                                textAlign: 'left',
                                                cursor: 'pointer',
                                                transition: 'transform .15s ease, box-shadow .15s ease',
                                            }}
                                        >
                                            <img
                                                src={toImageUrl(frame.url)}
                                                alt={frame.filename}
                                                style={{
                                                    width: '100%',
                                                    height: 180,
                                                    objectFit: 'cover',
                                                    borderRadius: 10,
                                                    border: `1px solid ${theme.border}`,
                                                    marginBottom: 12,
                                                    background: theme.surfaceAlt,
                                                }}
                                            />
                                            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 8 }}>
                                                {frame.filename}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {frame.camera != null ? <StatBadge label="Cam" value={frame.camera} tone="success" /> : null}
                                                {frame.elapsedSec != null ? <StatBadge label="Sec" value={frame.elapsedSec} tone="warning" /> : null}
                                                {frame.facesCount != null ? <StatBadge label="Faces" value={frame.facesCount} tone="danger" /> : null}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                {modalState.open && modalFrame ? (
                    <div
                        onClick={() => setModalState((current) => ({ ...current, open: false }))}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(7, 10, 22, 0.88)',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 24,
                        }}
                    >
                        <div
                            ref={modalRef}
                            onClick={(event) => event.stopPropagation()}
                            style={{
                                width: 'min(1400px, 100%)',
                                maxHeight: '100%',
                                background: '#0c1228',
                                border: '1px solid rgba(228,232,245,0.14)',
                                borderRadius: 18,
                                overflow: 'hidden',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
                                color: '#ffffff',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 12,
                                padding: '16px 18px',
                                borderBottom: '1px solid rgba(228,232,245,0.12)',
                                background: 'rgba(255,255,255,0.03)',
                            }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                                        {modalFrame.filename}
                                    </div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
                                        {modalState.tab === 'annotated' ? 'Annotated frame' : 'Raw frame'} · {modalState.index + 1} of {activeFrames.length}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    <button onClick={() => moveModal(-1)} style={styles.btnGhost} type="button">Previous</button>
                                    <button onClick={() => moveModal(1)} style={styles.btnGhost} type="button">Next</button>
                                    <button onClick={downloadImage} style={styles.btnGhost} type="button" title="Download this image">↓ Download</button>
                                    <button onClick={toggleFullscreen} style={styles.btnPrimary} type="button">
                                        {fullscreenActive ? 'Exit Fullscreen' : 'Fullscreen'}
                                    </button>
                                    <button
                                        onClick={() => setModalState((current) => ({ ...current, open: false }))}
                                        style={styles.btnGhost}
                                        type="button"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            <div className="frame-modal-body" style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) 280px',
                                gap: 0,
                            }}>
                                <div style={{
                                    padding: 18,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#060b18',
                                    minHeight: 420,
                                }}>
                                    <img
                                        src={toImageUrl(modalFrame.url)}
                                        alt={modalFrame.filename}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '72vh',
                                            objectFit: 'contain',
                                            borderRadius: 14,
                                            boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
                                        }}
                                    />
                                </div>

                                <div style={{
                                    padding: 18,
                                    borderLeft: '1px solid rgba(228,232,245,0.12)',
                                    background: 'rgba(255,255,255,0.03)',
                                }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.62)', marginBottom: 12 }}>
                                        Class Details
                                    </div>

                                    <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                                        <StatBadge label="Subject" value={classInfo?.subject || '-'} tone="success" />
                                        <StatBadge label="Faculty" value={classInfo?.faculty || '-'} tone="warning" />
                                        <StatBadge label="Batch" value={classInfo?.batch || '-'} tone="danger" />
                                    </div>

                                    {downloadError && (
                                        <div style={{
                                            padding: 12,
                                            borderRadius: 8,
                                            background: 'rgba(239,68,68,0.15)',
                                            border: '1px solid rgba(239,68,68,0.3)',
                                            marginTop: 12,
                                        }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', marginBottom: 4 }}>Download Error</div>
                                            <div style={{ fontSize: 12, color: '#fecaca', lineHeight: 1.4 }}>{downloadError}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </>
    );
}