// client/src/attendancemodule/rollassign.jsx
// Assign roll numbers to person_XXX clusters
// Mode A: Auto-match against ERP photos
// Mode B: Manual assignment — type roll number directly on each card

import { useState, useEffect, useCallback } from 'react';
import getEnvironment from '../getenvironment';
import { DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';

const apiUrl  = getEnvironment();
const RA_BASE = `${apiUrl}/attendancemodule/roll-assign`;
const GT_BASE = `${apiUrl}/attendancemodule/ground-truth`;

const HIGH   = 0.62;
const MEDIUM = 0.45;

function confidenceColor(score) {
    if (score >= HIGH)   return theme.success;
    if (score >= MEDIUM) return theme.warning;
    return theme.danger || '#f87171';
}
function confidenceLabel(score) {
    if (score >= HIGH)   return 'High';
    if (score >= MEDIUM) return 'Medium';
    return 'Low';
}

export default function RollAssign() {
    // ── All useState hooks at the TOP of the component ──────────────
    const [degree,       setDegree]       = useState('BTECH');
    const [department,   setDepartment]   = useState('');
    const [year,         setYear]         = useState('');
    const [mode,         setMode]         = useState('manual');

<<<<<<< HEAD
    // Departments fetched live from DB — ensures folder names match timetable
    const { departments, deptLoading, deptError } = useDepartments();

    const [loading,      setLoading]      = useState(false);
    const [matching,     setMatching]     = useState(false);
    const [matchProgress,setMatchProgress]= useState(null);
    const [matchDone,    setMatchDone]    = useState(false);
    const [saving,       setSaving]       = useState(null);
    const [toast,        setToast]        = useState(null);
=======
    const [loading,       setLoading]       = useState(false);
    const [matching,      setMatching]      = useState(false);
    const [matchProgress, setMatchProgress] = useState(null);  // { msg, done, total, step }
    const [saving,        setSaving]        = useState(null);
    const [toast,         setToast]         = useState(null);

    // unprocessed = person_XXX on filesystem with no DB record yet (never matched)
    const [unprocessed, setUnprocessed] = useState([]);
    // pendingReview = DB matched records awaiting operator approval
    const [pendingReview, setPendingReview] = useState([]);
    // approvedItems = DB approved records
    const [approvedItems, setApprovedItems] = useState([]);
    // unmatchedItems = DB records where no face was detected
    const [unmatchedItems, setUnmatchedItems] = useState([]);
    // flaggedItems = DB flagged records
    const [flaggedItems, setFlaggedItems] = useState([]);

    const [matchError, setMatchError] = useState(null);
>>>>>>> main

    const [unassigned,   setUnassigned]   = useState([]);
    const [assigned,     setAssigned]     = useState([]);
    const [matches,      setMatches]      = useState({});
    const [matchError,   setMatchError]   = useState(null);

    const [inlineRolls,  setInlineRolls]  = useState({});

    const [modal,        setModal]        = useState(null);
    const [overrideRoll, setOverrideRoll] = useState('');

    const [gtModal,      setGtModal]      = useState(null);
    const [gtData,       setGtData]       = useState(null);
    const [gtLoading,    setGtLoading]    = useState(false);
    const [gtSelected,   setGtSelected]   = useState(new Set());
    const [gtSaving,     setGtSaving]     = useState(false);

    const [bulkText,     setBulkText]     = useState('');
    const [bulkOpen,     setBulkOpen]     = useState(false);
    const [bulkSaving,   setBulkSaving]   = useState(false);

    const [approvingAll, setApprovingAll] = useState(false);

    // ── Derived values ───────────────────────────────────────────────
    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const highConfCount = matchDone
        ? unassigned.filter(u => !u.flagged && matches[u.folderName]?.best?.confidence >= HIGH).length
        : 0;

    // ── Helpers ──────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const photoUrl    = (batch, folder, filename) =>
        `${RA_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    const erpPhotoUrl = (filename) =>
        `${RA_BASE}/erp-photo/${encodeURIComponent(filename)}`;

<<<<<<< HEAD
    // ── Load clusters ────────────────────────────────────────────────
    const loadClusters = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setUnassigned([]); setAssigned([]);
        setMatches({}); setMatchError(null);
        setMatchDone(false); setInlineRolls({});
=======
    // ── Load clusters from DB + unprocessed from filesystem ────────
    const loadClusters = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setMatchError(null);
>>>>>>> main
        try {
            const [clusterRes, matchRes] = await Promise.all([
                fetch(`${RA_BASE}/clusters/${batchName}`),     // filesystem: person_XXX not in DB
                fetch(`${RA_BASE}/matches/${batchName}`),       // DB records
            ]);

            // Unprocessed filesystem clusters (never matched)
            const clusterData = clusterRes.ok ? await clusterRes.json() : { unprocessed: [] };
            setUnprocessed(clusterData.unprocessed || []);

            // DB records → split by status
            if (matchRes.ok) {
                const { matchMap = {} } = await matchRes.json();

                const records = Object.values(matchMap);
                setPendingReview(records.filter(r => r.status === 'matched' && !r.approved));
                setApprovedItems(records.filter(r => r.approved));
                setUnmatchedItems(records.filter(r => r.status === 'unmatched'));
                setFlaggedItems(records.filter(r => r.status === 'flagged'));
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [batchName]);

<<<<<<< HEAD
    useEffect(() => { loadClusters(); }, [loadClusters]);

    // ── Inline roll input ────────────────────────────────────────────
    const setInlineRoll = (folderName, value) =>
        setInlineRolls(prev => ({ ...prev, [folderName]: value.toUpperCase() }));
=======
    // ── Auto-match against ERP photos (SSE) → then auto-assign all ─
    const runAutoMatch = useCallback(async () => {
        if (!batchName) return;
        setMatching(true);
        setMatchError(null);
        setMatchProgress({ msg: 'Starting…', done: 0, total: 0, step: 'init' });

        const localMatches  = {};  // accumulate results synchronously during SSE
        let   sseSucceeded  = false;

        try {
            // ── Phase 1: SSE matching ─────────────────────────────
            const res = await fetch(`${RA_BASE}/auto-match/${batchName}`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Match failed');
            }

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let   buf     = '';

            const processLine = (line) => {
                if (!line.startsWith('data:')) return;
                let evt;
                try { evt = JSON.parse(line.slice(5).trim()); }
                catch { return; }
                if (evt.type === 'erp_progress') {
                    setMatchProgress({ msg: evt.msg, done: evt.done, total: evt.total, step: 'erp' });
                } else if (evt.type === 'cluster_progress') {
                    setMatchProgress({ msg: evt.msg, done: evt.done, total: evt.total, step: 'cluster', current: evt.current });
                } else if (evt.type === 'status') {
                    setMatchProgress(p => ({ ...p, msg: evt.msg, step: evt.step }));
                } else if (evt.type === 'match_result') {
                    localMatches[evt.folder] = evt.match;
                } else if (evt.type === 'done') {
                    sseSucceeded = true;
                } else if (evt.type === 'error') {
                    throw new Error(evt.msg);
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) { buf += decoder.decode(); buf.split('\n').forEach(processLine); break; }
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop();
                lines.forEach(processLine);
            }

            // ── Phase 2: Auto-assign all (rename folders + save DB) ──
            if (sseSucceeded && Object.keys(localMatches).length > 0) {
                setMatchProgress({ msg: 'Renaming folders and saving to database…', done: 0, total: 0, step: 'saving' });

                const assignRes  = await fetch(`${RA_BASE}/auto-assign-all`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ batch: batchName, matches: localMatches }),
                });
                const assignData = await assignRes.json();
                if (!assignRes.ok) throw new Error(assignData.error || 'Auto-assign failed');

                showToast(
                    `✓ ${assignData.renamed} clusters auto-assigned` +
                    (assignData.unmatched  ? `, ${assignData.unmatched} unmatched`  : '') +
                    (assignData.conflicts  ? `, ${assignData.conflicts} conflicts`  : '')
                );

                // Reload from DB so UI reflects renamed folders
                await loadClusters();
            }
        } catch (err) {
            setMatchError(err.message);
            showToast(err.message, 'error');
        } finally {
            setMatching(false);
            setMatchProgress(null);
        }
    }, [batchName, loadClusters]);

    useEffect(() => { loadClusters(); }, [loadClusters]);

    // ── Open modal — works for pendingReview and flaggedItems (DB records) ──
    const openModal = (item) => {
        if (matching) return;
        // item IS the DB record; pass it as both item and match
        setModal({ item, match: item });
        setOverrideRoll(item.rollNo || '');
    };
>>>>>>> main

    // ── Assign single (manual) ───────────────────────────────────────
    const assignManual = async (folderName) => {
        const rollNo = (inlineRolls[folderName] || '').trim().toUpperCase();
        if (!rollNo) { showToast('Enter a roll number', 'error'); return; }
        setSaving(folderName);
        try {
<<<<<<< HEAD
            const res  = await fetch(`${RA_BASE}/assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, folderName, rollNo }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            const item = unassigned.find(u => u.folderName === folderName);
            setUnassigned(prev => prev.filter(u => u.folderName !== folderName));
            if (item) setAssigned(prev => [...prev, { ...item, folderName: data.rollNo, rollNo: data.rollNo }]);
            setInlineRolls(prev => { const n = { ...prev }; delete n[folderName]; return n; });
            showToast(`Assigned ${folderName} to ${data.rollNo}`);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
=======
            const res  = await fetch(`${RA_BASE}/approve`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ batch: batchName, folderName, rollNo: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            // Move from pendingReview → approvedItems
            setPendingReview(prev => prev.filter(r => r.folderName !== folderName));
            setFlaggedItems(prev => prev.filter(r => r.folderName !== folderName));
            setApprovedItems(prev => {
                const found = [...pendingReview, ...flaggedItems].find(r => r.folderName === folderName);
                return found ? [...prev, { ...found, rollNo: data.rollNo, approved: true, status: 'approved' }] : prev;
            });
            setModal(null);
            showToast(`✓ Approved ${folderName} → ${data.rollNo}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
>>>>>>> main
    };

    // ── Bulk assign from textarea ────────────────────────────────────
    const handleBulkAssign = async () => {
        if (!batchName || !bulkText.trim()) return;
        setBulkSaving(true);
        const lines = bulkText.trim().split('\n');
        const assignments = [];
        for (const line of lines) {
            const parts = line.trim().split(/[\s,>]+/).filter(Boolean);
            if (parts.length >= 2) {
                assignments.push({ folderName: parts[0].trim(), rollNo: parts[1].trim().toUpperCase() });
            }
        }
        if (assignments.length === 0) {
            showToast('No valid lines. Format: person_001 26TT1234', 'error');
            setBulkSaving(false); return;
        }
        try {
            const res  = await fetch(`${RA_BASE}/bulk-assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, assignments }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Bulk assign failed');
            showToast(`Assigned ${data.assigned} of ${data.total} folders`);
            setBulkText(''); setBulkOpen(false);
            await loadClusters();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setBulkSaving(false); }
    };

    // ── ERP Auto-match ───────────────────────────────────────────────
    const runAutoMatch = useCallback(async () => {
        if (!batchName) return;
        setMatching(true); setMatchError(null);
        setMatchProgress({ msg: 'Starting...', done: 0, total: 0, step: 'init' });
        try {
            const res = await fetch(`${RA_BASE}/auto-match/${batchName}`, { method: 'POST' });
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Match failed'); }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';
            const processLine = (line) => {
                if (!line.startsWith('data:')) return;
                let evt; try { evt = JSON.parse(line.slice(5).trim()); } catch { return; }
                if (evt.type === 'erp_progress')          setMatchProgress({ msg: evt.msg, done: evt.done, total: evt.total, step: 'erp' });
                else if (evt.type === 'cluster_progress') setMatchProgress({ msg: evt.msg, done: evt.done, total: evt.total, step: 'cluster', current: evt.current });
                else if (evt.type === 'status')           setMatchProgress(p => ({ ...p, msg: evt.msg, step: evt.step }));
                else if (evt.type === 'match_result')     setMatches(prev => ({ ...prev, [evt.folder]: evt.match }));
                else if (evt.type === 'done')             { setMatchDone(true); showToast(`Matching complete — ${evt.clusters} clusters`); }
                else if (evt.type === 'error')            throw new Error(evt.msg);
            };
            while (true) {
                const { done, value } = await reader.read();
                if (done) { buf += decoder.decode(); buf.split('\n').forEach(processLine); break; }
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n'); buf = lines.pop(); lines.forEach(processLine);
            }
        } catch (err) { setMatchError(err.message); showToast(err.message, 'error'); }
        finally { setMatching(false); setMatchProgress(null); }
    }, [batchName]);

    // ── Approve ALL high-confidence matches at once ──────────────────
    const approveAllHigh = async () => {
        if (!matchDone) { showToast('Run ERP match first', 'error'); return; }

        const candidates = unassigned
            .filter(u => !u.flagged && matches[u.folderName]?.best?.confidence >= HIGH)
            .map(u => ({ folderName: u.folderName, match: matches[u.folderName] }));

        const seen = new Map();
        for (const c of candidates) {
            const roll = c.match.best.rollNo;
            const prev = seen.get(roll);
            if (!prev || c.match.best.confidence > prev.match.best.confidence) seen.set(roll, c);
        }
        const toApprove = [...seen.values()];

        if (toApprove.length === 0) { showToast('No high-confidence matches found', 'error'); return; }

        const lines = toApprove
            .map(c => `${c.folderName} -> ${c.match.best.rollNo} (${(c.match.best.confidence * 100).toFixed(0)}%)`)
            .join('\n');

        if (!window.confirm(`Approve all ${toApprove.length} high-confidence matches?\n\n${lines}`)) return;

        setApprovingAll(true);
        try {
            const res = await fetch(`${RA_BASE}/bulk-assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: batchName,
                    assignments: toApprove.map(c => ({ folderName: c.folderName, rollNo: c.match.best.rollNo })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Auto-assigned ${data.assigned} high-confidence clusters`);
            await loadClusters();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setApprovingAll(false); }
    };

    // ── ERP modal approve ────────────────────────────────────────────
    const handleApprove = async (folderName, rollNo) => {
        const trimmed = rollNo.trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number', 'error'); return; }
        setSaving(folderName);
        try {
            const res  = await fetch(`${RA_BASE}/assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, folderName, rollNo: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            const item = unassigned.find(u => u.folderName === folderName);
            setUnassigned(prev => prev.filter(u => u.folderName !== folderName));
            if (item) setAssigned(prev => [...prev, { ...item, folderName: data.rollNo, rollNo: data.rollNo }]);
            setModal(null);
            showToast(`Assigned ${folderName} to ${data.rollNo}`);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    // ── Flag ─────────────────────────────────────────────────────────
    const handleFlag = async (folderName, match) => {
        setSaving(folderName);
        try {
            const res = await fetch(`${RA_BASE}/flag`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: batchName, folderName,
                    suggestedRollNo: match?.best?.rollNo || null,
                    confidence: match?.best?.confidence || null,
                    reason: 'operator_rejected',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setUnassigned(prev => prev.map(u => u.folderName === folderName ? { ...u, flagged: true } : u));
            setModal(null);
            showToast(`Flagged ${folderName}`);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    // ── GT modal ─────────────────────────────────────────────────────
    const openGtModal = useCallback(async (rollNo) => {
        setGtModal({ rollNo }); setGtData(null); setGtSelected(new Set()); setGtLoading(true);
        try {
            const res  = await fetch(`${RA_BASE}/student-ground-truth/${batchName}/${rollNo}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            const fixUrls = (list) => (list || []).map(f => ({
                ...f,
                url: `${RA_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(rollNo)}/${encodeURIComponent(f.filename)}`,
            }));
            setGtData({
                ...data,
                embeddingFiles: fixUrls(data.embeddingFiles),
                backupFiles:    fixUrls(data.backupFiles),
                untrackedFiles: fixUrls(data.untrackedFiles),
            });
            setGtSelected(new Set((data.embeddingFiles || []).map(f => f.filename)));
        } catch (err) { showToast(err.message, 'error'); setGtModal(null); }
        finally { setGtLoading(false); }
    }, [batchName]);

    const handleUpdateEmbedding = useCallback(async () => {
        if (!gtModal || gtSelected.size === 0) return;
        setGtSaving(true);
        try {
            const res = await fetch(`${GT_BASE}/update-embedding`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, rollNo: gtModal.rollNo, embeddingFiles: [...gtSelected] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Embedding updated for ${gtModal.rollNo}`);
            setGtModal(null);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setGtSaving(false); }
    }, [gtModal, gtSelected, batchName]);

    // ── Generate embeddings ──────────────────────────────────────────
    const generateEmbeddings = async () => {
        if (!batchName) return;
        setSaving('__generating__');
        try {
<<<<<<< HEAD
            const res  = await fetch(`${GT_BASE}/generate-embeddings`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Embeddings built — ${data.students_enrolled} students enrolled`);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    const unflagged = unassigned.filter(u => !u.flagged);
    const flagged   = unassigned.filter(u =>  u.flagged);
=======
            const res = await fetch(`${RA_BASE}/flag`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    batch:           batchName,
                    folderName,
                    suggestedRollNo: match?.rollNo     || null,
                    confidence:      match?.confidence || null,
                    reason:          'operator_rejected',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to flag');

            // Move from pendingReview → flaggedItems
            const found = pendingReview.find(r => r.folderName === folderName);
            setPendingReview(prev => prev.filter(r => r.folderName !== folderName));
            if (found) setFlaggedItems(prev => [...prev, { ...found, status: 'flagged' }]);
            setModal(null);
            showToast(`⚑ Flagged ${folderName}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    // ── Render ────────────────────────────────────────────────────
>>>>>>> main

    // ── Render ───────────────────────────────────────────────────────
    return (
        <div style={styles.page}>
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

            {modal && (
                <VerifyModal
                    item={modal.item} match={modal.match}
                    batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                    overrideRoll={overrideRoll} setOverrideRoll={setOverrideRoll}
                    saving={saving === modal.item.folderName}
                    onApprove={() => handleApprove(modal.item.folderName, overrideRoll)}
                    onFlag={() => handleFlag(modal.item.folderName, modal.match)}
                    onClose={() => setModal(null)}
                />
            )}

            {gtModal && (
                <GTModal
                    rollNo={gtModal.rollNo} loading={gtLoading} data={gtData}
                    selected={gtSelected} setSelected={setGtSelected}
                    saving={gtSaving} onSave={handleUpdateEmbedding} onClose={() => setGtModal(null)}
                />
            )}

            <div style={{ marginBottom: 24 }}>
                <div style={styles.heading}>Assign Roll Numbers</div>
                <div style={styles.subheading}>Assign real roll numbers to extracted face clusters, then generate embeddings</div>
            </div>

            {/* Controls card */}
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end', marginBottom: 16 }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select
                            value={department}
                            onChange={e => setDepartment(e.target.value)}
                            style={styles.select}
                            disabled={deptLoading}
                        >
                            <option value="">
                                {deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select...'}
                            </option>
                            {departments.map(d => <option key={d}>{d}</option>)}
                        </select>
                        {deptError && (
                            <div style={{ fontSize: '11px', color: theme.danger, marginTop: 3 }}>{deptError}</div>
                        )}
                    </div>
                    <div>
                        <label style={styles.label}>Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select...</option>
                            {YEARS.map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
<<<<<<< HEAD
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button
                            onClick={generateEmbeddings}
                            disabled={saving === '__generating__' || !batchName || assigned.length === 0}
                            style={{
                                ...styles.btnPrimary, fontSize: '12px', padding: '9px 14px',
                                opacity: (saving === '__generating__' || !batchName || assigned.length === 0) ? 0.4 : 1,
                            }}
                        >
                            {saving === '__generating__' ? 'Building...' : 'Generate Embeddings'}
                        </button>
                        <div style={{ fontSize: '10px', color: theme.textMuted, textAlign: 'center' }}>
                            {assigned.length} assigned · {unassigned.length} pending
                        </div>
                    </div>
=======
                    <button
                        onClick={runAutoMatch}
                        disabled={matching || !batchName || unprocessed.length === 0}
                        style={{
                            ...styles.btnPrimary,
                            padding: '9px 20px', fontSize: '13px',
                            opacity: (matching || !batchName || unprocessed.length === 0) ? 0.5 : 1,
                        }}
                    >
                        {matching ? '🔄 Matching…' : `🔍 Match with ERP Photos${unprocessed.length > 0 ? ` (${unprocessed.length})` : ''}`}
                    </button>
>>>>>>> main
                </div>

                {/* Mode + action buttons row */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {[['manual', 'Manual Entry'], ['erp', 'ERP Auto-Match']].map(([id, label]) => (
                        <button key={id} onClick={() => setMode(id)} style={{
                            padding: '6px 16px', borderRadius: '999px', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer',
                            border: `1px solid ${mode === id ? theme.accent : theme.border}`,
                            background: mode === id ? theme.accentDim : 'transparent',
                            color: mode === id ? theme.accent : theme.textMuted,
                        }}>{label}</button>
                    ))}

                    <button onClick={() => setBulkOpen(v => !v)} style={{
                        padding: '6px 16px', borderRadius: '999px', fontSize: '12px',
                        fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${theme.border}`, background: 'transparent',
                        color: theme.textMuted, marginLeft: 'auto',
                    }}>
                        Bulk Assign
                    </button>

                    {mode === 'erp' && (
                        <>
                            <button
                                onClick={runAutoMatch}
                                disabled={matching || !batchName || unassigned.length === 0}
                                style={{
                                    ...styles.btnPrimary, padding: '6px 16px', fontSize: '12px',
                                    opacity: (matching || !batchName || unassigned.length === 0) ? 0.5 : 1,
                                }}>
                                {matching ? 'Matching...' : 'Match ERP Photos'}
                            </button>

                            {matchDone && highConfCount > 0 && (
                                <button
                                    onClick={approveAllHigh}
                                    disabled={approvingAll}
                                    style={{
                                        padding: '6px 16px', borderRadius: '999px', fontSize: '12px',
                                        fontWeight: 700, cursor: 'pointer', border: 'none',
                                        background: theme.success, color: '#000',
                                        opacity: approvingAll ? 0.5 : 1,
                                    }}
                                >
                                    {approvingAll ? 'Assigning...' : `Approve All High (${highConfCount})`}
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* ERP progress bar */}
                {matching && matchProgress && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.textMuted, marginBottom: 4 }}>
                            <span>{matchProgress.msg}</span>
                            {matchProgress.total > 0 && (
                                <span style={{ fontFamily: theme.fontMono }}>{matchProgress.done}/{matchProgress.total}</span>
                            )}
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: theme.border, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3,
                                background: matchProgress.step === 'erp' ? theme.warning : theme.accent,
                                width: matchProgress.total > 0 ? `${(matchProgress.done / matchProgress.total) * 100}%` : '5%',
                                transition: 'width 0.3s',
                            }} />
                        </div>
                    </div>
                )}

                {matchError && (
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: '#3f1212', color: '#f87171', fontSize: '12px' }}>
                        {matchError}
                    </div>
                )}
<<<<<<< HEAD

                {!matching && matchDone && (
=======
                {!matching && pendingReview.length > 0 && (
>>>>>>> main
                    <div style={{
                        marginTop: 12, padding: '8px 14px', borderRadius: 6,
                        background: theme.successDim, border: `1px solid ${theme.success}44`,
<<<<<<< HEAD
                        fontSize: '12px', color: theme.textMuted,
                    }}>
                        Matching complete — {Object.keys(matches).length} clusters matched.
                        {highConfCount > 0
                            ? ` Click "Approve All High (${highConfCount})" to auto-assign all high-confidence matches.`
                            : ' All high-confidence clusters assigned.'}
                    </div>
                )}

                {/* Bulk assign panel */}
                {bulkOpen && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}` }}>
                        <div style={{ ...styles.label, marginBottom: 8 }}>
                            One mapping per line: <span style={{ fontFamily: theme.fontMono, color: theme.accent }}>person_001 26TT1234</span>
                        </div>
                        <textarea
                            value={bulkText}
                            onChange={e => setBulkText(e.target.value)}
                            placeholder={'person_001 26TT1217\nperson_002 26TT1898\nperson_003 26TT1973'}
                            style={{ ...styles.input, height: 160, fontFamily: theme.fontMono, fontSize: '12px', resize: 'vertical', display: 'block' }}
                        />
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button
                                onClick={handleBulkAssign}
                                disabled={bulkSaving || !bulkText.trim()}
                                style={{ ...styles.btnPrimary, opacity: (bulkSaving || !bulkText.trim()) ? 0.5 : 1 }}
                            >
                                {bulkSaving ? 'Assigning...' : 'Bulk Assign'}
                            </button>
                            <button onClick={() => { setBulkOpen(false); setBulkText(''); }} style={styles.btnGhost}>Cancel</button>
                        </div>
=======
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ color: theme.success, fontWeight: 700, fontSize: '13px' }}>
                            ✓ Auto-assignment done
                        </span>
                        <span style={{ color: theme.textMuted, fontSize: '12px' }}>
                            {pendingReview.length} pending review · click any card to verify and approve
                        </span>
                    </div>
                )}
                {!matching && unprocessed.length > 0 && (
                    <div style={{
                        marginTop: 14, padding: '10px 14px', borderRadius: 7,
                        background: theme.accentDim, border: `1px solid ${theme.accent}44`,
                        fontSize: '12px', color: theme.textMuted,
                    }}>
                        <strong style={{ color: theme.accent }}>{unprocessed.length} unprocessed clusters</strong> — click <strong>Match with ERP Photos</strong> to auto-assign them
>>>>>>> main
                    </div>
                )}
            </div>

            {loading && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}>
                    Loading folders...
                </div>
            )}

            {!loading && batchName && (
                <>
<<<<<<< HEAD
                    {mode === 'manual' && unflagged.length > 0 && (
                        <Section title="Unassigned Clusters" count={unflagged.length} accentColor={theme.accent}>
                            {unflagged.map(item => (
                                <ManualCard
                                    key={item.folderName} item={item} batchName={batchName} photoUrl={photoUrl}
                                    rollValue={inlineRolls[item.folderName] || ''}
                                    onRollChange={v => setInlineRoll(item.folderName, v)}
                                    onAssign={() => assignManual(item.folderName)}
                                    saving={saving === item.folderName}
                                />
                            ))}
                        </Section>
                    )}

                    {mode === 'erp' && unflagged.length > 0 && (
                        <Section
                            title={matchDone ? 'Pending Review' : 'Clusters — run ERP match first'}
                            count={unflagged.length}
                            accentColor={matchDone ? theme.accent : theme.textMuted}
                        >
                            {unflagged.map(item => (
                                <ClusterCard
                                    key={item.folderName} item={item} match={matches[item.folderName]}
                                    batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                                    onClick={() => {
                                        if (matching || !matchDone) return;
                                        setModal({ item, match: matches[item.folderName] || null });
                                        setOverrideRoll(matches[item.folderName]?.best?.rollNo || '');
                                    }}
                                    disabled={matching || !matchDone} matchDone={matchDone}
                                />
                            ))}
                        </Section>
                    )}

                    {flagged.length > 0 && (
                        <Section title="Flagged" count={flagged.length} accentColor={theme.warning}>
                            {flagged.map(item => (
                                mode === 'manual' ? (
                                    <ManualCard
                                        key={item.folderName} item={item} batchName={batchName}
                                        photoUrl={photoUrl} isFlagged
                                        rollValue={inlineRolls[item.folderName] || ''}
                                        onRollChange={v => setInlineRoll(item.folderName, v)}
                                        onAssign={() => assignManual(item.folderName)}
                                        saving={saving === item.folderName}
                                    />
                                ) : (
                                    <ClusterCard
                                        key={item.folderName} item={item} match={matches[item.folderName]}
                                        batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl} isFlagged
                                        onClick={() => {
                                            setModal({ item, match: matches[item.folderName] || null });
                                            setOverrideRoll(matches[item.folderName]?.best?.rollNo || '');
                                        }}
                                    />
                                )
                            ))}
                        </Section>
                    )}
=======
                    {/* Pending operator review (auto-assigned, not yet approved) */}
                    <Section title="Pending Review" count={pendingReview.length} accentColor={theme.accent}
                             emptyText="No clusters pending review">
                        {pendingReview.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                onClick={() => openModal(item)}
                                disabled={matching}
                            />
                        ))}
                    </Section>

                    {/* Approved / confirmed */}
                    <Section title="Approved" count={approvedItems.length} accentColor={theme.success}
                             emptyText="No approved clusters yet">
                        {approvedItems.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                isAssigned
                                onClick={() => openGtModal(item.rollNo)}
                            />
                        ))}
                    </Section>
>>>>>>> main

                    {/* Flagged by operator */}
                    <Section title="Flagged" count={flaggedItems.length} accentColor={theme.warning}
                             emptyText="No flagged clusters">
                        {flaggedItems.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                onClick={() => openModal(item)}
                                isFlagged
                            />
                        ))}
                    </Section>

                    {/* No face detected */}
                    <Section title="No Face Detected" count={unmatchedItems.length} accentColor={theme.textMuted}
                             emptyText="No undetected clusters">
                        {unmatchedItems.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                isUnmatched
                                disabled
                            />
                        ))}
                    </Section>

                    {/* Unprocessed filesystem clusters (never matched) */}
                    {unprocessed.length > 0 && (
                        <Section title="Unprocessed" count={unprocessed.length} accentColor={theme.textMuted}>
                            {unprocessed.map(item => (
                                <ClusterCard
<<<<<<< HEAD
                                    key={item.folderName} item={item} batchName={batchName}
                                    photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl} isAssigned
                                    onClick={() => openGtModal(item.rollNo)}
=======
                                    key={item.folderName}
                                    item={item}
                                    batchName={batchName}
                                    photoUrl={photoUrl}
                                    erpPhotoUrl={erpPhotoUrl}
                                    disabled
>>>>>>> main
                                />
                            ))}
                        </Section>
                    )}

                    {unprocessed.length === 0 && pendingReview.length === 0 &&
                     approvedItems.length === 0 && unmatchedItems.length === 0 &&
                     flaggedItems.length === 0 && (
                        <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                            <div style={{ fontSize: '36px', opacity: 0.3, marginBottom: 12 }}>📁</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>No folders found</div>
                            <div style={{ fontSize: '13px', color: theme.textMuted }}>Run Ground Truth Generation first</div>
                        </div>
                    )}
                </>
            )}

            {!loading && !batchName && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                    <div style={{ fontSize: '36px', opacity: 0.3, marginBottom: 12 }}>🎓</div>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Select a batch to start</div>
                </div>
            )}
        </div>
    );
}

<<<<<<< HEAD
// ── Manual card ───────────────────────────────────────────────────
function ManualCard({ item, batchName, photoUrl, rollValue, onRollChange, onAssign, saving, isFlagged }) {
    return (
        <div style={{ background: theme.surface, border: `1px solid ${isFlagged ? theme.warning + '66' : theme.border}`, borderRadius: 10, overflow: 'hidden' }}>
=======
// ── Section wrapper ────────────────────────────────────────────
function Section({ title, count, accentColor, children, emptyText }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, marginBottom: 14 }}>
                {title}
                <span style={{
                    marginLeft: 8, fontSize: '12px', fontWeight: 600,
                    background: accentColor + '22', color: accentColor,
                    padding: '2px 8px', borderRadius: 10,
                }}>
                    {count}
                </span>
            </div>
            {count === 0 && emptyText ? (
                <div style={{
                    padding: '14px 16px', borderRadius: 8, fontSize: '12px',
                    color: theme.textMuted, background: theme.surface,
                    border: `1px dashed ${theme.border}`,
                }}>
                    {emptyText}
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 14,
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}

// ── Cluster card ──────────────────────────────────────────────
function ClusterCard({ item, batchName, photoUrl, erpPhotoUrl, onClick, isAssigned, isFlagged, isUnmatched, disabled }) {
    const conf        = item.confidence;
    const folderForPhoto = item.currentFolder || item.folderName;
    const previews    = item.previewFiles || [];

    const borderColor = isAssigned  ? theme.success + '44' :
                        isFlagged   ? theme.warning + '66' :
                        isUnmatched ? theme.border + '88'  : theme.border;

    return (
        <div
            onClick={disabled ? undefined : onClick}
            style={{
                background: theme.surface,
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                opacity: disabled ? 0.6 : 1,
                overflow: 'hidden',
                cursor: disabled ? 'default' : 'pointer',
                transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => {
                if (!disabled) e.currentTarget.style.borderColor =
                    isAssigned ? theme.success : theme.accent;
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = borderColor;
            }}
        >
            {/* Face strip */}
>>>>>>> main
            <div style={{ display: 'flex', height: 80, overflow: 'hidden', background: '#000', gap: 1 }}>
                {previews.slice(0, 4).map((f, i) => (
                    <img key={i} src={photoUrl(batchName, folderForPhoto, f)} alt=""
                         style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }}
                         onError={e => { e.target.style.display = 'none'; }} />
                ))}
                {previews.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: theme.textMuted, fontSize: '11px' }}>
                        No images
                    </div>
                )}
            </div>
            <div style={{ padding: '10px 12px' }}>
<<<<<<< HEAD
=======
                {/* Folder / roll no label + image count */}
>>>>>>> main
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>{item.folderName}</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{item.imageCount} img</span>
                </div>
                {isFlagged && <div style={{ fontSize: '10px', color: theme.warning, marginBottom: 6, fontWeight: 600 }}>Flagged</div>}
                <div style={{ display: 'flex', gap: 6 }}>
                    <input
                        type="text" placeholder="Roll No e.g. 26TT1234" value={rollValue}
                        onChange={e => onRollChange(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') onAssign(); }}
                        style={{ ...styles.input, flex: 1, padding: '6px 10px', fontSize: '12px',
                            fontFamily: theme.fontMono, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}
                    />
                    <button
                        onClick={onAssign} disabled={saving || !rollValue.trim()}
                        style={{ padding: '6px 12px', borderRadius: 6, border: 'none',
                            background: theme.success, color: '#000', fontSize: '12px',
                            fontWeight: 700, cursor: 'pointer',
                            opacity: (saving || !rollValue.trim()) ? 0.4 : 1, flexShrink: 0 }}>
                        {saving ? '...' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}

<<<<<<< HEAD
// ── Section wrapper ───────────────────────────────────────────────
function Section({ title, count, accentColor, children }) {
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.text, marginBottom: 14 }}>
                {title}
                <span style={{ marginLeft: 8, fontSize: '12px', fontWeight: 600,
                    background: accentColor + '22', color: accentColor, padding: '2px 8px', borderRadius: 10 }}>
                    {count}
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {children}
            </div>
        </div>
    );
}

// ── ERP Cluster card ──────────────────────────────────────────────
function ClusterCard({ item, match, batchName, photoUrl, erpPhotoUrl, onClick, isAssigned, isFlagged, disabled, matchDone }) {
    const best = match?.best;
    const conf = best?.confidence;
    return (
        <div
            onClick={disabled ? undefined : onClick}
            style={{
                background: theme.surface,
                border: `1px solid ${isAssigned ? theme.success + '44' : isFlagged ? theme.warning + '66' : theme.border}`,
                borderRadius: 10, overflow: 'hidden',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = isAssigned ? theme.success : theme.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = isAssigned ? theme.success + '44' : isFlagged ? theme.warning + '66' : theme.border; }}
        >
            <div style={{ display: 'flex', height: 80, overflow: 'hidden', background: '#000', gap: 1 }}>
                {item.previewFiles.slice(0, 4).map((f, i) => (
                    <img key={i} src={photoUrl(batchName, item.folderName, f)} alt=""
                         style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }}
                         onError={e => { e.target.style.display = 'none'; }} />
                ))}
            </div>
            <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>{item.folderName}</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{item.imageCount} img</span>
                </div>
=======
                {/* Status badge */}
>>>>>>> main
                {isAssigned ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.successDim,
                        color: theme.success, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                        {item.rollNo}
                    </div>
                ) : isFlagged ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.warning + '22',
                        color: theme.warning, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                        Flagged
                    </div>
                ) : isUnmatched ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5,
                                  background: theme.border + '44', color: theme.textMuted,
                                  fontSize: '11px', textAlign: 'center' }}>
                        ⚠ No face detected
                    </div>
                ) : item.rollNo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
<<<<<<< HEAD
                        {best.erpPhoto && (
                            <img src={erpPhotoUrl(best.erpPhoto)} alt="ERP"
                                 style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                                          border: `2px solid ${confidenceColor(conf)}`, flexShrink: 0 }}
                                 onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text }}>{best.rollNo}</div>
                            <div style={{ fontSize: '11px', color: confidenceColor(conf) }}>
                                {confidenceLabel(conf)} · {(conf * 100).toFixed(0)}%
=======
                        {item.erpPhoto && (
                            <img src={erpPhotoUrl(item.erpPhoto)} alt="ERP"
                                 style={{ width: 32, height: 32, borderRadius: '50%',
                                          objectFit: 'cover', border: `2px solid ${confidenceColor(conf)}`,
                                          flexShrink: 0 }}
                                 onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text,
                                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.rollNo}
>>>>>>> main
                            </div>
                            {conf != null && (
                                <div style={{ fontSize: '11px', color: confidenceColor(conf) }}>
                                    {confidenceLabel(conf)} · {(conf * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
<<<<<<< HEAD
                    <div style={{ fontSize: '11px', textAlign: 'center', padding: '5px 8px', borderRadius: 5,
                        background: theme.border + '44', color: theme.textMuted }}>
                        {matchDone ? 'No match' : 'Run ERP match first'}
=======
                    <div style={{ fontSize: '11px', textAlign: 'center', padding: '5px 8px',
                                  borderRadius: 5, background: theme.border + '44', color: theme.textMuted }}>
                        ⟳ Not yet matched
>>>>>>> main
                    </div>
                )}
            </div>
        </div>
    );
}

// ── GT Modal ──────────────────────────────────────────────────────
function GTModal({ rollNo, loading, data, selected, setSelected, saving, onSave, onClose }) {
    const toggle   = (fn) => setSelected(prev => { const n = new Set(prev); n.has(fn) ? n.delete(fn) : n.add(fn); return n; });
    const selAll   = (files) => setSelected(prev => { const n = new Set(prev); files.forEach(f => n.add(f.filename)); return n; });
    const deselAll = (files) => setSelected(prev => { const n = new Set(prev); files.forEach(f => n.delete(f.filename)); return n; });

    const renderSection = (title, files, accent, hint) => {
        if (!files?.length) return null;
        return (
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: accent, textTransform: 'uppercase' }}>{title}</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{hint}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                        <button onClick={() => selAll(files)}   style={{ fontSize: '11px', color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>Select all</button>
                        <button onClick={() => deselAll(files)} style={{ fontSize: '11px', color: theme.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>Deselect all</button>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                    {files.map(f => {
                        const isSel = selected.has(f.filename);
                        return (
                            <div key={f.filename} onClick={() => toggle(f.filename)} style={{
                                position: 'relative', cursor: 'pointer', borderRadius: 6, overflow: 'hidden',
                                border: `2px solid ${isSel ? accent : theme.border}`,
                            }}>
                                <img src={f.url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                                     onError={e => { e.target.style.display = 'none'; }} />
                                {isSel && (
                                    <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18,
                                        borderRadius: '50%', background: accent, color: '#000',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '11px', fontWeight: 800 }}>✓</div>
                                )}
                                {f.score != null && (
                                    <div style={{ position: 'absolute', bottom: 3, left: 3, fontSize: '9px',
                                        fontWeight: 700, background: 'rgba(0,0,0,0.65)', color: '#fff',
                                        padding: '1px 4px', borderRadius: 3 }}>{f.score.toFixed(0)}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
                width: '100%', maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: theme.text }}>Ground Truth — {rollNo}</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer' }}>x</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>Loading...</div>}
                    {!loading && data && <>
                        {renderSection('Embedding Files', data.embeddingFiles, theme.success, 'active in face recognition')}
                        {renderSection('Backup Images',   data.backupFiles,    theme.accent,  'not used for embedding')}
                        {renderSection('Untracked',       data.untrackedFiles, theme.textMuted, 'manually added')}
                    </>}
                </div>
                <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: theme.textMuted }}>{selected.size} selected</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 7,
                            border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={onSave} disabled={saving || selected.size === 0}
                            style={{ padding: '8px 20px', borderRadius: 7, border: 'none',
                                background: theme.success, color: '#000', fontSize: '13px',
                                fontWeight: 700, cursor: 'pointer', opacity: (saving || selected.size === 0) ? 0.5 : 1 }}>
                            {saving ? 'Updating...' : 'Update Embedding'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

<<<<<<< HEAD
// ── Verify Modal (ERP mode) ───────────────────────────────────────
function VerifyModal({ item, match, batchName, photoUrl, erpPhotoUrl, overrideRoll, setOverrideRoll, saving, onApprove, onFlag, onClose }) {
    const best       = match?.best;
    const candidates = match?.candidates || [];
    const conf       = best?.confidence;
=======
// ── Verify Modal ───────────────────────────────────────────────
function VerifyModal({ item, match, batchName, photoUrl, erpPhotoUrl,
                       overrideRoll, setOverrideRoll,
                       saving, onApprove, onFlag, onClose }) {
    // match is now a flat DB record (rollNo, erpPhoto, confidence, candidates[])
    const conf        = match?.confidence;
    const candidates  = match?.candidates || [];
    const folderForPhoto = item.currentFolder || item.folderName;

>>>>>>> main
    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
                width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: theme.text }}>
                        Verify — {item.folderName}
                        <span style={{ marginLeft: 8, fontSize: '12px', color: theme.textMuted, fontWeight: 400 }}>{item.imageCount} images</span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer' }}>x</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                    <div>
<<<<<<< HEAD
                        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted, marginBottom: 10, textTransform: 'uppercase' }}>Extracted Faces</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                            {item.previewFiles.map((f, i) => (
                                <img key={i} src={photoUrl(batchName, item.folderName, f)} alt=""
                                     style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, border: `1px solid ${theme.border}` }}
=======
                        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted,
                                      marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Extracted Face Images
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                            {(item.previewFiles || []).map((f, i) => (
                                <img key={i} src={photoUrl(batchName, folderForPhoto, f)} alt=""
                                     style={{ width: '100%', aspectRatio: '1', objectFit: 'cover',
                                              borderRadius: 6, border: `1px solid ${theme.border}` }}
>>>>>>> main
                                     onError={e => { e.target.style.display = 'none'; }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
<<<<<<< HEAD
                            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>ERP Match</div>
                            {best ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={erpPhotoUrl(best.erpPhoto)} alt="ERP"
                                         style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: `3px solid ${confidenceColor(conf)}` }}
                                         onError={e => { e.target.style.display = 'none'; }} />
                                    <div style={{ marginTop: 8, fontSize: '15px', fontWeight: 800, color: theme.text }}>{best.rollNo}</div>
=======
                            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted,
                                          marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ERP Match
                            </div>

                            {match?.erpPhoto ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img
                                        src={erpPhotoUrl(match.erpPhoto)}
                                        alt="ERP"
                                        style={{ width: 120, height: 120, objectFit: 'cover',
                                                 borderRadius: 8,
                                                 border: `3px solid ${confidenceColor(conf)}` }}
                                        onError={e => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                                        }}
                                    />
                                    <div style={{ display: 'none', width: 120, height: 120,
                                                  background: theme.bg, borderRadius: 8,
                                                  alignItems: 'center', justifyContent: 'center',
                                                  fontSize: '11px', color: theme.textMuted,
                                                  border: `1px solid ${theme.border}` }}>
                                        No photo
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: '15px', fontWeight: 800,
                                                  color: theme.text }}>
                                        {match.rollNo}
                                    </div>
>>>>>>> main
                                    <div style={{ fontSize: '12px', color: confidenceColor(conf), fontWeight: 600 }}>
                                        {confidenceLabel(conf)} · {(conf * 100).toFixed(1)}%
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '13px', padding: '20px 0' }}>No ERP match. Enter manually.</div>
                            )}
                        </div>
                        {candidates.length > 1 && (
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600, marginBottom: 6 }}>Other candidates</div>
                                {candidates.slice(1).map((c, i) => (
                                    <div key={i} onClick={() => setOverrideRoll(c.rollNo)}
                                         style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                                             borderRadius: 5, cursor: 'pointer', marginBottom: 4,
                                             background: overrideRoll === c.rollNo ? theme.accentDim : 'transparent',
                                             border: `1px solid ${overrideRoll === c.rollNo ? theme.accent : 'transparent'}` }}>
                                        {c.erpPhoto && (
                                            <img src={erpPhotoUrl(c.erpPhoto)} alt=""
                                                 style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                                                 onError={e => { e.target.style.display = 'none'; }} />
                                        )}
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: theme.text }}>{c.rollNo}</span>
                                        <span style={{ fontSize: '11px', color: confidenceColor(c.confidence), marginLeft: 'auto' }}>
                                            {(c.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                            <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600, marginBottom: 5 }}>Roll Number</div>
                            <input
                                type="text" placeholder="e.g. 26TT1234" value={overrideRoll}
                                onChange={e => setOverrideRoll(e.target.value.toUpperCase())}
                                onKeyDown={e => { if (e.key === 'Enter') onApprove(); }}
                                style={{ ...styles.input, margin: 0, fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                            <button
                                onClick={onApprove} disabled={saving || !overrideRoll.trim()}
                                style={{ padding: '10px 0', borderRadius: 7, border: 'none',
                                    background: theme.success, color: '#000', fontSize: '13px',
                                    fontWeight: 700, cursor: 'pointer', opacity: (saving || !overrideRoll.trim()) ? 0.5 : 1 }}>
                                {saving ? 'Assigning...' : 'Approve & Assign'}
                            </button>
                            <button
                                onClick={onFlag} disabled={saving}
                                style={{ padding: '10px 0', borderRadius: 7, border: `1px solid ${theme.warning}`,
                                    background: 'transparent', color: theme.warning, fontSize: '13px',
                                    fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                                Flag as Incorrect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
