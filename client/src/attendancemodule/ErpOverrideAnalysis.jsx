// client/src/attendancemodule/ErpOverrideAnalysis.jsx
// Per-period drill-down from the ERP Overrides list. For every student whose
// final status was overridden in one AttendanceReport, shows the original
// model decision vs the ERP decision, both remarks (faculty read-only +
// coordinator 6-option verification), the confidence of each original run,
// what the alternate (shadow) models would have decided, and a deep link into
// FrameVerification that locates the student in the annotated frames.
//
// Reads the full report document from GET /attendancemodule/reports/:id — no
// dedicated endpoint. The coordinator-remark PATCH is the same one the list
// page uses. Visit with ?demo=1 and a demo id to preview without a backend.

import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const REPORT_API = `${apiUrl}/attendancemodule/reports`;

const STATUS_LABEL = { P: 'Present', A: 'Absent', R: 'Review' };

const COORDINATOR_REMARK_OPTIONS = [
  'No ground truth',
  'Student came late',
  'Change in student appearance',
  'Sitting in last row',
  'Sitting in middle row',
  'Lighting issues',
];

// Shadow models, newest→oldest display order. Each carries the per_student
// field names its comparison object uses (they differ per model).
const SHADOW_MODELS = [
  { key: 'meanComparison',     label: 'Mean',    primaryId: 'mean',    scoreField: 'mean_score',    altScoreField: 'mean_score',    baseScoreField: 'primary_score', altRollField: 'mean_roll' },
  { key: 'matchingComparison', label: 'Max-of-K', primaryId: 'max_k',  scoreField: 'max_k_score',   altScoreField: 'max_k_score',   baseScoreField: 'mean_score',    altRollField: 'max_k_roll' },
  { key: 'faissComparison',    label: 'FAISS',   primaryId: 'faiss',   scoreField: 'faiss_score',   altScoreField: 'faiss_score',   baseScoreField: 'mean_score',    altRollField: 'faiss_roll' },
  { key: 'adafaceComparison',  label: 'AdaFace', primaryId: 'adaface', scoreField: 'adaface_score', altScoreField: 'adaface_score', baseScoreField: 'mean_score',    altRollField: 'adaface_roll' },
];

function StatusChip({ code }) {
  const color =
    code === 'P' ? theme.success : code === 'R' ? theme.warning : theme.danger;
  const bg =
    code === 'P' ? theme.successDim : code === 'R' ? theme.warningDim : theme.dangerDim;
  return (
    <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, color, background: bg }}>
      {code ? (STATUS_LABEL[code] || code) : '—'}
    </span>
  );
}

function ZoneChip({ zone }) {
  if (!zone) return <span style={{ color: theme.textMuted }}>—</span>;
  const color = zone === 'high' ? theme.success : zone === 'medium' ? theme.warning : theme.danger;
  const bg = zone === 'high' ? theme.successDim : zone === 'medium' ? theme.warningDim : theme.dangerDim;
  return (
    <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', color, background: bg }}>
      {zone}
    </span>
  );
}

// ── Demo report — exercises all three shadow-comparison variants ────────────
const DEMO_REPORT = {
  _id: 'demo-1',
  date: '2026-07-08',
  timeSlot: '09:00-10:00',
  room: 'CSE-301',
  subject: 'Digital Signal Processing',
  faculty: 'Dr. Meera Nair',
  semester: '5',
  batch: 'BTECH_CSE_2023',
  department: 'CSE',
  summary: { present: 42, absent: 5, totalStudents: 47 },
  finalReport: [
    {
      rollNo: '21CS014', autoFinalStatus: 'A', finalStatus: 'A', erpOverriddenStatus: 'P', isOverridden: true,
      avgConfidence: 0.71, confidenceZone: 'medium', firstSeenSec: 45,
      facultyRemark: 'Student came late, matched on second check',
      coordinatorRemark: '', coordinatorVerified: false,
    },
    {
      rollNo: '21CS027', autoFinalStatus: 'P', finalStatus: 'P', erpOverriddenStatus: 'A', isOverridden: true,
      avgConfidence: 0.34, confidenceZone: 'low', firstSeenSec: 12,
      facultyRemark: 'Left the room, marked absent manually',
      coordinatorRemark: 'Student came late', coordinatorVerified: true,
    },
  ],
  slotResults: [
    {
      slot: '09:00-check1', frameSnapshot: 'CSE-301_PERIOD1_20260708',
      students: [
        { rollNo: '21CS014', status: 'absent', avgConfidence: 0.0, confidenceZone: 'low', firstSeenSec: null },
        { rollNo: '21CS027', status: 'present', avgConfidence: 0.62, confidenceZone: 'medium', firstSeenSec: 12 },
      ],
      matchingComparison: { enabled: false },
      faissComparison: { enabled: false },
      adafaceComparison: { enabled: false },
      meanComparison: { enabled: false },
      primaryModel: 'mean', primaryFallback: false,
    },
    {
      slot: '09:00-check2', frameSnapshot: 'CSE-301_PERIOD1_20260708',
      students: [
        { rollNo: '21CS014', status: 'present', avgConfidence: 0.71, confidenceZone: 'medium', firstSeenSec: 45 },
        { rollNo: '21CS027', status: 'review', avgConfidence: 0.34, confidenceZone: 'low', firstSeenSec: 12 },
      ],
      primaryModel: 'mean', primaryFallback: false,
      matchingComparison: {
        enabled: true, top_k: 5, clusters_compared: 46, agree: 44, disagree: 2,
        per_student: {
          '21CS014': { mean_score: 0.71, max_k_score: 0.78, max_k_roll: null, agree: true },
          '21CS027': { mean_score: 0.34, max_k_score: 0.41, max_k_roll: '21CS031', agree: false },
        },
      },
      faissComparison: {
        enabled: true, top_k: 10, recog_threshold: 0.4, clusters_compared: 46, agree: 45, disagree: 1,
        per_student: {
          '21CS014': { mean_score: 0.71, faiss_score: 0.69, faiss_roll: null, agree: true },
          '21CS027': { mean_score: 0.34, faiss_score: 0.30, faiss_roll: null, agree: true },
        },
      },
      adafaceComparison: {
        enabled: true, top_k: 10, recog_threshold: 0.4, clusters_compared: 46, agree: 43, disagree: 3,
        per_student: {
          '21CS027': { mean_score: 0.34, adaface_score: 0.52, adaface_roll: '21CS009', agree: false },
        },
      },
      meanComparison: { enabled: false },
    },
    {
      slot: '09:00-check3', frameSnapshot: 'CSE-301_PERIOD1_20260708',
      students: [
        { rollNo: '21CS014', status: 'present', avgConfidence: 0.68, confidenceZone: 'medium', firstSeenSec: 45 },
      ],
      matchingComparison: { enabled: true, skipped: true, reason: 'no shadow run on final check' },
      faissComparison: { enabled: true, skipped: true, reason: 'no shadow run on final check' },
      adafaceComparison: { enabled: true, skipped: true, reason: 'no shadow run on final check' },
      meanComparison: { enabled: false },
      primaryModel: 'mean', primaryFallback: false,
    },
  ],
};

export default function ErpOverrideAnalysis() {
  const { reportId } = useParams();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  const demoSuffix = isDemo ? '?demo=1' : '';

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [errorKey, setErrorKey] = useState(null);

  const load = useCallback(async () => {
    if (isDemo && String(reportId).startsWith('demo')) {
      setReport(DEMO_REPORT);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${REPORT_API}/${reportId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load report');
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [reportId, isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  const saveCoordinatorRemark = async (rollNo, coordinatorRemark) => {
    if (!coordinatorRemark) return;
    setSavingKey(rollNo);
    setErrorKey(null);
    if (isDemo) {
      setReport((prev) => ({
        ...prev,
        finalReport: prev.finalReport.map((s) =>
          s.rollNo === rollNo ? { ...s, coordinatorRemark, coordinatorVerified: true } : s,
        ),
      }));
      setSavingKey(null);
      return;
    }
    try {
      const res = await fetch(`${REPORT_API}/${reportId}/student/${rollNo}/coordinator-remark`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinatorRemark }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save remark');
      setReport((prev) => ({
        ...prev,
        finalReport: prev.finalReport.map((s) =>
          s.rollNo === rollNo ? { ...s, coordinatorRemark, coordinatorVerified: true } : s,
        ),
      }));
    } catch (err) {
      setErrorKey(rollNo);
    } finally {
      setSavingKey(null);
    }
  };

  const overridden = (report?.finalReport || []).filter((s) => s.isOverridden);
  const runs = report?.slotResults || [];

  // Newest run that actually decided attendance defines the primary model.
  const primaryRun = [...runs].reverse().find((r) => r.primaryModel);
  const primaryModel = primaryRun?.primaryModel || null;
  const primaryFallback = Boolean(primaryRun?.primaryFallback);

  const frameLink = (roll, firstSeenSec) => {
    const params = new URLSearchParams({
      room: report.room || '',
      date: report.date || '',
      period: report.timeSlot || '',
    });
    if (roll) params.set('roll', roll);
    if (firstSeenSec != null) params.set('sec', String(Math.round(firstSeenSec)));
    return `/attendance/frame-verification?${params.toString()}`;
  };

  return (
    <>
      <style>{cssReset}</style>
      <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: theme.fontBody, padding: 'clamp(16px,3vw,32px)' }}>
        <Link to={`/attendance/erp-overrides${demoSuffix}`} style={{ color: theme.accent, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
          ← Back to ERP Overrides
        </Link>

        <div style={{ margin: '14px 0 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(17px,2.5vw,22px)', letterSpacing: '-0.03em', marginBottom: 3 }}>
            Override Analysis
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>
            {loading
              ? 'Loading…'
              : report
                ? `${overridden.length} overridden student${overridden.length === 1 ? '' : 's'} in this session`
                : ''}
          </div>
        </div>

        {error && (
          <div style={{ padding: 16, borderRadius: 8, background: theme.dangerDim, color: theme.danger, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!loading && !error && report && (
          <>
            {/* Session context */}
            <div style={{ ...styles.card, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 28px', alignItems: 'center' }}>
                <Field label="Date" value={report.date} />
                <Field label="Period" value={report.timeSlot} />
                <Field label="Room" value={report.room} />
                <Field label="Subject" value={report.subject} />
                <Field label="Faculty" value={report.faculty} />
                <Field label="Sem" value={report.semester} />
                <Field label="Batch" value={report.batch} mono />
                <Field label="Present" value={report.summary?.present} />
                <Field label="Absent" value={report.summary?.absent} />
                <div style={{ marginLeft: 'auto' }}>
                  <Link
                    to={frameLink(null, null)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: theme.accent, fontWeight: 600, fontSize: 12, textDecoration: 'none' }}
                  >
                    View all frames →
                  </Link>
                </div>
              </div>
            </div>

            {overridden.length === 0 && (
              <div style={{ ...styles.card, padding: 32, textAlign: 'center', color: theme.textMuted }}>
                No overridden students in this report.
              </div>
            )}

            {overridden.map((s) => (
              <StudentCard
                key={s.rollNo}
                s={s}
                runs={runs}
                primaryModel={primaryModel}
                primaryFallback={primaryFallback}
                frameLink={frameLink}
                saveCoordinatorRemark={saveCoordinatorRemark}
                saving={savingKey === s.rollNo}
                saveFailed={errorKey === s.rollNo}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}

const labelStyle = {
  fontSize: 10, fontWeight: 700, color: theme.textMuted,
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
};

function fmt(v) {
  return typeof v === 'number' ? v.toFixed(3) : '—';
}

// Compact per-student card. Header + prominent remarks stay visible; the
// per-run confidence and shadow-model tables collapse behind a toggle so the
// card stays short. Status is "Completed" once a coordinator remark is set.
function StudentCard({ s, runs, primaryModel, primaryFallback, frameLink, saveCoordinatorRemark, saving, saveFailed }) {
  const [open, setOpen] = useState(false);
  const [gtPhoto, setGtPhoto] = useState(null); // '' = looked up, none found
  const completed = Boolean(s.coordinatorRemark);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/attendancemodule/ground-truth-photo-by-roll/${encodeURIComponent(s.rollNo)}`, { credentials: 'include' });
        const data = await res.json();
        if (!cancelled) setGtPhoto(data.photo || '');
      } catch (_) {
        if (!cancelled) setGtPhoto('');
      }
    })();
    return () => { cancelled = true; };
  }, [s.rollNo]);

  return (
    <div style={{ ...styles.card, padding: 0, marginBottom: 12, overflow: 'hidden' }}>
      {/* Header strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '10px 14px', borderBottom: `1px solid ${theme.border}` }}>
        {gtPhoto
          ? <img src={`data:image/jpeg;base64,${gtPhoto}`} alt={`${s.rollNo} ground truth`}
                 style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', border: `1px solid ${theme.border}` }} />
          : <div style={{ width: 40, height: 40, borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: theme.textMuted }}>
              {gtPhoto === null ? '…' : 'no GT'}
            </div>}
        <span style={{ fontWeight: 700, fontFamily: theme.fontMono, fontSize: 15 }}>{s.rollNo}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Model</span>
          <StatusChip code={s.autoFinalStatus || s.finalStatus} />
          <span style={{ color: theme.textMuted }}>→</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ERP</span>
          {/* ERP's correction lives in its own field — finalStatus is no
              longer mutated; legacy rows fall back to finalStatus. */}
          <StatusChip code={s.erpOverriddenStatus || s.finalStatus} />
        </div>
        <span
          style={{
            padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
            color: completed ? theme.success : theme.warning,
            background: completed ? theme.successDim : theme.warningDim,
          }}
        >
          {completed ? '✓ Completed' : 'Pending'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link
            to={`/attendance/groundtruth/edit?rollNo=${encodeURIComponent(s.rollNo)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.accent, fontWeight: 600, fontSize: 12, textDecoration: 'none' }}
          >
            Update ground truth →
          </Link>
          <Link
            to={frameLink(s.rollNo, s.firstSeenSec)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: theme.accent, fontWeight: 600, fontSize: 12, textDecoration: 'none' }}
          >
            Locate in frames →
          </Link>
        </div>
      </div>

      {/* Remarks — the primary content, given full width and emphasis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, padding: 14 }}>
        <div style={{ padding: 12, borderRadius: 8, background: theme.surfaceAlt, borderLeft: `3px solid ${theme.textMuted}` }}>
          <div style={labelStyle}>Faculty remark</div>
          <div style={{ fontSize: 14, lineHeight: 1.45, color: s.facultyRemark ? theme.text : theme.textMuted, fontStyle: s.facultyRemark ? 'normal' : 'italic' }}>
            {s.facultyRemark || 'No remark provided'}
          </div>
        </div>
        <div style={{ padding: 12, borderRadius: 8, background: completed ? theme.successDim : theme.warningDim, borderLeft: `3px solid ${completed ? theme.success : theme.warning}` }}>
          <div style={labelStyle}>Coordinator remark</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <select
              value={s.coordinatorRemark || ''}
              disabled={saving}
              onChange={(e) => saveCoordinatorRemark(s.rollNo, e.target.value)}
              style={{ flex: '1 1 180px', fontSize: 14, padding: '8px 10px', borderRadius: 6, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody, background: theme.surface }}
            >
              <option value="">Select a reason…</option>
              {COORDINATOR_REMARK_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {saving && <span style={{ color: theme.textMuted, fontSize: 12 }}>Saving…</span>}
            {saveFailed && <span style={{ color: theme.danger, fontSize: 12 }}>Save failed</span>}
          </div>
        </div>
      </div>

      {/* Collapsible detail: per-run confidence + shadow-model decisions */}
      <div style={{ padding: '0 14px 14px' }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ ...styles.btnGhost, padding: '5px 10px', fontSize: 12 }}
        >
          {open ? '▲ Hide run & model details' : '▼ Show run & model details'}
        </button>

        {open && (
          <div style={{ marginTop: 12, overflowX: 'auto' }}>
            {/* One matrix: runs as columns, per-run confidence metrics AND each
                shadow model's per-run verdict as rows. */}
            <table className="ams-table" style={{ minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Metric / Model</th>
                  {runs.map((run, i) => (
                    <th key={i} style={{ whiteSpace: 'nowrap' }}>{`Run ${i + 1} · ${run.slot || ''}`}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <RunRow label="Status" runs={runs} rollNo={s.rollNo} render={(st) =>
                  st ? <StatusChip code={st.status === 'present' ? 'P' : st.status === 'review' ? 'R' : 'A'} /> : <Dash />} />
                <RunRow label="Avg confidence" runs={runs} rollNo={s.rollNo} render={(st) =>
                  st ? fmt(st.avgConfidence) : <Dash />} />
                <RunRow label="Zone" runs={runs} rollNo={s.rollNo} render={(st) =>
                  st ? <ZoneChip zone={st.confidenceZone} /> : <Dash />} />
                <RunRow label="First seen (s)" runs={runs} rollNo={s.rollNo} render={(st) =>
                  st && st.firstSeenSec != null ? st.firstSeenSec : <Dash />} />

                <tr>
                  <td colSpan={runs.length + 1} style={{ background: theme.surfaceAlt, fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Model decisions (vs primary)
                  </td>
                </tr>
                {SHADOW_MODELS.map((m) => (
                  <tr key={m.key}>
                    <td style={{ textAlign: 'left' }}>
                      <ModelName m={m} isPrimary={primaryModel === m.primaryId} primaryFallback={primaryFallback} />
                    </td>
                    {runs.map((run, i) => {
                      const block = run[m.key];
                      const usable = block?.enabled && !block?.skipped;
                      const cmp = usable ? block.per_student?.[s.rollNo] : null;
                      if (!usable) return <td key={i} style={{ textAlign: 'center', color: theme.textMuted }}><Dash /></td>;
                      if (!cmp) return <td key={i} style={{ textAlign: 'center', color: theme.textMuted }}>·</td>;
                      const altScore = cmp[m.altScoreField];
                      const altRoll = cmp[m.altRollField];
                      return (
                        <td key={i} style={{ textAlign: 'center', fontFamily: theme.fontMono, fontSize: 11 }}
                            title={!cmp.agree && altRoll ? `would match ${altRoll}` : ''}>
                          {cmp.agree
                            ? <span style={{ color: theme.success, fontWeight: 700 }}>✓ {fmt(altScore)}</span>
                            : <span style={{ color: theme.warning, fontWeight: 700 }}>⚠ {altRoll || '?'} {fmt(altScore)}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: mono ? theme.fontMono : theme.fontBody }}>
        {value === 0 || value ? value : '—'}
      </div>
    </div>
  );
}

function Dash() {
  return <span style={{ color: theme.textMuted }}>—</span>;
}

function ModelName({ m, isPrimary, primaryFallback }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {m.label}
      {isPrimary && (
        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700, color: theme.accent, background: theme.accentDim, letterSpacing: '0.04em' }}>
          PRIMARY{primaryFallback ? ' · fallback' : ''}
        </span>
      )}
    </span>
  );
}

// One metric row across all runs — picks this student's per-run record.
function RunRow({ label, runs, rollNo, render }) {
  return (
    <tr>
      <td style={{ textAlign: 'left', fontWeight: 600 }}>{label}</td>
      {runs.map((run, i) => {
        const st = (run.students || []).find((x) => x.rollNo === rollNo) || null;
        return <td key={i} style={{ textAlign: 'center' }}>{render(st)}</td>;
      })}
    </tr>
  );
}
