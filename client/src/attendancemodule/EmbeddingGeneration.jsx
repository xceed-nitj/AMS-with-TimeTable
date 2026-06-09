// client/src/attendancemodule/EmbeddingGeneration.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
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
                    <span><span style={{ color: theme.textMuted }}>Embedding file: </span>
                        {previewFileName
                            ? <span style={{ fontFamily: theme.fontMono, color: theme.success }}>{previewFileName}</span>
                            : <span style={{ color: theme.danger }}>select sem + subject to see filename</span>}
                    </span>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Direct .pkl Upload
// ═══════════════════════════════════════════════════════════════════════════════


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
    const xlsxRef = useRef();

    const batchName       = dept ? `BTECH_${dept}_2023` : null;
    const subjectSafe     = subject.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const previewFileName = sem && subjectSafe ? `${sem}_${subjectSafe}.pkl` : null;

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
    if (!dept || !sem || !subject) return;
    setHistoryLoading(true);
    try {
        const res  = await fetch(`${EMB_BASE}/history-by-dept?dept=${encodeURIComponent(dept)}`);
        const data = await res.json();
// Filter client-side by sem+subject so the table stays specific
        const all = data.records || [];
        setHistory(all.filter(r =>
           String(r.sem).trim() === String(sem).trim() &&
           (r.subject || '').trim().toLowerCase() === subject.trim().toLowerCase()
    ));
    } catch (_) {}
    setHistoryLoading(false);
}, [dept, sem, subject]);

    useEffect(() => {
    setSummary(null); setRows([]); setRollInput(''); setAutoLoaded(false);
    if (dept && sem && subject) loadHistory();
}, [dept, sem, subject]);

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
            />

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

                    {/* History */}
                    <div style={styles.card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>Past Generations — {dept}</div>
                            <button onClick={loadHistory} disabled={historyLoading}
                                style={{ ...styles.btnGhost, padding: '5px 12px', fontSize: '11px' }}>
                                {historyLoading ? 'Loading…' : '↺ Refresh'}
                            </button>
                        </div>
                        {history.length === 0 ? (
                            <div style={{ color: theme.textMuted, fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>No embedding generations yet.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    {['Date', 'Last Updated', 'Subject', 'Status', 'Students', 'Embedding File'].map(h => (                                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(rec => (
                                        <tr key={rec._id} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                                            <td style={{ padding: '8px 12px', fontSize: '11px', color: theme.textMuted }}>{new Date(rec.generatedAt).toLocaleString('en-IN')}</td>
                                            <td style={{ padding: '8px 12px', fontSize: '11px', color: rec.lastUpdatedAt ? theme.accent : theme.textMuted }}>
                                                {rec.lastUpdatedAt ? new Date(rec.lastUpdatedAt).toLocaleString('en-IN') : '—'}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontSize: '12px', color: theme.text, fontWeight: 500 }}>{rec.subject || <span style={{ color: theme.textMuted }}>—</span>}</td>
                                            <td style={{ padding: '8px 12px' }}><StatusBadge status={rec.status} /></td>
                                            <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                                                <span style={{ color: theme.success }}>{rec.studentsSuccess}✓</span>
                                                {rec.studentsFailed > 0 && <span style={{ color: theme.danger, marginLeft: 6 }}>{rec.studentsFailed}✗</span>}
                                            </td>
                                            <td style={{ padding: '8px 12px', fontFamily: theme.fontMono, fontSize: '11px', color: theme.accent }}>{rec.embeddingFile || '—'}</td>
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


// ═══════════════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════════════
export default function EmbeddingGeneration() {
    const { departments, deptLoading, deptError } = useDepartments();

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            <div style={{ marginBottom: 20 }}>
                <div style={styles.heading}>Embedding Generation</div>
                <div style={{ ...styles.subheading, marginBottom: 0 }}>
                    Generate face embeddings from ground truth photos — upload an <code style={{ color: theme.accent }}>.xlsx</code> to load roll numbers or paste them directly
                </div>
            </div>

            <div style={{ paddingTop: 24 }}>
                <GenerateTab departments={departments} deptLoading={deptLoading} deptError={deptError} />
            </div>
        </div>
    );
}
