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

    // Persists the given menu state immediately and reverts on failure —
    // every toggle/bulk action saves itself, there's no separate Save button.
    const persist = async (next, prev) => {
        setSaving(true);
        try {
            const res  = await fetch(`${apiUrl}/attendancemodule/settings/batches/dept-menus`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ deptMenus: next }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Save failed');
            showToast('Saved', true);
        } catch (err) {
            showToast(err.message, false);
            setMenus(prev);
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key) => setMenus(prev => {
        const next = { ...prev, [key]: !prev[key] };
        persist(next, prev);
        return next;
    });

    const enableAll = () => setMenus(prev => {
        const next = Object.fromEntries(Object.keys(prev).map(k => [k, true]));
        persist(next, prev);
        return next;
    });

    const disableAll = () => setMenus(prev => {
        const next = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
        persist(next, prev);
        return next;
    });

    const enabledCount = menus ? Object.values(menus).filter(Boolean).length : 0;

    return (
        <>
            <style>{cssReset}{EXTRA_CSS}</style>

            <div style={{ padding: 'clamp(12px,2vw,20px)', maxWidth: 1000, fontFamily: theme.fontBody }}>

                {/* Bulk actions + status */}
                <div className="dmc-header" style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button className="dmc-bulk-btn" onClick={enableAll}>Enable all</button>
                        <button className="dmc-bulk-btn" onClick={disableAll}>Disable all</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {saving && (
                            <span style={{ fontSize: 12.5, color: theme.textMuted }}>Saving…</span>
                        )}
                        <span style={{
                            alignSelf: 'flex-start', marginTop: 2,
                            padding: '3px 10px', borderRadius: 20,
                            background: theme.accentDim, color: theme.accent,
                            fontSize: 12.5, fontWeight: 700,
                        }}>
                            {menus ? `${enabledCount} / ${ALL_MENUS.length} enabled` : '…'}
                        </span>
                    </div>
                </div>

                {/* Menu rows */}
                {!menus ? (
                    <div style={{ color: theme.textMuted, fontSize: 12.5, padding: '24px 0' }}>Loading…</div>
                ) : (
                    <div className="dmc-grid">
                        {ALL_MENUS.map(({ key, label, desc, color }) => {
                            const on = !!menus[key];
                            return (
                                <label key={key} className={`dmc-row ${on ? 'dmc-row--on' : ''}`}
                                    style={{ '--c': color }}>
                                    <div className="dmc-dot" />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 12.5, fontWeight: 600, color: theme.text }}>{label}</div>
                                        <div style={{ fontSize: 12.5, color: theme.textMuted, marginTop: 0 }}>{desc}</div>
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

                {/* Toast */}
                {toast && (
                    <div style={{
                        marginTop: 12, padding: '8px 14px', borderRadius: 7, fontSize: 12.5,
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
    .dmc-header {
        display: flex; align-items: flex-start; justify-content: space-between;
        flex-wrap: wrap; gap: 8px;
    }
    .dmc-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 8px;
    }
    .dmc-row {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px; border-radius: 8px;
        background: #fff; border: 1px solid ${theme.border};
        cursor: pointer; position: relative;
        transition: border-color .15s, box-shadow .15s;
    }
    .dmc-row:hover { border-color: #c7caee; box-shadow: 0 1px 6px rgba(99,102,241,0.07); }
    .dmc-row--on   { border-color: color-mix(in srgb, var(--c) 30%, transparent); background: color-mix(in srgb, var(--c) 4%, white); }
    .dmc-dot {
        width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
        background: var(--c); opacity: 0.5; transition: opacity .15s;
    }
    .dmc-row--on .dmc-dot { opacity: 1; }
    .dmc-toggle {
        width: 32px; height: 18px; border-radius: 9px; flex-shrink: 0;
        background: ${theme.border}; position: relative; transition: background .2s;
    }
    .dmc-toggle--on { background: #6366f1; }

    .dmc-thumb {
        position: absolute; top: 2px; left: 2px;
        width: 14px; height: 14px; border-radius: 50%;
        background: #fff; transition: transform .2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .dmc-toggle--on .dmc-thumb { transform: translateX(14px); }
    .dmc-bulk-btn {
        padding: 5px 12px; border-radius: 6px; border: 1px solid ${theme.border};
        background: #fff; color: ${theme.textMuted}; font-size: 12.5px;
        font-weight: 600; cursor: pointer; font-family: inherit;
        transition: border-color .15s, color .15s;
    }
    .dmc-bulk-btn:hover { border-color: #c7caee; color: ${theme.text}; }
`;