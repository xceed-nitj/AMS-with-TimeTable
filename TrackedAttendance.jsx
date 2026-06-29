// at client/src/attendancemodule/AMSDashboard.jsx                  add following line

// import TrackedAttendance from "./TrackedAttendance";
// const [trackedCam, setTrackedCam] = useState("");

// line no 792 add this b/w 793

        // {/* ── Tracked Attendance ── */}
        // <div style={{ marginTop: 28 }}>
        //   <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 10 }}>
        //     Tracked Attendance
        //   </div>

        //   {/* Camera selector */}
        //   <select
        //     value={trackedCam}
        //     onChange={e => setTrackedCam(e.target.value)}
        //     style={{
        //       marginBottom: 12, padding: '6px 10px', borderRadius: 8,
        //       border: `1px solid ${T.border}`, fontFamily: T.fontBody,
        //       fontSize: 13, color: T.text, background: T.surface,
        //       cursor: 'pointer', minWidth: 220,
        //     }}
        //   >
        //     <option value="">— Select camera —</option>
        //     {cameras.map(c => (
        //       <option key={c._id} value={c.rtspUrl}>{c.name || c.rtspUrl}</option>
        //     ))}
        //   </select>

        //   <TrackedAttendance
        //     rtspUrl={trackedCam}
        //     enrolledRollNos={[]}
        //   />
        // </div>










// client/vite.config.js

// '/ml': {
//         target: 'http://localhost:8010',
//         changeOrigin: true,
//       },




// client/src/attendancemodule/TrackedAttendance.jsx                 where it should be acc to me











// TrackedAttendance.jsx
//
// NEW FILE — minimal frontend page for the new tracked-attendance flow.
// Talks only to the new Node route (trackedAttendanceRoutes.js) and the
// already-existing /attendance-frame-preview MJPEG route — no existing
// component or route is touched.

import { useState, useRef, useCallback } from "react";

export default function TrackedAttendance({ rtspUrl, enrolledRollNos = [] }) {
  const [running, setRunning]   = useState(false);
  const [jobId, setJobId]       = useState(null);
  const [marked, setMarked]     = useState([]); // [{roll, score, time, in_roster}]
  const [stageMsg, setStageMsg] = useState("");
  const [error, setError]       = useState("");
  const esRef = useRef(null);

  const start = useCallback(async () => {
    setError("");
    setMarked([]);
    setRunning(true);

    try {
      const resp = await fetch("/ml/run-attendance-rtsp-tracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rtspUrl,
          frameSkip: 5,
          recogThreshold: 0.35,
          enrolledRollNos,
        }),
      });

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop(); // keep any partial trailing event

        for (const part of parts) {
          const line = part.replace(/^data:\s*/, "");
          if (!line.trim()) continue;
          let evt;
          try {
            evt = JSON.parse(line);
          } catch {
            continue;
          }

          if (evt.type === "job_id") setJobId(evt.jobId);
          if (evt.type === "stage") setStageMsg(evt.message);
          if (evt.type === "marked") {
            setMarked((prev) => [...prev, evt]);
          }
          if (evt.type === "error") setError(evt.message);
          if (evt.type === "done") setRunning(false);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }, [rtspUrl, enrolledRollNos]);

  const stop = useCallback(async () => {
    if (!jobId) return;
    await fetch("/ml/stop-tracked-attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    setRunning(false);
  }, [jobId]);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={start}
          disabled={running}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
            background: running ? '#aaa' : '#10b981', color: '#fff', fontWeight: 600, opacity: running ? 0.5 : 1,
          }}
        >
          Start Tracked Attendance
        </button>
        <button
          onClick={stop}
          disabled={!running}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: !running ? 'not-allowed' : 'pointer',
            background: !running ? '#aaa' : '#ef4444', color: '#fff', fontWeight: 600, opacity: !running ? 0.5 : 1,
          }}
        >
          Stop
        </button>
      </div>

      {stageMsg && <p style={{ fontSize: 13, color: '#7b84ab' }}>{stageMsg}</p>}
      {error && <p style={{ fontSize: 13, color: '#ef4444' }}>{error}</p>}

      {jobId && (
        <img
          src={`/api/attendancemodule/attendance-frame-preview?jobId=${jobId}`}
          alt="Live tracked preview"
          style={{ width: '100%', maxWidth: 768, borderRadius: 8, border: '1px solid #e4e8f5' }}
        />
      )}

      <div>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Marked ({marked.length})</h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, listStyle: 'none', padding: 0 }}>
          {marked.map((m, i) => (
            <li key={i} style={{ fontSize: 13 }}>
              <span style={{ fontFamily: 'monospace' }}>{m.roll}</span>
              {" — score "}
              {m.score}
              {" — "}
              {m.time}
              {!m.in_roster && (
                <span style={{ marginLeft: 8, color: '#f59e0b' }}>(not on roster)</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
