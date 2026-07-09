// client/src/attendancemodule/ErpPushSettingsTab.jsx
// On/off toggle + status list for the outbound push of finalReport (roll no
// + finalStatus) to ERP's attendance-posting endpoint after every completed
// run — see erpAttendancePushController.js. Mirrors ErpSyncSettingsTab.jsx's
// toggle pattern; the status table below follows ErpOverrides.jsx's layout.

import { useState, useEffect, useCallback } from 'react';
import { theme, styles } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const PUSH_API = `${apiUrl}/attendancemodule/erp-push`;

const STATUS_META = {
  sent:    { label: 'Sent',    color: theme.success, bg: theme.successDim },
  pending: { label: 'Pending', color: theme.warning, bg: theme.warningDim },
  failed:  { label: 'Failed',  color: theme.danger,  bg: theme.dangerDim },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status || '—', color: theme.textMuted, bg: theme.accentDim };
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch (_) {
    return '—';
  }
}

export default function ErpPushSettingsTab() {
  const [enabled, setEnabled] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch(`${PUSH_API}/settings`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.enabled !== false);
        setConfigured(d.configured !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadStatus = useCallback(async () => {
    setListLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${PUSH_API}/status?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load push status');
      setItems(data.items || []);
      setTotal(data.total || 0);
      setConfigured(data.configured !== false);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setListLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const toggle = useCallback(async () => {
    const next = !enabled;
    setSaving(true);
    try {
      const res = await fetch(`${PUSH_API}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update setting');
      setEnabled(data.enabled);
      showToast('success', `ERP attendance push ${data.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }, [enabled]);

  const retry = async (reportId) => {
    setRetryingId(reportId);
    try {
      const res = await fetch(`${PUSH_API}/${reportId}/retry`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry failed');
      showToast(data.result?.ok ? 'success' : 'error', data.result?.ok ? 'Push succeeded' : (data.result?.error || 'Push failed'));
      loadStatus();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      {toast && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: toast.type === 'error' ? theme.dangerDim : theme.successDim,
          color: toast.type === 'error' ? theme.danger : theme.success,
        }}>
          {toast.msg}
        </div>
      )}

      {!configured && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13, background: theme.warningDim, color: theme.warning }}>
          ERP_ATTENDANCE_PUSH_URL / ERP_PUSH_SECRET are not set on the server — pushes are skipped until both are configured.
        </div>
      )}

      <div style={{ ...styles.subheading, marginBottom: 18 }}>
        Pushes each report&rsquo;s final roll-no → status list to ERP&rsquo;s attendance-posting endpoint
        right after every completed run, signed with a shared secret so ERP can verify the payload
        wasn&rsquo;t tampered with in transit. A later manual override re-sends automatically as a
        correction. Failed pushes retry on a backoff schedule (up to 8 attempts) — use Retry below to
        force one immediately.
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
      ) : (
        <div
          onClick={saving ? undefined : toggle}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, cursor: saving ? 'default' : 'pointer',
            padding: '12px 20px', borderRadius: 10, userSelect: 'none', marginBottom: 24,
            background: enabled ? theme.successDim : theme.dangerDim,
            border: `1px solid ${enabled ? theme.success : theme.danger}`,
            opacity: saving ? 0.6 : 1,
          }}
        >
          <div style={{
            width: 34, height: 18, borderRadius: 9, position: 'relative', flexShrink: 0,
            background: enabled ? theme.success : theme.border,
            transition: 'background .2s',
          }}>
            <div style={{
              position: 'absolute', top: 2, left: enabled ? 18 : 2,
              width: 14, height: 14, borderRadius: '50%',
              background: '#fff', transition: 'left .2s',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: enabled ? theme.success : theme.danger }}>
            {enabled ? '✅ ERP Push ON' : '⛔ ERP Push OFF'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>
          Push status {listLoading ? '' : `(${total})`}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody, fontSize: 12.5 }}
        >
          <option value="">All statuses</option>
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div style={{ ...styles.card, padding: 0, overflowX: 'auto' }}>
        <table className="ams-table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Batch</th>
              <th>Status</th>
              <th style={{ textAlign: 'center' }}>Attempts</th>
              <th>Last attempt</th>
              <th>Last error</th>
              <th>Retry</th>
            </tr>
          </thead>
          <tbody>
            {!listLoading && items.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: theme.textMuted, padding: 32 }}>
                  No push records found.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.reportId}>
                <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{r.timeSlot}</td>
                <td>{r.subject || '—'}</td>
                <td style={{ fontFamily: theme.fontMono, fontSize: 12 }}>{r.batch}</td>
                <td><StatusBadge status={r.erpPush?.status} /></td>
                <td style={{ textAlign: 'center' }}>{r.erpPush?.attempts ?? 0}</td>
                <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(r.erpPush?.lastAttemptAt)}</td>
                <td style={{ fontSize: 12, color: theme.danger, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.erpPush?.lastError || ''}>
                  {r.erpPush?.lastError || '—'}
                </td>
                <td>
                  <button
                    onClick={() => retry(r.reportId)}
                    disabled={retryingId === r.reportId}
                    style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none',
                      cursor: retryingId === r.reportId ? 'not-allowed' : 'pointer',
                      background: theme.accent, color: '#fff',
                      opacity: retryingId === r.reportId ? 0.6 : 1,
                    }}
                  >
                    {retryingId === r.reportId ? 'Retrying…' : 'Retry'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
