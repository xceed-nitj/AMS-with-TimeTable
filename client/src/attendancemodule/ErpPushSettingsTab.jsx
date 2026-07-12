// client/src/attendancemodule/ErpPushSettingsTab.jsx
// On/off toggle + editable retry policy + status list for the outbound push
// of finalReport (roll no + finalStatus) to ERP's attendance-posting
// endpoint after every completed run — see erpAttendancePushController.js.
// The status table below follows ErpOverrides.jsx's layout.

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

const LOCK_META = {
  none:              { label: 'Open',              color: theme.textMuted, bg: theme.surfaceAlt },
  posted_acked:      { label: 'Posted (acked)',     color: theme.success,   bg: theme.successDim },
  faculty_finalized: { label: 'Faculty finalised',  color: theme.accent,    bg: theme.accentDim },
};

// Preview-only sample data — visit this page with ?demo=1 to see the layout
// without a live backend. Sessions mirror the ERP Overrides page's demo data
// (DEMO_ITEMS in ErpOverrides.jsx), plus one ECE row so the department
// filter has something to switch between. Not used in normal operation.
const DEMO_ITEMS = [
  {
    reportId: 'demo-1', date: '2026-07-08', timeSlot: '09:00-10:00',
    subject: 'Digital Signal Processing', semester: '5', faculty: 'Dr. Meera Nair', department: 'CSE',
    periodId: 'BTECH-CSE-2023-CSE-301-2026-07-08-09-00-10-00', erpLockState: 'posted_acked',
    erpPush: {
      status: 'sent', attempts: 1, lastAttemptAt: '2026-07-08T10:05:00+05:30',
      lastError: null, lastResponseCode: 200, responseCode: 'ATTENDANCE_ACCEPTED',
    },
  },
  {
    reportId: 'demo-2', date: '2026-07-08', timeSlot: '10:00-11:00',
    subject: 'Data Structures', semester: '3', faculty: 'Dr. Arvind Rao', department: 'CSE',
    periodId: 'BTECH-CSE-2024-CSE-105-2026-07-08-10-00-11-00', erpLockState: 'none',
    erpPush: {
      status: 'failed', attempts: 2, lastAttemptAt: '2026-07-08T11:22:00+05:30',
      lastError: 'HTTP 500: {"success":false}', lastResponseCode: 500, responseCode: null,
    },
  },
  {
    reportId: 'demo-3', date: '2026-07-07', timeSlot: '11:00-12:00',
    subject: 'Digital Signal Processing', semester: '5', faculty: 'Dr. Meera Nair', department: 'CSE',
    periodId: 'BTECH-CSE-2023-CSE-301-2026-07-07-11-00-12-00', erpLockState: 'faculty_finalized',
    erpPush: {
      status: 'failed', attempts: 1, lastAttemptAt: '2026-07-07T12:10:00+05:30',
      lastError: 'Faculty already finalised this period in ERP', lastResponseCode: 409, responseCode: 'PERIOD_ALREADY_FINALIZED',
    },
  },
  {
    reportId: 'demo-4', date: '2026-07-07', timeSlot: '09:00-10:00',
    subject: 'Analog Circuits', semester: '5', faculty: 'Dr. S. Iyer', department: 'ECE',
    periodId: 'BTECH-ECE-2023-ECE-201-2026-07-07-09-00-10-00', erpLockState: 'none',
    erpPush: {
      status: 'pending', attempts: 0, lastAttemptAt: null,
      lastError: null, lastResponseCode: null, responseCode: null,
    },
  },
];
const DEMO_DEPARTMENTS = ['CSE', 'ECE'];

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status || '—', color: theme.textMuted, bg: theme.accentDim };
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

// Lock state per spec §7 — whichever side reaches finality first closes the
// other's write path; once this leaves "Open", no further push is attempted.
function LockBadge({ state }) {
  const m = LOCK_META[state] || LOCK_META.none;
  return (
    <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, color: m.color, background: m.bg }}>
      {m.label}
    </span>
  );
}

// HTTP status code ERP answered the last push with — green 2xx, red anything
// else, '—' when the request never reached ERP (timeout / not yet attempted).
function ResponseCodeBadge({ code }) {
  if (code == null) return <span style={{ color: theme.textMuted }}>—</span>;
  const ok = code >= 200 && code < 300;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      fontFamily: theme.fontMono,
      color: ok ? theme.success : theme.danger,
      background: ok ? theme.successDim : theme.dangerDim,
    }}>
      {code}
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

// Compact on/off pill, reused for both the main push toggle and the nightly
// retry toggle so the two switches read as one visual language.
function ToggleSwitch({ on, label, onClick, disabled }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'default' : 'pointer',
        padding: '8px 14px', borderRadius: 9, userSelect: 'none',
        background: on ? theme.successDim : theme.dangerDim,
        border: `1px solid ${on ? theme.success : theme.danger}`,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ width: 28, height: 15, borderRadius: 8, position: 'relative', flexShrink: 0, background: on ? theme.success : theme.border, transition: 'background .2s' }}>
        <div style={{ position: 'absolute', top: 2, left: on ? 15 : 2, width: 11, height: 11, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: on ? theme.success : theme.danger, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

const fieldLabelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 };
const numberInputStyle = { width: 70, padding: '6px 8px', borderRadius: 7, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody, fontSize: 13 };

export default function ErpPushSettingsTab() {
  const [enabled, setEnabled] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [retryIntervalMinutes, setRetryIntervalMinutes] = useState(3);
  const [nightlyRetryEnabled, setNightlyRetryEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [toast, setToast] = useState(null);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departments, setDepartments] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [syncingAll, setSyncingAll] = useState(false);

  const isDemo = new URLSearchParams(window.location.search).get('demo') === '1';

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadSettings = useCallback(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    return fetch(`${PUSH_API}/settings`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.enabled !== false);
        setConfigured(d.configured !== false);
        if (d.maxAttempts != null) setMaxAttempts(d.maxAttempts);
        if (d.retryIntervalMinutes != null) setRetryIntervalMinutes(d.retryIntervalMinutes);
        setNightlyRetryEnabled(d.nightlyRetryEnabled !== false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isDemo]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const loadStatus = useCallback(async () => {
    if (isDemo) {
      const filtered = DEMO_ITEMS.filter((r) =>
        (!statusFilter || r.erpPush.status === statusFilter) &&
        (!deptFilter || r.department === deptFilter) &&
        (!from || r.date >= from) &&
        (!to || r.date <= to));
      setItems(filtered);
      setTotal(filtered.length);
      setDepartments(DEMO_DEPARTMENTS);
      setListLoading(false);
      return;
    }
    setListLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusFilter) params.set('status', statusFilter);
      if (deptFilter) params.set('department', deptFilter);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await fetch(`${PUSH_API}/status?${params.toString()}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load push status');
      setItems(data.items || []);
      setTotal(data.total || 0);
      setConfigured(data.configured !== false);
      if (data.departments) setDepartments(data.departments);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setListLoading(false);
    }
  }, [statusFilter, deptFilter, from, to, isDemo]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const patchSettings = async (body, successMsg) => {
    if (isDemo) {
      if ('enabled' in body) setEnabled(body.enabled);
      if ('nightlyRetryEnabled' in body) setNightlyRetryEnabled(body.nightlyRetryEnabled);
      if ('maxAttempts' in body) setMaxAttempts(body.maxAttempts);
      if ('retryIntervalMinutes' in body) setRetryIntervalMinutes(body.retryIntervalMinutes);
      showToast('success', `${successMsg} (demo)`);
      return true;
    }
    try {
      const res = await fetch(`${PUSH_API}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update setting');
      setEnabled(data.enabled);
      setNightlyRetryEnabled(data.nightlyRetryEnabled !== false);
      if (data.maxAttempts != null) setMaxAttempts(data.maxAttempts);
      if (data.retryIntervalMinutes != null) setRetryIntervalMinutes(data.retryIntervalMinutes);
      showToast('success', successMsg);
      return true;
    } catch (err) {
      showToast('error', err.message);
      return false;
    }
  };

  const toggleEnabled = async () => {
    setSaving(true);
    await patchSettings({ enabled: !enabled }, `ERP attendance push ${!enabled ? 'enabled' : 'disabled'}`);
    setSaving(false);
  };

  const toggleNightly = async () => {
    setSaving(true);
    await patchSettings({ nightlyRetryEnabled: !nightlyRetryEnabled }, `Nightly retry ${!nightlyRetryEnabled ? 'enabled' : 'disabled'}`);
    setSaving(false);
  };

  const savePolicy = async () => {
    const attempts = Number(maxAttempts);
    const interval = Number(retryIntervalMinutes);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20) {
      return showToast('error', 'Max attempts must be a whole number between 1 and 20');
    }
    if (!Number.isInteger(interval) || interval < 1 || interval > 1440) {
      return showToast('error', 'Retry interval must be a whole number between 1 and 1440 minutes');
    }
    setSavingPolicy(true);
    await patchSettings({ maxAttempts: attempts, retryIntervalMinutes: interval }, 'Retry policy saved');
    setSavingPolicy(false);
  };

  // Manual per-period sync — pushes this one report to ERP immediately,
  // bypassing the attempt cap.
  const syncOne = async (reportId) => {
    if (isDemo) {
      setItems((prev) => prev.map((r) => r.reportId === reportId
        ? {
            ...r,
            erpLockState: 'posted_acked',
            erpPush: {
              ...r.erpPush, status: 'sent', attempts: (r.erpPush.attempts || 0) + 1,
              lastAttemptAt: new Date().toISOString(), lastError: null, lastResponseCode: 200,
              responseCode: 'ATTENDANCE_ACCEPTED',
            },
          }
        : r));
      showToast('success', 'Push succeeded (demo)');
      return;
    }
    setRetryingId(reportId);
    try {
      const res = await fetch(`${PUSH_API}/${reportId}/retry`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      if (data.result?.skipped) {
        const why = {
          not_configured: 'ERP push is not configured on the server',
          disabled: 'ERP push is turned off — enable it above first',
          future_period: 'This period is future-dated — ERP will not accept it yet',
          posted_acked: 'Already acknowledged by ERP — no further push is sent for this period',
          faculty_finalized: 'Faculty already finalised this period in ERP — no further push is sent',
          already_posted: 'ERP already had this period — treated as sent',
        }[data.result.reason] || 'Push skipped';
        showToast(data.result.reason === 'already_posted' ? 'success' : 'error', why);
      } else {
        showToast(data.result?.ok ? 'success' : 'error', data.result?.ok ? 'Push succeeded' : (data.result?.error || 'Push failed'));
      }
      loadStatus();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setRetryingId(null);
    }
  };

  // "Sync all" — pushes every currently unsynced, unlocked period right now.
  const syncAll = async () => {
    if (isDemo) {
      setItems((prev) => prev.map((r) => (r.erpLockState !== 'none' ? r : {
        ...r,
        erpLockState: 'posted_acked',
        erpPush: { ...r.erpPush, status: 'sent', attempts: (r.erpPush.attempts || 0) + 1, lastAttemptAt: new Date().toISOString(), lastError: null, lastResponseCode: 200, responseCode: 'ATTENDANCE_ACCEPTED' },
      })));
      showToast('success', 'Synced all pending periods (demo)');
      return;
    }
    setSyncingAll(true);
    try {
      const res = await fetch(`${PUSH_API}/sync-all`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync all failed');
      showToast('success', `Synced ${data.sent}/${data.total} — ${data.failed} failed, ${data.skipped} skipped`);
      loadStatus();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSyncingAll(false);
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

      {/* ── Controls: push toggle + retry policy, side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div style={{ ...styles.card, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 10 }}>Push status</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
            Pushes each report&rsquo;s final roll-no → status list to ERP, signed so ERP can verify it
            wasn&rsquo;t tampered with. A faculty override in ERP is synced back into separate fields —
            our attendance data is never overwritten.
          </div>
          {loading ? (
            <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
          ) : (
            <ToggleSwitch on={enabled} disabled={saving} onClick={toggleEnabled} label={enabled ? '✅ ERP Push ON' : '⛔ ERP Push OFF'} />
          )}
        </div>

        <div style={{ ...styles.card, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginBottom: 10 }}>Retry policy</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <label style={fieldLabelStyle}>Max attempts</label>
              <input
                type="number" min={1} max={20} value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                style={numberInputStyle}
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>Interval (min)</label>
              <input
                type="number" min={1} max={1440} value={retryIntervalMinutes}
                onChange={(e) => setRetryIntervalMinutes(e.target.value)}
                style={numberInputStyle}
              />
            </div>
            <button
              onClick={savePolicy}
              disabled={savingPolicy}
              style={{
                padding: '7px 14px', fontSize: 12, fontWeight: 700, borderRadius: 7, border: 'none',
                cursor: savingPolicy ? 'not-allowed' : 'pointer', background: theme.accent, color: '#fff',
                opacity: savingPolicy ? 0.6 : 1,
              }}
            >
              {savingPolicy ? 'Saving…' : 'Save'}
            </button>
          </div>
          <ToggleSwitch on={nightlyRetryEnabled} disabled={saving} onClick={toggleNightly} label={nightlyRetryEnabled ? '🌙 Nightly retry ON' : '🌙 Nightly retry OFF'} />
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 10, lineHeight: 1.5 }}>
            Auto-retries a failed period up to the attempt cap, spaced by the interval above. Nightly
            retry (~8 PM) is a separate evening pass that bypasses the cap for anything still failed.
          </div>
        </div>
      </div>

      {/* ── Status table toolbar ── */}
      <div style={{ ...styles.card, padding: '12px 16px', marginBottom: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>
            ERP sync status {listLoading ? '' : `(${total})`}
          </div>
          <button
            onClick={syncAll}
            disabled={syncingAll}
            style={{
              padding: '6px 14px', fontSize: 12, fontWeight: 700, borderRadius: 6, border: 'none',
              cursor: syncingAll ? 'not-allowed' : 'pointer',
              background: theme.accent, color: '#fff',
              opacity: syncingAll ? 0.6 : 1,
            }}
          >
            {syncingAll ? 'Syncing all…' : 'Sync all'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody, fontSize: 12.5 }}
          />
          <span style={{ color: theme.textMuted, fontSize: 12 }}>to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody, fontSize: 12.5 }}
          />
          {departments && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${theme.border}`, fontFamily: theme.fontBody, fontSize: 12.5 }}
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}
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
      </div>

      <div style={{ ...styles.card, padding: 0, overflowX: 'auto', borderTopLeftRadius: 0, borderTopRightRadius: 0, marginBottom: 20 }}>
        <table className="ams-table" style={{ minWidth: 1080 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Period</th>
              <th>Subject</th>
              <th>Sem</th>
              <th>Faculty</th>
              <th>Period ID</th>
              <th>Status</th>
              <th>Lock</th>
              <th style={{ textAlign: 'center' }}>Response</th>
              <th style={{ textAlign: 'center' }}>Attempts</th>
              <th>Last attempt</th>
              <th>Last error</th>
              <th>Sync</th>
            </tr>
          </thead>
          <tbody>
            {!listLoading && items.length === 0 && (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', color: theme.textMuted, padding: 32 }}>
                  No push records found.
                </td>
              </tr>
            )}
            {items.map((r) => (
              <tr key={r.reportId}>
                <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{r.timeSlot}</td>
                <td>{r.subject || '—'}</td>
                <td>{r.semester || '—'}</td>
                <td>{r.faculty || '—'}</td>
                <td style={{ fontFamily: theme.fontMono, fontSize: 11, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.periodId || ''}>
                  {r.periodId || '—'}
                </td>
                <td><StatusBadge status={r.erpPush?.status} /></td>
                <td><LockBadge state={r.erpLockState} /></td>
                <td style={{ textAlign: 'center' }}><ResponseCodeBadge code={r.erpPush?.lastResponseCode} /></td>
                <td style={{ textAlign: 'center' }}>{r.erpPush?.attempts ?? 0}</td>
                <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{formatDate(r.erpPush?.lastAttemptAt)}</td>
                <td style={{ fontSize: 12, color: theme.danger, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.erpPush?.lastError || ''}>
                  {r.erpPush?.lastError || '—'}
                </td>
                <td>
                  <button
                    onClick={() => syncOne(r.reportId)}
                    disabled={retryingId === r.reportId || r.erpLockState !== 'none'}
                    title={r.erpLockState !== 'none' ? 'Locked — no further push is sent for this period' : ''}
                    style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none',
                      cursor: (retryingId === r.reportId || r.erpLockState !== 'none') ? 'not-allowed' : 'pointer',
                      background: theme.accent, color: '#fff',
                      opacity: (retryingId === r.reportId || r.erpLockState !== 'none') ? 0.5 : 1,
                    }}
                  >
                    {retryingId === r.reportId ? 'Syncing…' : 'Sync now'}
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
