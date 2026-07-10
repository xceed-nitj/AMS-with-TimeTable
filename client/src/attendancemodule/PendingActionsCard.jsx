// client/src/attendancemodule/PendingActionsCard.jsx
// "Pending actions" summary card, shared by the department dashboard and the
// admin dashboard. Shows two outstanding-work counts sourced from
// GET /attendancemodule/dept-admin/stats/today:
//   • ground-truth acquisitions awaiting approval  (stats.groundTruthPending)
//   • attendance overrides awaiting coordinator verification (stats.attendanceVerificationPending)
// For full-access admins it also renders a department selector (?department=)
// so they can drill into one department's pending work.

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { theme, styles } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

function PendingTile({ label, value, detail, to, color }) {
  return (
    <Link
      to={to}
      style={{
        ...styles.card, padding: 16, textDecoration: 'none', color: theme.text,
        display: 'flex', flexDirection: 'column', gap: 6, borderLeft: `3px solid ${color}`,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: value ? color : theme.textMuted }}>
        {value == null ? '—' : value}
      </div>
      <div style={{ fontSize: 11, color: theme.accent, fontWeight: 600 }}>{detail} →</div>
    </Link>
  );
}

export default function PendingActionsCard() {
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [fullAccess, setFullAccess] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const params = department ? `?department=${encodeURIComponent(department)}` : '';
      const res = await fetch(`${apiUrl}/attendancemodule/dept-admin/stats/today${params}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load pending actions.');
      setStats(data);
      setFullAccess(Boolean(data.fullAccess));
    } catch (err) {
      setError(err.message);
    }
  }, [department]);

  useEffect(() => { load(); }, [load]);

  // Department options for the admin selector.
  useEffect(() => {
    if (!fullAccess) return;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/attendancemodule/ground-truth/departments`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setDepartments((data.departments || []).map((d) => d.dept).filter(Boolean));
      } catch (_) { /* selector stays empty */ }
    })();
  }, [fullAccess]);

  return (
    <section style={{ ...styles.card, padding: 18, marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>Pending actions</div>
        {fullAccess && (
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody }}
          >
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        )}
      </div>

      {error ? (
        <div style={{ color: theme.danger, fontSize: 13 }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <PendingTile
            label="Ground truth pending"
            value={stats?.groundTruthPending}
            detail="Review acquisitions"
            to="/attendance/groundtruth/assign"
            color={theme.warning}
          />
          <PendingTile
            label="Attendance verifications pending"
            value={stats?.attendanceVerificationPending}
            detail="Verify ERP overrides"
            to="/attendance/erp-overrides"
            color={theme.accent}
          />
        </div>
      )}
    </section>
  );
}
