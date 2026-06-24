import { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset, DEGREES, YEARS } from './config';
import { useDepartments } from './useDepartments';

const apiUrl = getEnvironment();
const API_BASE = `${apiUrl}/attendancemodule/unknown-faces`;

export default function UnknownFaces({ embedded = false, defaultDate = '', defaultDept = '', fixedDept = '' }) {
    const [clusters, setClusters] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [editModal, setEditModal] = useState({ open: false, clusterPath: null, currentRollNo: '' });
    const [galleryModal, setGalleryModal] = useState({ open: false, cluster: null });

    // Filters
    const [filterDate, setFilterDate] = useState(defaultDate);
    const [filterDept, setFilterDept] = useState(fixedDept || defaultDept);
    const [filterStatus, setFilterStatus] = useState('');
    
    const { departments, deptLoading, deptError } = useDepartments();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchClusters = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterDate) params.append('date', filterDate);
            if (filterDept) params.append('department', filterDept);
            if (filterStatus) params.append('status', filterStatus);

            const res = await fetch(`${API_BASE}?${params}`);
            const data = await res.json();
            
            if (data.error) {
                showToast(data.error, 'error');
            } else {
                setClusters(data.clusters || []);
                setStats(data.stats);
            }
        } catch (error) {
            showToast('Failed to fetch data', 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClusters();
    }, [filterDate, filterDept, filterStatus]);

    const updateStatus = async (clusterPath, newStatus) => {
        try {
            const res = await fetch(`${API_BASE}/cluster/${encodeURIComponent(clusterPath)}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to update status');
            
            showToast(`Marked as ${newStatus}`);
            fetchClusters();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const deleteCluster = async (clusterPath) => {
        if (!window.confirm('Delete this cluster forever?')) return;
        try {
            const res = await fetch(`${API_BASE}/cluster/${encodeURIComponent(clusterPath)}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to delete cluster');
            
            showToast('Cluster deleted');
            fetchClusters();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const downloadCluster = (clusterPath) => {
        window.open(`${API_BASE}/cluster/${encodeURIComponent(clusterPath)}/download`, '_blank');
    };

    const openEditModal = (clusterPath, currentRollNo) => {
        setEditModal({ open: true, clusterPath, currentRollNo: currentRollNo || '' });
    };

    const saveEditRollNo = async () => {
        const { clusterPath, currentRollNo } = editModal;
        const newRoll = currentRollNo.trim();
        if (!newRoll) {
            setEditModal({ open: false });
            return;
        }
        
        try {
            const res = await fetch(`${API_BASE}/cluster/${encodeURIComponent(clusterPath)}/rollno`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rollNo: newRoll })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            showToast('Roll No updated & saved to Ground Truth!');
            fetchClusters();
        } catch (error) {
            showToast(error.message, 'error');
        }
        setEditModal({ open: false });
    };

    return (
        <div style={embedded ? {} : styles.page}>
            {!embedded && <style>{cssReset}</style>}
            
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    animation: 'fadeIn 0.3s',
                    background: toast.type === 'error' ? theme.dangerDim  : theme.successDim,
                    color:      toast.type === 'error' ? theme.danger      : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>{toast.msg}</div>
            )}

            {!embedded && (
                <div style={{ marginBottom: 24 }}>
                    <div style={styles.heading}>Unknown Faces Debug</div>
                    <div style={styles.subheading}>Review unrecognized faces from live attendance</div>
                </div>
            )}

            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                    {[
                        { label: 'Total', val: stats.totalClusters ?? stats.total, color: theme.text },
                        { label: 'New Today', val: stats.newToday, color: theme.accent },
                        { label: 'Reviewed', val: stats.reviewedCount ?? stats.reviewed, color: theme.success },
                        { label: 'Archived', val: stats.archivedCount ?? stats.archived, color: theme.textMuted },
                        { label: 'Avg Similarity', val: `${Math.round((stats.avgConfidence || 0) * 100)}%`, color: theme.warning }
                    ].map(s => (
                        <div key={s.label} style={{ ...styles.card, textAlign: 'center', padding: '16px' }}>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color, fontFamily: theme.fontMono }}>{s.val}</div>
                            <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ ...styles.card, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div>
                    <label style={{ fontSize: '11px', color: theme.textMuted, display: 'block', marginBottom: 4 }}>Date</label>
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...styles.input, padding: '8px', fontSize: '13px' }} />
                </div>
                <div>
                    <label style={{ fontSize: '11px', color: theme.textMuted, display: 'block', marginBottom: 4 }}>Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...styles.select, padding: '8px', fontSize: '13px' }}>
                        <option value="">All Statuses</option>
                        <option value="NEW">New</option>
                        <option value="REVIEWED">Reviewed</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '11px', color: theme.textMuted, display: 'block', marginBottom: 4 }}>Department</label>
                    {fixedDept ? (
                        <div style={{ ...styles.select, padding: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', background: theme.surfaceAlt, color: theme.textMuted, cursor: 'not-allowed' }}>
                            {fixedDept.replace(/_/g, ' ')}
                        </div>
                    ) : (
                        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={{ ...styles.select, padding: '8px', fontSize: '13px' }} disabled={deptLoading}>
                            <option value="">{deptLoading ? 'Loading...' : deptError ? 'Error' : 'All Departments'}</option>
                            {departments.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                        </select>
                    )}
                </div>
                <button onClick={() => { setFilterDate(''); setFilterDept(fixedDept || ''); setFilterStatus(''); }} style={{ ...styles.btnGhost, marginTop: 18 }}>Clear Filters</button>
            </div>

            {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: theme.textMuted }}>Loading...</div>
            ) : clusters.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: theme.textMuted, ...styles.card }}>No unknown faces found.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                    {clusters.map((c, i) => (
                        <div key={i} style={{ ...styles.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '12px', color: theme.textMuted, fontFamily: theme.fontMono }}>
                                    {c.date || c.createdAt?.split('T')[0]} • {c.slot}
                                </div>
                                <span style={{
                                    ...styles.badge(c.status === 'NEW' ? 'warning' : c.status === 'REVIEWED' ? 'success' : 'default'),
                                    fontSize: '10px'
                                }}>{c.status || 'NEW'}</span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div 
                                    onClick={() => setGalleryModal({ open: true, cluster: c })}
                                    style={{ position: 'relative', width: 80, height: 80, cursor: 'pointer' }}
                                >
                                    <img 
                                        src={`${API_BASE}/image/${encodeURIComponent(c.clusterPath)}/representative.jpg`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, background: '#f0f0f0' }}
                                        alt="Representative"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                    {c.images && c.images.length > 1 && (
                                        <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: 10, fontWeight: 600 }}>
                                            +{c.images.length - 1}
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1, fontSize: '12px', lineHeight: 1.5 }}>
                                    <div><strong>{c.department}</strong> {c.year} • {c.subjectCode || 'No Subject'}</div>
                                    <div>Room: {c.room}</div>
                                    <div style={{ color: theme.danger, fontWeight: 600, marginTop: 4 }}>
                                        {c.failureReason || 'UNKNOWN_REASON'}
                                    </div>
                                    {c.closestRollNo ? (
                                        <div style={{ marginTop: 4 }}>
                                            <span style={{ color: theme.textMuted }}>Closest: </span>
                                            <strong style={{ fontFamily: theme.fontMono }}>{c.closestRollNo}</strong>
                                            <button 
                                                onClick={() => openEditModal(c.clusterPath, c.closestRollNo)}
                                                style={{ marginLeft: 6, background: 'none', border: 'none', color: theme.accent, cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
                                            >
                                                Edit
                                            </button>
                                            <div style={{ color: theme.textMuted, fontSize: '11px' }}>{c.closestStudentName || 'Unknown Name'}</div>
                                            <div style={{ fontSize: '11px', color: theme.warning }}>
                                                Sim: {Math.round(c.bestSimilarity * 100)}% (Req: {Math.round(c.recognitionThreshold * 100)}%)
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: 8 }}>
                                            <button 
                                                onClick={() => openEditModal(c.clusterPath, '')}
                                                style={{ ...styles.btnGhost, padding: '4px 10px', fontSize: '11px' }}
                                            >
                                                Assign Roll No
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 12, borderTop: `1px solid ${theme.border}` }}>
                                {c.status !== 'REVIEWED' && (
                                    <button onClick={() => updateStatus(c.clusterPath, 'REVIEWED')} style={{ ...styles.btnPrimary, flex: 1, padding: '6px', fontSize: '11px' }}>Review</button>
                                )}
                                {c.status !== 'ARCHIVED' && (
                                    <button onClick={() => updateStatus(c.clusterPath, 'ARCHIVED')} style={{ ...styles.btnGhost, flex: 1, padding: '6px', fontSize: '11px' }}>Archive</button>
                                )}
                                <button onClick={() => downloadCluster(c.clusterPath)} style={{ ...styles.btnGhost, padding: '6px 10px', fontSize: '11px' }}>ZIP</button>
                                <button onClick={() => deleteCluster(c.clusterPath)} style={{ ...styles.btnDanger, padding: '6px 10px', fontSize: '11px' }}>Del</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editModal.open && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ ...styles.card, padding: 24, width: 320 }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: theme.text }}>Edit Roll Number</h3>
                        <input 
                            autoFocus
                            type="text" 
                            value={editModal.currentRollNo} 
                            onChange={e => setEditModal({...editModal, currentRollNo: e.target.value})} 
                            style={{ ...styles.input, width: '100%', marginBottom: 16 }} 
                            placeholder="Enter Roll Number"
                        />
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditModal({ open: false })} style={{ ...styles.btnGhost, padding: '8px 16px' }}>Cancel</button>
                            <button onClick={saveEditRollNo} style={{ ...styles.btnPrimary, padding: '8px 16px' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {galleryModal.open && galleryModal.cluster && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 20 }}>
                    <div style={{ position: 'absolute', top: 24, right: 24 }}>
                        <button onClick={() => setGalleryModal({ open: false, cluster: null })} style={{ background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', borderRadius: '8px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                            <span style={{ fontSize: '20px', lineHeight: 1 }}>&times;</span> Close Gallery
                        </button>
                    </div>
                    <div style={{ color: '#fff', marginBottom: 20, textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Cluster Images</h2>
                        <div style={{ fontSize: '13px', opacity: 0.8 }}>
                            {galleryModal.cluster.department} • {galleryModal.cluster.date || galleryModal.cluster.createdAt?.split('T')[0]} • {galleryModal.cluster.slot}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', maxWidth: '100%', padding: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {(galleryModal.cluster.images || ['representative.jpg']).map((imgName, idx) => (
                            <div key={idx} style={{ background: '#000', borderRadius: 8, overflow: 'hidden', border: imgName === 'representative.jpg' ? `2px solid ${theme.accent}` : '2px solid transparent' }}>
                                <img 
                                    src={`${API_BASE}/image/${encodeURIComponent(galleryModal.cluster.clusterPath)}/${imgName}`} 
                                    style={{ height: 200, width: 'auto', objectFit: 'contain', display: 'block' }} 
                                    alt="Cluster crop" 
                                />
                                {imgName === 'representative.jpg' && (
                                    <div style={{ textAlign: 'center', fontSize: '11px', padding: '4px', background: theme.accent, color: '#fff', fontWeight: 600 }}>Representative</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
