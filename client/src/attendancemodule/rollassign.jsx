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

    const [loading,    setLoading]    = useState(false);
    const [matching,   setMatching]   = useState(false);
    const [saving,     setSaving]     = useState(null);
    const [toast,      setToast]      = useState(null);

    const [unassigned, setUnassigned] = useState([]);
    const [assigned,   setAssigned]   = useState([]);
    const [matches,    setMatches]    = useState({});   // folderName → match data
    const [matchError, setMatchError] = useState(null);

    // Modal state
    const [modal, setModal]         = useState(null);  // { item, match }
    const [overrideRoll, setOverrideRoll] = useState('');

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

    // ── Load clusters ──────────────────────────────────────────────
    const loadClusters = useCallback(async () => {
        if (!batchName) return;
        setLoading(true);
        setUnassigned([]);
        setAssigned([]);
        setMatches({});
        setMatchError(null);
        try {
            const res  = await fetch(`${RA_BASE}/clusters/${batchName}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load');
            setUnassigned(data.unassigned || []);
            setAssigned(data.assigned   || []);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [batchName]);

    // ── Auto-match against ERP photos ──────────────────────────────
    const runAutoMatch = useCallback(async () => {
        if (!batchName) return;
        setMatching(true);
        setMatchError(null);
        try {
            const res  = await fetch(`${RA_BASE}/auto-match/${batchName}`, { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Match failed');
            setMatches(data.matches || {});
            showToast(`Matched ${data.clusters} clusters against ${data.erp_students} ERP photos`);
        } catch (err) {
            setMatchError(err.message);
            showToast(err.message, 'error');
        } finally {
            setMatching(false);
        }
    }, [batchName]);

    useEffect(() => { loadClusters(); }, [loadClusters]);

    // ── Open modal ────────────────────────────────────────────────
    const openModal = (item) => {
        setModal({ item, match: matches[item.folderName] || null });
        setOverrideRoll(matches[item.folderName]?.best?.rollNo || '');
    };

    // ── Approve ───────────────────────────────────────────────────
    const handleApprove = async (folderName, rollNo) => {
        const trimmed = rollNo.trim().toUpperCase();
        if (!trimmed) { showToast('Enter a roll number to approve', 'error'); return; }
        setSaving(folderName);
        try {
            const res  = await fetch(`${RA_BASE}/assign`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ batch: batchName, folderName, rollNo: trimmed }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');

            setUnassigned(prev => prev.filter(u => u.folderName !== folderName));
            setAssigned(prev => {
                const item = unassigned.find(u => u.folderName === folderName);
                return item ? [...prev, { ...item, folderName: data.rollNo, rollNo: data.rollNo }] : prev;
            });
            setModal(null);
            showToast(`✓ Assigned ${folderName} → ${data.rollNo}`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

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
                    suggestedRollNo: match?.best?.rollNo  || null,
                    confidence:      match?.best?.confidence || null,
                    reason:          'operator_rejected',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to flag');

            // Mark flagged in local state
            setUnassigned(prev => prev.map(u =>
                u.folderName === folderName ? { ...u, flagged: true } : u
            ));
            setModal(null);
            showToast(`⚑ Flagged ${folderName} — review in Flagged page`);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setSaving(null);
        }
    };

    // ── Render ────────────────────────────────────────────────────
    const unflagged = unassigned.filter(u => !u.flagged);
    const flagged   = unassigned.filter(u =>  u.flagged);

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

            {/* Modal */}
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
                        disabled={matching || !batchName || unassigned.length === 0}
                        style={{
                            ...styles.btnPrimary,
                            padding: '9px 20px', fontSize: '13px',
                            opacity: (matching || !batchName || unassigned.length === 0) ? 0.5 : 1,
                        }}
                    >
                        {matching ? '🔄 Matching…' : '🔍 Match with ERP Photos'}
                    </button>
                </div>
                {matchError && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 6,
                                  background: '#3f1212', color: '#f87171', fontSize: '12px' }}>
                        {matchError}
                    </div>
                )}
                {Object.keys(matches).length > 0 && (
                    <div style={{ marginTop: 10, fontSize: '12px', color: theme.textMuted }}>
                        ✓ Matching complete — click any card to verify and approve
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
                    {/* Unassigned + flagged */}
                    {unflagged.length > 0 && (
                        <Section title="Pending Review" count={unflagged.length} accentColor={theme.accent}>
                            {unflagged.map(item => (
                                <ClusterCard
                                    key={item.folderName}
                                    item={item}
                                    match={matches[item.folderName]}
                                    batchName={batchName}
                                    photoUrl={photoUrl}
                                    erpPhotoUrl={erpPhotoUrl}
                                    onClick={() => openModal(item)}
                                />
                            ))}
                        </Section>
                    )}

                    {flagged.length > 0 && (
                        <Section title="Flagged" count={flagged.length} accentColor={theme.warning}>
                            {flagged.map(item => (
                                <ClusterCard
                                    key={item.folderName}
                                    item={item}
                                    match={matches[item.folderName]}
                                    batchName={batchName}
                                    photoUrl={photoUrl}
                                    erpPhotoUrl={erpPhotoUrl}
                                    onClick={() => openModal(item)}
                                    isFlagged
                                />
                            ))}
                        </Section>
                    )}

                    {assigned.length > 0 && (
                        <Section title="Assigned" count={assigned.length} accentColor={theme.success}>
                            {assigned.map(item => (
                                <ClusterCard
                                    key={item.folderName}
                                    item={item}
                                    batchName={batchName}
                                    photoUrl={photoUrl}
                                    erpPhotoUrl={erpPhotoUrl}
                                    isAssigned
                                />
                            ))}
                        </Section>
                    )}

                    {unassigned.length === 0 && assigned.length === 0 && (
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
function Section({ title, count, accentColor, children }) {
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
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 14,
            }}>
                {children}
            </div>
        </div>
    );
}

// ── Cluster card ──────────────────────────────────────────────
function ClusterCard({ item, match, batchName, photoUrl, erpPhotoUrl, onClick, isAssigned, isFlagged }) {
    const best = match?.best;
    const conf = best?.confidence;

    return (
        <div
            onClick={!isAssigned ? onClick : undefined}
            style={{
                background: theme.surface,
                border: `1px solid ${
                    isAssigned ? theme.success + '44' :
                    isFlagged  ? theme.warning + '66' :
                    theme.border
                }`,
                borderRadius: 10,
                overflow: 'hidden',
                cursor: isAssigned ? 'default' : 'pointer',
                transition: 'border-color 0.15s, transform 0.1s',
            }}
            onMouseEnter={e => { if (!isAssigned) e.currentTarget.style.borderColor = theme.accent; }}
            onMouseLeave={e => { if (!isAssigned) e.currentTarget.style.borderColor =
                isFlagged ? theme.warning + '66' : theme.border; }}
        >
            {/* Face strip */}
            <div style={{ display: 'flex', height: 80, overflow: 'hidden', background: '#000', gap: 1 }}>
                {item.previewFiles.slice(0, 4).map((f, i) => (
                    <img key={i} src={photoUrl(batchName, item.folderName, f)} alt=""
                         style={{ flex: 1, height: '100%', objectFit: 'cover', minWidth: 0 }}
                         onError={e => { e.target.style.display = 'none'; }} />
                ))}
            </div>

            <div style={{ padding: '10px 12px' }}>
                {/* Folder name + image count */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 700, color: theme.text }}>
                        {item.folderName}
                    </span>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>
                        {item.imageCount} img
                    </span>
                </div>

                {/* Match suggestion */}
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
                ) : best ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {best.erpPhoto && (
                            <img src={erpPhotoUrl(best.erpPhoto)} alt="ERP"
                                 style={{ width: 32, height: 32, borderRadius: '50%',
                                          objectFit: 'cover', border: `2px solid ${confidenceColor(conf)}`,
                                          flexShrink: 0 }}
                                 onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text,
                                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {best.rollNo}
                            </div>
                            <div style={{ fontSize: '11px', color: confidenceColor(conf) }}>
                                {confidenceLabel(conf)} · {(conf * 100).toFixed(0)}%
                            </div>
                        </div>
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>→</span>
                    </div>
                ) : (
                    <div style={{ fontSize: '12px', color: theme.textMuted, textAlign: 'center',
                                  padding: '4px 0' }}>
                        {match ? '⚠ No ERP face detected' : 'Click to assign'}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Verify Modal ───────────────────────────────────────────────
function VerifyModal({ item, match, batchName, photoUrl, erpPhotoUrl,
                       overrideRoll, setOverrideRoll,
                       saving, onApprove, onFlag, onClose }) {
    const best       = match?.best;
    const candidates = match?.candidates || [];
    const conf       = best?.confidence;

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
                            {item.previewFiles.map((f, i) => (
                                <img key={i} src={photoUrl(batchName, item.folderName, f)} alt=""
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

                            {best ? (
                                <div style={{ textAlign: 'center' }}>
                                    <img
                                        src={erpPhotoUrl(best.erpPhoto)}
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
                                        {best.rollNo}
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
