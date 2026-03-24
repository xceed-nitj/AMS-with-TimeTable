// client/src/attendancemodule/editgroundtruth.jsx
// Page 3: Browse and manage ground truth data — view folders, photos, add/delete

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset } from './config';

export default function EditGroundTruth() {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [students, setStudents] = useState([]);
    const [expandedStudent, setExpandedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    // Add student form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRollNo, setNewRollNo] = useState('');
    const [newFiles, setNewFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ─── Load batches ─────────────────────────────────────────────
    const loadBatches = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/batches`);
            const data = await res.json();
            setBatches(data.batches || []);
        } catch (err) {
            showToast('Failed to load batches', 'error');
        }
    }, []);

    useEffect(() => { loadBatches(); }, [loadBatches]);

    // ─── Load students ────────────────────────────────────────────
    const loadStudents = async (batch) => {
        setSelectedBatch(batch);
        setExpandedStudent(null);
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/batches/${batch}/students`);
            const data = await res.json();
            setStudents(data.students || []);
        } catch (err) {
            showToast('Failed to load students', 'error');
        }
        setLoading(false);
    };

    // ─── Delete student ───────────────────────────────────────────
    const deleteStudent = async (rollNo) => {
        if (!window.confirm(`Remove all ground truth data for ${rollNo}?`)) return;
        try {
            await fetch(`${API_BASE}/student/${selectedBatch}/${rollNo}`, { method: 'DELETE' });
            showToast(`Removed ${rollNo}`);
            loadStudents(selectedBatch);
            loadBatches();
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    // ─── Delete photo ─────────────────────────────────────────────
    const deletePhoto = async (rollNo, filename) => {
        if (!window.confirm('Remove this photo?')) return;
        try {
            await fetch(`${API_BASE}/photo/${selectedBatch}/${rollNo}/${filename}`, { method: 'DELETE' });
            showToast('Photo removed');
            loadStudents(selectedBatch);
        } catch (err) {
            showToast('Delete failed', 'error');
        }
    };

    // ─── Upload new photos for a student ──────────────────────────
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
            const res = await fetch(`${API_BASE}/upload-photos`, { method: 'POST', body: formData });
            const data = await res.json();
            showToast(`${data.totalStored} photo(s) uploaded for ${newRollNo}`);
            setNewRollNo('');
            setNewFiles([]);
            setShowAddForm(false);
            loadStudents(selectedBatch);
            loadBatches();
        } catch (err) {
            showToast('Upload failed', 'error');
        }
        setUploading(false);
    };

    // ─── Create new batch ─────────────────────────────────────────
    const [showNewBatch, setShowNewBatch] = useState(false);
    const [nbDegree, setNbDegree] = useState('BTECH');
    const [nbDept, setNbDept] = useState('');
    const [nbYear, setNbYear] = useState('');

    const createBatch = async () => {
        if (!nbDegree || !nbDept || !nbYear) {
            showToast('Fill all fields', 'error');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/create-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ degree: nbDegree, department: nbDept, year: nbYear })
            });
            const data = await res.json();
            showToast(`Created ${data.batch}`);
            setShowNewBatch(false);
            loadBatches();
        } catch (err) {
            showToast('Create failed', 'error');
        }
    };

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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div>
                    <div style={styles.heading}>Edit Ground Truth</div>
                    <div style={styles.subheading}>Browse folders, view photos, add or remove student data</div>
                </div>
                <button onClick={() => setShowNewBatch(!showNewBatch)} style={styles.btnPrimary}>
                    + New Batch
                </button>
            </div>

            {/* New Batch Form */}
            {showNewBatch && (
                <div style={{ ...styles.card, marginBottom: 20, animation: 'fadeIn 0.2s' }}>
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
                    <button
                        key={b.batch}
                        onClick={() => loadStudents(b.batch)}
                        style={{
                            ...styles.card,
                            padding: '16px', cursor: 'pointer', textAlign: 'left',
                            borderColor: selectedBatch === b.batch ? theme.accent : theme.border,
                            background: selectedBatch === b.batch ? theme.accentDim : theme.surface,
                            transition: 'all 0.15s',
                        }}
                    >
                        <div style={{
                            fontSize: '14px', fontWeight: 700, fontFamily: theme.fontMono,
                            color: selectedBatch === b.batch ? theme.accent : theme.text,
                        }}>
                            {b.batch}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 4 }}>
                            {b.studentCount} student{b.studentCount !== 1 ? 's' : ''}
                        </div>
                    </button>
                ))}
                {batches.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: theme.textMuted }}>
                        No batches yet. Create one or use Ground Truth Generation first.
                    </div>
                )}
            </div>

            {/* Student list */}
            {selectedBatch && (
                <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={styles.sectionTitle}>
                            {selectedBatch} — {students.length} students
                        </div>
                        <button onClick={() => setShowAddForm(!showAddForm)} style={styles.btnGhost}>
                            + Add Student Photos
                        </button>
                    </div>

                    {/* Add Student Form */}
                    {showAddForm && (
                        <div style={{ ...styles.card, marginBottom: 16, animation: 'fadeIn 0.2s' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 12, alignItems: 'end' }}>
                                <div>
                                    <label style={styles.label}>Roll Number</label>
                                    <input
                                        type="text" placeholder="e.g. 23126046"
                                        value={newRollNo} onChange={e => setNewRollNo(e.target.value)}
                                        style={{ ...styles.input, fontFamily: theme.fontMono }}
                                    />
                                </div>
                                <div>
                                    <label style={styles.label}>Photos</label>
                                    <input
                                        type="file" multiple accept="image/*"
                                        onChange={e => setNewFiles(Array.from(e.target.files))}
                                        style={{ ...styles.input, padding: '7px 10px' }}
                                    />
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    style={{ ...styles.btnPrimary, opacity: uploading ? 0.5 : 1 }}
                                >
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Student rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {students.map(s => (
                            <div key={s.rollNo} style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                                {/* Header */}
                                <div
                                    onClick={() => setExpandedStudent(expandedStudent === s.rollNo ? null : s.rollNo)}
                                    style={{
                                        padding: '14px 20px', display: 'flex', alignItems: 'center',
                                        justifyContent: 'space-between', cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <span style={{ fontWeight: 700, fontSize: '14px', fontFamily: theme.fontMono }}>
                                            {s.rollNo}
                                        </span>
                                        <span style={styles.badge(s.photoCount >= 3 ? 'success' : s.photoCount > 0 ? 'warning' : 'danger')}>
                                            {s.photoCount} photo{s.photoCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button
                                            onClick={e => { e.stopPropagation(); deleteStudent(s.rollNo); }}
                                            style={styles.btnDanger}
                                        >
                                            Remove
                                        </button>
                                        <span style={{
                                            color: theme.textMuted, fontSize: '16px',
                                            transform: expandedStudent === s.rollNo ? 'rotate(180deg)' : 'none',
                                            transition: 'transform 0.2s', display: 'inline-block',
                                        }}>
                                            ▾
                                        </span>
                                    </div>
                                </div>

                                {/* Expanded photos */}
                                {expandedStudent === s.rollNo && (
                                    <div style={{
                                        padding: '0 20px 20px', borderTop: `1px solid ${theme.border}`,
                                        paddingTop: 16, animation: 'fadeIn 0.2s',
                                    }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                            gap: 10,
                                        }}>
                                            {s.photos.map((photo) => (
                                                <div key={photo.filename} style={{
                                                    position: 'relative', borderRadius: '8px', overflow: 'hidden',
                                                    border: `1px solid ${theme.border}`, aspectRatio: '1',
                                                }}>
                                                    <img
                                                        src={photo.url}
                                                        alt={photo.filename}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                    />
                                                    <button
                                                        onClick={() => deletePhoto(s.rollNo, photo.filename)}
                                                        style={{
                                                            position: 'absolute', top: 6, right: 6,
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            background: 'rgba(0,0,0,0.7)',
                                                            border: `1px solid ${theme.danger}`,
                                                            color: theme.danger, cursor: 'pointer', fontSize: '13px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: 0,
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        {s.photos.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: 20, color: theme.textMuted, fontSize: '13px' }}>
                                                No photos stored
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {!loading && students.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
                                No students in this batch yet
                            </div>
                        )}
                        {loading && (
                            <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, animation: 'pulse 1.5s infinite' }}>
                                Loading...
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
