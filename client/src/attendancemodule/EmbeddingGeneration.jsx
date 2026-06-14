// client/src/attendancemodule/EmbeddingGeneration.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import getEnvironment from '../getenvironment';
import * as XLSX from 'xlsx';

const apiUrl   = getEnvironment();
const EMB_BASE = `${apiUrl}/attendancemodule/embeddings`;
const GT_BASE  = `${apiUrl}/attendancemodule/ground-truth`;

// --- Toast --------------------------------------------------------------------
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

// --- Status badge -------------------------------------------------------------
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

// --- Tab button ---------------------------------------------------------------
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

// --- Roll chips ---------------------------------------------------------------
function RollChips({ rolls, color, bg, border }) {
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {rolls.map(r => (
                <span key={r} style={{
                    fontFamily: theme.fontMono, fontSize: '10px',
                    padding: '2px 7px', borderRadius: 4,
                    background: bg, color, border: `1px solid ${border}`,
                }}>{r}</span>
            ))}
        </div>
    );
}

// --- Dept / Sem / Subject filter block ---------------------------------------
// prefillSem / prefillSubject: auto-select after async options load
function FilterBlock({
    dept, setDept, sem, setSem, subject, setSubject,
    subjectCode, setSubjectCode, setSubjectId,
    departments, deptLoading, deptError,
    prefillSem, prefillSubject,
}) {
    const [sems,            setSems]            = useState([]);
    const [subjects,        setSubjects]        = useState([]);
    const [semsLoading,     setSemsLoading]     = useState(false);
    const [subjectsLoading, setSubjectsLoading] = useState(false);

    // Load sems when dept changes
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

    // Auto-select prefillSem once sems are loaded
    useEffect(() => {
        if (!prefillSem || sems.length === 0) return;
        if (sems.includes(String(prefillSem))) setSem(String(prefillSem));
    }, [sems, prefillSem]);

    // Load subjects when sem changes
    useEffect(() => {
        setSubject(''); setSubjects([]);
        if (setSubjectCode) setSubjectCode('');
        if (setSubjectId)   setSubjectId('');
        if (!dept || !sem) return;
        setSubjectsLoading(true);
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

    // Auto-select prefillSubject once subjects are loaded
    useEffect(() => {
        if (!prefillSubject || subjects.length === 0) return;
        const match = subjects.find(s => (s.subName || s.subjectFullName) === prefillSubject);
        if (match) {
            setSubject(match.subName || match.subjectFullName);
            if (setSubjectCode) setSubjectCode(match.subCode || '');
            if (setSubjectId)   setSubjectId(String(match._id));
        }
    }, [subjects, prefillSubject]);

    return (
        <div style={{ ...styles.card, marginBottom: 20, padding: '18px 24px', borderLeft: `3px solid ${theme.accent}` }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Selection</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 16, alignItems: 'end' }} className="r-grid-3">
                <div>
                    <label style={styles.label}>Department</label>
                    <select value={dept} onChange={e => setDept(e.target.value)} style={styles.select} disabled={deptLoading}>
                        <option value="">{deptLoading ? 'Loading...' : deptError ? 'Error' : 'Select department...'}</option>
                        {departments.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Semester</label>
                    <select value={sem} onChange={e => setSem(e.target.value)} style={styles.select} disabled={!dept || semsLoading}>
                        <option value="">{semsLoading ? 'Loading...' : !dept ? 'Select dept first' : sems.length ? 'Select sem...' : 'No sems'}</option>
                        {sems.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label style={styles.label}>Subject</label>
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
                        <option value="">{subjectsLoading ? 'Loading...' : !sem ? 'Select sem first' : subjects.length ? 'Select subject...' : 'No subjects'}</option>
                        {subjects.map(s => {
                            const name = s.subName || s.subjectFullName;
                            return <option key={String(s._id)} value={name}>{name}</option>;
                        })}
                    </select>
                </div>
            </div>
        </div>
    );
}

// ===============================================================================
// TAB 1 - Generate Subject Embeddings
// ===============================================================================
function GenerateTab({ departments, deptLoading, deptError, prefill, onPrefillConsumed }) {
    const [dept,        setDept]        = useState('');
    const [sem,         setSem]         = useState('');
    const [subject,     setSubject]     = useState('');
    const [subjectCode, setSubjectCode] = useState('');
    const [subjectId,   setSubjectId]   = useState('');

    const [rollInput,  setRollInput]  = useState('');
    const [rollNos,    setRollNos]    = useState([]);

    const [rows,    setRows]    = useState([]);
    const [running, setRunning] = useState(false);
    const [summary, setSummary] = useState(null);

    const [prefillSem,     setPrefillSem]     = useState('');
    const [prefillSubject, setPrefillSubject] = useState('');
    const [isUpdateMode,   setIsUpdateMode]   = useState(false);

    const [toast, setToast] = useState(null);
    const xlsxRef = useRef();

    const batchName   = dept ? `BTECH_${dept}_2023` : null;
    const canGenerate = !running && subject.trim().length > 0 && sem.trim().length > 0;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const parseRolls = (raw) =>
        raw.split(/[\n,;\s]+/).map(r => r.trim().toUpperCase()).filter(Boolean);

    useEffect(() => { setRollNos(parseRolls(rollInput)); }, [rollInput]);

    // Apply prefill when it arrives from ViewTab
    useEffect(() => {
        if (!prefill) return;
        setDept(prefill.dept || '');
        setRollInput((prefill.rollNos || []).join('\n'));
        setSummary(null);
        setRows([]);
        setPrefillSem(prefill.sem || '');
        setPrefillSubject(prefill.subject || '');
        setIsUpdateMode(true);
    }, [prefill]);

    const handleSetDept = (d) => {
        setDept(d);
        setSummary(null);
        setRows([]);
        setRollInput('');
        setPrefillSem('');
        setPrefillSubject('');
        setIsUpdateMode(false);
        if (onPrefillConsumed) onPrefillConsumed();
    };

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
                showToast(`Loaded ${rolls.length} roll numbers from ${file.name}`);
            } catch (err) {
                showToast('Failed to parse xlsx: ' + err.message, 'error');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const startGeneration = async () => {
        if (!batchName || rollNos.length === 0 || !subject.trim()) return;
        setRunning(true);
        setSummary(null);

        const initRows = rollNos.map(r => ({ rollNo: r, status: 'pending', reason: null, photosUsed: null }));
        setRows(initRows);

        const updateRow = (rollNo, patch) =>
            setRows(prev => prev.map(r => r.rollNo === rollNo ? { ...r, ...patch } : r));

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
                                success:       msg.success,
                                failed:        msg.failed,
                                embeddingFile: msg.embeddingFile,
                                missedRollNos: msg.missedRollNos || [],
                                dept:          dept.trim(),
                                sem:           sem.trim(),
                                subject:       subject.trim(),
                            });
                            showToast(`Done - ${msg.success} succeeded, ${msg.failed} failed`);
                        }
                    } catch (_) {}
                }
            }
        } catch (err) {
            showToast('Generation failed: ' + err.message, 'error');
        }

        setRunning(false);
    };

    const doneCount   = rows.filter(r => r.status === 'done').length;
    const failedCount = rows.filter(r => r.status === 'failed').length;
    const progressPct = rows.length > 0 ? Math.round(((doneCount + failedCount) / rows.length) * 100) : 0;

    return (
        <div>
            <Toast toast={toast} />

            {prefill && (
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: theme.accentDim, border: `1px solid ${theme.accent}44`, fontSize: '12px', color: theme.accent, fontWeight: 600 }}>
                     Prefilled from View tab - {prefill.subject} . Sem {prefill.sem} . {prefill.rollNos?.length} roll numbers loaded
                </div>
            )}

            <FilterBlock
                dept={dept} setDept={handleSetDept}
                sem={sem} setSem={setSem}
                subject={subject} setSubject={setSubject}
                subjectCode={subjectCode} setSubjectCode={setSubjectCode}
                setSubjectId={setSubjectId}
                departments={departments} deptLoading={deptLoading} deptError={deptError}
                prefillSem={prefillSem}
                prefillSubject={prefillSubject}
            />

            {!dept ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '14px' }}>
                    Select a department to continue.
                </div>
            ) : (
                <>
                    {/* Roll number input */}
                    <div style={{ ...styles.card, marginBottom: 20, borderLeft: `3px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Roll Numbers</span>
                            {rollNos.length > 0 && (
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: 99, background: theme.accentDim, color: theme.accent }}>{rollNos.length}</span>
                            )}
                            <div style={{ flex: 1 }} />
                            <label style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                                background: theme.accentDim, color: theme.accent,
                                border: `1px solid ${theme.accent}44`, fontSize: '12px', fontWeight: 600,
                            }}>
                                Upload .xlsx
                                <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv"
                                    style={{ display: 'none' }} onChange={handleXlsxUpload} disabled={running} />
                            </label>
                        </div>
                        <textarea
                            value={rollInput}
                            onChange={e => setRollInput(e.target.value)}
                            disabled={running}
                            placeholder="Enter roll numbers - separated by newlines, commas, or spaces"
                            style={{ ...styles.input, height: 160, resize: 'vertical', fontFamily: theme.fontMono, fontSize: '13px' }}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: theme.textMuted }}>
                            {rollNos.length} roll number{rollNos.length !== 1 ? 's' : ''} detected
                        </div>
                    </div>

                    {/* Generate / Update button */}
                    <div style={{ marginBottom: 28 }}>
                        <button
                            onClick={startGeneration}
                            disabled={!canGenerate}
                            style={{
                                width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
                                background: canGenerate ? theme.accent : theme.border,
                                color: canGenerate ? '#fff' : theme.textMuted,
                                fontSize: '14px', fontWeight: 700, cursor: canGenerate ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s', letterSpacing: '0.02em',
                            }}>
                            {running
                                ? (isUpdateMode ? `Updating... (${progressPct}%)` : `Generating... (${progressPct}%)`)
                                : (isUpdateMode ? 'Update Embedding' : 'Generate Embeddings')}
                        </button>
                        {!subject.trim() && !running && dept && (
                            <div style={{ textAlign: 'center', marginTop: 8, fontSize: '12px', color: theme.textMuted }}>
                                {isUpdateMode ? 'Waiting for subject to load...' : 'Select a subject first'}
                            </div>
                        )}
                        {running && (
                            <div style={{ marginTop: 10 }}>
                                <div style={{ height: 4, borderRadius: 2, background: theme.border, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${progressPct}%`, background: theme.accent, transition: 'width 0.3s' }} />
                                </div>
                                <div style={{ marginTop: 6, textAlign: 'center', fontSize: '12px', color: theme.textMuted }}>
                                    Processing {rollNos.length} students for <strong style={{ color: theme.text }}>{subject}</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {summary && (
                        <div style={{ ...styles.card, marginBottom: 20, borderLeft: `3px solid ${theme.success}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Generation Summary</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: 99, background: theme.successDim, color: theme.success }}>Done</span>
                            </div>
                            <div className="emb-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                                {[
                                    { label: 'Department',  value: summary.dept,    color: theme.text },
                                    { label: 'Subject',     value: summary.subject, color: theme.text },
                                    { label: 'Succeeded',   value: summary.success, color: theme.success },
                                    { label: 'Failed',      value: summary.failed,  color: summary.failed > 0 ? theme.danger : theme.textMuted },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ padding: '12px 14px', borderRadius: 7, background: theme.bg, border: `1px solid ${theme.border}` }}>
                                        <div style={{ fontSize: '10px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                            {summary.embeddingFile && (
                                <div style={{ padding: '8px 12px', borderRadius: 6, background: theme.bg, border: `1px solid ${theme.border}`, fontSize: '12px', color: theme.textMuted }}>
                                    Saved to: <span style={{ fontFamily: theme.fontMono, color: theme.accent }}>{summary.embeddingFile}</span>
                                </div>
                            )}
                            {summary.missedRollNos.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <div style={{ fontSize: '11px', fontWeight: 700, color: theme.danger, marginBottom: 6 }}>Missing Ground Truth ({summary.missedRollNos.length})</div>
                                    <RollChips rolls={summary.missedRollNos.map(m => m.rollNo || m)} color={theme.danger} bg={theme.dangerDim} border={`${theme.danger}44`} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Per-student progress */}
                    {rows.length > 0 && (
                        <div style={{ ...styles.card, marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Student Progress</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, padding: '1px 8px', borderRadius: 99, background: theme.accentDim, color: theme.accent }}>{doneCount + failedCount}/{rows.length}</span>
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
                                                    {row.photosUsed != null ? `${row.photosUsed} photos` : '-'}
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
        </div>
    );
}

// ===============================================================================
// TAB 2 - View Generated Embeddings
// ===============================================================================
function ViewTab({ departments, deptLoading, deptError, onUpdate }) {
    const [dept,         setDept]         = useState('');
    const [pklFiles,     setPklFiles]     = useState([]);
    const [history,      setHistory]      = useState([]);
    const [pklLoading,   setPklLoading]   = useState(false);
    const [expandedRow,  setExpandedRow]  = useState(null);
    const [deletingFile,  setDeletingFile]  = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // file object awaiting confirmation
    const [toast,         setToast]         = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadPklFiles = useCallback(async (d) => {
        if (!d) return;
        setPklLoading(true);
        try {
            const [filesData, histData] = await Promise.all([
                fetch(`${EMB_BASE}/list-files-by-dept?dept=${encodeURIComponent(d)}`).then(r => r.json()),
                fetch(`${EMB_BASE}/history-by-dept?dept=${encodeURIComponent(d)}`).then(r => r.json()).catch(() => ({ records: [] })),
            ]);
            const files   = filesData.files  || [];
            const hist    = histData.records || [];
            setHistory(hist);

            const enriched = files.map(f => {
                const match = hist.find(h => h.embeddingFile === f.filename);
                return {
                    ...f,
                    rollNos:       f.rollNos?.length       > 0 ? f.rollNos       : (match?.rollNos       || []),
                    missedRollNos: f.missedRollNos?.length > 0 ? f.missedRollNos : (match?.missedRollNos || []),
                    lastUpdatedAt: match?.lastUpdatedAt || match?.generatedAt || f.generatedAt || null,
                };
            });

            // Sort: incomplete (missing > 0) first, then by sem ascending
            enriched.sort((a, b) => {
                const aMissing = (a.missedRollNos || []).length > 0;
                const bMissing = (b.missedRollNos || []).length > 0;
                if (aMissing !== bMissing) return aMissing ? -1 : 1;
                return (parseInt(String(a.sem)) || 0) - (parseInt(String(b.sem)) || 0);
            });

            setPklFiles(enriched);
        } catch (_) {
            setPklFiles([]);
            showToast('Failed to load embedding files', 'error');
        }
        setPklLoading(false);
    }, []);

    useEffect(() => {
        setPklFiles([]); setHistory([]); setExpandedRow(null);
        if (dept) loadPklFiles(dept);
    }, [dept]);

    const handleUpdate = (file) => {
        const missedSet    = new Set((file.missedRollNos || []).map(m => m.rollNo || m));
        const presentRolls = (file.rollNos || []).filter(r => !missedSet.has(r));
        const missedRolls  = (file.missedRollNos || []).map(m => m.rollNo || m);
        onUpdate({
            dept,
            sem:     file.sem     || '',
            subject: file.subject || '',
            rollNos: [...presentRolls, ...missedRolls].length > 0
                ? [...presentRolls, ...missedRolls]
                : (file.rollNos || []),
        });
    };

    const handleDelete = async (file) => {
        setDeletingFile(file.filename);
        try {
            const res  = await fetch(`${EMB_BASE}/file`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: file.filename, relPath: file.relPath }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted embedding for ${file.subject || file.filename}`);
            setPklFiles(prev => prev.filter(f => f.filename !== file.filename));
            setHistory(prev => prev.filter(h => h.embeddingFile !== file.filename));
        } catch (err) {
            showToast(err.message, 'error');
        }
        setDeletingFile(null);
    };

    // Trash SVG icon
    const TrashIcon = () => (
        <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
            <path d="M1 3h10M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5 6v4M7 6v4M2 3l.8 8a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    );

    return (
        <div>
            <Toast toast={toast} />

            {/* Delete confirmation modal */}
            {deleteConfirm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.55)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: theme.surface, borderRadius: 12, padding: '28px 28px 24px',
                        maxWidth: 420, width: '90%', border: `1px solid ${theme.border}`,
                        boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
                    }}>
                        {/* Warning icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                background: theme.dangerDim, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 2L18.5 17H1.5L10 2z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round"/>
                                    <line x1="10" y1="8" x2="10" y2="12.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
                                    <circle cx="10" cy="14.5" r="0.8" fill="#ef4444"/>
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: 700, color: theme.text }}>Delete Embedding?</div>
                                <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 2 }}>This action cannot be undone</div>
                            </div>
                        </div>

                        {/* Target info */}
                        <div style={{
                            padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                            background: theme.bg, border: `1px solid ${theme.border}`,
                        }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>{deleteConfirm.subject || deleteConfirm.filename}</div>
                            <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: 3 }}>Semester {deleteConfirm.sem || '-'} . {dept.replace(/_/g, ' ')}</div>
                        </div>

                        {/* Warning text */}
                        <div style={{ fontSize: '12px', color: theme.danger, lineHeight: 1.6, marginBottom: 20 }}>
                            The <strong>.pkl file will be permanently deleted from disk</strong> and all associated DB records will be removed. Students will not be recognized for this subject until the embedding is regenerated.
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                style={{
                                    flex: 1, padding: '9px 0', borderRadius: 7,
                                    border: `1px solid ${theme.border}`, background: 'transparent',
                                    color: theme.textMuted, fontSize: '13px', fontWeight: 600,
                                    cursor: 'pointer', fontFamily: theme.fontBody,
                                }}>
                                Cancel
                            </button>
                            <button
                                onClick={() => { handleDelete(deleteConfirm); setDeleteConfirm(null); }}
                                style={{
                                    flex: 1, padding: '9px 0', borderRadius: 7,
                                    border: 'none', background: theme.danger,
                                    color: '#fff', fontSize: '13px', fontWeight: 700,
                                    cursor: 'pointer', fontFamily: theme.fontBody,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                }}>
                                <svg width="13" height="14" viewBox="0 0 12 13" fill="none">
                                    <path d="M1 3h10M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M5 6v4M7 6v4M2 3l.8 8a1 1 0 0 0 1 .9h4.4a1 1 0 0 0 1-.9L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dept selector */}
            <div style={{ ...styles.card, marginBottom: 20, padding: '18px 24px', borderLeft: `3px solid ${theme.accent}` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Filter</div>
                <div style={{ maxWidth: 320 }}>
                    <label style={styles.label}>Department</label>
                    <select value={dept} onChange={e => setDept(e.target.value)} style={styles.select} disabled={deptLoading}>
                        <option value="">{deptLoading ? 'Loading...' : deptError ? 'Error' : 'Select department...'}</option>
                        {departments.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                    </select>
                </div>
            </div>

            {!dept ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '14px' }}>
                    Select a department to view embeddings.
                </div>
            ) : pklLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '14px' }}>
                    Loading embedding files...
                </div>
            ) : pklFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: theme.textMuted, fontSize: '14px', border: `1px dashed ${theme.border}`, borderRadius: 10 }}>
                    No embedding files found for this department.
                </div>
            ) : (
                <>
                    <div style={styles.card}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: theme.text }}>Embedding Files</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: 99, background: theme.accentDim, color: theme.accent }}>{pklFiles.length}</span>
                            <div style={{ flex: 1 }} />
                            <button onClick={() => loadPklFiles(dept)} style={{ ...styles.btnGhost, padding: '5px 12px', fontSize: '11px' }}>
                                 Refresh
                            </button>
                        </div>

                        {/* Grouped by semester */}
                        {(() => {
                            // Build sem ' files map, sort within each group: incomplete first
                            const grouped = {};
                            pklFiles.forEach(f => {
                                const key = f.sem || '?';
                                if (!grouped[key]) grouped[key] = [];
                                grouped[key].push(f);
                            });
                            const semKeys = Object.keys(grouped).sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0));

                            return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    {semKeys.map(sem => (
                                        <div key={sem}>
                                            {/* Semester header */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
                                            }}>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700, color: theme.accent,
                                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                                    padding: '3px 10px', borderRadius: 6,
                                                    background: theme.accentDim, border: `1px solid ${theme.accent}33`,
                                                }}>
                                                    Semester {sem}
                                                </span>
                                                <div style={{ flex: 1, height: 1, background: theme.border }} />
                                                <span style={{ fontSize: '11px', color: theme.textMuted }}>{grouped[sem].length} subject{grouped[sem].length !== 1 ? 's' : ''}</span>
                                            </div>

                                            {/* Files for this semester */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {grouped[sem].map(file => {
                                                    const missedSet    = new Set((file.missedRollNos || []).map(m => m.rollNo || m));
                                                    const presentRolls = (file.rollNos || []).filter(r => !missedSet.has(r));
                                                    const missedRolls  = (file.missedRollNos || []).map(m => m.rollNo || m);
                                                    const isExpanded   = expandedRow === file.filename;
                                                    const isDeleting   = deletingFile === file.filename;
                                                    const health       = missedRolls.length === 0 ? 'good' : presentRolls.length === 0 ? 'bad' : 'partial';
                                                    const healthColor  = health === 'good' ? theme.success : health === 'bad' ? theme.danger : theme.warning;

                                                    return (
                                                        <div key={file.filename} style={{
                                                            borderRadius: 9,
                                                            border: `1px solid ${theme.border}`,
                                                            overflow: 'hidden',
                                                            background: theme.surface,
                                                            opacity: isDeleting ? 0.5 : 1,
                                                            transition: 'opacity 0.2s',
                                                        }}>
                                                            <div className="emb-card-row" style={{ display: 'flex', alignItems: 'stretch', minHeight: 60 }}>

                                                                {/* Health bar */}
                                                                <div style={{ width: 4, background: healthColor, flexShrink: 0 }} />

                                                                {/* Subject - narrower fixed width */}
                                                                <div style={{ width: 160, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.subject}>
                                                                        {file.subject || <span style={{ color: theme.textMuted, fontStyle: 'italic' }}>Unknown</span>}
                                                                    </div>
                                                                </div>

                                                                {/* Stat: Embedded */}
                                                                <div style={{ width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderLeft: `1px solid ${theme.border}` }}>
                                                                    <div style={{ fontSize: '19px', fontWeight: 700, color: theme.success, lineHeight: 1 }}>{presentRolls.length}</div>
                                                                    <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: 2 }}>Embedded</div>
                                                                </div>

                                                                {/* Stat: Missing */}
                                                                <div style={{ width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderLeft: `1px solid ${theme.border}` }}>
                                                                    <div style={{ fontSize: '19px', fontWeight: 700, color: missedRolls.length > 0 ? theme.danger : theme.success, lineHeight: 1 }}>
                                                                        {missedRolls.length}
                                                                    </div>
                                                                    <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: 2 }}>Missing</div>
                                                                </div>

                                                                {/* Stat: Total */}
                                                                <div style={{ width: 68, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderLeft: `1px solid ${theme.border}` }}>
                                                                    <div style={{ fontSize: '19px', fontWeight: 700, color: theme.text, lineHeight: 1 }}>{(file.rollNos || []).length}</div>
                                                                    <div style={{ fontSize: '10px', color: theme.textMuted, marginTop: 2 }}>Total</div>
                                                                </div>

                                                                {/* Last updated */}
                                                                <div style={{ width: 130, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 14px', borderLeft: `1px solid ${theme.border}` }}>
                                                                    <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Updated</div>
                                                                    {file.lastUpdatedAt ? (
                                                                        <>
                                                                            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.text }}>
                                                                                {new Date(file.lastUpdatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                            </div>
                                                                            <div style={{ fontSize: '10px', color: theme.textMuted }}>
                                                                                {new Date(file.lastUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                            </div>
                                                                        </>
                                                                    ) : (
                                                                        <div style={{ fontSize: '12px', color: theme.textMuted }}>-</div>
                                                                    )}
                                                                </div>

                                                                {/* Actions - wider */}
                                                                <div style={{ flex: 1, minWidth: 250, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderLeft: `1px solid ${theme.border}` }}>
                                                                    {/* Update */}
                                                                    <button
                                                                        onClick={() => handleUpdate(file)}
                                                                        disabled={isDeleting}
                                                                        style={{
                                                                            flex: 1, padding: '7px 0', borderRadius: 6,
                                                                            border: 'none', background: theme.accent, color: '#fff',
                                                                            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                                                            fontFamily: theme.fontBody, boxShadow: `0 1px 4px ${theme.accent}44`,
                                                                        }}>
                                                                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                                                            <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                                                                            <polyline points="8,1 11,3.5 8,6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                                                        </svg>
                                                                        Update
                                                                    </button>

                                                                    {/* View Roll Nos - colored */}
                                                                    <button
                                                                        onClick={() => setExpandedRow(isExpanded ? null : file.filename)}
                                                                        disabled={isDeleting}
                                                                        style={{
                                                                            flex: 1, padding: '7px 8px', borderRadius: 6, whiteSpace: 'nowrap',
                                                                            border: `1px solid ${isExpanded ? theme.accent : theme.accent + '55'}`,
                                                                            background: isExpanded ? theme.accent : theme.accentDim,
                                                                            color: isExpanded ? '#fff' : theme.accent,
                                                                            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                                                                            fontFamily: theme.fontBody,
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                                                        }}>
                                                                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                                                                            <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                                                                            <path d="M1.5 8C3 4.5 5 3 8 3s5 1.5 6.5 5C13 12.5 11 14 8 14s-5-1.5-6.5-5z" stroke="currentColor" strokeWidth="1.5"/>
                                                                        </svg>
                                                                        {isExpanded ? 'Hide Rolls' : 'View Rolls'}
                                                                    </button>

                                                                    {/* Delete */}
                                                                    <button
                                                                        onClick={() => setDeleteConfirm(file)}
                                                                        disabled={isDeleting}
                                                                        title="Delete embedding file"
                                                                        style={{
                                                                            width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                                                                            border: '1px solid #f87171',
                                                                            background: '#fff', color: '#f87171',
                                                                            cursor: isDeleting ? 'wait' : 'pointer',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontFamily: theme.fontBody,
                                                                        }}>
                                                                        {isDeleting ? '...' : <TrashIcon />}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Expanded roll chips */}
                                                            {isExpanded && (
                                                                <div style={{ borderTop: `1px solid ${theme.border}`, background: theme.bg, padding: '14px 20px' }}>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                                                        <div>
                                                                            <div style={{ fontSize: '11px', fontWeight: 700, color: theme.success, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                                                Embedded ({presentRolls.length})
                                                                            </div>
                                                                            {presentRolls.length === 0
                                                                                ? <span style={{ fontSize: '12px', color: theme.textMuted }}>None recorded</span>
                                                                                : <RollChips rolls={presentRolls} color={theme.success} bg={theme.successDim} border={`${theme.success}44`} />}
                                                                        </div>
                                                                        <div>
                                                                            <div style={{ fontSize: '11px', fontWeight: 700, color: theme.danger, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                                                Missing Ground Truth ({missedRolls.length})
                                                                            </div>
                                                                            {missedRolls.length === 0
                                                                                ? <span style={{ fontSize: '12px', color: theme.success }}>All present</span>
                                                                                : <RollChips rolls={missedRolls} color={theme.danger} bg={theme.dangerDim} border={`${theme.danger}44`} />}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {/* History log - one line per generation */}
                    {history.length > 0 && (
                        <div style={{ ...styles.card, marginTop: 20 }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text, marginBottom: 12 }}>Generation History</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {history.map((rec, idx) => {
                                    const dt      = new Date(rec.lastUpdatedAt || rec.generatedAt);
                                    const missed  = (rec.missedRollNos || []).length;
                                    const success = rec.studentsSuccess ?? (rec.rollNos || []).length - missed;
                                    return (
                                        <div key={rec._id} style={{
                                            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                                            padding: '7px 10px', borderRadius: 6,
                                            background: idx % 2 === 0 ? 'transparent' : theme.bg + '66',
                                            fontSize: '12px',
                                        }}>
                                            <span style={{ fontFamily: theme.fontMono, fontSize: '11px', color: theme.textMuted, whiteSpace: 'nowrap' }}>
                                                {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span style={{ color: theme.border }}>.</span>
                                            <span style={{ fontWeight: 600, color: theme.text }}>{rec.subject || '-'}</span>
                                            <span style={{ color: theme.textMuted }}>Sem {rec.sem || '-'}</span>
                                            <span style={{ color: theme.border }}>.</span>
                                            <span style={{ color: theme.success, fontWeight: 600 }}>{success} embedded</span>
                                            {missed > 0 && (
                                                <span style={{ color: theme.danger, fontWeight: 600 }}>{missed} missing</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Main export
// ===============================================================================
export default function EmbeddingGeneration() {
    const { departments, deptLoading, deptError } = useDepartments();
    const [activeTab, setActiveTab] = useState(1);
    const [prefill,   setPrefill]   = useState(null);

    const handleUpdate = useCallback((data) => {
        setPrefill(data);
        setActiveTab(1);
    }, []);

    return (
        <div style={styles.page}>
            <style>{cssReset}{`
                @media (max-width: 700px) {
                    .r-grid-3 { grid-template-columns: 1fr !important; }
                    .emb-summary-grid { grid-template-columns: 1fr 1fr !important; }
                    .emb-card-row { flex-direction: column !important; }
                    .emb-card-row > div[style*="width:"] { width: 100% !important; }
                }
            `}</style>

            <div style={{ marginBottom: 20 }}>
                <div style={styles.heading}>Embedding Generation</div>
                <div style={{ ...styles.subheading, marginBottom: 0 }}>Manage face embeddings for attendance recognition</div>
            </div>

            <div className="ams-tabs">
                <button className={`ams-tab${activeTab === 1 ? ' active' : ''}`} onClick={() => setActiveTab(1)}>Generate</button>
                <button className={`ams-tab${activeTab === 2 ? ' active' : ''}`} onClick={() => setActiveTab(2)}>View Embeddings</button>
            </div>

            {activeTab === 1 && (
                <GenerateTab
                    departments={departments} deptLoading={deptLoading} deptError={deptError}
                    prefill={prefill}
                    onPrefillConsumed={() => setPrefill(null)}
                />
            )}
            {activeTab === 2 && (
                <ViewTab
                    departments={departments} deptLoading={deptLoading} deptError={deptError}
                    onUpdate={handleUpdate}
                />
            )}
        </div>
    );
}
