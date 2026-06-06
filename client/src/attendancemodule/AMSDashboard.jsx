// client/src/attendancemodule/AMSDashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';

const apiUrl     = getEnvironment();
const CAM_API    = `${apiUrl}/attendancemodule/cameras`;
const REPORT_API = `${apiUrl}/attendancemodule/reports`;

const T = {
  bg:           '#f5f6fb',
  surface:      '#ffffff',
  surfaceAlt:   '#f0f2f9',
  border:       '#e4e8f5',
  text:         '#1a1f3c',
  textMuted:    '#7b84ab',
  fontMono:     "'IBM Plex Mono', monospace",
  fontBody:     "'IBM Plex Sans', 'Segoe UI', sans-serif",
  fontDisplay:  "'IBM Plex Sans', 'Segoe UI', sans-serif",
  // Palette
  indigo:       '#6366f1',
  indigoDim:    'rgba(99,102,241,0.09)',
  sky:          '#0ea5e9',
  skyDim:       'rgba(14,165,233,0.09)',
  emerald:      '#10b981',
  emeraldDim:   'rgba(16,185,129,0.09)',
  amber:        '#f59e0b',
  amberDim:     'rgba(245,158,11,0.09)',
  red:          '#ef4444',
  redDim:       'rgba(239,68,68,0.09)',
  purple:       '#a855f7',
  purpleDim:    'rgba(168,85,247,0.09)',
  teal:         '#14b8a6',
  tealDim:      'rgba(20,184,166,0.09)',
  orange:       '#f97316',
  orangeDim:    'rgba(249,115,22,0.09)',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.35; } }
  .rep-row { transition: background .12s; cursor: default; }
  .rep-row:hover { background: ${T.indigoDim} !important; }
`;

function Dot({ color, pulse }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, flexShrink: 0,
      animation: pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  );
}

function StatCard({ label, value, color, colorDim, loading, delay = 0, suffix = '' }) {
  return (
    <div style={{
      background: T.surface,
      border: `1.5px solid ${color}30`,
      borderRadius: 12,
      padding: '18px 20px',
      animation: `fadeUp .4s ease ${delay}ms both`,
      boxShadow: `0 2px 12px ${color}14`,
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{
        fontSize: 28, fontWeight: 700, color,
        fontFamily: T.fontMono, letterSpacing: '-0.03em', lineHeight: 1,
        marginBottom: 6,
      }}>
        {loading ? '—' : value != null ? `${value}${suffix}` : '—'}
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    finalized: { color: T.emerald, bg: T.emeraldDim },
    live:      { color: T.sky,     bg: T.skyDim     },
    draft:     { color: T.amber,   bg: T.amberDim   },
  };
  const s = map[status] || { color: T.textMuted, bg: T.surfaceAlt };
  return (
    <span style={{
      fontSize: 10, padding: '2px 9px', borderRadius: 99, fontWeight: 700,
      background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '.06em',
      border: `1px solid ${s.color}30`,
    }}>
      {status || 'draft'}
    </span>
  );
}

function CameraRow({ cam, index }) {
  const isOnline = cam.status === 'online';
  const isMaint  = cam.status === 'maintenance';
  const dotColor = isOnline ? T.emerald : isMaint ? T.amber : T.red;
  const bg       = isOnline ? T.emeraldDim : isMaint ? T.amberDim : T.redDim;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 9,
      background: T.surfaceAlt, border: `1px solid ${T.border}`,
      animation: `fadeUp .3s ease ${index * 40}ms both`,
    }}>
      <Dot color={dotColor} pulse={isOnline} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{cam.cameraId || 'Unknown'}</div>
        <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {cam.ipAddress}:{cam.port}
        </div>
      </div>
      <span style={{
        fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 700,
        background: bg, color: dotColor,
        textTransform: 'uppercase', letterSpacing: '.05em',
        border: `1px solid ${dotColor}30`,
      }}>
        {cam.status || 'offline'}
      </span>
    </div>
  );
}

export default function AMSDashboard() {
  const navigate = useNavigate();

  const [stats, setStats]         = useState(null);
  const [statsLoading, setStatsL] = useState(true);
  const [cameras, setCameras]     = useState([]);
  const [camLoading, setCamLoad]  = useState(true);

  useEffect(() => {
    fetch(`${CAM_API}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setCameras(Array.isArray(data) ? data : []))
      .catch(() => setCameras([]))
      .finally(() => setCamLoad(false));
  }, []);

  useEffect(() => {
    fetch(`${REPORT_API}/stats`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setStats(data); setStatsL(false); })
      .catch(() => setStatsL(false));
  }, []);

  const onlineCams = cameras.filter(c => c.status === 'online').length;
  const totalCams  = cameras.length;
  const recent     = stats?.recentReports || [];

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        minHeight: '100vh', background: T.bg, color: T.text,
        fontFamily: T.fontBody, padding: '28px 32px',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          marginBottom: 28, animation: 'fadeUp .4s ease both',
        }}>
          <div>
            <div style={{
              fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 22,
              letterSpacing: '-0.03em', marginBottom: 4, color: T.text,
            }}>
              Attendance Management
            </div>
            <div style={{ fontSize: 13, color: T.textMuted }}>
              Face recognition · RTSP · Ground truth pipeline
            </div>
          </div>
          {totalCams > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 9, padding: '7px 14px',
              boxShadow: '0 1px 4px rgba(26,31,60,0.06)',
            }}>
              <Dot color={onlineCams > 0 ? T.emerald : T.red} pulse={onlineCams > 0} />
              <span style={{ fontSize: 12, color: onlineCams > 0 ? T.emerald : T.textMuted, fontWeight: 600 }}>
                {onlineCams}/{totalCams} cameras online
              </span>
            </div>
          )}
        </div>

        {/* Attendance stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
          gap: 14, marginBottom: 28,
        }}>
          <StatCard label="Total Sessions"  value={stats?.totalSessions}    color={T.indigo}   colorDim={T.indigoDim}   loading={statsLoading} delay={0}   />
          <StatCard label="Today"           value={stats?.todaySessions}    color={T.sky}      colorDim={T.skyDim}      loading={statsLoading} delay={60}  />
          <StatCard label="This Week"       value={stats?.thisWeekSessions} color={T.purple}   colorDim={T.purpleDim}   loading={statsLoading} delay={120} />
          <StatCard label="Avg Attendance"  value={stats?.avgAttendancePct} color={T.teal}     colorDim={T.tealDim}     loading={statsLoading} delay={180} suffix="%" />
          <StatCard label="Total Present"   value={stats?.totalPresent}     color={T.emerald}  colorDim={T.emeraldDim}  loading={statsLoading} delay={240} />
          <StatCard label="Total Absent"    value={stats?.totalAbsent}      color={T.red}      colorDim={T.redDim}      loading={statsLoading} delay={300} />
        </div>

        {/* Main layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 288px', gap: 24, alignItems: 'start' }}>

          {/* Recent reports table */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 1px 6px rgba(26,31,60,0.05)',
            animation: 'fadeUp .4s ease .1s both',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
              background: T.surfaceAlt,
            }}>
              <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                Recent Reports
              </span>
              <button
                onClick={() => navigate('/attendance/reports')}
                style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 7,
                  background: T.indigo, color: '#fff',
                  border: 'none',
                  cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 600,
                  boxShadow: '0 2px 6px rgba(99,102,241,0.25)',
                }}
              >
                View all →
              </button>
            </div>

            {statsLoading ? (
              <div style={{ padding: '28px 18px', fontSize: 13, color: T.textMuted }}>Loading…</div>
            ) : recent.length === 0 ? (
              <div style={{ padding: '40px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 14 }}>No attendance reports yet</div>
                <button
                  onClick={() => navigate('/attendance/reports')}
                  style={{
                    fontSize: 12, padding: '8px 20px', borderRadius: 8,
                    background: T.indigo, color: '#fff',
                    border: 'none',
                    cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 600,
                  }}
                >
                  Run attendance
                </button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.surfaceAlt }}>
                    {['Date', 'Batch', 'Room', 'Slot', 'Present', '%', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '9px 14px', textAlign: 'left',
                        fontSize: 10, color: T.textMuted, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.08em',
                        borderBottom: `1px solid ${T.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r, i) => (
                    <tr
                      key={r._id || i}
                      className="rep-row"
                      style={{ borderBottom: `1px solid ${T.border}` }}
                    >
                      <td style={{ padding: '11px 14px', fontSize: 12, color: T.text, fontFamily: T.fontMono, fontWeight: 600 }}>
                        {r.date || '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: T.text }}>
                        {r.batch || '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: T.textMuted }}>
                        {r.room || '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: T.textMuted }}>
                        {r.timeSlot || '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 13, color: T.emerald, fontWeight: 700 }}>
                        {r.summary?.present ?? '—'}
                        <span style={{ color: T.textMuted, fontWeight: 400 }}>/{r.summary?.totalStudents ?? '—'}</span>
                      </td>
                      <td style={{
                        padding: '11px 14px', fontSize: 13, fontWeight: 700,
                        color: (() => {
                          const p = r.summary?.attendancePct;
                          if (p == null) return T.textMuted;
                          return p >= 75 ? T.emerald : p >= 50 ? T.amber : T.red;
                        })(),
                      }}>
                        {r.summary?.attendancePct != null ? `${r.summary.attendancePct}%` : '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <StatusPill status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Camera status */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '18px',
              boxShadow: '0 1px 6px rgba(26,31,60,0.05)',
              animation: 'fadeUp .4s ease .15s both',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
                  Cameras
                </span>
                <button
                  onClick={() => navigate('/cameras')}
                  style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 6,
                    background: T.orangeDim || 'rgba(249,115,22,0.09)', color: T.orange,
                    border: `1px solid rgba(249,115,22,0.25)`,
                    cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 700,
                  }}
                >
                  Manage
                </button>
              </div>

              {camLoading
                ? <div style={{ fontSize: 12, color: T.textMuted }}>Loading…</div>
                : cameras.length === 0
                ? (
                  <button
                    onClick={() => navigate('/cameras')}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 9,
                      background: 'rgba(249,115,22,0.07)', border: `1.5px dashed rgba(249,115,22,0.35)`,
                      color: T.orange, fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: T.fontBody,
                    }}
                  >
                    + Register first camera
                  </button>
                )
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {cameras.slice(0, 6).map((cam, i) => <CameraRow key={cam._id || i} cam={cam} index={i} />)}
                    {cameras.length > 6 && (
                      <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', paddingTop: 4 }}>
                        +{cameras.length - 6} more
                      </div>
                    )}
                  </div>
                )
              }
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
