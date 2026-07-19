// client/src/attendancemodule/OtherControlsSettingsTab.jsx
//
// "Other Controls" settings tab — miscellaneous admin toggles.
// Currently two on/off switches (both default OFF) that restrict
// Ground Truth acquisition and Attendance runs to 08:30–17:30 IST.
// Mirrors FrameCleanupSettingsTab.jsx's toggle pattern and styling.

import { useState, useEffect } from 'react';
import { theme as T } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const BASE = `${apiUrl}/attendancemodule/settings/other-controls`;

export default function OtherControlsSettingsTab() {
  const [gtEnabled, setGtEnabled] = useState(false);
  const [runEnabled, setRunEnabled] = useState(false);
  const [windowStart, setWindowStart] = useState('08:30');
  const [windowEnd, setWindowEnd] = useState('17:30');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const applySettings = (s) => {
    setGtEnabled(!!s?.groundTruthTimeWindowEnabled);
    setRunEnabled(!!s?.attendanceRunTimeWindowEnabled);
    setWindowStart(s?.windowStart || '08:30');
    setWindowEnd(s?.windowEnd || '17:30');
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

  // key = field name on the settings doc; setLocal = optimistic state setter.
  const saveToggle = async (key, newValue, setLocal, prevValue) => {
    setLocal(newValue);
    try {
      const res = await fetch(`${BASE}/`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      applySettings(data.settings);
    } catch (err) {
      setLocal(prevValue); // revert on failure
      showMsg('Error: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 20, fontSize: 13, color: T.textMuted }}>
        Loading other controls…
      </div>
    );
  }

  const windowText = `${windowStart}–${windowEnd} IST`;

  const ToggleCard = ({ enabled, title, description, onToggle }) => (
    <div className="oc-card">
      <div
        className="oc-card-body"
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
            {title}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, maxWidth: 520 }}>
            {description}
          </div>
        </div>
        <div
          onClick={onToggle}
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
  );

  return (
    <div>
      <style>{`
        .oc-card {
          background: ${T.surface || '#fff'};
          border: 1px solid ${T.border};
          border-radius: 10px;
          margin-bottom: 16px;
          overflow: hidden;
        }
        .oc-card-body { padding: 16px 18px; }
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

      <ToggleCard
        enabled={gtEnabled}
        title={`Restrict Ground Truth acquisition to ${windowText}`}
        description={
          gtEnabled
            ? `Ground Truth (RTSP) acquisition can only be started between ${windowText}. Attempts outside this window are blocked.`
            : 'Ground Truth acquisition can be started at any time (no restriction). Turn on to enforce the window.'
        }
        onToggle={() =>
          saveToggle('groundTruthTimeWindowEnabled', !gtEnabled, setGtEnabled, gtEnabled)
        }
      />

      <ToggleCard
        enabled={runEnabled}
        title={`Restrict Attendance runs to ${windowText}`}
        description={
          runEnabled
            ? `Attendance runs (automatic scheduler and manual triggers) only fire between ${windowText}. Attempts outside this window are blocked.`
            : 'Attendance runs can fire at any time (no restriction). Turn on to enforce the window.'
        }
        onToggle={() =>
          saveToggle('attendanceRunTimeWindowEnabled', !runEnabled, setRunEnabled, runEnabled)
        }
      />
    </div>
  );
}
