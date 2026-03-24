// client/src/attendancemodule/NamingGroundTruth.jsx
// Page 2: Select best face photos from extracted frames for each student

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset } from './config';

export default function NamingGroundTruth() {
    // Selection
    const [degree, setDegree] = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedPhotos, setSelectedPhotos] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ─── Load students when batch changes ─────────────────────────
    const loadStudents = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setSelectedStudent(null);
        setSelectedPhotos(new Set());

        try {
            const res = await fetch(`${API_BASE}/batches/${batchName}/students`);
            const data = await res.json();
            setStudents(data.students || []);
        } catch (err) {
            showToast('Failed to load students', 'error');
        }
        setLoading(false);
    }, [batchName]);

    useEffect(() => {
        if (batchName) loadStudents();
    }, [batchName, loadStudents]);

    // ─── Toggle photo selection ───────────────────────────────────
    const togglePhoto = (photoUrl) => {
        setSelectedPhotos(prev => {
            const next = new Set(prev);
            if (next.has(photoUrl)) next.delete(photoUrl);
            else next.add(photoUrl);
            return next;
        });
    };

    // ─── Select all / deselect all ────────────────────────────────
    const selectAll = () => {
        if (!selectedStudent) return;
        const allUrls = selectedStudent.photos.map(p => p.url);
        setSelectedPhotos(new Set(allUrls));
    };

    const deselectAll = () => {
        setSelectedPhotos(new Set());
    };

    // ─── Save selected photos ─────────────────────────────────────
    const handleSave = async () => {
        if (!selectedStudent || selectedPhotos.size === 0) {
            showToast('Select at least one photo', 'error');
            return;
        }

        setSaving(true);
        try {
            // For now, the photos are already saved in the folder.
            // This page is about CURATING — removing the bad ones.
            // We delete the unselected photos.
            const unselected = selectedStudent.photos.filter(p => !selectedPhotos.has(p.url));

            for (const photo of unselected) {
                await fetch(`${API_BASE}/photo/${batchName}/${selectedStudent.rollNo}/${photo.filename}`, {
                    method: 'DELETE'
                });
            }

            showToast(`Kept ${selectedPhotos.size} photo(s), removed ${unselected.length} for ${selectedStudent.rollNo}`);

            // Refresh
            await loadStudents();
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        }
        setSaving(false);
    };

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {/* Toast */}
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
                <div style={styles.heading}>Select Best Photos</div>
                <div style={styles.subheading}>
                    Choose the clearest face photos for each student — unselected photos will be removed
                </div>
            </div>

            {/* Batch selector */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            <option value="">Select...</option>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select}>
                            <option value="">Select...</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select...</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>

                {batchName && (
                    <div style={{
                        marginTop: 16, padding: '10px 16px', background: theme.bg, borderRadius: '6px',
                        fontSize: '13px', fontFamily: theme.fontMono,
                    }}>
                        <span style={{ color: theme.textMuted }}>Folder: </span>
                        <span style={{ color: theme.accent, fontWeight: 600 }}>ground_truth/{batchName}/</span>
                        <span style={{ color: theme.textMuted, marginLeft: 16 }}>{students.length} student(s)</span>
                    </div>
                )}
            </div>

            {/* Two-panel layout: student list | photo grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, animation: 'fadeIn 0.3s' }}>

                {/* Student List */}
                <div style={{ ...styles.card, padding: 0, maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ ...styles.sectionTitle, padding: '16px 16px 8px' }}>
                        Students
                    </div>
                    {students.map((s) => (
                        <div
                            key={s.rollNo}
                            onClick={() => {
                                setSelectedStudent(s);
                                setSelectedPhotos(new Set(s.photos.map(p => p.url)));
                            }}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                borderLeft: `3px solid ${selectedStudent?.rollNo === s.rollNo ? theme.accent : 'transparent'}`,
                                background: selectedStudent?.rollNo === s.rollNo ? theme.accentDim : 'transparent',
                                transition: 'all 0.15s',
                            }}
                        >
                            <span style={{
                                fontFamily: theme.fontMono, fontSize: '14px', fontWeight: 600,
                                color: selectedStudent?.rollNo === s.rollNo ? theme.accent : theme.text,
                            }}>
                                {s.rollNo}
                            </span>
                            <span style={styles.badge(s.photoCount >= 3 ? 'success' : s.photoCount > 0 ? 'warning' : 'danger')}>
                                {s.photoCount}
                            </span>
                        </div>
                    ))}
                    {loading && (
                        <div style={{ padding: 20, textAlign: 'center', color: theme.textMuted, animation: 'pulse 1.5s infinite' }}>
                            Loading...
                        </div>
                    )}
                    {!loading && students.length === 0 && batchName && (
                        <div style={{ padding: 20, textAlign: 'center', color: theme.textMuted, fontSize: '13px' }}>
                            No students in this batch
                        </div>
                    )}
                </div>

                {/* Photo Grid */}
                <div style={styles.card}>
                    {selectedStudent ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: '16px', fontWeight: 700, fontFamily: theme.fontMono }}>
                                        {selectedStudent.rollNo}
                                    </div>
                                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 2 }}>
                                        {selectedPhotos.size} of {selectedStudent.photoCount} selected
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={selectAll} style={styles.btnGhost}>Select All</button>
                                    <button onClick={deselectAll} style={styles.btnGhost}>Deselect All</button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving || selectedPhotos.size === 0}
                                        style={{
                                            ...styles.btnPrimary,
                                            opacity: (saving || selectedPhotos.size === 0) ? 0.5 : 1,
                                        }}
                                    >
                                        {saving ? 'Saving...' : 'Save Selection'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                                {selectedStudent.photos.map((photo) => {
                                    const isSelected = selectedPhotos.has(photo.url);
                                    return (
                                        <div
                                            key={photo.filename}
                                            onClick={() => togglePhoto(photo.url)}
                                            style={{
                                                position: 'relative', cursor: 'pointer',
                                                borderRadius: '8px', overflow: 'hidden',
                                                border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                                                aspectRatio: '1',
                                                transition: 'border-color 0.15s',
                                                opacity: isSelected ? 1 : 0.5,
                                            }}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.filename}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                            {/* Checkbox overlay */}
                                            <div style={{
                                                position: 'absolute', top: 8, right: 8,
                                                width: 22, height: 22, borderRadius: '4px',
                                                border: `2px solid ${isSelected ? theme.accent : 'rgba(255,255,255,0.5)'}`,
                                                background: isSelected ? theme.accent : 'rgba(0,0,0,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.15s',
                                            }}>
                                                {isSelected && (
                                                    <span style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>✓</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedStudent.photos.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted }}>
                                    No photos found for this student
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted }}>
                            <div style={{ fontSize: '36px', marginBottom: 12, opacity: 0.4 }}>📸</div>
                            <div style={{ fontSize: '14px' }}>Select a student from the list to review their photos</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
