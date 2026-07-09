// client/src/attendancemodule/ERPSync.jsx
// ERP Sync — fetch each subject's enrolled roll numbers from the external
// ERP server (keyed by semester + subject abbreviation, e.g. "6DE") and
// generate that subject's embeddings for every model (InsightFace mean +
// top-K, AdaFace mean + top-K, subject PKLs for both spaces) using the same
// stateless generation pipeline as the Embedding Generation page.
//
// Mirrors EmbeddingGeneration.jsx's functionality: dept → semester cascade,
// "Search Institute Wise" widens ground-truth lookup across all departments
// (otherwise restricted to the selected dept), live SSE per-student progress.

import { useState, useRef, useCallback, useEffect } from 'react';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';
import { useDepartments } from './useDepartments';

const apiUrl = getEnvironment();
const ERP_SYNC_API = `${apiUrl}/attendancemodule/erp-sync`;

// Sentinel for the Semester dropdown's explicit "First Year" entry — must
// match FIRST_YEAR_SENTINEL in erpSyncController.js. First-year subjects
// have no real semester number (Subject.sem holds a section string), so
// they're unreachable through the normal numeric dropdown; this value picks
// them out explicitly, regardless of which numeric semesters the dept's
// timetable happens to expose.
const FIRST_YEAR_SENTINEL = 'FIRST_YEAR';
const EMB_API      = `${apiUrl}/attendancemodule/embeddings`;

// 'none'    — never generated
// 'stale'   — embeddings exist but predate the last ERP sync (roster may
//             have changed since); a failed/skipped generate also shows here
//             since embeddingUpdatedAt then stays behind erpSyncedAt
// 'current' — embeddings generated at or after the last sync
function embeddingStatus(s) {
  if (!s.embeddingUpdatedAt) return 'none';
  if (s.erpSyncedAt && new Date(s.embeddingUpdatedAt) < new Date(s.erpSyncedAt)) return 'stale';
  return 'current';
}

function StatusBadge({ status }) {
  const cfg = {
    done:       { bg: '#dcfce7', color: '#16a34a', label: 'done' },
    processing: { bg: '#e0e7ff', color: '#4f46e5', label: 'processing' },
    failed:     { bg: '#fee2e2', color: '#ef4444', label: 'failed' },
  }[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}

// `embedded` — rendered inside another page (the Subject Embeddings page's
// "ERP Embedding Generation" tab): skips the page wrapper, css reset and the
// big heading, which the host page already provides.
export default function ERPSync({ fixedDepartment, embedded = false }) {
  const { departments, deptLoading, deptError } = useDepartments();
  const [dept, setDept] = useState(fixedDepartment || '');
  const [semester, setSemester] = useState('');
  const [availableSems, setAvailableSems] = useState([]);
  const [semsLoading, setSemsLoading] = useState(false);
  const [instituteWise, setInstituteWise] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [erpConfigured, setErpConfigured] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [fetchingId, setFetchingId] = useState(null);
  const [bulkFetching, setBulkFetching] = useState(false);
  const [generatingId, setGeneratingId] = useState(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [progressSubject, setProgressSubject] = useState(null);
  const [progressRows, setProgressRows] = useState([]);
  const [doneSummary, setDoneSummary] = useState(null);
  const [expandedMissing, setExpandedMissing] = useState(null);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((msg, type = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Dept → semester cascade (same endpoint the other pages use)
  useEffect(() => {
    if (!dept) { setAvailableSems([]); setSemester(''); return; }
    setSemsLoading(true);
    fetch(`${apiUrl}/timetablemodule/lock/sems-by-dept?dept=${encodeURIComponent(dept)}`)
      .then((r) => r.json())
      .then((d) => {
        const sems = d.sems || [];
        setAvailableSems(sems);
        if (semester && semester !== FIRST_YEAR_SENTINEL && !sems.includes(String(semester))) setSemester('');
      })
      .catch(() => showToast('Could not load semesters', 'error'))
      .finally(() => setSemsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, showToast]);

  const loadSubjects = useCallback(async () => {
    if (!dept) return;
    setSubjectsLoading(true);
    try {
      const semQ = semester ? `&sem=${encodeURIComponent(semester)}` : '';
      const res = await fetch(`${ERP_SYNC_API}/subjects?dept=${encodeURIComponent(dept)}${semQ}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load subjects');
      setSubjects(data.subjects || []);
      setErpConfigured(data.erpConfigured !== false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubjectsLoading(false);
    }
  }, [dept, semester, showToast]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  // subject param carries the live row so fetchingId reflects real per-subject
  // progress — used both for the single "Fetch from ERP" button and, looped
  // sequentially, for "Fetch all from ERP" below.
  const fetchRolls = async (subject, { silent = false } = {}) => {
    setFetchingId(subject._id);
    try {
      const res = await fetch(`${ERP_SYNC_API}/fetch-rolls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: subject._id, instituteWise }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ERP fetch failed');
      if (!silent) showToast(`${subject.subName || subject.subjectFullName}: ${data.total} rolls (${data.missedCount} missing GT)`);
      await loadSubjects();
      return true;
    } catch (err) {
      showToast(`${subject.subName || subject.subjectFullName}: ${err.message}`, 'error');
      return false;
    } finally {
      setFetchingId(null);
    }
  };

  // Sequential client-side loop (not the one-shot bulk endpoint) so each
  // subject's row shows its own "Syncing…" state as it's reached, instead of
  // the whole table going dark until the batch finishes.
  const fetchAllRolls = async () => {
    if (!subjects.length) { showToast('No subjects to sync', 'error'); return; }
    setBulkFetching(true);
    let ok = 0, failed = 0;
    for (const subject of subjects) {
      // eslint-disable-next-line no-await-in-loop
      const success = await fetchRolls(subject, { silent: true });
      if (success) ok += 1; else failed += 1;
    }
    setBulkFetching(false);
    showToast(`Fetched ${ok}/${subjects.length} subjects from ERP${failed ? ` — ${failed} failed` : ''}`,
      failed ? 'error' : 'success');
  };

  // Reuses the Embedding Generation page's SSE endpoint — with subjectId
  // (Subject bookkeeping) and rosterExact (PKL contains exactly this roster).
  // skipConfirm: true when Generate-all already asked one blanket confirmation.
  const generateForSubject = async (subject, skipConfirm = false) => {
    if (!subject.enrolledRollNos?.length) {
      showToast('Fetch rolls from ERP first', 'error');
      return false;
    }
    if (subject.embeddingFile && !skipConfirm) {
      const ok = window.confirm(
        `"${subject.subjectFullName}" already has embeddings (${subject.embeddingFile}).\n\n`
        + 'Generating again will REPLACE the existing embedding file. Continue?'
      );
      if (!ok) return false;
    }
    setGeneratingId(subject._id);
    setProgressSubject(subject.subjectFullName || subject.subName);
    setProgressRows([]);
    setDoneSummary(null);
    try {
      const res = await fetch(`${EMB_API}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // First-year subjects generate under their derived student
          // semester (1/2) — their own sem field is a section string.
          sem: subject.isFirstYear ? subject.studentSem : subject.sem,
          subject: subject.subjectFullName,
          dept,
          subjectCode: subject.subCode || '',
          rollNos: subject.enrolledRollNos,
          // Institute-wide is automatic for first-year subjects — their
          // students' GT folders live under other departments' batches.
          instituteWise: instituteWise || !!subject.isFirstYear,
          subjectId: subject._id,
          rosterExact: true,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          try {
            const ev = JSON.parse(line.slice(6).trim());
            if (ev.type === 'student') {
              setProgressRows((prev) => {
                const others = prev.filter((r) => r.rollNo !== ev.rollNo);
                return [...others, { rollNo: ev.rollNo, status: ev.status, note: ev.reason || (ev.photosUsed ? `${ev.photosUsed} photos` : '') }];
              });
            } else if (ev.type === 'stage' || ev.type === 'warning') {
              setProgressRows((prev) => [...prev, { rollNo: '—', status: ev.type, note: ev.message }]);
            } else if (ev.type === 'done') {
              setDoneSummary(ev);
            } else if (ev.type === 'error') {
              throw new Error(ev.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
      showToast(`${subject.subName || subject.subjectFullName}: embeddings generated`);
      await loadSubjects();
      return true;
    } catch (err) {
      showToast(`Generate failed: ${err.message}`, 'error');
      return false;
    } finally {
      setGeneratingId(null);
    }
  };

  const generateAll = async () => {
    const ready = subjects.filter((s) => (s.rollCount || 0) > 0);
    if (!ready.length) { showToast('No subjects with ERP rolls yet', 'error'); return; }

    // One blanket confirmation for every subject whose embeddings would be
    // replaced — individual runs below are then not re-confirmed.
    const replacing = ready.filter((s) => s.embeddingFile);
    if (replacing.length > 0) {
      const preview = replacing.slice(0, 6).map((s) => s.subjectFullName).join(', ');
      const more = replacing.length > 6 ? ` and ${replacing.length - 6} more` : '';
      const ok = window.confirm(
        `${replacing.length} of ${ready.length} subjects already have embeddings `
        + `(${preview}${more}).\n\nGenerating will REPLACE their existing embedding files. `
        + 'Continue for all subjects?'
      );
      if (!ok) return;
    }

    setBulkGenerating(true);
    for (const subject of ready) {
      // sequential — one SSE run at a time, progress panel shows the current one
      // eslint-disable-next-line no-await-in-loop
      await generateForSubject(subject, true);
    }
    setBulkGenerating(false);
    showToast('Generate-all finished');
  };

  const busy = bulkFetching || bulkGenerating || !!generatingId || !!fetchingId;

  return (
    <div style={embedded ? undefined : styles.page}>
      {!embedded && <style>{cssReset}</style>}
      {toast && (
        <div style={{
          position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 9000,
          padding: '12px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: toast.type === 'error' ? theme.danger : theme.success, color: '#fff',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: embedded ? 14 : 24 }}>
        {!embedded && <div style={styles.heading}>ERP Sync</div>}
        <div style={{ ...styles.subheading, marginBottom: 0 }}>
          Fetch each subject&rsquo;s enrolled roll numbers from the ERP server (key: semester +
          subject abbreviation) and generate embeddings for every model — InsightFace, top-K
          galleries and AdaFace — over the fetched roster.
        </div>
      </div>

      {!erpConfigured && (
        <div style={{ ...styles.card, marginBottom: 16, borderLeft: `4px solid ${theme.warning}`, fontSize: 13 }}>
          ⚠ <strong>ERP_API_URL is not configured on the server.</strong> Subject listing works, but
          fetching rolls from the ERP will fail until the env vars (ERP_API_URL, optional
          ERP_API_KEY / ERP_ROLLS_PATH) are set on the Node server.
        </div>
      )}

      {/* Filters */}
      <section style={{ ...styles.card, marginBottom: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end' }}>
          <div style={{ minWidth: 220, flex: '2 1 220px' }}>
            <label style={styles.label}>Department</label>
            <select
              value={dept}
              onChange={(e) => { setDept(e.target.value); setSubjects([]); }}
              style={styles.select}
              disabled={deptLoading || !!fixedDepartment || busy}
            >
              <option value="">{deptLoading ? 'Loading...' : deptError ? 'Error' : 'Select...'}</option>
              {departments.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 130, flex: '1 1 130px' }}>
            <label style={styles.label}>Semester</label>
            <select
              value={semester}
              onChange={(e) => { setSemester(e.target.value); setSubjects([]); }}
              style={styles.select}
              disabled={!dept || semsLoading || busy}
            >
              <option value="">{!dept ? 'Select Dept First' : semsLoading ? 'Loading...' : 'All semesters'}</option>
              {dept && <option value={FIRST_YEAR_SENTINEL}>First Year</option>}
              {availableSems.map((sem) => <option key={sem} value={sem}>{sem}</option>)}
            </select>
          </div>
          <label
            title={semester === FIRST_YEAR_SENTINEL ? 'First-year subjects always search institute-wide' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.text, paddingBottom: 8, cursor: semester === FIRST_YEAR_SENTINEL ? 'not-allowed' : 'pointer' }}
          >
            <input
              type="checkbox"
              checked={instituteWise || semester === FIRST_YEAR_SENTINEL}
              onChange={(e) => setInstituteWise(e.target.checked)}
              disabled={busy || semester === FIRST_YEAR_SENTINEL}
            />
            Search Institute Wise{semester === FIRST_YEAR_SENTINEL ? ' (automatic for First Year)' : ''}
          </label>
          <div style={{ flex: 1 }} />
          <button
            onClick={fetchAllRolls}
            disabled={!dept || busy || !erpConfigured}
            style={{ ...styles.btnPrimary, opacity: (!dept || busy || !erpConfigured) ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {bulkFetching ? 'Fetching from ERP…' : semester ? 'Fetch all from ERP' : 'Fetch all sems from ERP'}
          </button>
          <button
            onClick={generateAll}
            disabled={!dept || busy || subjects.every((s) => !s.rollCount)}
            style={{ ...styles.btnPrimary, background: theme.success, opacity: (!dept || busy) ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {bulkGenerating ? 'Generating all…' : 'Generate all'}
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: theme.textMuted }}>
          Institute Wise widens ground-truth lookup across all departments; unchecked restricts it
          to {dept ? dept.replace(/_/g, ' ') : 'the selected department'} and this semester.
        </div>
      </section>

      {/* Subject table — grouped semester-wise */}
      <section style={{ ...styles.card, marginBottom: 18, padding: 0, overflowX: 'auto' }}>
        {!dept ? (
          <div style={{ padding: 32, textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>
            Select a department to list its subjects semester-wise.
          </div>
        ) : subjectsLoading ? (
          <div style={{ padding: 32, textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>Loading subjects…</div>
        ) : subjects.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: theme.textMuted, fontSize: 13 }}>
            No subjects found for this department{semester ? '/semester' : ''}.
          </div>
        ) : (
          <table className="ams-table" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: theme.surfaceAlt || '#f8fafc' }}>
                {['Subject', 'ERP key', 'Faculty (ERP)', 'Enrolled', 'Missing GT', 'Embedding file', 'Last synced', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                let lastGroup = null;
                for (const s of subjects) {
                  const group = s.groupLabel || `Semester ${s.sem}`;
                  if (group !== lastGroup) {
                    lastGroup = group;
                    rows.push(
                      <tr key={`group-${group}`}>
                        <td colSpan={8} style={{
                          padding: '8px 12px', background: theme.surfaceAlt || '#f1f5f9',
                          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.06em', color: theme.text,
                          borderBottom: `1px solid ${theme.border}`,
                        }}>
                          {group}
                          {s.isFirstYear && (
                            <span style={{ marginLeft: 8, fontWeight: 400, textTransform: 'none', color: theme.textMuted }}>
                              — taught by this department&rsquo;s faculty; institute-wide search applied automatically
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                  rows.push(
                    <tr key={s._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {s.subjectFullName}
                          {s.isFirstYear && (
                            <span
                              title="First-year (Basic Sciences) subject — ground-truth search runs institute-wide automatically"
                              style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: '#e0e7ff', color: '#4f46e5', verticalAlign: 'middle' }}
                            >
                              FIRST YEAR
                            </span>
                          )}
                          {s.embeddingFile && embeddingStatus(s) === 'current' && (
                            <span
                              title={`Embeddings up to date (${s.embeddingFile}) — generating again will replace them`}
                              style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: '#dcfce7', color: '#16a34a', verticalAlign: 'middle' }}
                            >
                              EMBEDDED
                            </span>
                          )}
                          {s.embeddingFile && embeddingStatus(s) === 'stale' && (
                            <span
                              title={`Roster changed since these embeddings were generated (${s.embeddingFile}) — regenerate`}
                              style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: '#fef3c7', color: '#b45309', verticalAlign: 'middle' }}
                            >
                              STALE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 10, color: theme.textMuted }}>{s.subCode} · {s.type}</div>
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: theme.fontMono, fontWeight: 600 }}>{s.erpKey}</td>
                      <td style={{ padding: '9px 12px', fontSize: 11 }}>
                        {s.erpFaculty ? (
                          <span>
                            {s.erpFaculty}
                            {s.facultyMatch === true && (
                              <span title={`Matches timetable: ${s.timetableFaculty}`} style={{ color: theme.success, fontWeight: 700 }}> ✓</span>
                            )}
                            {s.facultyMatch === false && (
                              <span title={`Timetable says: ${s.timetableFaculty || 'no entry found for this sem+abbreviation'}`} style={{ color: theme.warning, fontWeight: 700 }}> ⚠</span>
                            )}
                          </span>
                        ) : <span style={{ color: theme.textMuted }}>—</span>}
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: theme.fontMono }}>{s.rollCount || 0}</td>
                      <td style={{ padding: '9px 12px' }}>
                        {s.missedCount > 0 ? (
                          <button
                            onClick={() => setExpandedMissing(expandedMissing === s._id ? null : s._id)}
                            style={{ background: 'transparent', border: 'none', color: theme.warning, fontWeight: 700, cursor: 'pointer', fontSize: 12, padding: 0 }}
                          >
                            {s.missedCount} {expandedMissing === s._id ? '▲' : '▼'}
                          </button>
                        ) : (s.rollCount > 0 ? <span style={{ color: theme.success, fontWeight: 700 }}>0</span> : '—')}
                        {expandedMissing === s._id && (
                          <div style={{ marginTop: 6, fontFamily: theme.fontMono, fontSize: 10, color: theme.textMuted, maxWidth: 260, wordBreak: 'break-word' }}>
                            {s.missedGroundTruth.join(', ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px', fontFamily: theme.fontMono, fontSize: 11 }}>
                        {generatingId === s._id ? (
                          <span style={{ color: theme.accent, fontWeight: 700, fontFamily: theme.fontBody }}>⏳ Generating…</span>
                        ) : embeddingStatus(s) === 'current' ? (
                          <span title="Embeddings up to date with the last sync">
                            <span style={{ color: theme.success, fontWeight: 700 }}>✓ </span>{s.embeddingFile}
                          </span>
                        ) : embeddingStatus(s) === 'stale' ? (
                          <span title="Roster changed since these embeddings were generated — regenerate">
                            <span style={{ color: theme.warning, fontWeight: 700 }}>⚠ </span>{s.embeddingFile}
                          </span>
                        ) : (
                          <span style={{ color: theme.textMuted, fontFamily: theme.fontBody }}>— not generated</span>
                        )}
                      </td>
                      <td style={{ padding: '9px 12px', fontSize: 11, color: theme.textMuted }}>
                        {fetchingId === s._id ? (
                          <span style={{ color: theme.accent, fontWeight: 700 }}>⏳ Syncing…</span>
                        ) : s.erpSyncedAt ? (
                          <span>
                            <span style={{ color: theme.success, fontWeight: 700 }}>✓ </span>
                            {new Date(s.erpSyncedAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : 'never'}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => fetchRolls(s)}
                          disabled={busy || !erpConfigured}
                          style={{ padding: '5px 10px', marginRight: 6, borderRadius: 6, border: `1px solid ${theme.accent}`, background: 'transparent', color: theme.accent, fontSize: 11, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}
                        >
                          {fetchingId === s._id ? 'Fetching…' : 'Fetch from ERP'}
                        </button>
                        <button
                          onClick={() => generateForSubject(s)}
                          disabled={busy || !s.rollCount}
                          title={s.embeddingFile ? 'Embeddings exist — will ask before replacing' : undefined}
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: s.rollCount ? theme.success : theme.border, color: '#fff', fontSize: 11, fontWeight: 700, cursor: (busy || !s.rollCount) ? 'not-allowed' : 'pointer' }}
                        >
                          {generatingId === s._id ? 'Generating…' : s.embeddingFile ? 'Regenerate' : 'Generate'}
                        </button>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })()}
            </tbody>
          </table>
        )}
      </section>

      {/* Live generation progress */}
      {(progressSubject || doneSummary) && (
        <section style={{ ...styles.card }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
            Generation progress — {progressSubject}
            {generatingId && <span style={{ marginLeft: 8, fontSize: 11, color: theme.textMuted }}>(running…)</span>}
          </div>
          {doneSummary && (
            <div style={{ marginBottom: 12, fontSize: 12, padding: '8px 10px', background: theme.surfaceAlt || '#f8fafc', borderRadius: 6 }}>
              <strong style={{ color: theme.success }}>{doneSummary.success} succeeded</strong>
              {' · '}
              <strong style={{ color: doneSummary.failed ? theme.danger : theme.textMuted }}>{doneSummary.failed} failed</strong>
              {' · '}saved as <span style={{ fontFamily: theme.fontMono }}>{doneSummary.embeddingFile}</span>
              {' '}(+ AdaFace sibling when its model is loaded)
            </div>
          )}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            <table className="ams-table" style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Roll No', 'Status', 'Note'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 10, textTransform: 'uppercase', color: theme.textMuted, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {progressRows.map((r, i) => (
                  <tr key={`${r.rollNo}-${i}`} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ padding: '7px 12px', fontFamily: theme.fontMono, fontWeight: 600 }}>{r.rollNo}</td>
                    <td style={{ padding: '7px 12px' }}><StatusBadge status={r.status} /></td>
                    <td style={{ padding: '7px 12px', color: theme.textMuted }}>{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
