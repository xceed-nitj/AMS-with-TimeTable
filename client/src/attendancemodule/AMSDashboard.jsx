// client/src/attendancemodule/AMSDashboard.jsx
// Central dashboard for the Attendance Management System.
// Routes covered: /rtsp, /assign, /photos, /reports, /cameras, /embeddings

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const API_BASE = `${apiUrl}/attendancemodule/ground-truth`;
const CAM_API  = `${apiUrl}/attendancemodule/cameras`;
const EMB_API  = `${apiUrl}/attendancemodule/embeddings`;
const REPORT_API = `${apiUrl}/attendancemodule/reports`;

// ─── Design tokens (matches existing config.js theme) ──────────────────────
const T = {
  bg:         '#080b14',
  surface:    '#0f1424',
  surfaceAlt: '#141929',
  border:     '#1e2540',
  borderHi:   '#2d3561',
  text:       '#dde4ff',
  textMuted:  '#5a6490',
  accent:     '#38bdf8',
  accentDim:  'rgba(56,189,248,0.10)',
  accentGlow: 'rgba(56,189,248,0.25)',
  success:    '#34d399',
  successDim: 'rgba(52,211,153,0.10)',
  warning:    '#fbbf24',
  warningDim: 'rgba(251,191,36,0.10)',
  danger:     '#f87171',
  dangerDim:  'rgba(248,113,113,0.10)',
  purple:     '#a78bfa',
  purpleDim:  'rgba(167,139,250,0.10)',
  teal:       '#2dd4bf',
  tealDim:    'rgba(45,212,191,0.10)',
  orange:     '#fb923c',
  orangeDim:  'rgba(251,146,60,0.10)',
  fontMono:   "'JetBrains Mono', 'Fira Code', monospace",
  fontBody:   "'DM Sans', 'Segoe UI', sans-serif",
  fontDisplay:"'Space Grotesk', 'DM Sans', sans-serif",
};

// ─── CSS injected once ─────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(12px);} to { opacity:1; transform:translateY(0);} }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse    { 0%,100% { opacity:1; } 50% { opacity:.35; } }
  @keyframes spin     { to { transform: rotate(360deg); } }
  @keyframes shimmer  { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
  @keyframes glow     { 0%,100% { box-shadow: 0 0 8px ${T.accentGlow}; } 50% { box-shadow: 0 0 24px ${T.accentGlow}; } }
  @keyframes countUp  { from { opacity:0; transform:scale(.8); } to { opacity:1; transform:scale(1); } }
  .ams-card-hover { transition: transform .2s, box-shadow .2s, border-color .2s; }
  .ams-card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,.6); }
  .ams-btn { transition: transform .15s, opacity .15s; cursor: pointer; }
  .ams-btn:hover { opacity: .85; transform: translateY(-1px); }
  .ams-btn:active { transform: translateY(0); }
  .ams-link-card:hover .ams-link-arrow { transform: translateX(4px); }
  .ams-link-arrow { transition: transform .2s; display: inline-block; }
  .stat-animate { animation: countUp .5s ease both; }
`;

// ─── Module definitions ────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'rtsp',
    route: '/attendance/groundtruth/rtsp',
    label: 'RTSP Capture',
    shortLabel: 'RTSP',
    icon: '📡',
    color: T.accent,
    colorDim: T.accentDim,
    desc: 'Live stream ground-truth acquisition from RTSP cameras. Start/stop per camera with real-time face detection preview.',
    tags: ['live', 'capture', 'cameras'],
  },
  {
    id: 'assign',
    route: '/attendance/groundtruth/assign',
    label: 'Roll Assignment',
    shortLabel: 'Assign',
    icon: '🎯',
    color: T.success,
    colorDim: T.successDim,
    desc: 'Match detected face clusters to student roll numbers. Approve high-confidence matches and flag low-confidence ones for review.',
    tags: ['matching', 'erp', 'approval'],
  },
  {
    id: 'photos',
    route: '/attendance/groundtruth/photos',
    label: 'Photo Editor',
    shortLabel: 'Photos',
    icon: '🖼️',
    color: T.purple,
    colorDim: T.purpleDim,
    desc: 'Manage ground-truth photos. Review pre-ERP person clusters and post-ERP matched student images. Delete bad frames.',
    tags: ['photos', 'clusters', 'ground-truth'],
  },
  {
    id: 'reports',
    route: '/attendance/reports',
    label: 'Attendance Reports',
    shortLabel: 'Reports',
    icon: '📊',
    color: T.teal,
    colorDim: T.tealDim,
    desc: 'Generate live attendance reports via RTSP stream. Auto-lookup from timetable. Dual-camera support for large halls.',
    tags: ['report', 'live', 'timetable'],
  },
  {
    id: 'cameras',
    route: '/cameras',
    label: 'Camera Registry',
    shortLabel: 'Cameras',
    icon: '📷',
    color: T.orange,
    colorDim: T.orangeDim,
    desc: 'Register, edit and monitor all cameras. Assign rooms, set stream URLs, track online/offline/maintenance status.',
    tags: ['cameras', 'registry', 'rtsp'],
  },
  {
    id: 'embeddings',
    route: '/attendance/embeddings',
    label: 'Embedding Generation',
    shortLabel: 'Embeddings',
    icon: '🧠',
    color: T.warning,
    colorDim: T.warningDim,
    desc: 'Build face embedding vectors for enrolled students. Track per-student and batch progress. Regenerate on demand.',
    tags: ['ml', 'embeddings', 'model'],
  },
];

// ─── Small Dot indicator ────────────────────────────────────────────────────
function Dot({ color, pulse }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, flexShrink: 0,
      animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, colorDim, loading, delay = 0 }) {
  return (
    <div className="ams-card-hover" style={{
      background: colorDim,
      border: `1px solid ${color}33`,
      borderRadius: 12,
      padding: '18px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      animation: `fadeUp .5s ease both`,
      animationDelay: `${delay}ms`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* shimmer on load */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `linear-gradient(90deg, transparent, ${color}15, transparent)`,
            animation: 'shimmer 1.4s infinite',
          }} />
        </div>
      )}
      <div style={{ fontSize: 22, lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontSize: 28, fontWeight: 700, color: color,
        fontFamily: T.fontDisplay, letterSpacing: '-0.03em',
        animation: 'countUp .4s ease both',
      }}>
        {loading ? '—' : value ?? '—'}
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Module card ────────────────────────────────────────────────────────────
function ModuleCard({ module, onClick, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="ams-card-hover ams-link-card"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? module.colorDim : T.surface,
        border: `1.5px solid ${hovered ? module.color + '60' : T.border}`,
        borderRadius: 14,
        padding: '24px',
        cursor: 'pointer',
        animation: `fadeUp .5s ease both`,
        animationDelay: `${index * 60}ms`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* top glow bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: hovered
          ? `linear-gradient(90deg, transparent, ${module.color}, transparent)`
          : 'transparent',
        transition: 'background .25s',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: module.colorDim,
          border: `1px solid ${module.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {module.icon}
        </div>
        <span className="ams-link-arrow" style={{ color: module.color, fontSize: 20, opacity: hovered ? 1 : .4, marginTop: 4 }}>→</span>
      </div>

      <div style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 15, color: T.text, marginBottom: 8 }}>
        {module.label}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginBottom: 14 }}>
        {module.desc}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {module.tags.map(t => (
          <span key={t} style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 99,
            background: module.colorDim, color: module.color,
            fontFamily: T.fontMono, fontWeight: 600,
            border: `1px solid ${module.color}30`,
          }}>
            {t}
          </span>
        ))}
      </div>

      {/* route pill */}
      <div style={{
        marginTop: 16, paddingTop: 12,
        borderTop: `1px solid ${T.border}`,
        fontSize: 10, fontFamily: T.fontMono, color: T.textMuted,
      }}>
        {module.route}
      </div>
    </div>
  );
}

// ─── Activity log entry ─────────────────────────────────────────────────────
function LogEntry({ entry, index }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '10px 0',
      borderBottom: `1px solid ${T.border}`,
      animation: `fadeUp .3s ease both`,
      animationDelay: `${index * 40}ms`,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{entry.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: T.text, marginBottom: 2 }}>{entry.msg}</div>
        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>{entry.time}</div>
      </div>
      <span style={{
        fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 700,
        background: entry.type === 'success' ? T.successDim : entry.type === 'warn' ? T.warningDim : T.accentDim,
        color: entry.type === 'success' ? T.success : entry.type === 'warn' ? T.warning : T.accent,
        flexShrink: 0,
      }}>
        {entry.tag}
      </span>
    </div>
  );
}

// ─── Camera status strip ────────────────────────────────────────────────────
function CameraStrip({ cameras, loading }) {
  if (loading) return (
    <div style={{ color: T.textMuted, fontSize: 12, padding: '8px 0' }}>Loading cameras…</div>
  );
  if (!cameras.length) return (
    <div style={{ color: T.textMuted, fontSize: 12, padding: '8px 0' }}>No cameras registered yet.</div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {cameras.map((cam, i) => {
        const isOnline = cam.status === 'online';
        const isMaint = cam.status === 'maintenance';
        const dotColor = isOnline ? T.success : isMaint ? T.warning : T.danger;
        return (
          <div key={cam._id || i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: T.surfaceAlt, borderRadius: 8, padding: '10px 14px',
            border: `1px solid ${T.border}`,
            animation: `fadeUp .3s ease both`,
            animationDelay: `${i * 50}ms`,
          }}>
            <Dot color={dotColor} pulse={isOnline} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                {cam.cameraId || 'Unknown'}
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cam.ipAddress}:{cam.port} — {cam.protocol?.toUpperCase() || 'RTSP'}
              </div>
            </div>
            <span style={{
              fontSize: 9, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
              background: isOnline ? T.successDim : isMaint ? T.warningDim : T.dangerDim,
              color: isOnline ? T.success : isMaint ? T.warning : T.danger,
              textTransform: 'uppercase', letterSpacing: '.06em',
            }}>
              {cam.status || 'offline'}
            </span>
            {cam.roomId && (
              <span style={{ fontSize: 9, color: T.textMuted, fontFamily: T.fontMono }}>
                {cam.roomId}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Quick-action button ────────────────────────────────────────────────────
function QuickBtn({ icon, label, color, colorDim, onClick, delay = 0 }) {
  return (
    <button
      className="ams-btn"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: colorDim, border: `1px solid ${color}40`,
        borderRadius: 10, padding: '12px 16px', width: '100%',
        color: color, fontFamily: T.fontBody, fontSize: 13, fontWeight: 600,
        animation: `fadeUp .4s ease both`, animationDelay: `${delay}ms`,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
      <span style={{ marginLeft: 'auto', fontSize: 16, opacity: .6 }}>›</span>
    </button>
  );
}

// ─── Section heading ────────────────────────────────────────────────────────
function SectionHead({ title, sub, color = T.accent }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
        <span style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 15, color: T.text }}>
          {title}
        </span>
      </div>
      {sub && <div style={{ fontSize: 11, color: T.textMuted, paddingLeft: 13 }}>{sub}</div>}
    </div>
  );
}

// ─── Room-wise Camera Preview Section ──────────────────────────────────────
function RoomCameraPreview({ cameras, camLoading }) {
  const [activeCamera, setActiveCamera] = useState(null);     // camera object being previewed
  const [previewRunning, setPreviewRunning] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Group cameras by roomId
  const roomGroups = cameras.reduce((acc, cam) => {
    const room = cam.roomId || 'UNKNOWN';
    if (!acc[room]) acc[room] = { roomId: room, building: cam.building || '', cameras: [] };
    acc[room].cameras.push(cam);
    return acc;
  }, {});
  const rooms = Object.values(roomGroups).sort((a, b) => a.roomId.localeCompare(b.roomId));

  const startPreview = async (camera) => {
    setActionLoading(true);
    setPreviewError(false);
    try {
      await fetch(`${CAM_API}/${camera._id}/preview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        credentials: 'include',
      });
      setActiveCamera(camera);
      setPreviewRunning(true);
      setPreviewKey(k => k + 1);
    } catch (err) {
      setPreviewError(true);
    } finally {
      setActionLoading(false);
    }
  };

  const stopPreview = async () => {
    setActionLoading(true);
    try {
      await fetch(`${CAM_API}/preview/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        credentials: 'include',
      });
    } catch (_) {}
    setPreviewRunning(false);
    setActiveCamera(null);
    setActionLoading(false);
  };

  if (camLoading) return (
    <div style={{ color: T.textMuted, fontSize: 13, padding: '12px 0' }}>Loading cameras…</div>
  );
  if (!cameras.length) return (
    <div style={{ color: T.textMuted, fontSize: 13, padding: '12px 0' }}>
      No cameras registered. Add cameras via Camera Registry.
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* ── Room grid (left) ── */}
      <div style={{ flex: '1 1 380px', minWidth: 0 }}>
        {rooms.map((room, ri) => (
          <div
            key={room.roomId}
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: '16px',
              marginBottom: 14,
              animation: `fadeUp .4s ease both`,
              animationDelay: `${ri * 60}ms`,
            }}
          >
            {/* Room header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🏫</span>
              <div>
                <div style={{
                  fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 14, color: T.text,
                }}>
                  Room: {room.roomId}
                </div>
                {room.building && (
                  <div style={{ fontSize: 11, color: T.textMuted }}>{room.building}</div>
                )}
              </div>
              <span style={{
                marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 99,
                background: T.accentDim, color: T.accent, fontWeight: 700,
                border: `1px solid ${T.accent}30`,
              }}>
                {room.cameras.length} cam{room.cameras.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Camera cards inside room */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {['front-left', 'front-right'].map(pos => {
                const cam = room.cameras.find(c => c.position === pos);
                const isActive = activeCamera?._id === cam?._id && previewRunning;
                const isOnline = cam?.status === 'online';
                const isMaint  = cam?.status === 'maintenance';
                const dotColor = !cam ? T.border : isOnline ? T.success : isMaint ? T.warning : T.danger;

                return (
                  <div
                    key={pos}
                    style={{
                      flex: '1 1 160px',
                      background: isActive ? T.accentDim : T.surfaceAlt,
                      border: `1.5px solid ${isActive ? T.accent : cam ? T.border : T.border + '55'}`,
                      borderRadius: 10,
                      padding: '12px',
                      opacity: cam ? 1 : 0.4,
                      transition: 'border .2s, background .2s',
                    }}
                  >
                    {/* Position label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', background: dotColor,
                        display: 'inline-block', flexShrink: 0,
                        animation: isOnline ? 'pulse 1.5s ease-in-out infinite' : 'none',
                      }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        {pos === 'front-left' ? '◀ Front Left' : 'Front Right ▶'}
                      </span>
                    </div>

                    {cam ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                          {cam.cameraId}
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, marginBottom: 4 }}>
                          {cam.ipAddress}:{cam.port}
                        </div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 10 }}>
                          {cam.protocol?.toUpperCase()} · {cam.resolution?.width || 1920}×{cam.resolution?.height || 1080}
                        </div>

                        {/* Status badge */}
                        <span style={{
                          fontSize: 9, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                          background: isOnline ? T.successDim : isMaint ? T.warningDim : T.dangerDim,
                          color: isOnline ? T.success : isMaint ? T.warning : T.danger,
                          textTransform: 'uppercase', letterSpacing: '.06em',
                          display: 'inline-block', marginBottom: 10,
                        }}>
                          {cam.status || 'offline'}
                        </span>

                        {/* Preview button */}
                        <button
                          onClick={() => isActive ? stopPreview() : startPreview(cam)}
                          disabled={actionLoading}
                          style={{
                            width: '100%', padding: '7px 0', borderRadius: 7, fontSize: 11,
                            fontWeight: 700, cursor: actionLoading ? 'wait' : 'pointer',
                            border: `1px solid ${isActive ? T.danger + '60' : T.accent + '50'}`,
                            background: isActive ? T.dangerDim : T.accentDim,
                            color: isActive ? T.danger : T.accent,
                            fontFamily: T.fontBody, transition: 'all .15s',
                          }}
                        >
                          {actionLoading && activeCamera?._id === cam._id
                            ? 'Loading…'
                            : isActive
                            ? '⏹ Stop Preview'
                            : '▶ Preview'}
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', padding: '8px 0' }}>
                        No camera at this position
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Live preview panel (right) ── */}
      <div style={{
        flex: '0 0 360px', position: 'sticky', top: 24,
        background: T.surface, border: `1px solid ${previewRunning ? T.accent + '60' : T.border}`,
        borderRadius: 14, overflow: 'hidden',
        transition: 'border .25s',
        animation: 'fadeUp .5s ease both',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: previewRunning ? T.success : T.textMuted,
            animation: previewRunning ? 'pulse 1.5s ease-in-out infinite' : 'none',
            display: 'inline-block',
          }} />
          <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>
            {activeCamera ? `${activeCamera.cameraId} — ${activeCamera.roomId}` : 'Camera Preview'}
          </span>
          {activeCamera && (
            <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>
              {activeCamera.position}
            </span>
          )}
        </div>

        {/* Stream frame */}
        <div style={{
          background: '#02040a', minHeight: 280,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {previewRunning ? (
            <img
              key={previewKey}
              src={`${CAM_API}/preview/stream?quality=70&scale=0.75&t=${previewKey}`}
              alt="Live feed"
              style={{ width: '100%', display: 'block', objectFit: 'contain' }}
              onError={() => setPreviewError(true)}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📷</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                No feed active
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
                Click ▶ Preview on any camera card to start live feed
              </div>
            </div>
          )}
          {previewError && (
            <div style={{
              position: 'absolute', inset: 0, background: T.dangerDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8,
            }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <span style={{ fontSize: 12, color: T.danger, fontWeight: 700 }}>Stream unavailable</span>
              <span style={{ fontSize: 10, color: T.textMuted }}>Check ML service & camera RTSP URL</span>
            </div>
          )}
        </div>

        {/* Panel footer */}
        {activeCamera && (
          <div style={{
            padding: '12px 16px', borderTop: `1px solid ${T.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono }}>
              {activeCamera.ipAddress}:{activeCamera.port} · {activeCamera.protocol?.toUpperCase()}
            </div>
            <button
              onClick={stopPreview}
              disabled={actionLoading}
              style={{
                fontSize: 10, padding: '4px 10px', borderRadius: 6,
                background: T.dangerDim, color: T.danger,
                border: `1px solid ${T.danger}40`, fontWeight: 700,
                cursor: 'pointer', fontFamily: T.fontBody,
              }}
            >
              ⏹ Stop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function AMSDashboard() {
  const navigate = useNavigate();

  // Stats state
  const [stats, setStats] = useState({ students: null, cameras: null, embeddings: null, reports: null });
  const [statsLoading, setStatsLoading] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [camLoading, setCamLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [embeddingStats, setEmbeddingStats] = useState(null);

  // Fetch camera list
  useEffect(() => {
    fetch(`${CAM_API}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setCameras(Array.isArray(data) ? data : []); })
      .catch(() => setCameras([]))
      .finally(() => setCamLoading(false));
  }, []);

  // Fetch ground-truth student count
  useEffect(() => {
    Promise.allSettled([
      fetch(`${API_BASE}/stats`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch(`${EMB_API}/stats`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
      fetch(`${REPORT_API}/recent?limit=5`, { credentials: 'include' }).then(r => r.ok ? r.json() : null),
    ]).then(([gtRes, embRes, repRes]) => {
      const gt  = gtRes.value;
      const emb = embRes.value;
      const rep = repRes.value;

      setStats({
        students:   gt?.total_students   ?? gt?.total   ?? null,
        cameras:    null,   // filled from cameras list below
        embeddings: emb?.total_embedded  ?? emb?.done   ?? null,
        reports:    Array.isArray(rep) ? rep.length : (rep?.total ?? null),
      });

      if (emb) setEmbeddingStats(emb);

      // Build activity log from recent data
      const log = [];
      if (rep && Array.isArray(rep)) {
        rep.slice(0, 3).forEach((r, i) => {
          log.push({
            icon: '📊',
            msg: `Report generated — ${r.room || r.batch || 'Unknown room'} (${r.period || r.slot || '—'})`,
            time: r.createdAt ? new Date(r.createdAt).toLocaleString() : 'Recently',
            type: 'success',
            tag: 'report',
          });
        });
      }
      if (emb?.recent_jobs) {
        emb.recent_jobs.slice(0, 2).forEach(j => {
          log.push({
            icon: '🧠',
            msg: `Embeddings — ${j.batch || 'batch'} (${j.done}/${j.total} done)`,
            time: j.updatedAt ? new Date(j.updatedAt).toLocaleString() : 'Recently',
            type: j.status === 'done' ? 'success' : 'info',
            tag: 'embed',
          });
        });
      }
      if (!log.length) {
        log.push({ icon: '✅', msg: 'Dashboard loaded successfully', time: new Date().toLocaleString(), type: 'success', tag: 'system' });
      }
      setActivityLog(log);
      setStatsLoading(false);
    });
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Cameras count in stats
  const onlineCams = cameras.filter(c => c.status === 'online').length;
  const totalCams = cameras.length;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100vh',
        background: T.bg,
        color: T.text,
        fontFamily: T.fontBody,
        padding: '28px 36px',
      }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 36,
          animation: 'fadeUp .5s ease both',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: T.accentDim, border: `1px solid ${T.accent}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                👁️
              </div>
              <div>
                <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 22, letterSpacing: '-0.03em' }}>
                  AMS Dashboard
                </div>
                <div style={{ fontSize: 11, color: T.textMuted }}>
                  Attendance Management System — Face Recognition Module
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: T.fontMono, fontSize: 13, color: T.accent }}>
              {currentTime.toLocaleTimeString()}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </div>
            {/* Live camera badge */}
            {totalCams > 0 && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                <Dot color={onlineCams > 0 ? T.success : T.danger} pulse={onlineCams > 0} />
                <span style={{ fontSize: 10, color: onlineCams > 0 ? T.success : T.textMuted, fontWeight: 600 }}>
                  {onlineCams}/{totalCams} cameras online
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Stat row ────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 14,
          marginBottom: 36,
        }}>
          <StatCard label="Enrolled Students"  value={stats.students}   icon="🎓" color={T.accent}   colorDim={T.accentDim}   loading={statsLoading} delay={0} />
          <StatCard label="Cameras Registered" value={totalCams || '—'} icon="📷" color={T.orange}   colorDim={T.orangeDim}   loading={camLoading}   delay={60} />
          <StatCard label="Online Now"          value={onlineCams || 0}  icon="🔴" color={T.success}  colorDim={T.successDim}  loading={camLoading}   delay={120} />
          <StatCard label="Embeddings Done"     value={stats.embeddings} icon="🧠" color={T.warning}  colorDim={T.warningDim}  loading={statsLoading} delay={180} />
          <StatCard label="Recent Reports"      value={stats.reports}    icon="📊" color={T.teal}     colorDim={T.tealDim}     loading={statsLoading} delay={240} />
        </div>

        {/* ── Main grid: modules + sidebar ───────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 24,
          alignItems: 'start',
        }}>

          {/* ── Left: modules ──────────────────────────────────────────── */}
          <div>
            <SectionHead title="Modules" sub="Click to navigate to a module" />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {MODULES.map((mod, i) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  index={i}
                  onClick={() => navigate(mod.route)}
                />
              ))}
            </div>

            {/* ── Embedding progress bar (if data available) ─────────── */}
            {embeddingStats && (embeddingStats.total_students || embeddingStats.total) > 0 && (
              <div style={{
                marginTop: 24,
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '20px 24px',
                animation: 'fadeUp .5s ease .3s both',
              }}>
                <SectionHead
                  title="Embedding Coverage"
                  sub="Progress of face embedding generation across enrolled students"
                  color={T.warning}
                />
                {(() => {
                  const total = embeddingStats.total_students || embeddingStats.total || 0;
                  const done  = embeddingStats.total_embedded || embeddingStats.done  || 0;
                  const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: T.textMuted }}>{done} of {total} students</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.warning, fontFamily: T.fontMono }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: T.border, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(90deg, ${T.warning}, ${T.orange})`,
                          borderRadius: 4, transition: 'width .6s ease',
                        }} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                        {[
                          { label: 'Embedded', val: done,          color: T.warning },
                          { label: 'Pending',  val: total - done,  color: T.textMuted },
                          { label: 'Failed',   val: embeddingStats.failed || 0, color: T.danger },
                        ].map(({ label, val, color }) => (
                          <div key={label} style={{ fontSize: 11 }}>
                            <span style={{ color: T.textMuted }}>{label}: </span>
                            <span style={{ fontWeight: 700, color, fontFamily: T.fontMono }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* ── Pipeline overview ─────────────────────────────────────── */}
            <div style={{
              marginTop: 24,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '20px 24px',
              animation: 'fadeUp .5s ease .4s both',
            }}>
              <SectionHead title="Recognition Pipeline" sub="End-to-end flow for face-based attendance" color={T.purple} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
                {[
                  { step: '01', label: 'RTSP Capture',    icon: '📡', color: T.accent,   route: '/attendance/groundtruth/rtsp' },
                  { step: '02', label: 'Roll Assignment',  icon: '🎯', color: T.success,  route: '/attendance/groundtruth/assign' },
                  { step: '03', label: 'Photo Review',     icon: '🖼️', color: T.purple,   route: '/attendance/groundtruth/photos' },
                  { step: '04', label: 'Embeddings',       icon: '🧠', color: T.warning,  route: '/attendance/embeddings' },
                  { step: '05', label: 'Reports',          icon: '📊', color: T.teal,     route: '/attendance/reports' },
                ].map((s, i, arr) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <div
                      className="ams-btn"
                      onClick={() => navigate(s.route)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 6, padding: '12px 14px', borderRadius: 10,
                        background: `${s.color}15`, border: `1px solid ${s.color}30`,
                        cursor: 'pointer', minWidth: 90,
                        animation: `fadeUp .4s ease both`, animationDelay: `${i * 80}ms`,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{s.icon}</span>
                      <span style={{ fontSize: 9, fontFamily: T.fontMono, color: s.color, fontWeight: 700 }}>{s.step}</span>
                      <span style={{ fontSize: 10, color: T.text, textAlign: 'center', lineHeight: 1.3 }}>{s.label}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: T.border, fontSize: 18 }}>→</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* ── Room-wise Camera Previews ──────────────────────────────────── */}
<div style={{
  marginTop: 24,
  background: T.surface, border: `1px solid ${T.border}`,
  borderRadius: 12, padding: '20px 24px',
  animation: 'fadeUp .5s ease .5s both',
}}>
  <SectionHead
    title="Camera Previews by Room"
    sub="Live preview of all registered cameras, grouped by room"
    color={T.orange}
  />
  <RoomCameraPreview cameras={cameras} camLoading={camLoading} />
</div>
            </div>
          </div>

          {/* ── Right sidebar ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Quick actions */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '20px',
              animation: 'fadeUp .5s ease .1s both',
            }}>
              <SectionHead title="Quick Actions" color={T.accent} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <QuickBtn icon="📡" label="Start RTSP Capture"     color={T.accent}  colorDim={T.accentDim}  onClick={() => navigate('/attendance/groundtruth/rtsp')}  delay={0} />
                <QuickBtn icon="🎯" label="Assign Roll Numbers"     color={T.success} colorDim={T.successDim} onClick={() => navigate('/attendance/groundtruth/assign')} delay={50} />
                <QuickBtn icon="🧠" label="Generate Embeddings"     color={T.warning} colorDim={T.warningDim} onClick={() => navigate('/attendance/embeddings')}         delay={100} />
                <QuickBtn icon="📊" label="Run Attendance Report"   color={T.teal}    colorDim={T.tealDim}    onClick={() => navigate('/attendance/reports')}            delay={150} />
                <QuickBtn icon="📷" label="Manage Cameras"          color={T.orange}  colorDim={T.orangeDim}  onClick={() => navigate('/cameras')}                       delay={200} />
                <QuickBtn icon="🖼️" label="Review Photos"           color={T.purple}  colorDim={T.purpleDim}  onClick={() => navigate('/attendance/groundtruth/photos')} delay={250} />
              </div>
            </div>

            {/* Camera status */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '20px',
              animation: 'fadeUp .5s ease .2s both',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <SectionHead title="Camera Status" color={T.orange} />
                <button
                  className="ams-btn"
                  onClick={() => navigate('/cameras')}
                  style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 6,
                    background: T.orangeDim, color: T.orange,
                    border: `1px solid ${T.orange}30`,
                    fontFamily: T.fontBody, fontWeight: 600,
                    marginBottom: 20,
                  }}
                >
                  Manage →
                </button>
              </div>
              <CameraStrip cameras={cameras.slice(0, 6)} loading={camLoading} />
              {cameras.length > 6 && (
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8, textAlign: 'center' }}>
                  +{cameras.length - 6} more cameras
                </div>
              )}
              {!camLoading && cameras.length === 0 && (
                <button
                  className="ams-btn"
                  onClick={() => navigate('/cameras')}
                  style={{
                    width: '100%', padding: '12px', marginTop: 8,
                    background: T.orangeDim, border: `1px dashed ${T.orange}40`,
                    borderRadius: 8, color: T.orange, fontSize: 12, fontWeight: 600,
                    fontFamily: T.fontBody,
                  }}
                >
                  + Register First Camera
                </button>
              )}
            </div>

            {/* Activity log */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '20px',
              animation: 'fadeUp .5s ease .3s both',
            }}>
              <SectionHead title="Recent Activity" color={T.purple} />
              {activityLog.length > 0
                ? activityLog.map((e, i) => <LogEntry key={i} entry={e} index={i} />)
                : (
                  <div style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '16px 0' }}>
                    No recent activity found.
                  </div>
                )
              }
            </div>

            {/* Ground truth path reminder */}
            <div style={{
              background: T.accentDim, border: `1px solid ${T.accent}30`,
              borderRadius: 12, padding: '16px',
              animation: 'fadeUp .5s ease .4s both',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                📁 Ground Truth Folder
              </div>
              <div style={{ fontSize: 11, fontFamily: T.fontMono, color: T.textMuted, lineHeight: 1.8 }}>
                client/public/ground-truth/<br />
                └── ROLLNO_First_Last/<br />
                {'    '}└── img1.jpg, img2.jpg…
              </div>
              <div style={{ marginTop: 10, fontSize: 10, color: T.textMuted }}>
                Embeddings rebuild automatically when photos are added.
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}