// client/src/attendancemodule/SchedulerPage.jsx
//
// Manual trigger page for the attendance scheduler. Mirrors what the cron
// job (autoAttendanceScheduler.js) does, but for all enabled rooms at once,
// with live visibility per room. Rooms are sourced from the Camera Registry
// (AcquisitionControl's old room-management tab was removed).

import { useState, useEffect, useCallback } from 'react';
import { theme, styles, cssReset } from './config';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();
const AC_API        = `${apiUrl}/attendancemodule/acquisitioncontrol`;
const SCHEDULER_API = `${apiUrl}/attendancemodule/scheduler`;
const CAMERA_API    = `${apiUrl}/attendancemodule/cameras`;

const SLOT_LABELS = {
  period1: 'Period 1 — 08:30–09:20',
  period2: 'Period 2 — 09:20–10:10',
  period3: 'Period 3 — 10:10–11:00',
  period4: 'Period 4 — 11:00–11:50',
  period5: 'Period 5 — 13:30–14:20',
  period6: 'Period 6 — 14:20–15:10',
  period7: 'Period 7 — 15:10–16:00',
  period8: 'Period 8 — 16:00–16:50',
  lunch1:  'Lunch Slot 1 — 12:00–12:50',
  lunch2:  'Lunch Slot 2 — 12:50–13:30',
};

const SLOT_SCHEDULE = {
  period1: { startMin: 8 * 60 + 30, endMin: 9 * 60 + 30 },
  period2: { startMin: 9 * 60 + 30, endMin: 10 * 60 + 30 },
  period3: { startMin: 10 * 60 + 30, endMin: 11 * 60 + 30 },
  period4: { startMin: 11 * 60 + 30, endMin: 12 * 60 + 30 },
  period5: { startMin: 13 * 60 + 30, endMin: 14 * 60 + 30 },
  period6: { startMin: 14 * 60 + 30, endMin: 15 * 60 + 30 },
  period7: { startMin: 15 * 60 + 30, endMin: 16 * 60 + 30 },
  period8: { startMin: 16 * 60 + 30, endMin: 17 * 60 + 30 },
};

const STATUS_META = {
  idle:       { color: theme.textMuted, dim: theme.surfaceAlt, label: 'IDLE' },
  'would-run':{ color: theme.accent,    dim: theme.accentDim,  label: 'WOULD RUN' },
  checking:   { color: theme.accent,    dim: theme.accentDim,  label: 'CHECKING' },
  running:    { color: theme.success,   dim: theme.successDim, label: 'RUNNING' },
  done:       { color: theme.success,   dim: theme.successDim, label: 'DONE' },
  skipped:    { color: theme.warning,   dim: theme.warningDim, label: 'SKIPPED' },
  error:      { color: theme.danger,    dim: theme.dangerDim,  label: 'ERROR' },
};

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// ── Small shared bits (kept local — same pattern as AcquisitionControl.jsx) ──
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

function detectCurrentSlot() {
  const now = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();
  for (const [key, { startMin, endMin }] of Object.entries(SLOT_SCHEDULE)) {
    if (curMin >= startMin && curMin < endMin) return key;
  }
  return null;
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

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META.idle;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 99,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      background: meta.dim, color: meta.color,
      border: `1px solid ${meta.color}`,
      whiteSpace: 'nowrap',
    }}>
      {meta.label}
    </span>
  );
}

// ── Room card ────────────────────────────────────────────────────────────────
function RoomCard({ room }) {
  const [expanded, setExpanded] = useState(false);
  const ctx = room.ctx;
  const summary = room.summary;
  const meta = STATUS_META[room.status] || STATUS_META.idle;

  return (
    <div style={{
      ...styles.card,
      padding: 16,
      borderLeft: `3px solid ${meta.color}`,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: theme.text, fontFamily: theme.fontMono }}>
          {room.room}
        </span>
        <StatusPill status={room.status} />
      </div>

      {ctx ? (
        <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>
          <div><span style={{ color: theme.text, fontWeight: 600 }}>Batch:</span> {ctx.batch}</div>
          <div><span style={{ color: theme.text, fontWeight: 600 }}>Subject:</span> {ctx.subject || '—'}</div>
          {room.subjectMeta?.subCode && (
            <div>
              <span style={{ color: theme.text, fontWeight: 600 }}>Code:</span> {room.subjectMeta.subCode}
              {room.subjectMeta.subName ? ` (${room.subjectMeta.subName})` : ''}
            </div>
          )}
        </div>
      ) : (
        room.status !== 'idle' && (
          <div style={{ fontSize: 12, color: theme.textMuted }}>No class context resolved</div>
        )
      )}

      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: theme.textMuted }}>
        <span>
          Cam:&nbsp;
          {(room.cameras?.hasCam1 ?? !!room.cameras?.cam1) ? '📷' : '—'}
          {(room.cameras?.hasCam2 ?? !!room.cameras?.cam2) ? '📷' : ''}
        </span>
        {room.pkl && (
          <span>PKL: {(typeof room.pkl === 'string' ? room.pkl : room.pkl.filename)} ✓</span>
        )}
      </div>

      {room.reason && (
        <div style={{
          fontSize: 11, padding: '6px 10px', borderRadius: 6,
          background: room.status === 'error' ? theme.dangerDim : theme.warningDim,
          color:      room.status === 'error' ? theme.danger     : theme.warning,
        }}>
          {room.status === 'error' ? 'Error: ' : 'Reason: '}{room.reason}
        </div>
      )}

      {summary && (
        <div style={{ display: 'flex', gap: 12, fontSize: 12, fontWeight: 700 }}>
          <span style={{ color: theme.success }}>P:{summary.present ?? summary.totalStudents ? summary.present : 0}</span>
          <span style={{ color: theme.danger }}>A:{summary.absent ?? 0}</span>
          <span style={{ color: theme.warning }}>R:{summary.review ?? 0}</span>
          {summary.attendancePct !== undefined && (
            <span style={{ color: theme.accent, marginLeft: 'auto' }}>{summary.attendancePct}%</span>
          )}
        </div>
      )}

      {room.log?.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              fontSize: 11, background: 'none', border: 'none',
              color: theme.accent, cursor: 'pointer', padding: 0, fontWeight: 600,
            }}
          >
            {expanded ? '▲ Hide log' : '▼ Show log'}
          </button>
          {expanded && (
            <ul style={{ fontSize: 11, color: theme.textMuted, marginTop: 6, paddingLeft: 16 }}>
              {room.log.map((entry, i) => <li key={i}>{entry.msg}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SchedulerPage() {
  const [config,        setConfig]        = useState(null);
  const [cameraRoomCount, setCameraRoomCount] = useState(null); // null = loading
  const [slot]          = useState(detectCurrentSlot());
  const [date,          setDate]          = useState(todayStr());
  const [rooms,         setRooms]         = useState([]);
  const [running,       setRunning]       = useState(false);
  const [loadingPreview,setLoadingPreview]= useState(false);
  const [toast,         setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load AcquisitionControl config — for slot dropdown + global active/stopped state
  useEffect(() => {
    fetch(AC_API)
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        const firstEnabled = (data.periods || []).find((p) => p.enabled);
        if (firstEnabled) setSlot(firstEnabled.periodKey);
      })
      .catch((e) => showToast('Failed to load Acquisition Control config: ' + e.message, 'error'));
  }, []);

  // Load distinct rooms from the Camera Registry — just for the empty-state check
  useEffect(() => {
    fetch(`${CAMERA_API}?isActive=true`)
      .then((r) => r.json())
      .then((data) => {
        const distinctRooms = new Set((Array.isArray(data) ? data : []).map((c) => c.roomId).filter(Boolean));
        setCameraRoomCount(distinctRooms.size);
      })
      .catch(() => setCameraRoomCount(0));
  }, []);

  const todayStopped = config?.stoppedDays?.includes(date);
  const acquisitionActive = Boolean(config?.active) && !todayStopped;

  const loadPreview = useCallback(() => {
    if (!slot) return;
    setLoadingPreview(true);
    fetch(`${SCHEDULER_API}/preview?slot=${slot}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { showToast(data.error, 'error'); setRooms([]); return; }
        setRooms(data.rooms || []);
      })
      .catch((e) => showToast('Preview failed: ' + e.message, 'error'))
      .finally(() => setLoadingPreview(false));
  }, [slot, date]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  async function handleRunAll() {
    setRunning(true);
    try {
      const res = await fetch(`${SCHEDULER_API}/run-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Run failed');
      setRooms(data.rooms || []);
      showToast(`Run complete — ${data.summary.done} done, ${data.summary.skipped} skipped, ${data.summary.error} errors`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRunning(false);
    }
  }

  if (!config || cameraRoomCount === null) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ color: theme.textMuted, fontSize: 14 }}>Loading scheduler…</div>
      </div>
    );
  }

  const doneCount = rooms.filter((r) => r.status === 'done').length;
  const noCameras = cameraRoomCount === 0;

  return (
    <div style={styles.page}>
      <style>{cssReset}</style>
      <Toast toast={toast} />

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="ams-page-header">
        <div>
          <h1>🗓️ Scheduler — Attendance Run</h1>
          <p>Testing interface. Production runs automatically via cron.</p>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', borderRadius: 10,
          background: acquisitionActive ? theme.successDim : theme.dangerDim,
          border: `1px solid ${acquisitionActive ? theme.success : theme.danger}`,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: acquisitionActive ? theme.success : theme.danger }}>
            {acquisitionActive ? '✅ Acquisition ACTIVE' : '⛔ Acquisition STOPPED'}
          </span>
        </div>
      </div>

      {todayStopped && (
        <div style={{
          marginBottom: 20, padding: '10px 16px', borderRadius: 8,
          background: theme.warningDim, border: `1px solid ${theme.warning}`,
          fontSize: 12, color: theme.warning, fontWeight: 600,
        }}>
          ⛔ {date} is marked as a stopped day in Acquisition Control.
        </div>
      )}

      {noCameras && (
        <div style={{
          marginBottom: 20, padding: '14px 18px', borderRadius: 8,
          background: theme.dangerDim, border: `1px solid ${theme.danger}`,
          fontSize: 13, color: theme.danger,
        }}>
          No active cameras found in the Camera Registry. Add at least one camera for a room
          (Camera Registry page) before running the scheduler — rooms are sourced from there, not from Acquisition Control.
        </div>
      )}

      {/* ── Controls ─────────────────────────────────────────────────── */}
     <div style={{ ...styles.card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
        <div>
          <Label>Current Period (auto-detected)</Label>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.text }}>
            {slot ? (SLOT_LABELS[slot] || slot) : 'No period active right now'}
          </div>
        </div>
        <div>
          <Label>Date</Label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
        </div>
        <button
          onClick={handleRunAll}
          disabled={!acquisitionActive || running || !slot || noCameras}
          style={{
            ...styles.btnPrimary,
            opacity: (!acquisitionActive || running || !slot || noCameras) ? 0.5 : 1,
            cursor: (!acquisitionActive || running || !slot || noCameras) ? 'not-allowed' : 'pointer',
          }}
        >
          {running ? 'Running…' : '▶ Test Current Period Now'}
        </button>
        <button onClick={loadPreview} disabled={loadingPreview || !slot} style={styles.btnGhost}>
          {loadingPreview ? 'Refreshing…' : '↻ Refresh Preview'}
        </button>
        {!slot && (
          <span style={{ fontSize: 12, color: theme.textMuted }}>
            This is what the cron would do too — nothing fires outside a scheduled period.
          </span>
        )}
      </div>
      

      {/* ── Progress ─────────────────────────────────────────────────── */}
      {rooms.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <SectionHead
            title={`Room Status (${rooms.length})`}
            sub={`${doneCount}/${rooms.length} rooms done`}
          />
        </div>
      )}

      {/* ── Room grid ────────────────────────────────────────────────── */}
      {!rooms.length ? (
        <div style={{ ...styles.card, padding: 40, textAlign: 'center', color: theme.textMuted, borderStyle: 'dashed' }}>
          {noCameras
            ? 'No rooms to show — add a camera in the Camera Registry first.'
            : 'No class scheduled for this slot/date across any room.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {rooms.map((room) => <RoomCard key={room.room} room={room} />)}
        </div>
      )}

      {/* ── Summary table ────────────────────────────────────────────── */}
      {doneCount > 0 && (
        <div style={{ marginTop: 32 }}>
          <SectionHead title="Run Summary" color={theme.success} />
          <div className="r-table-wrap" style={{ ...styles.card, padding: 0 }}>
            <table className="ams-table">
              <thead>
                <tr>
                  {['Room', 'Batch', 'Subject', 'P', 'A', 'R', 'Att%', 'Status'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.filter((r) => r.status === 'done').map((r) => (
                  <tr key={r.room}>
                    <td style={{ fontFamily: theme.fontMono, fontWeight: 700 }}>{r.room}</td>
                    <td>{r.ctx?.batch || '—'}</td>
                    <td>{r.ctx?.subject || '—'}</td>
                    <td style={{ color: theme.success, fontWeight: 700 }}>{r.summary?.present ?? 0}</td>
                    <td style={{ color: theme.danger, fontWeight: 700 }}>{r.summary?.absent ?? 0}</td>
                    <td style={{ color: theme.warning, fontWeight: 700 }}>{r.summary?.review ?? 0}</td>
                    <td>{r.summary?.attendancePct ?? '—'}%</td>
                    <td><StatusPill status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}