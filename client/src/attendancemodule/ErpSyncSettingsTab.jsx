// client/src/attendancemodule/ErpSyncSettingsTab.jsx
// Admin-only home for the ERP nightly auto-sync on/off switch. Moved out of
// ERPSync.jsx (visible to every department) into iams-master-settings so
// only master-settings admins can pause/resume the unattended nightly job;
// manual Fetch/Generate on the ERP Sync page are unaffected either way.

import { useState, useEffect, useCallback } from 'react';
import { theme, styles } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const ERP_SYNC_API = `${apiUrl}/attendancemodule/erp-sync`;

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch(`${ERP_SYNC_API}/settings`)
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.enabled !== false);
        setLastRunAt(d.lastRunAt || null);
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
      setToast({ type: 'success', msg: `Nightly ERP auto-sync ${data.enabled ? 'enabled' : 'disabled'}` });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 4000);
    }
  }, [enabled]);

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
        </div>
      )}
    </div>
  );
}
