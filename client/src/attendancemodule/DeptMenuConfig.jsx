import { useEffect, useState } from 'react';
import getEnvironment from '../getenvironment';
import { theme, cssReset } from './config';

const apiUrl = getEnvironment();

// ─── Master menu list ───────────────────────────────────────────────────────
// To add a new menu in future: just add one entry here + add the key in batch.js model.
// Nothing else needs to change.
const ALL_MENUS = [
    { key: 'dashboard',         label: 'Dashboard',            desc: 'Main overview and stats',                color: '#6366f1' },
    { key: 'groundTruth',       label: 'Ground Truth Capture', desc: 'RTSP stream capture for training data',  color: '#0ea5e9' },
    { key: 'rollAssignment',    label: 'Roll Assignment',       desc: 'Assign roll numbers to student faces',   color: '#10b981' },
    { key: 'erpUpload',         label: 'ERP Upload',            desc: 'Upload student data from ERP',           color: '#f472b6' },
    { key: 'attendanceReports', label: 'Attendance Reports',    desc: 'View and export attendance records',     color: '#14b8a6' },
    { key: 'classVerification', label: 'Class Verification',    desc: 'Frame-level attendance verification',    color: '#ec4899' },
    { key: 'cameraRegistry',    label: 'Camera Registry',       desc: 'Manage registered cameras',              color: '#f97316' },
    { key: 'subjectEmbeddings', label: 'Subject Embeddings',    desc: 'Generate face embeddings per subject',   color: '#f59e0b' },
    { key: 'livePreview',       label: 'Live Preview',          desc: 'Live camera feed preview',               color: '#8b5cf6' },
    { key: 'gpuMetrics',        label: 'GPU Monitor',           desc: 'Real-time GPU usage and health',         color: '#06b6d4' },
    { key: 'confidenceMonitor', label: 'Confidence Monitor',    desc: 'Model confidence tracking',              color: '#ef4444' },
    { key: 'helpManual',        label: 'Help & Manual',         desc: 'Documentation and user guide',           color: '#64748b' },
];

export default function DeptMenuConfig() {
    const [menus, setMenus]     = useState(null);
    const [saving, setSaving]   = useState(false);
    const [toast, setToast]     = useState(null); // { msg, ok }

    useEffect(() => {
        fetch(`${apiUrl}/attendancemodule/settings/batches/dept-menus`, { credentials: 'include' })
            .then(r => r.json())
            .then(d => setMenus(d.deptMenus))
            .catch(() => showToast('Failed to load menu config.', false));
    }, []);

    const showToast = (msg, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    };

    const toggle = (key) => setMenus(prev => ({ ...prev, [key]: !prev[key] }));

    const enableAll  = () => setMenus(prev => Object.fromEntries(Object.keys(prev).map(k => [k, true])));
    const disableAll = () => setMenus(prev => Object.fromEntries(Object.keys(prev).map(k => [k, false])));

    const save = async () => {
        setSaving(true);
        try {
            const res  = await fetch(`${apiUrl}/attendancemodule/settings/batches/dept-menus`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ deptMenus: menus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');
            showToast('Menu visibility saved. Dept users will see changes on next page load.', true);
        } catch (err) {
            showToast(err.message, false);
        } finally {
            setSaving(false);
        }
    };

    const enabledCount = menus ? Object.values(menus).filter(Boolean).length : 0;

    return (
        <>
            <style>{cssReset}{EXTRA_CSS}</style>

            <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 680, fontFamily: theme.fontBody }}>

                {/* Header */}
                <div className="ams-page-header" style={{ marginBottom: 24 }}>
                    <div>
                        <h1>Dept Role — Menu Visibility</h1>
                        <p>Control which sidebar menus are visible to users with the <strong>Department</strong> role. Changes apply globally to all dept users on next load.</p>
                    </div>
                    <span style={{
                        alignSelf: 'flex-start', marginTop: 4,
                        padding: '4px 12px', borderRadius: 20,
                        background: theme.accentDim, color: theme.accent,
                        fontSize: 12, fontWeight: 700,
                    }}>
                        {menus ? `${enabledCount} / ${ALL_MENUS.length} enabled` : '…'}
                    </span>
                </div>

                {/* Bulk actions */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <button className="dmc-bulk-btn" onClick={enableAll}>Enable all</button>
                    <button className="dmc-bulk-btn" onClick={disableAll}>Disable all</button>
                </div>

                {/* Menu rows */}
                {!menus ? (
                    <div style={{ color: theme.textMuted, fontSize: 13, padding: '32px 0' }}>Loading…</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ALL_MENUS.map(({ key, label, desc, color }) => {
                            const on = !!menus[key];
                            return (
                                <label key={key} className={`dmc-row ${on ? 'dmc-row--on' : ''}`}
                                    style={{ '--c': color }}>
                                    <div className="dmc-dot" />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: theme.text }}>{label}</div>
                                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{desc}</div>
                                    </div>
                                    <div className={`dmc-toggle ${on ? 'dmc-toggle--on' : ''}`}
                                        style={{ '--c': color }}>
                                        <div className="dmc-thumb" />
                                    </div>
                                    <input type="checkbox" checked={on} onChange={() => toggle(key)}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                                </label>
                            );
                        })}
                    </div>
                )}

                {/* Save */}
                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={save}
                        disabled={saving || !menus}
                        style={{
                            padding: '10px 28px', borderRadius: 8,
                            background: theme.accent, color: '#fff',
                            border: 'none', fontSize: 13.5, fontWeight: 600,
                            cursor: (saving || !menus) ? 'not-allowed' : 'pointer',
                            opacity: (saving || !menus) ? 0.6 : 1,
                        }}
                    >
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>

                {/* Toast */}
                {toast && (
                    <div style={{
                        marginTop: 16, padding: '10px 16px', borderRadius: 8, fontSize: 13,
                        background: toast.ok ? theme.successDim : theme.dangerDim,
                        color: toast.ok ? theme.success : theme.danger,
                        border: `1px solid ${toast.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}>
                        {toast.msg}
                    </div>
                )}

                
            </div>
        </>
    );
}

const EXTRA_CSS = `
    .dmc-row {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px; border-radius: 10px;
        background: #fff; border: 1px solid ${theme.border};
        cursor: pointer; position: relative;
        transition: border-color .15s, box-shadow .15s;
    }
    .dmc-row:hover { border-color: #c7caee; box-shadow: 0 1px 6px rgba(99,102,241,0.07); }
    .dmc-row--on   { border-color: color-mix(in srgb, var(--c) 30%, transparent); background: color-mix(in srgb, var(--c) 4%, white); }
    .dmc-dot {
        width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        background: var(--c); opacity: 0.5; transition: opacity .15s;
    }
    .dmc-row--on .dmc-dot { opacity: 1; }
    .dmc-toggle {
        width: 38px; height: 22px; border-radius: 11px; flex-shrink: 0;
        background: ${theme.border}; position: relative; transition: background .2s;
    }
    .dmc-toggle--on { background: #6366f1; }

    .dmc-thumb {
        position: absolute; top: 3px; left: 3px;
        width: 16px; height: 16px; border-radius: 50%;
        background: #fff; transition: transform .2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .dmc-toggle--on .dmc-thumb { transform: translateX(16px); }
    .dmc-bulk-btn {
        padding: 6px 14px; border-radius: 6px; border: 1px solid ${theme.border};
        background: #fff; color: ${theme.textMuted}; font-size: 12px;
        font-weight: 600; cursor: pointer; font-family: inherit;
        transition: border-color .15s, color .15s;
    }
    .dmc-bulk-btn:hover { border-color: #c7caee; color: ${theme.text}; }
`;