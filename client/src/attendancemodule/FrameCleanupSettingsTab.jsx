// client/src/attendancemodule/FrameCleanupSettingsTab.jsx
//
// Issue #1544 follow-up — on/off toggle for the automatic weekly frame
// cleanup job, surfaced in the settings screen (editSessionDates.jsx).
// Mirrors NotificationSettingsTab.jsx's toggle pattern and styling.

import { useState, useEffect } from 'react';
import { theme as T } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const BASE = `${apiUrl}/attendancemodule/settings/frame-cleanup`;

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

export default function FrameCleanupSettingsTab() {
  const [enabled, setEnabled] = useState(true);
  const [lastRunAt, setLastRunAt] = useState(null);
  const [lastRunStats, setLastRunStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const applySettings = (s) => {
    setEnabled(!!s?.enabled);
    setLastRunAt(s?.lastRunAt || null);
    setLastRunStats(s?.lastRunStats || null);
  };

  useEffect(() => {
    fetch(`${BASE}/`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        applySettings(d.settings);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    try {
      const res = await fetch(`${BASE}/`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      applySettings(data.settings);
    } catch (err) {
      setEnabled(!newEnabled); // revert on failure
      showMsg('Error: ' + err.message, 'error');
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${BASE}/run-now`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to run cleanup');
      applySettings(data.settings);
      showMsg(
        `Cleanup complete — ${data.stats.oldFolders} folder(s) processed, ` +
          `${data.stats.rawDeleted} raw deleted, ${data.stats.annotatedDeleted} duplicate annotated deleted.`
      );
    } catch (err) {
      showMsg('Error: ' + err.message, 'error');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, fontSize: 13, color: T.textMuted }}>
        Loading frame cleanup settings…
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .fc-card {
          background: ${T.surface || '#fff'};
          border: 1px solid ${T.border};
          border-radius: 10px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .fc-card-body { padding: 16px 18px; }
      `}</style>

      {message.text && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 14,
            borderRadius: 8,
            fontSize: 13,
            background: message.type === 'error' ? T.dangerDim : T.successDim,
            color: message.type === 'error' ? T.danger : T.success,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Toggle card */}
      <div className="fc-card">
        <div
          className="fc-card-body"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: T.text,
                marginBottom: 2,
              }}
            >
              Automatic frame cleanup {enabled ? 'enabled' : 'disabled'}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 480 }}>
              {enabled
                ? 'Runs nightly at 02:00. Folders older than 7 days have raw frames deleted entirely, and annotated frames pruned down to the single highest-face-count frame per camera.'
                : 'The job is paused — old frames will accumulate on disk until this is re-enabled or a manual run is triggered below.'}
            </div>
          </div>
          <div
            onClick={handleToggle}
            title={enabled ? 'Click to disable' : 'Click to enable'}
            style={{
              width: 46,
              height: 26,
              borderRadius: 26,
              cursor: 'pointer',
              background: enabled ? T.accent : '#d1d5db',
              transition: 'background .2s',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                position: 'absolute',
                height: 20,
                width: 20,
                left: enabled ? 23 : 3,
                top: 3,
                background: '#fff',
                borderRadius: '50%',
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Last run + manual trigger */}
      <div className="fc-card">
        <div className="fc-card-body">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              Last run: {formatDate(lastRunAt)}
            </span>
            <button
              onClick={handleRunNow}
              disabled={running}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: running ? 'not-allowed' : 'pointer',
                background: T.accent,
                color: '#fff',
                opacity: running ? 0.6 : 1,
              }}
              title="Runs immediately regardless of the toggle above — useful for testing."
            >
              {running ? 'Running…' : 'Run now'}
            </button>
          </div>

          {lastRunStats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10,
                fontSize: 12,
                color: T.textMuted,
              }}
            >
              <div>
                Folders processed
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {lastRunStats.oldFolders}
                </div>
              </div>
              <div>
                Raw frames deleted
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {lastRunStats.rawDeleted}
                </div>
              </div>
              <div>
                Annotated kept
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {lastRunStats.annotatedKept}
                </div>
              </div>
              <div>
                Annotated deleted
                <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>
                  {lastRunStats.annotatedDeleted}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
