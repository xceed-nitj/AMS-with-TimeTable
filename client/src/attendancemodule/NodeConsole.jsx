// client/src/attendancemodule/NodeConsole.jsx
// Reachable via the "Server" status pill's "View Console" action
// (HealthDashboard.jsx) — same pattern as H100 -> /attendance/gpu.

import getEnvironment from '../getenvironment';
import { styles, cssReset } from './config';
import ServiceConsole from './ServiceConsole';

const apiUrl = getEnvironment();
const NODE_LOGS_URL = `${apiUrl}/api/v1/attendancemodule/health/node-logs`;

export default function NodeConsole() {
  return (
    <div style={styles.page}>
      <style>{cssReset}</style>
      <ServiceConsole
        title="Node.js Server Console"
        subtitle="Latest output from the Express backend process"
        logsUrl={NODE_LOGS_URL}
        defaultLoggerLabel="node"
      />
    </div>
  );
}
