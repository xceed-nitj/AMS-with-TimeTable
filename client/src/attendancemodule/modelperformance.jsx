// client/src/attendancemodule/modelperformance.jsx
// Page 5: Model performance dashboard — embedding status, generate/regenerate embeddings

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, theme, styles, cssReset } from './config';

export default function ModelPerformance() {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [embResult, setEmbResult] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    // ─── Load batches ─────────────────────────────────────────────
    const loadBatches = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/batches`);
            const data = await res.json();
            setBatches(data.batches || []);
        } catch (err) {
            showToast('Failed to load batches', 'error');
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadBatches(); }, [loadBatches]);

    // ─── Generate embeddings ──────────────────────────────────────
    const handleGenerate = async (batch) => {
        setSelectedBatch(batch);
        setGenerating(true);
        setEmbResult(null);

        try {
            const res = await fetch(`${API_BASE}/generate-embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch })
            });
            const data = await res.json();
            setEmbResult(data);
            showToast(`Embeddings: ${data.successful}/${data.totalStudents} successful for ${batch}`);
        } catch (err) {
            showToast('Embedding generation failed', 'error');
        }
        setGenerating(false);
    };

    // ─── Summary stats ────────────────────────────────────────────
    const totalStudents = batches.reduce((sum, b) => sum + b.studentCount, 0);

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 999, padding: '12px 24px',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 600, animation: 'fadeIn 0.3s',
                    background: toast.type === 'error' ? theme.dangerDim : theme.successDim,
                    color: toast.type === 'error' ? theme.danger : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Model Performance</div>
                <div style={styles.subheading}>Generate & manage ArcFace embeddings per batch — monitor ground truth coverage</div>
            </div>

            {/* Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                {[
                    { label: 'Total Batches', val: batches.length, icon: '📁' },
                    { label: 'Total Students', val: totalStudents, icon: '👤' },
                    { label: 'Avg per Batch', val: batches.length > 0 ? Math.round(totalStudents / batches.length) : 0, icon: '📊' },
                ].map(s => (
                    <div key={s.label} style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ fontSize: '32px' }}>{s.icon}</div>
                        <div>
                            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: theme.fontMono }}>
                                {loading ? '—' : s.val}
                            </div>
                            <div style={{ fontSize: '12px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {s.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Batch Table */}
            <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
                    <div style={{ fontSize: '15px', fontWeight: 700 }}>Batch Embedding Status</div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                            {['Batch', 'Students', 'Status', 'Action'].map(h => (
                                <th key={h} style={{
                                    padding: '12px 20px', textAlign: 'left',
                                    ...styles.label, marginBottom: 0,
                                }}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map(b => (
                            <tr key={b.batch} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                <td style={{ padding: '14px 20px', fontFamily: theme.fontMono, fontWeight: 600 }}>
                                    {b.batch}
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <span style={styles.badge(b.studentCount >= 10 ? 'success' : b.studentCount > 0 ? 'warning' : 'danger')}>
                                        {b.studentCount} student{b.studentCount !== 1 ? 's' : ''}
                                    </span>
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    {b.studentCount > 0 ? (
                                        <span style={{ color: theme.success, fontSize: '12px' }}>Ready to generate</span>
                                    ) : (
                                        <span style={{ color: theme.textMuted, fontSize: '12px' }}>No data</span>
                                    )}
                                </td>
                                <td style={{ padding: '14px 20px' }}>
                                    <button
                                        onClick={() => handleGenerate(b.batch)}
                                        disabled={generating || b.studentCount === 0}
                                        style={{
                                            ...styles.btnPrimary,
                                            padding: '6px 16px', fontSize: '12px',
                                            opacity: (generating || b.studentCount === 0) ? 0.4 : 1,
                                        }}
                                    >
                                        {generating && selectedBatch === b.batch ? 'Generating...' : 'Generate Embeddings'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {loading && (
                            <tr>
                                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: theme.textMuted, animation: 'pulse 1.5s infinite' }}>
                                    Loading batches...
                                </td>
                            </tr>
                        )}
                        {!loading && batches.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: theme.textMuted }}>
                                    No batches found. Create ground truth data first.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Embedding Generation Results */}
            {embResult && (
                <div style={{ ...styles.card, marginTop: 20, animation: 'fadeIn 0.3s' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16 }}>
                        Results — {selectedBatch}
                    </div>

                    {/* Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                        {[
                            { label: 'Total', val: embResult.totalStudents, color: theme.text },
                            { label: 'Success', val: embResult.successful, color: theme.success },
                            { label: 'Failed', val: embResult.failed, color: theme.danger },
                        ].map(s => (
                            <div key={s.label} style={{
                                textAlign: 'center', padding: '16px',
                                background: theme.bg, borderRadius: '8px',
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, fontFamily: theme.fontMono }}>
                                    {s.val}
                                </div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Output file */}
                    <div style={{
                        padding: '10px 16px', background: theme.bg, borderRadius: '6px',
                        fontSize: '13px', fontFamily: theme.fontMono, marginBottom: 16,
                    }}>
                        <span style={{ color: theme.textMuted }}>Output: </span>
                        <span style={{ color: theme.accent, fontWeight: 600 }}>{embResult.embeddingFile}</span>
                    </div>

                    {/* Per-student details */}
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                        {(embResult.details || []).map((d, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 0', borderBottom: `1px solid ${theme.border}`,
                            }}>
                                <span style={{ fontFamily: theme.fontMono, fontWeight: 500 }}>{d.rollNo}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ color: theme.textMuted, fontSize: '12px' }}>
                                        {d.photosUsed} photo{d.photosUsed !== 1 ? 's' : ''}
                                    </span>
                                    <span style={styles.badge(d.status === 'success' ? 'success' : 'danger')}>
                                        {d.status === 'success' ? '✓' : '✗ ' + d.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Processing overlay */}
            {generating && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, zIndex: 50,
                    ...styles.card, padding: '16px 24px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    borderColor: theme.accent, boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
                }}>
                    <div style={{
                        width: 20, height: 20, border: `2px solid ${theme.border}`,
                        borderTopColor: theme.accent, borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        Generating embeddings for {selectedBatch}...
                    </span>
                </div>
            )}
        </div>
    );
}
