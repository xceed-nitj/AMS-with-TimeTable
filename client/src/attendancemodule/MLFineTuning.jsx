// client/src/attendancemodule/MLFineTuning.jsx
// ML Fine Tuning — liveness/anti-spoofing threshold controls + rejected
// sample review, so a non-developer admin can tune detection without
// touching server code or restarting the ML service.

import { useState, useEffect, useCallback } from 'react';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const CONFIG_API = `${apiUrl}/api/v1/ml/liveness-config`;
const SAMPLES_API = `${apiUrl}/api/v1/ml/liveness-rejected-samples`;

// Threshold dropdowns offer a fixed set of sensible values rather than a
// free-text input — keeps an admin from typing an out-of-range or
// nonsensical value, and the server validates 0.0–1.0 anyway as a backstop.
const HEURISTIC_OPTIONS = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40];
const ONNX_OPTIONS      = [0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90];

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
    const [samples, setSamples]     = useState([]);
    const [samplesLoading, setSamplesLoading] = useState(false);
    const [showSamples, setShowSamples] = useState(false);

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

    const loadSamples = async () => {
        setSamplesLoading(true);
        try {
            const res = await fetch(`${SAMPLES_API}?limit=30`);
            const data = await res.json();
            setSamples(data.samples || []);
        } catch (err) {
            showToast('Failed to load rejected samples', 'error');
        }
        setSamplesLoading(false);
    };

    const toggleSamples = () => {
        const next = !showSamples;
        setShowSamples(next);
        if (next && samples.length === 0) loadSamples();
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

            {/* ── Rejected samples review panel ──────────────────────────── */}
            <div style={styles.card}>
                <div
                    onClick={toggleSamples}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>
                        Review Rejected Crops {showSamples ? '▲' : '▼'}
                    </div>
                    <div style={{ fontSize: 12, color: theme.accent }}>
                        {showSamples ? 'Hide' : 'Show recent rejections'}
                    </div>
                </div>

                {showSamples && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <div style={{ fontSize: 12, color: theme.textMuted }}>
                                Most recent rejected face crops — use these to judge whether the threshold is too strict or too lenient.
                            </div>
                            <button onClick={loadSamples} disabled={samplesLoading} style={{ ...styles.btnGhost, padding: '4px 12px', fontSize: 12 }}>
                                {samplesLoading ? 'Loading…' : 'Refresh'}
                            </button>
                        </div>

                        {samplesLoading ? (
                            <div style={{ textAlign: 'center', padding: 30, color: theme.textMuted }}>Loading…</div>
                        ) : samples.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 30, color: theme.textMuted }}>
                                No rejected crops saved yet. They'll appear here once attendance runs reject a spoofed face
                                (requires "Save rejected crops" to be on).
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                                {samples.map((s) => (
                                    <div key={s.filename} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.border}` }}>
                                        <img src={s.image} alt={s.filename} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                                        <div style={{ fontSize: 10, color: theme.textMuted, padding: '4px 6px', wordBreak: 'break-all' }}>
                                            {s.filename}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
