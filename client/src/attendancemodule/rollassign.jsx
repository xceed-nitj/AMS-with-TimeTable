import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import getEnvironment from '../getenvironment';
import { DEGREES, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import { useBatchYears } from './useBatchYears';

const apiUrl    = getEnvironment();
const RA_BASE   = `${apiUrl}/attendancemodule/roll-assign`;
const GT_BASE   = `${apiUrl}/attendancemodule/ground-truth`;
const FLAG_BASE = `${apiUrl}/attendancemodule/flags`;
const fetch = (input, init = {}) => window.fetch(input, {
    credentials: 'include',
    ...init,
});

const HIGH   = 0.62;
const MEDIUM = 0.45;

function NoEmbeddingBanner({ info, onDismiss }) {
    return (
        <div style={{
            marginTop: 14,
            padding: '14px 18px',
            borderRadius: 10,
            background: '#fef9c3',
            border: '1.5px solid #f59e0b',
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
        }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#92400e', marginBottom: 4 }}>
                    ERP Embeddings Not Available
                </div>
                <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
                    No pre-built face embeddings were found for batch{' '}
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{info.batch}</span>.
                    Matching cannot run without them.
                    <br />
                    Go to the <strong>ERP Photos</strong> tab and click{' '}
                    <strong>"Generate Embeddings"</strong> for this batch, then come back and try again.
                </div>
                <button
                    onClick={onDismiss}
                    style={{
                        marginTop: 8, padding: '4px 12px', borderRadius: 6,
                        border: '1px solid #d97706', background: 'transparent',
                        color: '#92400e', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}

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

function broadcastRefresh(batchName) {
    try { new BroadcastChannel('attendance_refresh').postMessage({ type: 'refresh', batch: batchName }); } catch (_) {}
}

export default function RollAssign({ fixedDepartment = '' }) {
    const { departments, deptLoading, deptError } = useDepartments();
    const { batchYears, batchYearsLoading } = useBatchYears();

    const [activeTab,      setActiveTab]      = useState('assign');
    const [summary,        setSummary]        = useState([]);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError,   setSummaryError]   = useState(null);

    const [degree,        setDegree]        = useState('BTECH');
    const [department,    setDepartment]    = useState(fixedDepartment);
    const [year,          setYear]          = useState('');

    useEffect(() => {
        if (fixedDepartment) setDepartment(fixedDepartment);
    }, [fixedDepartment]);

    useEffect(() => {
        if (activeTab !== 'summary') return;
        setSummaryLoading(true);
        setSummaryError(null);
        fetch(`${RA_BASE}/summary`)
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load summary')))
            .then(d => setSummary(d.batches || []))
            .catch(e => setSummaryError(e.message))
            .finally(() => setSummaryLoading(false));
    }, [activeTab]);

    const [loading,       setLoading]       = useState(false);
    const [matching,      setMatching]      = useState(false);
    const [matchDone,     setMatchDone]     = useState(false);
    const [matchProgress, setMatchProgress] = useState(null);
    const [saving,        setSaving]        = useState(null);
    const [toast,         setToast]         = useState(null);
    const [matchError,    setMatchError]    = useState(null);
    const [approvingAll,  setApprovingAll]  = useState(false);

    const [unprocessed,    setUnprocessed]    = useState([]);
    const [pendingReview,  setPendingReview]  = useState([]);
    const [approvedItems,  setApprovedItems]  = useState([]);
    const [unmatchedItems, setUnmatchedItems] = useState([]);
    const [crossDeptItems, setCrossDeptItems] = useState([]);
    const [flaggedItems,   setFlaggedItems]   = useState([]);
    const [mergedItems,    setMergedItems]    = useState([]);

    const [unapprovedMap,  setUnapprovedMap]  = useState({});
    const [approvedStats,  setApprovedStats]  = useState({});
    const [approvingPhoto, setApprovingPhoto] = useState({});

    const [matches,      setMatches]      = useState({});

    const [modal,        setModal]        = useState(null);
    const [overrideRoll, setOverrideRoll] = useState('');

    const [flagModal,     setFlagModal]     = useState(null);
    const [flagRollInput, setFlagRollInput] = useState('');

    const [gtModal,    setGtModal]    = useState(null);
   const [noEmbeddingError, setNoEmbeddingError] = useState(null);

    // CHANGE 2: state for edit-roll-no modal on assigned cards
    const [editRollModal,    setEditRollModal]    = useState(null); // { item }
    const [editRollInput,    setEditRollInput]    = useState('');
    const [editRollSaving,   setEditRollSaving]   = useState(false);
    const [deletingAllImgs,  setDeletingAllImgs]  = useState(null); // folderName
    const [erpStatus,        setErpStatus]        = useState({ loading: false, available: null, pklName: null, studentCount: 0 });

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const highConfCount = matchDone
        ? Object.entries(matches).filter(([, m]) => m?.best?.confidence >= HIGH).length
        : 0;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const photoUrl    = (batch, folder, filename) =>
        `${RA_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    const erpPhotoUrl = (filename) =>
        `${RA_BASE}/erp-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(filename)}`;

    const flagPhotoUrl    = (batch, folder, filename) =>
        `${FLAG_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    const flagErpPhotoUrl = (filename) =>
        `${FLAG_BASE}/erp-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(filename)}`;

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

            if (matchRes.ok) {
                const { matchMap = {} } = await matchRes.json();
                const records = Object.values(matchMap);
                setPendingReview(records.filter(r => r.status === 'matched' && !r.approved));
                // CHANGE 3: sort approved by rollNo
                setApprovedItems(records.filter(r => r.approved).sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || '')));
                setUnmatchedItems(records.filter(r => r.status === 'unmatched'));
                setCrossDeptItems(records.filter(r => r.status === 'cross_dept'));
                setFlaggedItems(records.filter(r => r.status === 'flagged'));
                setMergedItems(records.filter(r => r.status === 'merged_unapproved'));
            }

            if (studentsRes.ok) {
                const { students = [] } = await studentsRes.json();
                const uMap = {}, sMap = {};
                for (const s of students) {
                    if (/^person_\d+$/i.test(s.rollNo)) continue;
                    if ((s.unapprovedFiles || []).length > 0) {
                        uMap[s.rollNo] = (s.unapprovedFiles || []).map(f => ({
                            ...f,
                            url: `${GT_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(s.rollNo)}/${encodeURIComponent(f.filename)}`,
                        }));
                    }
                    sMap[s.rollNo] = {
                        approvedCount:   s.approvedCount   || 0,
                        embeddingCount:  s.embeddingCount  || 0,
                        backupCount:     s.backupCount     || 0,
                        unapprovedCount: s.unapprovedCount || 0,
                    };
                }
                setUnapprovedMap(uMap);
                setApprovedStats(sMap);
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [batchName]);

    useEffect(() => { loadClusters(); }, [loadClusters]);

    useEffect(() => {
        if (!batchName) return;
        let ch;
        try {
            ch = new BroadcastChannel('attendance_refresh');
            ch.onmessage = (e) => {
                if (e.data?.type === 'refresh' && e.data?.batch === batchName) loadClusters();
            };
        } catch (_) {}
        return () => { try { ch?.close(); } catch (_) {} };
    }, [batchName, loadClusters]);

    useEffect(() => {
        if (!batchName) { setErpStatus({ loading: false, available: null, pklName: null, studentCount: 0 }); return; }
        setErpStatus(s => ({ ...s, loading: true, available: null }));
        fetch(`${RA_BASE}/erp-embedding/status/${encodeURIComponent(batchName)}`)
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => setErpStatus({ loading: false, available: !!d.available, pklName: d.pklName || null, studentCount: d.studentCount || 0 }))
            .catch(() => setErpStatus({ loading: false, available: null, pklName: null, studentCount: 0 }));
    }, [batchName]);

   const runAutoMatch = useCallback(async () => {
    if (!batchName) return;
    setMatching(true); setMatchDone(false); setMatchError(null);
    setNoEmbeddingError(null);   // clear any previous no-embedding banner
    setMatchProgress({ msg: 'Starting…', done: 0, total: 0, step: 'init' });
    const localMatches = {};
    let sseSucceeded = false, matchCount = 0;
    try {
        const res = await fetch(`${RA_BASE}/auto-match/${batchName}`, { method: 'POST' });
        if (!res.ok) {
            const d = await res.json();
            // ── Structured "no embedding" error ──────────────────────────
            if (d.noEmbedding) {
                setNoEmbeddingError({ batch: d.batch, department: d.department });
                return;
            }
            throw new Error(d.error || 'Match failed');
        }
        const reader = res.body.getReader();
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
                localMatches[evt.folder] = evt.match; matchCount++;
                try {
                    const sr = await fetch(`${RA_BASE}/save-match-result`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ batch: batchName, folderName: evt.folder, matchData: evt.match }),
                    });
                    if (sr.ok) {
                        setMatches(prev => ({ ...prev, [evt.folder]: evt.match }));
                        setMatchProgress(p => ({ ...p, msg: `Saved ${matchCount} matches...`, done: matchCount }));
                    }
                } catch (_) {}
            } else if (evt.type === 'done') {
                sseSucceeded = true; setMatchDone(true);
                showToast(`✓ Matched ${matchCount} clusters — saved to database`);
            } else if (evt.type === 'error') { throw new Error(evt.msg); }
        };
        while (true) {
            const { done, value } = await reader.read();
            if (done) { buf += decoder.decode(); for (const l of buf.split('\n')) await processLine(l); break; }
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n'); buf = lines.pop();
            for (const l of lines) await processLine(l);
        }
        if (sseSucceeded && matchCount > 0) {
            setMatchProgress({ msg: 'Renaming folders…', done: matchCount, total: matchCount, step: 'saving' });
            const ar = await fetch(`${RA_BASE}/auto-assign-all`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, matches: localMatches }),
            });
            const ad = await ar.json();
            if (!ar.ok) showToast(`⚠ Matching saved, but rename failed: ${ad.error}`, 'warning');
            else showToast(`✓ ${ad.renamed} clusters auto-assigned` + (ad.unmatched ? `, ${ad.unmatched} unmatched` : '') + (ad.conflicts ? `, ${ad.conflicts} conflicts` : ''));
            await loadClusters();
        }
    } catch (err) {
        setMatchError(err.message); showToast(err.message, 'error');
        setTimeout(() => loadClusters(), 500);
    } finally { setMatching(false); setMatchProgress(null); }
}, [batchName, loadClusters]);

    const reviewQueue = [...pendingReview, ...mergedItems, ...flaggedItems];

    const openModal = (item) => {
        if (matching) return;
        setModal({ item, match: item }); setOverrideRoll(item.rollNo || '');
    };
    const openQueueItem = (queue, currentFolderName, direction) => {
        const idx = queue.findIndex(r => r.folderName === currentFolderName);
        const next = queue[idx + direction];
        if (next) { setModal({ item: next, match: next }); setOverrideRoll(next.rollNo || ''); }
        else setModal(null);
    };

    const openFlagModal = (item) => {
        if (matching) return;
        setFlagModal(item); setFlagRollInput(item.suggestedRollNo || '');
    };
    const openFlaggedItem = (direction) => {
        if (!flagModal) return;
        const idx  = flaggedItems.findIndex(f => f.folderName === flagModal.folderName);
        const next = flaggedItems[idx + direction];
        if (next) { setFlagModal(next); setFlagRollInput(next.suggestedRollNo || ''); }
    };

    const handleFlagResolve = async (folderName, rollNo) => {
        const trimmed = rollNo.trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number', 'error'); return; }
        setSaving(folderName);
        try {
            const res  = await fetch(`${FLAG_BASE}/resolve-flag`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, folderName, rollNo: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            broadcastRefresh(batchName);
            const currentIndex = flaggedItems.findIndex(f => f.folderName === folderName);
            const remaining    = flaggedItems.filter(f => f.folderName !== folderName);
            setFlaggedItems(remaining);
            if (remaining.length > 0) {
                const nextItem = remaining[Math.min(currentIndex, remaining.length - 1)];
                setFlagModal(nextItem); setFlagRollInput('');
            } else { setFlagModal(null); }
            showToast(data.rollNo, 'success');
            await loadClusters();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    const handleFlagFolderDeleted = () => {
        broadcastRefresh(batchName);
        const remaining = flaggedItems.filter(f => f.folderName !== flagModal?.folderName);
        setFlaggedItems(remaining);
        if (remaining.length > 0) { setFlagModal(remaining[0]); setFlagRollInput(remaining[0].suggestedRollNo || ''); }
        else setFlagModal(null);
    };

    const deleteUnmatchedFolder = async (item) => {
        if (!window.confirm(
            `Delete folder "${item.folderName}" permanently?\n\nRemoves all photos, DB record and flag entry. Cannot be undone.`
        )) return;
        setSaving(item.folderName);
        try {
            const folder = item.currentFolder || item.folderName;
            const res = await fetch(
                `${FLAG_BASE}/cluster/${encodeURIComponent(batchName)}/${encodeURIComponent(item.folderName)}`,
                { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentFolder: folder }) }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted "${item.folderName}" permanently`);
            setUnmatchedItems(prev => prev.filter(r => r.folderName !== item.folderName));
            broadcastRefresh(batchName);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    // CHANGE 8: delete unprocessed folder
    const deleteUnprocessedFolder = async (item) => {
        if (!window.confirm(`Delete unprocessed folder "${item.folderName}" permanently?\n\nThis cannot be undone.`)) return;
        setSaving(item.folderName);
        try {
            const res = await fetch(
                `${RA_BASE}/cluster/${encodeURIComponent(batchName)}/${encodeURIComponent(item.folderName)}`,
                { method: 'DELETE' }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted "${item.folderName}"`);
            setUnprocessed(prev => prev.filter(r => r.folderName !== item.folderName));
            broadcastRefresh(batchName);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    const handleApprove = async (item, rollNo) => {
        const { folderName, _id } = item;
        const trimmed = (rollNo || '').trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number', 'error'); return; }
        if (!_id)     { showToast('Cluster ID missing — reload', 'error'); return; }

        // CHANGE 5: check if roll no already approved
        const alreadyApproved = approvedItems.find(a => a.rollNo === trimmed);
        if (alreadyApproved) {
            const choice = window.confirm(
                `⚠ Ground truth for "${trimmed}" already exists!\n\nClick OK to merge photos into the existing folder.\nClick Cancel to abort.`
            );
            if (!choice) return;
        }

        setSaving(folderName);
        const queueSnapshot = [...pendingReview, ...mergedItems, ...flaggedItems];
        try {
            const res  = await fetch(`${RA_BASE}/approve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: _id, rollNo: trimmed, mergeIfExists: !!alreadyApproved }),
            });
            let data; try { data = await res.json(); } catch { data = {}; }
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
            const found = queueSnapshot.find(r => r.folderName === folderName);
            setPendingReview(prev => prev.filter(r => r.folderName !== folderName));
            setMergedItems(prev  => prev.filter(r => r.folderName !== folderName));
            setFlaggedItems(prev => prev.filter(r => r.folderName !== folderName));
            if (found && !alreadyApproved) {
                setApprovedItems(prev => [...prev, { ...found, rollNo: data.rollNo || trimmed, approved: true, status: 'approved' }]
                    .sort((a, b) => (a.rollNo || '').localeCompare(b.rollNo || '')));
            }
            showToast(alreadyApproved ? `Merged into ${trimmed}` : (data.rollNo || trimmed), 'success');
            setModal(null);
            await loadClusters();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    const handleFlag = async (item, match) => {
        const { folderName, _id } = item;
        if (!_id) { showToast('Cluster ID missing — reload', 'error'); return; }
        setSaving(folderName);
        const queueSnapshot = [...pendingReview, ...mergedItems, ...flaggedItems];
        try {
            const res = await fetch(`${RA_BASE}/flag`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: _id,
                    suggestedRollNo: match?.rollNo     || match?.best?.rollNo     || null,
                    confidence:      match?.confidence || match?.best?.confidence || null,
                    reason: 'operator_rejected',
                }),
            });
            let data; try { data = await res.json(); } catch { data = {}; }
            if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
            const alreadyFlagged = flaggedItems.some(r => r.folderName === folderName);
            const found = queueSnapshot.find(r => r.folderName === folderName);
            setPendingReview(prev => prev.filter(r => r.folderName !== folderName));
            setMergedItems(prev  => prev.filter(r => r.folderName !== folderName));
            if (found && !alreadyFlagged) setFlaggedItems(prev => [...prev, { ...found, status: 'flagged' }]);
            showToast(found?.rollNo || folderName, 'flag');
            openQueueItem(queueSnapshot, folderName, +1);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setSaving(null); }
    };

    const approveAllHigh = async () => {
        if (!matchDone) { showToast('Run ERP match first', 'error'); return; }
        const seen = new Map();
        for (const r of pendingReview.filter(r => matches[r.folderName]?.best?.confidence >= HIGH)) {
            const c = { _id: r._id, folderName: r.folderName, match: matches[r.folderName] };
            const roll = c.match.best.rollNo;
            const prev = seen.get(roll);
            if (!prev || c.match.best.confidence > prev.match.best.confidence) seen.set(roll, c);
        }
        const toApprove = [...seen.values()];
        if (!toApprove.length) { showToast('No high-confidence matches found', 'error'); return; }
        const lines = toApprove.map(c => `${c.folderName} -> ${c.match.best.rollNo} (${(c.match.best.confidence*100).toFixed(0)}%)`).join('\n');
        if (!window.confirm(`Approve all ${toApprove.length} high-confidence matches?\n\n${lines}`)) return;
        setApprovingAll(true);
        try {
            const res = await fetch(`${RA_BASE}/bulk-assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, assignments: toApprove.map(c => ({ id: c._id, folderName: c.folderName, rollNo: c.match.best.rollNo })) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Auto-assigned ${data.assigned} high-confidence clusters`);
            await loadClusters();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setApprovingAll(false); }
    };

    const openGtModal = (rollNo) => {
        setGtModal({ rollNo });
    };

  

    const approvePhoto = useCallback(async (rollNo, filename) => {
        const key = `${rollNo}::${filename}`;
        setApprovingPhoto(prev => ({ ...prev, [key]: true }));
        try {
            const res  = await fetch(`${GT_BASE}/approve-photos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, rollNo, filenames: [filename] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Approved & added to embedding`);
            setUnapprovedMap(prev => {
                const u = { ...(prev[rollNo] ? { [rollNo]: prev[rollNo].filter(f => f.filename !== filename) } : {}) };
                if (u[rollNo]?.length === 0) delete u[rollNo];
                return { ...prev, ...u };
            });
            setApprovedStats(prev => ({ ...prev, [rollNo]: { ...prev[rollNo], approvedCount: (prev[rollNo]?.approvedCount || 0) + 1, embeddingCount: (prev[rollNo]?.embeddingCount || 0) + 1, unapprovedCount: Math.max(0, (prev[rollNo]?.unapprovedCount || 1) - 1) } }));
        } catch (err) { showToast(err.message, 'error'); }
        finally { setApprovingPhoto(prev => { const n = { ...prev }; delete n[key]; return n; }); }
    }, [batchName]);

    const approveAllPhotos = useCallback(async (rollNo, files) => {
        if (!files?.length) return;
        const allKey = `${rollNo}::all`;
        setApprovingPhoto(prev => ({ ...prev, [allKey]: true }));
        try {
            const res  = await fetch(`${GT_BASE}/approve-photos`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, rollNo, filenames: files.map(f => f.filename) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Approved ${files.length} photo(s) for ${rollNo}`);
            setUnapprovedMap(prev => { const n = { ...prev }; delete n[rollNo]; return n; });
            setApprovedStats(prev => ({ ...prev, [rollNo]: { approvedCount: data.approvedCount || 0, embeddingCount: data.embeddingCount || 0, backupCount: data.backupCount || 0, unapprovedCount: 0 } }));
        } catch (err) { showToast(err.message, 'error'); }
        finally { setApprovingPhoto(prev => { const n = { ...prev }; delete n[allKey]; return n; }); }
    }, [batchName]);

    // CHANGE 2: delete all images for an assigned roll no
    const handleDeleteAllImages = async (item) => {
        if (!window.confirm(`Delete cluster "${item.rollNo}" permanently?\n\nThis removes all photos from disk and the assignment record from DB. Cannot be undone.`)) return;
        if (!item._id) { showToast('Cluster ID missing — reload the page', 'error'); return; }
        setDeletingAllImgs(item.folderName);
        try {
            const res  = await fetch(`${RA_BASE}/cluster/${encodeURIComponent(item._id)}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted cluster for ${item.rollNo}`);
            setApprovedItems(prev => prev.filter(r => r.folderName !== item.folderName));
            setFlaggedItems(prev => prev.filter(r => r.folderName !== item.folderName));
            setApprovedStats(prev => { const n = { ...prev }; delete n[item.rollNo]; return n; });
            broadcastRefresh(batchName);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setDeletingAllImgs(null); }
    };

    // CHANGE 2: edit roll no for an assigned item
    const handleEditRollSave = async () => {
        const trimmed = editRollInput.trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number', 'error'); return; }
        if (!editRollModal?._id) { showToast('Cluster ID missing', 'error'); return; }
        setEditRollSaving(true);
        try {
            const res  = await fetch(`${RA_BASE}/approve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editRollModal._id, rollNo: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`Roll no updated to ${trimmed}`);
            setEditRollModal(null);
            await loadClusters();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setEditRollSaving(false); }
    };

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>
          {toast && !modal && !flagModal && (
                <>
                <style>{`
                    @keyframes slideDown {
                        from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
                        to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                `}</style>
                <div style={{
                    position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 9000, pointerEvents: 'none',
                    animation: 'slideDown 0.22s cubic-bezier(0.16,1,0.3,1)',
                    minWidth: 300, maxWidth: 400,
                    background: toast.type === 'error' ? '#ef4444' : toast.type === 'flag' ? '#f59e0b' : '#22c55e',
                    borderRadius: 8,
                    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                    border: 'none',
                    padding: '12px 20px',
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                        {toast.type === 'error' ? 'Error' : toast.type === 'flag' ? 'Flagged' : 'Success'}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>
                        {toast.msg}
                    </div>
                </div>
                </>
            )}  
            
                      {modal && createPortal((() => {
                const queueIdx = reviewQueue.findIndex(r => r.folderName === modal.item.folderName);
                return (
                    <VerifyModal
                        item={modal.item} match={modal.match} batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                        overrideRoll={overrideRoll} setOverrideRoll={setOverrideRoll}
                        saving={saving === modal.item.folderName}
                        onApprove={() => handleApprove(modal.item, overrideRoll)}
                        onFlag={() => handleFlag(modal.item, modal.match)}
                        onClose={() => setModal(null)}
                        hasPrev={queueIdx > 0} hasNext={queueIdx < reviewQueue.length - 1}
                        onPrev={() => openQueueItem(reviewQueue, modal.item.folderName, -1)}
                        onNext={() => openQueueItem(reviewQueue, modal.item.folderName, +1)}
                        position={queueIdx + 1} total={reviewQueue.length}
                        toast={toast}
                    />
                );
            })(), document.body)}

            {flagModal && createPortal((() => {
                const idx = flaggedItems.findIndex(f => f.folderName === flagModal.folderName);
                return (
                    <FlagResolveModal
                        item={flagModal} batchName={batchName}
                        flagPhotoUrl={flagPhotoUrl} flagErpPhotoUrl={flagErpPhotoUrl}
                        rollInput={flagRollInput} setRollInput={setFlagRollInput}
                        saving={saving === flagModal.folderName}
                        onResolve={() => handleFlagResolve(flagModal.folderName, flagRollInput)}
                        onClose={() => setFlagModal(null)}
                        hasPrev={idx > 0} hasNext={idx < flaggedItems.length - 1}
                        onPrev={() => openFlaggedItem(-1)} onNext={() => openFlaggedItem(+1)}
                        position={idx + 1} total={flaggedItems.length}
                        showToast={showToast}
                        toast={toast}
                        onFolderDeleted={handleFlagFolderDeleted}
                        onPhotoDeleted={(filename) => {
                            setFlagModal(prev => ({
                                ...prev,
                                previewFiles: (prev.previewFiles || []).filter(f => f !== filename),
                                imageFiles:   (prev.imageFiles   || []).filter(f => f !== filename),
                            }));
                        }}
                    />
                );
            })(), document.body)}

          {gtModal && createPortal(
                <GTModal
                    rollNo={gtModal.rollNo}
                    batchName={batchName}
                    onClose={() => { setGtModal(null); loadClusters(); }}
                    showToast={showToast}
                    onMoved={loadClusters}
                />,
                document.body
            )}

            {/* CHANGE 2: Edit Roll No modal */}
            {editRollModal && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                    onClick={e => { if (e.target === e.currentTarget) setEditRollModal(null); }}>
                    <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 28, width: 340 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: 12 }}>Edit Roll Number</div>
                        <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: '#fefce8', border: '1px solid #fbbf24', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                                <path d="M8 1.5L14.5 13H1.5L8 1.5z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round"/>
                                <line x1="8" y1="6" x2="8" y2="9.5" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round"/>
                                <circle cx="8" cy="11.5" r="0.7" fill="#d97706"/>
                            </svg>
                            <span style={{ fontSize: '11.5px', color: '#92400e', lineHeight: 1.5 }}>
                                Changing the roll number will rename the cluster folder and re-link all associated images. Existing embeddings tied to the old roll number will be affected. Proceed only if you are sure.
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: 8 }}>Current: <span style={{ fontFamily: theme.fontMono, color: theme.text, fontWeight: 700 }}>{editRollModal.rollNo}</span></div>
                        <input
                            autoFocus
                            value={editRollInput}
                            onChange={e => setEditRollInput(e.target.value.toUpperCase())}
                            onKeyDown={e => { if (e.key === 'Enter') handleEditRollSave(); if (e.key === 'Escape') setEditRollModal(null); }}
                            placeholder="New roll number"
                            style={{ ...styles.input, marginBottom: 16, fontFamily: theme.fontMono, fontWeight: 700, fontSize: '15px' }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setEditRollModal(null)} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleEditRollSave} disabled={editRollSaving || !editRollInput.trim()} style={{ flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', background: theme.success, color: '#000', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: (editRollSaving || !editRollInput.trim()) ? 0.5 : 1 }}>
                                {editRollSaving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div style={{ marginBottom: 16 }}>
                <div style={styles.heading}>Roll Assignment</div>
                <div style={styles.subheading}>Assign roll numbers to face clusters and track progress across batches</div>
            </div>

            <div className="ams-tabs">
                <button className={`ams-tab${activeTab === 'assign' ? ' active' : ''}`} onClick={() => setActiveTab('assign')}>Assign</button>
                <button className={`ams-tab${activeTab === 'summary' ? ' active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
            </div>

            {activeTab === 'assign' && (<>
            <div style={{ ...styles.card, marginBottom: 20 }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: fixedDepartment ? '1fr 1fr auto' : '1fr 1fr 1fr auto',
                    gap: 16,
                    alignItems: 'end',
                }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    {!fixedDepartment && (
                        <div>
                            <label style={styles.label}>Department</label>
                            <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select} disabled={deptLoading}>
                                <option value="">{deptLoading ? 'Loading…' : deptError ? 'Error' : 'Select...'}</option>
                                {departments.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
                            </select>
                            {deptError && <div style={{ fontSize: '11px', color: theme.danger, marginTop: 3 }}>{deptError}</div>}
                        </div>
                    )}
                    <div>
                        <label style={styles.label}>Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select...</option>
                            {batchYearsLoading
                                ? <option>Loading…</option>
                                : batchYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <button onClick={runAutoMatch} disabled={matching || !batchName || unprocessed.length === 0 || (!erpStatus.loading && erpStatus.available === false)}
                        style={{ ...styles.btnPrimary, padding: '9px 20px', fontSize: '13px', opacity: (matching || !batchName || unprocessed.length === 0 || (!erpStatus.loading && erpStatus.available === false)) ? 0.5 : 1 }}>
                        {matching ? '🔄 Matching…' : `🔍 Match with ERP Photos${unprocessed.length > 0 ? ` (${unprocessed.length})` : ''}`}
                    </button>
                </div>

                {batchName && !matching && (
                    erpStatus.loading ? (
                        <div style={{ marginTop: 10, fontSize: '11px', color: theme.textMuted }}>Checking ERP embeddings…</div>
                    ) : erpStatus.available === true ? (
                        <div style={{ marginTop: 10, padding: '7px 14px', borderRadius: 6, background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '12px' }}>✓ ERP embeddings ready</span>
                            {erpStatus.studentCount > 0 && <span style={{ fontSize: '12px', color: '#15803d' }}>{erpStatus.studentCount} students</span>}
                            {erpStatus.pklName && <span style={{ fontFamily: theme.fontMono, fontSize: '11px', color: '#166534', background: '#dcfce7', padding: '2px 7px', borderRadius: 4 }}>{erpStatus.pklName}</span>}
                        </div>
                    ) : erpStatus.available === false ? (
                        <div style={{ marginTop: 10, padding: '7px 14px', borderRadius: 6, background: '#fef9c3', border: '1.5px solid #f59e0b', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={{ fontSize: '16px', flexShrink: 0, lineHeight: 1 }}>⚠️</span>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '12px', color: '#92400e' }}>ERP embeddings not built for this batch</div>
                                <div style={{ fontSize: '11px', color: '#78350f', lineHeight: 1.5, marginTop: 2 }}>Go to <strong>ERP Upload → Summary</strong> → click <strong>"Re-Generate Embeddings"</strong> for this batch, then return here to match.</div>
                            </div>
                        </div>
                    ) : null
                )}

                {matchDone && highConfCount > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                        <button onClick={approveAllHigh} disabled={approvingAll} style={{ padding: '6px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', background: theme.success, color: '#000', opacity: approvingAll ? 0.5 : 1 }}>
                            {approvingAll ? 'Assigning...' : `Approve All High (${highConfCount})`}
                        </button>
                    </div>
                )}

                {matching && matchProgress && (
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.textMuted, marginBottom: 4 }}>
                            <span>{matchProgress.msg}</span>
                            {matchProgress.total > 0 && <span style={{ fontFamily: theme.fontMono }}>{matchProgress.done}/{matchProgress.total}</span>}
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: theme.border, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: matchProgress.step === 'erp' ? theme.warning : theme.accent, width: matchProgress.total > 0 ? `${(matchProgress.done / matchProgress.total) * 100}%` : '5%', transition: 'width 0.3s' }} />
                        </div>
                    </div>
                )}

                {matchError && <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: '#3f1212', color: '#f87171', fontSize: '12px' }}>{matchError}</div>}

                {noEmbeddingError && (
                    <NoEmbeddingBanner
                        info={noEmbeddingError}
                        onDismiss={() => setNoEmbeddingError(null)}
                    />
                )}

                {!matching && pendingReview.length > 0 && (
                    <div style={{ marginTop: 12, padding: '8px 14px', borderRadius: 6, background: theme.successDim, border: `1px solid ${theme.success}44`, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ color: theme.success, fontWeight: 700, fontSize: '13px' }}>✓ Auto-assignment done</span>
                        <span style={{ color: theme.textMuted, fontSize: '12px' }}>{pendingReview.length} pending review · click any card to verify and approve</span>
                    </div>
                )}
                {!matching && unprocessed.length > 0 && (
                    <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 7, background: theme.accentDim, border: `1px solid ${theme.accent}44`, fontSize: '12px', color: theme.textMuted }}>
                        <strong style={{ color: theme.accent }}>{unprocessed.length} unprocessed clusters</strong> — click <strong>Match with ERP Photos</strong> to auto-assign them
                    </div>
                )}
            </div>

            {loading && <div style={{ ...styles.card, textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}>Loading folders...</div>}

            {!loading && batchName && (
                <>
                    {/* CHANGE 7: Pending Review — no roll no field shown in cards, just click to open modal */}
                    <Section title="Pending Review" count={pendingReview.length} accentColor={theme.accent} emptyText="No clusters pending review">
                        {pendingReview.map(item => (
                            <ClusterCard key={item.folderName} item={item} batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                                onClick={() => openModal(item)} disabled={matching} />
                        ))}
                    </Section>

                    {Object.keys(unapprovedMap).length > 0 && (
                        <Section title="New Photos — Pending Approval" count={Object.values(unapprovedMap).reduce((s, a) => s + a.length, 0)} accentColor={theme.warning}>
                            {Object.entries(unapprovedMap).map(([rollNo, photos]) => (
                                <UnapprovedPhotoCard key={rollNo} rollNo={rollNo} photos={photos} stats={approvedStats[rollNo]}
                                    busy={approvingPhoto} onApprove={approvePhoto} onApproveAll={() => approveAllPhotos(rollNo, photos)} />
                            ))}
                        </Section>
                    )}

                    {/* CHANGE 1+2+3: Approved — sorted, no folder name, with Delete All + Edit Roll No */}
                    <Section title="Approved" count={approvedItems.length} accentColor={theme.success} emptyText="No approved clusters yet">
                        {approvedItems.map(item => (
                            <ClusterCard key={item.folderName} item={item} batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                                isAssigned stats={approvedStats[item.rollNo]} unapprovedCount={unapprovedMap[item.rollNo]?.length || 0}
                                onClick={() => openGtModal(item.rollNo)}
                                onDeleteAllImages={() => handleDeleteAllImages(item)}
                                deletingAllImages={deletingAllImgs === item.folderName}
                                onEditRoll={() => { setEditRollModal(item); setEditRollInput(item.rollNo || ''); }}
                            />
                        ))}
                    </Section>

                    {mergedItems.length > 0 && (
                        <Section title="Merged — Pending Review" count={mergedItems.length} accentColor={theme.warning} emptyText="">
                            {mergedItems.map(item => (
                                <ClusterCard key={item.folderName} item={item} batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                                    isMerged onClick={() => openModal(item)} />
                            ))}
                        </Section>
                    )}

                    <Section title="Flagged" count={flaggedItems.length} accentColor={theme.warning} emptyText="No flagged clusters">
                        {flaggedItems.map(item => (
                            <FlaggedClusterCard key={item.folderName} item={item} batchName={batchName}
                                flagPhotoUrl={flagPhotoUrl} onClick={() => openFlagModal(item)}
                                onEditRoll={() => { setEditRollModal(item); setEditRollInput(item.rollNo || ''); }}
                                onDeleteAllImages={() => handleDeleteAllImages(item)}
                                deletingAllImages={deletingAllImgs === item.folderName} />
                        ))}
                    </Section>

                    <Section title="No Face Detected" count={unmatchedItems.length} accentColor={theme.textMuted} emptyText="No undetected clusters">
                        {unmatchedItems.map(item => (
                            <ClusterCard key={item.folderName} item={item} batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                                isUnmatched
                                onDeleteFolder={() => deleteUnmatchedFolder(item)}
                                deletingFolder={saving === item.folderName} />
                        ))}
                    </Section>

                    <Section title="Unmatched Cluster" count={crossDeptItems.length} accentColor="#a78bfa" emptyText="No cross-department clusters">
                        {crossDeptItems.map(item => (
                            <CrossDeptCard key={item.folderName} item={item} batchName={batchName} photoUrl={photoUrl}
                                saving={saving === item.folderName}
                                onApprove={(rollNo) => handleApprove(item, rollNo)}
                                onDeleteFolder={() => deleteUnmatchedFolder(item)}
                                deletingFolder={saving === item.folderName} />
                        ))}
                    </Section>

                    {/* CHANGE 7+8: Unprocessed — no roll no field, delete folder button */}
                    {unprocessed.length > 0 && (
                        <Section title="Unprocessed" count={unprocessed.length} accentColor={theme.textMuted}>
                            {unprocessed.map(item => (
                                <ClusterCard key={item.folderName} item={item} batchName={batchName} photoUrl={photoUrl} erpPhotoUrl={erpPhotoUrl}
                                    isUnprocessed
                                    onDeleteFolder={() => deleteUnprocessedFolder(item)}
                                    deletingFolder={saving === item.folderName} />
                            ))}
                        </Section>
                    )}

                    {!unprocessed.length && !pendingReview.length && !approvedItems.length && !unmatchedItems.length && !crossDeptItems.length && !flaggedItems.length && (
                        <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
                            <div style={{ fontSize: '36px', opacity: 0.3, marginBottom: 12 }}>📷</div>
                            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>No ground truth data found for this batch</div>
                            <div style={{ fontSize: '13px', color: theme.textMuted, marginBottom: 12 }}>Run <strong>Ground Truth Capture</strong> first to generate face clusters, then return here to assign roll numbers.</div>
                            <a href="/attendance/groundtruth/rtsp" style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 7, background: theme.accent, color: '#fff', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                                Go to Ground Truth Capture →
                            </a>
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
            </>)}

            {activeTab === 'summary' && (
                <SummaryPanel summary={summary} summaryLoading={summaryLoading} summaryError={summaryError} />
            )}
        </div>
    );
}

// ── Summary tab helpers ───────────────────────────────────────────

function parseBatch(batch) {
    const parts = (batch || '').split('_');
    if (parts.length < 3) return { degree: parts[0] || batch, dept: batch, year: '' };
    return { degree: parts[0], dept: parts.slice(1, -1).join('_'), year: parts[parts.length - 1] };
}

function SummaryPanel({ summary, summaryLoading, summaryError }) {
    if (summaryLoading) return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: theme.textMuted, fontSize: '14px' }}>Loading summary…</div>
    );
    if (summaryError) return (
        <div style={{ ...styles.card, color: '#ef4444', padding: 20, fontSize: '13px' }}>Error: {summaryError}</div>
    );
    if (!summary.length) return (
        <div style={{ ...styles.card, textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '36px', opacity: 0.3, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>No data yet</div>
            <div style={{ fontSize: '13px', color: theme.textMuted }}>Run roll assignment to see batch statistics</div>
        </div>
    );

    const groups = {};
    for (const row of summary) {
        const { dept } = parseBatch(row.batch);
        if (!groups[dept]) groups[dept] = [];
        groups[dept].push(row);
    }
    const sortedDepts = Object.keys(groups).sort();

    const badge = (val, color) => (
        <span style={{ fontWeight: 700, color: val > 0 ? color : theme.textMuted }}>{val}</span>
    );

    return (
        <div>
            {sortedDepts.map(dept => {
                const rows = groups[dept].slice().sort((a, b) => a.batch.localeCompare(b.batch));
                const totals = rows.reduce((acc, r) => ({
                    total:      acc.total     + r.total,
                    approved:   acc.approved  + r.approved,
                    pending:    acc.pending   + r.pending,
                    flagged:    acc.flagged   + r.flagged,
                    unmatched:  acc.unmatched + r.unmatched,
                    cross_dept: acc.cross_dept + (r.cross_dept || 0),
                }), { total: 0, approved: 0, pending: 0, flagged: 0, unmatched: 0, cross_dept: 0 });

                return (
                    <div key={dept} style={{ ...styles.card, marginBottom: 24, overflow: 'hidden', padding: 0 }}>
                        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: theme.text }}>{dept.replace(/_/g, ' ')}</div>
                            <div style={{ fontSize: '12px', color: theme.textMuted }}>{rows.length} batch{rows.length !== 1 ? 'es' : ''}</div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="ams-table">
                                <thead>
                                    <tr>
                                        <th>Batch</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                        <th style={{ textAlign: 'right', color: theme.success }}>Approved</th>
                                        <th style={{ textAlign: 'right', color: '#f59e0b' }}>Pending Review</th>
                                        <th style={{ textAlign: 'right', color: theme.warning }}>Flagged</th>
                                        <th style={{ textAlign: 'right', color: '#a78bfa' }}>Diff Dept</th>
                                        <th style={{ textAlign: 'right' }}>Unmatched</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(r => {
                                        const { degree, year } = parseBatch(r.batch);
                                        return (
                                            <tr key={r.batch}>
                                                <td>{degree} {year}</td>
                                                <td style={{ textAlign: 'right' }}>{r.total}</td>
                                                <td style={{ textAlign: 'right' }}>{badge(r.approved,           theme.success)}</td>
                                                <td style={{ textAlign: 'right' }}>{badge(r.pending,            '#f59e0b')}</td>
                                                <td style={{ textAlign: 'right' }}>{badge(r.flagged,            theme.warning)}</td>
                                                <td style={{ textAlign: 'right' }}>{badge(r.cross_dept || 0,   '#a78bfa')}</td>
                                                <td style={{ textAlign: 'right', color: theme.textMuted }}>{r.unmatched}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</td>
                                        <td style={{ textAlign: 'right' }}>{totals.total}</td>
                                        <td style={{ textAlign: 'right' }}>{badge(totals.approved,   theme.success)}</td>
                                        <td style={{ textAlign: 'right' }}>{badge(totals.pending,    '#f59e0b')}</td>
                                        <td style={{ textAlign: 'right' }}>{badge(totals.flagged,    theme.warning)}</td>
                                        <td style={{ textAlign: 'right' }}>{badge(totals.cross_dept, '#a78bfa')}</td>
                                        <td style={{ textAlign: 'right', color: theme.textMuted }}>{totals.unmatched}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────

function FlaggedClusterCard({ item, batchName, flagPhotoUrl, onClick, onEditRoll, onDeleteAllImages, deletingAllImages }) {
    const folder    = item.currentFolder || item.folderName;
    const flaggedAt = item.flaggedAt ? new Date(item.flaggedAt).toLocaleDateString() : '';
    return (
        <div onClick={onClick} style={{ background: theme.surface, border: `1px solid ${theme.warning}55`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = theme.warning; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = theme.warning + '55'; }}>
            <div style={{ display: 'flex', height: 80, background: '#000', gap: 1, overflow: 'hidden' }}>
                {(item.previewFiles || []).slice(0, 4).map((f, i) => (
                    <img key={i} src={flagPhotoUrl(batchName, folder, f)} alt="" style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                ))}
                {!(item.previewFiles || []).length && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '11px' }}>No images</div>
                )}
            </div>
            <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>{item.folderName}</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{item.imageCount} img</span>
                </div>
                {flaggedAt && <div style={{ fontSize: '10px', color: theme.textMuted, marginBottom: 6 }}>Flagged {flaggedAt}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 99, background: theme.warning + '22', color: theme.warning, fontWeight: 600 }}>⚑ Flagged</span>
                    <button title="Delete cluster" onClick={e => { e.stopPropagation(); onDeleteAllImages && onDeleteAllImages(); }}
                        disabled={deletingAllImages}
                        style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #f87171', background: '#ffffff', color: '#f87171', cursor: deletingAllImages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: deletingAllImages ? 0.5 : 1 }}>
                        {deletingAllImages ? '…' : (
                            <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                <line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FlagResolveModal({ item, batchName, flagPhotoUrl, flagErpPhotoUrl, rollInput, setRollInput, saving, onResolve, onClose, hasPrev, hasNext, onPrev, onNext, position, total, showToast, toast, onFolderDeleted, onPhotoDeleted }) {
    const folder     = item.currentFolder || item.folderName;
    const conf       = item.confidence;
    const candidates = item.candidates || [];

    const [editMode,       setEditMode]       = useState(false);
    const [allPhotos,      setAllPhotos]      = useState([]);
    const [loadingPhotos,  setLoadingPhotos]  = useState(false);
    const [deleting,       setDeleting]       = useState(null);
    const [deletingFolder, setDeletingFolder] = useState(false);

    useEffect(() => {
        if (!editMode) return;
        const load = async () => {
            setLoadingPhotos(true);
            try {
                const res  = await fetch(`${FLAG_BASE}/all-clusters/${batchName}`);
                const data = await res.json();
                if (res.ok) {
                    const found = (data.clusters || []).find(c => c.folderName === item.folderName || c.folderName === folder);
                    if (found) { setAllPhotos((found.imageFiles || []).map(f => typeof f === 'string' ? f : f.filename)); return; }
                }
            } catch (_) {}
            setAllPhotos(item.imageFiles?.length ? item.imageFiles : item.previewFiles || []);
        };
        load().finally(() => setLoadingPhotos(false));
    }, [editMode, batchName, item.folderName, folder, item.imageFiles, item.previewFiles]);

    const deletePhoto = async (filename) => {
        if (!window.confirm(`Delete "${filename}"?`)) return;
        setDeleting(filename);
        try {
            const res  = await fetch(`${FLAG_BASE}/cluster-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            setAllPhotos(prev => prev.filter(f => f !== filename));
            onPhotoDeleted(filename);
            showToast(`Deleted ${filename}`);
        } catch (err) { showToast(err.message, 'error'); }
        finally { setDeleting(null); }
    };

    const deleteFolder = async () => {
        if (!window.confirm(`Delete entire folder "${item.folderName}" and remove from database?\n\nThis cannot be undone.`)) return;
        setDeletingFolder(true);
        try {
            const res  = await fetch(`${FLAG_BASE}/cluster/${encodeURIComponent(batchName)}/${encodeURIComponent(item.folderName)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentFolder: folder }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted "${item.folderName}" and removed from DB`);
            onFolderDeleted();
        } catch (err) { showToast(err.message, 'error'); setDeletingFolder(false); }
    };

    useEffect(() => {
        const handler = (e) => {
            if (editMode) return;
            if (e.key === 'ArrowLeft'  && hasPrev && !saving) onPrev();
            if (e.key === 'ArrowRight' && hasNext && !saving) onNext();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [hasPrev, hasNext, saving, onPrev, onNext, onClose, editMode]);

    const navBtn = (enabled) => ({ padding: '3px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: enabled ? theme.surface : 'transparent', color: enabled ? theme.text : theme.textMuted, cursor: enabled ? 'pointer' : 'default', fontSize: '13px', fontWeight: 700, opacity: enabled ? 1 : 0.3, lineHeight: 1 });

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 64, paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            {toast && <InModalToast toast={toast} />}
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, width: '100%', maxWidth: editMode ? 860 : 740, maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'max-width 0.2s' }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${theme.border}`, gap: 8 }}>
                    {!editMode && <button onClick={onPrev} disabled={!hasPrev || saving} style={navBtn(hasPrev && !saving)}>&#8592;</button>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: theme.text, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: theme.fontMono }}>{item.folderName}</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, background: theme.warning + '22', color: theme.warning, padding: '2px 7px', borderRadius: 8 }}>Flagged</span>
                            {!editMode && total > 1 && <span style={{ marginLeft: 'auto', fontSize: '11px', color: theme.textMuted, background: theme.bg, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{position} / {total}</span>}
                            {editMode && <span style={{ marginLeft: 4, fontSize: '11px', fontWeight: 600, background: '#3f1212', color: '#f87171', padding: '2px 8px', borderRadius: 8 }}>Edit Mode</span>}
                        </div>
                    </div>
                    {editMode && <button onClick={() => setEditMode(false)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Back</button>}
                    {!editMode && <button onClick={onNext} disabled={!hasNext || saving} style={navBtn(hasNext && !saving)}>&#8594;</button>}
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '18px', cursor: 'pointer', marginLeft: 2 }}>x</button>
                </div>

                {editMode ? (
                    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                        {item.suggestedRollNo && (
                            <div style={{ marginBottom: 14, padding: '8px 14px', borderRadius: 8, background: '#3f1212', border: '1px solid #f87171', fontSize: '12px' }}>
                                <span style={{ color: '#f87171' }}>Rejected suggestion: </span>
                                <span style={{ color: theme.text, fontWeight: 700 }}>{item.suggestedRollNo}</span>
                                {item.confidence != null && <span style={{ color: '#f87171', marginLeft: 6 }}>({(item.confidence * 100).toFixed(0)}%)</span>}
                            </div>
                        )}
                        <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: 12 }}>
                            {loadingPhotos ? 'Loading photos…' : `${allPhotos.length} photo(s) — click the trash icon to delete from disk and DB`}
                        </div>
                        {loadingPhotos ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>Loading…</div>
                        ) : allPhotos.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: theme.textMuted }}>No photos in this folder</div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                                {allPhotos.map(filename => (
                                    <div key={filename} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${theme.border}`, opacity: deleting === filename ? 0.25 : 1, transition: 'opacity 0.15s' }}>
                                        <img src={flagPhotoUrl(batchName, folder, filename)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.opacity = '0.15'; }} />
                                        <button onClick={() => deletePhoto(filename)} disabled={!!deleting} title="Delete this photo" style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 5, background: '#ffffff', border: '1.5px solid #f87171', color: '#f87171', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                            <svg width="11" height="12" viewBox="0 0 12 13" fill="none"><path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                                        </button>
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', padding: '3px 5px', fontSize: '8px', color: '#ccc', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{filename}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extracted Face Images</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                                {(item.previewFiles || []).map((f, i) => (
                                    <div key={f + i} style={{ position: 'relative' }}>
                                        <img src={flagPhotoUrl(batchName, folder, f)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, border: `1px solid ${theme.border}`, display: 'block', opacity: deleting === f ? 0.2 : 1, transition: 'opacity 0.15s' }} onError={e => { e.target.style.opacity = '0.1'; }} />
                                        <button
                                            onClick={() => {
                                                if (!window.confirm(`Delete this photo?\nRemoves from disk + database.`)) return;
                                                setDeleting(f);
                                                fetch(`${FLAG_BASE}/cluster-photo/${encodeURIComponent(batchName)}/${encodeURIComponent(folder)}/${encodeURIComponent(f)}`, { method: 'DELETE' })
                                                    .then(r => r.json()).then(d => { if (d.ok) { onPhotoDeleted(f); showToast(`Deleted ${f}`); } else showToast(d.error || 'Delete failed', 'error'); })
                                                    .catch(err => showToast(err.message, 'error')).finally(() => setDeleting(null));
                                            }}
                                            disabled={!!deleting} title="Delete this photo"
                                            style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 5, background: '#ffffff', border: '1.5px solid #f87171', color: '#f87171', cursor: deleting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                            <svg width="11" height="12" viewBox="0 0 12 13" fill="none"><path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                                            </button>
                                    </div>
                                ))}
                                {!(item.previewFiles || []).length && <div style={{ gridColumn: '1 / -1', padding: '30px 0', textAlign: 'center', color: theme.textMuted, fontSize: '12px' }}>No preview images</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <button onClick={() => setEditMode(true)} style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>✏ Edit All Photos</button>
                                <button onClick={deleteFolder} disabled={deletingFolder} style={{ flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid #f87171', background: '#ffffff', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: deletingFolder ? 'not-allowed' : 'pointer', opacity: deletingFolder ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    {deletingFolder ? 'Deleting…' : (<>
                                        <svg width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                                        Delete Folder
                                    </>)}
                                </button>
                            </div>
                            <div style={{ fontSize: '10px', color: '#f8717177', textAlign: 'center' }}>Delete Folder removes all photos, DB record &amp; flag entry permanently</div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {item.suggestedRollNo ? 'ERP Match (Rejected → Select New)' : 'ERP Match'}
                                </div>
                                {(() => {
                                    const selCand = candidates.find(c => c.rollNo === rollInput);
                                    const showPhoto = selCand?.erpPhoto || (rollInput === item.suggestedRollNo ? item.erpPhoto : null) || item.erpPhoto || null;
                                    const showConf  = selCand?.confidence ?? conf;
                                    const showRoll  = rollInput || item.suggestedRollNo;
                                    if (!showPhoto && !item.suggestedRollNo && candidates.length === 0) return (
                                        <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '12px', padding: '16px 0', borderRadius: 8, background: theme.bg, border: `1px dashed ${theme.border}` }}>No ERP suggestion</div>
                                    );
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: rollInput ? theme.successDim : '#3f121255', border: `2px solid ${rollInput ? theme.success : '#f8717155'}`, transition: 'all 0.2s' }}>
                                            {showPhoto
                                                ? <img src={flagErpPhotoUrl(showPhoto)} alt="ERP" style={{ width: 68, height: 68, objectFit: 'cover', flexShrink: 0, borderRadius: 7, border: `2.5px solid ${rollInput ? theme.success : confidenceColor(showConf)}`, transition: 'all 0.2s' }} onError={e => { e.target.style.opacity = '0.3'; }} />
                                                : <div style={{ width: 68, height: 68, borderRadius: 7, flexShrink: 0, background: '#3f1212', border: '2px solid #f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#f87171', textAlign: 'center', padding: 4 }}>No photo</div>
                                            }
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: rollInput ? theme.success : '#f87171', fontFamily: theme.fontMono, textDecoration: !rollInput && item.suggestedRollNo ? 'line-through' : 'none' }}>{showRoll || '—'}</div>
                                                {showConf != null && <div style={{ fontSize: '11px', color: confidenceColor(showConf), fontWeight: 600, marginTop: 2 }}>{confidenceLabel(showConf)} · {(showConf * 100).toFixed(1)}%</div>}
                                                <div style={{ fontSize: '10px', marginTop: 2, color: rollInput ? theme.success : '#f87171', fontWeight: 600 }}>{rollInput ? '✓ Selected' : '✕ Rejected'}</div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {candidates.length > 0 && (
                                <div>
                                    <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidates — <span style={{ textTransform: 'none', fontWeight: 400 }}>click to select</span></div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {candidates.map((c, i) => {
                                            const isSelected = rollInput === c.rollNo;
                                            return (
                                                <div key={i} onClick={() => setRollInput(isSelected ? '' : c.rollNo)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 7, cursor: 'pointer', background: isSelected ? theme.successDim : theme.bg, border: `2px solid ${isSelected ? theme.success : theme.border}`, transition: 'all 0.15s' }}>
                                                    {c.erpPhoto && <img src={flagErpPhotoUrl(c.erpPhoto)} alt="" style={{ width: 44, height: 44, borderRadius: 5, objectFit: 'cover', flexShrink: 0, border: `2px solid ${confidenceColor(c.confidence)}` }} onError={e => { e.target.style.display = 'none'; }} />}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '12px', fontWeight: 700, color: isSelected ? theme.success : theme.text, fontFamily: theme.fontMono }}>{c.rollNo}</div>
                                                        <div style={{ fontSize: '10px', color: confidenceColor(c.confidence), fontWeight: 600, marginTop: 1 }}>{confidenceLabel(c.confidence)} · {(c.confidence * 100).toFixed(1)}%</div>
                                                    </div>
                                                    {isSelected && <span style={{ fontSize: '16px', color: theme.success, fontWeight: 900 }}>✓</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {rollInput ? (
                                <div style={{ padding: '8px 12px', borderRadius: 7, background: theme.successDim, border: `1.5px solid ${theme.success}66`, fontSize: '15px', fontWeight: 800, color: theme.success, fontFamily: theme.fontMono, textAlign: 'center' }}>
                                    {rollInput}
                                </div>
                            ) : (
                                <div style={{ padding: '8px 12px', borderRadius: 7, background: theme.border + '33', border: `1.5px dashed ${theme.border}`, fontSize: '11px', color: theme.textMuted, textAlign: 'center' }}>
                                    Select a candidate to assign
                                </div>
                            )}

                            <div style={{ marginTop: 'auto' }}>
                                <button onClick={onResolve} disabled={saving || !rollInput.trim()} style={{ width: '100%', padding: '10px 0', borderRadius: 7, border: 'none', background: theme.success, color: '#000', fontSize: '13px', fontWeight: 700, cursor: rollInput.trim() ? 'pointer' : 'not-allowed', opacity: (saving || !rollInput.trim()) ? 0.45 : 1 }}>
                                    {saving ? 'Saving…' : '✓ Assign & Resolve'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function UnapprovedPhotoCard({ rollNo, photos, stats, busy, onApprove, onApproveAll }) {
    const allKey  = `${rollNo}::all`;
    const allBusy = !!busy[allKey];
    const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    return (
        <div style={{ background: theme.surface, border: `1px solid ${theme.warning}55`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: theme.fontMono, fontSize: '13px', fontWeight: 700, flex: 1 }}>{rollNo}</span>
                {stats && <span style={{ fontSize: '10px', color: theme.textMuted }}>{stats.embeddingCount}E · {stats.backupCount}B · {stats.approvedCount}✓</span>}
                <button onClick={onApproveAll} disabled={allBusy} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: theme.success, color: '#000', fontSize: '11px', fontWeight: 700, cursor: allBusy ? 'not-allowed' : 'pointer', opacity: allBusy ? 0.5 : 1 }}>
                    {allBusy ? '…' : `Approve All (${photos.length})`}
                </button>
            </div>
            <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
                {photos.map(photo => {
                    const photoKey  = `${rollNo}::${photo.filename}`;
                    const photoBusy = !!busy[photoKey] || allBusy;
                    return (
                        <div key={photo.filename} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: `1.5px solid ${theme.warning}55`, opacity: photoBusy ? 0.4 : 1, transition: 'opacity 0.15s' }}>
                            <img src={photo.url} alt={photo.filename} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.opacity = '0.15'; }} />
                            {photo.addedAt && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.65)', padding: '2px 4px', fontSize: '8px', color: '#ccc', textAlign: 'center' }}>{fmtDate(photo.addedAt)}</div>}
                            <button onClick={() => onApprove(rollNo, photo.filename)} disabled={photoBusy} title="Approve & add to embedding" style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: theme.success, border: 'none', color: '#000', cursor: photoBusy ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✓</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function Section({ title, count, accentColor, children, emptyText }) {
    const [open, setOpen] = useState(true);
    return (
        <div style={{ marginBottom: 32 }}>
            <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: open ? 14 : 0, cursor: 'pointer', userSelect: 'none' }}>
                <span style={{ fontSize: '10px', color: accentColor, display: 'inline-block', transition: 'transform .18s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: theme.text }}>{title}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, background: accentColor + '22', color: accentColor, padding: '2px 8px', borderRadius: 10 }}>{count}</span>
            </div>
            {open && (count === 0 && emptyText
                ? <div style={{ padding: '14px 16px', borderRadius: 8, fontSize: '12px', color: theme.textMuted, background: theme.surface, border: `1px dashed ${theme.border}` }}>{emptyText}</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>{children}</div>
            )}
        </div>
    );
}

// CHANGE 1+2+7+8: ClusterCard updated — no folder name for assigned, delete+edit buttons for assigned, delete for unprocessed
function ClusterCard({ item, batchName, photoUrl, erpPhotoUrl, onClick, isAssigned, isUnmatched, isUnprocessed, isMerged, disabled, stats, unapprovedCount, onDeleteFolder, deletingFolder, onDeleteAllImages, deletingAllImages, onEditRoll }) {
    const folderForPhoto = item.currentFolder || item.folderName;
    const previews       = item.previewFiles || [];
    const borderColor    = isAssigned ? theme.success + '44' : isMerged ? theme.warning + '88' : (isUnmatched || isUnprocessed) ? theme.border + '88' : theme.border;

    return (
        <div
            onClick={(isUnmatched || isUnprocessed || disabled) ? undefined : onClick}
            style={{ background: theme.surface, border: `1px solid ${borderColor}`, borderRadius: 10, opacity: disabled && !isUnmatched && !isUnprocessed ? 0.6 : 1, overflow: 'hidden', cursor: (isUnmatched || isUnprocessed || (disabled && !isUnmatched && !isUnprocessed)) ? 'default' : 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => { if (!disabled || isUnmatched || isUnprocessed) e.currentTarget.style.borderColor = isAssigned ? theme.success : (isUnmatched || isUnprocessed) ? '#f8717155' : theme.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = borderColor; }}
        >
            <div style={{ display: 'flex', height: 80, overflow: 'hidden', background: '#000', gap: 1 }}>
                {previews.slice(0, 4).map((f, i) => (
                    <img key={i} src={photoUrl(batchName, folderForPhoto, f)} alt="" style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                ))}
                {previews.length === 0 && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '11px' }}>No images</div>}
            </div>

            <div style={{ padding: '10px 12px' }}>
                {/* CHANGE 1: for assigned cards, hide folder name, show only image count */}
                {!isAssigned && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>{item.folderName}</span>
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>{item.imageCount} img</span>
                    </div>
                )}

                {isAssigned ? (
                    <div>
                        {/* CHANGE 1: show only roll no, no folder name */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.successDim, color: theme.success, fontSize: '13px', fontWeight: 700, flex: 1, textAlign: 'center' }}>{item.rollNo}</div>
                            <span style={{ fontSize: '11px', color: theme.textMuted, marginLeft: 8 }}>{item.imageCount} img</span>
                        </div>
                        {stats && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 99, background: theme.accentDim, color: theme.accent }}>{stats.embeddingCount} embed</span>
                                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 99, background: theme.warningDim, color: theme.warning }}>{stats.backupCount} backup</span>
                                {unapprovedCount > 0 && <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 99, background: theme.dangerDim, color: theme.danger }}>{unapprovedCount} new</span>}
                            </div>
                        )}
                        {/* icon-only edit + delete */}
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                            <button
                                title="Edit roll number"
                                onClick={e => { e.stopPropagation(); onEditRoll && onEditRoll(); }}
                                style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #3b82f6', background: '#ffffff', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8.5 1.5a1.2 1.2 0 011.7 1.7L3.5 10H1.5V8L8.5 1.5z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                                    <line x1="7" y1="3" x2="9" y2="5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                </svg>
                            </button>
                            <button
                                title="Delete all images"
                                onClick={e => { e.stopPropagation(); onDeleteAllImages && onDeleteAllImages(); }}
                                disabled={deletingAllImages}
                                style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #f87171', background: '#ffffff', color: '#f87171', cursor: deletingAllImages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, opacity: deletingAllImages ? 0.5 : 1 }}>
                                {deletingAllImages ? '…' : (
                                    <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                        <line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                ) : isUnmatched ? (
                    <div>
                        <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.border + '44', color: theme.textMuted, fontSize: '11px', textAlign: 'center', marginBottom: 8 }}>⚠ No face detected</div>
                        <button
                            onClick={e => { e.stopPropagation(); onDeleteFolder && onDeleteFolder(); }}
                            disabled={deletingFolder}
                            style={{ width: '100%', padding: '7px 0', borderRadius: 6, border: '1px solid #f87171', background: '#ffffff', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: deletingFolder ? 'not-allowed' : 'pointer', opacity: deletingFolder ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                        >
                            {deletingFolder ? <><Spinner /> Deleting…</> : (<><svg width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>Delete Folder Permanently</>)}
                        </button>
                    </div>
                ) : isUnprocessed ? (
                    /* CHANGE 7+8: unprocessed — no roll no field, just delete button */
                    <div>
                        <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.border + '44', color: theme.textMuted, fontSize: '11px', textAlign: 'center', marginBottom: 8 }}>Unprocessed</div>
                        <button
                            onClick={e => { e.stopPropagation(); onDeleteFolder && onDeleteFolder(); }}
                            disabled={deletingFolder}
                            style={{ width: '100%', padding: '7px 0', borderRadius: 6, border: '1px solid #f87171', background: '#ffffff', color: '#f87171', fontSize: '12px', fontWeight: 700, cursor: deletingFolder ? 'not-allowed' : 'pointer', opacity: deletingFolder ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                        >
                            {deletingFolder ? <><Spinner /> Deleting…</> : (<><svg width="12" height="13" viewBox="0 0 12 13" fill="none"><path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>Delete Folder</>)}
                        </button>
                    </div>
                ) : isMerged ? (
                    <div>
                        <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.warningDim, color: theme.warning, fontSize: '12px', fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>Merged → {item.rollNo}</div>
                        <div style={{ fontSize: '10px', color: theme.textMuted, textAlign: 'center' }}>{item.imageCount} new photo{item.imageCount !== 1 ? 's' : ''} — click to review</div>
                    </div>
                ) : (
                    /* CHANGE 7: pending review — no roll no input field in card, just prompt to click */
                    <div style={{ padding: '5px 8px', borderRadius: 5, background: theme.accentDim, color: theme.accent, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                        Click to review &amp; assign
                    </div>
                )}
            </div>
        </div>
    );
}

// CHANGE 4+9: GTModal with delete photo + move photo (embedding ↔ backup) tabs
function GTModal({ rollNo, batchName, onClose, showToast, onMoved }) {
    const [loading,    setLoading]    = useState(true);
    const [student,    setStudent]    = useState(null);
    const [busy,       setBusy]       = useState(null);
    const [doneSaving, setDoneSaving] = useState(false);

    const fetchStudent = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${GT_BASE}/batches/${encodeURIComponent(batchName)}/students`);
            const data = await res.json();
            const found = (data.students || []).find(s => s.rollNo === rollNo);
            if (found) setStudent(found);
            else showToast('Student not found', 'error');
        } catch { showToast('Failed to load', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchStudent(); }, [rollNo, batchName]);

   const movePhoto = (filename, currentType) => {
        setStudent(prev => {
            if (!prev) return prev;
            const embFiles  = prev.embeddingFiles || [];
            const backFiles = prev.backupFiles    || [];
            const othFiles  = prev.untrackedFiles || [];

            if (currentType === 'embedding') {
                // embedding → backup
                const moved = embFiles.find(f => f.filename === filename);
                if (!moved) return prev;
                if (embFiles.length <= 1) { showToast('Must keep at least one embedding image', 'error'); return prev; }
                return { ...prev, embeddingFiles: embFiles.filter(f => f.filename !== filename), backupFiles: [...backFiles, { ...moved }] };
            } else {
                // backup/other → embedding
                if (embFiles.length >= 5) { showToast('Maximum 5 embedding images allowed', 'error'); return prev; }
                const srcArr = currentType === 'backup' ? backFiles : othFiles;
                const moved  = srcArr.find(f => f.filename === filename);
                if (!moved) return prev;
                const newBack = currentType === 'backup' ? backFiles.filter(f => f.filename !== filename) : backFiles;
                const newOth  = currentType === 'other'  ? othFiles.filter(f => f.filename !== filename)  : othFiles;
                return { ...prev, embeddingFiles: [...embFiles, { ...moved }], backupFiles: newBack, untrackedFiles: newOth };
            }
        });
    };

    const deletePhoto = async (filename) => {
        if (!window.confirm(`Delete "${filename}" from ${rollNo}?\nRemoves from disk and DB.`)) return;
        const key = `${rollNo}::${filename}`;
        setBusy(key);
        try {
            const res  = await fetch(`${GT_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(rollNo)}/${encodeURIComponent(filename)}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Delete failed');
            showToast(`Deleted ${filename}`);
            await fetchStudent();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setBusy(null); }
    };
    const handleDone = async () => {
        if (!student) return;
        const currentEmbedding = (student.embeddingFiles || []).map(f => f.filename);
        if (currentEmbedding.length === 0) { showToast('Must keep at least one embedding image', 'error'); return; }
        setDoneSaving(true);
        try {
            const res  = await fetch(`${GT_BASE}/update-embedding`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: batchName, rollNo, embeddingFiles: currentEmbedding }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`✓ Embedding approved — ${currentEmbedding.length} active`);
            onMoved && onMoved();
            onClose();
        } catch (err) { showToast(err.message, 'error'); }
        finally { setDoneSaving(false); }
    };

    const embCount   = (student?.embeddingFiles || []).length;
    const backCount  = (student?.backupFiles    || []).length;
    const othCount   = (student?.untrackedFiles || []).length;
    const totalCount = embCount + backCount + othCount;

    const photoUrl = (filename) =>
        `${GT_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(rollNo)}/${encodeURIComponent(filename)}`;

    const PhotoCard = ({ photo, type }) => {
        const busyKey = `${rollNo}::${photo.filename}`;
        const isBusy  = busy === busyKey;
        const isEmbed = type === 'embedding';
        const isOther = type === 'other';
        const borderC = isEmbed ? theme.success : isOther ? theme.border : theme.warning;
        return (
            <div style={{ background: theme.bg, border: `1.5px solid ${borderC}33`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: isBusy ? 0.45 : 1, transition: 'opacity 0.15s' }}>
                <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
                    <img src={photoUrl(photo.filename)} alt={photo.filename} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.opacity = '0.15'; }} />
                    <button onClick={() => deletePhoto(photo.filename)} disabled={isBusy} title="Delete photo"
                        style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 5, background: '#ffffff', border: `1.5px solid ${theme.danger}`, color: theme.danger, cursor: isBusy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 3h9M4 3V2h3v1M2 3l.6 7.5a.5.5 0 00.5.5h4.8a.5.5 0 00.5-.5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            <line x1="4.5" y1="5.5" x2="4.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                            <line x1="6.5" y1="5.5" x2="6.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>
                <div style={{ padding: '4px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: '9px', fontFamily: theme.fontMono, color: theme.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.filename}</div>
                    {photo.score != null && <span style={{ fontSize: '9px', color: theme.accent, background: theme.accentDim, padding: '1px 4px', borderRadius: 3, alignSelf: 'flex-start' }}>{photo.score.toFixed(2)}</span>}
                    <button onClick={() => movePhoto(photo.filename, type)} disabled={isBusy}
                        style={{ padding: '3px 0', fontSize: '9px', fontWeight: 700, background: isEmbed ? theme.warningDim : theme.successDim, color: isEmbed ? theme.warning : theme.success, border: `1px solid ${isEmbed ? theme.warning + '44' : theme.success + '44'}`, borderRadius: 4, cursor: isBusy ? 'not-allowed' : 'pointer', width: '100%' }}>
                        {isEmbed ? '→ Backup' : '↑ Embedding'}
                    </button>
                </div>
            </div>
        );
    };

    const SectionRow = ({ label, color, bg, photos, type, empty }) => (
        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${color}33` }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                <span style={{ fontSize: '11px', padding: '1px 8px', borderRadius: 99, background: bg, color, fontWeight: 700 }}>{photos.length}</span>
            </div>
            {photos.length === 0
                ? <div style={{ fontSize: '12px', color: theme.textMuted, padding: '10px 0' }}>{empty}</div>
                : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                    {photos.map(p => <PhotoCard key={p.filename} photo={p} type={type} />)}
                  </div>
            }
        </div>
    );

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.80)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, paddingTop: 72 }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, width: '100%', maxWidth: 960, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontWeight: 700, fontSize: '15px' }}>Ground Truth — <span style={{ fontFamily: theme.fontMono }}>{rollNo}</span></span>
                        {student && (
                            <div style={{ display: 'flex', gap: 6 }}>
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 99, background: theme.successDim, color: theme.success, fontWeight: 700 }}>{embCount} embedding</span>
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 99, background: theme.warningDim, color: theme.warning, fontWeight: 700 }}>{backCount} backup</span>
                                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: 99, background: theme.border, color: theme.textMuted, fontWeight: 700 }}>{totalCount} total</span>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '20px', cursor: 'pointer' }}>×</button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>Loading…</div>}

                    {!loading && totalCount === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>No photos found</div>
                    )}

                    {!loading && student && (
                        <>
                            <SectionRow label="Embedding" color={theme.success} bg={theme.successDim}
                                photos={student.embeddingFiles || []} type="embedding"
                                empty="No embedding images — move some from Backup" />
                            <SectionRow label="Backup" color={theme.warning} bg={theme.warningDim}
                                photos={student.backupFiles || []} type="backup"
                                empty="No backup images" />
                            {othCount > 0 && (
                                <SectionRow label="Other" color={theme.textMuted} bg={theme.border}
                                    photos={student.untrackedFiles || []} type="other"
                                    empty="" />
                            )}
                        </>
                    )}
                </div>

               {/* Footer */}
                <div style={{ padding: '14px 20px', borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', color: theme.textMuted }}>
                        {student ? `${embCount} embedding · ${backCount} backup` : ''}
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 7, border: `1px solid ${theme.border}`, background: 'transparent', color: theme.textMuted, fontSize: '13px', cursor: 'pointer' }}>Close</button>
                        <button onClick={handleDone} disabled={doneSaving || !student} style={{ padding: '8px 24px', borderRadius: 7, border: 'none', background: theme.success, color: '#000', fontSize: '13px', fontWeight: 700, cursor: (doneSaving || !student) ? 'not-allowed' : 'pointer', opacity: (doneSaving || !student) ? 0.5 : 1 }}>
                            {doneSaving ? 'Saving…' : '✓ Done'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InModalToast({ toast }) {
    const accent = toast.type === 'success' ? '#22c55e' : toast.type === 'flag' ? '#f59e0b' : '#ef4444';
    const label  = toast.type === 'success' ? 'Success' : toast.type === 'flag' ? 'Flagged' : 'Error';
    return (
        <>
        <style>{`
            @keyframes slideDown {
                from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `}</style>
        <div style={{
           position: 'fixed', top: 96, left: '50%',
            zIndex: 9000, pointerEvents: 'none',
            animation: 'slideDown 0.22s cubic-bezier(0.16,1,0.3,1)',
            minWidth: 300, maxWidth: 400,
            background: accent,
            borderRadius: 8,
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            border: 'none',
            padding: '12px 20px',
        }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.02em' }}>{toast.msg}</div>
        </div>
        </>
    );
}

function VerifyModal({ item, match, batchName, photoUrl, erpPhotoUrl, overrideRoll, setOverrideRoll, saving, onApprove, onFlag, onClose, hasPrev, hasNext, onPrev, onNext, position, total, toast }) {
    const conf           = match?.confidence;
    const allCandidates  = match?.candidates || [];
    const candMap        = {};
    allCandidates.forEach(c => { candMap[c.rollNo] = c; });
    const primaryMatch   = allCandidates[0] || (match?.rollNo ? match : null);
    const otherCands     = allCandidates.slice(1);
    const displayPhoto   = match?.erpPhoto || primaryMatch?.erpPhoto || null;
    const displayConf    = conf;
    const displayRoll    = match?.rollNo || primaryMatch?.rollNo || null;
    const folderForPhoto = item.currentFolder || item.folderName;
    const [candOpen, setCandOpen] = useState(false);
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowLeft'  && hasPrev && !saving) onPrev();
            if (e.key === 'ArrowRight' && hasNext && !saving) onNext();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [hasPrev, hasNext, saving, onPrev, onNext, onClose]);
    const navBtn = (enabled) => ({ padding: '3px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: enabled ? theme.surface : 'transparent', color: enabled ? theme.text : theme.textMuted, cursor: enabled ? 'pointer' : 'default', fontSize: '13px', fontWeight: 700, opacity: enabled ? 1 : 0.3, lineHeight: 1 });
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 64, paddingLeft: 16, paddingRight: 16, paddingBottom: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            {toast && <InModalToast toast={toast} />}
            <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 12, width: '100%', maxWidth: 720, maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${theme.border}`, gap: 8, flexShrink: 0 }}>
                    <button onClick={onPrev} disabled={!hasPrev || saving} style={navBtn(hasPrev && !saving)}>&#8592;</button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: theme.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: theme.fontMono }}>{item.folderName}</span>
                            <span style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 400 }}>{item.imageCount} imgs</span>
                            {total > 1 && <span style={{ marginLeft: 'auto', fontSize: '10px', color: theme.textMuted, background: theme.bg, padding: '2px 7px', borderRadius: 10, whiteSpace: 'nowrap' }}>{position} / {total}</span>}
                        </div>
                    </div>
                    <button onClick={onNext} disabled={!hasNext || saving} style={navBtn(hasNext && !saving)}>&#8594;</button>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: '18px', cursor: 'pointer', marginLeft: 2 }}>×</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 250px', gap: 16 }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extracted Face Images</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
                            {(item.previewFiles || []).map((f, i) => (
                                <img key={i} src={photoUrl(batchName, folderForPhoto, f)} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, border: `1px solid ${theme.border}` }} onError={e => { e.target.style.display = 'none'; }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ERP Match</div>
                            {displayPhoto ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: theme.bg, border: `2px solid ${confidenceColor(displayConf) + '55'}` }}>
                                    <img src={erpPhotoUrl(displayPhoto)} alt="ERP" style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0, borderRadius: 6, border: `2.5px solid ${confidenceColor(displayConf)}` }} onError={e => { e.target.style.opacity = '0.3'; }} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: theme.text, fontFamily: theme.fontMono }}>{displayRoll || '—'}</div>
                                        {displayConf != null && <div style={{ fontSize: '11px', color: confidenceColor(displayConf), fontWeight: 600, marginTop: 3 }}>{confidenceLabel(displayConf)} · {(displayConf * 100).toFixed(1)}%</div>}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: '12px', padding: '10px 0', borderRadius: 8, background: theme.bg, border: `1px dashed ${theme.border}` }}>No ERP match</div>
                            )}
                        </div>
                        {allCandidates.length > 0 && (
                            <div style={{ borderRadius: 8, border: `1px solid ${theme.border}`, overflow: 'hidden' }}>
                                <button onClick={() => setCandOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: theme.bg, border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <span>Candidates ({allCandidates.length})</span>
                                    <span style={{ fontSize: '9px', transition: 'transform 0.2s', display: 'inline-block', transform: candOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>▼</span>
                                </button>
                                {candOpen && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '6px' }}>
                                        {allCandidates.map((c, i) => {
                                            const isSel = overrideRoll === c.rollNo;
                                            return (
                                                <div key={i} onClick={() => setOverrideRoll(isSel ? '' : c.rollNo)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 7px', borderRadius: 6, cursor: 'pointer', background: isSel ? theme.successDim : theme.surface, border: `2px solid ${isSel ? theme.success : theme.border}`, transition: 'all 0.15s' }}>
                                                    {c.erpPhoto && <img src={erpPhotoUrl(c.erpPhoto)} alt="" style={{ width: 34, height: 34, borderRadius: 4, objectFit: 'cover', flexShrink: 0, border: `2px solid ${confidenceColor(c.confidence)}` }} onError={e => { e.target.style.display = 'none'; }} />}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: isSel ? theme.success : theme.text, fontFamily: theme.fontMono }}>{c.rollNo}</div>
                                                        <div style={{ fontSize: '10px', color: confidenceColor(c.confidence), fontWeight: 600 }}>{confidenceLabel(c.confidence)} · {(c.confidence * 100).toFixed(1)}%</div>
                                                    </div>
                                                    {isSel && <span style={{ fontSize: '13px', color: theme.success, fontWeight: 900 }}>✓</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: theme.textMuted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Roll Number</div>
                            <input
                                value={overrideRoll}
                                onChange={e => setOverrideRoll(e.target.value.toUpperCase())}
                                placeholder="Select candidate or type roll no."
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: `1.5px solid ${overrideRoll.trim() ? theme.success : theme.border}`, background: overrideRoll.trim() ? theme.successDim : theme.bg, color: overrideRoll.trim() ? theme.success : theme.text, fontSize: '14px', fontWeight: 800, fontFamily: theme.fontMono, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                            <button onClick={onApprove} disabled={saving || !overrideRoll.trim()} style={{ padding: '9px 0', borderRadius: 7, border: 'none', background: theme.success, color: '#000', fontSize: '13px', fontWeight: 700, cursor: overrideRoll.trim() ? 'pointer' : 'not-allowed', opacity: (saving || !overrideRoll.trim()) ? 0.45 : 1 }}>
                                {saving ? 'Assigning...' : 'Approve & Assign'}
                            </button>
                            <button onClick={onFlag} disabled={saving} style={{ padding: '9px 0', borderRadius: 7, border: `1px solid ${theme.warning}`, background: 'transparent', color: theme.warning, fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                                Flag as Incorrect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CrossDeptCard({ item, batchName, photoUrl, saving, onApprove, onDeleteFolder, deletingFolder }) {
    const folderForPhoto = item.currentFolder || item.folderName;
    const previews       = item.previewFiles || [];

    return (
        <div style={{
            background: theme.surface,
            border: `1px solid #a78bfa55`,
            borderRadius: 10,
            overflow: 'hidden',
            transition: 'border-color 0.15s',
        }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#a78bfa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#a78bfa55'; }}
        >
            {/* Preview strip */}
            <div style={{ display: 'flex', height: 80, overflow: 'hidden', background: '#000', gap: 1 }}>
                {previews.slice(0, 4).map((f, i) => (
                    <img key={i} src={photoUrl(batchName, folderForPhoto, f)} alt="" style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                ))}
                {previews.length === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textMuted, fontSize: '11px' }}>No images</div>
                )}
            </div>

            <div style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>{item.folderName}</span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>{item.imageCount} img</span>
                </div>

                {/* Badge */}
                <div style={{ marginBottom: 8, padding: '3px 8px', borderRadius: 5, background: '#a78bfa22', color: '#a78bfa', fontSize: '11px', fontWeight: 600, textAlign: 'center' }}>
                    👤 Face found — no ERP match (different dept?)
                    {item.confidence != null && (
                        <span style={{ marginLeft: 6, fontSize: '10px', fontWeight: 400, color: '#c4b5fd' }}>
                            best guess: {(item.confidence * 100).toFixed(0)}%
                        </span>
                    )}
                </div>

                {/* Delete */}
                <button
                    onClick={e => { e.stopPropagation(); onDeleteFolder && onDeleteFolder(); }}
                    disabled={deletingFolder}
                    style={{
                        width: '100%', padding: '6px 0', borderRadius: 6,
                        border: '1px solid #f87171', background: '#ffffff',
                        color: '#f87171', fontSize: '11px', fontWeight: 700,
                        cursor: deletingFolder ? 'not-allowed' : 'pointer',
                        opacity: deletingFolder ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    }}
                >
                    {deletingFolder ? 'Deleting…' : (
                        <><svg width="11" height="12" viewBox="0 0 12 13" fill="none"><path d="M1.5 3.5h9M4.5 3.5V2.5h3v1M3 3.5l.6 7.5a.5.5 0 00.5.5h3.8a.5.5 0 00.5-.5L9 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><line x1="5" y1="6" x2="5" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="7" y1="6" x2="7" y2="10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>Delete Folder</>
                    )}
                </button>
            </div>
        </div>
    );
}

function Spinner() {
    return (
        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #f8717144', borderTopColor: '#f87171', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </span>
    );
}
