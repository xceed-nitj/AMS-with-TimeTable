// client/src/attendancemodule/EmbeddingGeneration.jsx
import React , { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import getEnvironment from '../getenvironment';
import * as XLSX from 'xlsx';

const apiUrl   = getEnvironment();
const EMB_BASE = `${apiUrl}/attendancemodule/embeddings`;
const GT_BASE  = `${apiUrl}/attendancemodule/ground-truth`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
    if (!toast) return null;
    return (
        <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 9999,
            padding: '12px 24px', borderRadius: 8, fontSize: '13px', fontWeight: 600,
            background: toast.type === 'error' ? theme.dangerDim  : theme.successDim,
            color:      toast.type === 'error' ? theme.danger      : theme.success,
            border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}>{toast.msg}</div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        pending:    { bg: theme.border,      color: theme.textMuted, label: 'Pending'    },
        processing: { bg: theme.accentDim,   color: theme.accent,    label: 'Processing' },
        done:       { bg: theme.successDim,  color: theme.success,   label: 'Done'       },
        failed:     { bg: theme.dangerDim,   color: theme.danger,    label: 'Failed'     },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
            background: s.bg, color: s.color,
        }}>{s.label}</span>
    );
}

// ─── Tab styles ───────────────────────────────────────────────────────────────
function Tab({ label, active, onClick, icon }) {
    return (
        <button onClick={onClick} style={{
            padding: '10px 22px', border: 'none', cursor: 'pointer',
            fontFamily: theme.fontBody, fontSize: '13px', fontWeight: 600,
            borderRadius: '8px 8px 0 0',
            background: active ? theme.surface : 'transparent',
            color: active ? theme.accent : theme.textMuted,
            borderBottom: active ? `2px solid ${theme.accent}` : `2px solid transparent`,
            transition: 'all 0.15s',
        }}>
            {icon} {label}
        </button>
    );
}

// ─── Dept / Sem / Subject filter block (shared between tabs) ─────────────────
function FilterBlock({ dept, setDept, sem, setSem, subject, setSubject, subjectCode, setSubjectCode, setSubjectId, departments, deptLoading, deptError }) {
    const [sems, setSems] = useState([]);
    const [subjects, setSubjects] = useState([]); // full objects: { _id, subName, subCode, subjectFullName }
    const [semsLoading, setSemsLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);

    useEffect(() => {
        setSem(''); setSubject(''); setSems([]); setSubjects([]);
        if (setSubjectCode) setSubjectCode('');
        if (setSubjectId)   setSubjectId('');
        if (!dept) return;
        setSemsLoading(true);
        fetch(`${apiUrl}/timetablemodule/lock/sems-by-dept?dept=${encodeURIComponent(dept)}`)
            .then(r => r.json()).then(d => setSems(d.sems || []))
            .catch(() => {}).finally(() => setSemsLoading(false));
    }, [dept]);

    useEffect(() => {
        setSubject(''); setSubjects([]);
        if (setSubjectCode) setSubjectCode('');
        if (setSubjectId)   setSubjectId('');
        if (!dept || !sem) return;
        setSubjectsLoading(true);
        // Use /timetablemodule/subject to get full objects with _id and subCode
        fetch(`${apiUrl}/timetablemodule/subject`)
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                const filtered = list.filter(s => {
                    const semMatch  = String(s.sem).trim() === String(sem).trim();
                    const deptNorm  = dept.replace(/_/g, ' ').trim().toLowerCase();
                    const sDeptNorm = (s.dept || '').trim().toLowerCase();
                    const deptMatch = sDeptNorm.includes(deptNorm) || deptNorm.includes(sDeptNorm);
                    return semMatch && deptMatch;
                });
                setSubjects(filtered);
            })
            .catch(() => {}).finally(() => setSubjectsLoading(false));
    }, [dept, sem]);

    const subjectSafe  = subject.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const subCodeSafe  = (subjectCode || '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const deptSafe     = dept.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const now          = new Date();
    const yr           = now.getFullYear();
    const mo           = now.getMonth() + 1;
    const sessionStr   = `${mo >= 8 ? yr : yr - 1}-${String(mo >= 8 ? yr + 1 : yr).slice(2)}`;
    const previewFileName = sem && subjectSafe
        ? `${sessionStr}/${deptSafe}/${subCodeSafe || sem}_${subjectSafe}_${sessionStr}.pkl`
        : null;

    return (
        <div style={{ ...styles.card, marginBottom: 24, padding: '18px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 16, alignItems: 'end', marginBottom: 16 }}>
                <div>
                    <label style={styles.label}>Department</label>
                    <select value={dept} onChange={e => setDept(e.target.value)} style={styles.select} disabled={deptLoading}>
                        <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select department…'}</option>
                        {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Semester <span style={{ color: theme.danger }}>*</span></label>
                    <select value={sem} onChange={e => setSem(e.target.value)} style={styles.select} disabled={!dept || semsLoading}>
                        <option value="">{semsLoading ? 'Loading…' : !dept ? 'Select dept first' : sems.length ? 'Select sem…' : 'No sems found'}</option>
                        {sems.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={styles.label}>
                        Subject <span style={{ color: theme.danger }}>*</span>
                        <span style={{ color: theme.textMuted, fontWeight: 400, marginLeft: 6, textTransform: 'none' }}>(used in the .pkl file name)</span>
                    </label>
                    <select
                        value={subject}
                        onChange={e => {
                            const sel = subjects.find(s => (s.subName || s.subjectFullName) === e.target.value);
                            setSubject(e.target.value);
                            if (setSubjectCode) setSubjectCode(sel?.subCode || '');
                            if (setSubjectId)   setSubjectId(sel ? String(sel._id) : '');
                        }}
                        style={styles.select}
                        disabled={!sem || subjectsLoading}
                    >
                        <option value="">{subjectsLoading ? 'Loading…' : !sem ? 'Select sem first' : subjects.length ? 'Select subject…' : 'No subjects found'}</option>
                        {subjects.map(s => {
                            const name = s.subName || s.subjectFullName;
                            return <option key={String(s._id)} value={name}>{name}</option>;
                        })}
                    </select>
                </div>
            </div>
            {dept && (
                <div style={{ marginTop: 8, padding: '10px 14px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: '12px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <span><span style={{ color: theme.textMuted }}>Dept: </span><span style={{ fontFamily: theme.fontMono, color: theme.accent }}>{dept}</span></span>
                    <span style={{ color: theme.textMuted }}>↓ All embedding files for this dept are shown in the table below</span>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — ERP Ground Truth Embeddings
// ═══════════════════════════════════════════════════════════════════════════════
function ERPSyncTab({ departments, deptLoading, deptError }) {
    const [dept, setDept] = useState('');
    const [batch, setBatch] = useState('');
    const [batches, setBatches] = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);
    
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [pollingData, setPollingData] = useState({ unchangedCount: 0, lastTotal: -1 });
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (!dept) {
            setBatches([]);
            setBatch('');
            return;
        }
        let cancelled = false;
        setBatchesLoading(true);
        const rawDepartment = dept.replace(/_/g, ' ');
        fetch(`${apiUrl}/timetablemodule/mastersem/dept/${encodeURIComponent(rawDepartment)}`)
            .then(res => res.json())
            .then(data => {
                if (cancelled) return;
                if (Array.isArray(data)) {
                    const sems = [...new Set(data.map(item => item.sem))].filter(Boolean).sort();
                    setBatches(sems);
                } else {
                    setBatches([]);
                }
            })
            .catch(() => showToast('Failed to load batches', 'error'))
            .finally(() => { if (!cancelled) setBatchesLoading(false); });
        return () => { cancelled = true; };
    }, [dept]);

    const loadStatus = useCallback(async (background = false) => {
        if (!batch) return;
        if (!background) setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/attendancemodule/ground-truth-upload/status/${encodeURIComponent(batch)}`);
            const data = await res.json();
            setStatus(data);
            return data;
        } catch (err) {
            if (!background) showToast('Failed to fetch status', 'error');
            return null;
        } finally {
            if (!background) setLoading(false);
        }
    }, [batch]);

    useEffect(() => {
        setStatus(null);
        setIsPolling(false);
        if (batch) loadStatus();
    }, [batch, loadStatus]);

    const timerRef = useRef(null);

    useEffect(() => {
        if (!isPolling) {
            if (timerRef.current) clearTimeout(timerRef.current);
            return;
        }

        const poll = async () => {
            const data = await loadStatus(true);
            if (data) {
                if (data.missing_count === 0) {
                    setIsPolling(false);
                    showToast('Generation Successful! All embeddings are generated.');
                    return;
                } else {
                    setPollingData(prev => {
                        if (prev.lastTotal === data.total_embeddings) {
                            if (prev.unchangedCount >= 3) {
                                setIsPolling(false);
                                if (data.missing_count > 0) {
                                    showToast(`Sync completed but ${data.missing_count} faces could not be detected.`, 'error');
                                }
                                return prev;
                            }
                            return { ...prev, unchangedCount: prev.unchangedCount + 1 };
                        } else {
                            return { unchangedCount: 0, lastTotal: data.total_embeddings };
                        }
                    });
                }
            }
            // only schedule next if still polling
            setPollingData((currentData) => {
                // If it was cancelled inside the setState above, isPolling will be false on next render, 
                // but we can just let it schedule and get cleared, or we can check. 
                // Using the effect cleanup is safer.
                return currentData;
            });
            timerRef.current = setTimeout(poll, 2500);
        };

        timerRef.current = setTimeout(poll, 2500);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [isPolling, loadStatus]);

    const handleSyncAll = async () => {
        if (!batch) return;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/attendancemodule/ground-truth-upload/sync-all/${encodeURIComponent(batch)}`, {
                method: 'POST'
            });
            if (res.ok) {
                showToast('Sync triggered successfully! Monitoring progress...');
                setIsPolling(true);
                setPollingData({ unchangedCount: 0, lastTotal: -1 });
            } else {
                throw new Error('Sync failed');
            }
        } catch (err) {
            showToast('Failed to trigger sync', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Toast toast={toast} />
            <div style={{ ...styles.card, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'end' }}>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select value={dept} onChange={e => setDept(e.target.value)} style={styles.select} disabled={deptLoading}>
                            <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select department…'}</option>
                            {departments.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Batch</label>
                        <select value={batch} onChange={e => setBatch(e.target.value)} style={styles.select} disabled={!dept || batchesLoading}>
                            <option value="">{batchesLoading ? 'Loading…' : !dept ? 'Select dept first' : batches.length ? 'Select batch…' : 'No batches found'}</option>
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {batch && status && (
                <div style={styles.card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>Synchronization Status</div>
                        <button onClick={loadStatus} disabled={loading} style={{ ...styles.btnGhost, padding: '6px 14px', fontSize: '12px' }}>
                            {loading ? 'Refreshing…' : '↺ Refresh'}
                        </button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div style={{ padding: 16, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.bg }}>
                            <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: 4 }}>Total ERP Photos</div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: theme.text }}>{status.total_photos}</div>
                        </div>
                        <div style={{ padding: 16, borderRadius: 8, border: `1px solid ${isPolling ? theme.accent : theme.border}`, background: theme.bg }}>
                            <div style={{ fontSize: '12px', color: isPolling ? theme.accent : theme.textMuted, marginBottom: 4 }}>
                                Total Embeddings Generated {isPolling && '(Syncing...)'}
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: theme.text }}>
                                {status.total_embeddings}
                            </div>
                        </div>
                        <div style={{ padding: 16, borderRadius: 8, border: `1px solid ${status.missing_count > 0 ? theme.danger : theme.success}`, background: status.missing_count > 0 ? theme.dangerDim : theme.successDim }}>
                            <div style={{ fontSize: '12px', color: status.missing_count > 0 ? theme.danger : theme.success, marginBottom: 4 }}>Health</div>
                            <div style={{ fontSize: '16px', fontWeight: 600, color: status.missing_count > 0 ? theme.danger : theme.success }}>
                                {status.missing_count === 0 ? 'Fully Synchronized ✓' : `${status.missing_count} Missing`}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button onClick={handleSyncAll} disabled={loading || isPolling} style={{ ...styles.btnPrimary, background: theme.accent, border: 'none', color: '#fff', opacity: (loading || isPolling) ? 0.6 : 1 }}>
                            {loading ? 'Processing…' : isPolling ? 'Sync in progress...' : 'Force Sync All'}
                        </button>
                        <span style={{ fontSize: '12px', color: theme.textMuted }}>
                            {status.last_sync_timestamp ? `Last updated: ${new Date(status.last_sync_timestamp).toLocaleString('en-IN')}` : 'Never synced'}
                        </span>
                    </div>

                    {(status.missing_count > 0 || status.orphaned_count > 0) && (
                        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${theme.border}` }}>
                            {status.missing_count > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.danger, marginBottom: 8 }}>Missing Embeddings (Photos exist, but no embedding)</div>
                                    <div style={{ fontSize: '12px', fontFamily: theme.fontMono, color: theme.textMuted, background: theme.bg, padding: 12, borderRadius: 6, border: `1px solid ${theme.border}` }}>
                                        {status.missing.join(', ')} {status.missing_count > 50 ? '...' : ''}
                                    </div>
                                </div>
                            )}
                            {status.orphaned_count > 0 && (
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.accent, marginBottom: 8 }}>Orphaned Embeddings (Embedding exists, but photo deleted)</div>
                                    <div style={{ fontSize: '12px', fontFamily: theme.fontMono, color: theme.textMuted, background: theme.bg, padding: 12, borderRadius: 6, border: `1px solid ${theme.border}` }}>
                                        {status.orphaned.join(', ')} {status.orphaned_count > 50 ? '...' : ''}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Generate from Ground Truth (original flow)
// ═══════════════════════════════════════════════════════════════════════════════
function GenerateTab({ departments, deptLoading, deptError }) {
    const [dept,        setDept]        = useState('');
    const [sem,         setSem]         = useState('');
    const [subject,     setSubject]     = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectId,   setSubjectId]   = useState('');

    const [rollInput,  setRollInput]  = useState('');
    const [rollNos,    setRollNos]    = useState([]);
    const [autoLoaded, setAutoLoaded] = useState(false);

    const [rows,    setRows]    = useState([]);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState(null);

    const [history,        setHistory]        = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [toast, setToast] = useState(null);
    const [pklFiles,       setPklFiles]       = useState([]);
    const [pklLoading,     setPklLoading]     = useState(false);
    const [expandedPkl,    setExpandedPkl]    = useState(null); // filename of expanded row
    const xlsxRef = useRef();

    const batchName       = dept ? `BTECH_${dept}_2023` : null;
    const subjectSafe     = subject.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const previewFileName = sem && subjectSafe ? `${sem}_${subjectSafe}.pkl` : null;

    const now2 = new Date();
    const yr2 = now2.getFullYear();
    const mo2 = now2.getMonth() + 1;
    const sessionStr = `${mo2 >= 8 ? yr2 : yr2 - 1}-${String(mo2 >= 8 ? yr2 + 1 : yr2).slice(2)}`;
    const subCodeSafe = (subjectCode || '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const expectedFilename = sem && subjectSafe
    ? `${subCodeSafe || sem}_${subjectSafe}_${sessionStr}.pkl`
    : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const parseRolls = (raw) =>
        raw.split(/[\n,;\s]+/).map(r => r.trim().toUpperCase()).filter(Boolean);

    useEffect(() => { setRollNos(parseRolls(rollInput)); }, [rollInput]);

    // ── Parse XLSX client-side and populate the textarea ──────────────────────
    const handleXlsxUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb    = XLSX.read(ev.target.result, { type: 'binary' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const rolls = rows
                    .flat()
                    .map(v => String(v ?? '').trim().toUpperCase())
                    .filter(v => v.length > 3 && !/^(roll|rollno|roll_no|sno|sr\.?\s*no)/i.test(v));
                setRollInput(rolls.join('\n'));
                setAutoLoaded(true);
                showToast(`Loaded ${rolls.length} roll numbers from ${file.name}`);
            } catch (err) {
                showToast('Failed to parse xlsx: ' + err.message, 'error');
            }
        };
        reader.readAsBinaryString(file);
        // reset so the same file can be re-uploaded
        e.target.value = '';
    };

    const loadAllRolls = useCallback(async () => {
        if (!batchName) return;
        setAutoLoaded(false);
        try {
            const res  = await fetch(`${GT_BASE}/batches/${encodeURIComponent(batchName)}/students`);
            const data = await res.json();
            const rolls = (data.students || [])
                .filter(s => !/^person_\d+$/i.test(s.rollNo))
                .map(s => s.rollNo);
            setRollInput(rolls.join('\n'));
            setAutoLoaded(true);
            showToast(`Loaded ${rolls.length} students from ground truth`);
        } catch (err) {
            showToast('Failed to load students: ' + err.message, 'error');
        }
    }, [batchName]);

    const loadHistory = useCallback(async () => {
    if (!dept) return;
    setHistoryLoading(true);
    try {
        let url = `${EMB_BASE}/history-by-dept?dept=${encodeURIComponent(dept)}`;
        if (sem)     url += `&sem=${encodeURIComponent(sem)}`;
        if (subject) url += `&subject=${encodeURIComponent(subject)}`;
        const res  = await fetch(url);
        const data = await res.json();
        setHistory(data.records || []);
    } catch (_) {}
    setHistoryLoading(false);
}, [dept]); 


const loadPklFiles = useCallback(async () => {
    if (!dept) return;
    setPklLoading(true);
    try {
        const res  = await fetch(`${EMB_BASE}/list-files-by-dept?dept=${encodeURIComponent(dept)}`);
        const data = await res.json();
        setPklFiles(data.files || []);
    } catch (_) {
        setPklFiles([]);
    }
    setPklLoading(false);
}, [dept]);

    useEffect(() => {
    setSummary(null); setRows([]); setRollInput(''); setAutoLoaded(false);
    setPklFiles([]); setExpandedPkl(null);
    if (dept) {
        loadHistory();
        loadPklFiles();
    }
}, [dept]);

useEffect(() => {
    if (dept) loadPklFiles();
}, [subject]);

    const startGeneration = async () => {
        if (!batchName || rollNos.length === 0 || !subject.trim()) return;
        setRunning(true);
        setSummary(null);

        const initRows = rollNos.map(r => ({ rollNo: r, status: 'pending', reason: null, photosUsed: null }));
        setRows(initRows);

        const updateRow = (rollNo, patch) => {
            setRows(prev => prev.map(r => r.rollNo === rollNo ? { ...r, ...patch } : r));
        };

        try {
            const res = await fetch(`${EMB_BASE}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sem: sem.trim(), subject: subject.trim(), dept: dept.trim(), subjectCode: subjectCode.trim(), rollNos }),
            });

            if (!res.ok) {
                const err = await res.json();
                showToast(err.error || 'Server error', 'error');
                setRunning(false);
                return;
            }

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let   buffer  = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split('\n\n');
                buffer = parts.pop();

                for (const part of parts) {
                    const line = part.trim();
                    if (!line.startsWith('data:')) continue;
                    try {
                        const msg = JSON.parse(line.slice(5).trim());
                        if (msg.type === 'student') {
                            updateRow(msg.rollNo, { status: msg.status, reason: msg.reason || null, photosUsed: msg.photosUsed || null });
                        }
                        if (msg.type === 'done') {
                            setSummary({
                                success:        msg.success,
                                failed:         msg.failed,
                                embeddingFile:  msg.embeddingFile,
                                failedList:     msg.failedList     || [],
                                missedRollNos:  msg.missedRollNos  || [],
                                recordId:       msg.recordId,
                                // snapshot of filter values at time of generation
                                dept:           dept.trim(),
                                sem:            sem.trim(),
                                subject:        subject.trim(),
                                subjectCode:    subjectCode,
                                rollNosInSubject: rollNos,
                            });
                            showToast(`Done — ${msg.success} succeeded, ${msg.failed} failed`);
                            loadPklFiles();                              // ← also add this (was missing)
    setTimeout(() => {
        loadHistory();
    }, 800);
}
                    } catch (_) {}
                }
            }
        } catch (err) {
            showToast('Generation failed: ' + err.message, 'error');
        }

        setRunning(false);
    };

     const enrichedPklFiles = pklFiles.map(f => {
    if (f.rollNos?.length > 0) return f;
    const match = history.find(h => h.embeddingFile === f.filename);
    if (match) return { ...f, rollNos: match.rollNos || [], missedRollNos: match.missedRollNos || [] };
    return f;
});

    const noFilters   = !dept;


    const canGenerate = !running && rollNos.length > 0 && subject.trim().length > 0 && sem.trim().length > 0;

    return (
        <div>
            <Toast toast={toast} />

            <FilterBlock
                dept={dept} setDept={setDept}
                sem={sem} setSem={setSem}
                subject={subject} setSubject={setSubject}
                subjectCode={subjectCode}
                setSubjectCode={setSubjectCode}
                setSubjectId={setSubjectId}
                departments={departments} deptLoading={deptLoading} deptError={deptError}
                history={history}
            />

            {/* ── PKL Files for this dept — shown as soon as dept is selected ── */}
{dept && (
    <div style={{ ...styles.card, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>
                📦 Embedding Files on Disk — {dept}
            </div>
            <button onClick={loadPklFiles} disabled={pklLoading}
                style={{ ...styles.btnGhost, padding: '5px 12px', fontSize: '11px' }}>
                {pklLoading ? 'Loading…' : '↺ Refresh'}
            </button>
        </div>

        {pklLoading ? (
            <div style={{ color: theme.textMuted, fontSize: '13px', padding: '16px 0', textAlign: 'center' }}>Loading pkl files…</div>
        ) : (expectedFilename ? enrichedPklFiles.filter(f => f.filename === expectedFilename) : enrichedPklFiles).length === 0 ? (
    <div style={{ color: theme.textMuted, fontSize: '13px', padding: '16px 0', textAlign: 'center' }}>
        {expectedFilename
            ? `No embedding file found for this subject yet. Expected: ${expectedFilename}`
            : 'No .pkl files found for this department yet.'}
    </div>
        ) : (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                            {['File', 'Subject', 'Sem', 'Size', 'Generated', 'Present Roll Nos', 'Missing Roll Nos', 'Status'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
    {(expectedFilename
        ? enrichedPklFiles.filter(f => f.filename === expectedFilename)
        : enrichedPklFiles
    ).map(file => {
        const missedSet    = new Set((file.missedRollNos || []).map(m => m.rollNo || m));
        const presentRolls = (file.rollNos || []).filter(r => !missedSet.has(r));
        const missedRolls  = file.missedRollNos || [];
        return (
            <React.Fragment key={file.filename}>
                {/* Main info row */}
                <tr style={{ borderBottom: `1px solid ${theme.border}22` }}>
                    <td style={{ padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '11px', color: theme.accent }}>{file.filename}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text }}>{file.subject || <span style={{ color: theme.textMuted }}>—</span>}</td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text }}>{file.sem || '—'}</td>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: theme.textMuted }}>{file.sizeKB} KB</td>
                    <td style={{ padding: '8px 12px', fontSize: '11px', color: theme.textMuted }}>
                        {file.generatedAt ? new Date(file.generatedAt).toLocaleString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.success }}>
                        {presentRolls.length > 0 ? `${presentRolls.length} ✓` : <span style={{ color: theme.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px', color: missedRolls.length > 0 ? theme.danger : theme.success }}>
                        {missedRolls.length > 0 ? `${missedRolls.length} ✗` : '✓ none'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                        <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                            background: file.status === 'done' ? theme.successDim : file.status === 'failed' ? theme.dangerDim : theme.border,
                            color:      file.status === 'done' ? theme.success    : file.status === 'failed' ? theme.danger    : theme.textMuted,
                        }}>{file.status || 'unknown'}</span>
                    </td>
                </tr>

                {/* Roll numbers row — always visible, no click needed */}
                <tr>
                    <td colSpan={8} style={{ padding: '0 12px 16px 12px', background: theme.bg, borderBottom: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 10 }}>

                            {/* Present roll nos */}
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: theme.success, marginBottom: 6 }}>
                                    ✓ Present in Embedding ({presentRolls.length})
                                </div>
                                {presentRolls.length === 0 ? (
                                    <div style={{ fontSize: '12px', color: theme.textMuted }}>No roll numbers recorded.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {presentRolls.map(r => (
                                            <span key={r} style={{
                                                fontFamily: theme.fontMono, fontSize: '11px',
                                                padding: '2px 8px', borderRadius: 4,
                                                background: theme.successDim, color: theme.success,
                                                border: `1px solid ${theme.success}44`,
                                            }}>{r}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Missing roll nos */}
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 700, color: theme.danger, marginBottom: 6 }}>
                                    ✗ Missing Ground Truth ({missedRolls.length})
                                </div>
                                {missedRolls.length === 0 ? (
                                    <div style={{ fontSize: '12px', color: theme.success }}>✓ All roll numbers have ground truth.</div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {missedRolls.map((m, i) => (
                                            <span key={i} style={{
                                                fontFamily: theme.fontMono, fontSize: '11px',
                                                padding: '2px 8px', borderRadius: 4,
                                                background: theme.dangerDim, color: theme.danger,
                                                border: `1px solid ${theme.danger}44`,
                                            }}>{m.rollNo || m}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    </td>
                </tr>
            </React.Fragment>
        );
    })}
</tbody>
                </table>
                 
            </div>
        )}
    </div>
)}

            

            {noFilters ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '14px' }}>
                    Select department to continue.
                </div>
            ) : (
                <>
                    {/* Roll number input */}
                    <div style={{ ...styles.card, marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                            <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>Roll Numbers for this Subject</div>

                            {/* XLSX upload button */}
                            <label style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                                background: theme.accentDim, color: theme.accent,
                                border: `1px solid ${theme.accent}44`, fontSize: '12px', fontWeight: 600,
                            }}>
                                📋 Upload .xlsx
                                <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv"
                                    style={{ display: 'none' }} onChange={handleXlsxUpload} disabled={running} />
                            </label>

                            <button onClick={loadAllRolls} disabled={running}
                                style={{ ...styles.btnGhost, padding: '6px 14px', fontSize: '12px' }}>
                                ↺ Load from Ground Truth
                            </button>
                        </div>
                        <textarea
                            value={rollInput}
                            onChange={e => setRollInput(e.target.value)}
                            disabled={running}
                            placeholder="Enter roll numbers separated by newlines or commas — or upload an .xlsx above"
                            style={{ ...styles.input, height: 140, resize: 'vertical', fontFamily: theme.fontMono, fontSize: '13px' }}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: theme.textMuted }}>
                            {rollNos.length} roll number{rollNos.length !== 1 ? 's' : ''} detected
                            {autoLoaded && <span style={{ marginLeft: 12, color: theme.success }}>✓ loaded from file</span>}
                        </div>
                    </div>

                    {/* Generate button */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center' }}>
                        <button
                            onClick={startGeneration}
                            disabled={!canGenerate}
                            style={{ ...styles.btnPrimary, opacity: canGenerate ? 1 : 0.45, cursor: canGenerate ? 'pointer' : 'not-allowed' }}>
                            {running ? '⏳ Generating…' : '⚡ Generate Embeddings'}
                        </button>
                        {!subject.trim() && !running && <span style={{ fontSize: '12px', color: theme.danger }}>↑ select a subject first</span>}
                        {running && <span style={{ fontSize: '12px', color: theme.textMuted }}>Processing {rollNos.length} students for <strong>{subject}</strong>…</span>}
                    </div>

                    {/* ── Summary table (shown after generation completes) ────────── */}
                    {summary && (
                        <div style={{ ...styles.card, marginBottom: 24 }}>
                            <div style={{ ...styles.sectionTitle, marginBottom: 14 }}>Generation Summary</div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Department', 'Subject Name', 'Subject Code', 'Roll Nos in Subject', 'Roll Nos in Embedding', 'Missing Roll Nos', 'Embedding File', 'Last Updated'].map(h => (                                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '10px 12px', fontSize: '12px', color: theme.text }}>{summary.dept}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '12px', color: theme.text, fontWeight: 500 }}>{summary.subject}</td>
                                            <td style={{ padding: '10px 12px', fontFamily: theme.fontMono, fontSize: '12px', color: summary.subjectCode ? theme.accent : theme.textMuted }}>
                                                {summary.subjectCode || '—'}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '12px', color: theme.accent }}>{summary.rollNosInSubject.length}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '12px', color: theme.success }}>{summary.success}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                                                {summary.missedRollNos.length > 0 ? (
                                                    <span style={{ color: theme.danger }}>
                                                        {summary.missedRollNos.length} —&nbsp;
                                                        <span style={{ fontFamily: theme.fontMono, fontSize: '11px' }}>
                                                            {summary.missedRollNos.map(m => m.rollNo || m).join(', ')}
                                                        </span>
                                                    </span>
                                                ) : (
                                                    <span style={{ color: theme.success }}>✓ none</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '10px 12px', fontFamily: theme.fontMono, fontSize: '11px', color: theme.success }}>{summary.embeddingFile}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '11px', color: theme.textMuted }}>
                                                {new Date().toLocaleString('en-IN')}
                                            </td>
                                            </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Per-student progress table */}
                    {rows.length > 0 && (
                        <div style={{ ...styles.card, marginBottom: 32 }}>
                            <div style={{ ...styles.sectionTitle, marginBottom: 14 }}>
                                Student Progress — {rows.filter(r => r.status === 'done').length}/{rows.length} done
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                            {['Roll No', 'Status', 'Photos Used', 'Note'].map(h => (
                                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(row => (
                                            <tr key={row.rollNo} style={{ borderBottom: `1px solid ${theme.border}22`, background: row.status === 'processing' ? theme.accentDim : 'transparent' }}>
                                                <td style={{ padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '12px', color: theme.text }}>{row.rollNo}</td>
                                                <td style={{ padding: '8px 12px' }}><StatusBadge status={row.status} /></td>
                                                <td style={{ padding: '8px 12px', color: row.photosUsed ? theme.accent : theme.textMuted, fontSize: '12px' }}>
                                                    {row.photosUsed != null ? `${row.photosUsed} photos` : '—'}
                                                </td>
                                                <td style={{ padding: '8px 12px', fontSize: '11px', color: row.status === 'failed' ? theme.danger : theme.textMuted }}>
                                                    {row.reason || ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    </>
            )}

            {/* History — shown as soon as dept is selected */}
            {dept && (
                <div style={{ ...styles.card, marginTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>Past Generations — {dept}</div>
                        <button onClick={loadHistory} disabled={historyLoading}
                            style={{ ...styles.btnGhost, padding: '5px 12px', fontSize: '11px' }}>
                            {historyLoading ? 'Loading…' : '↺ Refresh'}
                        </button>
                    </div>
                    {history.length === 0 ? (
                        <div style={{ color: theme.textMuted, fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                            {historyLoading ? 'Loading…' : 'No embedding generations yet.'}
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Date', 'Last Updated', 'Subject', 'Status', 'Roll Nos Present', 'Missing Roll Nos', 'Embedding File'].map(h => (
                                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(rec => {
                                        const missed = rec.missedRollNos || [];
                                        return (
                                            <tr key={rec._id} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                                                <td style={{ padding: '8px 12px', fontSize: '11px', color: theme.textMuted }}>{new Date(rec.generatedAt).toLocaleString('en-IN')}</td>
                                                <td style={{ padding: '8px 12px', fontSize: '11px', color: rec.lastUpdatedAt ? theme.accent : theme.textMuted }}>
                                                    {rec.lastUpdatedAt ? new Date(rec.lastUpdatedAt).toLocaleString('en-IN') : '—'}
                                                </td>
                                                <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text, fontWeight: 500 }}>{rec.subject || <span style={{ color: theme.textMuted }}>—</span>}</td>
                                                <td style={{ padding: '8px 12px' }}><StatusBadge status={rec.status} /></td>
                                                <td style={{ padding: '8px 12px', fontSize: '12px', maxWidth: 280 }}>
                                                   {(() => {
                                                        const allRolls = rec.rollNos || [];
                                                        const missedSet = new Set((rec.missedRollNos || []).map(m => m.rollNo || m));
                                                        const presentRolls = allRolls.filter(r => !missedSet.has(r));
                                                        if (allRolls.length === 0) {
                                                            return <span style={{ color: theme.success }}>{rec.studentsSuccess}✓</span>;
                                                        }
                                                        return (
                                                            <span>
                                                                <span style={{ color: theme.success }}>{presentRolls.length}✓ </span>
                                                                <span style={{ fontFamily: theme.fontMono, fontSize: '10px', color: theme.textMuted }}>
                                                                    {presentRolls.join(', ')}
                                                                </span>
                                                            </span>
                                                        );
                                                    })()}
                                                </td>       
                                                <td style={{ padding: '8px 12px', fontSize: '11px', maxWidth: 260 }}>
                                                    {missed.length === 0 ? (
                                                        <span style={{ color: theme.success }}>✓ none</span>
                                                    ) : (
                                                        <span style={{ color: theme.danger }}>
                                                            {missed.length} missing —&nbsp;
                                                            <span style={{ fontFamily: theme.fontMono, fontSize: '10px', color: theme.textMuted }}>
                                                                {missed.map(m => m.rollNo || m).join(', ')}
                                                            </span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '11px', color: theme.accent }}>{rec.embeddingFile || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmbeddingGeneration() {
    const { departments, deptLoading, deptError } = useDepartments();
    const [activeTab, setActiveTab] = useState(1);

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            <div style={{ marginBottom: 20 }}>
                <div style={styles.heading}>Embedding Generation</div>
                <div style={{ ...styles.subheading, marginBottom: 0 }}>
                    Manage face embeddings for ground truth photos
                </div>
            </div>

            <div style={{ display: 'flex', borderBottom: `1px solid ${theme.border}`, marginBottom: 24 }}>
                <Tab label="Subject Embeddings" icon="📚" active={activeTab === 1} onClick={() => setActiveTab(1)} />
                <Tab label="ERP Ground Truth" icon="👥" active={activeTab === 2} onClick={() => setActiveTab(2)} />
            </div>

            {activeTab === 1 && <GenerateTab departments={departments} deptLoading={deptLoading} deptError={deptError} />}
            {activeTab === 2 && <ERPSyncTab departments={departments} deptLoading={deptLoading} deptError={deptError} />}
        </div>
    );
}
