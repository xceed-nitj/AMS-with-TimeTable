// client/src/attendancemodule/ModelAnalytics.jsx
// Recognition accuracy dashboard — how often the model's automatic decision
// agreed with what a teacher later confirmed/corrected, broken down by
// confidence bucket, disagreement type, per-student override count, and
// trend over time. Distinct from modelperformance.jsx (embedding generation
// status), which lives at /attendance/model.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import getEnvironment from '../getenvironment';
import { theme, styles, cssReset } from './config';
import { useDepartments } from './useDepartments';

const apiUrl = getEnvironment();
const REPORTS_API = `${apiUrl}/attendancemodule/reports`;

function Toast({ toast }) {
  if (!toast) return null;
  const isError = toast.type === 'error';
  return (
    <div
      style={{
        position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9000, padding: '12px 20px', borderRadius: 8, fontSize: 13,
        fontWeight: 700, background: isError ? theme.danger : theme.success,
        color: '#ffffff', border: 'none', maxWidth: 420,
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
    >
      {toast.msg}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ ...styles.card, padding: 16 }}>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: theme.fontMono, color: accent || theme.text }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function rateColor(rate) {
  if (rate === null || rate === undefined) return theme.textMuted;
  if (rate >= 0.85) return theme.success;
  if (rate >= 0.65) return theme.warning;
  return theme.danger;
}

function pct(rate) {
  return rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)}%`;
}

export default function ModelAnalytics() {
  const { departments, deptLoading, deptError } = useDepartments();
  const [dept, setDept] = useState('');
  const [semester, setSemester] = useState('');
  const [availableSems, setAvailableSems] = useState([]);
  const [semsLoading, setSemsLoading] = useState(false);
  const [days, setDays] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = 'error') => {
    clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Fetch available semesters for the selected department — same endpoint
  // AttendanceReport.jsx's history tab uses for its dept → semester filter.
  useEffect(() => {
    if (!dept) {
      setAvailableSems([]);
      setSemester('');
      return;
    }
    setSemsLoading(true);
    fetch(`${apiUrl}/timetablemodule/lock/sems-by-dept?dept=${encodeURIComponent(dept)}`)
      .then((r) => r.json())
      .then((d) => {
        const sems = d.sems || [];
        setAvailableSems(sems);
        if (semester && !sems.includes(String(semester))) setSemester('');
      })
      .catch(() => showToast('Could not load semesters'))
      .finally(() => setSemsLoading(false));
    // semester intentionally excluded from deps — only dept changes should refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept, showToast]);

  const fetchMetrics = useCallback(async () => {
    if (!dept || !semester) {
      showToast('Select department and semester first');
      return;
    }
    setLoading(true);
    setData(null);
    try {
      const res = await fetch(
        `${REPORTS_API}/model-performance?department=${encodeURIComponent(dept)}&semester=${encodeURIComponent(semester)}&days=${days}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setData(json);
    } catch (err) {
      showToast(err.message);
    } finally {
      setLoading(false);
    }
  }, [dept, semester, days, showToast]);

  const trend = (data?.trend || []).map((t) => ({
    ...t,
    overridePct: Math.round(t.overrideRate * 1000) / 10,
  }));
  const calibration = data?.confidenceCalibration || [];
  const disagreements = data?.disagreementBreakdown || [];
  const topOverridden = data?.topOverriddenStudents || [];

  return (
    <div style={styles.page}>
      <style>{`
        ${cssReset}
        .ma-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ma-table th {
          background: ${theme.surfaceAlt}; color: ${theme.textMuted}; font-size: 10px;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          padding: 10px 12px; border-bottom: 1px solid ${theme.border}; text-align: left;
        }
        .ma-table td { padding: 9px 12px; border-bottom: 1px solid ${theme.border}; }
        .ma-table tr:last-child td { border-bottom: none; }
        .ma-table tr:hover td { background: ${theme.surfaceAlt}; }
        .ma-controls-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; }
      `}</style>

      <Toast toast={toast} />

      <div style={styles.heading}>Model Analytics</div>
      <div style={styles.subheading}>
        Recognition accuracy — how often the model&apos;s automatic call agreed with a teacher&apos;s later confirmation/correction
      </div>

      {/* Controls */}
      <section style={{ ...styles.card, marginBottom: 18 }}>
        <div className="ma-controls-row">
          <div style={{ minWidth: 200, flex: '2 1 200px' }}>
            <label style={styles.label}>Department</label>
            <select
              value={dept}
              onChange={(e) => { setDept(e.target.value); setData(null); }}
              style={styles.select}
              disabled={deptLoading}
            >
              <option value="">{deptLoading ? 'Loading...' : deptError ? 'Error' : 'Select...'}</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: 130, flex: '1 1 130px' }}>
            <label style={styles.label}>Semester</label>
            <select
              value={semester}
              onChange={(e) => { setSemester(e.target.value); setData(null); }}
              style={styles.select}
              disabled={!dept || semsLoading}
            >
              <option value="">{!dept ? 'Select Dept First' : semsLoading ? 'Loading...' : 'Select...'}</option>
              {availableSems.map((sem) => <option key={sem} value={sem}>{sem}</option>)}
            </select>
          </div>

          <div style={{ minWidth: 130, flex: '1 1 130px' }}>
            <label style={styles.label}>Time Range</label>
            <select value={days} onChange={(e) => setDays(e.target.value)} style={styles.select}>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>

          <button
            onClick={fetchMetrics}
            disabled={loading || !dept || !semester}
            style={{ ...styles.btnPrimary, opacity: loading || !dept || !semester ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {loading ? 'Loading...' : 'Fetch Data'}
          </button>
        </div>

        {dept && semester && (
          <div style={{ marginTop: 10, fontSize: 11, color: theme.textMuted }}>
            Department / Semester: <strong style={{ color: theme.text, fontFamily: theme.fontMono }}>{dept.replace(/_/g, ' ')} / Sem {semester}</strong>
          </div>
        )}
      </section>

      {!data && !loading && (
        <div style={{ ...styles.card, textAlign: 'center', color: theme.textMuted, padding: 40 }}>
          Select a department and semester and fetch data to see recognition accuracy.
        </div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 18 }}>
            <StatCard label="Total Records" value={data.overall.total} />
            <StatCard label="Agreement Rate" value={pct(data.overall.agreementRate)} accent={rateColor(data.overall.agreementRate)} />
            <StatCard label="Overrides" value={data.overall.overrides} accent={theme.warning} />
          </div>

          {/* Trend */}
          <section style={{ ...styles.card, marginBottom: 18 }}>
            <div style={styles.sectionTitle}>Override Rate Over Time</div>
            {trend.length === 0 ? (
              <div style={{ padding: 20, color: theme.textMuted, fontSize: 13 }}>No data in this range.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 4, right: 12, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: theme.textMuted }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Override rate']} labelFormatter={(d) => d} />
                  <Line type="monotone" dataKey="overridePct" name="Override rate" stroke={theme.danger} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Confidence calibration */}
          <section style={{ ...styles.card, marginBottom: 18 }}>
            <div style={styles.sectionTitle}>Agreement Rate by Confidence Bucket</div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12 }}>
              Where agreement drops off tells you where autoThreshold/reviewThreshold should sit.
            </div>
            {calibration.length === 0 ? (
              <div style={{ padding: 20, color: theme.textMuted, fontSize: 13 }}>No data in this range.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={calibration} margin={{ top: 4, right: 12, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
                  <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: theme.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(_, __, item) => [
                      item.payload.agreementRate === null ? '—' : `${Math.round(item.payload.agreementRate * 100)}%`,
                      'Agreement rate',
                    ]}
                  />
                  <Bar dataKey={(row) => (row.agreementRate === null ? 0 : Math.round(row.agreementRate * 100))} name="Agreement rate" radius={[4, 4, 0, 0]}>
                    {calibration.map((row, i) => <Cell key={i} fill={rateColor(row.agreementRate)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Disagreement breakdown + top overridden students */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <section style={styles.card}>
              <div style={styles.sectionTitle}>Disagreement Breakdown</div>
              {disagreements.length === 0 ? (
                <div style={{ padding: 20, color: theme.textMuted, fontSize: 13 }}>No overrides in this range.</div>
              ) : (
                <table className="ma-table">
                  <thead>
                    <tr><th>Model Said</th><th>Corrected To</th><th>Count</th></tr>
                  </thead>
                  <tbody>
                    {disagreements.map((d) => (
                      <tr key={`${d.from}-${d.to}`}>
                        <td style={{ fontFamily: theme.fontMono, fontWeight: 700 }}>{d.from}</td>
                        <td style={{ fontFamily: theme.fontMono, fontWeight: 700 }}>{d.to}</td>
                        <td>{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section style={styles.card}>
              <div style={styles.sectionTitle}>Most-Overridden Students</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 12 }}>
                Repeated corrections often mean a student&apos;s enrollment photos need refreshing.
              </div>
              {topOverridden.length === 0 ? (
                <div style={{ padding: 20, color: theme.textMuted, fontSize: 13 }}>No overrides in this range.</div>
              ) : (
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  <table className="ma-table">
                    <thead>
                      <tr><th>Roll No</th><th>Overrides</th><th>Total</th><th>Rate</th></tr>
                    </thead>
                    <tbody>
                      {topOverridden.map((s) => (
                        <tr key={s.rollNo}>
                          <td style={{ fontFamily: theme.fontMono, fontWeight: 700 }}>{s.rollNo}</td>
                          <td>{s.overrides}</td>
                          <td>{s.total}</td>
                          <td style={{ color: rateColor(1 - s.overrideRate) }}>{pct(s.overrideRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
