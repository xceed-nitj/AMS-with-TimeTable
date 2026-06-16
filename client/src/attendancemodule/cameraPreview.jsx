// client/src/attendancemodule/cameraPreview.jsx
// Redesigned: Room selector → auto-starts both camera feeds simultaneously. Light theme.

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
  const color = isError
    ? theme.danger
    : isWarning
      ? theme.warning
      : theme.success;
  const bg = isError
    ? theme.dangerDim
    : isWarning
      ? theme.warningDim
      : theme.successDim;
  return (
    <div
      style={{
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
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      {toast.msg}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      style={{ ...styles.badge(statusColor(status)), display: 'inline-block' }}
    >
      {status || 'offline'}
    </span>
  );
}

// Single camera feed panel
function FeedPanel({ camera, quality, scale, onError }) {
  const [feedKey, setFeedKey] = useState(0);
  const [starting, setStarting] = useState(true);
  const [failed, setFailed] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);

  const startFeed = useCallback(() => {
    if (!camera?._id) return;

    // Don't attempt connection for offline cameras
    if (camera?.status === 'offline') {
      setStarting(false);
      setFailed(false);
      setStreamUrl(null);
      return;
    }

    setStarting(true);
    setFailed(false);
    setStreamUrl(null);

    fetch(`${CAMERA_API}/${camera._id}/preview/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
      .then((res) => res.json())
      .then(() => {
        setStreamUrl(
          `${CAMERA_API}/preview/stream?quality=${quality}&scale=${scale}&t=${Date.now()}`,
        );
        setFeedKey((k) => k + 1);
        setStarting(false);
      })
      .catch((err) => {
        setStarting(false);
        setFailed(true);
        onError?.(
          `Could not start feed for ${camera.cameraId}: ${err.message}`,
        );
      });
  }, [camera?._id, quality, scale]);

  useEffect(() => {
    startFeed();
    return () => {
      fetch(`${CAMERA_API}/preview/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      }).catch(() => {});
    };
  }, [camera?._id]);

  useEffect(() => {
    if (streamUrl) {
      setStreamUrl(
        `${CAMERA_API}/preview/stream?quality=${quality}&scale=${scale}&t=${Date.now()}`,
      );
      setFeedKey((k) => k + 1);
    }
  }, [quality, scale]);

  const positionLabel = camera?.position?.toLowerCase().includes('left')
    ? 'Front Left'
    : 'Front Right';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: theme.surface,
        border: `1px solid ${streamUrl && !failed ? theme.accent : theme.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(26,31,60,0.07)',
        transition: 'border-color 0.3s',
      }}
    >
      {/* Feed header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.border}`,
          background: theme.surfaceAlt,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: theme.accentDim,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            📷
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: theme.text }}>
              {camera?.cameraId}
            </div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
              {positionLabel} · {camera?.ipAddress}:{camera?.port}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {starting && (
            <span style={{ fontSize: 11, color: theme.textMuted }}>
              Connecting...
            </span>
          )}
          <StatusBadge status={camera?.status} />
        </div>
      </div>

      {/* Video frame */}
      <div
        style={{
          position: 'relative',
          background: starting || failed ? theme.surfaceAlt : '#0a0c14',
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {camera?.status === 'offline' ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📵</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: theme.textMuted,
                marginBottom: 6,
              }}
            >
              Camera Offline
            </div>
            <div
              style={{ color: theme.textMuted, fontSize: 12, lineHeight: 1.6 }}
            >
              This camera is currently unreachable.
            </div>
          </div>
        ) : starting ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `3px solid ${theme.border}`,
                borderTopColor: theme.accent,
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            <div
              style={{ color: theme.textMuted, fontSize: 13, fontWeight: 600 }}
            >
              Starting feed...
            </div>
          </div>
        ) : failed ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: theme.danger,
                marginBottom: 6,
              }}
            >
              Failed to start feed
            </div>
            <div
              style={{
                color: theme.textMuted,
                fontSize: 12,
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Timed out waiting for first frame from RTSP stream.
            </div>
            <button
              type="button"
              onClick={startFeed}
              style={{ ...styles.btnGhost, fontSize: 12, padding: '8px 20px' }}
            >
              Retry
            </button>
          </div>
        ) : streamUrl ? (
          <img
            key={feedKey}
            src={streamUrl}
            alt={`${camera?.cameraId} live feed`}
            style={{ width: '100%', display: 'block', objectFit: 'contain' }}
            onError={() => {
              setFailed(true);
              onError?.(`Stream error on ${camera?.cameraId}. Check RTSP URL.`);
            }}
          />
        ) : null}
      </div>

      {/* Stream URL footer */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: `1px solid ${theme.border}`,
          background: theme.surfaceAlt,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: theme.textMuted,
            fontFamily: theme.fontMono,
            wordBreak: 'break-all',
          }}
        >
          {camera?.protocol?.toLowerCase()} · {camera?.ipAddress}:{camera?.port}
        </span>
        <span
          style={{
            fontSize: 10,
            color: theme.textMuted,
            fontFamily: theme.fontMono,
            wordBreak: 'break-all',
            textAlign: 'right',
          }}
        >
          {camera?.streamUrl}
        </span>
      </div>
    </div>
  );
}

export default function CameraPreview() {
  const [cameras, setCameras] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [roomCameras, setRoomCameras] = useState({ left: null, right: null });
  const [loading, setLoading] = useState(false);
  const [previewQuality, setPreviewQuality] = useState('90');
  const [previewScale, setPreviewScale] = useState('1');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const fetchCameras = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${CAMERA_API}?liveStatus=true`);
      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : [];
      setCameras(list);

      const uniqueRooms = [
        ...new Set(list.map((c) => c.roomId).filter(Boolean)),
      ].sort();
      setRooms(uniqueRooms);

      if (uniqueRooms.length > 0) {
        setSelectedRoom((prev) => prev || uniqueRooms[0]);
      }
    } catch (err) {
      showToast(`Could not load cameras: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  useEffect(() => {
    if (!selectedRoom) {
      setRoomCameras({ left: null, right: null });
      return;
    }
    const roomList = cameras.filter((c) => c.roomId === selectedRoom);
    const left =
      roomList.find((c) => c.position?.toLowerCase().includes('left')) ||
      roomList[0] ||
      null;
    const right =
      roomList.find((c) => c.position?.toLowerCase().includes('right')) ||
      roomList[1] ||
      null;
    setRoomCameras({ left, right });
  }, [selectedRoom, cameras]);

  const cameraCount = [roomCameras.left, roomCameras.right].filter(
    Boolean,
  ).length;

  return (
    <div style={styles.page}>
      <style>{`
                ${cssReset}
                .preview-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 10px;
                    margin-bottom: 18px;
                }
                .controls-bar {
                    display: flex;
                    gap: 14px;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    padding: 18px 24px;
                    background: ${theme.surface};
                    border: 1px solid ${theme.border};
                    border-radius: 12px;
                    margin-bottom: 18px;
                    box-shadow: 0 1px 6px rgba(26,31,60,0.05);
                }
                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    min-width: 180px;
                }
                .dual-feed-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 18px;
                }
                .empty-slot {
                    border: 2px dashed ${theme.border};
                    border-radius: 14px;
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: ${theme.textMuted};
                    background: ${theme.surfaceAlt};
                    gap: 8px;
                }
                .room-info-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    background: ${theme.surface};
                    border: 1px solid ${theme.border};
                    border-radius: 10px;
                    margin-bottom: 14px;
                    font-size: 13px;
                    color: ${theme.textMuted};
                    box-shadow: 0 1px 4px rgba(26,31,60,0.04);
                }
                @media (max-width: 860px) {
                    .dual-feed-grid { grid-template-columns: 1fr !important; }
                    .controls-bar   { flex-direction: column; align-items: stretch; }
                    .control-group  { min-width: unset !important; width: 100%; }
                }
                @media (max-width: 600px) {
                    .room-info-bar  { flex-wrap: wrap; gap: 8px; }
                }
            `}</style>

      <Toast toast={toast} />

      {/* Compact header */}
      <div className="preview-header">
        <div>
          <div style={styles.heading}>Camera Live Preview</div>
          <div style={{ ...styles.subheading, marginBottom: 0 }}>Select a room to view both camera feeds side by side</div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-bar">
        <div className="control-group" style={{ minWidth: 220 }}>
          <label style={styles.label}>Select Room</label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            style={{ ...styles.select, fontWeight: 700, fontSize: 15 }}
            disabled={loading}
          >
            {rooms.length === 0 && <option value="">No rooms found</option>}
            {rooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label style={styles.label}>Preview Quality</label>
          <select
            value={previewQuality}
            onChange={(e) => setPreviewQuality(e.target.value)}
            style={styles.select}
          >
            <option value="30">30 — low bandwidth</option>
            <option value="60">60 — balanced</option>
            <option value="75">75 — sharp</option>
            <option value="90">90 — very sharp</option>
            <option value="95">95 — maximum</option>
          </select>
        </div>

        <div className="control-group">
          <label style={styles.label}>Preview Scale</label>
          <select
            value={previewScale}
            onChange={(e) => setPreviewScale(e.target.value)}
            style={styles.select}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchCameras}
          disabled={loading}
          style={{ ...styles.btnGhost, alignSelf: 'flex-end' }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Room info bar */}
      {selectedRoom && (
        <div className="room-info-bar">
          <span>Room</span>
          <strong style={{ color: theme.text, fontSize: 14 }}>
            {selectedRoom}
          </strong>
          <span>·</span>
          <span>
            {cameraCount} camera{cameraCount !== 1 ? 's' : ''} found
          </span>
          {roomCameras.left && (
            <>
              <span>·</span>
              <span style={{ color: theme.text, fontWeight: 600 }}>
                {roomCameras.left.cameraId}
              </span>
              <StatusBadge status={roomCameras.left.status} />
            </>
          )}
          {roomCameras.right && (
            <>
              <span>·</span>
              <span style={{ color: theme.text, fontWeight: 600 }}>
                {roomCameras.right.cameraId}
              </span>
              <StatusBadge status={roomCameras.right.status} />
            </>
          )}
        </div>
      )}

      {/* Dual feed */}
      {!selectedRoom ? (
        <div
          style={{
            textAlign: 'center',
            padding: 64,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 14,
            color: theme.textMuted,
            fontSize: 14,
          }}
        >
          Select a room above to start viewing feeds.
        </div>
      ) : (
        <div className="dual-feed-grid">
          {roomCameras.left ? (
            <FeedPanel
              camera={roomCameras.left}
              quality={previewQuality}
              scale={previewScale}
              onError={(msg) => showToast(msg, 'warning')}
            />
          ) : (
            <div className="empty-slot">
              <span style={{ fontSize: 28 }}>📷</span>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>
                Second camera not registered
              </div>
              <div style={{ fontSize: 12 }}>
                Add a second camera for <strong>{selectedRoom}</strong> on the
                camera data-entry page.
              </div>
            </div>
          )}

          {roomCameras.right ? (
            <FeedPanel
              camera={roomCameras.right}
              quality={previewQuality}
              scale={previewScale}
              onError={(msg) => showToast(msg, 'warning')}
            />
          ) : (
            <div className="empty-slot">
              <span style={{ fontSize: 28 }}>📷</span>
              <div style={{ fontWeight: 700, fontSize: 14, color: theme.text }}>
                Second camera not registered
              </div>
              <div style={{ fontSize: 12 }}>
                Add a second camera for <strong>{selectedRoom}</strong> on the
                camera data-entry page.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
