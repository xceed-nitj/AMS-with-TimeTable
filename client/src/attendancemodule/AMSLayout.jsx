// client/src/attendancemodule/AMSLayout.jsx
// Shared sidebar layout for all Attendance Module pages.
// Wraps /attendance/* and /cameras via React Router <Outlet />.

import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { theme } from './config';

const T = theme;

const NAV = [
  { id: 'dashboard', route: '/attendance',                    label: 'Dashboard',         icon: '🏠', exact: true },
  { id: 'rtsp',      route: '/attendance/groundtruth/rtsp',   label: 'RTSP Capture',      icon: '📡' },
  { id: 'assign',    route: '/attendance/groundtruth/assign',  label: 'Roll Assignment',   icon: '🎯' },
  { id: 'photos',    route: '/attendance/groundtruth/photos',  label: 'Photo Editor',      icon: '🖼️' },
  { id: 'reports',   route: '/attendance/reports',             label: 'Attendance Reports',icon: '📊' },
  { id: 'cameras',   route: '/cameras',                        label: 'Camera Registry',   icon: '📷' },
  { id: 'embeddings',route: '/attendance/embeddings',          label: 'Embeddings',        icon: '🧠' },
];

const COLORS = {
  dashboard: T.accent,
  rtsp:      T.accent,
  assign:    T.success,
  photos:    '#a78bfa',
  reports:   '#2dd4bf',
  cameras:   '#fb923c',
  embeddings:T.warning,
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
  @keyframes amsFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; } }
  @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  .ams-nav-item { transition: background .15s, color .15s, border-color .15s; }
  .ams-nav-item:hover { background: rgba(255,255,255,0.04) !important; }
  .ams-collapse-btn { transition: transform .2s; }
  .ams-page-content { animation: amsFadeIn .3s ease both; }
`;

export default function AMSLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // auto-collapse on mobile
  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);

  function isActive(item) {
    if (item.exact) return location.pathname === item.route || location.pathname === item.route + '/';
    return location.pathname.startsWith(item.route);
  }

  const SIDEBAR_W = collapsed ? 60 : 220;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        display: 'flex', minHeight: '100vh',
        background: T.bg, color: T.text,
        fontFamily: T.fontBody,
      }}>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside style={{
          width: SIDEBAR_W, flexShrink: 0,
          background: T.surface,
          borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
          transition: 'width .22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          position: 'sticky', top: 0,
          height: '100vh',
          zIndex: 100,
        }}>

          {/* Logo bar */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '18px 0' : '18px 16px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `rgba(56,189,248,0.12)`,
              border: `1px solid ${T.accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>👁️</div>
            {!collapsed && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>AMS</div>
                <div style={{ fontSize: 9, color: T.textMuted, marginTop: 1 }}>Face Attendance</div>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            {NAV.map((item) => {
              const active = isActive(item);
              const color  = COLORS[item.id] || T.accent;
              return (
                <div
                  key={item.id}
                  className="ams-nav-item"
                  onClick={() => navigate(item.route)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '10px 12px',
                    borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                    background: active ? `${color}15` : 'transparent',
                    border: `1px solid ${active ? color + '35' : 'transparent'}`,
                    color: active ? color : T.textMuted,
                    position: 'relative',
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  {/* active indicator */}
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 3, borderRadius: '0 2px 2px 0',
                      background: color,
                    }} />
                  )}
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  {!collapsed && (
                    <span style={{
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.label}
                    </span>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div style={{
            padding: '12px 8px', borderTop: `1px solid ${T.border}`, flexShrink: 0,
          }}>
            <div
              onClick={() => setCollapsed(c => !c)}
              className="ams-nav-item"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 8, padding: collapsed ? '8px 0' : '8px 12px',
                borderRadius: 8, cursor: 'pointer',
                color: T.textMuted, fontSize: 12, fontWeight: 500,
              }}
            >
              <span className="ams-collapse-btn" style={{ display: 'inline-block', transform: collapsed ? 'rotate(180deg)' : 'none', fontSize: 14 }}>
                ◀
              </span>
              {!collapsed && 'Collapse'}
            </div>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────── */}
        <main className="ams-page-content" style={{
          flex: 1, minWidth: 0, overflow: 'auto',
        }}>
          {/* Topbar breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px',
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            fontSize: 11, color: T.textMuted,
            fontFamily: T.fontMono,
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            <span style={{ color: T.accent }}>AMS</span>
            <span>›</span>
            {(() => {
              const active = NAV.find(n => isActive(n)) || NAV[0];
              const color  = COLORS[active.id] || T.accent;
              return (
                <>
                  <span>{active.icon}</span>
                  <span style={{ color }}>{active.label}</span>
                </>
              );
            })()}
            <span style={{ marginLeft: 'auto', color: T.textMuted, fontSize: 10 }}>
              {location.pathname}
            </span>
          </div>

          {/* Page */}
          <Outlet />
        </main>
      </div>
    </>
  );
}