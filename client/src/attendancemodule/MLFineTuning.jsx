// client/src/attendancemodule/MLFineTuning.jsx
// ML Fine Tuning — liveness/anti-spoofing threshold controls + rejected
// sample review, so a non-developer admin can tune detection without
// touching server code or restarting the ML service.

import { useState, useEffect, useCallback } from 'react';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const CONFIG_API    = `${apiUrl}/api/v1/ml/liveness-config`;
const GT_CONFIG_API = `${apiUrl}/api/v1/ml/gt-config`;

const HEURISTIC_OPTIONS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40];
const ONNX_OPTIONS      = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90];

// GT Acquisition — fixed option sets per parameter
const GT_OPTIONS = {
    frame_skip:             [1, 3, 5, 10, 15, 20, 30],
    target_imgs_per_person: [5, 8, 10, 15, 20, 30],
    cluster_threshold:      [0.35, 0.40, 0.45, 0.50, 0.55, 0.60],
    min_samples:            [2, 3, 5, 7, 10],
    det_size:               [320, 640],
    merge_threshold:        [0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90],
    nms_iou_thresh:         [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50],
    det_score_floor:        [0.30, 0.40, 0.50, 0.60, 0.70],
    new_person_timeout:     [15, 30, 45, 60, 90, 120, 180],
    top_n:                  [5, 8, 10, 15, 20, 30],
    embed_n:                [3, 4, 5, 7, 10],
};

const GT_LABELS = {
    frame_skip:             { label: 'Frame skip',             unit: 'frames',  hint: 'Process 1 in every N frames. Lower = more coverage, higher = faster.' },
    target_imgs_per_person: { label: 'Target images / person', unit: 'images',  hint: 'Stop collecting for a person once this many are saved.' },
    cluster_threshold:      { label: 'Cluster threshold',      unit: '',        hint: 'DBSCAN cosine similarity eps. Higher = looser clusters (may merge different people).' },
    min_samples:            { label: 'Min cluster samples',    unit: 'detections', hint: 'DBSCAN min_samples. Higher = fewer but more certain clusters.' },
    det_size:               { label: 'Detection grid size',    unit: 'px',      hint: 'InsightFace input size. 640 is more accurate but slower.' },
    merge_threshold:        { label: 'Merge threshold',        unit: '',        hint: 'Post-DBSCAN cluster-merge cosine similarity. Lower merges more aggressively.' },
    nms_iou_thresh:         { label: 'NMS IoU threshold',      unit: '',        hint: 'Non-maximum suppression overlap. Lower keeps fewer overlapping detections.' },
    det_score_floor:        { label: 'Det score floor',        unit: '',        hint: 'Minimum InsightFace detection confidence to include a face in embeddings.' },
    new_person_timeout:     { label: 'New-person timeout',     unit: 'sec',     hint: 'Auto-stop if all people reach target and no new person appears for N seconds.' },
    top_n:                  { label: 'Max images / person',    unit: 'images',  hint: 'Maximum images kept per person folder (lowest-quality ones are deleted).' },
    embed_n:                { label: 'Embedding images',       unit: 'images',  hint: 'Of the top-N kept, how many are used to compute the mean embedding.' },
};

function Toggle({ checked, onChange, disabled, label }) {
    return (
        <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        }}>
            <span
                onClick={() => !disabled && onChange(!checked)}
                style={{
                    width: 42, height: 24, borderRadius: 14, position: 'relative',
                    background: checked ? theme.accent : theme.border,
                    transition: 'background 0.2s', flexShrink: 0,
                }}
            >
                <span style={{
                    position: 'absolute', top: 3, left: checked ? 21 : 3,
                    width: 18, height: 18, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                }} />
            </span>
            {label && <span style={{ fontSize: 13, color: theme.text }}>{label}</span>}
        </label>
    );
}

export default function MLFineTuning() {
    const [config, setConfig]       = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [toast, setToast]         = useState(null);

    const [gtConfig,     setGtConfig]     = useState(null);
    const [gtLoading,    setGtLoading]    = useState(true);
    const [gtSaving,     setGtSaving]     = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setConfig(data);
        } catch (err) {
            showToast(`Failed to load config: ${err.message}`, 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadConfig(); }, [loadConfig]);

    const loadGtConfig = useCallback(async () => {
        setGtLoading(true);
        try {
            const res = await fetch(GT_CONFIG_API);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGtConfig(data);
        } catch (err) {
            showToast(`Failed to load GT config: ${err.message}`, 'error');
        }
        setGtLoading(false);
    }, []);

    useEffect(() => { loadGtConfig(); }, [loadGtConfig]);

    const updateGtConfig = async (patch) => {
        setGtSaving(true);
        const prev = gtConfig;
        setGtConfig({ ...gtConfig, ...patch });
        try {
            const res = await fetch(GT_CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setGtConfig(data);
            showToast('GT setting updated');
        } catch (err) {
            setGtConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setGtSaving(false);
    };

    const updateConfig = async (patch) => {
        setSaving(true);
        // Optimistic UI update — revert on failure
        const prev = config;
        setConfig({ ...config, ...patch });
        try {
            const res = await fetch(CONFIG_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setConfig(data);
            showToast('Setting updated');
        } catch (err) {
            setConfig(prev);
            showToast(`Update failed: ${err.message}`, 'error');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div style={styles.page}>
                <style>{cssReset}</style>
                <div style={{ ...styles.subheading, padding: 40, textAlign: 'center' }}>Loading configuration…</div>
            </div>
        );
    }

    if (!config) {
        return (
            <div style={styles.page}>
                <style>{cssReset}</style>
                <div style={{ padding: 40, textAlign: 'center', color: theme.danger }}>
                    Could not reach the ML service. Make sure python-ml-service is running.
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 9000,
                    padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                    background: toast.type === 'error' ? theme.danger : theme.success, color: '#fff',
                }}>
                    {toast.msg}
                </div>
            )}

            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>ML Fine Tuning</div>
                <div style={styles.subheading}>Tune model behaviour for attendance detection — no restart required, changes apply to the next face check.</div>
            </div>

            {/* ── GT Acquisition config ──────────────────────────────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>GT Acquisition Thresholds</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                        Controls how ground-truth face images are collected from RTSP streams.
                        Changes apply to the next acquisition run — no restart needed.
                    </div>
                </div>

                {gtLoading ? (
                    <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
                ) : !gtConfig ? (
                    <div style={{ fontSize: 13, color: theme.danger }}>Could not load GT config.</div>
                ) : (
                    <>
                        {/* Group 1 — Session params */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Session Parameters
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                            {['frame_skip', 'target_imgs_per_person', 'cluster_threshold', 'min_samples', 'det_size'].map(key => {
                                const meta = GT_LABELS[key];
                                const opts = GT_OPTIONS[key];
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                        <select
                                            value={gtConfig[key]}
                                            disabled={gtSaving}
                                            onChange={e => updateGtConfig({ [key]: Number(e.target.value) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>
                                                    {v}{v === (key === 'frame_skip' ? 10 : key === 'target_imgs_per_person' ? 10 : key === 'cluster_threshold' ? 0.45 : key === 'min_samples' ? 3 : 320) ? ' (default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Group 2 — Quality filters */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Quality Filters
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                            {['merge_threshold', 'nms_iou_thresh', 'det_score_floor'].map(key => {
                                const meta = GT_LABELS[key];
                                const opts = GT_OPTIONS[key];
                                const defaults = { merge_threshold: 0.75, nms_iou_thresh: 0.35, det_score_floor: 0.5 };
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}</label>
                                        <select
                                            value={gtConfig[key]}
                                            disabled={gtSaving}
                                            onChange={e => updateGtConfig({ [key]: Number(e.target.value) })}
                                            style={styles.select}
                                        >
                                            {opts.map(v => (
                                                <option key={v} value={v}>{v}{v === defaults[key] ? ' (default)' : ''}</option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Group 3 — Behaviour & storage */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                            Behaviour & Storage
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                            {['new_person_timeout', 'top_n', 'embed_n'].map(key => {
                                const meta = GT_LABELS[key];
                                const opts = GT_OPTIONS[key];
                                const defaults = { new_person_timeout: 60, top_n: 10, embed_n: 5 };
                                return (
                                    <div key={key}>
                                        <label style={styles.label}>{meta.label}{meta.unit ? ` (${meta.unit})` : ''}</label>
                                        <select
                                            value={gtConfig[key]}
                                            disabled={gtSaving}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                if (key === 'top_n' && gtConfig.embed_n > val) {
                                                    updateGtConfig({ top_n: val, embed_n: Math.min(gtConfig.embed_n, val) });
                                                } else {
                                                    updateGtConfig({ [key]: val });
                                                }
                                            }}
                                            style={styles.select}
                                        >
                                            {opts.filter(v => key === 'embed_n' ? v <= gtConfig.top_n : true).map(v => (
                                                <option key={v} value={v}>{v}{v === defaults[key] ? ' (default)' : ''}</option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{meta.hint}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {gtConfig.embed_n > gtConfig.top_n && (
                            <div style={{ marginTop: 12, fontSize: 12, color: theme.danger }}>
                                ⚠ Embedding images ({gtConfig.embed_n}) cannot exceed max images/person ({gtConfig.top_n}).
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Liveness / Anti-Spoofing section ───────────────────────── */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>Liveness / Anti-Spoofing</div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
                            Rejects photos or screens held up to the camera during attendance.{' '}
                            {config.onnx_model_loaded
                                ? <span style={{ color: theme.success }}>● ONNX model active</span>
                                : <span style={{ color: theme.warning }}>● Heuristic mode (no ONNX model loaded)</span>}
                        </div>
                    </div>
                    <Toggle
                        checked={config.enabled}
                        disabled={saving}
                        onChange={(val) => updateConfig({ enabled: val })}
                        label={config.enabled ? 'Enabled' : 'Disabled'}
                    />
                </div>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18,
                    opacity: config.enabled ? 1 : 0.45, pointerEvents: config.enabled ? 'auto' : 'none',
                    transition: 'opacity 0.2s',
                }}>
                    <div>
                        <label style={styles.label}>Heuristic threshold</label>
                        <select
                            value={config.heuristic_threshold}
                            disabled={saving}
                            onChange={(e) => updateConfig({ heuristic_threshold: parseFloat(e.target.value) })}
                            style={styles.select}
                        >
                            {HEURISTIC_OPTIONS.map(v => (
                                <option key={v} value={v}>{v.toFixed(2)} {v === 0.15 ? '(default)' : ''}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                            Used when no ONNX model is loaded. Lower = stricter rejection, higher = more lenient.
                        </div>
                    </div>

                    <div>
                        <label style={styles.label}>ONNX model threshold</label>
                        <select
                            value={config.onnx_threshold}
                            disabled={saving}
                            onChange={(e) => updateConfig({ onnx_threshold: parseFloat(e.target.value) })}
                            style={styles.select}
                        >
                            {ONNX_OPTIONS.map(v => (
                                <option key={v} value={v}>{v.toFixed(2)} {v === 0.50 ? '(default)' : ''}</option>
                            ))}
                        </select>
                        <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                            Minimum "live" probability required. Only used if an ONNX model file is present.
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={styles.label}>Save rejected crops</label>
                        <Toggle
                            checked={config.save_rejected_crops}
                            disabled={saving}
                            onChange={(val) => updateConfig({ save_rejected_crops: val })}
                            label={config.save_rejected_crops ? 'Saving to ml-data/liveness_rejected/' : 'Not saving'}
                        />
                        <div style={{ fontSize: 11, color: theme.textMuted }}>
                            Keep this on to review rejection accuracy below.
                        </div>
                    </div>
                </div>

                {typeof config.rejected_this_run === 'number' && (
                    <div style={{ marginTop: 16, fontSize: 12, color: theme.textMuted }}>
                        Rejected so far (current process lifetime): <strong style={{ color: theme.text }}>{config.rejected_this_run}</strong>
                    </div>
                )}
            </div>

        </div>
    );
}
