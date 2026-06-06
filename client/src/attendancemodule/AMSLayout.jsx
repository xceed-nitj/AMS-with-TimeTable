// client/src/attendancemodule/AMSLayout.jsx

import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { theme } from './config';

const T = theme;

const NAV = [
  { id: 'dashboard',  route: '/attendance',                    label: 'Dashboard',       exact: true },
  { id: 'rtsp',       route: '/attendance/groundtruth/rtsp',   label: 'RTSP Capture'     },
  { id: 'assign',     route: '/attendance/groundtruth/assign', label: 'Roll Assignment'  },
  { id: 'photos',     route: '/attendance/groundtruth/photos', label: 'Photo Editor'     },
  { id: 'reports',    route: '/attendance/reports',            label: 'Reports'          },
  { id: 'cameras',    route: '/cameras',                       label: 'Camera Registry'  },
  { id: 'embeddings', route: '/attendance/embeddings',         label: 'Embeddings'       },
];

const COLORS = {
  dashboard:  '#6366f1',
  rtsp:       '#0ea5e9',
  assign:     '#10b981',
  photos:     '#a855f7',
  reports:    '#14b8a6',
  cameras:    '#f97316',
  embeddings: '#f59e0b',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap');
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #f0f2f9; }
  ::-webkit-scrollbar-thumb { background: #d0d5ea; border-radius: 4px; }
  @keyframes amsFadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; } }
  .ams-nav-item { transition: background .15s, color .15s; cursor: pointer; }
  .ams-nav-item:hover { background: rgba(99,102,241,0.06) !important; }
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

  useEffect(() => { if (isMobile) setCollapsed(true); }, [isMobile]);

  function isActive(item) {
    if (item.exact) return location.pathname === item.route || location.pathname === item.route + '/';
    return location.pathname.startsWith(item.route);
  }

  const SIDEBAR_W = collapsed ? 52 : 208;

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        display: 'flex', minHeight: '100vh',
        background: T.bg, color: T.text,
        fontFamily: T.fontBody,
      }}>

        {/* Sidebar */}
        <aside style={{
          width: SIDEBAR_W, flexShrink: 0,
          background: '#ffffff',
          borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column',
          transition: 'width .22s ease',
          overflow: 'hidden',
          position: 'sticky', top: 0,
          height: '100vh',
          zIndex: 100,
          boxShadow: '1px 0 8px rgba(26,31,60,0.05)',
        }}>

          {/* Nav */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            {NAV.map((item) => {
              const active = isActive(item);
              const color  = COLORS[item.id] || T.accent;
              return (
                <div
                  key={item.id}
                  className="ams-nav-item"
                  onClick={() => navigate(item.route)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 9,
                    padding: collapsed ? '10px 0' : '9px 11px',
                    borderRadius: 8, marginBottom: 2,
                    background: active ? `${color}12` : 'transparent',
                    border: `1px solid ${active ? color + '28' : 'transparent'}`,
                    color: active ? color : T.textMuted,
                    position: 'relative',
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '22%', bottom: '22%',
                      width: 3, borderRadius: '0 3px 3px 0',
                      background: color,
                    }} />
                  )}
                  {collapsed
                    ? <span style={{
                        fontSize: 11, fontWeight: 800,
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: active ? color : T.textMuted,
                      }}>
                        {item.label[0]}
                      </span>
                    : <span style={{
                        fontSize: 12.5, fontWeight: active ? 600 : 400,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.label}
                      </span>
                  }
                </div>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <div style={{ padding: '10px 8px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
            <div
              className="ams-nav-item"
              onClick={() => setCollapsed(c => !c)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 8, padding: collapsed ? '8px 0' : '8px 11px',
                borderRadius: 7, color: T.textMuted, fontSize: 11, fontWeight: 500,
              }}
            >
              <span style={{
                display: 'inline-block',
                transform: collapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform .2s', fontSize: 13, lineHeight: 1,
              }}>
                ‹
              </span>
              {!collapsed && 'Collapse'}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="ams-page-content" style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          {/* Breadcrumb */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 24px',
            background: '#ffffff',
            borderBottom: `1px solid ${T.border}`,
            fontSize: 11, color: T.textMuted,
            fontFamily: "'IBM Plex Mono', monospace",
            position: 'sticky', top: 0, zIndex: 10,
            boxShadow: '0 1px 4px rgba(26,31,60,0.04)',
          }}>
            <span style={{ color: COLORS.dashboard, fontWeight: 700 }}>IAMS</span>
            <span>›</span>
            {(() => {
              const active = NAV.find(n => isActive(n)) || NAV[0];
              return <span style={{ color: COLORS[active.id] || T.accent, fontWeight: 600 }}>{active.label}</span>;
            })()}
            <span style={{ marginLeft: 'auto', color: T.textMuted, fontSize: 10 }}>
              {location.pathname}
            </span>
          </div>

          <Outlet />
        </main>
      </div>
    </>
  );
}
