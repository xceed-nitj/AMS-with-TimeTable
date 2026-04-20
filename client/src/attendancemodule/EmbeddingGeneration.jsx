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
function FilterBlock({ dept, setDept, sem, setSem, subject, setSubject, departments, deptLoading, deptError }) {
    const [sems, setSems] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [semsLoading, setSemsLoading] = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);

    useEffect(() => {
        setSem(''); setSubject(''); setSems([]); setSubjects([]);
        if (!dept) return;
        setSemsLoading(true);
        fetch(`${apiUrl}/timetablemodule/lock/sems-by-dept?dept=${encodeURIComponent(dept)}`)
            .then(r => r.json()).then(d => setSems(d.sems || []))
            .catch(() => {}).finally(() => setSemsLoading(false));
    }, [dept]);

    useEffect(() => {
        setSubject(''); setSubjects([]);
        if (!dept || !sem) return;
        setSubjectsLoading(true);
        fetch(`${apiUrl}/timetablemodule/lock/subjects-by-dept-sem?dept=${encodeURIComponent(dept)}&sem=${encodeURIComponent(sem)}`)
            .then(r => r.json()).then(d => setSubjects(d.subjects || []))
            .catch(() => {}).finally(() => setSubjectsLoading(false));
    }, [dept, sem]);

    const subjectSafe     = subject.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const previewFileName = sem && subjectSafe ? `${sem}_${subjectSafe}.pkl` : null;

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
                    <select value={subject} onChange={e => setSubject(e.target.value)} style={styles.select} disabled={!sem || subjectsLoading}>
                        <option value="">{subjectsLoading ? 'Loading…' : !sem ? 'Select sem first' : subjects.length ? 'Select subject…' : 'No subjects found'}</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
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
function UploadPklTab({ departments, deptLoading, deptError }) {
    const [dept,    setDept]    = useState('');
    const [sem,     setSem]     = useState('');
    const [subject, setSubject] = useState('');
    const [rollInput, setRollInput] = useState('');
    const [file,    setFile]    = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result,  setResult]  = useState(null);
    const [toast,   setToast]   = useState(null);

    // Existing .pkl files on disk
    const [existingFiles, setExistingFiles] = useState([]);
    const [filesLoading,  setFilesLoading]  = useState(false);
    const [expandedMissed, setExpandedMissed] = useState(null);

    const fileRef = useRef();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const rollNos = rollInput.split(/[\n,;\s]+/).map(r => r.trim().toUpperCase()).filter(Boolean);

    const loadExisting = useCallback(async () => {
        setFilesLoading(true);
        try {
            const res  = await fetch(`${EMB_BASE}/list-files`);
            const data = await res.json();
            setExistingFiles(data.files || []);
        } catch (e) {
            showToast('Failed to load existing files: ' + e.message, 'error');
        }
        setFilesLoading(false);
    }, []);

    useEffect(() => { loadExisting(); }, [loadExisting]);

    const canUpload = !uploading && file && sem && subject.trim() && dept;

    const handleUpload = async () => {
        if (!canUpload) return;
        setUploading(true);
        setResult(null);

        try {
            const fd = new FormData();
            fd.append('file',    file);
            fd.append('sem',     sem.trim());
            fd.append('subject', subject.trim());
            fd.append('dept',    dept.trim());
            fd.append('rollNos', JSON.stringify(rollNos));

            const res  = await fetch(`${EMB_BASE}/upload-pkl`, { method: 'POST', body: fd });
            const data = await res.json();

            if (!res.ok) { showToast(data.error || 'Upload failed', 'error'); setUploading(false); return; }

            setResult(data);
            showToast(`✓ Uploaded & saved as ${data.embeddingFile}`);
            setFile(null);
            if (fileRef.current) fileRef.current.value = '';
            loadExisting();
        } catch (e) {
            showToast('Upload error: ' + e.message, 'error');
        }
        setUploading(false);
    };

    return (
        <div>
            <Toast toast={toast} />

            {/* Filter block */}
            <FilterBlock
                dept={dept} setDept={setDept}
                sem={sem} setSem={setSem}
                subject={subject} setSubject={setSubject}
                departments={departments} deptLoading={deptLoading} deptError={deptError}
            />

            {/* Roll numbers */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                <div style={{ ...styles.sectionTitle, marginBottom: 10 }}>Roll Numbers covered by this .pkl file</div>
                <textarea
                    value={rollInput}
                    onChange={e => setRollInput(e.target.value)}
                    placeholder="Enter roll numbers (comma / newline separated)&#10;e.g. 23104001, 23104002, …"
                    style={{ ...styles.input, height: 110, resize: 'vertical', fontFamily: theme.fontMono, fontSize: '13px' }}
                />
                <div style={{ marginTop: 6, fontSize: '12px', color: theme.textMuted }}>
                    {rollNos.length} roll number{rollNos.length !== 1 ? 's' : ''} detected
                </div>
            </div>

            {/* File picker + Upload */}
            <div style={{ ...styles.card, marginBottom: 28 }}>
                <div style={{ ...styles.sectionTitle, marginBottom: 14 }}>Upload .pkl File</div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '9px 18px', borderRadius: 6, cursor: 'pointer',
                        background: theme.accentDim, color: theme.accent,
                        border: `1px solid ${theme.accent}44`, fontSize: '13px', fontWeight: 600,
                    }}>
                        📁 Choose .pkl file
                        <input ref={fileRef} type="file" accept=".pkl" style={{ display: 'none' }}
                            onChange={e => setFile(e.target.files?.[0] || null)} />
                    </label>

                    {file && (
                        <span style={{ fontSize: '13px', fontFamily: theme.fontMono, color: theme.success }}>
                            {file.name} <span style={{ color: theme.textMuted }}>({(file.size / 1024).toFixed(0)} KB)</span>
                        </span>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!canUpload}
                        style={{
                            ...styles.btnPrimary, marginLeft: 'auto',
                            opacity: canUpload ? 1 : 0.4,
                            cursor: canUpload ? 'pointer' : 'not-allowed',
                        }}>
                        {uploading ? '⏳ Uploading…' : '⬆️ Upload & Register'}
                    </button>
                </div>

                {!dept && (
                    <div style={{ marginTop: 10, fontSize: '12px', color: theme.danger }}>
                        ↑ Select dept, sem and subject first
                    </div>
                )}

                {/* Result banner */}
                {result && (
                    <div style={{
                        marginTop: 16, padding: '14px 18px', borderRadius: 8,
                        background: theme.successDim, border: `1px solid ${theme.success}44`,
                        fontSize: '13px',
                    }}>
                        <span style={{ color: theme.success, fontWeight: 700 }}>✓ Registered successfully</span>
                        <span style={{ color: theme.textMuted, marginLeft: 16 }}>File: </span>
                        <span style={{ fontFamily: theme.fontMono, color: theme.accent }}>{result.embeddingFile}</span>
                        <span style={{ color: theme.textMuted, marginLeft: 16 }}>{result.rollNosCount} roll nos saved</span>
                        <span style={{ color: theme.textMuted, marginLeft: 16 }}>ML service reloaded ✓</span>
                    </div>
                )}
            </div>

            {/* Existing .pkl files table */}
            <div style={styles.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>Embedding Files on Server</div>
                    <button onClick={loadExisting} disabled={filesLoading}
                        style={{ ...styles.btnGhost, padding: '5px 12px', fontSize: '11px' }}>
                        {filesLoading ? 'Loading…' : '↺ Refresh'}
                    </button>
                </div>

                {existingFiles.length === 0 ? (
                    <div style={{ color: theme.textMuted, fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>
                        {filesLoading ? 'Loading…' : 'No .pkl files found on server.'}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                    {['File', 'Sem', 'Subject', 'Dept', 'Size', 'Roll Nos', 'Missed', 'Date'].map(h => (
                                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {existingFiles.map(f => (
                                    <>
                                        <tr key={f.filename} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                                            <td style={{ padding: '8px 10px', fontFamily: theme.fontMono, fontSize: '11px', color: theme.accent }}>{f.filename}</td>
                                            <td style={{ padding: '8px 10px', fontSize: '12px', color: theme.text }}>{f.sem || '—'}</td>
                                            <td style={{ padding: '8px 10px', fontSize: '12px', color: theme.text }}>{f.subject || '—'}</td>
                                            <td style={{ padding: '8px 10px', fontSize: '12px', color: theme.textMuted }}>{f.dept || '—'}</td>
                                            <td style={{ padding: '8px 10px', fontSize: '11px', color: theme.textMuted }}>{f.sizeKB} KB</td>
                                            <td style={{ padding: '8px 10px', fontSize: '12px', color: theme.accent }}>{f.rollNos?.length ?? 0}</td>
                                            <td style={{ padding: '8px 10px' }}>
                                                {f.missedCount > 0 ? (
                                                    <button
                                                        onClick={() => setExpandedMissed(expandedMissed === f.filename ? null : f.filename)}
                                                        style={{ ...styles.btnDanger, padding: '3px 10px', fontSize: '11px' }}>
                                                        {f.missedCount} missed {expandedMissed === f.filename ? '▲' : '▼'}
                                                    </button>
                                                ) : (
                                                    <span style={{ color: theme.success, fontSize: '11px' }}>✓ none</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '8px 10px', fontSize: '11px', color: theme.textMuted }}>
                                                {f.generatedAt ? new Date(f.generatedAt).toLocaleDateString('en-IN') : '—'}
                                            </td>
                                        </tr>

                                        {/* Expanded missed roll nos */}
                                        {expandedMissed === f.filename && f.missedRollNos?.length > 0 && (
                                            <tr key={`${f.filename}-missed`} style={{ background: theme.dangerDim }}>
                                                <td colSpan={8} style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
                                                        Missed Roll Numbers — no ground truth folder at time of generation
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                        {f.missedRollNos.map(m => (
                                                            <span key={m.rollNo} title={m.reason} style={{
                                                                padding: '2px 8px', borderRadius: 4,
                                                                background: theme.dangerDim, color: theme.danger,
                                                                fontFamily: theme.fontMono, fontSize: '11px',
                                                                border: `1px solid ${theme.danger}33`,
                                                                cursor: 'help',
                                                            }}>
                                                                {m.rollNo}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div style={{ marginTop: 8, fontSize: '11px', color: theme.textMuted }}>
                                                        💡 Upload ground truth for these students, then re-generate embeddings — or upload an updated .pkl directly.
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Generate from Ground Truth (original flow)
// ═══════════════════════════════════════════════════════════════════════════════
function GenerateTab({ departments, deptLoading, deptError }) {
    const [dept,     setDept]     = useState('');
    const [sem,      setSem]      = useState('');
    const [subject,  setSubject]  = useState('');

    const [rollInput,  setRollInput]  = useState('');
    const [rollNos,    setRollNos]    = useState([]);
    const [autoLoaded, setAutoLoaded] = useState(false);

    const [rows,    setRows]    = useState([]);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState(null);

    const [history,        setHistory]        = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [toast, setToast] = useState(null);

    const batchName   = dept ? `BTECH_${dept}_2023` : null;
    const subjectSafe = subject.trim().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const previewFileName = sem && subjectSafe ? `${sem}_${subjectSafe}.pkl` : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const parseRolls = (raw) =>
        raw.split(/[\n,;\s]+/).map(r => r.trim().toUpperCase()).filter(Boolean);

    useEffect(() => { setRollNos(parseRolls(rollInput)); }, [rollInput]);

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
        setSummary(null); setRows([]); setRollInput(''); setAutoLoaded(false);
        if (batchName) loadHistory();
    }, [batchName]);

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
                body: JSON.stringify({ sem: sem.trim(), subject: subject.trim(), dept: dept.trim(), rollNos }),
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
                            setSummary({ success: msg.success, failed: msg.failed, embeddingFile: msg.embeddingFile, failedList: msg.failedList || [], recordId: msg.recordId });
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

    const noFilters  = !dept;
    const canGenerate = !running && rollNos.length > 0 && subject.trim().length > 0 && sem.trim().length > 0;

    return (
        <div>
            <Toast toast={toast} />

            {/* Filter block */}
            <FilterBlock
                dept={dept} setDept={setDept}
                sem={sem} setSem={setSem}
                subject={subject} setSubject={setSubject}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>Roll Numbers for this Subject</div>
                            <button onClick={loadAllRolls} disabled={running}
                                style={{ ...styles.btnGhost, padding: '6px 14px', fontSize: '12px' }}>
                                ↺ Load all from Ground Truth
                            </button>
                        </div>
                        <textarea
                            value={rollInput}
                            onChange={e => setRollInput(e.target.value)}
                            disabled={running}
                            placeholder="Enter roll numbers separated by newlines or commas"
                            style={{ ...styles.input, height: 140, resize: 'vertical', fontFamily: theme.fontMono, fontSize: '13px' }}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: theme.textMuted }}>
                            {rollNos.length} roll number{rollNos.length !== 1 ? 's' : ''} detected
                            {autoLoaded && <span style={{ marginLeft: 12, color: theme.success }}>✓ auto-loaded from ground truth</span>}
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
                        {!subject.trim() && !running && <span style={{ fontSize: '12px', color: theme.danger }}>↑ enter a subject name first</span>}
                        {running && <span style={{ fontSize: '12px', color: theme.textMuted }}>Processing {rollNos.length} students for <strong>{subject}</strong>…</span>}
                    </div>

                    {/* Summary banner */}
                    {summary && (
                        <div style={{
                            ...styles.card, marginBottom: 24,
                            border: `1px solid ${summary.failed === 0 ? theme.success + '44' : theme.warning + '44'}`,
                            background: summary.failed === 0 ? theme.successDim : theme.warningDim,
                            display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
                        }}>
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 4 }}>Result</div>
                                <div style={{ fontWeight: 700, fontSize: '16px' }}>
                                    <span style={{ color: theme.success }}>{summary.success} succeeded</span>
                                    &nbsp;·&nbsp;
                                    <span style={{ color: summary.failed > 0 ? theme.danger : theme.textMuted }}>{summary.failed} failed</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 4 }}>Embedding File Saved</div>
                                <div style={{ fontFamily: theme.fontMono, fontSize: '13px', color: theme.success }}>{summary.embeddingFile}</div>
                            </div>
                            {summary.failedList?.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: 4 }}>Failed Students</div>
                                    <div style={{ fontSize: '12px', color: theme.danger }}>{summary.failedList.map(f => f.rollNo).join(', ')}</div>
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
                            <div style={{ ...styles.sectionTitle, marginBottom: 0, flex: 1 }}>Past Generations — {batchName}</div>
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
                                        {['Date', 'Subject', 'Status', 'Students', 'Embedding File'].map(h => (
                                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(rec => (
                                        <tr key={rec._id} style={{ borderBottom: `1px solid ${theme.border}22` }}>
                                            <td style={{ padding: '8px 12px', fontSize: '11px', color: theme.textMuted }}>{new Date(rec.generatedAt).toLocaleString('en-IN')}</td>
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
    const [activeTab, setActiveTab] = useState('generate');
    const { departments, deptLoading, deptError } = useDepartments();

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
                <div style={styles.heading}>Embedding Generation</div>
                <div style={{ ...styles.subheading, marginBottom: 0 }}>
                    Generate face embeddings from ground truth photos — or upload a pre-built <code style={{ color: theme.accent }}>.pkl</code> file directly
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: `1px solid ${theme.border}` }}>
                <Tab label="Generate from Photos" icon="⚡" active={activeTab === 'generate'} onClick={() => setActiveTab('generate')} />
                <Tab label="Upload .pkl Directly" icon="⬆️" active={activeTab === 'upload'}   onClick={() => setActiveTab('upload')} />
            </div>

            <div style={{ paddingTop: 24 }}>
                {activeTab === 'generate'
                    ? <GenerateTab departments={departments} deptLoading={deptLoading} deptError={deptError} />
                    : <UploadPklTab departments={departments} deptLoading={deptLoading} deptError={deptError} />
                }
            </div>
        </div>
    );
}
