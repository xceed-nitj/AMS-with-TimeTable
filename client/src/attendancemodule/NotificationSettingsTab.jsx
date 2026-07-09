import { useState, useEffect } from 'react';
import { theme as T } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const BASE = `${apiUrl}/attendancemodule/settings/notifications`;
const GT_API = `${apiUrl}/attendancemodule/ground-truth`;

const ROLES = [
  { value: 'admin', label: 'Admin', color: '#6366f1' },
  { value: 'coordinator', label: 'Dept Coordinator', color: '#0ea5e9' },
  { value: 'head', label: 'Dept Head', color: '#f59e0b' },
];

const ALERT_TYPES = [
  {
    key: 'serverDown',
    label: 'Server Down',
    description: 'ML service or camera becomes unreachable',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="3" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <line x1="5" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="8" y1="12" x2="8" y2="14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="5.5" y1="6.5" x2="5.5" y2="8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="8" y1="5.5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="10.5" y1="7" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'erpDown',
    label: 'ERP Down',
    description: 'ERP server endpoints unreachable — nightly auto-sync will be skipped',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5c-3 0-5.5 1-5.5 2.2v8.6c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2V3.7C13.5 2.5 11 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2.5 3.7c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2.5 8c0 1.2 2.5 2.2 5.5 2.2s5.5-1 5.5-2.2" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    key: 'lowConfidence',
    label: 'Low Confidence',
    description: 'Face match confidence below threshold',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4"/>
        <line x1="1.5" y1="8" x2="3.5" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="12.5" y1="8" x2="14.5" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="3.2" y1="3.2" x2="4.6" y2="4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="11.4" y1="11.4" x2="12.8" y2="12.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'noReportSaved',
    label: 'No Report Saved',
    description: 'No attendance report generated for a scheduled class',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M3 2.5A1.5 1.5 0 0 1 4.5 1h5L13 4.5V13.5A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5V2.5z" stroke="currentColor" strokeWidth="1.4"/>
        <polyline points="9.5,1 9.5,5 13,5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <line x1="5.5" y1="8.5" x2="10.5" y2="8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="5.5" y1="11" x2="8.5" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'classBunk',
    label: 'Class Bunked',
    description: 'All students absent, no faces detected in the room',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5L14.5 13H1.5L8 1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <line x1="8" y1="6" x2="8" y2="9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
      </svg>
    ),
  },
  {
    key: 'duplicateAttendance',
    label: 'Duplicate Attendance',
    description: 'Same student marked present in two sessions simultaneously',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="10.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M1 14c0-2.5 2-4 4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M15 14c0-2.5-2-4-4.5-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M8 10c2.5 0 4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <path d="M8 10c-2.5 0-4.5 1.5-4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'dailySummary',
    label: 'Attendance Summary',
    description: 'Daily/weekly attendance summary for HODs (configured below)',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <line x1="4.5" y1="11" x2="4.5" y2="8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="8" y1="11" x2="8" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="11.5" y1="11" x2="11.5" y2="4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'embeddingProgress',
    label: 'Embedding Progress',
    description: 'Weekly per-subject embedding/ground-truth readiness summary',
    icon: (
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="8" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4"/>
        <line x1="4.5" y1="13.5" x2="11.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const MODES = [
  { value: 'all', label: 'All classes' },
  { value: 'threshold', label: 'Only below threshold' },
];

export default function NotificationSettingsTab() {
  const [enabled, setEnabled] = useState(false);
  const [roles, setRoles] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [dailySummaryConfig, setDailySummaryConfig] = useState({
    enabled: false,
    frequency: 'daily',
    mode: 'all',
    threshold: 75,
  });
  const [savingDailySummary, setSavingDailySummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [dept, setDept] = useState('');
  const [departments, setDepts] = useState([]);
  const [depsLoading, setDepsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [updatingRole, setUpdatingRole] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetch(`${BASE}/`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setEnabled(!!d.settings?.enabled);
        setRoles(d.settings?.roles || []);
        setRecipients(d.settings?.recipients || []);
        if (d.settings?.dailySummaryConfig) setDailySummaryConfig(d.settings.dailySummaryConfig);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (role !== 'coordinator' && role !== 'head') return;
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
      .catch(() => showMsg('Could not load departments', 'error'))
      .finally(() => setDepsLoading(false));
  }, [role]);

  function showMsg(text, type = 'success') {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  }

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

  const handleRoleAlertToggle = async (roleValue, alertKey, currentValue) => {
    const roleDoc = roles.find((r) => r.role === roleValue);
    if (!roleDoc) return;
    const updatedAlertTypes = {
      ...roleDoc.alertTypes,
      [alertKey]: !currentValue,
    };
    setUpdatingRole(roleValue);
    try {
      const res = await fetch(`${BASE}/roles/${roleValue}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertTypes: updatedAlertTypes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setRoles(data.settings.roles);
    } catch (err) {
      showMsg('Error: ' + err.message, 'error');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDailySummaryChange = async (patch) => {
    const next = { ...dailySummaryConfig, ...patch };
    setDailySummaryConfig(next);
    setSavingDailySummary(true);
    try {
      const res = await fetch(`${BASE}/daily-summary`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setDailySummaryConfig(data.settings.dailySummaryConfig);
    } catch (err) {
      showMsg('Error: ' + err.message, 'error');
    } finally {
      setSavingDailySummary(false);
    }
  };

  const handleAdd = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if ((role === 'coordinator' || role === 'head') && !dept.trim()) {
      showMsg('Dept is required for Coordinator / Head.', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/recipients`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, role, dept: dept.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add');
      setRecipients(data.settings.recipients);
      setEmail('');
      setDept('');
      setRole('admin');
      showMsg('Recipient added.');
    } catch (err) {
      showMsg('Error: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    setRemovingId(id);
    try {
      const res = await fetch(`${BASE}/recipients/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove');
      setRecipients(data.settings.recipients);
    } catch (err) {
      showMsg('Error: ' + err.message, 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const grouped = ROLES.map((r) => ({
    ...r,
    items: recipients.filter((rec) => rec.role === r.value),
  }));

  const needsDept = role === 'coordinator' || role === 'head';

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            margin: '0 auto 12px',
            border: `2.5px solid ${T.border}`,
            borderTopColor: T.accent,
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <div style={{ color: T.textMuted, fontSize: 13 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div
      style={{ padding: '24px 28px', width: '100%', boxSizing: 'border-box' }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .ns-card {
          background: ${T.surface};
          border: 1px solid ${T.border};
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
        }
        .ns-card-header {
          padding: 12px 18px;
          border-bottom: 1px solid ${T.border};
          background: ${T.surfaceAlt || T.surface};
        }
        .ns-section-title {
          font-size: 11px; font-weight: 700;
          color: ${T.textMuted};
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ns-card-body { padding: 20px; }

        /* ── Role alert table ── */
        .ns-role-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        .ns-role-table thead tr {
          background: ${T.bg || T.surfaceAlt};
        }
        .ns-role-table thead th {
          padding: 14px 16px;
          text-align: center;
          border-bottom: 1px solid ${T.border};
          vertical-align: top;
        }
        .ns-role-table thead th:first-child {
          text-align: left;
          width: 170px;
          padding-left: 4px;
        }
        .ns-th-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px; height: 30px;
          border-radius: 8px;
          background: ${T.accentDim};
          color: ${T.accent};
          margin: 0 auto 7px;
        }
        .ns-th-label {
          font-size: 11px; font-weight: 700;
          color: ${T.text};
          letter-spacing: 0.02em;
        }
        .ns-th-desc {
          font-size: 10px; font-weight: 400;
          color: ${T.textMuted};
          margin-top: 3px;
          line-height: 1.4;
          max-width: 120px;
          margin-left: auto;
          margin-right: auto;
        }
        .ns-role-table tbody tr {
          transition: background .15s, opacity .15s;
        }
        .ns-role-table tbody tr:hover {
          background: ${T.accentDim}55;
        }
        .ns-role-table tbody tr:not(:last-child) td {
          border-bottom: 1px solid ${T.border};
        }
        .ns-role-table td {
          padding: 16px 12px;
          text-align: center;
          vertical-align: middle;
        }
        .ns-role-table td:first-child {
          text-align: left;
          padding-left: 4px;
        }
        .ns-role-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: ${T.text};
        }
        .ns-role-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        /* custom toggle */
        .ns-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 9px;
          cursor: pointer;
          border: 2px solid ${T.border};
          background: transparent;
          transition: all .15s;
          color: transparent;
        }
        .ns-toggle.checked {
          background: ${T.accent};
          border-color: ${T.accent};
          color: #fff;
          box-shadow: 0 2px 8px ${T.accent}55;
        }
        .ns-toggle:not(.checked):hover {
          border-color: ${T.accent};
          background: ${T.accentDim};
          color: ${T.accent};
        }
        .ns-toggle.disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        /* ── Add recipient ── */
        .ns-add-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        /* ── Recipients list ── */
        .ns-recipient-row {
          display: flex; align-items: center;
          justify-content: space-between;
          padding: 11px 14px; margin-bottom: 8px;
          background: ${T.surfaceAlt || T.surface};
          border: 1px solid ${T.border};
          border-radius: 9px; font-size: 13.5px;
          transition: border-color .15s, box-shadow .15s;
        }
        .ns-recipient-row:hover {
          border-color: ${T.accent}55;
          box-shadow: 0 1px 6px rgba(0,0,0,0.04);
        }
        .ns-recipient-row:last-child { margin-bottom: 0; }
        .ns-remove-btn {
          background: none; border: none;
          cursor: pointer; color: ${T.danger};
          font-size: 12px; font-weight: 600;
          padding: 5px 10px; border-radius: 6px;
          transition: background .15s;
          font-family: ${T.fontBody};
          flex-shrink: 0;
        }
        .ns-remove-btn:hover { background: rgba(239,68,68,0.1); }
        .ns-remove-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ns-dept-tag {
          color: ${T.accent}; margin-left: 10px;
          font-size: 11px; font-weight: 700;
          padding: 2px 9px; border-radius: 5px;
          background: ${T.accentDim || 'rgba(99,102,241,0.08)'};
        }
        .ns-group-label {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 10.5px; font-weight: 700;
          color: ${T.textMuted};
          text-transform: uppercase;
          letter-spacing: .06em;
          margin: 0 0 10px;
        }
        .ns-group-count {
          font-size: 10px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 10px;
          background: ${T.surfaceAlt || 'rgba(0,0,0,0.05)'};
          color: ${T.text};
        }
      `}</style>

      {/* Toggle card */}
      <div className="ns-card">
        <div
          className="ns-card-body"
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
              Notifications {enabled ? 'enabled' : 'disabled'}
            </div>
            <div style={{ fontSize: 12, color: T.textMuted }}>
              {enabled
                ? 'Alerts are active and will be sent to configured recipients.'
                : 'All alerts are currently paused — no emails will be sent.'}
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

      {/* Role alert settings */}
      <div className="ns-card">
        <div className="ns-card-header">
          <span className="ns-section-title">Role alert settings</span>
        </div>
        <div className="ns-card-body">
          <p style={{ fontSize: 12.5, color: T.textMuted, margin: '0 0 18px', lineHeight: 1.5 }}>
            Select which alert types each role receives. Recipients inherit their role&apos;s settings.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="ns-role-table">
              <thead>
                <tr>
                  <th>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</div>
                  </th>
                  {ALERT_TYPES.map((at) => (
                    <th key={at.key}>
                      <div className="ns-th-icon">{at.icon}</div>
                      <div className="ns-th-label">{at.label}</div>
                      {at.description && <div className="ns-th-desc">{at.description}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => {
                  const roleDoc = roles.find((rd) => rd.role === r.value);
                  const isUpdating = updatingRole === r.value;
                  return (
                    <tr key={r.value} style={{ opacity: isUpdating ? 0.55 : 1, transition: 'opacity .15s' }}>
                      <td>
                        <span className="ns-role-pill">
                          <span className="ns-role-dot" style={{ background: r.color }} />
                          {r.label}
                        </span>
                      </td>
                      {ALERT_TYPES.map((at) => {
                        const checked = !!roleDoc?.alertTypes?.[at.key];
                        return (
                          <td key={at.key}>
                            <div
                              className={`ns-toggle${checked ? ' checked' : ''}${isUpdating ? ' disabled' : ''}`}
                              onClick={() => !isUpdating && handleRoleAlertToggle(r.value, at.key, checked)}
                              title={checked ? 'Click to disable' : 'Click to enable'}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <polyline points="3,8.5 6.5,12 13,4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily/Weekly HOD attendance summary settings */}
      <div className="ns-card">
        <div className="ns-card-header">
          <span className="ns-section-title">Attendance summary schedule</span>
        </div>
        <div className="ns-card-body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: dailySummaryConfig.enabled ? 18 : 0,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                Send attendance summary emails
              </div>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                Sent to roles with &quot;Attendance Summary&quot; checked above, scoped to each
                recipient&apos;s department.
              </div>
            </div>
            <div
              onClick={() => !savingDailySummary && handleDailySummaryChange({ enabled: !dailySummaryConfig.enabled })}
              title={dailySummaryConfig.enabled ? 'Click to disable' : 'Click to enable'}
              style={{
                width: 46,
                height: 26,
                borderRadius: 26,
                cursor: savingDailySummary ? 'not-allowed' : 'pointer',
                opacity: savingDailySummary ? 0.6 : 1,
                background: dailySummaryConfig.enabled ? T.accent : '#d1d5db',
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
                  left: dailySummaryConfig.enabled ? 23 : 3,
                  top: 3,
                  background: '#fff',
                  borderRadius: '50%',
                  transition: 'left .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </div>

          {dailySummaryConfig.enabled && (
            <div className="ns-add-row">
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Frequency
                </label>
                <select
                  className="native-input"
                  value={dailySummaryConfig.frequency}
                  onChange={(e) => handleDailySummaryChange({ frequency: e.target.value })}
                  disabled={savingDailySummary}
                  style={{ width: '100%' }}
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                  Include
                </label>
                <select
                  className="native-input"
                  value={dailySummaryConfig.mode}
                  onChange={(e) => handleDailySummaryChange({ mode: e.target.value })}
                  disabled={savingDailySummary}
                  style={{ width: '100%' }}
                >
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              {dailySummaryConfig.mode === 'threshold' && (
                <div style={{ flex: 1, minWidth: 150 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
                    Threshold (%)
                  </label>
                  <input
                    type="number"
                    className="native-input"
                    min={0}
                    max={100}
                    value={dailySummaryConfig.threshold}
                    onChange={(e) => setDailySummaryConfig({ ...dailySummaryConfig, threshold: Number(e.target.value) })}
                    onBlur={(e) => handleDailySummaryChange({ threshold: Number(e.target.value) })}
                    disabled={savingDailySummary}
                    style={{ width: '100%' }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add recipient */}
      <div className="ns-card">
        <div className="ns-card-header">
          <span className="ns-section-title">Add recipient</span>
        </div>
        <div className="ns-card-body">
          <div className="ns-add-row">
            <input
              type="email"
              className="native-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="email@example.com"
              style={{ flex: 2, minWidth: 220 }}
            />
            <select
              className="native-input"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setDept('');
              }}
              style={{ flex: 1, minWidth: 150 }}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {needsDept && (
              <select
                className="native-input"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                disabled={depsLoading}
                style={{ flex: 1, minWidth: 200 }}
              >
                <option value="">
                  {depsLoading ? 'Loading departments…' : 'Select department…'}
                </option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}
            <button
              className="native-btn"
              onClick={handleAdd}
              disabled={saving || !email.trim()}
              style={{
                background: T.accent,
                color: '#fff',
                opacity: saving || !email.trim() ? 0.55 : 1,
                flexShrink: 0,
              }}
            >
              {saving ? 'Adding…' : 'Add'}
            </button>
          </div>
          {message.text && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12.5,
                fontWeight: 600,
                color:
                  message.type === 'error' ? T.danger : T.success || T.accent,
              }}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Recipients list */}
      <div className="ns-card">
        <div
          className="ns-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span className="ns-section-title">Current recipients</span>
          <span className="ns-group-count">{recipients.length} total</span>
        </div>
        <div className="ns-card-body">
          {recipients.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: T.textMuted,
                textAlign: 'center',
                padding: '20px 0',
              }}
            >
              No recipients configured yet. Add one above.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 20,
              }}
            >
              {grouped.map(
                (group) =>
                  group.items.length > 0 && (
                    <div key={group.value}>
                      <p className="ns-group-label">
                        <span
                          className="ns-role-dot"
                          style={{ background: group.color }}
                        />
                        {group.label}
                        <span className="ns-group-count">
                          {group.items.length}
                        </span>
                      </p>
                      {group.items.map((r) => (
                        <div key={r._id} className="ns-recipient-row">
                          <span
                            style={{
                              fontWeight: 500,
                              color: T.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {r.email}
                            {r.dept && (
                              <span className="ns-dept-tag">{r.dept}</span>
                            )}
                          </span>
                          <button
                            className="ns-remove-btn"
                            onClick={() => handleRemove(r._id)}
                            disabled={removingId === r._id}
                          >
                            {removingId === r._id ? 'Removing…' : 'Remove'}
                          </button>
                        </div>
                      ))}
                    </div>
                  ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
