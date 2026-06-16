// client/src/attendancemodule/confidenceMonitor.jsx
// Per-student confidence monitoring — flags students with low avg confidence
// so their ground truth can be improved.

import { useCallback, useEffect, useRef, useState } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset, DEGREES } from './config';

const apiUrl = getEnvironment();
const REPORTS_API = `${apiUrl}/attendancemodule/reports`;
const GT_API = `${apiUrl}/attendancemodule/ground-truth`;
const YEARS = Array.from({ length: 7 }, (_, i) =>
  String(new Date().getFullYear() - i),
);
const LOW_CONF_THRESHOLD = 0.6;
const HIGH_CONF_THRESHOLD = 0.8;

// Helpers

function confidenceColor(val) {
  if (val >= 0.6) return theme.success;
  if (val >= 0.4) return theme.warning;
  if (val > 0) return theme.danger;
  return theme.textMuted;
}

function confidenceBg(val) {
  if (val >= 0.6) return theme.successDim;
  if (val >= 0.4) return theme.warningDim;
  if (val > 0) return theme.dangerDim;
  return 'transparent';
}

// Low / Normal / High / Undefined band, also used as the filter key.
function confBand(avgConf) {
  if (avgConf <= 0) return 'undefined';
  if (avgConf < LOW_CONF_THRESHOLD) return 'low';
  if (avgConf < HIGH_CONF_THRESHOLD) return 'normal';
  return 'high';
}

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  const color = isError ? theme.danger : theme.success;
  const bg = isError ? theme.dangerDim : theme.successDim;
  return (
    <div
      style={{
        position: 'fixed',
        top: 82,
        right: 20,
        zIndex: 2147483647,
        padding: '12px 20px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        background: bg,
        color,
        border: `1px solid ${color}`,
        maxWidth: 420,
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      {toast.msg}
    </div>
  );
}

// Main Component

export default function ConfidenceMonitor() {
  const [degree, setDegree] = useState('');
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('');
  const [departments, setDepts] = useState([]);
  const [days, setDays] = useState('60');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [depsLoading, setDepsLoading] = useState(false);
  const [filter, setFilter] = useState('low'); // 'low' | 'normal' | 'high' | 'undefined' | 'all'
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'error') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Fetch departments when degree changes
  useEffect(() => {
    if (!degree) {
      setDepts([]);
      setDept('');
      return;
    }
    setDepsLoading(true);
    fetch(`${GT_API}/departments`)
      .then((r) => r.json())
      .then((d) => {
        const depts = (d.departments || [])
          .map((item) => (typeof item === 'string' ? item : item.dept))
          .filter(Boolean);
        setDepts(depts);
        setDept('');
      })
      .catch(() => showToast('Could not load departments'))
      .finally(() => setDepsLoading(false));
  }, [degree]);

  const batch =
    degree && dept && year
      ? `${degree}_${dept.trim().replace(/\s+/g, '_').toUpperCase()}_${year}`
      : '';

  const fetchTrend = useCallback(async () => {
    if (!batch) {
      showToast('Select degree, department and year first');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(
        `${REPORTS_API}/confidence-trend?batch=${encodeURIComponent(batch)}&days=${days}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setData(json);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }, [batch, days, showToast]);

  // Derived data
  const students = data?.students || [];

  // Flag students whose average non-zero confidence is below threshold
  const enriched = students.map((s) => {
    const nonZero = s.confidences.filter((c) => c.confidence > 0);
    const avgConf =
      nonZero.length > 0
        ? nonZero.reduce((sum, c) => sum + c.confidence, 0) / nonZero.length
        : 0;
    const isLowConf = avgConf > 0 && avgConf < LOW_CONF_THRESHOLD;
    const semester = s.semester ?? 'N/A';
    return { ...s, avgConf, isLowConf, semester };
  });

  const allDates = [
    ...new Set(students.flatMap((s) => s.confidences.map((c) => c.date))),
  ].sort();

  const sorted = [...enriched].sort((a, b) => {
    if (a.avgConf !== b.avgConf) return a.avgConf - b.avgConf;
    return a.rollNo.localeCompare(b.rollNo);
  });

  const filtered = sorted.filter((s) => {
    if (filter !== 'all' && confBand(s.avgConf) !== filter) return false;
    if (search && !s.rollNo.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  // Group filtered students by semester (preserving global avgConf ordering).
  const semesterOrder = [...new Set(enriched.map((s) => s.semester))].sort(
    (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }),
  );

  const semesterGroups = semesterOrder.map((sem) => {
    const semAll = enriched.filter((s) => s.semester === sem);
    const semFiltered = filtered.filter((s) => s.semester === sem);
    const bandCounts = semAll.reduce((acc, s) => {
      const b = confBand(s.avgConf);
      acc[b] = (acc[b] || 0) + 1;
      return acc;
    }, {});
    return { sem, semFiltered, bandCounts, total: semAll.length };
  });

  const BAND_DEFS = [
    { key: 'low', label: 'Low', color: theme.danger },
    { key: 'normal', label: 'Normal', color: theme.warning },
    { key: 'high', label: 'High', color: theme.success },
    { key: 'undefined', label: 'Undefined', color: theme.textMuted },
    { key: 'all', label: 'All', color: theme.accent },
  ];

  return (
    <div style={styles.page}>
      <style>{`
                ${cssReset}
                .cm-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 12px;
                }
                .cm-table th {
                    background: ${theme.surfaceAlt};
                    color: ${theme.textMuted};
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.07em;
                    padding: 10px 12px;
                    border-bottom: 1px solid ${theme.border};
                    text-align: left;
                    white-space: nowrap;
                }
                .cm-table td {
                    padding: 9px 12px;
                    border-bottom: 1px solid ${theme.border};
                    vertical-align: middle;
                }
                .cm-table tr:last-child td { border-bottom: none; }
                .cm-table tr:hover td { background: ${theme.surfaceAlt}; }
                .cm-conf-cell {
                    text-align: center;
                    border-radius: 5px;
                    padding: 3px 6px;
                    font-weight: 600;
                    font-size: 11px;
                    min-width: 44px;
                    display: inline-block;
                }
                .low-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    background: ${theme.dangerDim};
                    color: ${theme.danger};
                    border: 1px solid rgba(239,68,68,0.25);
                }
                .normal-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    background: ${theme.successDim};
                    color: ${theme.success};
                    border: 1px solid rgba(16,185,129,0.25);
                }
                .cm-controls-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 14px;
                    align-items: flex-end;
                }
                .cm-controls-row .cm-fetch-btn {
                    flex-shrink: 0;
                    align-self: flex-end;
                }
                .sem-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                    margin-bottom: 10px;
                }
                .sem-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 6px 14px;
                    border-radius: 8px;
                    background: ${theme.accentDim};
                    border: 1px solid rgba(99,102,241,0.2);
                    font-size: 13px;
                    font-weight: 700;
                    color: ${theme.accent};
                    margin-right: 4px;
                }
                .sem-split-btn {
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    border: 1px solid transparent;
                    background: transparent;
                    padding: 4px 10px;
                    border-radius: 6px;
                    transition: all 0.15s;
                }
                .sem-split-btn:hover {
                    background: ${theme.surfaceAlt};
                }
                .sem-split-btn.active {
                    background: ${theme.surfaceAlt};
                    border-color: currentColor;
                }
                .sem-search-wrap {
                    margin-left: auto;
                    flex: 1 1 200px;
                    max-width: 240px;
                }
                @media (max-width: 640px) {
                    .sem-search-wrap {
                        margin-left: 0;
                        flex: 1 1 100%;
                        max-width: none;
                    }
                }
            `}</style>

      <Toast toast={toast} />

      {/* Single line title */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: theme.text,
          marginBottom: 18,
        }}
      >
        Student Confidence Monitor
      </div>

      {/* Controls */}
      <section style={{ ...styles.card, marginBottom: 18 }}>
        <div className="cm-controls-row">
          {/* Degree */}
          <div style={{ minWidth: 130, flex: '1 1 130px' }}>
            <label style={styles.label}>Degree</label>
            <select
              value={degree}
              onChange={(e) => {
                setDegree(e.target.value);
                setData(null);
              }}
              style={styles.select}
            >
              <option value="">Select...</option>
              {DEGREES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div style={{ minWidth: 200, flex: '2 1 200px' }}>
            <label style={styles.label}>Department</label>
            <select
              value={dept}
              onChange={(e) => {
                setDept(e.target.value);
                setData(null);
              }}
              style={styles.select}
              disabled={!degree || depsLoading}
            >
              <option value="">
                {depsLoading ? 'Loading...' : 'Select...'}
              </option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div style={{ minWidth: 110, flex: '1 1 110px' }}>
            <label style={styles.label}>Year</label>
            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setData(null);
              }}
              style={styles.select}
              disabled={!dept}
            >
              <option value="">Select...</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Time range */}
          <div style={{ minWidth: 130, flex: '1 1 130px' }}>
            <label style={styles.label}>Time Range</label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              style={styles.select}
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <button
            className="cm-fetch-btn"
            onClick={fetchTrend}
            disabled={loading || !batch}
            style={{
              ...styles.btnPrimary,
              opacity: loading || !batch ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>

        {/* Batch preview */}
        {batch && (
          <div style={{ marginTop: 10, fontSize: 11, color: theme.textMuted }}>
            Batch:{' '}
            <strong style={{ color: theme.text, fontFamily: theme.fontMono }}>
              {batch}
            </strong>
          </div>
        )}
      </section>

      {/* Tables, grouped by semester */}
      {data && (
        <section style={styles.card}>
          {semesterGroups.map(
            ({ sem, semFiltered, bandCounts, total }, idx) => (
              <div
                key={sem}
                style={{
                  marginBottom: idx < semesterGroups.length - 1 ? 28 : 0,
                }}
              >
                <div className="sem-header">
                  <span className="sem-badge">Semester {sem}</span>
                  {BAND_DEFS.map((b) => (
                    <button
                      key={b.key}
                      className={`sem-split-btn ${filter === b.key ? 'active' : ''}`}
                      style={{ color: b.color }}
                      onClick={() => setFilter(b.key)}
                    >
                      {b.label}:{' '}
                      {b.key === 'all' ? total : bandCounts[b.key] || 0}
                    </button>
                  ))}
                  {idx === 0 && (
                    <div className="sem-search-wrap">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search roll number..."
                        maxLength={8}
                        style={{ ...styles.input, width: '100%' }}
                      />
                    </div>
                  )}
                </div>
                {semFiltered.length === 0 ? (
                  <div
                    style={{
                      padding: '16px 0',
                      color: theme.textMuted,
                      fontSize: 13,
                    }}
                  >
                    No students match this search.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="cm-table">
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Avg Conf</th>
                          <th>Flag</th>
                          {allDates.map((d) => (
                            <th key={d}>{d.slice(5)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {semFiltered.map((student) => {
                          const confMap = {};
                          student.confidences.forEach((c) => {
                            confMap[c.date] = c.confidence;
                          });

                          return (
                            <tr key={student.rollNo}>
                              <td>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: theme.text,
                                    fontFamily: theme.fontMono,
                                    fontSize: 12,
                                  }}
                                >
                                  {student.rollNo}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                {student.avgConf > 0 ? (
                                  <span
                                    className="cm-conf-cell"
                                    style={{
                                      background: confidenceBg(student.avgConf),
                                      color: confidenceColor(student.avgConf),
                                    }}
                                  >
                                    {(student.avgConf * 100).toFixed(0)}%
                                  </span>
                                ) : (
                                  <span style={{ color: theme.textMuted }}>
                                    —
                                  </span>
                                )}
                              </td>
                              <td>
                                {student.isLowConf ? (
                                  <span className="low-badge">
                                    ⚠ Needs GT Fix
                                  </span>
                                ) : (
                                  <span className="normal-badge">✓ OK</span>
                                )}
                              </td>
                              {allDates.map((d) => {
                                const val = confMap[d];
                                return (
                                  <td key={d} style={{ textAlign: 'center' }}>
                                    {val !== undefined ? (
                                      val > 0 ? (
                                        <span
                                          className="cm-conf-cell"
                                          style={{
                                            background: confidenceBg(val),
                                            color: confidenceColor(val),
                                          }}
                                        >
                                          {(val * 100).toFixed(0)}%
                                        </span>
                                      ) : (
                                        <span
                                          style={{
                                            color: theme.textMuted,
                                            fontSize: 11,
                                          }}
                                        >
                                          0
                                        </span>
                                      )
                                    ) : (
                                      <span style={{ color: theme.border }}>
                                        ·
                                      </span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ),
          )}
        </section>
      )}

      {loading && (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: theme.textMuted,
            fontSize: 14,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: `3px solid ${theme.border}`,
              borderTopColor: theme.accent,
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          Loading confidence data...
        </div>
      )}
    </div>
  );
}
