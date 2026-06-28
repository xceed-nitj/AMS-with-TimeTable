// client/src/attendancemodule/SchedulerPage.jsx
//
// Pure control panel for the attendance scheduler — NOT a monitoring page.
// No room status cards, no run-now button, no live execution of any kind.
// That surface belongs to a separate "live page" owned by someone else.
//
// This page controls: global on/off, per-period timing, global run
// settings (numRuns/duration/presentLogic), extra/lunch classes, stop
// days, and which rooms (from the Camera Registry) participate in the
// auto-scheduler. It reads/writes the same AcquisitionControl config
// document as the existing AcquisitionControl.jsx page — that page stays
// as-is; this is the new primary place to edit these settings.

import { useState, useEffect, useCallback } from 'react';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const AC_API     = `${apiUrl}/attendancemodule/acquisitioncontrol`;
const CAMERA_API = `${apiUrl}/attendancemodule/cameras`;

// ── Period definitions (display order) ─────────────────────────────────────
const PERIOD_KEYS = [
  'period1','period2','period3','period4',
  'period5','period6','period7','period8',
  'lunch1','lunch2',
];

const SLOT_LABELS = {
  period1: 'Period 1 — 08:30–09:20',
  period2: 'Period 2 — 09:20–10:10',
  period3: 'Period 3 — 10:10–11:00',
  period4: 'Period 4 — 11:00–11:50',
  period5: 'Period 5 — 13:30–14:20',
  period6: 'Period 6 — 14:20–15:10',
  period7: 'Period 7 — 15:10–16:00',
  period8: 'Period 8 — 16:00–16:50',
  lunch1:  'Period 9 — 12:00–12:50',
  lunch2:  'Period 10 — 12:50–13:30',
};

const LOGIC_OPTIONS = [
  { value: 'majority',  label: 'Majority Runs',  hint: 'Present if >50% of runs detect the student' },
  { value: 'any_run',   label: 'Any Run',         hint: 'Present if detected in at least 1 run' },
  { value: 'all_runs',  label: 'All Runs',        hint: 'Present only if detected in every run' },
  { value: 'first_run', label: 'First Run Only',  hint: 'Only the first run counts' },
];

const DURATION_OPTIONS = [30, 60, 90, 120, 180, 300];

// ── Small shared bits (same pattern as AcquisitionControl.jsx) ─────────────
function Label({ children }) {
  return <div style={styles.label}>{children}</div>;
}

function Toast({ toast }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      padding: '12px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
      background: isErr ? theme.dangerDim : theme.successDim,
      color:      isErr ? theme.danger     : theme.success,
      border: `1px solid ${isErr ? theme.danger : theme.success}`,
      animation: 'fadeIn .3s', maxWidth: 420,
    }}>{toast.msg}</div>
  );
}

function SectionHead({ title, sub, color }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 18, borderRadius: 2, background: color || theme.accent }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: theme.text }}>{title}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: theme.textMuted, paddingLeft: 11, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
    >
      <div style={{
        width: 38, height: 20, borderRadius: 10, position: 'relative',
        background: value ? theme.accent : theme.border, transition: 'background .2s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 20 : 3,
          width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s',
        }} />
      </div>
      {label && <span style={{ fontSize: 12, color: value ? theme.text : theme.textMuted }}>{label}</span>}
    </div>
  );
}

// ── Period Card — timing only (numRuns/duration/logic are global, see GlobalEditor) ──
function PeriodCard({ period, onSave }) {
  const [form, setForm] = useState({ ...period });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setForm({ ...period }); setDirty(false); }, [period]);

  const update = (key, val) => { setForm((p) => ({ ...p, [key]: val })); setDirty(true); };

  const handleSave = async () => {
    setSaving(true);
    await onSave(period.periodKey, form);
    setSaving(false);
    setDirty(false);
  };

  const isLunch = period.periodKey.startsWith('lunch');
  const borderColor = isLunch ? theme.warning : theme.accent;

  return (
    <div style={{ background: theme.surface, border: `1.5px solid ${theme.accent}`, borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>
          📅 {SLOT_LABELS[period.periodKey] || period.periodKey}
        </div>
        <Toggle value={form.enabled} onChange={(v) => update('enabled', v)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <div>
          <Label>Start Time</Label>
          <input type="time" value={form.startTime || ''} onChange={(e) => update('startTime', e.target.value)} style={styles.input} />
        </div>
        <div>
          <Label>End Time</Label>
          <input type="time" value={form.endTime || ''} onChange={(e) => update('endTime', e.target.value)} style={styles.input} />
        </div>
      </div>

      {dirty && (
        <button onClick={handleSave} disabled={saving} style={{ ...styles.btnPrimary, width: '100%', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Period'}
        </button>
      )}
    </div>
  );
}

// ── Global run-settings editor (numRuns / duration / presentLogic — applies to all periods) ──
function GlobalEditor({ config, onSave }) {
  const [form, setForm] = useState({
    globalPresentLogic:   config?.globalPresentLogic   || 'majority',
    globalNumRuns:        config?.globalNumRuns        || 1,
    globalRunDurationSec: config?.globalRunDurationSec || 120,
  });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div>
      <div style={{
        fontSize: 11, color: theme.textMuted, marginBottom: 16, padding: '8px 12px',
        borderRadius: 6, background: theme.accentDim, border: `1px solid ${theme.accent}`,
      }}>
        ℹ️ These settings apply uniformly to <strong>all periods</strong>. Per-period timing is in the Periods & Timing tab.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div>
          <Label>Number of Runs (per period)</Label>
          <input
            type="number" min={1} max={10}
            value={form.globalNumRuns}
            onChange={(e) => update('globalNumRuns', Number(e.target.value))}
            style={styles.input}
          />
        </div>
        <div>
          <Label>Run Duration (sec, each run)</Label>
          <select value={form.globalRunDurationSec} onChange={(e) => update('globalRunDurationSec', Number(e.target.value))} style={styles.select}>
            {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}s</option>)}
          </select>
        </div>
      </div>

      <div style={{
        fontSize: 11, color: theme.textMuted, marginBottom: 18, padding: '8px 12px',
        borderRadius: 6, background: theme.bg, border: `1px solid ${theme.border}`,
      }}>
        ℹ️ Check interval between runs is computed automatically at runtime as <strong>period duration ÷ number of runs</strong> — not set here.
      </div>

      <div style={{ marginBottom: 18 }}>
        <Label>Present Logic</Label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {LOGIC_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              title={opt.hint}
              onClick={() => update('globalPresentLogic', opt.value)}
              style={{
                padding: '7px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                borderColor: form.globalPresentLogic === opt.value ? theme.accent : theme.border,
                background:  form.globalPresentLogic === opt.value ? theme.accentDim : 'transparent',
                color:       form.globalPresentLogic === opt.value ? theme.accent    : theme.textMuted,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 5 }}>
          {LOGIC_OPTIONS.find((o) => o.value === form.globalPresentLogic)?.hint}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save Run Settings'}
      </button>
    </div>
  );
}

// ── Extra Class Form ─────────────────────────────────────────────────────────
const EMPTY_EXTRA = {
  date: new Date().toISOString().split('T')[0],
  periodKey: 'period1',
  room: '', batch: '', subject: '', faculty: '', semester: '',
  isLunchHour: false, startTime: '', endTime: '',
};

function ExtraClassForm({ onAdd, allRooms }) {
  const [form, setForm] = useState({ ...EMPTY_EXTRA });
  const [saving, setSaving] = useState(false);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleAdd = async () => {
    if (!form.room || !form.batch || !form.date) return;
    setSaving(true);
    await onAdd(form);
    setForm({ ...EMPTY_EXTRA });
    setSaving(false);
  };

  return (
    <div style={{ ...styles.card, padding: 20, background: theme.surfaceAlt }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Label>Date</Label>
          <input type="date" value={form.date} onChange={(e) => update('date', e.target.value)} style={styles.input} />
        </div>
        <div>
          <Label>Period / Slot</Label>
          <select value={form.periodKey} onChange={(e) => update('periodKey', e.target.value)} style={styles.select}>
            {PERIOD_KEYS.map((k) => <option key={k} value={k}>{SLOT_LABELS[k]}</option>)}
          </select>
        </div>
        <div>
          <Label>Room</Label>
          <select value={form.room} onChange={(e) => update('room', e.target.value)} style={styles.select}>
            <option value="">Select room…</option>
            {allRooms.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Label>Batch (e.g. BTECH_TT_2026)</Label>
          <input value={form.batch} onChange={(e) => update('batch', e.target.value.toUpperCase())}
            placeholder="BTECH_DEPT_YEAR" style={{ ...styles.input, fontFamily: theme.fontMono }} />
        </div>
        <div>
          <Label>Subject</Label>
          <input value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Subject name" style={styles.input} />
        </div>
        <div>
          <Label>Faculty</Label>
          <input value={form.faculty} onChange={(e) => update('faculty', e.target.value)} placeholder="Faculty name" style={styles.input} />
        </div>
        <div>
          <Label>Semester</Label>
          <input value={form.semester} onChange={(e) => update('semester', e.target.value)} placeholder="e.g. 4" style={styles.input} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
        <div>
          <Label>Start Time (override)</Label>
          <input type="time" value={form.startTime} onChange={(e) => update('startTime', e.target.value)} style={styles.input} />
        </div>
        <div>
          <Label>End Time (override)</Label>
          <input type="time" value={form.endTime} onChange={(e) => update('endTime', e.target.value)} style={styles.input} />
        </div>
        <div style={{ paddingBottom: 4 }}>
          <Toggle value={form.isLunchHour} onChange={(v) => update('isLunchHour', v)} label="🍱 Special Slot" />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !form.room || !form.batch || !form.date}
          style={{ ...styles.btnPrimary, opacity: (saving || !form.room || !form.batch || !form.date) ? 0.5 : 1 }}
        >
          {saving ? 'Adding…' : '+ Add Class'}
        </button>
      </div>
    </div>
  );
}

// ── Room Participation Row — sourced from Camera Registry, persisted to includedRooms ──
function RoomParticipationRow({ room, override, onSave, allCamerasInactive }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    room,
    enabled: override ? override.enabled !== false : true,
    rtspUrl1: override?.rtspUrl1 || '',
    rtspUrl2: override?.rtspUrl2 || '',
    note: override?.note || '',
  });
  const [saving, setSaving] = useState(false);

  const enabled = override ? override.enabled !== false : true;

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', background: theme.surfaceAlt, borderRadius: 8,
        border: `1px solid ${enabled ? theme.border : theme.dangerDim}`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: enabled ? theme.success : theme.danger }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, fontFamily: theme.fontMono, flex: 1 }}>{room}</span>
        {allCamerasInactive && (
          <span style={{ fontSize: 10, color: theme.warning }}>⚠ no active camera right now</span>
        )}
        {override?.rtspUrl1 && (
          <span style={{ fontSize: 10, color: theme.textMuted, fontFamily: theme.fontMono }}>
            CAM1 override: {override.rtspUrl1.slice(0, 24)}…
          </span>
        )}
        {override?.note && <span style={{ fontSize: 10, color: theme.textMuted }}>📝 {override.note}</span>}
        <button onClick={() => setEditing(true)} style={{ ...styles.btnGhost, padding: '4px 12px', fontSize: 11 }}>Edit</button>
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, padding: 16, marginBottom: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Label>Room</Label>
          <input value={form.room} readOnly style={{ ...styles.input, opacity: 0.6, fontFamily: theme.fontMono }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
          <Toggle value={form.enabled} onChange={(v) => setForm((p) => ({ ...p, enabled: v }))} label={form.enabled ? 'Included in scheduler' : 'Excluded from scheduler'} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <Label>RTSP Override — Camera 1</Label>
          <input
            value={form.rtspUrl1}
            onChange={(e) => setForm((p) => ({ ...p, rtspUrl1: e.target.value }))}
            placeholder="Leave blank to use Camera Registry"
            style={{ ...styles.input, fontFamily: theme.fontMono }}
          />
        </div>
        <div>
          <Label>RTSP Override — Camera 2</Label>
          <input
            value={form.rtspUrl2}
            onChange={(e) => setForm((p) => ({ ...p, rtspUrl2: e.target.value }))}
            placeholder="Leave blank to use Camera Registry"
            style={{ ...styles.input, fontFamily: theme.fontMono }}
          />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <Label>Note</Label>
        <input value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Optional note" style={styles.input} />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSave} disabled={saving} style={{ ...styles.btnPrimary, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)} style={styles.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SchedulerPage() {
  const [config, setConfig]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [allRooms, setAllRooms]   = useState([]);     // for ExtraClassForm dropdown
  const [cameraRooms, setCameraRooms] = useState([]); // distinct roomIds from Camera Registry, for participation tab
  const [stopDate, setStopDate]   = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab] = useState('periods'); // 'periods' | 'rooms' | 'extras' | 'stopdays'

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(AC_API);
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      showToast('Failed to load config: ' + e.message, 'error');
    }
    setLoading(false);
  }, []);

  // Camera Registry — source of truth for which rooms can participate
  useEffect(() => {
    fetch(CAMERA_API)
      .then((r) => r.json())
      .then((data) => {
        const cams = Array.isArray(data) ? data : [];
        const distinctRooms = [...new Set(cams.map((c) => c.roomId).filter(Boolean))].sort();
        setCameraRooms(distinctRooms.map((roomId) => ({
          roomId,
          hasActiveCamera: cams.some((c) => c.roomId === roomId && c.isActive !== false),
        })));
        setAllRooms(distinctRooms);
      })
      .catch(() => { setCameraRooms([]); setAllRooms([]); });
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  // ── API helpers (same endpoints AcquisitionControl.jsx already uses) ──────
  const patchGlobal = async (body) => {
    const res = await fetch(AC_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    setConfig(data);
    showToast('Settings saved');
  };

  const savePeriod = async (periodKey, form) => {
    const res = await fetch(`${AC_API}/period/${periodKey}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    await fetchConfig();
    showToast(`${SLOT_LABELS[periodKey] || periodKey} saved`);
  };

  const stopDay = async (date) => {
    const res = await fetch(`${AC_API}/stop-day`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date }),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    setConfig((p) => ({ ...p, stoppedDays: data.stoppedDays }));
    showToast(`Scheduler stopped for ${date}`);
  };

  const resumeDay = async (date) => {
    const res = await fetch(`${AC_API}/stop-day/${date}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    setConfig((p) => ({ ...p, stoppedDays: data.stoppedDays }));
    showToast(`${date} re-enabled`);
  };

  const upsertRoom = async (form) => {
    const res = await fetch(`${AC_API}/rooms`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    setConfig((p) => ({ ...p, includedRooms: data }));
    showToast(`${form.room} saved`);
  };

  const addExtraClass = async (form) => {
    const res = await fetch(`${AC_API}/extra-class`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    setConfig((p) => ({ ...p, extraClasses: data }));
    showToast('Extra class added');
  };

  const deleteExtraClass = async (id) => {
    if (!window.confirm('Delete this extra class?')) return;
    const res = await fetch(`${AC_API}/extra-class/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) { showToast(data.error, 'error'); return; }
    setConfig((p) => ({ ...p, extraClasses: data }));
    showToast('Extra class removed');
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: theme.textMuted, fontSize: 14 }}>Loading scheduler config…</div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const isTodayStopped = config?.stoppedDays?.includes(today);

  return (
    <div style={styles.page}>
      <style>{cssReset}</style>
      <Toast toast={toast} />

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ ...styles.heading, marginBottom: 4 }}>🗓️ Scheduler</div>
            <div style={styles.subheading}>
              Controls how attendance gets scheduled — periods, run settings, rooms, extra classes, stop days.
              This page does not run or monitor attendance.
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 20px', borderRadius: 10,
            background: config?.active ? theme.successDim : theme.dangerDim,
            border: `1px solid ${config?.active ? theme.success : theme.danger}`,
          }}>
            <Toggle value={config?.active || false} onChange={(v) => patchGlobal({ active: v })} />
            <span style={{ fontSize: 13, fontWeight: 700, color: config?.active ? theme.success : theme.danger }}>
              {config?.active ? '✅ Scheduler ACTIVE' : '⛔ Scheduler STOPPED'}
            </span>
          </div>
          <button 
            onClick={() => window.open('/attendance/live-report', '_blank')}
            style={{
              ...styles.btnPrimary,
              padding: '10px 20px',
              borderRadius: 10,
            }}
          >
            📊 View Live Dashboard
          </button>
        </div>

        {isTodayStopped && (
          <div style={{
            marginTop: 14, padding: '12px 18px', borderRadius: 8,
            background: theme.dangerDim, border: `1px solid ${theme.danger}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 18 }}>⛔</span>
            <span style={{ color: theme.danger, fontWeight: 700 }}>Scheduler is stopped for today ({today})</span>
            <button onClick={() => resumeDay(today)} style={{ marginLeft: 'auto', ...styles.btnDanger, padding: '6px 14px' }}>
              Resume Today
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${theme.border}`, marginBottom: 28 }}>
        {[
          ['periods', '📅 Periods & Run Settings'],
          ['rooms',   '🏫 Rooms'],
          ['extras',  '➕ Extra Classes'],
          ['stopdays','⛔ Stop Days'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: '10px 18px', background: 'transparent', border: 'none',
            borderBottom: `2px solid ${tab === id ? theme.accent : 'transparent'}`,
            color: tab === id ? theme.accent : theme.textMuted,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* ══════════════ PERIODS TAB ══════════════ */}
      {tab === 'periods' && (
        <div>
          <SectionHead title="Run Settings (All Periods)" sub="Number of runs, duration, and present logic apply to every period below" color={theme.accent} />
          <div style={{ ...styles.card, marginBottom: 28 }}>
            <GlobalEditor config={config} onSave={patchGlobal} />
          </div>

          <SectionHead title="Period Timings" sub="Set start and end time for each period — this is what the scheduler uses to know when to fire" color={theme.accent} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {(config?.periods || []).map((period) => (
              <PeriodCard key={period.periodKey} period={period} onSave={savePeriod} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════ ROOMS TAB ══════════════ */}
      {tab === 'rooms' && (
        <div>
          <SectionHead
            title="Room Participation"
            sub="Rooms are listed from the Camera Registry. Toggle which ones the scheduler should include — a room can have a working camera and still be excluded here."
            color={theme.accent}
          />
          {cameraRooms.length === 0 ? (
            <div style={{ ...styles.card, padding: 40, textAlign: 'center', color: theme.textMuted, borderStyle: 'dashed' }}>
              No rooms found in the Camera Registry. Add a camera there first.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cameraRooms.map(({ roomId, hasActiveCamera }) => {
                const override = (config?.includedRooms || []).find((r) => r.room?.toUpperCase() === roomId.toUpperCase());
                return (
                  <RoomParticipationRow
                    key={roomId}
                    room={roomId}
                    override={override}
                    allCamerasInactive={!hasActiveCamera}
                    onSave={upsertRoom}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ EXTRA CLASSES TAB ══════════════ */}
      {tab === 'extras' && (
        <div>
          <SectionHead
            title="Extra Classes"
            sub="Schedule extra classes outside the normal timetable."
            color={theme.warning}
          />
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 10 }}>
              Add New Extra Class
            </div>
            <ExtraClassForm onAdd={addExtraClass} allRooms={allRooms} />
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 12 }}>
            Scheduled Extra Classes ({(config?.extraClasses || []).filter((e) => e.active).length} active)
          </div>

          {(config?.extraClasses || []).length === 0 ? (
            <div style={{ ...styles.card, padding: 40, textAlign: 'center', color: theme.textMuted, borderStyle: 'dashed' }}>
              No extra classes scheduled yet.
            </div>
          ) : (
            <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {['Date','Period','Room','Batch','Subject','Faculty','Sem','Time','Type','Status',''].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(config?.extraClasses || []).map((ec) => (
                    <tr key={ec._id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ padding: '10px 12px', fontFamily: theme.fontMono, fontSize: 12 }}>{ec.date}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: theme.textMuted }}>{SLOT_LABELS[ec.periodKey] || ec.periodKey}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{ec.room}</td>
                      <td style={{ padding: '10px 12px', fontFamily: theme.fontMono, fontSize: 11, color: theme.accent }}>{ec.batch}</td>
                      <td style={{ padding: '10px 12px', color: theme.textMuted }}>{ec.subject || '—'}</td>
                      <td style={{ padding: '10px 12px', color: theme.textMuted }}>{ec.faculty || '—'}</td>
                      <td style={{ padding: '10px 12px', color: theme.textMuted }}>{ec.semester || '—'}</td>
                      <td style={{ padding: '10px 12px', fontFamily: theme.fontMono, fontSize: 11 }}>{ec.startTime && ec.endTime ? `${ec.startTime}–${ec.endTime}` : '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {ec.isLunchHour ? (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: theme.warningDim, color: theme.warning }}>🍱special</span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: theme.accentDim, color: theme.accent }}>Extra</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: ec.active ? theme.successDim : theme.dangerDim, color: ec.active ? theme.success : theme.danger }}>
                          {ec.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => deleteExtraClass(ec._id)} style={{ ...styles.btnDanger, padding: '4px 10px', fontSize: 11 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ STOP DAYS TAB ══════════════ */}
      {tab === 'stopdays' && (
        <div style={{ maxWidth: 600 }}>
          <SectionHead title="Stop Scheduler for Specific Days" sub="Add dates where the scheduler should not fire at all — holidays, exams, bandhs, etc." color={theme.danger} />

          <div style={{ ...styles.card, padding: 16, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Label>Date to Stop</Label>
              <input type="date" value={stopDate} onChange={(e) => setStopDate(e.target.value)} style={styles.input} />
            </div>
            <button
              onClick={() => stopDay(stopDate)}
              disabled={!stopDate}
              style={{ ...styles.btnPrimary, background: theme.danger, color: '#fff', opacity: stopDate ? 1 : 0.5 }}
            >
              ⛔ Stop This Day
            </button>
          </div>

          {(config?.stoppedDays || []).length === 0 ? (
            <div style={{ ...styles.card, padding: 40, textAlign: 'center', color: theme.textMuted, borderStyle: 'dashed' }}>
              No days stopped. Scheduler runs every scheduled day.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...(config?.stoppedDays || [])].sort().map((date) => {
                const isPast = date < today;
                return (
                  <div key={date} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 8,
                    background: theme.dangerDim, border: `1px solid ${isPast ? theme.border : theme.danger}`, opacity: isPast ? 0.5 : 1,
                  }}>
                    <span style={{ fontSize: 16 }}>⛔</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: theme.text, flex: 1 }}>
                      {date}
                      {date === today && <span style={{ marginLeft: 8, fontSize: 10, color: theme.danger, fontWeight: 700 }}>TODAY</span>}
                      {isPast && <span style={{ marginLeft: 8, fontSize: 10, color: theme.textMuted }}>past</span>}
                    </span>
                    <button onClick={() => resumeDay(date)} style={{ ...styles.btnGhost, padding: '5px 12px', fontSize: 11 }}>Remove</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}