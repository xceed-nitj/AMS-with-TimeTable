// client/src/attendancemodule/EmbeddingGeneration.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import getEnvironment from '../getenvironment';

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

// ─── Main component ───────────────────────────────────────────────────────────
export default function EmbeddingGeneration() {
    const [dept,     setDept]     = useState('');
    const [sem,      setSem]      = useState('');
    const [subject,  setSubject]  = useState('');
    const [sems,     setSems]     = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [semsLoading,     setSemsLoading]     = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);

    const { departments, deptLoading, deptError } = useDepartments();
    // Fetch sems when dept changes
useEffect(() => {
    setSem(''); setSubject(''); setSems([]); setSubjects([]);
    if (!dept) return;
    setSemsLoading(true);
    fetch(`${apiUrl}/timetablemodule/lock/sems-by-dept?dept=${encodeURIComponent(dept)}`)
        .then(r => r.json())
        .then(data => setSems(data.sems || []))
        .catch(() => {})
        .finally(() => setSemsLoading(false));
}, [dept]);

// Fetch subjects when dept+sem changes
useEffect(() => {
    setSubject(''); setSubjects([]);
    if (!dept || !sem) return;
    setSubjectsLoading(true);
    fetch(`${apiUrl}/timetablemodule/lock/subjects-by-dept-sem?dept=${encodeURIComponent(dept)}&sem=${encodeURIComponent(sem)}`)
        .then(r => r.json())
        .then(data => setSubjects(data.subjects || []))
        .catch(() => {})
        .finally(() => setSubjectsLoading(false));
}, [dept, sem]);

    const [rollInput,  setRollInput]  = useState('');
    const [rollNos,    setRollNos]    = useState([]);
    const [autoLoaded, setAutoLoaded] = useState(false);

    const [rows,    setRows]    = useState([]);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState(null);

    const [history,        setHistory]        = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [toast, setToast] = useState(null);

    // batchName is no longer used for file naming — kept only for GT history lookup fallback
    const batchName = dept ? `BTECH_${dept}_2023` : null;

    // File naming: {sem}_{subjectSafe}.pkl  e.g. 6_Digital_Electronics.pkl
    const subjectSafe     = subject.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const previewFileName = sem && subjectSafe ? `${sem}_${subjectSafe}.pkl` : null;


    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const parseRolls = (raw) =>
        raw.split(/[\n,;\s]+/).map(r => r.trim().toUpperCase()).filter(Boolean);

    useEffect(() => { setRollNos(parseRolls(rollInput)); }, [rollInput]);

    // Auto-load all roll numbers for this batch from GT
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

    // Load history for this batch
    const loadHistory = useCallback(async () => {
        if (!batchName) return;
        setHistoryLoading(true);
        try {
            const res  = await fetch(`${EMB_BASE}/status/${encodeURIComponent(batchName)}`);
            const data = await res.json();
            setHistory(data.records || []);
        } catch (_) {}
        setHistoryLoading(false);
    }, [batchName]);

    useEffect(() => {
        setSummary(null);
        setRows([]);
        setRollInput('');
        setAutoLoaded(false);
        // NOTE: do NOT reset sem/subject here — the dept useEffect above already
        // does that, and resetting here causes a race that wipes the sems dropdown.
        if (batchName) loadHistory();
    }, [batchName]);

    // ─── Start generation ──────────────────────────────────────────────────
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
                body: JSON.stringify({
                    sem:     sem.trim(),
                    subject: subject.trim(),
                    dept:    dept.trim(),
                    rollNos,
                }),
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
                            updateRow(msg.rollNo, {
                                status:     msg.status,
                                reason:     msg.reason    || null,
                                photosUsed: msg.photosUsed || null,
                            });
                        }

                        if (msg.type === 'done') {
                            setSummary({
                                success:       msg.success,
                                failed:        msg.failed,
                                embeddingFile: msg.embeddingFile,
                                failedList:    msg.failedList || [],
                                recordId:      msg.recordId,
                            });
                            showToast(`Done — ${msg.success} succeeded, ${msg.failed} failed`);
                            loadHistory();
                        }
                    } catch (_) {}
                }
            }
        } catch (err) {
            showToast('Generation failed: ' + err.message, 'error');
        }

        setRunning(false);
    };

    const noFilters = !dept;
    const canGenerate = !running && rollNos.length > 0 && subject.trim().length > 0 && sem.trim().length > 0;

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>
            <Toast toast={toast} />

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Embedding Generation</div>
                <div style={{ ...styles.subheading, marginBottom: 0 }}>
                    Generate face embeddings per subject — each subject gets its own <code style={{ color: theme.accent }}>.pkl</code> file
                </div>
            </div>

            {/* Filter card */}
            <div style={{ ...styles.card, marginBottom: 24, padding: '18px 24px' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 16, alignItems: 'end', marginBottom: 16 }}>
        {/* Dept */}
        <div>
            <label style={styles.label}>Department</label>
            <select value={dept} onChange={e => setDept(e.target.value)} style={styles.select} disabled={deptLoading}>
                <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select department…'}</option>
                {departments.map(d => <option key={d}>{d}</option>)}
            </select>
        </div>
        {/* Sem — auto-populated from LockSem */}
        <div>
            <label style={styles.label}>Semester <span style={{ color: theme.danger }}>*</span></label>
            <select value={sem} onChange={e => setSem(e.target.value)} style={styles.select} disabled={!dept || semsLoading}>
                <option value="">{semsLoading ? 'Loading…' : !dept ? 'Select dept first' : sems.length ? 'Select sem…' : 'No sems found'}</option>
                {sems.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
        {/* Subject — auto-populated from LockSem */}
        <div>
            <label style={styles.label}>Subject <span style={{ color: theme.danger }}>*</span>
                <span style={{ color: theme.textMuted, fontWeight: 400, marginLeft: 6, textTransform: 'none' }}>
                    (used in the .pkl file name)
                </span>
            </label>
            <select value={subject} onChange={e => setSubject(e.target.value)} style={styles.select} disabled={!sem || subjectsLoading}>
                <option value="">{subjectsLoading ? 'Loading…' : !sem ? 'Select sem first' : subjects.length ? 'Select subject…' : 'No subjects found'}</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
    </div>

    {/* Preview */}
    {dept && (
        <div style={{ marginTop: 8, padding: '10px 14px', background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: '12px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <span><span style={{ color: theme.textMuted }}>Dept: </span><span style={{ fontFamily: theme.fontMono, color: theme.accent }}>{dept}</span></span>
            <span><span style={{ color: theme.textMuted }}>Embedding file: </span>
                {previewFileName
                    ? <span style={{ fontFamily: theme.fontMono, color: theme.success }}>{previewFileName}</span>
                    : <span style={{ color: theme.danger }}>select sem + subject to see filename</span>}
            </span>
        </div>
    )}
</div>

            {noFilters ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '14px' }}>
                    Select degree, department and year to continue.
                </div>
            ) : (
                <>
                    {/* Roll number input */}
                    <div style={{ ...styles.card, marginBottom: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>
                                Roll Numbers for this Subject
                            </div>
                            <button
                                onClick={loadAllRolls}
                                disabled={running}
                                style={{ ...styles.btnGhost, padding: '6px 14px', fontSize: '12px' }}>
                                ↺ Load all from Ground Truth
                            </button>
                        </div>
                        <textarea
                            value={rollInput}
                            onChange={e => setRollInput(e.target.value)}
                            disabled={running}
                            placeholder="Enter roll numbers for this subject, separated by newlines or commas&#10;e.g.&#10;23104001&#10;23104009&#10;23104010"
                            style={{
                                ...styles.input,
                                height: 140,
                                resize: 'vertical',
                                fontFamily: theme.fontMono,
                                fontSize: '13px',
                            }}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: theme.textMuted }}>
                            {rollNos.length} roll number{rollNos.length !== 1 ? 's' : ''} detected
                            {autoLoaded && (
                                <span style={{ marginLeft: 12, color: theme.success }}>
                                    ✓ auto-loaded from ground truth
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Generate button */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center' }}>
                        <button
                            onClick={startGeneration}
                            disabled={!canGenerate}
                            style={{
                                ...styles.btnPrimary,
                                opacity: canGenerate ? 1 : 0.45,
                                cursor:  canGenerate ? 'pointer' : 'not-allowed',
                            }}>
                            {running ? '⏳ Generating…' : '⚡ Generate Embeddings'}
                        </button>

                        {!subject.trim() && !running && (
                            <span style={{ fontSize: '12px', color: theme.danger }}>
                                ↑ enter a subject name first
                            </span>
                        )}
                        {running && (
                            <span style={{ fontSize: '12px', color: theme.textMuted }}>
                                Processing {rollNos.length} students for <strong>{subject}</strong>…
                            </span>
                        )}
                    </div>

                    {/* Summary banner */}
                    {summary && (
                        <div style={{
                            ...styles.card,
                            marginBottom: 24,
                            border: `1px solid ${summary.failed === 0 ? theme.success + '44' : theme.warning + '44'}`,
                            background: summary.failed === 0 ? theme.successDim : theme.warningDim,
                            display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 4 }}>Result</div>
                                <div style={{ fontWeight: 700, fontSize: '16px' }}>
                                    <span style={{ color: theme.success }}>{summary.success} succeeded</span>
                                    &nbsp;·&nbsp;
                                    <span style={{ color: summary.failed > 0 ? theme.danger : theme.textMuted }}>
                                        {summary.failed} failed
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 4 }}>Embedding File Saved</div>
                                <div style={{ fontFamily: theme.fontMono, fontSize: '13px', color: theme.success }}>
                                    {summary.embeddingFile}
                                </div>
                            </div>
                            {summary.failedList?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 4 }}>Failed Students</div>
                                    <div style={{ fontSize: '12px', color: theme.danger }}>
                                        {summary.failedList.map(f => f.rollNo).join(', ')}
                                    </div>
                                </div>
                            )}
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
                                                <th key={h} style={{
                                                    padding: '8px 12px', textAlign: 'left',
                                                    fontSize: '10px', color: theme.textMuted,
                                                    fontWeight: 600, textTransform: 'uppercase',
                                                    letterSpacing: '0.07em',
                                                }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map(row => (
                                            <tr key={row.rollNo} style={{
                                                borderBottom: `1px solid ${theme.border}22`,
                                                background: row.status === 'processing'
                                                    ? theme.accentDim : 'transparent',
                                            }}>
                                                <td style={{
                                                    padding: '8px 12px',
                                                    fontFamily: theme.fontMono, fontSize: '12px',
                                                    color: theme.text,
                                                }}>{row.rollNo}</td>
                                                <td style={{ padding: '8px 12px' }}>
                                                    <StatusBadge status={row.status} />
                                                </td>
                                                <td style={{
                                                    padding: '8px 12px',
                                                    color: row.photosUsed ? theme.accent : theme.textMuted,
                                                    fontSize: '12px',
                                                }}>
                                                    {row.photosUsed != null ? `${row.photosUsed} photos` : '—'}
                                                </td>
                                                <td style={{
                                                    padding: '8px 12px', fontSize: '11px',
                                                    color: row.status === 'failed' ? theme.danger : theme.textMuted,
                                                }}>
                                                    {row.reason || ''}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* History — grouped, shows per-subject embedding files */}
                    <div style={styles.card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>
                                Past Generations — {batchName}
                            </div>
                            <button onClick={loadHistory} disabled={historyLoading}
                                style={{ ...styles.btnGhost, padding: '5px 12px', fontSize: '11px' }}>
                                {historyLoading ? 'Loading…' : '↺ Refresh'}
                            </button>
                        </div>
                        {history.length === 0 ? (
                            <div style={{ color: theme.textMuted, fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                                No embedding generations yet for this batch.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Date', 'Subject', 'Status', 'Students', 'Embedding File'].map(h => (
                                            <th key={h} style={{
                                                padding: '8px 12px', textAlign: 'left',
                                                fontSize: '10px', color: theme.textMuted,
                                                fontWeight: 600, textTransform: 'uppercase',
                                                letterSpacing: '0.07em',
                                            }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(rec => (
                                        <tr key={rec._id} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                                            <td style={{ padding: '8px 12px', fontSize: '11px', color: theme.textMuted }}>
                                                {new Date(rec.generatedAt).toLocaleString('en-IN')}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text, fontWeight: 500 }}>
                                                {rec.subject || <span style={{ color: theme.textMuted }}>—</span>}
                                            </td>
                                            <td style={{ padding: '8px 12px' }}>
                                                <StatusBadge status={rec.status} />
                                            </td>
                                            <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                                                <span style={{ color: theme.success }}>{rec.studentsSuccess}✓</span>
                                                {rec.studentsFailed > 0 && (
                                                    <span style={{ color: theme.danger, marginLeft: 6 }}>{rec.studentsFailed}✗</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '11px', color: theme.accent }}>
                                                {rec.embeddingFile || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
