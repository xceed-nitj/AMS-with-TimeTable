// client/src/attendancemodule/confidenceMonitor.jsx
// Per-student embedding drift monitoring — flags students with declining confidence

import { useCallback, useEffect, useRef, useState } from 'react';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset } from './config';

const apiUrl = getEnvironment();
const REPORTS_API = `${apiUrl}/attendancemodule/reports`;

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

function TrendArrow({ confidences }) {
  if (confidences.length < 2)
    return <span style={{ color: theme.textMuted }}>—</span>;
  const nonZero = confidences.filter((c) => c.confidence > 0);
  if (nonZero.length < 2)
    return <span style={{ color: theme.textMuted }}>—</span>;
  const first = nonZero[0].confidence;
  const last = nonZero[nonZero.length - 1].confidence;
  const diff = last - first;
  if (Math.abs(diff) < 0.02)
    return <span style={{ color: theme.textMuted, fontSize: 16 }}>→</span>;
  if (diff > 0)
    return <span style={{ color: theme.success, fontSize: 16 }}>↑</span>;
  return <span style={{ color: theme.danger, fontSize: 16 }}>↓</span>;
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
  const [batch, setBatch] = useState(
    'BTECH_ELECTRONICS_AND_COMMUNICATION_ENGINEERING_2023',
  );
  const [days, setDays] = useState('60');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'drifting' | 'stable'
  const [search, setSearch] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'error') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const fetchTrend = useCallback(async () => {
    if (!batch.trim()) {
      showToast('Batch name is required');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(
        `${REPORTS_API}/confidence-trend?batch=${encodeURIComponent(batch.trim())}&days=${days}`,
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

  useEffect(() => {
    fetchTrend();
  }, []);

  // Derived data
  const students = data?.students || [];
  const allDates = [
    ...new Set(students.flatMap((s) => s.confidences.map((c) => c.date))),
  ].sort();

  const filtered = students.filter((s) => {
    if (filter === 'drifting' && !s.isDrifting) return false;
    if (filter === 'stable' && s.isDrifting) return false;
    if (search && !s.rollNo.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const driftingCount = students.filter((s) => s.isDrifting).length;
  const stableCount = students.length - driftingCount;

  return (
    <div style={styles.page}>
      <style>{`
                ${cssReset}
                .cm-hero {
                    position: relative;
                    overflow: hidden;
                    border-radius: 18px;
                    border: 1px solid ${theme.border};
                    background:
                        radial-gradient(circle at 15% 20%, rgba(239,68,68,0.08), transparent 30%),
                        radial-gradient(circle at 85% 10%, rgba(99,102,241,0.08), transparent 28%),
                        linear-gradient(135deg, #eef0fc 0%, #f5f6fb 100%);
                    padding: 28px;
                    margin-bottom: 22px;
                }
                .ams-table { font-size: 12px; }
                .cm-conf-cell {
                    text-align: center;
                    border-radius: 5px;
                    padding: 3px 6px;
                    font-weight: 600;
                    font-size: 11px;
                    min-width: 44px;
                    display: inline-block;
                }
                .cm-filter-btn {
                    padding: 7px 16px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    border: 1px solid ${theme.border};
                    background: ${theme.surface};
                    color: ${theme.textMuted};
                    transition: all 0.15s;
                }
                .cm-filter-btn.active {
                    background: ${theme.accentDim};
                    color: ${theme.accent};
                    border-color: ${theme.accent};
                }
                .drift-badge {
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
                .stable-badge {
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
            `}</style>

      <Toast toast={toast} />

      {/* Hero */}
      <section className="cm-hero">
        <div
          style={{
            ...styles.badge('danger'),
            display: 'inline-flex',
            marginBottom: 12,
          }}
        >
          Embedding drift monitor
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            marginBottom: 8,
            color: theme.text,
          }}
        >
          Student Confidence Monitor
        </div>
        <div
          style={{
            color: theme.textMuted,
            fontSize: 14,
            lineHeight: 1.7,
            maxWidth: 760,
          }}
        >
          Tracks per-student face match confidence over time. Flags students
          whose confidence is consistently declining — indicating embedding
          drift that may need re-capture.
        </div>
      </section>

      {/* Controls */}
      <section style={{ ...styles.card, marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <label style={styles.label}>Batch</label>
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="e.g. BTECH_ELECTRONICS_AND_COMMUNICATION_ENGINEERING_2023"
              style={styles.input}
            />
          </div>
          <div style={{ minWidth: 140 }}>
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
            onClick={fetchTrend}
            disabled={loading}
            style={{
              ...styles.btnPrimary,
              alignSelf: 'flex-end',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>
      </section>

      {/* Summary stats */}
      {data && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div style={{ ...styles.card, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: theme.text }}>
              {students.length}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
              Total Students
            </div>
          </div>
          <div
            style={{
              ...styles.card,
              textAlign: 'center',
              borderColor: 'rgba(239,68,68,0.3)',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: theme.danger }}>
              {driftingCount}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
              Drifting ⚠️
            </div>
          </div>
          <div
            style={{
              ...styles.card,
              textAlign: 'center',
              borderColor: 'rgba(16,185,129,0.3)',
            }}
          >
            <div
              style={{ fontSize: 28, fontWeight: 800, color: theme.success }}
            >
              {stableCount}
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
              Stable ✓
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {data && (
        <section style={styles.card}>
          {/* Filters */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {['all', 'drifting', 'stable'].map((f) => (
                <button
                  key={f}
                  className={`cm-filter-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all'
                    ? `All (${students.length})`
                    : f === 'drifting'
                      ? `⚠️ Drifting (${driftingCount})`
                      : `✓ Stable (${stableCount})`}
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roll number..."
              style={{ ...styles.input, width: 200 }}
            />
          </div>

          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: 48,
                color: theme.textMuted,
                fontSize: 14,
              }}
            >
              No students match this filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="ams-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Status</th>
                    <th>Trend</th>
                    <th>Lowest Conf</th>
                    {allDates.map((d) => (
                      <th key={d}>{d.slice(5)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((student) => {
                    const confMap = {};
                    student.confidences.forEach((c) => {
                      confMap[c.date] = c.confidence;
                    });
                    const nonZeroConfs = student.confidences.filter(
                      (c) => c.confidence > 0,
                    );
                    const lowestConf =
                      nonZeroConfs.length > 0
                        ? Math.min(...nonZeroConfs.map((c) => c.confidence))
                        : null;

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
                        <td>
                          {student.isDrifting ? (
                            <span className="drift-badge">⚠ Drifting</span>
                          ) : (
                            <span className="stable-badge">✓ Stable</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <TrendArrow confidences={student.confidences} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {lowestConf !== null ? (
                            <span
                              className="cm-conf-cell"
                              style={{
                                background: confidenceBg(lowestConf),
                                color: confidenceColor(lowestConf),
                              }}
                            >
                              {(lowestConf * 100).toFixed(0)}%
                            </span>
                          ) : (
                            <span style={{ color: theme.textMuted }}>—</span>
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
                                <span style={{ color: theme.border }}>·</span>
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
