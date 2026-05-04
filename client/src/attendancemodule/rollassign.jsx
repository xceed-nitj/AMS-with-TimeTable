import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    const { departments, loading: deptLoading, error: deptError } = useDepartments();

    // ── All useState hooks ───────────────────────────────────────────
    const [degree,        setDegree]        = useState('BTECH');
    const [department,    setDepartment]    = useState('');
    const [year,          setYear]          = useState('');
    const [mode,          setMode]          = useState('manual');

    const [loading,       setLoading]       = useState(false);
    const [matching,      setMatching]      = useState(false);
    const [matchDone,     setMatchDone]     = useState(false);
    const [matchProgress, setMatchProgress] = useState(null);
    const [saving,        setSaving]        = useState(null);
    const [toast,         setToast]         = useState(null);
    const [matchError,    setMatchError]    = useState(null);
    const [approvingAll,  setApprovingAll]  = useState(false);

    const [unprocessed,      setUnprocessed]      = useState([]);
    const [pendingReview,    setPendingReview]    = useState([]);
    const [approvedItems,    setApprovedItems]    = useState([]);
    const [unmatchedItems,   setUnmatchedItems]   = useState([]);
    const [flaggedItems,     setFlaggedItems]     = useState([]);
    const [mergedItems,      setMergedItems]      = useState([]);

    const [unapprovedMap,    setUnapprovedMap]    = useState({});
    const [approvedStats,    setApprovedStats]    = useState({});
    const [approvingPhoto,   setApprovingPhoto]   = useState({});

    const [matches,       setMatches]       = useState({});
    const [inlineRolls,   setInlineRolls]   = useState({});

    const [modal,         setModal]         = useState(null);
    const [overrideRoll,  setOverrideRoll]  = useState('');

    const [gtModal,       setGtModal]       = useState(null);
    const [gtData,        setGtData]        = useState(null);
    const [gtLoading,     setGtLoading]     = useState(false);
    const [gtSelected,    setGtSelected]    = useState(new Set());
    const [gtSaving,      setGtSaving]      = useState(false);

    const [bulkText,      setBulkText]      = useState('');
    const [bulkOpen,      setBulkOpen]      = useState(false);
    const [bulkSaving,    setBulkSaving]    = useState(false);

    // ── Derived values ───────────────────────────────────────────────
    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const highConfCount = matchDone
        ? Object.entries(matches).filter(([, m]) => m?.best?.confidence >= HIGH).length
        : 0;

    // ── Helpers ──────────────────────────────────────────────────────
    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const photoUrl    = (batch, folder, filename) =>
        `${RA_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    const erpPhotoUrl = (filename) =>
        `${RA_BASE}/erp-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(filename)}`;

    // ── Load clusters from DB + unprocessed from filesystem ─────────
    const loadClusters = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setMatchError(null);
        try {
            const [clusterRes, matchRes, studentsRes] = await Promise.all([
                fetch(`${RA_BASE}/clusters/${batchName}`),
                fetch(`${RA_BASE}/matches/${batchName}`),
                fetch(`${GT_BASE}/batches/${encodeURIComponent(batchName)}/students`),
            ]);

            const clusterData = clusterRes.ok ? await clusterRes.json() : { unprocessed: [] };
            setUnprocessed(clusterData.unprocessed || []);

            console.log('Fetching with batchName:', batchName);
            console.log('clusterRes status:', clusterRes.status);
            console.log('matchRes status:', matchRes.status);

            if (matchRes.ok) {
                const matchData = await matchRes.json();
                console.log('matchData keys:', Object.keys(matchData));
                console.log('raw matchData:', matchData);

                const { matchMap = {} } = matchData;
                console.log('matchMap length:', Object.values(matchMap).length);

                const records = Object.values(matchMap);
                setPendingReview(records.filter(r => r.status === 'matched' && !r.approved));
                setApprovedItems(records.filter(r => r.approved));
                setUnmatchedItems(records.filter(r => r.status === 'unmatched'));
                setFlaggedItems(records.filter(r => r.status === 'flagged'));
                setMergedItems(records.filter(r => r.status === 'merged_unapproved'));
            }

            if (studentsRes.ok) {
                const { students = [] } = await studentsRes.json();
                const newUnapprovedMap = {};
                const newStatsMap = {};
                for (const s of students) {
                    if (/^person_\d+$/i.test(s.rollNo)) continue;
                    if ((s.unapprovedFiles || []).length > 0) {
                        newUnapprovedMap[s.rollNo] = (s.unapprovedFiles || []).map(f => ({
                            ...f,
                            url: `${GT_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(s.rollNo)}/${encodeURIComponent(f.filename)}`,
                        }));
                    }
                    newStatsMap[s.rollNo] = {
                        approvedCount:  s.approvedCount  || 0,
                        embeddingCount: s.embeddingCount || 0,
                        backupCount:    s.backupCount    || 0,
                        unapprovedCount:s.unapprovedCount|| 0,
                    };
                }
                setUnapprovedMap(newUnapprovedMap);
                setApprovedStats(newStatsMap);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [batchName]);

    useEffect(() => { loadClusters(); }, [loadClusters]);

    // ── Listen for refresh broadcasts ────────────────────────────────
    useEffect(() => {
        if (!batchName) return;
        let channel;
        try {
            channel = new BroadcastChannel('attendance_refresh');
            channel.onmessage = (e) => {
                if (e.data?.type === 'refresh' && e.data?.batch === batchName) {
                    loadClusters();
                }
            };
        } catch (_) {}
        return () => {
            try { channel?.close(); } catch (_) {}
        };
    }, [batchName, loadClusters]);

    // ── Auto-match against ERP photos (SSE) ─────────────────────────
    const runAutoMatch = useCallback(async () => {
        if (!batchName) return;
        setMatching(true);
        setMatchDone(false);
        setMatchError(null);
        setMatchProgress({ msg: 'Starting…', done: 0, total: 0, step: 'init' });

        const localMatches = {};
        let sseSucceeded   = false;
        let matchCount     = 0;

        try {
            const res = await fetch(`${RA_BASE}/auto-match/${batchName}`, { method: 'POST' });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Match failed');
            }

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let buf = '';

            const processLine = async (line) => {
                if (!line.startsWith('data:')) return;
                let evt;
                try { evt = JSON.parse(line.slice(5).trim()); } catch { return; }

                if (evt.type === 'erp_progress') {
                    setMatchProgress({ msg: evt.msg, done: evt.done, total: evt.total, step: 'erp' });
                } else if (evt.type === 'cluster_progress') {
                    setMatchProgress({ msg: evt.msg, done: evt.done, total: evt.total, step: 'cluster', current: evt.current });
                } else if (evt.type === 'status') {
                    setMatchProgress(p => ({ ...p, msg: evt.msg, step: evt.step }));
                } else if (evt.type === 'match_result') {
                    localMatches[evt.folder] = evt.match;
                    matchCount++;
                    try {
                        const saveRes = await fetch(`${RA_BASE}/save-match-result`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                batch: batchName,
                                folderName: evt.folder,
                                matchData: evt.match,
                            }),
                        });
                        if (saveRes.ok) {
                            setMatches(prev => ({ ...prev, [evt.folder]: evt.match }));
                            setMatchProgress(p => ({
                                ...p,
                                msg: `Saved ${matchCount} matches...`,
                                done: matchCount,
                            }));
                        } else {
                            console.error(`Failed to save ${evt.folder}:`, await saveRes.text());
                        }
                    } catch (saveErr) {
                        console.error(`Error saving ${evt.folder}:`, saveErr);
                    }
                } else if (evt.type === 'done') {
                    sseSucceeded = true;
                    setMatchDone(true);
                    showToast(`✓ Matched ${matchCount} clusters — saved to database`);
                } else if (evt.type === 'error') {
                    throw new Error(evt.msg);
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    buf += decoder.decode();
                    const lines = buf.split('\n');
                    for (const l of lines) { await processLine(l); }
                    break;
                }
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop();
                for (const l of lines) { await processLine(l); }
            }

            if (sseSucceeded && matchCount > 0) {
                setMatchProgress({ msg: 'Renaming folders on filesystem…', done: matchCount, total: matchCount, step: 'saving' });

                const assignRes  = await fetch(`${RA_BASE}/auto-assign-all`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ batch: batchName, matches: localMatches }),
                });
                const assignData = await assignRes.json();

                if (!assignRes.ok) {
                    showToast(`⚠ Matching saved, but folder rename failed: ${assignData.error}`, 'warning');
                } else {
                    showToast(
                        `✓ ${assignData.renamed} clusters auto-assigned` +
                        (assignData.unmatched ? `, ${assignData.unmatched} unmatched` : '') +
                        (assignData.conflicts ? `, ${assignData.conflicts} conflicts` : '')
                    );
                }

                await loadClusters();
            }
        } catch (err) {
            setMatchError(err.message);
            showToast(err.message, 'error');
            setTimeout(() => loadClusters(), 500);
        } finally {
            setMatching(false);
            setMatchProgress(null);
        }
    }, [batchName, loadClusters]);

    // ── Review queue ─────────────────────────────────────────────────
    const reviewQueue = [...pendingReview, ...mergedItems, ...flaggedItems];

    // ── Open modal ───────────────────────────────────────────────────
    const openModal = (item) => {
        if (matching) return;
        setModal({ item, match: item });
        setOverrideRoll(item.rollNo || '');
    };

    // ── Navigate queue ───────────────────────────────────────────────
    const openQueueItem = (queue, currentFolderName, direction) => {
        const idx = queue.findIndex(r => r.folderName === currentFolderName);
        const next = queue[idx + direction];
        if (next) {
            setModal({ item: next, match: next });
            setOverrideRoll(next.rollNo || '');
        } else {
            setModal(null);
        }
    };

    // ── Assign single (manual inline) ────────────────────────────────
    const assignManual = async (folderName) => {
        const rollNo = (inlineRolls[folderName] || '').trim().toUpperCase();
        if (!rollNo) { showToast('Enter a roll number', 'error'); return; }
        setSaving(folderName);
        try {
            const res  = await fetch(`${RA_BASE}/approve`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ batch: batchName, folderName, rollNo }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            setPendingReview(prev => prev.filter(r => r.folderName !== folderName));
            setFlaggedItems(prev => prev.filter(r => r.folderName !== folderName));
            setApprovedItems(prev => {
                const found = [...pendingReview, ...flaggedItems].find(r => r.folderName === folderName);
                return found ? [...prev, { ...found, rollNo: data.rollNo, approved: true, status: 'approved' }] : prev;
            });
            setInlineRolls(prev => { const n = { ...prev }; delete n[folderName]; return n; });
            showToast(`✓ Assigned ${folderName} → ${data.rollNo}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    // ── Approve from modal ───────────────────────────────────────────
    const handleApprove = async (folderName, rollNo) => {
        const trimmed = (rollNo || '').trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number', 'error'); return; }
        setSaving(folderName);

        const queueSnapshot = [...pendingReview, ...mergedItems, ...flaggedItems];

        try {
            const res  = await fetch(`${RA_BASE}/approve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, folderName, rollNo: trimmed }),
            });
            let data;
            try { data = await res.json(); } catch { data = {}; }
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

            const found = queueSnapshot.find(r => r.folderName === folderName);
            setPendingReview(prev => prev.filter(r => r.folderName !== folderName));
            setMergedItems(prev  => prev.filter(r => r.folderName !== folderName));
            setFlaggedItems(prev => prev.filter(r => r.folderName !== folderName));
            if (found) setApprovedItems(prev => [...prev, { ...found, rollNo: data.rollNo || trimmed, approved: true, status: 'approved' }]);

            showToast(`Assigned ${folderName} → ${data.rollNo || trimmed}`);
            openQueueItem(queueSnapshot, folderName, +1);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    // ── Flag ─────────────────────────────────────────────────────────
    const handleFlag = async (folderName, match) => {
        setSaving(folderName);

        // Capture queue snapshot before async state updates
        const queueSnapshot = [...pendingReview, ...mergedItems, ...flaggedItems];

        try {
            const res = await fetch(`${RA_BASE}/flag`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch: batchName, folderName,
                    suggestedRollNo: match?.rollNo     || match?.best?.rollNo     || null,
                    confidence:      match?.confidence || match?.best?.confidence || null,
                    reason: 'operator_rejected',
                }),
            });
            let data;
            try { data = await res.json(); } catch { data = {}; }
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);

            // ── FIX: check if already flagged before adding ──────────
            const alreadyFlagged = flaggedItems.some(r => r.folderName === folderName);

            const found = queueSnapshot.find(r => r.folderName === folderName);
            setPendingReview(prev => prev.filter(r => r.folderName !== folderName));
            setMergedItems(prev  => prev.filter(r => r.folderName !== folderName));

            // Only add to flaggedItems if it wasn't already there
            if (found && !alreadyFlagged) {
                setFlaggedItems(prev => [...prev, { ...found, status: 'flagged' }]);
            }

            showToast(`⚑ Flagged ${folderName}`);

            // Auto-advance to next item
            openQueueItem(queueSnapshot, folderName, +1);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    // ── Bulk assign ──────────────────────────────────────────────────
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
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setBulkSaving(false);
        }
    };

    // ── Approve ALL high-confidence ──────────────────────────────────
    const approveAllHigh = async () => {
        if (!matchDone) { showToast('Run ERP match first', 'error'); return; }

        const candidates = pendingReview
            .filter(r => matches[r.folderName]?.best?.confidence >= HIGH)
            .map(r => ({ folderName: r.folderName, match: matches[r.folderName] }));

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
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setApprovingAll(false);
        }
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
        } catch (err) {
            showToast(err.message, 'error');
            setGtModal(null);
        } finally {
            setGtLoading(false);
        }
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
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setGtSaving(false);
        }
    }, [gtModal, gtSelected, batchName]);

    // ── Approve individual new photos ────────────────────────────────
    const approvePhoto = useCallback(async (rollNo, filename) => {
        const key = `${rollNo}::${filename}`;
        setApprovingPhoto(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetch(`${GT_BASE}/approve-photos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, rollNo, filenames: [filename] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Approved & added to embedding`);
            setUnapprovedMap(prev => {
                const updated = { ...(prev[rollNo] ? { [rollNo]: prev[rollNo].filter(f => f.filename !== filename) } : {}) };
                if (updated[rollNo]?.length === 0) delete updated[rollNo];
                return { ...prev, ...updated };
            });
            setApprovedStats(prev => ({
                ...prev,
                [rollNo]: {
                    ...prev[rollNo],
                    approvedCount:  (prev[rollNo]?.approvedCount  || 0) + 1,
                    embeddingCount: (prev[rollNo]?.embeddingCount || 0) + 1,
                    unapprovedCount:Math.max(0, (prev[rollNo]?.unapprovedCount || 1) - 1),
                },
            }));
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setApprovingPhoto(prev => { const n = { ...prev }; delete n[key]; return n; });
        }
    }, [batchName]);

    const approveAllPhotos = useCallback(async (rollNo, files) => {
        if (!files?.length) return;
        const allKey = `${rollNo}::all`;
        setApprovingPhoto(prev => ({ ...prev, [allKey]: true }));
        try {
            const res = await fetch(`${GT_BASE}/approve-photos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, rollNo, filenames: files.map(f => f.filename) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Approved ${files.length} photo(s) for ${rollNo}`);
            setUnapprovedMap(prev => { const n = { ...prev }; delete n[rollNo]; return n; });
            setApprovedStats(prev => ({
                ...prev,
                [rollNo]: {
                    approvedCount:  data.approvedCount  || 0,
                    embeddingCount: data.embeddingCount || 0,
                    backupCount:    data.backupCount    || 0,
                    unapprovedCount:0,
                },
            }));
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setApprovingPhoto(prev => { const n = { ...prev }; delete n[allKey]; return n; });
        }
    }, [batchName]);

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

            {/* Verify Modal — portal escapes any ancestor transform/overflow */}
            {modal && createPortal(
                (() => {
                    const queueIdx = reviewQueue.findIndex(r => r.folderName === modal.item.folderName);
                    return (
                        <VerifyModal
                            item={modal.item} match={modal.match}
                            batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                            overrideRoll={overrideRoll} setOverrideRoll={setOverrideRoll}
                            saving={saving === modal.item.folderName}
                            onApprove={() => handleApprove(modal.item.folderName, overrideRoll)}
                            onFlag={() => handleFlag(modal.item.folderName, modal.match)}
                            onClose={() => setModal(null)}
                            hasPrev={queueIdx > 0}
                            hasNext={queueIdx < reviewQueue.length - 1}
                            onPrev={() => openQueueItem(reviewQueue, modal.item.folderName, -1)}
                            onNext={() => openQueueItem(reviewQueue, modal.item.folderName, +1)}
                            position={queueIdx + 1}
                            total={reviewQueue.length}
                        />
                    );
                })(),
                document.body
            )}

            {/* GT Modal — portal escapes any ancestor transform/overflow */}
            {gtModal && createPortal(
                <GTModal
                    rollNo={gtModal.rollNo} loading={gtLoading} data={gtData}
                    selected={gtSelected} setSelected={setGtSelected}
                    saving={gtSaving} onSave={handleUpdateEmbedding} onClose={() => setGtModal(null)}
                />,
                document.body
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
                </div>

                {/* Bulk assign panel */}
                {bulkOpen && (
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: theme.bg, border: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: 6 }}>
                            One per line: <code>person_001 26TT1234</code>
                        </div>
                        <textarea
                            value={bulkText}
                            onChange={e => setBulkText(e.target.value)}
                            rows={6}
                            placeholder={'person_001 26TT1234\nperson_002 26TT5678'}
                            style={{ ...styles.input, width: '100%', fontFamily: theme.fontMono, fontSize: '12px', resize: 'vertical' }}
                        />
                        <button
                            onClick={handleBulkAssign}
                            disabled={bulkSaving || !bulkText.trim()}
                            style={{ ...styles.btnPrimary, marginTop: 8, opacity: (bulkSaving || !bulkText.trim()) ? 0.5 : 1 }}
                        >
                            {bulkSaving ? 'Assigning...' : 'Bulk Assign'}
                        </button>
                    </div>
                )}

                {/* Progress bar */}
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

                {!matching && pendingReview.length > 0 && (
                    <div style={{
                        marginTop: 12, padding: '8px 14px', borderRadius: 6,
                        background: theme.successDim, border: `1px solid ${theme.success}44`,
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                        <span style={{ color: theme.success, fontWeight: 700, fontSize: '13px' }}>✓ Auto-assignment done</span>
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
                    <Section title="Pending Review" count={pendingReview.length} accentColor={theme.accent} emptyText="No clusters pending review">
                        {pendingReview.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                mode={mode}
                                rollValue={inlineRolls[item.folderName] || ''}
                                onRollChange={v => setInlineRolls(prev => ({ ...prev, [item.folderName]: v }))}
                                onAssign={() => assignManual(item.folderName)}
                                saving={saving === item.folderName}
                                onClick={() => openModal(item)}
                                disabled={matching}
                            />
                        ))}
                    </Section>

                    {Object.keys(unapprovedMap).length > 0 && (
                        <Section
                            title="New Photos — Pending Approval"
                            count={Object.values(unapprovedMap).reduce((s, a) => s + a.length, 0)}
                            accentColor={theme.warning}
                        >
                            {Object.entries(unapprovedMap).map(([rollNo, photos]) => (
                                <UnapprovedPhotoCard
                                    key={rollNo}
                                    rollNo={rollNo}
                                    photos={photos}
                                    stats={approvedStats[rollNo]}
                                    busy={approvingPhoto}
                                    onApprove={approvePhoto}
                                    onApproveAll={() => approveAllPhotos(rollNo, photos)}
                                />
                            ))}
                        </Section>
                    )}

                    <Section title="Approved" count={approvedItems.length} accentColor={theme.success} emptyText="No approved clusters yet">
                        {approvedItems.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                mode={mode}
                                isAssigned
                                stats={approvedStats[item.rollNo]}
                                unapprovedCount={unapprovedMap[item.rollNo]?.length || 0}
                                onClick={() => openGtModal(item.rollNo)}
                            />
                        ))}
                    </Section>

                    {mergedItems.length > 0 && (
                        <Section title="Merged — Pending Review" count={mergedItems.length} accentColor={theme.warning} emptyText="">
                            {mergedItems.map(item => (
                                <ClusterCard
                                    key={item.folderName}
                                    item={item}
                                    batchName={batchName}
                                    photoUrl={photoUrl}
                                    erpPhotoUrl={erpPhotoUrl}
                                    mode={mode}
                                    isMerged
                                    rollValue={inlineRolls[item.folderName] || ''}
                                    onRollChange={v => setInlineRolls(prev => ({ ...prev, [item.folderName]: v }))}
                                    onAssign={() => assignManual(item.folderName)}
                                    saving={saving === item.folderName}
                                    onClick={() => openModal(item)}
                                />
                            ))}
                        </Section>
                    )}

                    <Section title="Flagged" count={flaggedItems.length} accentColor={theme.warning} emptyText="No flagged clusters">
                        {flaggedItems.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                mode={mode}
                                rollValue={inlineRolls[item.folderName] || ''}
                                onRollChange={v => setInlineRolls(prev => ({ ...prev, [item.folderName]: v }))}
                                onAssign={() => assignManual(item.folderName)}
                                saving={saving === item.folderName}
                                onClick={() => openModal(item)}
                                isFlagged
                            />
                        ))}
                    </Section>

                    <Section title="No Face Detected" count={unmatchedItems.length} accentColor={theme.textMuted} emptyText="No undetected clusters">
                        {unmatchedItems.map(item => (
                            <ClusterCard
                                key={item.folderName}
                                item={item}
                                batchName={batchName}
                                photoUrl={photoUrl}
                                erpPhotoUrl={erpPhotoUrl}
                                mode={mode}
                                isUnmatched
                                disabled
                            />
                        ))}
                    </Section>

                    {unprocessed.length > 0 && (
                        <Section title="Unprocessed" count={unprocessed.length} accentColor={theme.textMuted}>
                            {unprocessed.map(item => (
                                <ClusterCard
                                    key={item.folderName}
                                    item={item}
                                    batchName={batchName}
                                    photoUrl={photoUrl}
                                    erpPhotoUrl={erpPhotoUrl}
                                    mode={mode}
                                    disabled
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

// ── Unapproved photo card ────────────────────────────────────────
function UnapprovedPhotoCard({ rollNo, photos, stats, busy, onApprove, onApproveAll }) {
    const allKey    = `${rollNo}::all`;
    const allBusy   = !!busy[allKey];
    const fmtDate = (iso) => {
        if (!iso) return null;
        return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    return (
        <div style={{ background: theme.surface, border: `1px solid ${theme.warning}55`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: theme.fontMono, fontSize: '13px', fontWeight: 700, flex: 1 }}>{rollNo}</span>
                {stats && (
                    <span style={{ fontSize: '10px', color: theme.textMuted }}>
                        {stats.embeddingCount}E · {stats.backupCount}B · {stats.approvedCount}✓
                    </span>
                )}
                <button
                    onClick={onApproveAll}
                    disabled={allBusy}
                    style={{ padding: '4px 10px', borderRadius: 6, border: 'none',
                        background: theme.success, color: '#000', fontSize: '11px',
                        fontWeight: 700, cursor: allBusy ? 'not-allowed' : 'pointer',
                        opacity: allBusy ? 0.5 : 1 }}>
                    {allBusy ? '…' : `Approve All (${photos.length})`}
                </button>
            </div>
            <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                {photos.map(photo => {
                    const photoKey  = `${rollNo}::${photo.filename}`;
                    const photoBusy = !!busy[photoKey] || allBusy;
                    return (
                        <div key={photo.filename} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden',
                            border: `1.5px solid ${theme.warning}55`, opacity: photoBusy ? 0.4 : 1, transition: 'opacity 0.15s' }}>
                            <img src={photo.url} alt={photo.filename}
                                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                                onError={e => { e.target.style.opacity = '0.15'; }} />
                            {photo.addedAt && (
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                                    background: 'rgba(0,0,0,0.65)', padding: '2px 4px',
                                    fontSize: '8px', color: '#ccc', textAlign: 'center' }}>
                                    {fmtDate(photo.addedAt)}
                                </div>
                            )}
                            <button
                                onClick={() => onApprove(rollNo, photo.filename)}
                                disabled={photoBusy}
                                title="Approve & add to embedding"
                                style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22,
                                    borderRadius: '50%', background: theme.success, border: 'none',
                                    color: '#000', cursor: photoBusy ? 'not-allowed' : 'pointer',
                                    fontSize: '12px', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✓</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Section wrapper ───────────────────────────────────────────────
function Section({ title, count, accentColor, children, emptyText }) {
    const [open, setOpen] = useState(true);
    return (
        <div style={{ marginBottom: 32 }}>
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: open ? 14 : 0,
                    cursor: 'pointer', userSelect: 'none',
                }}
            >
                <span style={{
                    fontSize: '10px', color: accentColor,
                    display: 'inline-block', transition: 'transform .18s',
                    transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                }}>▼</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>{title}</span>
                <span style={{
                    fontSize: '12px', fontWeight: 600,
                    background: accentColor + '22', color: accentColor,
                    padding: '2px 8px', borderRadius: 10,
                }}>{count}</span>
            </div>
            {open && (
                count === 0 && emptyText ? (
                    <div style={{ padding: '14px 16px', borderRadius: 8, fontSize: '12px',
                        color: theme.textMuted, background: theme.surface, border: `1px dashed ${theme.border}` }}>
                        {emptyText}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                        {children}
                    </div>
                )
            )}
        </div>
    );
}

// ── Cluster card ──────────────────────────────────────────────────
function ClusterCard({
    item, batchName, photoUrl, erpPhotoUrl, mode,
    onClick, isAssigned, isFlagged, isUnmatched, isMerged, disabled,
    rollValue, onRollChange, onAssign, saving,
    stats, unapprovedCount,
}) {
    const conf           = item.confidence;
    const folderForPhoto = item.currentFolder || item.folderName;
    const previews       = item.previewFiles || [];

    const borderColor = isAssigned   ? theme.success + '44' :
                        isMerged     ? theme.warning + '88' :
                        isFlagged    ? theme.warning + '66' :
                        isUnmatched  ? theme.border  + '88' : theme.border;

    return (
        <div
            onClick={disabled ? undefined : onClick}
            style={{
                background: theme.surface, border: `1px solid ${borderColor}`,
                borderRadius: 10, opacity: disabled ? 0.6 : 1, overflow: 'hidden',
                cursor: disabled ? 'default' : 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = isAssigned ? theme.success : theme.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; }}
        >
            <div style={{ display: 'flex', height: 80, overflow: 'hidden', background: '#000', gap: 1 }}>
                {previews.slice(0, 4).map((f, i) => (
                    <img key={i} src={photoUrl(batchName, folderForPhoto, f)} alt=""
                         style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }}
                         onError={e => { e.target.style.display = 'none'; }} />
                ))}
                {previews.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: theme.textMuted, fontSize: '11px' }}>No images</div>
                )}
            </div>

            <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>
                        {item.folderName}
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{item.imageCount} img</span>
                </div>

                {isAssigned ? (
                    <div>
                        <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.successDim,
                            color: theme.success, fontSize: '12px', fontWeight: 600, textAlign: 'center',
                            marginBottom: stats ? 6 : 0 }}>
                            {item.rollNo}
                        </div>
                        {stats && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 99,
                                    background: theme.accentDim, color: theme.accent }}>{stats.embeddingCount} embed</span>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 99,
                                    background: theme.warningDim, color: theme.warning }}>{stats.backupCount} backup</span>
                                {unapprovedCount > 0 && (
                                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 99,
                                        background: theme.dangerDim, color: theme.danger }}>{unapprovedCount} new</span>
                                )}
                            </div>
                        )}
                    </div>
                ) : isFlagged && mode !== 'manual' ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.warning + '22',
                        color: theme.warning, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                        Flagged
                    </div>
                ) : isUnmatched ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.border + '44',
                                  color: theme.textMuted, fontSize: '11px', textAlign: 'center' }}>
                        ⚠ No face detected
                    </div>
                ) : isMerged ? (
                    <div>
                        <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.warningDim,
                            color: theme.warning, fontSize: '12px', fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>
                            Merged → {item.rollNo}
                        </div>
                        <div style={{ fontSize: '10px', color: theme.textMuted, textAlign: 'center' }}>
                            {item.imageCount} new photo{item.imageCount !== 1 ? 's' : ''} — pending your approval
                        </div>
                    </div>
                ) : item.rollNo && mode !== 'manual' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {item.erpPhoto && (
                            <img src={erpPhotoUrl(item.erpPhoto)} alt="ERP"
                                 style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                                          border: `2px solid ${confidenceColor(conf)}`, flexShrink: 0 }}
                                 onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text,
                                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.rollNo}
                            </div>
                            {conf != null && (
                                <div style={{ fontSize: '11px', color: confidenceColor(conf) }}>
                                    {confidenceLabel(conf)} · {(conf * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <input
                            type="text" placeholder="Roll No e.g. 26TT1234"
                            value={rollValue || ''}
                            onChange={e => onRollChange && onRollChange(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && onAssign) onAssign(); }}
                            style={{ ...styles.input, flex: 1, padding: '6px 10px', fontSize: '12px',
                                fontFamily: theme.fontMono, fontWeight: 700,
                                textTransform: 'uppercase', margin: 0 }}
                        />
                        <button
                            onClick={onAssign}
                            disabled={saving || !(rollValue || '').trim()}
                            style={{ padding: '6px 12px', borderRadius: 6, border: 'none',
                                background: theme.success, color: '#000', fontSize: '12px',
                                fontWeight: 700, cursor: 'pointer',
                                opacity: (saving || !(rollValue || '').trim()) ? 0.4 : 1, flexShrink: 0 }}>
                            {saving ? '...' : 'OK'}
                        </button>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
                width: '100%', maxWidth: 860, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: theme.text }}>Ground Truth — {rollNo}</span>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer' }}>×</button>
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
                            border: `1px solid ${theme.border}`, background: 'transparent',
                            color: theme.textMuted, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
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

// ── Verify Modal ──────────────────────────────────────────────────
function VerifyModal({ item, match, batchName, photoUrl, erpPhotoUrl,
                       overrideRoll, setOverrideRoll,
                       saving, onApprove, onFlag, onClose,
                       hasPrev, hasNext, onPrev, onNext, position, total }) {
    const conf           = match?.confidence;
    const candidates     = match?.candidates || [];
    const folderForPhoto = item.currentFolder || item.folderName;

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft'  && hasPrev && !saving) onPrev();
            if (e.key === 'ArrowRight' && hasNext && !saving) onNext();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [hasPrev, hasNext, saving, onPrev, onNext, onClose]);

    const navBtnStyle = (enabled) => ({
        padding: '4px 10px', borderRadius: 6, border: `1px solid ${theme.border}`,
        background: enabled ? theme.surface : 'transparent',
        color: enabled ? theme.text : theme.textMuted,
        cursor: enabled ? 'pointer' : 'default',
        fontSize: '14px', fontWeight: 700, opacity: enabled ? 1 : 0.3, lineHeight: 1,
    });

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12,
                width: '100%', maxWidth: 760, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderBottom: `1px solid ${theme.border}`, gap: 10 }}>
                    <button onClick={onPrev} disabled={!hasPrev || saving} style={navBtnStyle(hasPrev && !saving)}>&#8592;</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: theme.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: theme.fontMono }}>{item.folderName}</span>
                            <span style={{ fontSize: '12px', color: theme.textMuted, fontWeight: 400 }}>{item.imageCount} imgs</span>
                            {total > 1 && (
                                <span style={{ marginLeft: 'auto', fontSize: '11px', color: theme.textMuted,
                                    background: theme.bg, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                                    {position} / {total}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onNext} disabled={!hasNext || saving} style={navBtnStyle(hasNext && !saving)}>&#8594;</button>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer', marginLeft: 4 }}>×</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted,
                                      marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Extracted Face Images
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                            {(item.previewFiles || []).map((f, i) => (
                                <img key={i} src={photoUrl(batchName, folderForPhoto, f)} alt=""
                                     style={{ width: '100%', aspectRatio: '1', objectFit: 'cover',
                                              borderRadius: 6, border: `1px solid ${theme.border}` }}
                                     onError={e => { e.target.style.display = 'none'; }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted,
                                          marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                ERP Match
                            </div>
                            {match?.erpPhoto ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img src={erpPhotoUrl(match.erpPhoto)} alt="ERP"
                                        style={{ width: 120, height: 120, objectFit: 'cover',
                                                 borderRadius: 8, border: `3px solid ${confidenceColor(conf)}` }}
                                        onError={e => { e.target.style.display = 'none'; }} />
                                    <div style={{ marginTop: 8, fontSize: '15px', fontWeight: 800, color: theme.text }}>
                                        {match.rollNo}
                                    </div>
                                    <div style={{ fontSize: '12px', color: confidenceColor(conf), fontWeight: 600 }}>
                                        {confidenceLabel(conf)} · {(conf * 100).toFixed(1)}%
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '13px', padding: '20px 0' }}>
                                    No ERP match. Enter manually.
                                </div>
                            )}
                        </div>

                        {candidates.length > 1 && (
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600,
                                              marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Other Candidates
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {candidates.slice(1).map((c, i) => (
                                        <div key={i} onClick={() => setOverrideRoll(c.rollNo)}
                                             style={{ display: 'flex', alignItems: 'center', gap: 10,
                                                 padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                                                 background: overrideRoll === c.rollNo ? theme.accentDim : theme.bg,
                                                 border: `1.5px solid ${overrideRoll === c.rollNo ? theme.accent : theme.border}`,
                                                 transition: 'all 0.12s' }}>
                                            {c.erpPhoto && (
                                                <img src={erpPhotoUrl(c.erpPhoto)} alt=""
                                                     style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover',
                                                              flexShrink: 0, border: `2px solid ${confidenceColor(c.confidence)}` }}
                                                     onError={e => { e.target.style.display = 'none'; }} />
                                            )}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: theme.text, fontFamily: theme.fontMono }}>{c.rollNo}</div>
                                                <div style={{ fontSize: '11px', color: confidenceColor(c.confidence), fontWeight: 600, marginTop: 2 }}>
                                                    {confidenceLabel(c.confidence)} · {(c.confidence * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                            {overrideRoll === c.rollNo && (
                                                <span style={{ fontSize: '14px', color: theme.accent }}>✓</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
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
                            <button onClick={onApprove} disabled={saving || !overrideRoll.trim()}
                                style={{ padding: '10px 0', borderRadius: 7, border: 'none',
                                    background: theme.success, color: '#000', fontSize: '13px',
                                    fontWeight: 700, cursor: 'pointer',
                                    opacity: (saving || !overrideRoll.trim()) ? 0.5 : 1 }}>
                                {saving ? 'Assigning...' : 'Approve & Assign'}
                            </button>
                            <button onClick={onFlag} disabled={saving}
                                style={{ padding: '10px 0', borderRadius: 7,
                                    border: `1px solid ${theme.warning}`,
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