// client/src/attendancemodule/DeptOverridesChart.jsx
// Admin-dashboard chart: per-department override verification progress —
// how many overridden students are verified vs still pending coordinator
// review. Sourced from GET /attendancemodule/dept-admin/stats/overrides-by-dept.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { theme, styles } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

export default function DeptOverridesChart() {
  const navigate = useNavigate();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/attendancemodule/dept-admin/stats/overrides-by-dept`, { credentials: 'include' });
        const data = await res.json();
        if (!cancelled) setRows(res.ok ? (data.byDept || []) : []);
      } catch (_) {
        if (!cancelled) setRows([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ ...styles.card, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Department-wise Override Verifications</div>
        <button
          onClick={() => navigate('/attendance/erp-overrides')}
          style={{
            fontSize: 10, padding: '3px 9px', borderRadius: 6,
            background: theme.accentDim, color: theme.accent,
            border: `1px solid ${theme.accent}30`, cursor: 'pointer',
            fontFamily: theme.fontBody, fontWeight: 700,
          }}
        >
          Overrides
        </button>
      </div>

      {!rows ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: theme.textMuted }}>
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: theme.textMuted }}>
          No overrides recorded yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} margin={{ top: 4, right: 4, left: -22, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} />
            <XAxis
              dataKey="dept" tick={{ fontSize: 9, fill: theme.textMuted }}
              angle={-38} textAnchor="end" interval={0}
              axisLine={false} tickLine={false}
            />
            <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: theme.textMuted }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.surface }}
              cursor={{ fill: 'rgba(99,102,241,0.05)' }}
            />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, color: theme.textMuted, paddingTop: 8 }} />
            <Bar dataKey="verified" name="Verified" stackId="a" fill={theme.success} radius={[0, 0, 0, 0]} />
            <Bar dataKey="pending" name="Pending" stackId="a" fill={theme.warning} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
