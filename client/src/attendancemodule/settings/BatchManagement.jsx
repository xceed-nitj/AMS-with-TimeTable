import React, { useState, useEffect } from 'react';
import getEnvironment from '../../getenvironment';
import { theme, styles, cssReset } from '../config';
import { useDepartments } from '../useDepartments';

const apiUrl = getEnvironment();

export default function BatchManagement() {
    const { departments, loading: deptLoading, error: deptError } = useDepartments();

    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [department, setDepartment] = useState('');
    const [program, setProgram] = useState('');
    const [batchYear, setBatchYear] = useState('');
    
    // Programs for selected department
    const [availablePrograms, setAvailablePrograms] = useState([]);
    const [programsLoading, setProgramsLoading] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editYear, setEditYear] = useState('');

    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/attendancemodule/settings/batches`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch batches');
            const data = await res.json();
            setBatches(data.batches || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBatches();
    }, []);

    useEffect(() => {
        if (!department) {
            setAvailablePrograms([]);
            setProgram('');
            return;
        }

        let cancelled = false;
        setProgramsLoading(true);
        
        const rawDepartment = department.replace(/_/g, ' ');
        fetch(`${apiUrl}/timetablemodule/mastersem/dept/${encodeURIComponent(rawDepartment)}`, {
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (cancelled) return;
            if (Array.isArray(data)) {
                // Extract unique degrees by normalizing dirty database values
                const rawDegrees = data.map(item => item.degree).filter(Boolean);
                const normalizedDegrees = rawDegrees.map(deg => {
                    let cleaned = deg.toUpperCase().trim();
                    cleaned = cleaned.replace(/\s+/g, ''); // Remove spaces like "M. Tech" -> "M.Tech"
                    cleaned = cleaned.replace(/\.$/, '');  // Remove trailing dot like "M.Tech." -> "M.Tech"
                    return cleaned;
                });
                const degrees = [...new Set(normalizedDegrees)].sort();
                setAvailablePrograms(degrees);
                if (degrees.length === 1) {
                    setProgram(degrees[0]);
                } else {
                    setProgram('');
                }
            } else {
                setAvailablePrograms([]);
            }
        })
        .catch(err => {
            if (!cancelled) showToast('Failed to load programs', 'error');
        })
        .finally(() => {
            if (!cancelled) setProgramsLoading(false);
        });

        return () => { cancelled = true; };
    }, [department]);

    const handleCreate = async () => {
        if (!department || !program || !batchYear) {
            showToast('Please fill all fields', 'error');
            return;
        }
        if (!/^\d{4}$/.test(batchYear)) {
            showToast('Batch Year must be a 4-digit number', 'error');
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/attendancemodule/settings/batches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ department, program, batchYear })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to create batch');
            
            showToast('Batch created successfully');
            setBatchYear('');
            fetchBatches();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this batch? This will NOT delete uploaded photos, but will remove it from dropdowns.')) {
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/attendancemodule/settings/batches/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to delete batch');
            
            showToast('Batch deleted successfully');
            fetchBatches();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const startEditing = (batch) => {
        setEditingId(batch._id);
        setEditYear(batch.batchYear);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditYear('');
    };

    const handleSaveEdit = async (id) => {
        if (!/^\d{4}$/.test(editYear)) {
            showToast('Batch Year must be a 4-digit number', 'error');
            return;
        }

        try {
            const res = await fetch(`${apiUrl}/attendancemodule/settings/batches/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batchYear: editYear })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to update batch');
            
            showToast('Batch updated successfully');
            setEditingId(null);
            fetchBatches();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <div style={{ ...styles.page, padding: 24, boxSizing: 'border-box' }}>
            <style>{cssReset}</style>

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
                <div style={styles.heading}>Batch Management</div>
                <div style={styles.subheading}>Configure batch identifiers used for ERP Image Upload folder generation.</div>
            </div>

            <div style={{ ...styles.card, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: theme.text }}>Create New Batch</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            style={styles.select}
                            disabled={deptLoading}
                        >
                            <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select...'}</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Program</label>
                        <select
                            value={program}
                            onChange={e => setProgram(e.target.value)}
                            style={styles.select}
                            disabled={!department || programsLoading}
                        >
                            <option value="">
                                {!department 
                                    ? 'Select Department First' 
                                    : (programsLoading ? 'Loading programs...' : (availablePrograms.length === 0 ? 'No programs found' : 'Select...'))}
                            </option>
                            {availablePrograms.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Batch Year</label>
                        <input
                            type="text"
                            value={batchYear}
                            onChange={e => setBatchYear(e.target.value)}
                            placeholder="e.g. 2024"
                            style={styles.input}
                        />
                    </div>
                    <button onClick={handleCreate} style={styles.btnPrimary}>Add Batch</button>
                </div>
            </div>

            <div style={styles.card}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 600, color: theme.text }}>Configured Batches</h3>
                
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: theme.textMuted }}>Loading batches...</div>
                ) : batches.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: theme.textMuted }}>No batches configured yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                <th style={{ padding: '12px 16px', color: theme.textMuted, fontWeight: 600 }}>Department</th>
                                <th style={{ padding: '12px 16px', color: theme.textMuted, fontWeight: 600 }}>Program</th>
                                <th style={{ padding: '12px 16px', color: theme.textMuted, fontWeight: 600 }}>Batch Year</th>
                                <th style={{ padding: '12px 16px', color: theme.textMuted, fontWeight: 600 }}>Generated String</th>
                                <th style={{ padding: '12px 16px', color: theme.textMuted, fontWeight: 600, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.map(b => (
                                <tr key={b._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    <td style={{ padding: '12px 16px', color: theme.text }}>{b.department}</td>
                                    <td style={{ padding: '12px 16px', color: theme.text }}>{b.program}</td>
                                    <td style={{ padding: '12px 16px', color: theme.text }}>
                                        {editingId === b._id ? (
                                            <input 
                                                type="text" 
                                                value={editYear} 
                                                onChange={e => setEditYear(e.target.value)}
                                                style={{...styles.input, padding: '6px', width: '80px'}}
                                            />
                                        ) : b.batchYear}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: theme.textMuted, fontFamily: 'monospace' }}>
                                        {b.batchString}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                        {editingId === b._id ? (
                                            <>
                                                <button onClick={() => handleSaveEdit(b._id)} style={{...styles.btnPrimary, padding: '6px 12px', fontSize: '12px', marginRight: '8px'}}>Save</button>
                                                <button onClick={cancelEditing} style={{background: 'transparent', border: `1px solid ${theme.border}`, color: theme.text, padding: '6px 12px', borderRadius: '6px', fontSize: '12px'}}>Cancel</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEditing(b)} style={{background: 'transparent', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '13px', marginRight: '16px', fontWeight: 500}}>Edit</button>
                                                <button onClick={() => handleDelete(b._id)} style={{background: 'transparent', border: 'none', color: theme.danger, cursor: 'pointer', fontSize: '13px', fontWeight: 500}}>Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
