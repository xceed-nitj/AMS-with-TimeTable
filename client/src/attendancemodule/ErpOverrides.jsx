// client/src/attendancemodule/ErpOverrides.jsx
// Audit page: every attendance report that contains at least one student
// whose final status was manually/ERP-overridden after the model's original
// decision (AttendanceReport.finalReport[].isOverridden — see
// attendanceReportController.js's updateStudentStatus). Lists date/period/
// sem/subject, present/absent counts, exactly which roll numbers changed and
// what they changed from → to, and a link to the frames that were captured
// for that check (FrameVerification page, deep-linked via room/date/period).

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const API = `${apiUrl}/attendancemodule/reports/erp-overrides`;

const STATUS_LABEL = { P: 'Present', A: 'Absent', R: 'Review' };

function StatusChip({ code }) {
  const color =
    code === 'P' ? theme.success : code === 'R' ? theme.warning : theme.danger;
  const bg =
    code === 'P' ? theme.successDim : code === 'R' ? theme.warningDim : theme.dangerDim;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color,
        background: bg,
      }}
    >
      {code ? (STATUS_LABEL[code] || code) : '—'}
    </span>
  );
}

export default function ErpOverrides() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${API}?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load overrides');
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <style>{cssReset}</style>
      <div style={{ minHeight: '100vh', background: theme.bg, color: theme.text, fontFamily: theme.fontBody, padding: 'clamp(16px,3vw,32px)' }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 'clamp(17px,2.5vw,22px)', letterSpacing: '-0.03em', marginBottom: 3 }}>
            ERP Overrides
          </div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>
            Attendance sessions where a student&rsquo;s final status was manually changed from the model&rsquo;s original decision.
          </div>
        </div>

        <div style={{ ...styles.card, padding: 16, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
          <table className="ams-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Period</th>
                <th>Sem</th>
                <th>Subject</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th>Changed Roll No(s)</th>
                <th>Frames</th>
              </tr>
            </thead>
            <tbody>
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: theme.textMuted, padding: 32 }}>
                    No overridden attendance records found.
                  </td>
                </tr>
              )}
              {items.map((r) => (
                <tr key={r.reportId}>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{r.timeSlot}</td>
                  <td>{r.semester || '—'}</td>
                  <td>{r.subject || '—'}</td>
                  <td style={{ textAlign: 'center', color: theme.success, fontWeight: 700 }}>{r.summary.present}</td>
                  <td style={{ textAlign: 'center', color: theme.danger, fontWeight: 700 }}>{r.summary.absent}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {r.overrides.map((o) => (
                        <div key={o.rollNo} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, fontFamily: theme.fontMono }}>{o.rollNo}</span>
                          <StatusChip code={o.from} />
                          <span style={{ color: theme.textMuted }}>→</span>
                          <StatusChip code={o.to} />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Link
                      to={`/attendance/frame-verification?room=${encodeURIComponent(r.room)}&date=${encodeURIComponent(r.date)}&period=${encodeURIComponent(r.timeSlot)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: theme.accent, fontWeight: 600, fontSize: 12, textDecoration: 'none' }}
                    >
                      View frames →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
