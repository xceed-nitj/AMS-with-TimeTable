// client/src/attendancemodule/SchedulerPage.jsx
//
// Manual trigger page for the attendance scheduler. Mirrors what the cron
// job (autoAttendanceScheduler.js) does, but for all enabled rooms at once,
// with live visibility per room. Polls the backend; does not stream SSE
// (see "SSE vs polling" open question in the spec doc).

import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "/attendancemodule";

const STATUS_COLORS = {
  idle: "#9ca3af",
  "would-run": "#60a5fa",
  running: "#22c55e",
  done: "#16a34a",
  skipped: "#eab308",
  error: "#ef4444",
};

function StatusBadge({ status }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: STATUS_COLORS[status] || "#9ca3af",
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}

function RoomCard({ room }) {
  const [expanded, setExpanded] = useState(false);
  const ctx = room.ctx;
  const summary = room.summary;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 14,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{room.room}</strong>
        <StatusBadge status={room.status} />
      </div>

      {ctx && (
        <div style={{ fontSize: 13, color: "#374151" }}>
          <div>Batch: {ctx.batch}</div>
          <div>Subject: {ctx.subject}</div>
          {room.subjectMeta?.subCode && (
            <div>Code: {room.subjectMeta.subCode} ({room.subjectMeta.subName})</div>
          )}
        </div>
      )}

      {room.cameras && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Cam: {room.cameras.hasCam1 || room.cameras.cam1 ? "📷" : "—"}
          {(room.cameras.hasCam2 || room.cameras.cam2) ? "📷" : ""}
        </div>
      )}

      {room.pkl && (
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          PKL: {typeof room.pkl === "string" ? room.pkl : room.pkl.filename} ✓
        </div>
      )}

      {room.reason && (
        <div style={{ fontSize: 12, color: "#b45309" }}>
          {room.status === "error" ? "Error" : "Reason"}: {room.reason}
        </div>
      )}

      {summary && (
        <div style={{ fontSize: 13, fontWeight: 600 }}>
          P:{summary.present} A:{summary.absent} R:{summary.review} · {summary.attendancePct}%
        </div>
      )}

      {room.log && room.log.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              fontSize: 12,
              background: "none",
              border: "none",
              color: "#2563eb",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {expanded ? "▲ Hide log" : "▼ Show log"}
          </button>
          {expanded && (
            <ul style={{ fontSize: 12, color: "#4b5563", marginTop: 6, paddingLeft: 18 }}>
              {room.log.map((entry, i) => (
                <li key={i}>{entry.msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function SchedulerPage() {
  const [config, setConfig] = useState(null);
  const [slot, setSlot] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rooms, setRooms] = useState([]);
  const [running, setRunning] = useState(false);
  const [previewRooms, setPreviewRooms] = useState(null);
  const [error, setError] = useState("");

  // Load AcquisitionControl config for slot dropdown + global status
  useEffect(() => {
    fetch(`${API_BASE}/acquisitioncontrol`)
      .then((r) => r.json())
      .then((data) => {
        setConfig(data);
        const firstEnabled = (data.periods || []).find((p) => p.enabled);
        if (firstEnabled) setSlot(firstEnabled.periodKey);
      })
      .catch((e) => setError(e.message));
  }, []);

  const todayStopped = config?.stoppedDays?.includes(date);
  const acquisitionActive = config?.active && !todayStopped;

  const loadPreview = useCallback(() => {
    if (!slot) return;
    fetch(`${API_BASE}/scheduler/preview?slot=${slot}&date=${date}`)
      .then((r) => r.json())
      .then((data) => setPreviewRooms(data.rooms || []))
      .catch((e) => setError(e.message));
  }, [slot, date]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  async function handleRunAll() {
    setError("");
    setRunning(true);
    setRooms((config?.includedRooms || [])
      .filter((r) => r.enabled !== false)
      .map((r) => ({ room: r.room, status: "running" })));

    try {
      const res = await fetch(`${API_BASE}/scheduler/run-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Run failed");
      setRooms(data.rooms || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  const displayRooms = rooms.length ? rooms : (previewRooms || []);
  const doneCount = displayRooms.filter((r) => r.status === "done").length;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Scheduler — Attendance Run</h2>
        <p style={{ color: "#6b7280", margin: "4px 0" }}>
          Testing interface. Production runs automatically via cron.
        </p>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            color: "#fff",
            background: acquisitionActive ? "#16a34a" : "#ef4444",
          }}
        >
          Acquisition {acquisitionActive ? "ACTIVE" : "STOPPED"}
        </span>
        {todayStopped && (
          <span style={{ marginLeft: 8, fontSize: 12, color: "#b45309" }}>
            Today ({date}) is a stopped day
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <select value={slot} onChange={(e) => setSlot(e.target.value)} style={{ padding: 8 }}>
          {(config?.periods || []).filter((p) => p.enabled).map((p) => (
            <option key={p.periodKey} value={p.periodKey}>
              {p.label || p.periodKey} ({p.startTime}–{p.endTime})
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ padding: 8 }}
        />
        <button
          onClick={handleRunAll}
          disabled={!acquisitionActive || running || !slot}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: !acquisitionActive ? "#d1d5db" : "#2563eb",
            color: "#fff",
            fontWeight: 600,
            cursor: !acquisitionActive || running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Running…" : "Run All Rooms"}
        </button>
        {!acquisitionActive && (
          <span style={{ fontSize: 12, color: "#ef4444" }}>
            Acquisition is off — button disabled
          </span>
        )}
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>
      )}

      {rooms.length > 0 && (
        <div style={{ marginBottom: 16, fontSize: 14, color: "#374151" }}>
          Progress: {doneCount}/{displayRooms.length} rooms done
        </div>
      )}

      {!displayRooms.length && (
        <div style={{ color: "#6b7280" }}>
          No enabled rooms found. Add rooms in Acquisition Control first.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {displayRooms.map((room) => (
          <RoomCard key={room.room} room={room} />
        ))}
      </div>
    </div>
  );
}