import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import getEnvironment from '../getenvironment';
import { theme } from '../attendancemodule/config';

const apiUrl = getEnvironment();

// Master list of all possible dept menus — add new menus here in the future
const ALL_MENUS = [
    { id: 'dashboard',         menuKey: 'dashboard',         route: '/dept-admin/dashboard',           label: 'Dashboard',            exact: true,  color: '#6366f1' },
    { id: 'groundTruth',       menuKey: 'groundTruth',       route: '/dept-admin/live-rtsp',            label: 'Ground Truth Capture',               color: '#0ea5e9' },
    { id: 'rollAssignment',    menuKey: 'rollAssignment',    route: '/dept-admin/assign-rolls',         label: 'Roll Assignment',                    color: '#10b981' },
    { id: 'erpUpload',         menuKey: 'erpUpload',         route: '/attendance/groundtruth/upload',   label: 'ERP Upload',                         color: '#f472b6' },
    { id: 'attendanceReports', menuKey: 'attendanceReports', route: '/dept-admin/reports',              label: 'Attendance Reports',                 color: '#14b8a6' },
    { id: 'classVerification', menuKey: 'classVerification', route: '/attendance/frame-verification',   label: 'Class Verification',                 color: '#ec4899' },
    { id: 'cameraRegistry',    menuKey: 'cameraRegistry',    route: '/cameras',                         label: 'Camera Registry',                    color: '#f97316' },
    { id: 'subjectEmbeddings', menuKey: 'subjectEmbeddings', route: '/attendance/embeddings',           label: 'Subject Embeddings',                 color: '#f59e0b' },
    { id: 'livePreview',       menuKey: 'livePreview',       route: '/cameras/preview',                 label: 'Live Preview',                       color: '#8b5cf6' },
    { id: 'confidenceMonitor', menuKey: 'confidenceMonitor', route: '/attendance/confidence',           label: 'Confidence Monitor',                 color: '#ef4444' },
    { id: 'helpManual',        menuKey: 'helpManual',        route: '/ams-manual',                      label: 'Help & Manual',        newTab: true, color: '#64748b' },
];

const CSS = `
  * { box-sizing: border-box; }
  .dept-admin-nav-item { transition: background .15s, color .15s; cursor: pointer; }
  .dept-admin-nav-item:hover { background: rgba(99,102,241,0.06) !important; }
`;

export default function DeptAdminLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [deptMenus, setDeptMenus] = useState(null); // null = loading
    const [context, setContext] = useState({
        department: '',
        batchDepartment: '',
        fullAccess: false,
        loading: true,
        error: '',
    });

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (isMobile) setCollapsed(true);
    }, [isMobile]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`${apiUrl}/attendancemodule/dept-admin/context`, {
            credentials: 'include',
            signal: controller.signal,
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Unable to load department access.');
                setContext({
                    department: data.department,
                    batchDepartment: data.batchDepartment,
                    fullAccess: Boolean(data.fullAccess),
                    loading: false,
                    error: '',
                });
            })
            .catch((error) => {
                if (error.name !== 'AbortError') {
                    setContext({ department: '', batchDepartment: '', fullAccess: false, loading: false, error: error.message });
                }
            });
        return () => controller.abort();
    }, []);

    // Fetch dynamic menu config from server
    useEffect(() => {
        fetch(`${apiUrl}/attendancemodule/dept-admin/menus`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setDeptMenus(data.deptMenus))
            .catch(() => {
    // If menu fetch fails, show NO menus (don't give unintended access)
    setDeptMenus({});
});
    }, []);

    const visibleMenus = deptMenus
        ? ALL_MENUS.filter(m => deptMenus[m.menuKey] === true)
        : [];

    const isActive = (item) => item.exact
        ? location.pathname === item.route || location.pathname === `${item.route}/`
        : location.pathname.startsWith(item.route);

    const sidebarWidth = collapsed ? 52 : 208;

    return (
        <>
            <style>{CSS}</style>
            <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: theme.fontBody }}>
                <aside style={{
                    width: sidebarWidth,
                    flexShrink: 0,
                    background: '#ffffff',
                    borderRight: `1px solid ${theme.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width .22s ease',
                    overflow: 'hidden',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    zIndex: 100,
                    boxShadow: '1px 0 8px rgba(26,31,60,0.05)',
                }}>
                    <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                        {visibleMenus.map((item) => {
                            const active = isActive(item);
                            const color = item.color;
                            return (
                                <div
                                    key={item.id}
                                    className="dept-admin-nav-item"
                                    onClick={() => {
    if (item.newTab) {
        window.open(item.route, '_blank');
    } else if (!item.route.startsWith('/dept-admin')) {
        navigate('/dept-admin/access-denied');
    } else {
        navigate(item.route);
    }
}}
                                    title={collapsed ? item.label : undefined}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: collapsed ? 'center' : 'flex-start',
                                        padding: collapsed ? '10px 0' : '9px 11px',
                                        borderRadius: 8,
                                        marginBottom: 2,
                                        background: active ? `${color}12` : 'transparent',
                                        border: `1px solid ${active ? `${color}28` : 'transparent'}`,
                                        color: active ? color : theme.textMuted,
                                        position: 'relative',
                                    }}
                                >
                                    {active && (
                                        <div style={{
                                            position: 'absolute', left: 0, top: '22%', bottom: '22%',
                                            width: 3, borderRadius: '0 3px 3px 0', background: color,
                                        }} />
                                    )}
                                    {collapsed ? (
                                        <span style={{ fontSize: 11, fontWeight: 800, fontFamily: theme.fontMono }}>
                                            {item.label[0]}
                                        </span>
                                    ) : (
                                        <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                                            {item.label}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {!collapsed && (context.department || context.fullAccess) && (
                        <div style={{ padding: '10px 12px', borderTop: `1px solid ${theme.border}`, color: theme.textMuted, fontSize: 10, lineHeight: 1.4 }}>
                            {context.fullAccess ? 'Institute access' : context.department}
                        </div>
                    )}
                    <div style={{ padding: '10px 8px', borderTop: `1px solid ${theme.border}` }}>
                        <div
                            className="dept-admin-nav-item"
                            onClick={() => setCollapsed((v) => !v)}
                            style={{
                                display: 'flex', alignItems: 'center',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                                gap: 8, padding: collapsed ? '8px 0' : '8px 11px',
                                borderRadius: 7, color: theme.textMuted, fontSize: 11,
                            }}
                        >
                            <span style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>‹</span>
                            {!collapsed && 'Collapse'}
                        </div>
                    </div>
                </aside>

                <main style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
                    {context.error ? (
                        <div style={{ padding: 32, color: theme.danger }}>{context.error}</div>
                    ) : (
                        <Outlet context={context} />
                    )}
                </main>
            </div>
        </>
    );
}