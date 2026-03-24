// client/src/attendancemodule/groundtruthgen.jsx
// Page 1: Extract faces from class video, tag each face with a roll number

import { useState, useCallback } from 'react';
import { API_BASE, DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset } from './config';

export default function GroundTruthGen() {
    // Form state
    const [degree, setDegree] = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year, setYear] = useState('');
    const [videoLink, setVideoLink] = useState('');

    // Extraction state
    const [extracting, setExtracting] = useState(false);
    const [faces, setFaces] = useState([]); // [{ id, imageData, rollNo, confirmed }]
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ─── Extract faces from video ─────────────────────────────────
    const handleExtract = useCallback(async () => {
        if (!batchName || !videoLink.trim()) {
            showToast('Fill in all fields and provide a video link', 'error');
            return;
        }

        setExtracting(true);
        setFaces([]);

        try {
            // First, create batch folder
            await fetch(`${API_BASE}/create-batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ degree, department, year })
            });

            // Extract faces from video
            const res = await fetch(`${API_BASE}/extract-faces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoLink: videoLink.trim(), batch: batchName })
            });

            const data = await res.json();

            if (data.error) {
                showToast(data.error, 'error');
                return;
            }

            // Map extracted faces to UI state
            const extracted = (data.faces || []).map((f, i) => ({
                id: f.id || `face_${i}`,
                imageData: f.imageData, // base64
                rollNo: '',
                confirmed: false,
                frameCount: f.frameCount || 1,
            }));

            setFaces(extracted);
            showToast(`${extracted.length} unique face(s) detected`);
        } catch (err) {
            showToast('Failed to extract faces: ' + err.message, 'error');
        } finally {
            setExtracting(false);
        }
    }, [batchName, videoLink, degree, department, year]);

    // ─── Update roll number for a face ────────────────────────────
    const updateRollNo = (faceId, rollNo) => {
        setFaces(prev => prev.map(f =>
            f.id === faceId ? { ...f, rollNo } : f
        ));
    };

    // ─── Confirm/lock a face assignment ───────────────────────────
    const toggleConfirm = (faceId) => {
        setFaces(prev => prev.map(f =>
            f.id === faceId ? { ...f, confirmed: !f.confirmed } : f
        ));
    };

    // ─── Save all confirmed faces ─────────────────────────────────
    const handleSave = async () => {
        const confirmed = faces.filter(f => f.confirmed && f.rollNo.trim());
        if (confirmed.length === 0) {
            showToast('Tag and confirm at least one face before saving', 'error');
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/save-tagged-faces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: batchName,
                    faces: confirmed.map(f => ({
                        rollNo: f.rollNo.trim(),
                        imageData: f.imageData,
                    }))
                })
            });

            const data = await res.json();
            showToast(`${data.saved} face(s) saved to ${batchName}`);
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const confirmedCount = faces.filter(f => f.confirmed && f.rollNo.trim()).length;

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
                <div style={styles.heading}>Ground Truth Generation</div>
                <div style={styles.subheading}>Extract faces from class video → tag with roll numbers → save to ground truth folder</div>
            </div>

            {/* Config Card */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr', gap: 16, marginBottom: 20 }}>
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
                        <label style={styles.label}>Year (Batch)</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select...</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Video Link</label>
                        <input
                            type="text"
                            placeholder="Paste classroom video URL..."
                            value={videoLink}
                            onChange={e => setVideoLink(e.target.value)}
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Folder preview + Extract button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{
                        padding: '10px 16px', background: theme.bg, borderRadius: '6px',
                        fontSize: '13px', fontFamily: theme.fontMono, flex: 1, marginRight: 16,
                    }}>
                        <span style={{ color: theme.textMuted }}>Folder: </span>
                        <span style={{ color: batchName ? theme.accent : theme.textMuted, fontWeight: 600 }}>
                            ground_truth/{batchName || '...'}/
                        </span>
                    </div>

                    <button
                        onClick={handleExtract}
                        disabled={extracting || !batchName || !videoLink.trim()}
                        style={{
                            ...styles.btnPrimary,
                            opacity: (extracting || !batchName || !videoLink.trim()) ? 0.5 : 1,
                            minWidth: 180,
                        }}
                    >
                        {extracting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                                <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: theme.accentText, borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                                Extracting Faces...
                            </span>
                        ) : 'Extract Faces from Video'}
                    </button>
                </div>
            </div>

            {/* Extracted Faces Grid */}
            {faces.length > 0 && (
                <div style={{ animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={styles.sectionTitle}>
                            {faces.length} face(s) detected — tag each with roll number
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={styles.badge(confirmedCount > 0 ? 'success' : 'warning')}>
                                {confirmedCount}/{faces.length} confirmed
                            </span>
                            <button
                                onClick={handleSave}
                                disabled={saving || confirmedCount === 0}
                                style={{
                                    ...styles.btnPrimary,
                                    opacity: (saving || confirmedCount === 0) ? 0.5 : 1,
                                }}
                            >
                                {saving ? 'Saving...' : `Save ${confirmedCount} Face(s)`}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                        {faces.map((face) => (
                            <div
                                key={face.id}
                                style={{
                                    ...styles.card,
                                    padding: 0,
                                    overflow: 'hidden',
                                    borderColor: face.confirmed ? theme.success : theme.border,
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                {/* Face image */}
                                <div style={{ position: 'relative', aspectRatio: '1', background: theme.bg }}>
                                    <img
                                        src={face.imageData}
                                        alt={`Face ${face.id}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                    {face.confirmed && (
                                        <div style={{
                                            position: 'absolute', top: 8, right: 8,
                                            width: 24, height: 24, borderRadius: '50%',
                                            background: theme.success, color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '14px', fontWeight: 700,
                                        }}>
                                            ✓
                                        </div>
                                    )}
                                    {face.frameCount > 1 && (
                                        <div style={{
                                            position: 'absolute', bottom: 8, left: 8,
                                            ...styles.badge('accent'),
                                            fontSize: '10px',
                                        }}>
                                            {face.frameCount} frames
                                        </div>
                                    )}
                                </div>

                                {/* Roll number input + confirm */}
                                <div style={{ padding: '12px' }}>
                                    <label style={{ ...styles.label, marginBottom: 4 }}>Roll Number</label>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input
                                            type="text"
                                            placeholder="e.g. 23126046"
                                            value={face.rollNo}
                                            onChange={e => updateRollNo(face.id, e.target.value)}
                                            disabled={face.confirmed}
                                            style={{
                                                ...styles.input,
                                                fontSize: '13px',
                                                fontFamily: theme.fontMono,
                                                padding: '8px 10px',
                                                opacity: face.confirmed ? 0.6 : 1,
                                            }}
                                        />
                                        <button
                                            onClick={() => toggleConfirm(face.id)}
                                            disabled={!face.rollNo.trim() && !face.confirmed}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                background: face.confirmed ? theme.successDim : theme.accentDim,
                                                color: face.confirmed ? theme.success : theme.accent,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {face.confirmed ? 'Edit' : 'Lock'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!extracting && faces.length === 0 && (
                <div style={{
                    ...styles.card,
                    textAlign: 'center', padding: '60px 20px',
                    borderStyle: 'dashed',
                }}>
                    <div style={{ fontSize: '40px', marginBottom: 12, opacity: 0.4 }}>🎥</div>
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>No faces extracted yet</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>
                        Select degree, department, year → paste video link → click "Extract Faces"
                    </div>
                </div>
            )}

            {/* Extracting state */}
            {extracting && (
                <div style={{
                    ...styles.card,
                    textAlign: 'center', padding: '60px 20px',
                }}>
                    <div style={{
                        width: 40, height: 40, border: `3px solid ${theme.border}`,
                        borderTopColor: theme.accent, borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                    }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>Processing Video</div>
                    <div style={{ fontSize: '13px', color: theme.textMuted }}>
                        Detecting and clustering unique faces... this may take a few minutes
                    </div>
                </div>
            )}
        </div>
    );
}
