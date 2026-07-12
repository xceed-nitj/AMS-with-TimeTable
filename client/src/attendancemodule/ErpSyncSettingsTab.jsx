// client/src/attendancemodule/ErpSyncSettingsTab.jsx
// Admin-only home for the ERP nightly auto-sync on/off switch. Moved out of
// ERPSync.jsx (visible to every department) into iams-master-settings so
// only master-settings admins can pause/resume the unattended nightly job;
// manual Fetch/Generate on the ERP Sync page are unaffected either way.
// Also hosts two manual "run now" triggers for the two nightly ERP jobs:
// subject/roster sync (this file's own job) and attendance push (owned by
// erpAttendancePushController.js, surfaced here for a single place to kick
// off both nightly jobs on demand).

import { useState, useEffect, useCallback } from 'react';
import { theme, styles } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const ERP_SYNC_API = `${apiUrl}/attendancemodule/erp-sync`;
const ERP_PUSH_API = `${apiUrl}/attendancemodule/erp-push`;

function formatDate(d) {
  if (!d) return 'never';
  try {
    return new Date(d).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (_) {
    return 'never';
  }
}

export default function ErpSyncSettingsTab() {
  const [enabled, setEnabled] = useState(true);
  const [lastRunAt, setLastRunAt] = useState(null);
  const [lastRunStats, setLastRunStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingSubjects, setSyncingSubjects] = useState(false);
  const [syncingAttendance, setSyncingAttendance] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch(`${ERP_SYNC_API}/settings`)
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.enabled !== false);
        setLastRunAt(d.lastRunAt || null);
        setLastRunStats(d.lastRunStats || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = useCallback(async () => {
    const next = !enabled;
    setSaving(true);
    try {
      const res = await fetch(`${ERP_SYNC_API}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update setting');
      setEnabled(data.enabled);
      showToast('success', `Nightly ERP auto-sync ${data.enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSaving(false);
    }
  }, [enabled]);

  // Button 1 — subject/roster nightly sync (runErpAutoSync), same job the
  // 02:00 cron runs, triggered on demand instead of waiting for the schedule.
  const syncSubjectsNow = async () => {
    setSyncingSubjects(true);
    try {
      const res = await fetch(`${ERP_SYNC_API}/run-now`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subject sync failed');
      setLastRunAt(data.lastRunAt || null);
      setLastRunStats(data.lastRunStats || null);
      const s = data.lastRunStats;
      showToast('success', s
        ? `Subject sync done — ${s.checked} checked, ${s.regenerated} regenerated, ${s.unchanged} unchanged, ${s.failed} failed`
        : 'Subject sync complete');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSyncingSubjects(false);
    }
  };

  // Button 2 — attendance-push nightly sync (pushes every unsynced, unlocked
  // period's finalReport to ERP right now instead of waiting for the retry sweep).
  const syncAttendanceNow = async () => {
    setSyncingAttendance(true);
    try {
      const res = await fetch(`${ERP_PUSH_API}/sync-all`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Attendance sync failed');
      showToast('success', `Attendance sync done — ${data.sent}/${data.total} sent, ${data.failed} failed, ${data.skipped} skipped`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSyncingAttendance(false);
    }
  };

  const buttonStyle = (busy) => ({
    padding: '8px 16px', fontSize: 12.5, fontWeight: 600, borderRadius: 8,
    border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.text,
    cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
  });

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

      <div style={{ ...styles.subheading, marginBottom: 18 }}>
        Controls the nightly job (erpAutoSyncScheduler.js, runs 02:00) that re-checks every
        subject&rsquo;s ERP roster and regenerates embeddings only where the roster changed. Manual
        Fetch/Generate on the ERP Sync page keep working either way — this only pauses the
        unattended run.
      </div>

      {loading ? (
        <div style={{ fontSize: 13, color: theme.textMuted }}>Loading…</div>
      ) : (
        <div
          onClick={saving ? undefined : toggle}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 12, cursor: saving ? 'default' : 'pointer',
            padding: '12px 20px', borderRadius: 10, userSelect: 'none',
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
            {enabled ? '✅ Nightly Auto-Sync ON' : '⛔ Nightly Auto-Sync OFF'}
          </span>
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: 14, fontSize: 12, color: theme.textMuted }}>
          Last synced: {formatDate(lastRunAt)}
          {lastRunStats && (
            <span> — {lastRunStats.checked} checked, {lastRunStats.regenerated} regenerated,{' '}
              {lastRunStats.unchanged} unchanged, {lastRunStats.failed} failed</span>
          )}
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={syncSubjectsNow} disabled={syncingSubjects} style={buttonStyle(syncingSubjects)}>
          {syncingSubjects ? 'Syncing subjects…' : 'Sync subjects now'}
        </button>
        <button onClick={syncAttendanceNow} disabled={syncingAttendance} style={buttonStyle(syncingAttendance)}>
          {syncingAttendance ? 'Syncing attendance…' : 'Sync attendance to ERP now'}
        </button>
      </div>
    </div>
  );
}
