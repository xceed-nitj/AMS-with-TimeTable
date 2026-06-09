import { useState, useEffect, useCallback } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import { useNavigate } from 'react-router-dom';

const apiUrl  = getEnvironment();
const UPLOAD_BASE = `${apiUrl}/attendancemodule/ground-truth-upload`;

export default function GroundTruthUpload() {
    const navigate = useNavigate();
    const { departments, loading: deptLoading, error: deptError } = useDepartments();

    // ── Filters ──────────────────────────────────────────────────────
    const [department,    setDepartment]    = useState('');
    const [batchName,     setBatchName]     = useState('');
    const [batches,       setBatches]       = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);

    useEffect(() => {
        if (!department) {
            setBatches([]);
            setBatchName('');
            return;
        }

        let cancelled = false;
        setBatchesLoading(true);
        const rawDepartment = department.replace(/_/g, ' ');
        fetch(`${apiUrl}/timetablemodule/mastersem/dept/${encodeURIComponent(rawDepartment)}`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                if (Array.isArray(data)) {
                    // Extract unique sems
                    const sems = [...new Set(data.map(item => item.sem))].filter(Boolean).sort();
                    setBatches(sems);
                } else {
                    setBatches([]);
                }
            })
            .catch(err => {
                if (!cancelled) showToast('Failed to load batches', 'error');
            })
            .finally(() => {
                if (!cancelled) setBatchesLoading(false);
            });

        return () => { cancelled = true; };
    }, [department]);

    // ── Batch ZIP Upload State ───────────────────────────────────────
    const [zipFile, setZipFile] = useState(null);
    const [zipUploading, setZipUploading] = useState(false);
    const [zipResult, setZipResult] = useState(null);

    // ── Individual Photo Upload State ────────────────────────────────
    const [rollNo, setRollNo] = useState('');
    const [studentPhotos, setStudentPhotos] = useState(null);
    const [photosUploading, setPhotosUploading] = useState(false);

    // ── Rename Student State ─────────────────────────────────────────
    const [oldRollNo, setOldRollNo] = useState('');
    const [newRollNo, setNewRollNo] = useState('');
    const [renaming, setRenaming] = useState(false);

    // ── Delete Student State ─────────────────────────────────────────
    const [deleteRollNo, setDeleteRollNo] = useState('');
    const [deleting, setDeleting] = useState(false);

    // ── Toast ────────────────────────────────────────────────────────
    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Handlers ─────────────────────────────────────────────────────
    const handleZipUpload = async () => {
        if (!batchName) {
            showToast('Please select a Batch', 'error');
            return;
        }
        if (!zipFile) {
            showToast('Please select a ZIP file', 'error');
            return;
        }

        setZipUploading(true);
        setZipResult(null);

        const formData = new FormData();
        formData.append('zipFile', zipFile);

        try {
            const res = await fetch(`${UPLOAD_BASE}/upload-zip/${batchName}`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            
            setZipResult(data);
            showToast(`Extracted ${data.extractedImages} photos for ${data.extractedFolders} students!`);
            setZipFile(null);
            
            // Allow user to navigate to editor
            setTimeout(() => {
                if (window.confirm('ZIP extraction complete. Navigate to Photo Editor to verify?')) {
                    navigate('/attendance/groundtruth/photos');
                }
            }, 500);

        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setZipUploading(false);
        }
    };

    const handlePhotoUpload = async () => {
        if (!batchName) {
            showToast('Please select a Batch', 'error');
            return;
        }
        if (!rollNo.trim()) {
            showToast('Please enter a Roll Number', 'error');
            return;
        }
        if (!studentPhotos || studentPhotos.length === 0) {
            showToast('Please select a photo', 'error');
            return;
        }

        setPhotosUploading(true);
        const formData = new FormData();
        formData.append('photo', studentPhotos[0]);

        try {
            const res = await fetch(`${UPLOAD_BASE}/upload-photos/${batchName}/${rollNo.trim()}`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');
            
            showToast(`Successfully uploaded photo for ${data.rollNo}`);
            setStudentPhotos(null);
            setRollNo('');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setPhotosUploading(false);
        }
    };

    const handleRename = async () => {
        if (!batchName) {
            showToast('Please select a Batch', 'error');
            return;
        }
        if (!oldRollNo.trim() || !newRollNo.trim()) {
            showToast('Please enter both current and new roll numbers', 'error');
            return;
        }

        setRenaming(true);
        try {
            const res = await fetch(`${UPLOAD_BASE}/rename-student`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: batchName,
                    oldRollNo: oldRollNo.trim(),
                    newRollNo: newRollNo.trim()
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Rename failed');
            
            showToast(`Successfully renamed to ${data.newRollNo}`);
            setOldRollNo('');
            setNewRollNo('');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setRenaming(false);
        }
    };

    const handleDelete = async () => {
        if (!batchName) {
            showToast('Please select a Batch', 'error');
            return;
        }
        if (!deleteRollNo.trim()) {
            showToast('Please enter the roll number to delete', 'error');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete photos and embeddings for ${deleteRollNo}? This cannot be undone.`)) {
            return;
        }

        setDeleting(true);
        try {
            const res = await fetch(`${UPLOAD_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(deleteRollNo.trim())}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            
            showToast(`Successfully deleted ${deleteRollNo}`);
            setDeleteRollNo('');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeleting(false);
        }
    };


    // ── Render ───────────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    padding: '12px 24px', borderRadius: 8, fontSize: '13px', fontWeight: 600,
                    background: toast.type === 'error' ? '#3f1212' : theme.successDim,
                    color:      toast.type === 'error' ? '#f87171' : theme.success,
                    border: `1px solid ${toast.type === 'error' ? '#f87171' : theme.success}`,
                }}>{toast.msg}</div>
            )}

            <div style={{ marginBottom: 24 }}>
                <div style={styles.heading}>ERP Photo Upload</div>
                <div style={styles.subheading}>Images are stored directly inside the selected batch folder. No student subfolders are created.</div>
            </div>

            {/* Batch Selection Card */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Department</label>
                        <select
                            value={department}
                            onChange={e => {
                                setDepartment(e.target.value);
                                setBatchName(''); // Reset batch when department changes
                            }}
                            style={styles.select}
                            disabled={deptLoading}
                        >
                            <option value="">
                                {deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select...'}
                            </option>
                            {departments.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.label}>Batch</label>
                        <select 
                            value={batchName} 
                            onChange={e => setBatchName(e.target.value)} 
                            style={styles.select}
                            disabled={!department || batchesLoading}
                        >
                            <option value="">
                                {!department 
                                    ? 'Select Department First' 
                                    : (batchesLoading ? 'Loading batches...' : (batches.length === 0 ? 'No batches found' : 'Select...'))}
                            </option>
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Batch ZIP Upload */}
                <div style={styles.card}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: theme.text }}>Batch ZIP Upload</h3>
                    <p style={{ fontSize: '13px', color: theme.textMuted, marginBottom: 16 }}>
                        Upload a ZIP containing student images named by roll number.<br/>
                        Example: 23104001.jpg, 23104002.png, 23104003.webp
                    </p>
                    
                    <input 
                        type="file" 
                        accept=".zip"
                        onChange={e => setZipFile(e.target.files[0])}
                        style={{ marginBottom: 16, display: 'block', width: '100%', padding: '10px', background: theme.bg, borderRadius: '6px', border: `1px solid ${theme.border}`, color: theme.text }}
                    />
                    
                    <button
                        onClick={handleZipUpload}
                        disabled={zipUploading || !batchName || !zipFile}
                        style={{
                            ...styles.btnPrimary,
                            width: '100%',
                            opacity: (zipUploading || !batchName || !zipFile) ? 0.5 : 1,
                        }}
                    >
                        {zipUploading ? 'Extracting ZIP...' : 'Upload & Extract ZIP'}
                    </button>

                    {zipResult && zipResult.errors && zipResult.errors.length > 0 && (
                        <div style={{ marginTop: 16, padding: '10px', background: '#3f1212', borderRadius: '6px' }}>
                            <div style={{ fontSize: '12px', color: '#f87171', fontWeight: 600, marginBottom: 6 }}>Warnings:</div>
                            <ul style={{ fontSize: '11px', color: '#fca5a5', margin: 0, paddingLeft: 16 }}>
                                {zipResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Individual Upload */}
                    <div style={styles.card}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: theme.text }}>Individual Student Upload</h3>
                        
                        <div style={{ marginBottom: 12 }}>
                            <label style={styles.label}>Roll Number</label>
                            <input 
                                type="text" 
                                value={rollNo}
                                onChange={e => setRollNo(e.target.value.toUpperCase())}
                                placeholder="e.g. 21BCE001"
                                style={styles.input}
                            />
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label style={styles.label}>Select Photo</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={e => setStudentPhotos(e.target.files)}
                                style={{ display: 'block', width: '100%', padding: '10px', background: theme.bg, borderRadius: '6px', border: `1px solid ${theme.border}`, color: theme.text }}
                            />
                        </div>

                        <button
                            onClick={handlePhotoUpload}
                            disabled={photosUploading || !batchName || !rollNo || !studentPhotos}
                            style={{
                                ...styles.btnPrimary,
                                width: '100%',
                                opacity: (photosUploading || !batchName || !rollNo || !studentPhotos) ? 0.5 : 1,
                            }}
                        >
                            {photosUploading ? 'Uploading Photos...' : 'Upload Photos'}
                        </button>
                    </div>

                    {/* Rename Student */}
                    <div style={styles.card}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: theme.text }}>Rename Student / Photo</h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={styles.label}>Current Roll Number</label>
                                <input 
                                    type="text" 
                                    value={oldRollNo}
                                    onChange={e => setOldRollNo(e.target.value.toUpperCase())}
                                    style={styles.input}
                                />
                            </div>
                            <div>
                                <label style={styles.label}>New Roll Number</label>
                                <input 
                                    type="text" 
                                    value={newRollNo}
                                    onChange={e => setNewRollNo(e.target.value.toUpperCase())}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleRename}
                            disabled={renaming || !batchName || !oldRollNo || !newRollNo}
                            style={{
                                ...styles.btnPrimary,
                                width: '100%',
                                opacity: (renaming || !batchName || !oldRollNo || !newRollNo) ? 0.5 : 1,
                                background: 'transparent',
                                border: `1px solid ${theme.accent}`,
                                color: theme.accent
                            }}
                        >
                            {renaming ? 'Renaming...' : 'Rename Student'}
                        </button>
                    </div>

                    {/* Delete Student */}
                    <div style={{...styles.card, borderColor: '#fca5a5'}}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: theme.danger }}>Delete Student / Photo</h3>
                        
                        <div style={{ marginBottom: 12 }}>
                            <label style={styles.label}>Roll Number to Delete</label>
                            <input 
                                type="text" 
                                value={deleteRollNo}
                                onChange={e => setDeleteRollNo(e.target.value.toUpperCase())}
                                placeholder="e.g. 21BCE001"
                                style={{...styles.input, borderColor: '#fca5a5'}}
                            />
                        </div>

                        <button
                            onClick={handleDelete}
                            disabled={deleting || !batchName || !deleteRollNo}
                            style={{
                                ...styles.btnPrimary,
                                width: '100%',
                                opacity: (deleting || !batchName || !deleteRollNo) ? 0.5 : 1,
                                background: theme.danger,
                                border: 'none',
                                color: '#fff'
                            }}
                        >
                            {deleting ? 'Deleting...' : 'Delete Student'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
