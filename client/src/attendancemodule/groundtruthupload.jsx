import { useState, useEffect, useCallback } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset, DEGREES } from './config';
import { useDepartments } from './useDepartments';

const apiUrl      = getEnvironment();
const UPLOAD_BASE = `${apiUrl}/attendancemodule/ground-truth-upload`;
const EMB_API     = `${apiUrl}/attendancemodule/embeddings`;

const T = theme;

const CSS = `
  ${cssReset}
  @keyframes toastIn { from { opacity:0; transform:translateY(-20px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
  @keyframes modalIn { from { opacity:0; transform:translateY(-8px) scale(0.99); } to { opacity:1; transform:translateY(0) scale(1); } }

  .erp-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 6px rgba(26,31,60,0.05); }
  .erp-card-header { padding: 14px 18px; border-bottom: 1px solid ${T.border}; background: ${T.surfaceAlt}; font-size: 11px; color: ${T.textMuted}; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
  .erp-card-body { padding: 20px; }

  .erp-btn {
    padding: 7px 14px; border-radius: 7px; border: none; font-weight: 600; font-size: 12px;
    cursor: pointer; font-family: ${T.fontBody}; transition: opacity .2s; display: inline-flex; align-items: center; gap: 5px;
  }
  .erp-btn:hover { opacity: .85; }
  .erp-btn:disabled { opacity: .45; cursor: not-allowed; }
  .erp-btn-primary { background: ${T.accent}; color: #fff; }
  .erp-btn-ghost { background: transparent; border: 1px solid ${T.border}; color: ${T.textMuted}; }
  .erp-btn-danger { background: ${T.dangerDim}; border: 1px solid rgba(239,68,68,.25); color: ${T.danger}; }
  .erp-btn-warn   { background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25); color: #d97706; }

  .erp-input {
    padding: 8px 12px; border-radius: 7px; border: 1px solid ${T.border};
    background: #f8f9fd; color: ${T.text}; font-family: ${T.fontBody}; font-size: 13px; outline: none;
    transition: border-color .2s; width: 100%;
  }
  .erp-input:focus { border-color: ${T.borderFocus}; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }

  .erp-toast {
    position: fixed; top: 24px; right: 24px; z-index: 999999;
    padding: 13px 20px; border-radius: 8px; display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 600; color: #fff;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,.15);
    animation: toastIn .25s cubic-bezier(.16,1,.3,1) both;
  }

  .erp-modal-overlay {
    position: fixed !important; inset: 0 !important; background: rgba(15,23,42,.45) !important;
    backdrop-filter: blur(5px) !important; display: flex !important; align-items: center !important;
    justify-content: center !important; z-index: 99999999 !important; padding: 20px !important;
    box-sizing: border-box !important;
  }
  .erp-modal-box {
    background: ${T.surface} !important; border: 1px solid ${T.border} !important;
    border-radius: 12px !important; padding: 24px !important; max-width: 420px !important;
    width: 100% !important; box-shadow: 0 20px 25px -5px rgba(0,0,0,.15) !important;
    animation: modalIn .2s cubic-bezier(.16,1,.3,1) both !important;
  }

  .status-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 600;
  }
  .status-pill.ok { background: ${T.successDim}; color: ${T.success}; }
  .status-pill.no { background: ${T.dangerDim}; color: ${T.danger}; }
  .status-pill.na { background: ${T.accentDim}; color: ${T.accent}; }

  .batch-filter-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .batch-display { margin-top: 12px; padding: 10px 14px; background: ${T.bg}; border-radius: 7px; font-size: 13px; color: ${T.textMuted}; border: 1px solid ${T.border}; }

  /* ── Photo card grid ── */
  .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 14px; padding: 20px; }
  .photo-card { background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px; overflow: hidden; transition: box-shadow .18s, border-color .18s; display: flex; flex-direction: column; }
  .photo-card:hover { box-shadow: 0 4px 16px rgba(26,31,60,.10); border-color: ${T.accent}44; }
  .photo-card-img-wrap { width: 100%; aspect-ratio: 1 / 1; overflow: hidden; background: ${T.surfaceAlt}; position: relative; }
  .photo-card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .photo-card-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: ${T.textMuted}; font-size: 36px; }
  .photo-card-body { padding: 10px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .photo-card-roll { font-family: ${T.fontMono}; font-size: 12px; font-weight: 700; color: ${T.text}; text-align: center; word-break: break-all; }
  .photo-card-actions { display: flex; gap: 6px; }
  .photo-card-actions .erp-btn { flex: 1; justify-content: center; padding: 6px 4px; font-size: 11px; }

  .search-bar-wrap { padding: 16px 20px 0; }
  .search-input { padding: 9px 14px 9px 38px; border-radius: 8px; border: 1px solid ${T.border}; background: #f8f9fd; color: ${T.text}; font-family: ${T.fontBody}; font-size: 13px; outline: none; transition: border-color .2s; width: 100%; box-sizing: border-box; }
  .search-input:focus { border-color: ${T.borderFocus}; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
  .search-wrap-inner { position: relative; max-width: 340px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: ${T.textMuted}; pointer-events: none; font-size: 14px; }

  @media (max-width: 768px) {
    .batch-filter-grid { grid-template-columns: 1fr; }
    .erp-toast { left: 16px; right: 16px; top: 16px; }
    .ams-tabs { overflow-x: auto; }
  }
`;

// ── Shared batch selector component ──────────────────────────────────────────
function BatchSelector({ degree, setDegree, department, setDepartment, batchYear, setBatchYear, departments, deptLoading, deptError, batches, batchesLoading, batchName }) {
    return (
        <div className="erp-card" style={{ marginBottom: 20 }}>
            <div className="erp-card-header">Batch Selection</div>
            <div className="erp-card-body">
                <div className="batch-filter-grid">
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {DEGREES.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select value={department} onChange={e => { setDepartment(e.target.value); setBatchYear(''); }} style={styles.select} disabled={deptLoading}>
                            <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select…'}</option>
                            {departments.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Batch Year</label>
                        <select value={batchYear} onChange={e => setBatchYear(e.target.value)} style={styles.select} disabled={batchesLoading}>
                            <option value="">{batchesLoading ? 'Loading…' : batches.length === 0 ? 'No batches' : 'Select…'}</option>
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>
                {batchName && (
                    <div className="batch-display">
                        Target: <strong style={{ color: T.accent, fontFamily: T.fontMono }}>{batchName}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function GroundTruthUpload() {
    const { departments, loading: deptLoading, error: deptError } = useDepartments();

    // ── Shared filter state ───────────────────────────────────────────
    const [degree,       setDegree]       = useState('');
    const [department,   setDepartment]   = useState('');
    const [batchYear,    setBatchYear]    = useState('');
    const [batches,      setBatches]      = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);

    const batchName = (degree && department && batchYear) ? `${degree}_${department}_${batchYear}` : '';

    // ── Active tab ────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('upload');

    // ── Upload tab state ──────────────────────────────────────────────
    const [zipFile,       setZipFile]       = useState(null);
    const [zipUploading,  setZipUploading]  = useState(false);
    const [zipResult,     setZipResult]     = useState(null);
    const [rollNo,        setRollNo]        = useState('');
    const [studentPhoto,  setStudentPhoto]  = useState(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    // ── Manage tab state ──────────────────────────────────────────────
    const [photos,         setPhotos]        = useState([]);
    const [photosLoading,  setPhotosLoading] = useState(false);
    const [editingRoll,    setEditingRoll]   = useState(null); // rollNo being renamed
    const [editValue,      setEditValue]     = useState('');
    const [saving,         setSaving]        = useState(false);
    const [pendingDelete,  setPendingDelete] = useState(null); // {rollNo, ext}
    const [deleting,       setDeleting]      = useState(false);
    const [searchQuery,    setSearchQuery]   = useState('');

    // ── Summary tab state ─────────────────────────────────────────────
    const [summaryBatches,  setSummaryBatches]  = useState([]);
    const [summaryLoading,  setSummaryLoading]  = useState(false);
    const [embFiles,        setEmbFiles]        = useState([]);
    const [regenning,       setRegenning]       = useState({});
    const [zipEmbedStatus,   setZipEmbedStatus]   = useState(null); // null | 'syncing' | 'done' | 'error'
    const [photoEmbedStatus, setPhotoEmbedStatus] = useState(null);

    // ── Toast ─────────────────────────────────────────────────────────
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4500);
    };

    // Fire-and-forget: regenerate ERP embeddings for a batch after any photo change
    const triggerEmbedSync = useCallback((batch) => {
        fetch(`${UPLOAD_BASE}/sync-all/${encodeURIComponent(batch)}`, {
            method: 'POST',
            credentials: 'include',
        }).catch(() => {});
    }, []);

    // ── Load batch years on mount ─────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        setBatchesLoading(true);
        fetch(`${apiUrl}/attendancemodule/settings/batches`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                const years = [...new Set((data.batches || []).map(b => b.batchYear))].filter(Boolean).sort().reverse();
                setBatches(years);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setBatchesLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // ── Load photos when manage tab selected + batch set ─────────────
    useEffect(() => {
        if (activeTab !== 'manage' || !batchName) { setPhotos([]); setSearchQuery(''); return; }
        let cancelled = false;
        setPhotosLoading(true);
        fetch(`${UPLOAD_BASE}/list/${encodeURIComponent(batchName)}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => { if (!cancelled) setPhotos(data.rollNos || []); })
            .catch(() => { if (!cancelled) setPhotos([]); })
            .finally(() => { if (!cancelled) setPhotosLoading(false); });
        return () => { cancelled = true; };
    }, [activeTab, batchName]);

    // ── Load summary data when summary tab selected ───────────────────
    useEffect(() => {
        if (activeTab !== 'summary') return;
        let cancelled = false;
        setSummaryLoading(true);

        // Fetch batch list first — shows table as soon as possible
        fetch(`${UPLOAD_BASE}/summary`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : { batches: [] })
            .then(data => { if (!cancelled) setSummaryBatches(data.batches || []); })
            .catch(() => { if (!cancelled) setSummaryBatches([]); })
            .finally(() => { if (!cancelled) setSummaryLoading(false); });

        // Fetch embedding status independently — updates pills once it arrives
        fetch(`${EMB_API}/list-files`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : { files: [] })
            .then(data => { if (!cancelled) setEmbFiles(data.files || []); })
            .catch(() => {});

        return () => { cancelled = true; };
    }, [activeTab]);

    // ── Upload handlers ───────────────────────────────────────────────
    const handleZipUpload = async () => {
        if (!batchName) { showToast('Please select a Batch', 'error'); return; }
        if (!zipFile)   { showToast('Please select a ZIP file', 'error'); return; }

        setZipUploading(true);
        setZipResult(null);
        const formData = new FormData();
        formData.append('zipFile', zipFile);

        try {
            const res = await fetch(`${UPLOAD_BASE}/upload-zip/${encodeURIComponent(batchName)}`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            setZipResult(data);
            showToast(`Extracted ${data.extractedImages} photos for ${data.extractedFolders} students!`);
            setZipFile(null);
setZipEmbedStatus('syncing');
try {
    await fetch(`${UPLOAD_BASE}/sync-all/${encodeURIComponent(batchName)}`, { method: 'POST', credentials: 'include' });
    setZipEmbedStatus('done');
    setTimeout(() => setZipEmbedStatus(null), 5000);
} catch {
    setZipEmbedStatus('error');
}
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setZipUploading(false);
        }
    };

    const handlePhotoUpload = async () => {
        if (!batchName)  { showToast('Please select a Batch', 'error'); return; }
        if (!rollNo.trim()) { showToast('Please enter a Roll Number', 'error'); return; }
        if (!studentPhoto)  { showToast('Please select a photo', 'error'); return; }

        setPhotoUploading(true);
        const formData = new FormData();
        formData.append('photo', studentPhoto);

        try {
            const res = await fetch(`${UPLOAD_BASE}/upload-photos/${encodeURIComponent(batchName)}/${encodeURIComponent(rollNo.trim())}`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            showToast(`Photo uploaded for ${data.rollNo}`);
            setStudentPhoto(null);
setRollNo('');
setPhotoEmbedStatus('syncing');
try {
    await fetch(`${UPLOAD_BASE}/sync-all/${encodeURIComponent(batchName)}`, { method: 'POST', credentials: 'include' });
    setPhotoEmbedStatus('done');
    setTimeout(() => setPhotoEmbedStatus(null), 5000);
} catch {
    setPhotoEmbedStatus('error');
}
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setPhotoUploading(false);
        }
    };

    // ── Manage tab handlers ───────────────────────────────────────────
    const handleRename = async () => {
        if (!editValue.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`${UPLOAD_BASE}/rename-student`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ batch: batchName, oldRollNo: editingRoll, newRollNo: editValue.trim().toUpperCase() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Rename failed');
            showToast(`Renamed to ${data.newRollNo}`);
            setPhotos(prev => prev.map(p => p.rollNo === editingRoll ? { ...p, rollNo: data.newRollNo } : p));
            setEditingRoll(null);
            setEditValue('');
            triggerEmbedSync(batchName);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmedDelete = async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            const res = await fetch(`${UPLOAD_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(pendingDelete.rollNo)}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted ${pendingDelete.rollNo}`);
            setPhotos(prev => prev.filter(p => p.rollNo !== pendingDelete.rollNo));
            triggerEmbedSync(batchName);
            setPendingDelete(null);
        } catch (err) {
            showToast(err.message, 'error');
            setPendingDelete(null);
        } finally {
            setDeleting(false);
        }
    };

    // ── Summary helpers ───────────────────────────────────────────────
    const parseBatch = (batchStr) => {
        const parts = batchStr.split('_');
        if (parts.length >= 3) {
            return { degree: parts[0], dept: parts.slice(1, -1).join('_'), year: parts[parts.length - 1] };
        }
        return { degree: batchStr, dept: '—', year: '—' };
    };

    const hasEmbedding = (batchStr) => {
        const { dept } = parseBatch(batchStr);
        return embFiles.some(f => f.dept && f.dept.toUpperCase() === dept.toUpperCase());
    };

    const embLastUpdated = (batchStr) => {
        const { dept } = parseBatch(batchStr);
        const files = embFiles.filter(f => f.dept && f.dept.toUpperCase() === dept.toUpperCase());
        const dates = files.map(f => new Date(f.generatedAt || f.modifiedAt)).filter(d => !isNaN(d.getTime()));
        return dates.length ? new Date(Math.max(...dates)) : null;
    };

    const handleRegen = async (batch) => {
        setRegenning(r => ({ ...r, [batch]: true }));
        try {
            await fetch(`${UPLOAD_BASE}/sync-all/${encodeURIComponent(batch)}`, {
                method: 'POST', credentials: 'include',
            });
            showToast(`Embeddings regenerating for ${batch}…`);
            // Refresh embedding list
            fetch(`${EMB_API}/list-files`, { credentials: 'include' })
                .then(r => r.ok ? r.json() : { files: [] })
                .then(d => setEmbFiles(d.files || []));
        } catch (e) {
            showToast(e.message, 'error');
        } finally {
            setRegenning(r => ({ ...r, [batch]: false }));
        }
    };

    // ── Render ────────────────────────────────────────────────────────
    return (
        <div style={{ ...styles.page, padding: 'clamp(16px,3vw,32px)' }}>
            <style>{CSS}</style>

            {/* Toast */}
            {toast && (
                <div className="erp-toast" style={{ background: toast.type === 'error' ? '#ef4444' : '#10b981' }}>
                    <span style={{ fontSize: 15 }}>{toast.type === 'error' ? '⚠' : '✓'}</span>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <div style={styles.heading}>ERP Image Upload</div>
                <div style={styles.subheading}>Upload, manage, and review student ERP photos</div>
            </div>

            {/* Tabs */}
            <div className="ams-tabs">
                {[
                    { id: 'upload',  label: 'Upload' },
                    { id: 'manage',  label: 'Manage Photos' },
                    { id: 'summary', label: 'Summary' },
                ].map(t => (
                    <button key={t.id} className={`ams-tab${activeTab === t.id ? ' active' : ''}`} onClick={() => setActiveTab(t.id)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ══ UPLOAD TAB ════════════════════════════════════════════════════ */}
            {activeTab === 'upload' && (
                <>
                    <BatchSelector {...{ degree, setDegree, department, setDepartment, batchYear, setBatchYear, departments, deptLoading, deptError, batches, batchesLoading, batchName }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* ZIP Upload */}
                        <div className="erp-card">
                            <div className="erp-card-header">Batch ZIP Upload</div>
                            <div className="erp-card-body">
                                <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16, marginTop: 0 }}>
                                    Upload a ZIP with images named by roll number.<br />
                                    e.g. 23104001.jpg, 23104002.png
                                </p>
                                <input
                                    type="file"
                                    accept=".zip"
                                    onChange={e => setZipFile(e.target.files[0])}
                                    style={{ display: 'block', width: '100%', padding: 10, background: T.bg, borderRadius: 7, border: `1px solid ${T.border}`, color: T.text, marginBottom: 14, fontSize: 13 }}
                                />
                                <button
                                    onClick={handleZipUpload}
                                    disabled={zipUploading || !batchName || !zipFile}
                                    className="erp-btn erp-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
                                >
                                    {zipUploading ? 'Extracting ZIP…' : 'Upload & Extract ZIP'}
                                </button>
                                {zipEmbedStatus === 'syncing' && (
    <div style={{ marginTop: 12, padding: '9px 14px', background: T.accentDim,
                  color: T.accent, borderRadius: 7, fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
        Updating embeddings for {batchName}…
    </div>
)}
{zipEmbedStatus === 'done' && (
    <div style={{ marginTop: 12, padding: '9px 14px', background: T.successDim,
                  color: T.success, borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
        ✓ Embeddings updated successfully
    </div>
)}
{zipEmbedStatus === 'error' && (
    <div style={{ marginTop: 12, padding: '9px 14px', background: T.dangerDim,
                  color: T.danger, borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
        ✗ Embedding sync failed
    </div>
)}

                                {zipResult && (
                                    <div style={{ marginTop: 14, padding: '10px 14px', background: T.successDim, borderRadius: 7, border: `1px solid rgba(16,185,129,.25)`, fontSize: 13, color: T.success, fontWeight: 600 }}>
                                        ✓ {zipResult.extractedImages} photos extracted for {zipResult.extractedFolders} students
                                    </div>
                                )}
                                {zipResult?.errors?.length > 0 && (
                                    <div style={{ marginTop: 10, padding: 10, background: T.dangerDim, borderRadius: 7, border: `1px solid rgba(239,68,68,.25)` }}>
                                        <div style={{ fontSize: 12, color: T.danger, fontWeight: 600, marginBottom: 5 }}>Warnings:</div>
                                        <ul style={{ fontSize: 11, color: T.danger, margin: 0, paddingLeft: 16 }}>
                                            {zipResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Individual Upload */}
                        <div className="erp-card">
                            <div className="erp-card-header">Individual Student Upload</div>
                            <div className="erp-card-body">
                                <div style={{ marginBottom: 12 }}>
                                    <label style={styles.label}>Roll Number</label>
                                    <input
                                        type="text"
                                        value={rollNo}
                                        onChange={e => setRollNo(e.target.value.toUpperCase())}
                                        placeholder="e.g. 21BCE001"
                                        className="erp-input"
                                    />
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={styles.label}>Select Photo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setStudentPhoto(e.target.files[0] || null)}
                                        style={{ display: 'block', width: '100%', padding: 10, background: T.bg, borderRadius: 7, border: `1px solid ${T.border}`, color: T.text, fontSize: 13 }}
                                    />
                                </div>
                                <button
                                    onClick={handlePhotoUpload}
                                    disabled={photoUploading || !batchName || !rollNo || !studentPhoto}
                                    className="erp-btn erp-btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: 14 }}
                                >
                                    {photoUploading ? 'Uploading…' : 'Upload Photo'}
                                </button>
                                {photoEmbedStatus === 'syncing' && (
    <div style={{ marginTop: 12, padding: '9px 14px', background: T.accentDim,
                  color: T.accent, borderRadius: 7, fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
        Updating embeddings for {batchName}…
    </div>
)}
{photoEmbedStatus === 'done' && (
    <div style={{ marginTop: 12, padding: '9px 14px', background: T.successDim,
                  color: T.success, borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
        ✓ Embeddings updated successfully
    </div>
)}
{photoEmbedStatus === 'error' && (
    <div style={{ marginTop: 12, padding: '9px 14px', background: T.dangerDim,
                  color: T.danger, borderRadius: 7, fontSize: 13, fontWeight: 600 }}>
        ✗ Embedding sync failed
    </div>
)}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ══ MANAGE TAB ════════════════════════════════════════════════════ */}
            {activeTab === 'manage' && (
                <>
                    <BatchSelector {...{ degree, setDegree, department, setDepartment, batchYear, setBatchYear, departments, deptLoading, deptError, batches, batchesLoading, batchName }} />

                    {!batchName ? (
                        <div className="erp-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                            Select a batch above to view and manage its photos.
                        </div>
                    ) : photosLoading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>Loading photos…</div>
                    ) : (
                        <div className="erp-card">
                            <div className="erp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Photos in <span style={{ color: T.accent }}>{batchName}</span></span>
                                <span style={{ color: T.accent, fontWeight: 700 }}>
                                    {searchQuery
                                        ? `${photos.filter(p => p.rollNo.includes(searchQuery)).length} / ${photos.length} students`
                                        : `${photos.length} students`}
                                </span>
                            </div>

                            {/* Search bar */}
                            <div className="search-bar-wrap">
                                <div className="search-wrap-inner">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        className="search-input"
                                        placeholder="Search roll number…"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value.toUpperCase())}
                                    />
                                </div>
                            </div>

                            {(() => {
                                const filtered = photos.filter(p =>
                                    !searchQuery || p.rollNo.includes(searchQuery)
                                );
                                if (photos.length === 0) return (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                                        No photos found in this batch.
                                    </div>
                                );
                                if (filtered.length === 0) return (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                                        No results for "<strong>{searchQuery}</strong>"
                                    </div>
                                );
                                return (
                                    <div className="photo-grid">
                                        {filtered.map(p => {
                                            const imgUrl = `${apiUrl}/attendancemodule/roll-assign/erp-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(p.rollNo + p.ext)}`;
                                            const isEditing = editingRoll === p.rollNo;
                                            return (
                                                <div className="photo-card" key={p.rollNo}>
                                                    <div className="photo-card-img-wrap">
                                                        <img
                                                            className="photo-card-img"
                                                            src={imgUrl}
                                                            alt={p.rollNo}
                                                            onError={e => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                        <div className="photo-card-img-placeholder" style={{ display: 'none' }}>👤</div>
                                                    </div>
                                                    <div className="photo-card-body">
                                                        {isEditing ? (
                                                            <>
                                                                <input
                                                                    className="erp-input"
                                                                    style={{ fontSize: 12, padding: '6px 10px', textAlign: 'center' }}
                                                                    value={editValue}
                                                                    onChange={e => setEditValue(e.target.value.toUpperCase())}
                                                                    onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setEditingRoll(null); setEditValue(''); } }}
                                                                    autoFocus
                                                                />
                                                                <div className="photo-card-actions">
                                                                    <button
                                                                        className="erp-btn erp-btn-primary"
                                                                        onClick={handleRename}
                                                                        disabled={saving || !editValue.trim()}
                                                                    >
                                                                        {saving ? '…' : 'Save'}
                                                                    </button>
                                                                    <button
                                                                        className="erp-btn erp-btn-ghost"
                                                                        onClick={() => { setEditingRoll(null); setEditValue(''); }}
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="photo-card-roll">{p.rollNo}</div>
                                                                <div className="photo-card-actions">
                                                                    <button
                                                                        className="erp-btn erp-btn-warn"
                                                                        onClick={() => { setEditingRoll(p.rollNo); setEditValue(p.rollNo); }}
                                                                    >
                                                                        ✏ Edit
                                                                    </button>
                                                                    <button
                                                                        className="erp-btn erp-btn-danger"
                                                                        onClick={() => setPendingDelete(p)}
                                                                    >
                                                                        🗑 Delete
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </>
            )}

            {/* ══ SUMMARY TAB ═══════════════════════════════════════════════════ */}
            {activeTab === 'summary' && (
                <>
                    {summaryLoading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: T.textMuted, fontSize: 13 }}>
                            Loading summary…
                        </div>
                    ) : summaryBatches.length === 0 ? (
                        <div className="erp-card" style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
                            No ERP photo batches found.
                        </div>
                    ) : (
                        (() => {
                            // Group batches by department
                            const groups = {};
                            for (const row of summaryBatches) {
                                const { dept } = parseBatch(row.batch);
                                if (!groups[dept]) groups[dept] = [];
                                groups[dept].push(row);
                            }
                            const fmtDate = (d) => d
                                ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '—';
                            return Object.keys(groups).sort().map(dept => (
                                <div key={dept} className="erp-card" style={{ marginBottom: 20 }}>
                                    <div className="erp-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>{dept.replace(/_/g, ' ')}</span>
                                        <span style={{ color: T.accent }}>{groups[dept].length} batch{groups[dept].length !== 1 ? 'es' : ''}</span>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="ams-table">
                                            <thead>
                                                <tr>
                                                    <th>Degree</th>
                                                    <th>Year</th>
                                                    <th style={{ textAlign: 'center' }}>Students</th>
                                                    <th style={{ textAlign: 'center' }}>Embedding Status</th>
                                                    <th>Last Updated</th>
                                                    <th style={{ textAlign: 'center' }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groups[dept].slice().sort((a, b) => a.batch.localeCompare(b.batch)).map(row => {
                                                    const { degree: deg, year } = parseBatch(row.batch);
                                                    const embOk  = hasEmbedding(row.batch);
                                                    const lastDt = embLastUpdated(row.batch);
                                                    const busy   = !!regenning[row.batch];
                                                    return (
                                                        <tr key={row.batch}>
                                                            <td style={{ fontFamily: T.fontMono, fontWeight: 600, fontSize: 12 }}>{deg}</td>
                                                            <td>
                                                                <span style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, fontFamily: T.fontMono }}>
                                                                    {year}
                                                                </span>
                                                            </td>
                                                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{row.count}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                {row.count === 0 ? (
                                                                    <span className="status-pill na">No Photos</span>
                                                                ) : embOk ? (
                                                                    <span className="status-pill ok">✓ Available</span>
                                                                ) : (
                                                                    <span className="status-pill no">✗ Not Available</span>
                                                                )}
                                                            </td>
                                                            <td style={{ fontSize: 12, color: lastDt ? T.text : T.textMuted }}>{fmtDate(lastDt)}</td>
                                                            <td style={{ textAlign: 'center' }}>
                                                                <button
                                                                    className="erp-btn erp-btn-ghost"
                                                                    disabled={busy || row.count === 0}
                                                                    onClick={() => handleRegen(row.batch)}
                                                                    style={{ fontSize: 11, padding: '4px 10px' }}
                                                                    title={`Regenerate embeddings for ${row.batch}`}
                                                                >
                                                                    {busy ? '…' : '↺ Regenerate'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ));
                        })()
                    )}
                </>
            )}

            {/* ── Delete confirmation modal ─────────────────────────────────── */}
            {pendingDelete && (
                <div className="erp-modal-overlay">
                    <div className="erp-modal-box">
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8, fontFamily: T.fontBody }}>
                            Delete Student Photo
                        </div>
                        <div style={{ fontSize: 13.5, color: T.textMuted, lineHeight: 1.55, marginBottom: 22, fontFamily: T.fontBody }}>
                            Are you sure you want to delete the photo for <strong style={{ color: T.text, fontFamily: T.fontMono }}>{pendingDelete.rollNo}</strong>?
                            This will also remove any associated embeddings. This action cannot be undone.
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setPendingDelete(null)}
                                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: T.fontBody }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmedDelete}
                                disabled={deleting}
                                style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, fontFamily: T.fontBody }}
                            >
                                {deleting ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
