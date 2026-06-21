import { useState, useEffect } from 'react';
import { theme as T } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const BASE = `${apiUrl}/attendancemodule/settings/notifications`;
const GT_API = `${apiUrl}/attendancemodule/ground-truth`;

const CATEGORIES = [
  { value: 'admin', label: 'Admin' },
  { value: 'coordinator', label: 'Dept Coordinator' },
  { value: 'head', label: 'Dept Head' },
];

const ALERT_TYPES = [
  { key: 'serverDown', label: 'Server / Camera Down' },
  { key: 'lowConfidence', label: 'Low Confidence Detection' },
  { key: 'classBunk', label: 'Class Bunked' },
  { key: 'duplicateAttendance', label: 'Duplicate Attendance' },
];

const EMPTY_ALERT_TYPES = {
  serverDown: false,
  lowConfidence: false,
  classBunk: false,
  duplicateAttendance: false,
};

export default function NotificationSettingsTab() {
  const [enabled, setEnabled] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('admin');
  const [dept, setDept] = useState('');
  const [newAlertTypes, setNewAlertTypes] = useState({ ...EMPTY_ALERT_TYPES });
  const [departments, setDepts] = useState([]);
  const [depsLoading, setDepsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setEnabled(!!d.settings?.enabled);
        setRecipients(d.settings?.recipients || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (category !== 'coordinator' && category !== 'head') return;
    if (departments.length > 0) return;
    setDepsLoading(true);
    fetch(`${GT_API}/departments`)
      .then((r) => r.json())
      .then((d) => {
        const depts = (d.departments || [])
          .map((item) => (typeof item === 'string' ? item : item.dept))
          .filter(Boolean);
        setDepts(depts);
      })
      .catch(() => setMessage('Could not load departments'))
      .finally(() => setDepsLoading(false));
  }, [category]);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);
    await fetch(`${BASE}/`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: newEnabled }),
    });
  };

  const handleAdd = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if ((category === 'coordinator' || category === 'head') && !dept.trim()) {
      setMessage('Dept is required for Coordinator/Head.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`${BASE}/recipients`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          category,
          dept: dept.trim(),
          alertTypes: newAlertTypes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setRecipients(data.settings.recipients);
      setEmail('');
      setDept('');
      setCategory('admin');
      setNewAlertTypes({ ...EMPTY_ALERT_TYPES });
      setMessage('Recipient added.');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRemove = async (id) => {
    try {
      const res = await fetch(`${BASE}/recipients/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove');
      setRecipients(data.settings.recipients);
    } catch (err) {
      setMessage('Error: ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleToggleRecipientAlert = async (recipient, alertKey) => {
    const updatedAlertTypes = {
      ...EMPTY_ALERT_TYPES,
      ...recipient.alertTypes,
      [alertKey]: !recipient.alertTypes?.[alertKey],
    };
    setUpdatingId(recipient._id);
    try {
      const res = await fetch(`${BASE}/recipients/${recipient._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertTypes: updatedAlertTypes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setRecipients(data.settings.recipients);
    } catch (err) {
      setMessage('Error: ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    items: recipients.filter((r) => r.category === c.value),
  }));

  const needsDept = category === 'coordinator' || category === 'head';

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            margin: '0 auto 12px',
            border: `3px solid ${T.border}`,
            borderTopColor: T.accent,
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ color: T.textMuted, fontSize: 13 }}>
          Loading notification settings…
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ns-card {
          background: ${T.surface};
          border: 1px solid ${T.border};
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 18px;
        }
        .ns-section-label {
          font-size: 11px;
          font-weight: 700;
          color: ${T.textMuted};
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin-bottom: 10px;
        }
        .ns-checkbox-row {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }
        .ns-checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: ${T.text};
          cursor: pointer;
          user-select: none;
        }
      `}</style>

      <div
        style={{
          fontSize: 13,
          color: T.textMuted,
          marginBottom: 22,
          lineHeight: 1.6,
        }}
      >
        Operational alerts for class bunks, low-confidence detections,
        server/camera downtime, and duplicate attendance. These go to admins and
        department staff — not students. Use the checkboxes below to control
        exactly which alert types each recipient receives.
      </div>

      <div
        className="ns-card"
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
              fontWeight: 700,
              color: T.text,
              marginBottom: 2,
            }}
          >
            Email Notifications
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            {enabled
              ? 'Alerts are active and will be sent.'
              : 'Alerts are currently paused.'}
          </div>
        </div>
        <div
          onClick={handleToggle}
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          />
        </div>
      </div>

      <div className="ns-card">
        <div className="ns-section-label">Add Recipient</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <input
            type="email"
            className="native-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="email@example.com"
            style={{ flex: 2, minWidth: 180 }}
          />
          <select
            className="native-input"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setDept('');
            }}
            style={{ flex: 1, minWidth: 130 }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          {needsDept && (
            <select
              className="native-input"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              disabled={depsLoading}
              style={{ flex: 1, minWidth: 160 }}
            >
              <option value="">
                {depsLoading ? 'Loading...' : 'Select dept...'}
              </option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="ns-section-label" style={{ marginBottom: 8 }}>
          Alert Types For This Recipient
        </div>
        <div className="ns-checkbox-row" style={{ marginBottom: 14 }}>
          {ALERT_TYPES.map((at) => (
            <label key={at.key} className="ns-checkbox-label">
              <input
                type="checkbox"
                checked={!!newAlertTypes[at.key]}
                onChange={(e) =>
                  setNewAlertTypes((prev) => ({
                    ...prev,
                    [at.key]: e.target.checked,
                  }))
                }
              />
              {at.label}
            </label>
          ))}
        </div>

        <button
          className="native-btn"
          onClick={handleAdd}
          disabled={saving || !email.trim()}
          style={{
            background: T.accent,
            color: '#fff',
            opacity: saving || !email.trim() ? 0.6 : 1,
          }}
        >
          {saving ? 'Adding…' : 'Add Recipient'}
        </button>

        {message && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 600,
              color: message.startsWith('Error') ? T.danger : T.success,
            }}
          >
            {message}
          </div>
        )}
      </div>

      <div className="ns-card">
        <div className="ns-section-label">Current Recipients</div>
        {recipients.length === 0 ? (
          <div style={{ fontSize: 13, color: T.textMuted, padding: '8px 0' }}>
            No recipients configured yet.
          </div>
        ) : (
          grouped.map(
            (group) =>
              group.items.length > 0 && (
                <div key={group.value} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: T.accent,
                      textTransform: 'uppercase',
                      letterSpacing: '.06em',
                      marginBottom: 8,
                    }}
                  >
                    {group.label} ({group.items.length})
                  </div>
                  {group.items.map((r) => (
                    <div
                      key={r._id}
                      style={{
                        padding: '10px 12px',
                        marginBottom: 6,
                        background: T.surfaceAlt,
                        border: `1px solid ${T.border}`,
                        borderRadius: 8,
                        opacity: updatingId === r._id ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontWeight: 500, color: T.text, fontSize: 13 }}>
                          {r.email}
                          {r.dept && (
                            <span
                              style={{
                                color: T.accent,
                                marginLeft: 8,
                                fontSize: 11,
                                background: T.accentDim,
                                padding: '2px 8px',
                                borderRadius: 5,
                                fontWeight: 700,
                              }}
                            >
                              {r.dept}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => handleRemove(r._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: T.danger,
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: 6,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="ns-checkbox-row">
                        {ALERT_TYPES.map((at) => (
                          <label key={at.key} className="ns-checkbox-label">
                            <input
                              type="checkbox"
                              checked={!!r.alertTypes?.[at.key]}
                              disabled={updatingId === r._id}
                              onChange={() => handleToggleRecipientAlert(r, at.key)}
                            />
                            {at.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ),
          )
        )}
      </div>
    </div>
  );
}
