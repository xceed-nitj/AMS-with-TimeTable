// client/src/attendancemodule/flaggedassign.jsx
// Review flagged clusters (rejected ERP matches) and manually assign correct roll numbers

import { useState, useEffect, useCallback } from 'react';
import getEnvironment from '../getenvironment';
import { DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';

const apiUrl   = getEnvironment();
const FLAG_BASE = `${apiUrl}/attendancemodule/flags`;

// ── Confidence helpers ────────────────────────────────────────────
const HIGH   = 0.62;
const MEDIUM = 0.45;

function confidenceColor(score) {
    if (score == null) return theme.textMuted;
    if (score >= HIGH)   return theme.success;
    if (score >= MEDIUM) return theme.warning;
    return theme.danger || '#f87171';
}
function confidenceLabel(score) {
    if (score == null) return '';
    if (score >= HIGH)   return 'High';
    if (score >= MEDIUM) return 'Medium';
    return 'Low';
}

// ── Broadcast helper ──────────────────────────────────────────────
function broadcastRefresh(batchName) {
    try {
        new BroadcastChannel('attendance_refresh').postMessage({ type: 'refresh', batch: batchName });
    } catch (_) {}
}

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
        `${FLAG_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;

    const erpPhotoUrl = (filename) =>
        `${FLAG_BASE}/erp-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(filename)}`;

    // ── Load flagged items ──────────────────────────────────────────
    const loadFlagged = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setFlagged([]);
        try {
            const res  = await fetch(`${FLAG_BASE}/flagged/${batchName}`);
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
            const res  = await fetch(`${FLAG_BASE}/resolve-flag`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ batch: batchName, folderName, rollNo: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            // Notify assign page to refresh
            broadcastRefresh(batchName);

            const currentIndex = flagged.findIndex(f => f.folderName === folderName);
            const remaining    = flagged.filter(f => f.folderName !== folderName);
            setFlagged(remaining);

            if (remaining.length > 0) {
                const nextItem = remaining[Math.min(currentIndex, remaining.length - 1)];
                setModal(nextItem);
                setRollInput('');
            } else {
                setModal(null);
            }

            showToast(`✓ Resolved: ${folderName} → ${data.rollNo}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    // ── Open resolve modal ─────────────────────────────────────────
    const openModal = (item) => {
        setModal(item);
        setRollInput(item.suggestedRollNo || '');
    };

    // ── Navigate within the flagged list ──────────────────────────
    const openFlaggedItem = (direction) => {
        if (!modal) return;
        const idx  = flagged.findIndex(f => f.folderName === modal.folderName);
        const next = flagged[idx + direction];
        if (next) {
            setModal(next);
            setRollInput(next.suggestedRollNo || '');
        }
    };

    // ── After folder deleted from inside modal ─────────────────────
    const handleFolderDeleted = () => {
        // Notify assign page to refresh
        broadcastRefresh(batchName);

        const remaining = flagged.filter(f => f.folderName !== modal?.folderName);
        setFlagged(remaining);
        if (remaining.length > 0) {
            setModal(remaining[0]);
            setRollInput(remaining[0].suggestedRollNo || '');
        } else {
            setModal(null);
        }
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

            {/* ── Resolve Modal ── */}
            {modal && (() => {
                const idx     = flagged.findIndex(f => f.folderName === modal.folderName);
                const hasPrev = idx > 0;
                const hasNext = idx < flagged.length - 1;
                return (
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
                        hasPrev={hasPrev}
                        hasNext={hasNext}
                        onPrev={() => openFlaggedItem(-1)}
                        onNext={() => openFlaggedItem(+1)}
                        position={idx + 1}
                        total={flagged.length}
                        showToast={showToast}
                        onFolderDeleted={handleFolderDeleted}
                        onPhotoDeleted={(filename) => {
                            setModal(prev => ({
                                ...prev,
                                previewFiles: (prev.previewFiles || []).filter(f => f !== filename),
                                imageFiles:   (prev.imageFiles   || []).filter(f => f !== filename),
                            }));
                        }}
                    />
                );
            })()}

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

// ── Flagged card ───────────────────────────────────────────────────
function FlaggedCard({ item, batchName, photoUrl, erpPhotoUrl, onClick }) {
    const flaggedAt = item.flaggedAt ? new Date(item.flaggedAt).toLocaleDateString() : '';
    const folder    = item.currentFolder || item.folderName;
    const conf      = item.confidence;

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
            {/* Face strip + ERP thumbnail */}
            <div style={{ display: 'flex', height: 80, background: '#000', gap: 1 }}>
                <div style={{ flex: 1, display: 'flex', gap: 1, overflow: 'hidden' }}>
                    {(item.previewFiles || []).slice(0, 3).map((f, i) => (
                        <img key={i} src={photoUrl(batchName, folder, f)} alt=""
                             style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }}
                             onError={e => { e.target.style.display = 'none'; }} />
                    ))}
                    {!(item.previewFiles || []).length && (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center',
                                      justifyContent: 'center', color: theme.textMuted, fontSize: '11px' }}>
                            No images
                        </div>
                    )}
                </div>
                {item.suggestedRollNo && item.erpPhoto && (
                    <div style={{
                        width: 80, flexShrink: 0,
                        borderLeft: `2px solid ${confidenceColor(conf)}`,
                        position: 'relative',
                    }}>
                        <img
                            src={erpPhotoUrl(item.erpPhoto)} alt="ERP"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            onError={e => { e.target.style.display = 'none'; }}
                        />
                        {conf != null && (
                            <div style={{
                                position: 'absolute', bottom: 3, left: 0, right: 0,
                                textAlign: 'center', fontSize: '9px', fontWeight: 700,
                                color: confidenceColor(conf), background: 'rgba(0,0,0,0.7)', padding: '1px 0',
                            }}>
                                {(conf * 100).toFixed(0)}%
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>
                        {item.folderName}
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{flaggedAt}</span>
                </div>
                {item.suggestedRollNo && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: '12px', color: theme.textMuted, marginBottom: 8,
                    }}>
                        <span>Was:</span>
                        <span style={{ color: theme.text, fontWeight: 700 }}>{item.suggestedRollNo}</span>
                        {conf != null && (
                            <span style={{
                                fontSize: '11px', fontWeight: 600,
                                color: confidenceColor(conf),
                                background: confidenceColor(conf) + '22',
                                padding: '1px 6px', borderRadius: 99,
                            }}>
                                {confidenceLabel(conf)} · {(conf * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                )}
                <div style={{
                    padding: '5px 8px', borderRadius: 5, textAlign: 'center',
                    background: theme.warning + '22', color: theme.warning,
                    fontSize: '12px', fontWeight: 600,
                }}>
                    Click to resolve
                </div>
            </div>
        </div>
    );
}

// ── Resolve Modal — all-in-one: resolve + edit photos + delete folder ──────────
function ResolveModal({
    item, batchName, photoUrl, erpPhotoUrl,
    rollInput, setRollInput, saving, onResolve, onClose,
    hasPrev, hasNext, onPrev, onNext, position, total,
    showToast, onFolderDeleted, onPhotoDeleted,
}) {
    const folder     = item.currentFolder || item.folderName;
    const conf       = item.confidence;
    const candidates = item.candidates || [];

    // ── Edit mode state ───────────────────────────────────────────
    const [editMode,       setEditMode]       = useState(false);
    const [allPhotos,      setAllPhotos]       = useState([]);
    const [loadingPhotos,  setLoadingPhotos]   = useState(false);
    const [deleting,       setDeleting]        = useState(null);
    const [deletingFolder, setDeletingFolder]  = useState(false);

    // Load all photos when edit mode opens
    useEffect(() => {
        if (!editMode) return;
        const load = async () => {
            setLoadingPhotos(true);
            try {
                const res  = await fetch(`${FLAG_BASE}/all-clusters/${batchName}`);
                const data = await res.json();
                if (res.ok) {
                    const found = (data.clusters || []).find(
                        c => c.folderName === item.folderName || c.folderName === folder
                    );
                    if (found) {
                        setAllPhotos(
                            (found.imageFiles || []).map(f => typeof f === 'string' ? f : f.filename)
                        );
                        return;
                    }
                }
            } catch (_) {}
            // Fallback to previewFiles
            setAllPhotos(item.imageFiles?.length ? item.imageFiles : item.previewFiles || []);
        };
        load().finally(() => setLoadingPhotos(false));
    }, [editMode, batchName, item.folderName, folder, item.imageFiles, item.previewFiles]);

    // ── Delete a single photo ─────────────────────────────────────
    const deletePhoto = async (filename) => {
        if (!window.confirm(`Delete "${filename}"?`)) return;
        setDeleting(filename);
        try {
            const res = await fetch(
                `${FLAG_BASE}/cluster-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`,
                { method: 'DELETE' }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            setAllPhotos(prev => prev.filter(f => f !== filename));
            onPhotoDeleted(filename);
            showToast(`Deleted ${filename}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeleting(null);
        }
    };

    // ── Delete entire folder + DB record + flag entry ─────────────
    const deleteFolder = async () => {
        if (!window.confirm(
            `Delete entire folder "${item.folderName}" and remove it from the database?\n\nThis cannot be undone.`
        )) return;
        setDeletingFolder(true);
        try {
            const res = await fetch(
                `${FLAG_BASE}/cluster/${encodeURIComponent(batchName)}/${encodeURIComponent(item.folderName)}`,
                {
                    method:  'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ currentFolder: folder }),
                }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted "${item.folderName}" and removed from DB`);
            // onFolderDeleted already calls broadcastRefresh via handleFolderDeleted in parent
            onFolderDeleted();
        } catch (err) {
            showToast(err.message, 'error');
            setDeletingFolder(false);
        }
    };

    // Keyboard navigation
    useEffect(() => {
        const handler = (e) => {
            if (editMode) return;
            if (e.key === 'ArrowLeft'  && hasPrev && !saving) onPrev();
            if (e.key === 'ArrowRight' && hasNext && !saving) onNext();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [hasPrev, hasNext, saving, onPrev, onNext, onClose, editMode]);

    const navBtnStyle = (enabled) => ({
        padding: '4px 10px', borderRadius: 6, border: `1px solid ${theme.border}`,
        background: enabled ? theme.surface : 'transparent',
        color: enabled ? theme.text : theme.textMuted,
        cursor: enabled ? 'pointer' : 'default',
        fontSize: '14px', fontWeight: 700, opacity: enabled ? 1 : 0.3,
        lineHeight: 1,
    });

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 1000,
                background: 'rgba(0,0,0,0.82)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: theme.surface, border: `1px solid ${theme.border}`,
                borderRadius: 12, width: '100%', maxWidth: editMode ? 900 : 780,
                maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                transition: 'max-width 0.2s',
            }}>
                {/* ── Header ── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, gap: 10,
                }}>
                    {!editMode && (
                        <button onClick={onPrev} disabled={!hasPrev || saving} style={navBtnStyle(hasPrev && !saving)}>&#8592;</button>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: theme.text, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: theme.fontMono }}>{item.folderName}</span>
                            <span style={{
                                fontSize: '11px', fontWeight: 600,
                                background: theme.warning + '22', color: theme.warning,
                                padding: '2px 7px', borderRadius: 8,
                            }}>Flagged</span>
                            {!editMode && total > 1 && (
                                <span style={{
                                    marginLeft: 'auto', fontSize: '11px', color: theme.textMuted,
                                    background: theme.bg, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap',
                                }}>
                                    {position} / {total}
                                </span>
                            )}
                            {editMode && (
                                <span style={{
                                    marginLeft: 4, fontSize: '11px', fontWeight: 600,
                                    background: '#3f1212', color: '#f87171',
                                    padding: '2px 8px', borderRadius: 8,
                                }}>Edit Mode</span>
                            )}
                        </div>
                    </div>

                    {/* ── Action buttons — visible in BOTH resolve and edit mode ── */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {/* 🗑 Delete Folder — always visible */}
                        <button
                            onClick={deleteFolder}
                            disabled={deletingFolder}
                            style={{
                                padding: '5px 12px', borderRadius: 6,
                                border: '1px solid #f87171', background: '#3f1212',
                                color: '#f87171', fontSize: '12px', fontWeight: 700,
                                cursor: deletingFolder ? 'not-allowed' : 'pointer',
                                opacity: deletingFolder ? 0.5 : 1,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {deletingFolder ? 'Deleting…' : '🗑 Delete Folder'}
                        </button>

                        {/* ✏ Edit / ← Back toggle */}
                        {editMode ? (
                            <button
                                onClick={() => setEditMode(false)}
                                style={{
                                    padding: '5px 12px', borderRadius: 6,
                                    border: `1px solid ${theme.border}`, background: 'transparent',
                                    color: theme.textMuted, fontSize: '12px', fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                ← Back
                            </button>
                        ) : (
                            <button
                                onClick={() => setEditMode(true)}
                                style={{
                                    padding: '5px 12px', borderRadius: 6,
                                    border: `1px solid ${theme.border}`, background: 'transparent',
                                    color: theme.textMuted, fontSize: '12px', fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                ✏ Edit Photos
                            </button>
                        )}
                    </div>

                    {!editMode && (
                        <button onClick={onNext} disabled={!hasNext || saving} style={navBtnStyle(hasNext && !saving)}>&#8594;</button>
                    )}
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', marginLeft: 4 }}
                    >
                        ×
                    </button>
                </div>

                {/* ── Body ── */}
                {editMode ? (
                    /* ── EDIT VIEW: photo grid with per-photo delete buttons ── */
                    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                        {item.suggestedRollNo && (
                            <div style={{
                                marginBottom: 14, padding: '8px 14px', borderRadius: 8,
                                background: '#3f1212', border: '1px solid #f87171', fontSize: '12px',
                            }}>
                                <span style={{ color: '#f87171' }}>Rejected suggestion: </span>
                                <span style={{ color: theme.text, fontWeight: 700 }}>{item.suggestedRollNo}</span>
                                {item.confidence != null && (
                                    <span style={{ color: '#f87171', marginLeft: 6 }}>
                                        ({(item.confidence * 100).toFixed(0)}%)
                                    </span>
                                )}
                            </div>
                        )}
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: 12 }}>
                            {loadingPhotos
                                ? 'Loading photos…'
                                : `${allPhotos.length} photo(s) — click ✕ on any photo to delete it from disk and DB`}
                        </div>
                        {loadingPhotos ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Loading…</div>
                        ) : allPhotos.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>No photos in this folder</div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                                gap: 10,
                            }}>
                                {allPhotos.map(filename => (
                                    <div key={filename} style={{
                                        position: 'relative', borderRadius: 8, overflow: 'hidden',
                                        border: `1px solid ${theme.border}`,
                                        opacity: deleting === filename ? 0.25 : 1,
                                        transition: 'opacity 0.15s',
                                    }}>
                                        <img
                                            src={photoUrl(batchName, folder, filename)} alt=""
                                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                                            onError={e => { e.target.style.opacity = '0.15'; }}
                                        />
                                        <button
                                            onClick={() => deletePhoto(filename)}
                                            disabled={!!deleting}
                                            title="Delete this photo"
                                            style={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 24, height: 24, borderRadius: '50%',
                                                background: '#3f1212', border: '1.5px solid #f87171',
                                                color: '#f87171', cursor: deleting ? 'not-allowed' : 'pointer',
                                                fontSize: '13px', fontWeight: 900,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: 0, lineHeight: 1,
                                            }}
                                        >✕</button>
                                        <div style={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            background: 'rgba(0,0,0,0.65)', padding: '3px 5px',
                                            fontSize: '8px', color: '#ccc', textAlign: 'center',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        }}>{filename}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── RESOLVE VIEW ── */
                    <div style={{
                        flex: 1, overflowY: 'auto', padding: 20,
                        display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20,
                        alignItems: 'start',
                    }}>
                        {/* LEFT: face images + delete controls — always visible */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                            {/* Label row */}
                            <div style={{
                                fontSize: '12px', fontWeight: 600, color: theme.textMuted,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                Extracted Face Images
                            </div>

                            {/* ── Photo grid — ✕ always visible on each photo ── */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                {(item.previewFiles || []).map((f, i) => (
                                    <div key={f + i} style={{ position: 'relative' }}>
                                        <img
                                            src={photoUrl(batchName, folder, f)} alt=""
                                            style={{
                                                width: '100%', aspectRatio: '1', objectFit: 'cover',
                                                borderRadius: 6, border: `1px solid ${theme.border}`,
                                                display: 'block',
                                                opacity: deleting === f ? 0.2 : 1,
                                                transition: 'opacity 0.15s',
                                            }}
                                            onError={e => { e.target.style.opacity = '0.1'; }}
                                        />
                                        {/* Always-visible red ✕ delete button */}
                                        <button
                                            onClick={() => {
                                                if (!window.confirm(`Delete this photo?\nRemoves from disk + database.`)) return;
                                                setDeleting(f);
                                                fetch(
                                                    `${FLAG_BASE}/cluster-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`,
                                                    { method: 'DELETE' }
                                                )
                                                .then(r => r.json())
                                                .then(d => {
                                                    if (d.ok) { onPhotoDeleted(f); showToast(`Deleted ${f}`); }
                                                    else showToast(d.error || 'Delete failed', 'error');
                                                })
                                                .catch(err => showToast(err.message, 'error'))
                                                .finally(() => setDeleting(null));
                                            }}
                                            disabled={!!deleting}
                                            title="Delete this photo"
                                            style={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 22, height: 22, borderRadius: '50%',
                                                background: '#3f1212',
                                                border: '1.5px solid #f87171',
                                                color: '#f87171',
                                                cursor: deleting ? 'not-allowed' : 'pointer',
                                                fontSize: '11px', fontWeight: 900,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: 0, lineHeight: 1,
                                                boxShadow: '0 1px 4px rgba(0,0,0,0.7)',
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                {!(item.previewFiles || []).length && (
                                    <div style={{
                                        gridColumn: '1 / -1', padding: '30px 0',
                                        textAlign: 'center', color: theme.textMuted, fontSize: '12px',
                                    }}>
                                        No preview images
                                    </div>
                                )}
                            </div>

                            {/* ── Action buttons row ── */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                {/* Edit all photos */}
                                <button
                                    onClick={() => setEditMode(true)}
                                    style={{
                                        flex: 1, padding: '8px 0', borderRadius: 6,
                                        border: `1px solid ${theme.border}`, background: 'transparent',
                                        color: theme.textMuted, fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✏ Edit All Photos
                                </button>

                                {/* Delete folder */}
                                <button
                                    onClick={deleteFolder}
                                    disabled={deletingFolder}
                                    style={{
                                        flex: 1, padding: '8px 0', borderRadius: 6,
                                        border: '1px solid #f87171', background: '#3f1212',
                                        color: '#f87171', fontSize: '12px', fontWeight: 700,
                                        cursor: deletingFolder ? 'not-allowed' : 'pointer',
                                        opacity: deletingFolder ? 0.5 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    }}
                                >
                                    {deletingFolder ? <><Spinner /> Deleting…</> : '🗑 Delete Folder'}
                                </button>
                            </div>

                            {/* Helper text */}
                            <div style={{ fontSize: '10px', color: '#f8717177', textAlign: 'center' }}>
                                Delete Folder removes all photos, DB record &amp; flag entry permanently
                            </div>
                        </div>

                        {/* RIGHT: ERP match + candidates + roll input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                            {/* ERP Match (Rejected) */}
                            <div>
                                <div style={{
                                    fontSize: '12px', fontWeight: 600, color: theme.textMuted,
                                    marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>
                                    ERP Match (Rejected)
                                </div>

                                {item.suggestedRollNo ? (
                                    <div style={{ textAlign: 'center' }}>
                                        {item.erpPhoto ? (
                                            <img
                                                src={erpPhotoUrl(item.erpPhoto)}
                                                alt="ERP"
                                                style={{
                                                    width: 120, height: 120, objectFit: 'cover',
                                                    borderRadius: 8,
                                                    border: `3px solid ${confidenceColor(conf)}`,
                                                }}
                                                onError={e => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: 120, height: 120, borderRadius: 8, margin: '0 auto',
                                                background: '#3f1212', border: `3px solid #f87171`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '11px', color: '#f87171', textAlign: 'center', padding: 8,
                                            }}>
                                                No ERP photo
                                            </div>
                                        )}
                                        <div style={{
                                            marginTop: 8, fontSize: '15px', fontWeight: 800, color: theme.text,
                                            textDecoration: 'line-through', opacity: 0.6,
                                        }}>
                                            {item.suggestedRollNo}
                                        </div>
                                        {conf != null && (
                                            <div style={{ fontSize: '12px', color: confidenceColor(conf), fontWeight: 600 }}>
                                                {confidenceLabel(conf)} · {(conf * 100).toFixed(1)}%
                                            </div>
                                        )}
                                        <div style={{ marginTop: 4, fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                                            ✕ Operator rejected
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        textAlign: 'center', color: theme.textMuted,
                                        fontSize: '12px', padding: '20px 0',
                                    }}>
                                        No previous ERP suggestion.<br />Enter roll number manually.
                                    </div>
                                )}
                            </div>

                            {/* Other candidates */}
                            {candidates.length > 0 && (
                                <div>
                                    <div style={{
                                        fontSize: '11px', color: theme.textMuted, fontWeight: 600,
                                        marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em',
                                    }}>
                                        Other Candidates
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {candidates.map((c, i) => (
                                            <div key={i}
                                                 onClick={() => setRollInput(c.rollNo)}
                                                 style={{
                                                     display: 'flex', alignItems: 'center', gap: 10,
                                                     padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                                     background: rollInput === c.rollNo ? theme.accentDim : theme.bg,
                                                     border: `1.5px solid ${rollInput === c.rollNo ? theme.accent : theme.border}`,
                                                     transition: 'all 0.12s',
                                                 }}>
                                                {c.erpPhoto && (
                                                    <img src={erpPhotoUrl(c.erpPhoto)} alt=""
                                                         style={{
                                                             width: 56, height: 56, borderRadius: 6,
                                                             objectFit: 'cover', flexShrink: 0,
                                                             border: `2px solid ${confidenceColor(c.confidence)}`,
                                                         }}
                                                         onError={e => { e.target.style.display = 'none'; }}
                                                    />
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: '13px', fontWeight: 700,
                                                        color: theme.text, fontFamily: theme.fontMono,
                                                    }}>
                                                        {c.rollNo}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px', color: confidenceColor(c.confidence),
                                                        fontWeight: 600, marginTop: 2,
                                                    }}>
                                                        {confidenceLabel(c.confidence)} · {(c.confidence * 100).toFixed(1)}%
                                                    </div>
                                                </div>
                                                {rollInput === c.rollNo && (
                                                    <span style={{ fontSize: '14px', color: theme.accent }}>✓</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Roll number input */}
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600, marginBottom: 5 }}>
                                    Correct Roll Number
                                </div>
                                <input
                                    type="text"
                                    placeholder="e.g. 26TT1234"
                                    value={rollInput}
                                    onChange={e => setRollInput(e.target.value.toUpperCase())}
                                    onKeyDown={e => { if (e.key === 'Enter') onResolve(); }}
                                    autoFocus
                                    style={{
                                        ...styles.input, margin: 0,
                                        fontSize: '14px', fontWeight: 700,
                                        textTransform: 'uppercase',
                                    }}
                                />
                            </div>

                            {/* Action button */}
                            <div style={{ marginTop: 'auto' }}>
                                <button
                                    onClick={onResolve}
                                    disabled={saving || !rollInput.trim()}
                                    style={{
                                        width: '100%', padding: '11px 0',
                                        borderRadius: 7, border: 'none',
                                        background: theme.success, color: '#000',
                                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                                        opacity: (saving || !rollInput.trim()) ? 0.5 : 1,
                                    }}
                                >
                                    {saving ? 'Saving…' : '✓ Assign & Resolve'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Small hover-delete photo thumb used in resolve view ────────────
function ResolvePhotoThumb({ src, filename, deleting, onDelete }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            style={{
                position: 'relative', borderRadius: 6, overflow: 'hidden',
                border: `1px solid ${hovered ? '#f87171' : theme.border}`,
                opacity: deleting ? 0.25 : 1,
                transition: 'border-color 0.15s, opacity 0.15s',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img
                src={src} alt=""
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.opacity = '0.1'; }}
            />
            {hovered && !deleting && (
                <button
                    onClick={onDelete}
                    title={`Delete ${filename}`}
                    style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#3f1212', border: '1.5px solid #f87171',
                        color: '#f87171', cursor: 'pointer',
                        fontSize: '14px', fontWeight: 900,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, lineHeight: 1,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.6)',
                    }}
                >
                    ✕
                </button>
            )}
            {deleting && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Spinner />
                </div>
            )}
        </div>
    );
}

// ── Tiny inline spinner ────────────────────────────────────────────
function Spinner() {
    return (
        <span style={{
            display: 'inline-block', width: 14, height: 14,
            border: '2px solid #f8717144',
            borderTopColor: '#f87171',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
        }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </span>
    );
}