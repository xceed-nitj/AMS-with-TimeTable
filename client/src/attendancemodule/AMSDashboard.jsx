// client/src/attendancemodule/AMSDashboard.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import getEnvironment from '../getenvironment';
import HealthDashboard from './HealthDashboard';

const apiUrl     = getEnvironment();
const CAM_API    = `${apiUrl}/attendancemodule/cameras`;
const REPORT_API = `${apiUrl}/attendancemodule/reports`;
const GT_API     = `${apiUrl}/attendancemodule/ground-truth`;
const EMB_API    = `${apiUrl}/attendancemodule/embeddings`;
const USER_API   = `${apiUrl}/user/getuser`;

const T = {
  bg:         '#f5f6fb',
  surface:    '#ffffff',
  surfaceAlt: '#f0f2f9',
  border:     '#e4e8f5',
  text:       '#1a1f3c',
  textMuted:  '#7b84ab',
  fontMono:   "'IBM Plex Mono', monospace",
  fontBody:   "'IBM Plex Sans', 'Segoe UI', sans-serif",
  indigo:  '#6366f1', indigoDim:  'rgba(99,102,241,0.09)',
  sky:     '#0ea5e9', skyDim:     'rgba(14,165,233,0.09)',
  emerald: '#10b981', emeraldDim: 'rgba(16,185,129,0.09)',
  amber:   '#f59e0b', amberDim:   'rgba(245,158,11,0.09)',
  red:     '#ef4444', redDim:     'rgba(239,68,68,0.09)',
  purple:  '#a855f7', purpleDim:  'rgba(168,85,247,0.09)',
  teal:    '#14b8a6', tealDim:    'rgba(20,184,166,0.09)',
  orange:  '#f97316', orangeDim:  'rgba(249,115,22,0.09)',
};

const DEPT_COLORS = [
  T.indigo, T.sky, T.emerald, T.purple, T.teal, T.orange, T.amber, T.red,
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  @keyframes fadeUp   { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes dropDown { from { opacity:0; transform:translateY(-6px) scaleY(.96); transform-origin:top right; }
                        to   { opacity:1; transform:translateY(0)     scaleY(1);  transform-origin:top right; } }
  @keyframes pulse    { 0%,100%{ opacity:1; } 50%{ opacity:.35; } }

  .dash-stat-grid  { display:grid; gap:14px; grid-template-columns: repeat(auto-fill, minmax(130px,1fr)); }
  .dash-chart-grid { display:grid; gap:20px; grid-template-columns: 1fr 1fr; }

  @media (max-width: 900px) {
    .dash-chart-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .dash-stat-grid  { grid-template-columns: repeat(2, 1fr); }
    .dash-chart-grid { grid-template-columns: 1fr; }
    .dash-header     { flex-direction: column; align-items: flex-start; gap: 12px; }
  }
`;

/* ── helpers ── */
function Dot({ color, blink }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, flexShrink: 0,
      animation: blink ? 'pulse 1.5s ease-in-out infinite' : 'none',
    }} />
  );
}

function StatCard({ label, value, color, loading, delay = 0, suffix = '' }) {
  return (
    <div style={{
      background: T.surface,
      border: `1.5px solid ${color}30`,
      borderRadius: 12, padding: '16px 18px',
      animation: `fadeUp .4s ease ${delay}ms both`,
      boxShadow: `0 2px 10px ${color}12`,
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{
        fontSize: 26, fontWeight: 700, color,
        fontFamily: T.fontMono, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 5,
      }}>
        {loading ? '—' : (value != null ? `${value}${suffix}` : '—')}
      </div>
      <div style={{
        fontSize: 10, color: T.textMuted,
        textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700,
      }}>
        {label}
      </div>
    </div>
  );
}

/* ── inline camera panel (in document flow — no stacking issues) ── */
function CameraPanel({ cameras, camLoading, open, onManage }) {
  const online  = cameras.filter(c => c.status === 'online').length;
  const maint   = cameras.filter(c => c.status === 'maintenance').length;
  const offline = cameras.length - online - maint;

  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: open ? 600 : 0,
      opacity: open ? 1 : 0,
      transition: 'max-height .28s ease, opacity .2s ease',
      marginTop: open ? 8 : 0,
    }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(26,31,60,0.10)',
      }}>
        {/* summary bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
          {[
            { label: 'Online',  val: online,  color: T.emerald, bg: T.emeraldDim },
            { label: 'Maint',   val: maint,   color: T.amber,   bg: T.amberDim   },
            { label: 'Offline', val: offline, color: T.red,     bg: T.redDim     },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              flex: 1, padding: '10px 0', textAlign: 'center', background: s.bg,
              borderRight: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: T.fontMono, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: s.color, textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700, marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* camera list */}
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {camLoading ? (
            <div style={{ padding: '18px 16px', fontSize: 12, color: T.textMuted }}>Loading…</div>
          ) : cameras.length === 0 ? (
            <div style={{ padding: '18px 16px', fontSize: 12, color: T.textMuted, textAlign: 'center' }}>No cameras registered</div>
          ) : cameras.map((cam, i) => {
            const on  = cam.status === 'online';
            const mt  = cam.status === 'maintenance';
            const dot = on ? T.emerald : mt ? T.amber : T.red;
            return (
              <div key={cam._id || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                borderBottom: i < cameras.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <Dot color={dot} blink={on} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{cam.cameraId || 'Unknown'}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontFamily: T.fontMono, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cam.roomId} · {cam.ipAddress}:{cam.port}
                  </div>
                </div>
                <span style={{
                  fontSize: 9, padding: '2px 7px', borderRadius: 99, fontWeight: 700, flexShrink: 0,
                  background: on ? T.emeraldDim : mt ? T.amberDim : T.redDim,
                  color: dot, textTransform: 'uppercase', letterSpacing: '.05em',
                  border: `1px solid ${dot}30`,
                }}>
                  {cam.status || 'offline'}
                </span>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: T.surfaceAlt }}>
          <button onClick={onManage} style={{
            width: '100%', padding: '8px', borderRadius: 7,
            background: T.orange, color: '#fff', border: 'none',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: T.fontBody,
          }}>
            Manage Cameras →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── chart tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 8, padding: '9px 13px', fontSize: 12,
      boxShadow: '0 4px 16px rgba(26,31,60,0.12)', fontFamily: T.fontBody,
    }}>
      <div style={{ fontWeight: 700, color: T.text, marginBottom: 5 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: T.textMuted }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: T.text }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── chart card ── */
function ChartCard({ title, children, delay = 0, action }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 6px rgba(26,31,60,0.05)',
      animation: `fadeUp .4s ease ${delay}ms both`,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', borderBottom: `1px solid ${T.border}`, background: T.surfaceAlt,
      }}>
        <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
          {title}
        </span>
        {action}
      </div>
      <div style={{ padding: '18px 14px 14px' }}>{children}</div>
    </div>
  );
}

/* ── section label ── */
function SectionLabel({ children, top = 0 }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: T.textMuted,
      textTransform: 'uppercase', letterSpacing: '.09em',
      marginBottom: 10, marginTop: top,
    }}>
      {children}
    </div>
  );
}

function ActionCard({ title, subtitle, color, onClick, buttonLabel }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${color}28`,
      borderTop: `3px solid ${color}`,
      borderRadius: 12,
      padding: '16px 18px',
      boxShadow: `0 2px 10px ${color}12`,
      animation: 'fadeUp .4s ease both',
    }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
        {subtitle}
      </div>
      <button
        onClick={onClick}
        style={{
          padding: '9px 12px',
          borderRadius: 8,
          border: `1px solid ${color}30`,
          background: `${color}12`,
          color,
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 12,
          fontFamily: T.fontBody,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════ */
export default function AMSDashboard() {
  const navigate = useNavigate();

  const [stats,       setStats]     = useState(null);
  const [statsLoad,   setStatsLoad] = useState(true);
  const [cameras,     setCameras]   = useState([]);
  const [camLoad,     setCamLoad]   = useState(true);
  const [userRoles,   setUserRoles] = useState([]);
  const [gtStats,     setGtStats]   = useState(null);
  const [gtLoad,      setGtLoad]    = useState(true);
  const [embFiles,    setEmbFiles]  = useState(null);
  const [embLoad,     setEmbLoad]   = useState(true);
  const [chartData,   setChartData] = useState(null);
  const [camOpen,     setCamOpen]   = useState(false);

  /* data fetches */
  useEffect(() => {
    fetch(USER_API, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.role) setUserRoles(Array.isArray(d.user.role) ? d.user.role : [d.user.role]); })
      .catch(() => {});
  }, []);

  function fetchGtStats() {
    setGtLoad(true);
    fetch(`${GT_API}/stats`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setGtStats(d); setGtLoad(false); })
      .catch(() => setGtLoad(false));
  }

  useEffect(() => { fetchGtStats(); }, []);

  useEffect(() => {
    fetch(CAM_API, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(d => setCameras(Array.isArray(d) ? d : []))
      .catch(() => setCameras([]))
      .finally(() => setCamLoad(false));
  }, []);

  useEffect(() => {
    fetch(`${REPORT_API}/stats`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStats(d); setStatsLoad(false); })
      .catch(() => setStatsLoad(false));
  }, []);

  useEffect(() => {
    fetch(`${REPORT_API}/charts`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => setChartData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${EMB_API}/list-files`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const files = d?.files || [];
        const complete   = files.filter(f => !(f.missedRollNos?.length > 0)).length;
        const incomplete = files.filter(f =>   f.missedRollNos?.length > 0 ).length;
        const totalStudents = files.reduce((sum, f) => sum + (f.rollNos?.length || 0), 0);
        setEmbFiles({ total: files.length, complete, incomplete, totalStudents });
      })
      .catch(() => setEmbFiles(null))
      .finally(() => setEmbLoad(false));
  }, []);

  const onlineCams = cameras.filter(c => c.status === 'online').length;
  const totalCams  = cameras.length;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: T.fontBody, padding: 'clamp(16px,3vw,32px)' }}>

        <HealthDashboard />

        {/* ── Header ── */}
        <div style={{ marginBottom: camOpen ? 0 : 24, animation: 'fadeUp .4s ease both' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'clamp(17px,2.5vw,22px)', letterSpacing: '-0.03em', marginBottom: 3, color: T.text }}>
                Attendance Management
              </div>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {userRoles.length > 0 ? userRoles.join(' · ') : 'Attendance Management System'}
              </div>
            </div>

            {/* camera toggle badge */}
            <button
              onClick={() => setCamOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                background: T.surface,
                border: `1px solid ${camOpen ? T.orange + '80' : T.border}`,
                borderRadius: 9, padding: '7px 13px',
                boxShadow: '0 1px 4px rgba(26,31,60,0.06)',
                cursor: 'pointer', fontFamily: T.fontBody,
                transition: 'border-color .15s',
              }}
            >
              {camLoad ? (
                <span style={{ fontSize: 12, color: T.textMuted }}>Loading…</span>
              ) : totalCams === 0 ? (
                <span style={{ fontSize: 12, color: T.textMuted }}>No cameras</span>
              ) : (
                <>
                  <Dot color={onlineCams > 0 ? T.emerald : T.red} blink={onlineCams > 0} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                    <span style={{ color: onlineCams > 0 ? T.emerald : T.red }}>{onlineCams}</span>
                    <span style={{ color: T.textMuted }}>/{totalCams} cameras</span>
                  </span>
                </>
              )}
              <span style={{
                fontSize: 9, color: T.textMuted, display: 'inline-block', lineHeight: 1,
                transform: camOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
              }}>▾</span>
            </button>
          </div>

          {/* inline collapsible panel — in normal flow, pushes content down */}
          <CameraPanel
            cameras={cameras}
            camLoading={camLoad}
            open={camOpen}
            onManage={() => { setCamOpen(false); navigate('/cameras'); }}
          />
          {camOpen && <div style={{ height: 24 }} />}
        </div>

        {/* ── Attendance stats ── */}
        <SectionLabel>Attendance</SectionLabel>
        <div className="dash-stat-grid" style={{ marginBottom: 20 }}>
          <StatCard label="Total Sessions"  value={stats?.totalSessions}    color={T.indigo}  loading={statsLoad} delay={0}   />
          <StatCard label="Today"           value={stats?.todaySessions}    color={T.sky}     loading={statsLoad} delay={40}  />
          <StatCard label="This Week"       value={stats?.thisWeekSessions} color={T.purple}  loading={statsLoad} delay={80}  />
          <StatCard label="Avg Attendance"  value={stats?.avgAttendancePct} color={T.teal}    loading={statsLoad} delay={120} suffix="%" />
          <StatCard label="Present"         value={stats?.totalPresent}     color={T.emerald} loading={statsLoad} delay={160} />
          <StatCard label="Absent"          value={stats?.totalAbsent}      color={T.red}     loading={statsLoad} delay={200} />
        </div>

        {/* ── Ground truth stats ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.09em' }}>
            Ground Truth
          </div>
          <button
            onClick={fetchGtStats}
            disabled={gtLoad}
            style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 6,
              background: T.orangeDim, color: T.orange,
              border: `1px solid ${T.orange}30`, cursor: gtLoad ? 'default' : 'pointer',
              fontFamily: T.fontBody, fontWeight: 700, opacity: gtLoad ? 0.5 : 1,
              transition: 'opacity .15s',
            }}
          >
            {gtLoad ? '…' : '↻ Refresh'}
          </button>
        </div>
        <div className="dash-stat-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Clusters"        value={gtStats?.totalClusters} color={T.orange}  loading={gtLoad} delay={0}   />
          <StatCard label="Images"          value={gtStats?.totalImages}   color={T.sky}     loading={gtLoad} delay={40}  />
          <StatCard label="Embeddings"      value={gtStats?.withEmbedding} color={T.purple}  loading={gtLoad} delay={80}  />
          <StatCard label="Approved"        value={gtStats?.approved}      color={T.emerald} loading={gtLoad} delay={120} />
          <StatCard label="Matched"         value={gtStats?.matched}       color={T.teal}    loading={gtLoad} delay={160} />
        </div>

        {/* ── Embedding stats ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.09em' }}>
            Subject Embeddings
          </div>
          <button
            onClick={() => navigate('/attendance/embeddings')}
            style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 6,
              background: T.amberDim, color: T.amber,
              border: `1px solid ${T.amber}30`, cursor: 'pointer',
              fontFamily: T.fontBody, fontWeight: 700,
            }}
          >
            Manage →
          </button>
        </div>
        <div className="dash-stat-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Total Files"      value={embFiles?.total}         color={T.amber}   loading={embLoad} delay={0}   />
          <StatCard label="Complete"         value={embFiles?.complete}      color={T.emerald} loading={embLoad} delay={40}  />
          <StatCard label="Incomplete"       value={embFiles?.incomplete}    color={T.red}     loading={embLoad} delay={80}  />
          <StatCard label="Students Covered" value={embFiles?.totalStudents} color={T.purple}  loading={embLoad} delay={120} />
        </div>

        {/* ── Quick Actions ── */}
        <SectionLabel>Quick Actions</SectionLabel>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', marginBottom: 28 }}>
          <ActionCard
            title="Session Setup"
            subtitle="Configure semester dates, time slots, and attendance session parameters before capturing."
            color={T.purple}
            buttonLabel="Open Session Setup"
            onClick={() => navigate('/attendance/edit-session-dates')}
          />
          <ActionCard
            title="Frame Verification"
            subtitle="Review saved raw and annotated screenshots by room, date, and period."
            color={T.teal}
            buttonLabel="Open Gallery"
            onClick={() => navigate('/attendance/frame-verification')}
          />
        </div>

        {/* ── Charts ── */}
        <div className="dash-chart-grid">

          {/* dept-wise */}
          <ChartCard
            title="Department-wise Attendance"
            delay={100}
            action={
              <button onClick={() => navigate('/attendance/reports')} style={{
                fontSize: 10, padding: '3px 9px', borderRadius: 6,
                background: T.indigoDim, color: T.indigo,
                border: `1px solid ${T.indigo}30`, cursor: 'pointer',
                fontFamily: T.fontBody, fontWeight: 700,
              }}>Reports</button>
            }
          >
            {!chartData ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: T.textMuted }}>
                {statsLoad ? 'Loading…' : 'No data yet'}
              </div>
            ) : chartData.byDept.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: T.textMuted }}>
                No department data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.byDept} margin={{ top: 4, right: 4, left: -22, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis
                    dataKey="dept" tick={{ fontSize: 9, fill: T.textMuted }}
                    angle={-38} textAnchor="end" interval={0}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 9, fill: T.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: T.textMuted, paddingTop: 8 }} />
                  <Bar dataKey="present" name="Present" radius={[4, 4, 0, 0]}>
                    {chartData.byDept.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                  </Bar>
                  <Bar dataKey="absent" name="Absent" fill="rgba(239,68,68,0.45)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* day-wise */}
          <ChartCard title="Day-wise Attendance" delay={150}>
            {!chartData ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: T.textMuted }}>
                {statsLoad ? 'Loading…' : 'No data yet'}
              </div>
            ) : chartData.byDay.length === 0 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: T.textMuted }}>
                No day data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.byDay} margin={{ top: 4, right: 4, left: -22, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: T.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: T.textMuted, paddingTop: 8 }} />
                  <Bar dataKey="present" name="Present" fill={T.emerald} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent"  name="Absent"  fill={T.red}     radius={[4, 4, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </div>
      </div>
    </>
  );
}
