// client/src/attendancemodule/flaggedassign.jsx
// Review flagged clusters (rejected ERP matches) and manually assign correct roll numbers

import { useState, useEffect, useCallback } from 'react';
import getEnvironment from '../getenvironment';
import { DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';

const apiUrl  = getEnvironment();
const RA_BASE = `${apiUrl}/attendancemodule/roll-assign`;

export default function FlaggedAssign() {
    const [degree,     setDegree]     = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year,       setYear]       = useState('');

    const { departments, loading: deptLoading, error: deptError } = useDepartments();

    const [loading,   setLoading]   = useState(false);
    const [flagged,   setFlagged]   = useState([]);
    const [saving,    setSaving]    = useState(null);
    const [toast,     setToast]     = useState(null);
    const [modal,     setModal]     = useState(null);
    const [rollInput, setRollInput] = useState('');

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const photoUrl = (batch, folder, filename) =>
        `${RA_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    const erpPhotoUrl = (filename) =>
        `${RA_BASE}/erp-photo/${encodeURIComponent(filename)}`;

    // ── Load flagged items ──────────────────────────────────────────
    const loadFlagged = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setFlagged([]);
        try {
            const res  = await fetch(`${RA_BASE}/flagged/${batchName}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setFlagged(data.flagged || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [batchName]);

    useEffect(() => { loadFlagged(); }, [loadFlagged]);

    // ── Resolve flag with correct roll number ──────────────────────
    const handleResolve = async (folderName, rollNo) => {
        const trimmed = rollNo.trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number', 'error'); return; }
        setSaving(folderName);
        try {
            const res  = await fetch(`${RA_BASE}/resolve-flag`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ batch: batchName, folderName, rollNo: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            setFlagged(prev => prev.filter(f => f.folderName !== folderName));
            setModal(null);
            showToast(`✓ Resolved: ${folderName} → ${data.rollNo}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    const openModal = (item) => {
        setModal(item);
        setRollInput('');
    };

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    padding: '12px 24px', borderRadius: 8,
                    fontSize: '13px', fontWeight: 600,
                    background: toast.type === 'error' ? '#3f1212' : theme.successDim,
                    color:      toast.type === 'error' ? '#f87171' : theme.success,
                    border: `1px solid ${toast.type === 'error' ? '#f87171' : theme.success}`,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Modal */}
            {modal && (
                <ResolveModal
                    item={modal}
                    batchName={batchName}
                    photoUrl={photoUrl}
                    erpPhotoUrl={erpPhotoUrl}
                    rollInput={rollInput}
                    setRollInput={setRollInput}
                    saving={saving === modal.folderName}
                    onResolve={() => handleResolve(modal.folderName, rollInput)}
                    onClose={() => setModal(null)}
                />
            )}

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Flagged Assignments</div>
                <div style={styles.subheading}>
                    These clusters were flagged as incorrect matches — manually assign the correct roll number
                </div>
            </div>

            {/* Batch selector */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            style={styles.select}
                            disabled={deptLoading}
                        >
                            <option value="">
                                {deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select...'}
                            </option>
                            {departments.map(d => <option key={d}>{d}</option>)}
                        </select>
                        {deptError && (
                            <div style={{ fontSize: '11px', color: theme.danger, marginTop: 3 }}>{deptError}</div>
                        )}
                    </div>
                    <div>
                        <label style={styles.label}>Year (Batch)</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '40px', color: theme.textMuted }}>
                    Loading flagged items…
                </div>
            )}

            {!loading && batchName && flagged.length > 0 && (
                <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, marginBottom: 14 }}>
                        Flagged Clusters
                        <span style={{
                            marginLeft: 8, fontSize: '12px', fontWeight: 600,
                            background: theme.warning + '22', color: theme.warning,
                            padding: '2px 8px', borderRadius: 10,
                        }}>
                            {flagged.length}
                        </span>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: 14,
                    }}>
                        {flagged.map(item => (
                            <FlaggedCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                saving={saving === item.folderName}
                                onClick={() => openModal(item)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!loading && batchName && flagged.length === 0 && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                    <div style={{ fontSize: '40px', opacity: 0.3, marginBottom: 12 }}>✓</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>
                        No flagged items
                    </div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>
                        All assignments are resolved for this batch
                    </div>
                </div>
            )}

            {!loading && !batchName && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                    <div style={{ fontSize: '36px', opacity: 0.3, marginBottom: 12 }}>⚑</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Select a batch to view flagged items</div>
                </div>
            )}
        </div>
    );
}

// ── Flagged card ───────────────────────────────────────────────
function FlaggedCard({ item, batchName, photoUrl, erpPhotoUrl, onClick }) {
    const flaggedAt = item.flaggedAt
        ? new Date(item.flaggedAt).toLocaleDateString()
        : '';

    return (
        <div
            onClick={onClick}
            style={{
                background: theme.surface,
                border: `1px solid ${theme.warning}55`,
                borderRadius: 10, overflow: 'hidden',
                cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.warning; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.warning + '55'; }}
        >
            {/* Face strip */}
            <div style={{ display: 'flex', height: 80, background: '#000', gap: 1 }}>
                {(item.previewFiles || []).slice(0, 4).map((f, i) => (
                    <img key={i} src={photoUrl(batchName, item.folderName, f)} alt=""
                         style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }}
                         onError={e => { e.target.style.display = 'none'; }} />
                ))}
            </div>

            <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>
                        {item.folderName}
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{flaggedAt}</span>
                </div>

                {item.suggestedRollNo && (
                    <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: 6 }}>
                        Was suggested:
                        <span style={{ color: theme.text, fontWeight: 600, marginLeft: 4 }}>
                            {item.suggestedRollNo}
                        </span>
                        {item.confidence && (
                            <span style={{ color: '#f87171', marginLeft: 4 }}>
                                ({(item.confidence * 100).toFixed(0)}%)
                            </span>
                        )}
                    </div>
                )}

                <div style={{ padding: '5px 8px', borderRadius: 5, textAlign: 'center',
                              background: theme.warning + '22', color: theme.warning,
                              fontSize: '12px', fontWeight: 600 }}>
                    Click to resolve manually
                </div>
            </div>
        </div>
    );
}

// ── Resolve modal ──────────────────────────────────────────────
function ResolveModal({ item, batchName, photoUrl, erpPhotoUrl,
                        rollInput, setRollInput, saving, onResolve, onClose }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                width: '100%', maxWidth: 640,
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${theme.border}`,
                }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: theme.text }}>
                        Resolve — {item.folderName}
                    </div>
                    <button onClick={onClose}
                            style={{ background: 'none', border: 'none', color: theme.textMuted,
                                     fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>
                        ×
                    </button>
                </div>

                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Face images */}
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted,
                                      marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Extracted Face Images
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {(item.previewFiles || []).map((f, i) => (
                                <img key={i} src={photoUrl(batchName, item.folderName, f)} alt=""
                                     style={{ width: 80, height: 80, objectFit: 'cover',
                                              borderRadius: 6, border: `1px solid ${theme.border}` }}
                                     onError={e => { e.target.style.display = 'none'; }} />
                            ))}
                        </div>
                    </div>

                    {/* Previously suggested */}
                    {item.suggestedRollNo && (
                        <div style={{ padding: '10px 14px', borderRadius: 8,
                                      background: '#3f1212', border: '1px solid #f87171' }}>
                            <div style={{ fontSize: '12px', color: '#f87171', marginBottom: 4 }}>
                                Previous suggestion was rejected:
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>
                                {item.suggestedRollNo}
                                {item.confidence && (
                                    <span style={{ marginLeft: 8, fontSize: '12px', color: '#f87171' }}>
                                        ({(item.confidence * 100).toFixed(0)}% confidence)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Manual roll number entry */}
                    <div>
                        <label style={styles.label}>Enter Correct Roll Number</label>
                        <input
                            type="text"
                            placeholder="e.g. 2301001"
                            value={rollInput}
                            onChange={e => setRollInput(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === 'Enter') onResolve(); }}
                            autoFocus
                            style={{ ...styles.input, margin: '6px 0 0', width: '100%',
                                     fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' }}
                        />
                    </div>

                    {/* Resolve button */}
                    <button
                        onClick={onResolve}
                        disabled={saving || !rollInput.trim()}
                        style={{
                            padding: '11px 0', borderRadius: 7, border: 'none',
                            background: theme.success, color: '#000',
                            fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                            opacity: (saving || !rollInput.trim()) ? 0.5 : 1,
                        }}
                    >
                        {saving ? 'Saving…' : '✓ Assign this Roll Number & Resolve'}
                    </button>
                </div>
            </div>
        </div>
    );
}