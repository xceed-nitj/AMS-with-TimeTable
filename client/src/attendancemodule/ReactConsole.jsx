// client/src/attendancemodule/ReactConsole.jsx
// Reachable via the "Client" status pill's "View Console" action
// (HealthDashboard.jsx) — same pattern as H100 -> /attendance/gpu.
//
// Fetches from the Vite dev server's own /__console-logs endpoint (added by
// the consoleBufferPlugin in client/vite.config.js). Only works when this
// page itself is being served by `npm run dev` — window.location.origin IS
// the Vite dev server in that case. There's no equivalent in a production
// build, since Vite isn't running then.

import { styles, cssReset } from './config';
import ServiceConsole from './ServiceConsole';

const VITE_LOGS_URL = `${window.location.origin}/__console-logs`;

export default function ReactConsole() {
  return (
    <div style={styles.page}>
      <style>{cssReset}</style>
      <ServiceConsole
        title="React Dev Server Console"
        subtitle="Latest output from the Vite dev server — only available in `npm run dev`"
        logsUrl={VITE_LOGS_URL}
        defaultLoggerLabel="vite"
      />
    </div>
  );
}
