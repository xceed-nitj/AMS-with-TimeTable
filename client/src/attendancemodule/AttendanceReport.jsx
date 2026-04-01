// client/src/attendancemodule/AttendanceReport.jsx
// Input: room + slot + video → auto-lookup from LockSem → attendance report

import { useState, useEffect, useCallback } from 'react';
import { API_BASE, DEGREES, YEARS, theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const REPORT_API = `${apiUrl}/attendancemodule/reports`;
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

const SLOT_LABELS = {
    period1: 'Period 1 — 08:30',
    period2: 'Period 2 — 09:30',
    period3: 'Period 3 — 10:30',
    period4: 'Period 4 — 11:30',
    period5: 'Period 5 — 13:30',
    period6: 'Period 6 — 14:30',
    period7: 'Period 7 — 15:30',
    period8: 'Period 8 — 16:30',
};

export default function AttendanceReport() {
    const [tab, setTab]               = useState('run');

    // ── Inputs: only room + slot + video ─────────────────────────
    const [room,      setRoom]      = useState('');
    const [slot,      setSlot]      = useState('');
    const [videoLink, setVideoLink] = useState('');
    const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);

    // ── Fallback batch (if LockSem lookup fails) ──────────────────
    const [degree,     setDegree]     = useState('BTECH');
    const [department, setDepartment] = useState('');
    const [year,       setYear]       = useState('');
    // Departments from DB — ensures folder names match timetable exactly
    const { departments, deptLoading, deptError } = useDepartments();
    // Sanitize dept: replace spaces with _ so folder paths are valid
    const sanitizeDept = (d) => (d || '').trim().replace(/\s+/g, '_').toUpperCase();
    const manualBatch = degree && department && year
        ? `${degree}_${sanitizeDept(department)}_${year}` : null;

    // ── Run state ─────────────────────────────────────────────────
    const [processing,   setProcessing]   = useState(false);
    const [saving,       setSaving]       = useState(false);
    const [mlResult,     setMlResult]     = useState(null);
    const [savedReport,  setSavedReport]  = useState(null);
    const [derivedCtx,   setDerivedCtx]   = useState(null);

    // ── History ───────────────────────────────────────────────────
    const [reports,      setReports]      = useState([]);
    const [histLoading,  setHistLoading]  = useState(false);
    const [filterBatch,  setFilterBatch]  = useState('');
    const [filterDate,   setFilterDate]   = useState('');

    // ── Detail ────────────────────────────────────────────────────
    const [detailReport,   setDetailReport]   = useState(null);
    const [detailLoading,  setDetailLoading]  = useState(false);

    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    // ── Fetch reports ─────────────────────────────────────────────
    const fetchReports = useCallback(async () => {
        setHistLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterBatch) params.set('batch', filterBatch);
            if (filterDate)  params.set('date',  filterDate);
            const res  = await fetch(`${REPORT_API}?${params}`);
            const data = await res.json();
            setReports(data.reports || []);
        } catch { showToast('Failed to load reports', 'error'); }
        setHistLoading(false);
    }, [filterBatch, filterDate]);

    useEffect(() => { if (tab === 'history') fetchReports(); }, [tab, fetchReports]);

    // ── Run attendance ────────────────────────────────────────────
    const runAttendance = async () => {
        if (!videoLink.trim()) { showToast('Paste the video file path', 'error'); return; }
        if (!room)             { showToast('Enter room number', 'error'); return; }
        if (!slot)             { showToast('Select a slot', 'error'); return; }

        setProcessing(true); setMlResult(null); setSavedReport(null); setDerivedCtx(null);
        try {
            const res = await fetch(`${API_BASE}/run-attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    videoLink: videoLink.trim(),
                    room, slot, date,
                    batch: manualBatch, // fallback
                }),
            });
            const data = await res.json();
            if (data.error) showToast(data.error, 'error');
            else {
                setMlResult(data);
                if (data.metadata) setDerivedCtx(data.metadata);
                showToast('Processed — review and save');
            }
        } catch (e) { showToast('Failed: ' + e.message, 'error'); }
        setProcessing(false);
    };

    // ── Save report ───────────────────────────────────────────────
    const saveReport = async () => {
        if (!mlResult) return;
        setSaving(true);
        const ctx = derivedCtx || {};
        try {
            const res = await fetch(`${REPORT_API}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    batch:      ctx.batch      || manualBatch,
                    department: ctx.dept       || department,
                    semester:   ctx.sem        || '',
                    subject:    ctx.subject    || '',
                    faculty:    ctx.faculty    || '',
                    room, date, timeSlot: slot,
                    locksemId: ctx.locksemId   || null,
                    videoLink: videoLink.trim(),
                    mlResult,
                }),
            });
            const data = await res.json();
            if (data.error) showToast(data.error, 'error');
            else { setSavedReport(data); showToast('Report saved'); }
        } catch { showToast('Save failed', 'error'); }
        setSaving(false);
    };

    const openDetail = async (id) => {
        setTab('detail'); setDetailLoading(true); setDetailReport(null);
        try { setDetailReport(await (await fetch(`${REPORT_API}/${id}`)).json()); }
        catch { showToast('Failed to load report', 'error'); }
        setDetailLoading(false);
    };

    const overrideStatus = async (reportId, rollNo, finalStatus) => {
        try {
            const res  = await fetch(`${REPORT_API}/${reportId}/student/${rollNo}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finalStatus }),
            });
            const data = await res.json();
            if (data.error) { showToast(data.error, 'error'); return; }
            setDetailReport(prev => ({
                ...prev,
                finalReport: prev.finalReport.map(s => s.rollNo === rollNo ? { ...s, finalStatus } : s),
                summary: data.summary,
            }));
            showToast(`${rollNo} → ${finalStatus}`);
        } catch { showToast('Override failed', 'error'); }
    };

    const finalizeReport = async (id) => {
        if (!window.confirm('Finalize? Cannot edit after.')) return;
        try {
            const data = await (await fetch(`${REPORT_API}/${id}/finalize`, { method: 'POST' })).json();
            if (data.error) { showToast(data.error, 'error'); return; }
            setDetailReport(prev => ({ ...prev, status: 'finalized' }));
            showToast('Report finalized');
        } catch { showToast('Finalize failed', 'error'); }
    };

    const deleteReport = async (id) => {
        if (!window.confirm('Delete this draft?')) return;
        try {
            const data = await (await fetch(`${REPORT_API}/${id}`, { method: 'DELETE' })).json();
            if (data.error) { showToast(data.error, 'error'); return; }
            showToast('Deleted'); setTab('history'); fetchReports();
        } catch { showToast('Delete failed', 'error'); }
    };

    const mlStats = (() => {
        if (!mlResult?.attendance) return null;
        const arr = Object.values(mlResult.attendance);
        return {
            present: arr.filter(s => s.status === 'present').length,
            review:  arr.filter(s => s.status === 'review').length,
            absent:  arr.filter(s => s.status === 'absent').length,
            total:   arr.length,
        };
    })();

    return (
        <div style={styles.page}>
            <style>{cssReset}</style>

            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 999,
                    padding: '12px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                    animation: 'fadeIn 0.3s',
                    background: toast.type === 'error' ? theme.dangerDim  : theme.successDim,
                    color:      toast.type === 'error' ? theme.danger      : theme.success,
                    border: `1px solid ${toast.type === 'error' ? theme.danger : theme.success}`,
                }}>{toast.msg}</div>
            )}

            <div style={{ marginBottom: 24 }}>
                <div style={styles.heading}>Attendance Reports</div>
                <div style={styles.subheading}>
                    Enter room + slot + video — faculty, subject, batch auto-fetched from timetable
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${theme.border}` }}>
                {[['run','Run Attendance'],['history','Saved Reports'],['detail','Report Detail']].map(([id, label]) => (
                    (id !== 'detail' || detailReport) && (
                        <button key={id} onClick={() => setTab(id)} style={{
                            padding: '10px 20px', background: 'transparent', border: 'none',
                            borderBottom: `2px solid ${tab === id ? theme.accent : 'transparent'}`,
                            color: tab === id ? theme.accent : theme.textMuted,
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: -1,
                        }}>{label}</button>
                    )
                ))}
            </div>

            {/* ════ RUN TAB ════ */}
            {tab === 'run' && (
                <div>
                    <div style={{ ...styles.card, marginBottom: 16 }}>
                        <div style={{ ...styles.sectionTitle, marginBottom: 14 }}>Class Identification</div>

                        {/* Primary inputs: room + slot + date */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                            <div>
                                <label style={styles.label}>Room No</label>
                                <input placeholder="e.g. lt101" value={room}
                                    onChange={e => setRoom(e.target.value)}
                                    style={styles.input} />
                            </div>
                            <div>
                                <label style={styles.label}>Slot</label>
                                <select value={slot} onChange={e => setSlot(e.target.value)} style={styles.select}>
                                    <option value="">Select slot...</option>
                                    {Object.entries(SLOT_LABELS).map(([val, label]) => (
                                        <option key={val} value={val}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={styles.label}>Date</label>
                                <input type="date" value={date}
                                    onChange={e => setDate(e.target.value)}
                                    style={styles.input} />
                            </div>
                        </div>

                        {/* Derived context display after run */}
                        {derivedCtx && (
                            <div style={{
                                padding: '10px 14px', borderRadius: '6px', marginBottom: 14,
                                background: theme.successDim, border: `1px solid ${theme.success}`,
                                fontSize: '12px', display: 'flex', gap: 20, flexWrap: 'wrap',
                            }}>
                                <span style={{ color: theme.success, fontWeight: 700 }}>Timetable matched</span>
                                {[
                                    ['Batch',   derivedCtx.batch],
                                    ['Subject', derivedCtx.subject],
                                    ['Faculty', derivedCtx.faculty],
                                    ['Sem',     derivedCtx.sem],
                                    ['Dept',    derivedCtx.dept],
                                ].filter(([, v]) => v).map(([k, v]) => (
                                    <span key={k} style={{ color: theme.textMuted }}>
                                        <span style={{ textTransform: 'uppercase', fontSize: '10px' }}>{k}: </span>
                                        <span style={{ color: theme.text, fontWeight: 600 }}>{v}</span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Fallback batch selector (collapsed by default) */}
                        <details style={{ marginBottom: 14 }}>
                            <summary style={{ fontSize: '12px', color: theme.textMuted, cursor: 'pointer', marginBottom: 10 }}>
                                Batch override (if timetable lookup fails)
                            </summary>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginTop: 10 }}>
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
                                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
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
                            </div>
                            {manualBatch && (
                                <div style={{ marginTop: 10, fontSize: '12px', color: theme.accent, fontFamily: theme.fontMono }}>
                                    Fallback: {manualBatch}
                                </div>
                            )}
                        </details>

                        {/* Video path + Run */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={styles.label}>Video File Path</label>
                                <input
                                    placeholder="C:\Videos\class_recording.mp4"
                                    value={videoLink}
                                    onChange={e => setVideoLink(e.target.value)}
                                    style={{ ...styles.input, fontFamily: theme.fontMono }}
                                />
                            </div>
                            <button
                                onClick={runAttendance}
                                disabled={processing || !videoLink.trim() || !room || !slot}
                                style={{
                                    ...styles.btnPrimary, minWidth: 170,
                                    opacity: (processing || !videoLink.trim() || !room || !slot) ? 0.5 : 1,
                                }}
                            >
                                {processing ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{
                                            width: 13, height: 13,
                                            border: '2px solid rgba(0,0,0,0.3)',
                                            borderTopColor: theme.accentText,
                                            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                                            display: 'inline-block',
                                        }} />
                                        Processing...
                                    </span>
                                ) : 'Run Attendance'}
                            </button>
                        </div>
                    </div>

                    {processing && (
                        <div style={{ ...styles.card, textAlign: 'center', padding: '48px 20px' }}>
                            <div style={{ width: 40, height: 40, margin: '0 auto 16px',
                                border: `3px solid ${theme.border}`, borderTopColor: theme.accent,
                                borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: 6 }}>Processing Video</div>
                            <div style={{ fontSize: '13px', color: theme.textMuted }}>
                                Detecting faces and matching against ground truth embeddings...
                            </div>
                        </div>
                    )}

                    {mlResult && !processing && (
                        <div style={{ animation: 'fadeIn 0.4s' }}>
                            <StatBar stats={[
                                { label: 'Total',   val: mlStats.total,   color: theme.text    },
                                { label: 'Present', val: mlStats.present, color: theme.success  },
                                { label: 'Review',  val: mlStats.review,  color: theme.warning  },
                                { label: 'Absent',  val: mlStats.absent,  color: theme.danger   },
                            ]} theme={theme} styles={styles} />

                            <div style={{ ...styles.card, marginBottom: 16,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 600 }}>Save to Database</div>
                                    <div style={{ fontSize: '12px', color: theme.textMuted, marginTop: 2 }}>
                                        {derivedCtx
                                            ? `${derivedCtx.batch} · ${derivedCtx.subject || '—'} · ${derivedCtx.faculty || '—'}`
                                            : 'Persist for later review and finalization'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {savedReport && <span style={{ ...styles.badge('success'), fontSize: '12px' }}>Saved</span>}
                                    <button onClick={saveReport} disabled={saving || !!savedReport}
                                        style={{ ...styles.btnPrimary, opacity: (saving || !!savedReport) ? 0.5 : 1 }}>
                                        {saving ? 'Saving...' : savedReport ? 'Saved' : 'Save Report'}
                                    </button>
                                    {savedReport && (
                                        <button onClick={() => openDetail(savedReport.reportId)} style={styles.btnGhost}>
                                            View Detail
                                        </button>
                                    )}
                                </div>
                            </div>

                            <AttendanceTable
                                rows={Object.entries(mlResult.attendance || {}).map(([rollNo, d]) => ({
                                    rollNo,
                                    status:         d.status,
                                    avgConfidence:  d.avg_confidence,
                                    confidenceZone: d.confidence_zone,
                                    firstSeenSec:   d.first_seen_sec,
                                    finalStatus: d.status === 'present' ? 'P' : d.status === 'review' ? 'R' : 'A',
                                }))}
                                readOnly theme={theme} styles={styles}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ════ HISTORY TAB ════ */}
            {tab === 'history' && (
                <div>
                    <div style={{ ...styles.card, marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label style={styles.label}>Batch</label>
                            <input placeholder="e.g. BTECH_TT_2026" value={filterBatch}
                                onChange={e => setFilterBatch(e.target.value)}
                                style={{ ...styles.input, width: 220 }} />
                        </div>
                        <div>
                            <label style={styles.label}>Date</label>
                            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                                style={{ ...styles.input, width: 180 }} />
                        </div>
                        <button onClick={fetchReports} style={styles.btnPrimary}>Search</button>
                        <button onClick={() => { setFilterBatch(''); setFilterDate(''); }} style={styles.btnGhost}>Clear</button>
                    </div>

                    {histLoading ? (
                        <div style={{ textAlign: 'center', padding: 48, color: theme.textMuted }}>Loading...</div>
                    ) : reports.length === 0 ? (
                        <div style={{ ...styles.card, textAlign: 'center', padding: 48, color: theme.textMuted }}>
                            No reports found.
                        </div>
                    ) : (
                        <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                                        {['Batch','Date','Slot','Subject','Faculty','P','A','%','Status',''].map(h => (
                                            <th key={h} style={{ padding: '12px 14px', textAlign: 'left',
                                                fontSize: '10px', color: theme.textMuted,
                                                textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(r => (
                                        <tr key={r._id} style={{ borderBottom: `1px solid ${theme.border}`, cursor: 'pointer' }}
                                            onClick={() => openDetail(r._id)}>
                                            <td style={{ padding: '11px 14px', fontFamily: theme.fontMono, fontSize: '12px', fontWeight: 600 }}>{r.batch}</td>
                                            <td style={{ padding: '11px 14px' }}>{r.date}</td>
                                            <td style={{ padding: '11px 14px', color: theme.textMuted }}>{SLOT_LABELS[r.timeSlot] || r.timeSlot || '—'}</td>
                                            <td style={{ padding: '11px 14px' }}>{r.subject || '—'}</td>
                                            <td style={{ padding: '11px 14px', color: theme.textMuted }}>{r.faculty || '—'}</td>
                                            <td style={{ padding: '11px 14px', color: theme.success, fontWeight: 700 }}>{r.summary?.present ?? '—'}</td>
                                            <td style={{ padding: '11px 14px', color: theme.danger,  fontWeight: 700 }}>{r.summary?.absent  ?? '—'}</td>
                                            <td style={{ padding: '11px 14px', fontFamily: theme.fontMono }}>
                                                {r.summary ? pct(r.summary.present, r.summary.totalStudents) + '%' : '—'}
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                <span style={styles.badge(r.status === 'finalized' ? 'success' : 'warning')}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 14px', color: theme.accent, fontSize: '12px' }}>View</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ════ DETAIL TAB ════ */}
            {tab === 'detail' && (
                <div>
                    {detailLoading && <div style={{ textAlign: 'center', padding: 48, color: theme.textMuted }}>Loading...</div>}
                    {detailReport && !detailLoading && (
                        <div style={{ animation: 'fadeIn 0.3s' }}>
                            <div style={{ ...styles.card, marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <div style={{ fontFamily: theme.fontMono, fontSize: '18px', fontWeight: 700, marginBottom: 6 }}>
                                            {detailReport.batch}
                                        </div>
                                        <div style={{ display: 'flex', gap: 20, fontSize: '13px', color: theme.textMuted, flexWrap: 'wrap' }}>
                                            {[
                                                ['Date',    detailReport.date],
                                                ['Slot',    SLOT_LABELS[detailReport.timeSlot] || detailReport.timeSlot || '—'],
                                                ['Subject', detailReport.subject  || '—'],
                                                ['Faculty', detailReport.faculty  || '—'],
                                                ['Room',    detailReport.room     || '—'],
                                                ['Sem',     detailReport.semester || '—'],
                                            ].map(([k, v]) => (
                                                <span key={k}>
                                                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}: </span>
                                                    <span style={{ color: theme.text, fontWeight: 600 }}>{v}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <span style={styles.badge(detailReport.status === 'finalized' ? 'success' : 'warning')}>
                                            {detailReport.status}
                                        </span>
                                        {detailReport.status !== 'finalized' && (
                                            <>
                                                <button onClick={() => finalizeReport(detailReport._id)}
                                                    style={{ ...styles.btnPrimary, padding: '8px 18px', fontSize: '13px' }}>
                                                    Finalize
                                                </button>
                                                <button onClick={() => deleteReport(detailReport._id)}
                                                    style={{ ...styles.btnDanger, padding: '8px 18px' }}>
                                                    Delete Draft
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <StatBar stats={[
                                { label: 'Total',   val: detailReport.summary?.totalStudents ?? 0, color: theme.text    },
                                { label: 'Present', val: detailReport.summary?.present       ?? 0, color: theme.success },
                                { label: 'Absent',  val: detailReport.summary?.absent        ?? 0, color: theme.danger  },
                                { label: 'Att. %',  val: (detailReport.summary?.attendancePct ?? 0) + '%', color: theme.accent },
                            ]} theme={theme} styles={styles} />

                            <AttendanceTable
                                rows={detailReport.finalReport || []}
                                readOnly={detailReport.status === 'finalized'}
                                onOverride={(rollNo, status) => overrideStatus(detailReport._id, rollNo, status)}
                                theme={theme} styles={styles}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatBar({ stats, theme, styles }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length},1fr)`, gap: 12, marginBottom: 16 }}>
            {stats.map(s => (
                <div key={s.label} style={{ ...styles.card, textAlign: 'center', padding: '18px 12px' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, fontFamily: theme.fontMono }}>{s.val}</div>
                    <div style={{ fontSize: '11px', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{s.label}</div>
                </div>
            ))}
        </div>
    );
}

function AttendanceTable({ rows, readOnly, onOverride, theme, styles }) {
    return (
        <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                        {['#','Roll No','ML Status','Confidence','Zone','First Seen','Final',
                          !readOnly && 'Override'].filter(Boolean).map(h => (
                            <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: '10px',
                                color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((s, i) => (
                        <tr key={s.rollNo} style={{ borderBottom: `1px solid ${theme.border}`,
                            background: s.finalStatus === 'R' ? theme.warningDim : 'transparent' }}>
                            <td style={{ padding: '10px 14px', color: theme.textMuted }}>{i + 1}</td>
                            <td style={{ padding: '10px 14px', fontFamily: theme.fontMono, fontWeight: 600 }}>{s.rollNo}</td>
                            <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                    background: s.status === 'present' ? theme.successDim : s.status === 'review' ? theme.warningDim : theme.dangerDim,
                                    color:      s.status === 'present' ? theme.success    : s.status === 'review' ? theme.warning    : theme.danger }}>
                                    {s.status || '—'}
                                </span>
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                                {s.avgConfidence > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 70, height: 5, borderRadius: '3px', background: theme.border, overflow: 'hidden' }}>
                                            <div style={{ width: `${s.avgConfidence * 100}%`, height: '100%',
                                                background: s.avgConfidence >= 0.65 ? theme.success : s.avgConfidence >= 0.45 ? theme.warning : theme.danger }} />
                                        </div>
                                        <span style={{ fontFamily: theme.fontMono, fontSize: '12px', color: theme.textMuted }}>
                                            {(s.avgConfidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ) : <span style={{ color: theme.textMuted }}>—</span>}
                            </td>
                            <td style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 600,
                                color: s.confidenceZone === 'high' ? theme.success : s.confidenceZone === 'medium' ? theme.warning : theme.textMuted }}>
                                {s.confidenceZone || '—'}
                            </td>
                            <td style={{ padding: '10px 14px', color: theme.textMuted, fontFamily: theme.fontMono, fontSize: '12px' }}>
                                {s.firstSeenSec != null ? `${Math.floor(s.firstSeenSec/60)}m ${Math.round(s.firstSeenSec%60)}s` : '—'}
                            </td>
                            <td style={{ padding: '10px 14px' }}>
                                <span style={{ padding: '3px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700,
                                    fontFamily: theme.fontMono,
                                    background: s.finalStatus === 'P' ? theme.successDim : s.finalStatus === 'R' ? theme.warningDim : theme.dangerDim,
                                    color:      s.finalStatus === 'P' ? theme.success    : s.finalStatus === 'R' ? theme.warning    : theme.danger }}>
                                    {s.finalStatus}
                                </span>
                            </td>
                            {!readOnly && (
                                <td style={{ padding: '10px 14px' }}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {['P','A','R'].map(st => (
                                            <button key={st} onClick={() => onOverride(s.rollNo, st)}
                                                disabled={s.finalStatus === st}
                                                style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px',
                                                    fontWeight: 700, cursor: 'pointer', border: 'none',
                                                    fontFamily: theme.fontMono, opacity: s.finalStatus === st ? 0.3 : 1,
                                                    background: st === 'P' ? theme.successDim : st === 'R' ? theme.warningDim : theme.dangerDim,
                                                    color:      st === 'P' ? theme.success    : st === 'R' ? theme.warning    : theme.danger }}>
                                                {st}
                                            </button>
                                        ))}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
