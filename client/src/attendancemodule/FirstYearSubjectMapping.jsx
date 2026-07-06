// client/src/attendancemodule/FirstYearSubjectMapping.jsx
//
// First-year (Basic Sciences) subject → embedding generation.
//
// Originally this screen let an admin manually pick a "concerned
// department" per subject. That manual step has been removed: the
// department is now auto-detected directly from each subject's `sem`
// string (e.g. "B.Tech-IT-SectionA3" → IT; "B.Tech-CH+VLSI-SectionB6" →
// CH + VLSI), and the page's action is now "Generate Embeddings" per
// subject, reusing the existing embedding pipeline:
//   - GET  /attendancemodule/embeddings/enrolled-roll-nos/:sem/:dept
//   - POST /attendancemodule/embeddings/generate
// No new backend logic was needed for this — both endpoints already
// existed and already do exactly this (resolve students from the
// `Student` collection, generate + stream embedding progress via SSE).
//
// This file — and everything it talks to — lives entirely inside
// attendanceModule / attendancemodule. It only *reads* two existing,
// already-public timetable-module endpoints (session lookup + code
// lookup) the same way RecordStream.jsx / groundtruthgen_rtsp.jsx already
// do; it does not add, edit, or import anything from modules/timetableModule
// or client/src/timetableadmin.

import { useState, useEffect, useMemo } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset } from './config';

const apiUrl = getEnvironment();
const TIMETABLE_API = `${apiUrl}/timetablemodule/timetable`;
const MAPPING_API = `${apiUrl}/attendancemodule/firstyearsubjectmapping`;
const EMB_BASE = `${apiUrl}/attendancemodule/embeddings`;
const BASIC_SCIENCES_DEPT = 'Basic Sciences';

// "B.Tech-IT-SectionA3" → ["IT"]
// "B.Tech-CH+VLSI-SectionB6" → ["CH", "VLSI"]
// "B.Tech-ME_SectionB4" → ["ME"]  (some entries use "_Section" instead of "-Section")
// Falls back to [] if the sem string doesn't match either shape — callers
// should treat an empty array as "couldn't auto-detect".
function deptTokensFromSem(semStr) {
  const m = /^B\.Tech-(.+?)[-_]Section/i.exec(String(semStr || '').trim());
  if (!m) return [];
  return m[1]
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function FirstYearSubjectMapping() {
  const [allSessions, setAllSessions] = useState([]);
  const [session, setSession] = useState('');
  const [firstYearCode, setFirstYearCode] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(''); // New state to manage selected department/branch filter token
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // First-year students are sem 1 (Odd) or sem 2 (Even) on the Student
  // collection (a plain number there, unlike Subject.sem which stores the
  // batch/section string). We default-guess from the session label but
  // let the admin override explicitly — this is a single global toggle,
  // not a per-subject manual step.
  const [studentSem, setStudentSem] = useState(1);

  // Per-subject generation state: { [subjectId]: { running, rows, summary, error } }
  const [genState, setGenState] = useState({});

  const showToast = (message, type = 'success') => {
    setToastMsg({ message, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Step 1: Initial load that orchestrates metadata and resolves the initial operational session focus target
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const sessData = await fetch(`${TIMETABLE_API}/sess/allsessanddept`, {
          credentials: 'include',
        }).then((r) => r.json());
        const sessions = Array.isArray(sessData?.uniqueSessions)
          ? sessData.uniqueSessions
          : [];
        setAllSessions(sessions);

        if (sessions.length > 0) {
          // Priority Tier 1: Look specifically for the "2025-26 (odd)" or variant configuration profiles
          const priorityItem = sessions.find((s) => {
            const normalized = String(s.session || '').trim().toLowerCase();
            return normalized === '2025-26 (odd)' || normalized === '2025-2026 (odd)';
          });

          let selectedSession = '';
          if (priorityItem && priorityItem.session) {
            selectedSession = priorityItem.session;
          } else {
            // Priority Tier 2: Gracefully fall back to the dynamic system active configuration row
            const activeItem = sessions.find((s) => s.currentSession === true);
            selectedSession = activeItem?.session || sessions[0].session;
          }

          setSession(selectedSession);
          // Automated Semester Resolution: Deduce target scope based explicitly on session string contents
          setStudentSem(/even/i.test(selectedSession) ? 2 : 1);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
        setError('Failed to load sessions from the timetable module.');
        setLoading(false);
      }
    })();
  }, []);

  // Step 2: Reactive configuration block that reloads structural matrices whenever the session targets are switched
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      setSubjects([]);
      setFirstYearCode('');
      setSelectedBranch(''); // Reset the department/branch filter when session scales
      try {
        const allCodes = await fetch(
          `${TIMETABLE_API}/getallcodes/${encodeURIComponent(session)}`,
          { credentials: 'include' }
        ).then((r) => r.json());
        
        if (cancelled) return;

        const match = (Array.isArray(allCodes) ? allCodes : []).find(
          (t) => String(t.dept || '').trim() === BASIC_SCIENCES_DEPT
        );
        if (!match?.code) {
          setError(`No active "${BASIC_SCIENCES_DEPT}" timetable registry found for session: ${session}.`);
          setLoading(false);
          return;
        }
        setFirstYearCode(match.code);

        const subjectList = await fetch(
          `${MAPPING_API}/subjects/${encodeURIComponent(match.code)}`,
          { credentials: 'include' }
        ).then((r) => r.json());
        
        if (cancelled) return;
        setSubjects(Array.isArray(subjectList) ? subjectList : []);
      } catch (err) {
        console.error('Error loading first-year subjects:', err);
        if (!cancelled) setError('Failed to initialize first-year subject configuration maps.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  // Synchronize student semester calculation dynamically whenever a user changes sessions via dropdown controls
  const handleSessionChange = (selectedSession) => {
    setSession(selectedSession);
    setStudentSem(/even/i.test(selectedSession) ? 2 : 1);
  };

  // Dynamically extract and sort all unique branch tokens available across loaded subjects
  const availableBranches = useMemo(() => {
    const tokens = new Set();
    subjects.forEach((sub) => {
      const depts = deptTokensFromSem(sub.sem);
      depts.forEach((d) => tokens.add(d));
    });
    return [...tokens].sort();
  }, [subjects]);

  // Reactively filter subjects based on the top selected branch selection token
  const filteredSubjects = useMemo(() => {
    if (!selectedBranch) return subjects;
    return subjects.filter((sub) => {
      const depts = deptTokensFromSem(sub.sem);
      return depts.includes(selectedBranch);
    });
  }, [subjects, selectedBranch]);

  const patchGenState = (subjectId, patch) =>
    setGenState((prev) => ({
      ...prev,
      [subjectId]: { ...(prev[subjectId] || {}), ...patch },
    }));

  const handleGenerateEmbeddings = async (subject) => {
    const deptTokens = deptTokensFromSem(subject.sem);
    if (deptTokens.length === 0) {
      showToast(
        `Failed to parse operational tokens from context: "${subject.sem}". Expected layout pattern: "B.Tech-<DEPT>-Section...".`,
        'error'
      );
      return;
    }

    patchGenState(subject._id, {
      running: true,
      rows: [],
      summary: null,
      error: null,
    });

    try {
      // Resolve enrolled roll numbers from the Student collection for each
      // detected dept token, merged + deduped. Passing rollNos explicitly
      // to /generate below means its own dept-regex matching (which would
      // break on a "+" in a compound dept string) never runs.
      const rollSets = await Promise.all(
        deptTokens.map((dept) =>
          fetch(
            `${EMB_BASE}/enrolled-roll-nos/${encodeURIComponent(
              studentSem
            )}/${encodeURIComponent(dept)}`,
            { credentials: 'include' }
          )
            .then((r) => r.json())
            .then((d) => (Array.isArray(d.rollNos) ? d.rollNos : []))
        )
      );
      const rollNos = [...new Set(rollSets.flat())];

      if (rollNos.length === 0) {
        patchGenState(subject._id, {
          running: false,
          error: `No student records located corresponding to Academic Semester: ${studentSem}, Division Token(s): ${deptTokens.join(', ')}.`,
        });
        showToast('No enrolled student entities matching selected scope parameters.', 'error');
        return;
      }

      const deptLabel = deptTokens.join('+');
      const res = await fetch(`${EMB_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sem: String(studentSem),
          subject: subject.subName,
          dept: deptLabel,
          subjectCode: subject.subCode,
          rollNos,
          instituteWise: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server communication exception returned status code: ${res.status}`);
      }

      const initRows = rollNos.map((r) => ({ rollNo: r, status: 'pending' }));
      patchGenState(subject._id, { rows: initRows });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
              setGenState((prev) => {
                const rows = (prev[subject._id]?.rows || []).map((r) =>
                  r.rollNo === msg.rollNo
                    ? { ...r, status: msg.status, reason: msg.reason || null }
                    : r
                );
                return { ...prev, [subject._id]: { ...prev[subject._id], rows } };
              });
            }
            if (msg.type === 'done') {
              patchGenState(subject._id, {
                summary: {
                  success: msg.success,
                  failed: msg.failed,
                  embeddingFile: msg.embeddingFile,
                  missedRollNos: msg.missedRollNos || [],
                },
              });
              showToast(
                `Generation Finalized - ${subject.subName}: ${msg.success} Succeeded, ${msg.failed} Exceptions Encountered.`
              );
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error('Error generating embeddings:', err);
      patchGenState(subject._id, { error: err.message });
      showToast(err.message || 'Automated embedding generation task terminated unexpectedly.', 'error');
    } finally {
      patchGenState(subject._id, { running: false });
    }
  };

  const groupedBySem = useMemo(() => {
    const grouped = {};
    filteredSubjects.forEach((s) => {
      const sem = s.sem || 'Unassigned';
      if (!grouped[sem]) grouped[sem] = [];
      grouped[sem].push(s);
    });
    return grouped;
  }, [filteredSubjects]);

  const sortedSems = Object.keys(groupedBySem).sort();

  return (
    <div style={styles.page}>
      <style>{cssReset}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        
        {/* True Floating Viewport Toast Notification Overlay Banner */}
        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              padding: '12px 20px',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: '14px',
              zIndex: 9999,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideIn 0.2s ease-out forwards',
              backgroundColor: 
                toastMsg.type === 'error' 
                  ? '#EF4444' 
                  : toastMsg.type === 'warning' 
                  ? '#F59E0B' 
                  : '#10B981',
            }}
          >
            {toastMsg.type === 'success' && '✅'}
            {toastMsg.type === 'warning' && '⚠️'}
            {toastMsg.type === 'error' && '❌'}
            <span>{toastMsg.message}</span>
          </div>
        )}

        <style>{`
          @keyframes slideIn {
            from { transform: translateY(12px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Header Block Control Context Layout */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
              Generate Embeddings — First Year Subjects
            </h1>
            <p style={{ color: theme.textMuted, fontSize: 14, marginTop: 6, marginBottom: 0 }}>
              The concerned handling department is auto-detected directly from each subject's structural section string parameter. Select your parameters via the dropdown options below to seamlessly filter your workspace views.
            </p>
          </div>

          {/* Clean Dropdown Selection Strip Grid Component */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', backgroundColor: theme.surfaceAlt, padding: '8px 16px', borderRadius: 6, border: `1px solid ${theme.border}` }}>
            
            {/* Smooth Academic Dropdown Selector Component */}
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
              Academic Session:
              <select
                style={{ ...styles.select, width: 'auto', minWidth: 160, padding: '4px 8px', margin: 0 }}
                value={session}
                onChange={(e) => handleSessionChange(e.target.value)}
              >
                {allSessions.length === 0 && <option value="">Loading session configurations...</option>}
                {allSessions.map((s) => (
                  <option key={s.session} value={s.session}>
                    {s.session} {s.currentSession ? ' (Active)' : ''}
                  </option>
                ))}
              </select>
            </label>

            {/* Newly Appended High-UX Dynamic Department/Branch Filter Selector Dropdown Component */}
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, display: 'flex', alignItems: 'center', gap: 8, borderLeft: `1px solid ${theme.border}`, paddingLeft: 16 }}>
              Filter by Department/Branch:
              <select
                style={{ ...styles.select, width: 'auto', minWidth: 160, padding: '4px 8px', margin: 0 }}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={subjects.length === 0}
              >
                <option value="">All Departments</option>
                {availableBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch} Division
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* High-Level Clean Subheader Metrics Context (Registry Code Hidden) */}
        {session && !loading && subjects.length > 0 && (
          <div style={{ fontSize: 12, color: theme.accent, fontFamily: theme.fontMono, marginBottom: 16, display: 'flex', gap: 12 }}>
            <span>Target Session: {session}</span>
            <span>·</span>
            <span>Resolved Student Semester: Semester {studentSem}</span>
            <span>·</span>
            <span>Total Tracked Curriculum Entities: {subjects.length}</span>
            {selectedBranch && (
              <>
                <span>·</span>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>Filtered Focus: {selectedBranch} Only</span>
              </>
            )}
          </div>
        )}

        <div style={styles.mainContent}>
          {loading && !subjects.length ? (
            <div style={{ ...styles.card, textAlign: 'center', padding: 40 }}>
              Synchronizing foundational subject registry configurations...
            </div>
          ) : error ? (
            <div style={{ ...styles.card, color: theme.danger }}>⚠️ {error}</div>
          ) : filteredSubjects.length === 0 ? (
            /* Explicit Professional English Empty State Component View Block */
            <div style={{ ...styles.card, textAlign: 'center', padding: '56px 24px', color: theme.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: theme.text, marginBottom: 6 }}>
                No Academic Records Discovered
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: '1.5', maxWidth: '520px', margin: '0 auto' }}>
                There are currently no foundational curriculum subjects matching your filtration parameters registered under the "{BASIC_SCIENCES_DEPT}" operational division for session ({session || 'N/A'}). Please verify your dropdown selections or initialize definitions.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {sortedSems.map((sem) => (
                <div key={sem} style={styles.card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: theme.text }}>
                    {sem}
                    <span style={{ color: theme.textMuted, fontWeight: 400 }}>
                      {' '}({groupedBySem[sem].length} subjects registered)
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ textAlign: 'left', fontSize: 11, color: theme.textMuted, textTransform: 'uppercase' }}>
                          <th style={{ padding: '6px 8px' }}>Subject Identification</th>
                          <th style={{ padding: '6px 8px' }}>Course Code</th>
                          <th style={{ padding: '6px 8px' }}>Auto-detected Handling Branch</th>
                          <th style={{ padding: '6px 8px' }}>Operation Progress State</th>
                          <th style={{ padding: '6px 8px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedBySem[sem].map((subject) => {
                          const deptTokens = deptTokensFromSem(subject.sem);
                          const state = genState[subject._id] || {};
                          const total = state.rows?.length || 0;
                          const doneCount =
                            state.rows?.filter(
                              (r) => r.status === 'done' || r.status === 'failed'
                            ).length || 0;

                          return (
                            <tr key={subject._id} style={{ borderTop: `1px solid ${theme.border}` }}>
                              <td style={{ padding: '8px' }}>
                                <div style={{ fontWeight: 600 }}>{subject.subName}</div>
                                <div style={{ fontSize: 12, color: theme.textMuted }}>
                                  {subject.subjectFullName}
                                </div>
                              </td>
                              <td style={{ padding: '8px', fontSize: 13 }}>{subject.subCode}</td>
                              <td style={{ padding: '8px' }}>
                                {deptTokens.length > 0 ? (
                                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: theme.accentDim, color: theme.accent, fontWeight: 600 }}>
                                    {deptTokens.join(' + ')}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: theme.dangerDim, color: theme.danger, fontWeight: 600 }}>
                                    Detection Error
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '8px', fontSize: 12, color: theme.textMuted, minWidth: 160 }}>
                                {state.running ? (
                                  <span>
                                    Generating… {doneCount}/{total}
                                  </span>
                                ) : state.summary ? (
                                  <span style={{ color: theme.success, fontWeight: 600 }}>
                                    {state.summary.success} ok · {state.summary.failed} failed
                                  </span>
                                ) : state.error ? (
                                  <span style={{ color: theme.danger }}>{state.error}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td style={{ padding: '8px' }}>
                                <button
                                  style={{
                                    ...styles.btnPrimary,
                                    padding: '6px 14px',
                                    fontSize: 12,
                                    opacity: deptTokens.length === 0 ? 0.5 : 1,
                                  }}
                                  disabled={state.running || deptTokens.length === 0}
                                  onClick={() => handleGenerateEmbeddings(subject)}
                                >
                                  {state.running ? 'Generating…' : 'Generate Embeddings'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}