// client/src/attendancemodule/ErpOverrides.jsx
// Audit page: attendance reports containing at least one student whose final
// status was manually/ERP-overridden after the model's original decision
// (AttendanceReport.finalReport[].isOverridden). Shows filter-wide overview
// stats, department (full-access) + semester/faculty filters, and rows grouped
// date-wise. Each period links to the per-report Override Analysis page and to
// the captured frames (FrameVerification). Dept coordinators verify each
// override with a fixed-vocabulary remark inline.

import { Fragment, useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { theme, styles, cssReset } from './config';
import BackButton from './BackButton';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const API = `${apiUrl}/attendancemodule/reports/erp-overrides`;

// Preview-only sample data — visit this page with ?demo=1 to see the layout
// without a live backend. Not used in normal operation.
const DEMO_ITEMS = [
  {
    reportId: 'demo-1',
    date: '2026-07-08',
    timeSlot: '09:00-10:00',
    semester: '5',
    subject: 'Digital Signal Processing',
    faculty: 'Dr. Meera Nair',
    room: 'CSE-301',
    department: 'CSE',
    summary: { present: 42, absent: 5, total: 47 },
    overrides: [
      { rollNo: '21CS014', from: 'A', to: 'P', facultyRemark: 'Student came late, matched on second check', coordinatorRemark: '', coordinatorVerified: false },
      { rollNo: '21CS027', from: 'P', to: 'A', facultyRemark: 'Left the room, marked absent manually', coordinatorRemark: 'Student came late', coordinatorVerified: true },
    ],
  },
  {
    reportId: 'demo-2',
    date: '2026-07-08',
    timeSlot: '10:00-11:00',
    semester: '3',
    subject: 'Data Structures',
    faculty: 'Dr. Arvind Rao',
    room: 'CSE-105',
    department: 'CSE',
    summary: { present: 38, absent: 2, total: 40 },
    overrides: [
      { rollNo: '22CS002', from: 'R', to: 'P', facultyRemark: '', coordinatorRemark: '', coordinatorVerified: false },
    ],
  },
  {
    reportId: 'demo-3',
    date: '2026-07-07',
    timeSlot: '11:00-12:00',
    semester: '5',
    subject: 'Digital Signal Processing',
    faculty: 'Dr. Meera Nair',
    room: 'CSE-301',
    department: 'CSE',
    summary: { present: 44, absent: 3, total: 47 },
    overrides: [
      { rollNo: '21CS041', from: 'A', to: 'P', facultyRemark: 'Confirmed present, sitting in last row out of camera range', coordinatorRemark: 'Sitting in last row', coordinatorVerified: true },
    ],
  },
];

// Filter-wide overview stats, computed the same way the server does.
function computeDemoStats(items) {
  let overriddenStudents = 0;
  let verified = 0;
  for (const r of items) {
    for (const o of r.overrides) {
      overriddenStudents += 1;
      if (o.coordinatorVerified) verified += 1;
    }
  }
  return { sessions: items.length, overriddenStudents, verified, unverified: overriddenStudents - verified };
}

export default function ErpOverrides() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [semester, setSemester] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [deptContext, setDeptContext] = useState(null);

  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';
  const demoSuffix = isDemo ? '?demo=1' : '';

  // Whether to offer a department selector — only full-access admins pick a
  // department; dept coordinators are server-locked to their own.
  useEffect(() => {
    if (isDemo) {
      setDeptContext({ fullAccess: true, department: null });
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/attendancemodule/dept-admin/context`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setDeptContext(data);
      } catch (_) { /* selector just stays hidden */ }
    })();
  }, [isDemo]);

  const load = useCallback(async () => {
    if (isDemo) {
      setLoading(false);
      setError(null);
      setItems(DEMO_ITEMS);
      setTotal(DEMO_ITEMS.length);
      setStats(computeDemoStats(DEMO_ITEMS));
      setDepartments(['CSE', 'ECE']);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (semester) params.set('semester', semester);
      if (faculty) params.set('faculty', faculty);
      if (department) params.set('department', department);
      const res = await fetch(`${API}?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load overrides');
      setItems(data.items || []);
      setTotal(data.total || 0);
      setStats(data.stats || null);
      if (data.departments) setDepartments(data.departments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, semester, faculty, department, isDemo]);

  useEffect(() => {
    load();
  }, [load]);

  const semesterOptions = useMemo(
    () => [...new Set(items.map((r) => r.semester).filter(Boolean))].sort(),
    [items],
  );
  const facultyOptions = useMemo(
    () => [...new Set(items.map((r) => r.faculty).filter(Boolean))].sort(),
    [items],
  );

  // Group rows by date (server already sorts date-desc) for date-wise browsing.
  const grouped = useMemo(() => {
    const byDate = new Map();
    for (const r of items) {
      if (!byDate.has(r.date)) byDate.set(r.date, []);
      byDate.get(r.date).push(r);
    }
    return [...byDate.entries()].map(([date, rows]) => ({
      date,
      rows,
      overrideCount: rows.reduce((n, r) => n + r.overrides.length, 0),
    }));
  }, [items]);

  const showDeptSelect = Boolean(deptContext?.fullAccess);

  return (
    <>
      <style>{cssReset}</style>
      <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: theme.fontBody, padding: 'clamp(16px,3vw,32px)' }}>
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 'clamp(17px,2.5vw,22px)', letterSpacing: '-0.03em', marginBottom: 3 }}>
              ERP Overrides
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted }}>
              Attendance sessions where a student&rsquo;s final status was manually changed from the model&rsquo;s original decision.
            </div>
          </div>
          <BackButton />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          <StatCard label="Sessions with overrides" value={stats?.sessions} loading={loading} />
          <StatCard label="Overridden students" value={stats?.overriddenStudents} loading={loading} />
          <StatCard label="Verified" value={stats?.verified} loading={loading} color={theme.success} />
          <StatCard label="Unverified" value={stats?.unverified} loading={loading} color={theme.warning} />
        </div>

        <div style={{ ...styles.card, padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {showDeptSelect && (
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody }}
              >
                <option value="">All</option>
                {(departments || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody }}
            >
              <option value="">All</option>
              {semesterOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Faculty
            </label>
            <select
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody }}
            >
              <option value="">All</option>
              {facultyOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>
            {loading ? 'Loading…' : `${total} session${total === 1 ? '' : 's'} with overrides`}
          </div>
        </div>

        {error && (
          <div style={{ padding: 16, borderRadius: 8, background: theme.dangerDim, color: theme.danger, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ ...styles.card, padding: 0, overflowX: 'auto' }}>
          <table className="ams-table" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                <th>Period</th>
                <th>Sem</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th style={{ textAlign: 'center' }}>Overrides</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: theme.textMuted, padding: 32 }}>
                    No overridden attendance records found.
                  </td>
                </tr>
              )}
              {grouped.map((group) => (
                <Fragment key={group.date}>
                  <tr>
                    <td colSpan={6} style={{ background: theme.surfaceAlt, padding: '8px 12px' }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{group.date}</span>
                      <span style={{ color: theme.textMuted, fontSize: 12, marginLeft: 10 }}>
                        {group.rows.length} session{group.rows.length === 1 ? '' : 's'} · {group.overrideCount} override{group.overrideCount === 1 ? '' : 's'}
                      </span>
                    </td>
                  </tr>
                  {group.rows.map((r) => (
                    <tr key={r.reportId}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/attendance/erp-overrides/${r.reportId}${demoSuffix}`}
                          style={{ color: theme.accent, fontWeight: 600, textDecoration: 'none' }}
                        >
                          {r.timeSlot}
                        </Link>
                      </td>
                      <td>{r.semester || '—'}</td>
                      <td>{r.subject || '—'}</td>
                      <td>{r.faculty || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block', minWidth: 26, padding: '2px 8px', borderRadius: 999,
                            fontSize: 12, fontWeight: 700, color: theme.accent, background: theme.accentDim,
                          }}
                        >
                          {r.overrides.length}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <Link
                          to={`/attendance/erp-overrides/${r.reportId}${demoSuffix}`}
                          style={{ color: theme.accent, fontWeight: 600, fontSize: 12, textDecoration: 'none' }}
                        >
                          View analysis →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, loading, color }) {
  return (
    <div style={{ ...styles.card, padding: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: color || theme.text }}>
        {loading || value == null ? '—' : value}
      </div>
    </div>
  );
}
