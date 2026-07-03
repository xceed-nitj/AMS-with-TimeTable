// client/src/attendancemodule/ServiceConsole.jsx
// Scrollable console/log panel — extracted from GpuMetrics.jsx so the same
// polling/auto-scroll/rendering logic can back multiple "view console" pages
// (ML service, Node.js server, React/Vite dev server) without duplication.

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { theme } from './config';

const T = theme;

function formatLogTime(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function shouldShowConsoleLog(log) {
  const message = String(log?.message || '').toLowerCase();
  return !message.includes('/health') && !message.includes('/status');
}

export default function ServiceConsole({
  title,
  subtitle,
  logsUrl,
  pollMs = 3000,
  limit = 200,
  defaultLoggerLabel = '',
}) {
  const [serviceLogs, setServiceLogs] = useState([]);
  const [logsError, setLogsError] = useState('');
  const logsScrollerRef = useRef(null);
  const previousLogsCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      try {
        const response = await axios.get(logsUrl, {
          timeout: 5000,
          params: { limit },
        });
        const data = response.data;

        if (!data || !Array.isArray(data.logs)) {
          throw new Error('Log endpoint did not return logs');
        }
        if (cancelled) return;

        setLogsError('');
        setServiceLogs(data.logs.slice(-limit));
      } catch (err) {
        if (!cancelled) {
          const message = err.response?.data?.error
            || err.response?.data?.detail
            || err.message
            || 'Logs unavailable';
          setLogsError(message);
        }
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [logsUrl, limit, pollMs]);

  const visibleServiceLogs = useMemo(
    () => serviceLogs.filter(shouldShowConsoleLog),
    [serviceLogs],
  );

  useEffect(() => {
    if (!logsScrollerRef.current) return;

    const scroller = logsScrollerRef.current;
    const previousCount = previousLogsCountRef.current;
    previousLogsCountRef.current = visibleServiceLogs.length;

    const distanceFromEnd = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
    const shouldFollowLogs = previousCount === 0 || distanceFromEnd < 80;
    if (!shouldFollowLogs) return;

    requestAnimationFrame(() => {
      scroller.scrollTo({
        top: scroller.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, [visibleServiceLogs.length]);

  return (
    <section style={styles.consolePanel}>
      <div style={styles.consoleHeader}>
        <div>
          <h2 style={styles.consoleTitle}>{title}</h2>
          {subtitle && <p style={styles.consoleSubtitle}>{subtitle}</p>}
        </div>
        <span
          style={{
            ...styles.consoleStatus,
            color: logsError ? T.danger : T.success,
            borderColor: logsError ? '#fecaca' : '#bbf7d0',
            background: logsError ? '#fef2f2' : '#ecfdf5',
          }}
        >
          {logsError ? 'Unavailable' : `${visibleServiceLogs.length} lines`}
        </span>
      </div>
      <div ref={logsScrollerRef} style={styles.consoleBody}>
        {logsError ? (
          <div style={styles.consoleEmpty}>{logsError}</div>
        ) : visibleServiceLogs.length ? (
          visibleServiceLogs.map((log, index) => (
            <div key={`${log.timestamp}-${index}`} style={styles.logLine}>
              <span style={styles.logTime}>{formatLogTime(log.timestamp)}</span>
              <span style={styles.logLevel}>{log.level || 'INFO'}</span>
              <span style={styles.logLogger}>{log.logger || defaultLoggerLabel}</span>
              <span style={styles.logMessage}>{log.message}</span>
            </div>
          ))
        ) : (
          <div style={styles.consoleEmpty}>No logs yet</div>
        )}
      </div>
    </section>
  );
}

const styles = {
  consolePanel: {
    marginTop: 16,
    background: '#ffffff',
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 14,
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
  },
  consoleHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  consoleTitle: {
    margin: 0,
    color: T.text,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: 0,
  },
  consoleSubtitle: {
    margin: '3px 0 0',
    color: T.textMuted,
    fontSize: 12,
  },
  consoleStatus: {
    border: '1px solid',
    borderRadius: 7,
    padding: '5px 9px',
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  consoleBody: {
    height: 260,
    overflow: 'auto',
    borderRadius: 7,
    background: '#0f172a',
    color: '#dbeafe',
    padding: 12,
    fontFamily: T.fontMono,
    fontSize: 12,
    lineHeight: 1.55,
    scrollBehavior: 'smooth',
  },
  consoleEmpty: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
  },
  logLine: {
    display: 'grid',
    gridTemplateColumns: '78px 60px 170px minmax(0, 1fr)',
    gap: 8,
    alignItems: 'baseline',
    padding: '2px 0',
  },
  logTime: {
    color: '#93c5fd',
    whiteSpace: 'nowrap',
  },
  logLevel: {
    color: '#facc15',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  logLogger: {
    color: '#a5b4fc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logMessage: {
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};
