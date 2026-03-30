// client/src/attendancemodule/rollassign.jsx
// Auto-match face clusters to ERP photos → operator verifies in modal → approve or flag

import { useState, useEffect, useCallback } from 'react';
import getEnvironment from '../getenvironment';
import { DEGREES, DEPARTMENTS, YEARS, theme, styles, cssReset } from './config';

const apiUrl  = getEnvironment();
const RA_BASE = `${apiUrl}/attendancemodule/roll-assign`;

// ── Confidence thresholds ───────────────────────────────────────
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
    const [degree,     setDegree]     = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year,       setYear]       = useState('');

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

    // Verify modal (unassigned clusters)
    const [modal, setModal]               = useState(null);  // { item, match }
    const [overrideRoll, setOverrideRoll] = useState('');

    // GT modal (assigned clusters — image selection)
    const [gtModal,      setGtModal]      = useState(null);  // { rollNo }
    const [gtData,       setGtData]       = useState(null);  // API response
    const [gtLoading,    setGtLoading]    = useState(false);
    const [gtSelected,   setGtSelected]   = useState(new Set()); // selected filenames
    const [gtSaving,     setGtSaving]     = useState(false);

    const batchName = degree && department && year
        ? `${degree}_${department}_${year}`.toUpperCase()
        : null;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const photoUrl    = (batch, folder, filename) =>
        `${RA_BASE}/photo/${encodeURIComponent(batch)}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}`;
    const erpPhotoUrl = (filename) =>
        `${RA_BASE}/erp-photo/${encodeURIComponent(filename)}`;

    // ── Load clusters from DB + unprocessed from filesystem ────────
    const loadClusters = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setMatchError(null);
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

    // ── Approve ───────────────────────────────────────────────────
    const handleApprove = async (folderName, rollNo) => {
        const trimmed = rollNo.trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number to approve', 'error'); return; }
        setSaving(folderName);
        try {
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
    };

    // ── Open GT modal for an assigned cluster ────────────────────
    const openGtModal = useCallback(async (rollNo) => {
        setGtModal({ rollNo });
        setGtData(null);
        setGtSelected(new Set());
        setGtLoading(true);
        try {
            const res  = await fetch(`${RA_BASE}/student-ground-truth/${batchName}/${rollNo}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            // Server returns relative URLs — rewrite to absolute so <img> resolves to API host
            const fixUrls = (list) =>
                (list || []).map(f => ({
                    ...f,
                    url: `${RA_BASE}/photo/${encodeURIComponent(batchName)}/${encodeURIComponent(rollNo)}/${encodeURIComponent(f.filename)}`,
                }));
            setGtData({
                ...data,
                embeddingFiles: fixUrls(data.embeddingFiles),
                backupFiles:    fixUrls(data.backupFiles),
                untrackedFiles: fixUrls(data.untrackedFiles),
            });
            // Pre-select current embedding files
            setGtSelected(new Set((data.embeddingFiles || []).map(f => f.filename)));
        } catch (err) {
            showToast(err.message, 'error');
            setGtModal(null);
        } finally {
            setGtLoading(false);
        }
    }, [batchName]);

    // ── Update embedding from selected GT images ──────────────────
    const handleUpdateEmbedding = useCallback(async () => {
        if (!gtModal || gtSelected.size === 0) return;
        setGtSaving(true);
        try {
            const res  = await fetch(`${RA_BASE.replace('roll-assign', 'ground-truth')}/update-embedding`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    batch:          batchName,
                    rollNo:         gtModal.rollNo,
                    embeddingFiles: [...gtSelected],
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            showToast(`✓ Embedding updated for ${gtModal.rollNo} (${data.embedding_files_used} files)`);
            setGtModal(null);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setGtSaving(false);
        }
    }, [gtModal, gtSelected, batchName]);

    // ── Flag ──────────────────────────────────────────────────────
    const handleFlag = async (folderName, match) => {
        setSaving(folderName);
        try {
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

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    padding: '12px 24px', borderRadius: 8,
                    fontSize: '13px', fontWeight: 600,
                    background: toast.type === 'error' ? '#3f1212' : theme.successDim,
                    color:      toast.type === 'error' ? '#f87171' : theme.success,
                    border: `1px solid ${toast.type === 'error' ? '#f87171' : theme.success}`,
                }}>
                    {toast.msg}
                </div>
            )}

            {/* Verify modal (unassigned clusters) */}
            {modal && (
                <VerifyModal
                    item={modal.item}
                    match={modal.match}
                    batchName={batchName}
                    photoUrl={photoUrl}
                    erpPhotoUrl={erpPhotoUrl}
                    overrideRoll={overrideRoll}
                    setOverrideRoll={setOverrideRoll}
                    saving={saving === modal.item.folderName}
                    onApprove={() => handleApprove(modal.item.folderName, overrideRoll)}
                    onFlag={() => handleFlag(modal.item.folderName, modal.match)}
                    onClose={() => setModal(null)}
                />
            )}

            {/* GT modal (assigned clusters — image selection) */}
            {gtModal && (
                <GTModal
                    rollNo={gtModal.rollNo}
                    loading={gtLoading}
                    data={gtData}
                    selected={gtSelected}
                    setSelected={setGtSelected}
                    saving={gtSaving}
                    onSave={handleUpdateEmbedding}
                    onClose={() => setGtModal(null)}
                />
            )}

            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={styles.heading}>Assign Roll Numbers</div>
                <div style={styles.subheading}>
                    Auto-matched against ERP photos — click a folder to verify and approve
                </div>
            </div>

            {/* Batch selector + actions */}
            <div style={{ ...styles.card, marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
                    <div>
                        <label style={styles.label}>Degree</label>
                        <select value={degree} onChange={e => setDegree(e.target.value)} style={styles.select}>
                            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Department</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={styles.label}>Year (Batch)</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={styles.select}>
                            <option value="">Select…</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
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
                {/* Progress bar while matching */}
                {matching && matchProgress && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                                      fontSize: '12px', color: theme.textMuted, marginBottom: 6 }}>
                            <span>{matchProgress.msg}</span>
                            {matchProgress.total > 0 && (
                                <span style={{ fontFamily: theme.fontMono }}>
                                    {matchProgress.done}/{matchProgress.total}
                                </span>
                            )}
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: theme.border, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 3,
                                background: matchProgress.step === 'erp' ? theme.warning : theme.accent,
                                width: matchProgress.total > 0
                                    ? `${(matchProgress.done / matchProgress.total) * 100}%`
                                    : '5%',
                                transition: 'width 0.3s ease',
                            }} />
                        </div>
                        {matchProgress.current && (
                            <div style={{ marginTop: 4, fontSize: '11px', color: theme.textMuted,
                                          fontFamily: theme.fontMono }}>
                                Processing: {matchProgress.current}
                            </div>
                        )}
                    </div>
                )}

                {matchError && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6,
                                  background: '#3f1212', color: '#f87171', fontSize: '12px' }}>
                        {matchError}
                    </div>
                )}
                {!matching && pendingReview.length > 0 && (
                    <div style={{
                        marginTop: 14, padding: '10px 14px', borderRadius: 7,
                        background: theme.successDim, border: `1px solid ${theme.success}44`,
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
                    </div>
                )}
            </div>

            {loading && (
                <div style={{ ...styles.card, textAlign: 'center', padding: '40px 20px', color: theme.textMuted }}>
                    Loading folders…
                </div>
            )}

            {!loading && batchName && (
                <>
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
                                    key={item.folderName}
                                    item={item}
                                    batchName={batchName}
                                    photoUrl={photoUrl}
                                    erpPhotoUrl={erpPhotoUrl}
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
                            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>
                                No folders found
                            </div>
                            <div style={{ fontSize: '13px', color: theme.textMuted }}>
                                Run Ground Truth Generation first for this batch
                            </div>
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
                {/* Folder / roll no label + image count */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>
                        {item.folderName}
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>
                        {item.imageCount} img
                    </span>
                </div>

                {/* Status badge */}
                {isAssigned ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5,
                                  background: theme.successDim, color: theme.success,
                                  fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                        ✓ {item.rollNo}
                    </div>
                ) : isFlagged ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5,
                                  background: theme.warning + '22', color: theme.warning,
                                  fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                        ⚑ Flagged — click to review
                    </div>
                ) : isUnmatched ? (
                    <div style={{ padding: '5px 8px', borderRadius: 5,
                                  background: theme.border + '44', color: theme.textMuted,
                                  fontSize: '11px', textAlign: 'center' }}>
                        ⚠ No face detected
                    </div>
                ) : item.rollNo ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
                            </div>
                            {conf != null && (
                                <div style={{ fontSize: '11px', color: confidenceColor(conf) }}>
                                    {confidenceLabel(conf)} · {(conf * 100).toFixed(0)}%
                                </div>
                            )}
                        </div>
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>→</span>
                    </div>
                ) : (
                    <div style={{ fontSize: '11px', textAlign: 'center', padding: '5px 8px',
                                  borderRadius: 5, background: theme.border + '44', color: theme.textMuted }}>
                        ⟳ Not yet matched
                    </div>
                )}
            </div>
        </div>
    );
}

// ── GT Modal (assigned student — image selection for embedding) ──
function GTModal({ rollNo, loading, data, selected, setSelected, saving, onSave, onClose }) {
    const toggleFile = (filename) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(filename)) next.delete(filename);
            else next.add(filename);
            return next;
        });
    };

    const selectAll = (files) => setSelected(prev => {
        const next = new Set(prev);
        files.forEach(f => next.add(f.filename));
        return next;
    });

    const deselectAll = (files) => setSelected(prev => {
        const next = new Set(prev);
        files.forEach(f => next.delete(f.filename));
        return next;
    });

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                width: '100%', maxWidth: 860,
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: `1px solid ${theme.border}`,
                }}>
                    <div>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: theme.text }}>
                            Ground Truth — {rollNo}
                        </span>
                        <span style={{ marginLeft: 10, fontSize: '12px', color: theme.textMuted }}>
                            Select up to 5 images for embedding · rest kept as backup
                        </span>
                    </div>
                    <button onClick={onClose}
                            style={{ background: 'none', border: 'none', color: theme.textMuted,
                                     fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: theme.textMuted }}>
                            Loading images…
                        </div>
                    )}

                    {!loading && data && (() => {
                        const renderSection = (title, files, accent, hint) => {
                            if (!files.length) return null;
                            return (
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700,
                                                       color: accent, textTransform: 'uppercase',
                                                       letterSpacing: '0.05em' }}>
                                            {title}
                                        </span>
                                        <span style={{ fontSize: '11px', color: theme.textMuted }}>
                                            {hint}
                                        </span>
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                                            <button onClick={() => selectAll(files)}
                                                    style={{ fontSize: '11px', color: accent,
                                                             background: 'none', border: 'none',
                                                             cursor: 'pointer', padding: '2px 6px' }}>
                                                Select all
                                            </button>
                                            <button onClick={() => deselectAll(files)}
                                                    style={{ fontSize: '11px', color: theme.textMuted,
                                                             background: 'none', border: 'none',
                                                             cursor: 'pointer', padding: '2px 6px' }}>
                                                Deselect all
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid',
                                                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                                                  gap: 8 }}>
                                        {files.map(f => {
                                            const isSel = selected.has(f.filename);
                                            return (
                                                <div key={f.filename}
                                                     onClick={() => toggleFile(f.filename)}
                                                     style={{
                                                         position: 'relative', cursor: 'pointer',
                                                         borderRadius: 6, overflow: 'hidden',
                                                         border: `2px solid ${isSel ? accent : theme.border}`,
                                                         transition: 'border-color 0.12s',
                                                         background: isSel ? accent + '11' : 'transparent',
                                                     }}>
                                                    <img src={f.url} alt=""
                                                         style={{ width: '100%', aspectRatio: '1',
                                                                  objectFit: 'cover', display: 'block' }}
                                                         onError={e => {
                                                             e.target.style.display = 'none';
                                                             e.target.nextSibling.style.display = 'flex';
                                                         }} />
                                                    {/* fallback */}
                                                    <div style={{ display: 'none', width: '100%',
                                                                  aspectRatio: '1', alignItems: 'center',
                                                                  justifyContent: 'center', background: theme.bg,
                                                                  fontSize: '10px', color: theme.textMuted }}>
                                                        No image
                                                    </div>
                                                    {/* Checkmark overlay */}
                                                    {isSel && (
                                                        <div style={{
                                                            position: 'absolute', top: 4, right: 4,
                                                            width: 18, height: 18, borderRadius: '50%',
                                                            background: accent, color: '#000',
                                                            display: 'flex', alignItems: 'center',
                                                            justifyContent: 'center', fontSize: '11px',
                                                            fontWeight: 800,
                                                        }}>✓</div>
                                                    )}
                                                    {/* Score badge */}
                                                    {f.score != null && (
                                                        <div style={{
                                                            position: 'absolute', bottom: 3, left: 3,
                                                            fontSize: '9px', fontWeight: 700,
                                                            background: 'rgba(0,0,0,0.65)', color: '#fff',
                                                            padding: '1px 4px', borderRadius: 3,
                                                        }}>
                                                            {f.score.toFixed(0)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <>
                                {renderSection(
                                    'Used for Embedding',
                                    data.embeddingFiles,
                                    theme.success,
                                    '— currently active in face recognition'
                                )}
                                {renderSection(
                                    'Backup Images',
                                    data.backupFiles,
                                    theme.accent,
                                    '— saved but not used for embedding'
                                )}
                                {renderSection(
                                    'Untracked',
                                    data.untrackedFiles,
                                    theme.textMuted,
                                    '— manually added photos'
                                )}
                            </>
                        );
                    })()}

                    {!loading && !data && (
                        <div style={{ textAlign: 'center', color: theme.textMuted, padding: '40px 0' }}>
                            No images found for this student.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '14px 20px', borderTop: `1px solid ${theme.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div style={{ fontSize: '12px', color: theme.textMuted }}>
                        {selected.size} selected
                        {selected.size > 5 && (
                            <span style={{ color: theme.warning, marginLeft: 6 }}>
                                ⚠ Top 5 will be used for embedding (ranked by quality score)
                            </span>
                        )}
                        {selected.size === 0 && (
                            <span style={{ color: theme.danger || '#f87171', marginLeft: 6 }}>
                                Select at least 1 image
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={onClose}
                                style={{ padding: '8px 18px', borderRadius: 7,
                                         border: `1px solid ${theme.border}`,
                                         background: 'transparent', color: theme.textMuted,
                                         fontSize: '13px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            disabled={saving || selected.size === 0}
                            style={{
                                padding: '8px 20px', borderRadius: 7, border: 'none',
                                background: theme.success, color: '#000',
                                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                opacity: (saving || selected.size === 0) ? 0.5 : 1,
                            }}
                        >
                            {saving ? 'Updating…' : '✓ Update Embedding'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Verify Modal ───────────────────────────────────────────────
function VerifyModal({ item, match, batchName, photoUrl, erpPhotoUrl,
                       overrideRoll, setOverrideRoll,
                       saving, onApprove, onFlag, onClose }) {
    // match is now a flat DB record (rollNo, erpPhoto, confidence, candidates[])
    const conf        = match?.confidence;
    const candidates  = match?.candidates || [];
    const folderForPhoto = item.currentFolder || item.folderName;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
        }}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                width: '100%', maxWidth: 760,
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Modal header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: `1px solid ${theme.border}`,
                }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: theme.text }}>
                        Verify — {item.folderName}
                        <span style={{ marginLeft: 8, fontSize: '12px', color: theme.textMuted,
                                       fontWeight: 400 }}>
                            {item.imageCount} face images
                        </span>
                    </div>
                    <button onClick={onClose}
                            style={{ background: 'none', border: 'none', color: theme.textMuted,
                                     fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>
                        ×
                    </button>
                </div>

                {/* Modal body */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 20,
                              display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                    {/* Left: face crop images */}
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

                    {/* Right: ERP match + approve/flag */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* ERP photo */}
                        <div>
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
                                    <div style={{ fontSize: '12px', color: confidenceColor(conf), fontWeight: 600 }}>
                                        {confidenceLabel(conf)} confidence · {(conf * 100).toFixed(1)}%
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: theme.textMuted,
                                              fontSize: '13px', padding: '20px 0' }}>
                                    No ERP match found.<br/>Enter roll number manually.
                                </div>
                            )}
                        </div>

                        {/* Other candidates */}
                        {candidates.length > 1 && (
                            <div>
                                <div style={{ fontSize: '11px', color: theme.textMuted,
                                              fontWeight: 600, marginBottom: 6 }}>
                                    Other candidates
                                </div>
                                {candidates.slice(1).map((c, i) => (
                                    <div key={i}
                                         onClick={() => setOverrideRoll(c.rollNo)}
                                         style={{ display: 'flex', alignItems: 'center', gap: 8,
                                                  padding: '5px 8px', borderRadius: 5, cursor: 'pointer',
                                                  marginBottom: 4,
                                                  background: overrideRoll === c.rollNo ? theme.accentDim : 'transparent',
                                                  border: `1px solid ${overrideRoll === c.rollNo ? theme.accent : 'transparent'}`,
                                         }}>
                                        {c.erpPhoto && (
                                            <img src={erpPhotoUrl(c.erpPhoto)} alt=""
                                                 style={{ width: 28, height: 28, borderRadius: '50%',
                                                          objectFit: 'cover', flexShrink: 0 }}
                                                 onError={e => { e.target.style.display = 'none'; }} />
                                        )}
                                        <span style={{ fontSize: '12px', fontWeight: 600, color: theme.text }}>
                                            {c.rollNo}
                                        </span>
                                        <span style={{ fontSize: '11px', color: confidenceColor(c.confidence),
                                                       marginLeft: 'auto' }}>
                                            {(c.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Roll number input */}
                        <div>
                            <div style={{ fontSize: '11px', color: theme.textMuted,
                                          fontWeight: 600, marginBottom: 5 }}>
                                Roll Number to Assign
                            </div>
                            <input
                                type="text"
                                placeholder="e.g. 2301001"
                                value={overrideRoll}
                                onChange={e => setOverrideRoll(e.target.value.toUpperCase())}
                                onKeyDown={e => { if (e.key === 'Enter') onApprove(); }}
                                style={{ ...styles.input, margin: 0, width: '100%',
                                         fontSize: '14px', fontWeight: 700,
                                         textTransform: 'uppercase' }}
                            />
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                            <button
                                onClick={onApprove}
                                disabled={saving || !overrideRoll.trim()}
                                style={{
                                    padding: '10px 0', borderRadius: 7, border: 'none',
                                    background: theme.success, color: '#000',
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                    opacity: (saving || !overrideRoll.trim()) ? 0.5 : 1,
                                }}
                            >
                                {saving ? 'Assigning…' : '✓ Approve & Assign'}
                            </button>
                            <button
                                onClick={onFlag}
                                disabled={saving}
                                style={{
                                    padding: '10px 0', borderRadius: 7,
                                    border: `1px solid ${theme.warning}`,
                                    background: 'transparent', color: theme.warning,
                                    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                    opacity: saving ? 0.5 : 1,
                                }}
                            >
                                ✗ Flag as Incorrect
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
