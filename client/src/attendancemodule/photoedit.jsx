// client/src/attendancemodule/photoedit.jsx
// Ground truth photo editor — pre-ERP (person_XXX) and post-ERP (roll number) views.

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import getEnvironment from '../getenvironment';

const apiUrl  = getEnvironment();
const RA_BASE = `${apiUrl}/attendancemodule/roll-assign`;
const GT_BASE = API_BASE;

// ─── Utilities ────────────────────────────────────────────────────────────────

function clusterPhotoUrl(batch, folder, filename) {
    return `${RA_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
}
function gtPhotoUrl(batch, rollNo, filename) {
    return `${GT_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(rollNo)}/${encodeURIComponent(filename)}`;
}
function fmtDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Shared UI atoms ──────────────────────────────────────────────────────────

function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            padding: '12px 24px', borderRadius: 8, fontSize: '13px', fontWeight: 600,
            background: toast.type === 'error' ? theme.dangerDim : theme.successDim,
            color:      toast.type === 'error' ? theme.danger    : theme.success,
            border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            animation: 'fadeIn 0.2s ease',
        }}>
            {toast.msg}
        </div>
    );
}

function TabBar({ active, onChange, counts }) {
    const tabs = [
        { id: 'clusters', label: 'Person Clusters',        hint: 'pre-ERP' },
        { id: 'erp',      label: 'ERP Matched Students',   hint: 'post-ERP' },
    ];
    return (
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${theme.border}` }}>
            {tabs.map(t => (
                <button key={t.id} onClick={() => onChange(t.id)} style={{
                    padding: '10px 22px', background: 'none', border: 'none',
                    borderBottom: active === t.id ? `2px solid ${theme.accent}` : '2px solid transparent',
                    color: active === t.id ? theme.accent : theme.textMuted,
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                    fontFamily: theme.fontBody, marginBottom: '-1px',
                    transition: 'color 0.15s', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                    {t.label}
                    <span style={{
                        fontSize: '10px', fontWeight: 500, padding: '1px 7px', borderRadius: 99,
                        background: active === t.id ? theme.accentDim : theme.border,
                        color:      active === t.id ? theme.accent    : theme.textMuted,
                    }}>{t.hint}</span>
                    {counts[t.id] != null && (
                        <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: 99,
                            background: theme.surfaceAlt, color: theme.text,
                        }}>{counts[t.id]}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

// ─── Photo card ───────────────────────────────────────────────────────────────
// Renders one image with its metadata and action buttons.

const TYPE_STYLE = {
    embedding: { bg: theme.accentDim,   color: theme.accent,  label: 'Embedding' },
    backup:    { bg: theme.warningDim,  color: theme.warning, label: 'Backup'    },
    other:     { bg: theme.border,      color: theme.textMuted, label: 'Other'   },
};

function PhotoCard({ src, filename, addedAt, score, type, busy, onDelete, onMove, moveLabel }) {
    const ts = TYPE_STYLE[type] || TYPE_STYLE.other;
    return (
        <div style={{
            background: theme.surface,
            border: `1.5px solid ${type === 'embedding' ? theme.accent + '55' : type === 'backup' ? theme.warning + '44' : theme.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            opacity: busy ? 0.45 : 1,
            transition: 'opacity 0.15s',
            position: 'relative',
        }}>
            {/* Image */}
            <div style={{ position: 'relative', aspectRatio: '1', background: theme.bg, overflow: 'hidden' }}>
                <img
                    src={src}
                    alt={filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.style.opacity = '0.15'; }}
                />
                {/* Type badge (top-left) */}
                {type && (
                    <div style={{
                        position: 'absolute', top: 6, left: 6,
                        fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 4,
                        background: ts.bg, color: ts.color, backdropFilter: 'blur(4px)',
                        border: `1px solid ${ts.color}55`,
                    }}>{ts.label}</div>
                )}
                {/* Delete button (top-right) */}
                <button
                    onClick={onDelete}
                    disabled={busy}
                    title="Delete photo"
                    style={{
                        position: 'absolute', top: 6, right: 6,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.8)', border: `1.5px solid ${theme.danger}`,
                        color: theme.danger, cursor: busy ? 'not-allowed' : 'pointer',
                        fontSize: '13px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', padding: 0, lineHeight: 1,
                    }}>×</button>
            </div>

            {/* Metadata footer */}
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <div style={{
                    fontSize: '10px', fontFamily: theme.fontMono, color: theme.text,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    title: filename,
                }}>{filename}</div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {addedAt && (
                        <span style={{ fontSize: '9px', color: theme.textMuted }}>
                            {fmtDate(addedAt)}
                        </span>
                    )}
                    {score != null && (
                        <span style={{
                            fontSize: '9px', fontWeight: 600, color: theme.accent,
                            background: theme.accentDim, padding: '1px 5px', borderRadius: 4,
                        }}>{score.toFixed(2)}</span>
                    )}
                </div>

                {/* Move button */}
                {onMove && (
                    <button
                        onClick={onMove}
                        disabled={busy}
                        style={{
                            marginTop: 4, padding: '4px 0', fontSize: '10px', fontWeight: 600,
                            background: type === 'backup' ? theme.accentDim  : theme.warningDim,
                            color:      type === 'backup' ? theme.accent      : theme.warning,
                            border:     `1px solid ${type === 'backup' ? theme.accent + '55' : theme.warning + '55'}`,
                            borderRadius: 5, cursor: busy ? 'not-allowed' : 'pointer',
                            fontFamily: theme.fontBody, width: '100%',
                        }}>{moveLabel}</button>
                )}
            </div>
        </div>
    );
}

// ─── Section header for a folder / student ────────────────────────────────────

function SectionHeader({ label, count, onDeleteAll, extra }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 0', borderBottom: `1px solid ${theme.border}`,
            marginBottom: 14,
        }}>
            <span style={{ fontWeight: 700, fontSize: '15px', fontFamily: theme.fontMono, flex: 1 }}>
                {label}
            </span>
            {extra}
            <span style={styles.badge(count >= 3 ? 'success' : count > 0 ? 'warning' : 'danger')}>
                {count} photo{count !== 1 ? 's' : ''}
            </span>
            <button
                onClick={onDeleteAll}
                style={{
                    ...styles.btnDanger, padding: '5px 12px', fontSize: '11px',
                }}>
                Delete All
            </button>
        </div>
    );
}

// ─── Photo grid wrapper ───────────────────────────────────────────────────────

function PhotoGrid({ children }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: 10,
            marginBottom: 8,
        }}>
            {children}
        </div>
    );
}

// ─── Cluster section (pre-ERP person_XXX) ────────────────────────────────────

function ClusterSection({ cluster, batch, busy, onDeletePhoto, onDeleteAll }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader
                label={cluster.folderName}
                count={cluster.imageCount}
                onDeleteAll={onDeleteAll}
            />
            {cluster.imageFiles.length === 0 ? (
                <div style={{ color: theme.textMuted, fontSize: '13px', padding: '12px 0' }}>
                    No photos in this folder.
                </div>
            ) : (
                <PhotoGrid>
                    {cluster.imageFiles.map(img => (
                        <PhotoCard
                            key={img.filename}
                            src={clusterPhotoUrl(batch, cluster.folderName, img.filename)}
                            filename={img.filename}
                            addedAt={img.addedAt}
                            score={null}
                            type={null}
                            busy={busy === `${cluster.folderName}::${img.filename}`}
                            onDelete={() => onDeletePhoto(cluster.folderName, img.filename)}
                        />
                    ))}
                </PhotoGrid>
            )}
        </div>
    );
}

// ─── Student section (post-ERP roll number) ───────────────────────────────────

function StudentSection({ student, batch, busy, onDeletePhoto, onDeleteAll, onMovePhoto }) {
    // Collect all photos with their type
    const allPhotos = [
        ...student.embeddingFiles.map(p => ({ ...p, type: 'embedding' })),
        ...student.backupFiles.map(p => ({    ...p, type: 'backup'    })),
        ...(student.untrackedFiles || []).map(p => ({ ...p, type: 'other' })),
    ];

    const currentEmbedding = student.embeddingFiles.map(p => p.filename);

    return (
        <div style={{ marginBottom: 32 }}>
            <SectionHeader
                label={student.rollNo}
                count={student.photoCount}
                onDeleteAll={onDeleteAll}
                extra={
                    <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: 99,
                        background: student.hasInfo ? theme.accentDim : theme.border,
                        color:      student.hasInfo ? theme.accent    : theme.textMuted,
                        fontWeight: 600,
                    }}>
                        {student.hasInfo
                            ? `${student.embeddingFiles.length} embedding · ${student.backupFiles.length} backup`
                            : 'no metadata'}
                    </span>
                }
            />
            {allPhotos.length === 0 ? (
                <div style={{ color: theme.textMuted, fontSize: '13px', padding: '12px 0' }}>
                    No photos.
                </div>
            ) : (
                <PhotoGrid>
                    {allPhotos.map(photo => {
                        const busyKey = `${student.rollNo}::${photo.filename}`;
                        const isEmbed = photo.type === 'embedding';
                        const isBackup = photo.type === 'backup';

                        return (
                            <PhotoCard
                                key={photo.filename}
                                src={gtPhotoUrl(batch, student.rollNo, photo.filename)}
                                filename={photo.filename}
                                addedAt={photo.addedAt}
                                score={photo.score}
                                type={photo.type}
                                busy={busy === busyKey}
                                onDelete={() => onDeletePhoto(student.rollNo, photo.filename)}
                                onMove={student.hasInfo ? () => onMovePhoto(student.rollNo, photo.filename, photo.type, currentEmbedding) : null}
                                moveLabel={isEmbed ? '→ Backup' : '↑ Embedding'}
                            />
                        );
                    })}
                </PhotoGrid>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PhotoEdit() {
    const [degree, setDegree] = useState('BTECH');
    const [dept,   setDept]   = useState('');
    const [year,   setYear]   = useState('');
    const { departments, deptLoading, deptError } = useDepartments();

    const [activeTab, setActiveTab] = useState('clusters');
    const [toast,     setToast]     = useState(null);

    // ── Clusters state ──
    const [clusters,        setClusters]        = useState([]);
    const [clustersLoaded,  setClustersLoaded]  = useState(false);
    const [clustersLoading, setClustersLoading] = useState(false);
    const [busyCluster,     setBusyCluster]     = useState(null); // "folder::filename"

    // ── ERP matched state ──
    const [students,        setStudents]        = useState([]);
    const [studentsLoaded,  setStudentsLoaded]  = useState(false);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [busyStudent,     setBusyStudent]     = useState(null); // "rollNo::filename"

    const batchName = degree && dept && year
        ? `${degree}_${dept}_${year}`.toUpperCase()
        : null;

    // Reset on batch change
    useEffect(() => {
        setClusters([]);      setClustersLoaded(false);
        setStudents([]);      setStudentsLoaded(false);
    }, [batchName]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    // ─── Load clusters ────────────────────────────────────────────────────────
    const loadClusters = useCallback(async () => {
        if (!batchName) return;
        setClustersLoading(true);
        try {
            const res  = await fetch(`${RA_BASE}/all-clusters/${encodeURIComponent(batchName)}`);
            const data = await res.json();
            setClusters(data.clusters || []);
            setClustersLoaded(true);
        } catch {
            showToast('Failed to load clusters', 'error');
        }
        setClustersLoading(false);
    }, [batchName]);

    // ─── Load ERP students ────────────────────────────────────────────────────
    const loadStudents = useCallback(async () => {
        if (!batchName) return;
        setStudentsLoading(true);
        try {
            const res  = await fetch(`${GT_BASE}/batches/${encodeURIComponent(batchName)}/students`);
            const data = await res.json();
            const matched = (data.students || []).filter(s => !/^person_\d+$/i.test(s.rollNo));
            setStudents(matched);
            setStudentsLoaded(true);
        } catch {
            showToast('Failed to load students', 'error');
        }
        setStudentsLoading(false);
    }, [batchName]);

    // Auto-load when tab becomes active
    useEffect(() => {
        if (activeTab === 'clusters' && batchName && !clustersLoaded && !clustersLoading) loadClusters();
        if (activeTab === 'erp'      && batchName && !studentsLoaded && !studentsLoading) loadStudents();
    }, [activeTab, batchName, clustersLoaded, studentsLoaded, clustersLoading, studentsLoading, loadClusters, loadStudents]);

    // ─── Cluster actions ──────────────────────────────────────────────────────

    const deleteClusterPhoto = async (folder, filename) => {
        const key = `${folder}::${filename}`;
        setBusyCluster(key);
        try {
            await fetch(
                `${RA_BASE}/cluster-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`,
                { method: 'DELETE' }
            );
            setClusters(prev => prev.map(c =>
                c.folderName === folder
                    ? { ...c, imageFiles: c.imageFiles.filter(f => f.filename !== filename), imageCount: c.imageCount - 1 }
                    : c
            ));
            showToast(`Deleted ${filename}`);
        } catch {
            showToast('Delete failed', 'error');
        }
        setBusyCluster(null);
    };

    const deleteCluster = async (folder) => {
        if (!window.confirm(`Delete all photos in "${folder}"?`)) return;
        try {
            await fetch(
                `${RA_BASE}/cluster/${encodeURIComponent(batchName)}/${encodeURIComponent(folder)}`,
                { method: 'DELETE' }
            );
            setClusters(prev => prev.filter(c => c.folderName !== folder));
            showToast(`Deleted ${folder}`);
        } catch {
            showToast('Delete failed', 'error');
        }
    };

    // ─── Student actions ──────────────────────────────────────────────────────

    const deleteStudentPhoto = async (rollNo, filename) => {
        if (!window.confirm(`Remove "${filename}" from ${rollNo}?`)) return;
        const key = `${rollNo}::${filename}`;
        setBusyStudent(key);
        try {
            await fetch(
                `${GT_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(rollNo)}/${encodeURIComponent(filename)}`,
                { method: 'DELETE' }
            );
            setStudents(prev => prev.map(s => {
                if (s.rollNo !== rollNo) return s;
                const remove = arr => arr.filter(p => p.filename !== filename);
                return {
                    ...s,
                    photoCount:     s.photoCount - 1,
                    embeddingFiles: remove(s.embeddingFiles),
                    backupFiles:    remove(s.backupFiles),
                    untrackedFiles: remove(s.untrackedFiles || []),
                    photos:         remove(s.photos || []),
                };
            }));
            showToast(`Deleted ${filename}`);
        } catch {
            showToast('Delete failed', 'error');
        }
        setBusyStudent(null);
    };

    const deleteStudent = async (rollNo) => {
        if (!window.confirm(`Delete all ground truth data for ${rollNo}?`)) return;
        try {
            await fetch(
                `${GT_BASE}/student/${encodeURIComponent(batchName)}/${encodeURIComponent(rollNo)}`,
                { method: 'DELETE' }
            );
            setStudents(prev => prev.filter(s => s.rollNo !== rollNo));
            showToast(`Deleted ${rollNo}`);
        } catch {
            showToast('Delete failed', 'error');
        }
    };

    // Move photo between embedding ↔ backup and call update-embedding
    const movePhoto = async (rollNo, filename, currentType, currentEmbedding) => {
        const key = `${rollNo}::${filename}`;
        setBusyStudent(key);

        let newEmbedding;
        if (currentType === 'backup' || currentType === 'other') {
            // promote → embedding
            newEmbedding = [...new Set([...currentEmbedding, filename])];
        } else {
            // demote → backup
            newEmbedding = currentEmbedding.filter(f => f !== filename);
            if (newEmbedding.length === 0) {
                showToast('Must keep at least one embedding image', 'error');
                setBusyStudent(null);
                return;
            }
        }

        try {
            const res  = await fetch(`${GT_BASE}/update-embedding`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ batch: batchName, rollNo, embeddingFiles: newEmbedding }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            // Re-fetch this student's data
            const sRes  = await fetch(`${GT_BASE}/batches/${encodeURIComponent(batchName)}/students`);
            const sData = await sRes.json();
            const updated = (sData.students || []).find(s => s.rollNo === rollNo);
            if (updated) {
                setStudents(prev => prev.map(s => s.rollNo === rollNo ? updated : s));
            }
            showToast(`Embedding updated — ${data.embedding_files_used} active`);
        } catch (err) {
            showToast(err.message, 'error');
        }
        setBusyStudent(null);
    };

    // ─── Render ────────────────────────────────────────────────────────────────

    const noFilters = !degree || !dept || !year;

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>
            <Toast toast={toast} />

            {/* Page header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Photo Editor</div>
                <div style={{ ...styles.subheading, marginBottom: 0 }}>
                    Browse and manage ground truth photos — before and after ERP matching
                </div>
            </div>

            {/* Filter bar */}
            <div style={{ ...styles.card, marginBottom: 28, padding: '18px 24px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr',
                    gap: 16,
                    alignItems: 'end',
                }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select
                            value={dept}
                            onChange={e => setDept(e.target.value)}
                            style={styles.select}
                            disabled={deptLoading}>
                            <option value="">
                                {deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select department…'}
                            </option>
                            {departments.map(d => <option key={d}>{d}</option>)}
                        </select>
                        {deptError && <div style={{ fontSize: '11px', color: theme.danger, marginTop: 3 }}>{deptError}</div>}
                    </div>
                    <div>
                        <label style={styles.label}>Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select year…</option>
                            {YEARS.map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                {batchName && (
                    <div style={{ marginTop: 12, fontSize: '12px', color: theme.textMuted }}>
                        Batch:&nbsp;
                        <span style={{ fontFamily: theme.fontMono, color: theme.accent }}>{batchName}</span>
                    </div>
                )}
            </div>

            {noFilters ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '14px' }}>
                    Select degree, department and year to load photos.
                </div>
            ) : (
                <>
                    <TabBar
                        active={activeTab}
                        onChange={id => setActiveTab(id)}
                        counts={{
                            clusters: clustersLoaded ? clusters.length : null,
                            erp:      studentsLoaded ? students.length : null,
                        }}
                    />

                    {/* ── Person Clusters tab ─────────────────────────────── */}
                    {activeTab === 'clusters' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>
                                    {clustersLoaded
                                        ? `${clusters.length} person folder${clusters.length !== 1 ? 's' : ''}`
                                        : 'Person Clusters (pre-ERP)'}
                                </div>
                                <button
                                    onClick={loadClusters}
                                    disabled={clustersLoading}
                                    style={{ ...styles.btnGhost, padding: '6px 14px', fontSize: '12px' }}>
                                    {clustersLoading ? 'Loading…' : '↺ Refresh'}
                                </button>
                            </div>

                            {clustersLoading && (
                                <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
                                    <div style={{ animation: 'pulse 1.2s infinite', marginBottom: 8 }}>⏳</div>
                                    Loading clusters…
                                </div>
                            )}

                            {!clustersLoading && clustersLoaded && clusters.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
                                    <div style={{ fontSize: '32px', marginBottom: 12 }}>📂</div>
                                    No person_XXX folders in this batch.
                                    <div style={{ fontSize: '12px', marginTop: 6 }}>
                                        Run ground truth extraction first, or they may already be ERP-matched.
                                    </div>
                                </div>
                            )}

                            {!clustersLoading && !clustersLoaded && (
                                <div style={{ textAlign: 'center', padding: 60 }}>
                                    <button onClick={loadClusters} style={styles.btnPrimary}>Load Clusters</button>
                                </div>
                            )}

                            {clusters.map(cluster => (
                                <ClusterSection
                                    key={cluster.folderName}
                                    cluster={cluster}
                                    batch={batchName}
                                    busy={busyCluster}
                                    onDeletePhoto={deleteClusterPhoto}
                                    onDeleteAll={() => deleteCluster(cluster.folderName)}
                                />
                            ))}
                        </>
                    )}

                    {/* ── ERP Matched Students tab ────────────────────────── */}
                    {activeTab === 'erp' && (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                                <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>
                                    {studentsLoaded
                                        ? `${students.length} student${students.length !== 1 ? 's' : ''}`
                                        : 'ERP Matched Students'}
                                </div>
                                {studentsLoaded && students.length > 0 && (
                                    <div style={{ fontSize: '11px', color: theme.textMuted, display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, display: 'inline-block' }} />
                                            Embedding
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.warning, display: 'inline-block' }} />
                                            Backup
                                        </span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: theme.textMuted, display: 'inline-block' }} />
                                            Other
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={loadStudents}
                                    disabled={studentsLoading}
                                    style={{ ...styles.btnGhost, padding: '6px 14px', fontSize: '12px' }}>
                                    {studentsLoading ? 'Loading…' : '↺ Refresh'}
                                </button>
                            </div>

                            {studentsLoading && (
                                <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
                                    <div style={{ animation: 'pulse 1.2s infinite', marginBottom: 8 }}>⏳</div>
                                    Loading students…
                                </div>
                            )}

                            {!studentsLoading && studentsLoaded && students.length === 0 && (
                                <div style={{ textAlign: 'center', padding: 60, color: theme.textMuted }}>
                                    <div style={{ fontSize: '32px', marginBottom: 12 }}>🎓</div>
                                    No ERP-matched students found.
                                    <div style={{ fontSize: '12px', marginTop: 6 }}>
                                        Run ERP matching and assignment first.
                                    </div>
                                </div>
                            )}

                            {!studentsLoading && !studentsLoaded && (
                                <div style={{ textAlign: 'center', padding: 60 }}>
                                    <button onClick={loadStudents} style={styles.btnPrimary}>Load Students</button>
                                </div>
                            )}

                            {students.map(s => (
                                <StudentSection
                                    key={s.rollNo}
                                    student={s}
                                    batch={batchName}
                                    busy={busyStudent}
                                    onDeletePhoto={deleteStudentPhoto}
                                    onDeleteAll={() => deleteStudent(s.rollNo)}
                                    onMovePhoto={movePhoto}
                                />
                            ))}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
