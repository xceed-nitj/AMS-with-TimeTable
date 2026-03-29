// client/src/attendancemodule/editgroundtruth.jsx

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset } from './config';

function absPhotoUrl(batch, rollNo, filename) {
    return `${API_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(rollNo)}/${encodeURIComponent(filename)}`;
}

function fixStudentUrls(batch, s) {
    const fix = (list) =>
        (list || []).map(p => ({ ...p, url: absPhotoUrl(batch, s.rollNo, p.filename) }));
    return {
        ...s,
        photos:         fix(s.photos),
        embeddingFiles: fix(s.embeddingFiles),
        backupFiles:    fix(s.backupFiles),
        untrackedFiles: fix(s.untrackedFiles),
    };
}

function PhotoGroup({ label, accent, hint, photos, onDelete, onMove, moveLabel, moveTitle, busy }) {
    if (!photos || photos.length === 0) return null;
    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                               letterSpacing: '0.06em', color: accent }}>
                    {label}
                </span>
                <span style={{ fontSize: '11px', color: theme.textMuted }}>{hint}</span>
                <span style={{ marginLeft: 4, fontSize: '10px', fontWeight: 600,
                               background: accent + '22', color: accent,
                               padding: '1px 6px', borderRadius: 8 }}>
                    {photos.length}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                {photos.map(photo => (
                    <div key={photo.filename} style={{
                        position: 'relative', borderRadius: 7, overflow: 'hidden',
                        border: `2px solid ${accent}55`, aspectRatio: '1', background: theme.bg,
                        opacity: busy === photo.filename ? 0.5 : 1,
                        transition: 'opacity 0.15s',
                    }}>
                        <img src={photo.url} alt={photo.filename}
                             style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                             onError={e => { e.target.style.display = 'none'; }} />
                        {photo.score != null && (
                            <div style={{ position: 'absolute', bottom: 3, left: 3, fontSize: '9px',
                                          fontWeight: 700, background: 'rgba(0,0,0,0.65)', color: '#fff',
                                          padding: '1px 4px', borderRadius: 3 }}>
                                {photo.score.toFixed(2)}
                            </div>
                        )}
                        {onMove && (
                            <button
                                title={moveTitle}
                                onClick={e => { e.stopPropagation(); onMove(photo.filename); }}
                                disabled={busy === photo.filename}
                                style={{ position: 'absolute', top: 4, left: 4,
                                         height: 18, borderRadius: 3, padding: '0 5px',
                                         background: 'rgba(0,0,0,0.8)', border: `1px solid ${accent}`,
                                         color: accent, cursor: 'pointer', fontSize: '9px',
                                         fontWeight: 700, lineHeight: '16px', whiteSpace: 'nowrap' }}>
                                {moveLabel}
                            </button>
                        )}
                        <button
                            title="Delete photo"
                            onClick={e => { e.stopPropagation(); onDelete(photo.filename); }}
                            disabled={busy === photo.filename}
                            style={{ position: 'absolute', top: 4, right: 4,
                                     width: 18, height: 18, borderRadius: '50%',
                                     background: 'rgba(0,0,0,0.75)', border: `1px solid ${theme.danger}`,
                                     color: theme.danger, cursor: 'pointer', fontSize: '11px',
                                     display: 'flex', alignItems: 'center', justifyContent: 'center',
                                     padding: 0 }}>
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function EditGroundTruth() {
    const [batches,         setBatches]         = useState([]);
    const [selectedBatch,   setSelectedBatch]   = useState(null);
    const [students,        setStudents]        = useState([]);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [loading,         setLoading]         = useState(false);
    const [toast,           setToast]           = useState(null);
    const [search,          setSearch]          = useState('');
    const [busyPhoto,       setBusyPhoto]       = useState(null); // filename currently being acted on

    const [showAddForm, setShowAddForm] = useState(false);
    const [newRollNo,   setNewRollNo]   = useState('');
    const [newFiles,    setNewFiles]    = useState([]);
    const [uploading,   setUploading]   = useState(false);

    const [showNewBatch, setShowNewBatch] = useState(false);
    const [nbDegree,     setNbDegree]     = useState('BTECH');
    const [nbDept,       setNbDept]       = useState('');
    const [nbYear,       setNbYear]       = useState('');

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── Load batches ─────────────────────────────────────────────
    const loadBatches = useCallback(async () => {
        try {
            const res  = await fetch(`${API_BASE}/batches`);
            const data = await res.json();
            setBatches(data.batches || []);
        } catch {
            showToast('Failed to load batches', 'error');
        }
    }, []);

    useEffect(() => { loadBatches(); }, [loadBatches]);

    // ─── Load / refresh students — preserves expandedStudent ────
    const loadStudents = useCallback(async (batch, keepExpanded = false) => {
        if (!keepExpanded) setExpandedStudent(null);
        setSelectedBatch(batch);
        setLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/batches/${batch}/students`);
            const data = await res.json();
            setStudents((data.students || []).map(s => fixStudentUrls(batch, s)));
        } catch {
            showToast('Failed to load students', 'error');
        }
        setLoading(false);
    }, []);

    // ─── Update one student in-place (avoids full reload collapsing rows) ──
    const refreshStudent = useCallback(async (batch, rollNo) => {
        try {
            const res  = await fetch(`${API_BASE}/batches/${batch}/students`);
            const data = await res.json();
            const updated = (data.students || []).find(s => s.rollNo === rollNo);
            if (updated) {
                setStudents(prev => prev.map(s =>
                    s.rollNo === rollNo ? fixStudentUrls(batch, updated) : s
                ));
            }
        } catch {
            showToast('Refresh failed', 'error');
        }
    }, []);

    // ─── Delete student ───────────────────────────────────────────
    const deleteStudent = async (rollNo) => {
        if (!window.confirm(`Remove all ground truth data for ${rollNo}?`)) return;
        try {
            await fetch(`${API_BASE}/student/${selectedBatch}/${rollNo}`, { method: 'DELETE' });
            setStudents(prev => prev.filter(s => s.rollNo !== rollNo));
            if (expandedStudent === rollNo) setExpandedStudent(null);
            showToast(`Removed ${rollNo}`);
            loadBatches();
        } catch {
            showToast('Delete failed', 'error');
        }
    };

    // ─── Delete photo ─────────────────────────────────────────────
    const deletePhoto = async (rollNo, filename) => {
        if (!window.confirm('Remove this photo?')) return;
        setBusyPhoto(filename);
        try {
            await fetch(`${API_BASE}/photo/${selectedBatch}/${rollNo}/${filename}`, { method: 'DELETE' });
            showToast('Photo removed');
            await refreshStudent(selectedBatch, rollNo);
        } catch {
            showToast('Delete failed', 'error');
        }
        setBusyPhoto(null);
    };

    // ─── Move photo: promote → embedding, demote → backup ────────
    const movePhoto = async (rollNo, filename, direction) => {
        const student = students.find(s => s.rollNo === rollNo);
        if (!student) return;

        const currentEmb = student.embeddingFiles.map(p => p.filename);
        let newEmbedding;
        if (direction === 'promote') {
            newEmbedding = [...new Set([...currentEmb, filename])];
        } else {
            newEmbedding = currentEmb.filter(f => f !== filename);
            if (newEmbedding.length === 0) {
                showToast('Must keep at least one embedding image', 'error');
                return;
            }
        }

        setBusyPhoto(filename);
        try {
            const res  = await fetch(`${API_BASE}/update-embedding`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ batch: selectedBatch, rollNo, embeddingFiles: newEmbedding }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Embedding updated — ${data.embedding_files_used} active`);
            await refreshStudent(selectedBatch, rollNo);
        } catch (err) {
            showToast(err.message, 'error');
        }
        setBusyPhoto(null);
    };

    // ─── Upload photos ────────────────────────────────────────────
    const handleUpload = async () => {
        if (!newRollNo.trim() || newFiles.length === 0) {
            showToast('Enter roll number and select photos', 'error');
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append('batch', selectedBatch);
        formData.append('rollNo', newRollNo.trim());
        newFiles.forEach(f => formData.append('photos', f));
        try {
            const res  = await fetch(`${API_BASE}/upload-photos`, { method: 'POST', body: formData });
            const data = await res.json();
            showToast(`${data.totalStored} photo(s) uploaded for ${newRollNo}`);
            setNewRollNo('');
            setNewFiles([]);
            setShowAddForm(false);
            loadStudents(selectedBatch, true);
            loadBatches();
        } catch {
            showToast('Upload failed', 'error');
        }
        setUploading(false);
    };

    // ─── Create batch ─────────────────────────────────────────────
    const createBatch = async () => {
        if (!nbDegree || !nbDept || !nbYear) { showToast('Fill all fields', 'error'); return; }
        try {
            const res  = await fetch(`${API_BASE}/create-batch`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ degree: nbDegree, department: nbDept, year: nbYear }),
            });
            const data = await res.json();
            showToast(`Created ${data.batch}`);
            setShowNewBatch(false);
            loadBatches();
        } catch {
            showToast('Create failed', 'error');
        }
    };

    const filteredStudents = search.trim()
        ? students.filter(s => s.rollNo.toLowerCase().includes(search.trim().toLowerCase()))
        : students;

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    padding: '12px 24px', borderRadius: 8, fontSize: '13px', fontWeight: 600,
                    background: toast.type === 'error' ? theme.dangerDim  : theme.successDim,
                    color:      toast.type === 'error' ? theme.danger      : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <div style={styles.heading}>Edit Ground Truth</div>
                    <div style={styles.subheading}>Browse folders, curate photos, manage embeddings</div>
                </div>
                <button onClick={() => setShowNewBatch(!showNewBatch)} style={styles.btnPrimary}>
                    + New Batch
                </button>
            </div>

            {/* New Batch Form */}
            {showNewBatch && (
                <div style={{ ...styles.card, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                        <div>
                            <label style={styles.label}>Degree</label>
                            <select value={nbDegree} onChange={e => setNbDegree(e.target.value)} style={styles.select}>
                                {DEGREES.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Department</label>
                            <select value={nbDept} onChange={e => setNbDept(e.target.value)} style={styles.select}>
                                <option value="">Select...</option>
                                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Year</label>
                            <select value={nbYear} onChange={e => setNbYear(e.target.value)} style={styles.select}>
                                <option value="">Select...</option>
                                {YEARS.map(y => <option key={y}>{y}</option>)}
                            </select>
                        </div>
                        <button onClick={createBatch} style={styles.btnPrimary}>Create</button>
                    </div>
                </div>
            )}

            {/* Batch grid */}
            <div style={styles.sectionTitle}>Batches — {batches.length} total</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 28 }}>
                {batches.map(b => (
                    <button key={b.batch} onClick={() => { setSearch(''); loadStudents(b.batch); }}
                        style={{
                            ...styles.card, padding: '16px', cursor: 'pointer', textAlign: 'left',
                            borderColor: selectedBatch === b.batch ? theme.accent : theme.border,
                            background:  selectedBatch === b.batch ? theme.accentDim : theme.surface,
                            transition: 'all 0.15s',
                        }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, fontFamily: theme.fontMono,
                                      color: selectedBatch === b.batch ? theme.accent : theme.text }}>
                            {b.batch}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 4 }}>
                            {b.studentCount} student{b.studentCount !== 1 ? 's' : ''}
                        </div>
                    </button>
                ))}
                {batches.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: theme.textMuted }}>
                        No batches yet.
                    </div>
                )}
            </div>

            {/* Student list */}
            {selectedBatch && (
                <div>
                    {/* Toolbar: title + search + add */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ ...styles.sectionTitle, marginBottom: 0, flexShrink: 0 }}>
                            {selectedBatch} — {students.length} students
                        </div>
                        <input
                            type="text"
                            placeholder="Search roll number…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{
                                ...styles.input,
                                flex: 1, maxWidth: 260,
                                padding: '6px 12px', fontSize: '13px',
                                fontFamily: theme.fontMono,
                            }}
                        />
                        {search && (
                            <span style={{ fontSize: '12px', color: theme.textMuted }}>
                                {filteredStudents.length} match{filteredStudents.length !== 1 ? 'es' : ''}
                            </span>
                        )}
                        <button onClick={() => setShowAddForm(!showAddForm)} style={{ ...styles.btnGhost, marginLeft: 'auto' }}>
                            + Add Student Photos
                        </button>
                    </div>

                    {/* Add Student Form */}
                    {showAddForm && (
                        <div style={{ ...styles.card, marginBottom: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 12, alignItems: 'end' }}>
                                <div>
                                    <label style={styles.label}>Roll Number</label>
                                    <input type="text" placeholder="e.g. 23126046"
                                           value={newRollNo} onChange={e => setNewRollNo(e.target.value)}
                                           style={{ ...styles.input, fontFamily: theme.fontMono }} />
                                </div>
                                <div>
                                    <label style={styles.label}>Photos</label>
                                    <input type="file" multiple accept="image/*"
                                           onChange={e => setNewFiles(Array.from(e.target.files))}
                                           style={{ ...styles.input, padding: '7px 10px' }} />
                                </div>
                                <button onClick={handleUpload} disabled={uploading}
                                        style={{ ...styles.btnPrimary, opacity: uploading ? 0.5 : 1 }}>
                                    {uploading ? 'Uploading…' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Student rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredStudents.map(s => (
                            <div key={s.rollNo} style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                                {/* Row header — click to expand */}
                                <div
                                    onClick={() => setExpandedStudent(expandedStudent === s.rollNo ? null : s.rollNo)}
                                    style={{ padding: '12px 20px', display: 'flex', alignItems: 'center',
                                             justifyContent: 'space-between', cursor: 'pointer',
                                             userSelect: 'none' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '14px', fontFamily: theme.fontMono }}>
                                            {s.rollNo}
                                        </span>
                                        <span style={styles.badge(s.photoCount >= 3 ? 'success' : s.photoCount > 0 ? 'warning' : 'danger')}>
                                            {s.photoCount} photo{s.photoCount !== 1 ? 's' : ''}
                                        </span>
                                        {s.hasInfo && (
                                            <>
                                                <span style={styles.badge('accent')}>
                                                    {s.embeddingFiles.length} embedding
                                                </span>
                                                {s.backupFiles.length > 0 && (
                                                    <span style={styles.badge('warning')}>
                                                        {s.backupFiles.length} backup
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <span style={{
                                        color: theme.textMuted, fontSize: '16px', flexShrink: 0,
                                        transform: expandedStudent === s.rollNo ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.2s', display: 'inline-block',
                                    }}>▾</span>
                                </div>

                                {/* Expanded photos */}
                                {expandedStudent === s.rollNo && (
                                    <div style={{ padding: '0 20px 20px', paddingTop: 14,
                                                  borderTop: `1px solid ${theme.border}` }}>
                                        {/* Delete student link — subtle, not a prominent button */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                                            <button
                                                onClick={e => { e.stopPropagation(); deleteStudent(s.rollNo); }}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer',
                                                         fontSize: '11px', color: theme.danger, padding: 0,
                                                         textDecoration: 'underline' }}>
                                                Delete student
                                            </button>
                                        </div>

                                        {s.photos.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: 20,
                                                          color: theme.textMuted, fontSize: '13px' }}>
                                                No photos stored
                                            </div>
                                        ) : s.hasInfo ? (
                                            <>
                                                <PhotoGroup
                                                    label="Embedding" accent={theme.accent}
                                                    hint="used for face recognition"
                                                    photos={s.embeddingFiles}
                                                    onDelete={(f) => deletePhoto(s.rollNo, f)}
                                                    onMove={(f) => movePhoto(s.rollNo, f, 'demote')}
                                                    moveLabel="→ Backup"
                                                    moveTitle="Move to backup"
                                                    busy={busyPhoto}
                                                />
                                                <PhotoGroup
                                                    label="Backup" accent={theme.warning}
                                                    hint="stored but not active — click ↑ to promote"
                                                    photos={s.backupFiles}
                                                    onDelete={(f) => deletePhoto(s.rollNo, f)}
                                                    onMove={(f) => movePhoto(s.rollNo, f, 'promote')}
                                                    moveLabel="↑ Embed"
                                                    moveTitle="Promote to embedding"
                                                    busy={busyPhoto}
                                                />
                                                <PhotoGroup
                                                    label="Other" accent={theme.textMuted}
                                                    hint="manually added — click ↑ to include in embedding"
                                                    photos={s.untrackedFiles}
                                                    onDelete={(f) => deletePhoto(s.rollNo, f)}
                                                    onMove={(f) => movePhoto(s.rollNo, f, 'promote')}
                                                    moveLabel="↑ Embed"
                                                    moveTitle="Add to embedding"
                                                    busy={busyPhoto}
                                                />
                                            </>
                                        ) : (
                                            <PhotoGroup
                                                label="Photos" accent={theme.textMuted}
                                                hint="no embedding metadata yet"
                                                photos={s.photos}
                                                onDelete={(f) => deletePhoto(s.rollNo, f)}
                                                busy={busyPhoto}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {!loading && filteredStudents.length === 0 && students.length > 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
                                No students match "{search}"
                            </div>
                        )}
                        {!loading && students.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
                                No students in this batch yet
                            </div>
                        )}
                        {loading && (
                            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
                                Loading…
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
