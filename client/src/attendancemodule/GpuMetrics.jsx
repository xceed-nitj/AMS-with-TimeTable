import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { theme } from './config';

const HISTORY_LIMIT = 28800;
const POLL_MS = 3000;
const HISTORY_KEY = 'ams_gpu_metrics_history_v1';
const METRICS_URLS = [
  '/api/v1/ml/gpu-metrics',
  'http://127.0.0.1:8500/metrics/gpu',
  'http://localhost:8500/metrics/gpu',
];
const LOGS_URL = '/api/v1/ml/logs';
const LOG_LIMIT = 200;
const RANGE_OPTIONS = [
  { id: 'live', label: 'Live' },
  { id: 'custom', label: 'Custom' },
];
const T = theme;

function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatValue(value, suffix = '') {
  const num = asNumber(value);
  return num === null ? '--' : `${num.toFixed(1)}${suffix}`;
}

function formatWhole(value, suffix = '') {
  const num = asNumber(value);
  return num === null ? '--' : `${Math.round(num)}${suffix}`;
}

function formatClock(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateTime(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatAxisDate(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleDateString([], {
    month: 'short',
    day: '2-digit',
  });
}

function formatLogTime(timestamp) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((sample) => sample?.timestamp).slice(-HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function shouldShowConsoleLog(log) {
  const message = String(log?.message || '').toLowerCase();
  return !message.includes('/health') && !message.includes('/status');
}

export default function GpuMetrics() {
  const [samples, setSamples] = useState(readHistory);
  const [error, setError] = useState('');
  const [range, setRange] = useState('live');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [serviceLogs, setServiceLogs] = useState([]);
  const [logsError, setLogsError] = useState('');
  const chartScrollerRef = useRef(null);
  const previousChartCountRef = useRef(0);
  const logsScrollerRef = useRef(null);
  const previousLogsCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      try {
        let data = null;
        let lastError = null;

        for (const url of METRICS_URLS) {
          try {
            const response = await axios.get(url, { timeout: 5000 });
            if (response.data && typeof response.data === 'object') {
              data = response.data;
              break;
            }
            lastError = new Error('GPU metrics endpoint did not return JSON metrics');
          } catch (err) {
            lastError = err;
          }
        }

        if (!data) {
          throw lastError || new Error('GPU metrics unavailable');
        }

        if (cancelled) return;

        if (!data || typeof data !== 'object' || !('utilPercent' in data)) {
          throw new Error('GPU metrics endpoint did not return JSON metrics');
        }

        if (data.available === false) {
          setError(data.error || 'GPU metrics unavailable');
          return;
        }

        setError('');
        setSamples((prev) => {
          const timestamp = Date.now();
          const next = {
            timestamp,
            time: formatClock(timestamp),
            utilPercent: asNumber(data.utilPercent) ?? 0,
            memPercent: asNumber(data.memPercent) ?? 0,
            memUsedMiB: asNumber(data.memUsedMiB),
            memTotalMiB: asNumber(data.memTotalMiB),
            tempC: asNumber(data.tempC),
            powerW: asNumber(data.powerW),
            available: data.available !== false,
          };
          return [...prev, next].slice(-HISTORY_LIMIT);
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'GPU metrics unavailable');
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(samples.slice(-HISTORY_LIMIT)));
  }, [samples]);

  useEffect(() => {
    let cancelled = false;

    async function fetchLogs() {
      try {
        const response = await axios.get(LOGS_URL, {
          timeout: 5000,
          params: { limit: LOG_LIMIT },
        });
        const data = response.data;

        if (!data || !Array.isArray(data.logs)) {
          throw new Error('ML service log endpoint did not return logs');
        }
        if (cancelled) return;

        setLogsError('');
        setServiceLogs(data.logs.slice(-LOG_LIMIT));
      } catch (err) {
        if (!cancelled) {
          const message = err.response?.data?.error
            || err.response?.data?.detail
            || (err.message === 'Network Error'
              ? 'ML logs route unreachable. Restart the Vite dev server and Node backend after the /logs changes.'
              : err.message)
            || 'ML service logs unavailable';
          setLogsError(message);
        }
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const latest = samples[samples.length - 1];
  const chartSamples = useMemo(() => {
    if (range === 'live') return samples;

    const startMs = customStart ? new Date(customStart).getTime() : Number.NEGATIVE_INFINITY;
    const endMs = customEnd ? new Date(customEnd).getTime() : Number.POSITIVE_INFINITY;
    return samples.filter((sample) => sample.timestamp >= startMs && sample.timestamp <= endMs);
  }, [customEnd, customStart, range, samples]);
  const chartWidth = Math.max(980, chartSamples.length * 34);

  const vramText = useMemo(() => {
    if (!latest?.memUsedMiB || !latest?.memTotalMiB) return '--';
    return `${Math.round(latest.memUsedMiB)} / ${Math.round(latest.memTotalMiB)} MiB`;
  }, [latest]);
  const visibleServiceLogs = useMemo(
    () => serviceLogs.filter(shouldShowConsoleLog),
    [serviceLogs]
  );

  useEffect(() => {
    if (range !== 'live' || !chartScrollerRef.current) return;

    const scroller = chartScrollerRef.current;
    const previousCount = previousChartCountRef.current;
    previousChartCountRef.current = chartSamples.length;

    const distanceFromEnd = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft;
    const shouldFollowLive = previousCount === 0 || distanceFromEnd < 120;
    if (!shouldFollowLive) return;

    requestAnimationFrame(() => {
      scroller.scrollTo({
        left: scroller.scrollWidth,
        behavior: 'smooth',
      });
    });
  }, [chartSamples.length, latest?.timestamp, range]);

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
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>GPU Metrics</h1>
        </div>
        <span
          style={{
            ...styles.status,
            color: error ? T.danger : T.success,
            background: error ? '#fef2f2' : '#ecfdf5',
            borderColor: error ? '#fecaca' : '#bbf7d0',
          }}
        >
          {error ? 'Unavailable' : 'Live'}
        </span>
      </header>

      <section style={styles.statsGrid}>
        <MetricCard label="GPU utilization" value={formatValue(latest?.utilPercent, '%')} accent="#0891b2" />
        <MetricCard label="VRAM" value={formatValue(latest?.memPercent, '%')} detail={vramText} accent="#7c3aed" />
        <MetricCard label="Temperature" value={formatValue(latest?.tempC, ' deg C')} accent="#ea580c" />
        <MetricCard label="Power draw" value={formatValue(latest?.powerW, ' W')} accent="#16a34a" />
        <MetricCard label="Memory used" value={formatWhole(latest?.memUsedMiB, ' MiB')} accent="#2563eb" />
        <MetricCard label="Memory total" value={formatWhole(latest?.memTotalMiB, ' MiB')} accent="#475569" />
      </section>

      <section style={styles.controls}>
        <div style={styles.rangeButtons}>
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setRange(option.id)}
              style={{
                ...styles.rangeButton,
                ...(range === option.id ? styles.rangeButtonActive : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div style={styles.customControls}>
            <label style={styles.inputLabel}>
              From
              <input
                type="datetime-local"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                style={styles.input}
              />
            </label>
            <label style={styles.inputLabel}>
              To
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                style={styles.input}
              />
            </label>
          </div>
        )}
      </section>

      <section style={styles.chartPanel}>
        {chartSamples.length ? (
          <>
            <div ref={chartScrollerRef} style={styles.chartScroller}>
              <div style={{ width: chartWidth, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartSamples} margin={{ top: 10, right: 20, left: -12, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="timestamp"
                      height={44}
                      minTickGap={34}
                      tick={<DateTimeTick />}
                    />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: T.textMuted }} />
                    <Tooltip labelFormatter={(_, payload) => formatDateTime(payload?.[0]?.payload?.timestamp)} />
                    <Line
                      type="monotone"
                      dataKey="utilPercent"
                      name="GPU utilization"
                      stroke="#0891b2"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="memPercent"
                      name="VRAM"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={styles.fixedLegend}>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendLine, background: '#0891b2' }} />
                GPU utilization
              </span>
              <span style={styles.legendItem}>
                <span style={{ ...styles.legendLine, background: '#7c3aed' }} />
                VRAM
              </span>
            </div>
          </>
        ) : (
          <div style={styles.empty}>{error || 'No GPU samples in this time window'}</div>
        )}
      </section>

      <section style={styles.consolePanel}>
        <div style={styles.consoleHeader}>
          <div>
            <h2 style={styles.consoleTitle}>ML Service Console</h2>
            <p style={styles.consoleSubtitle}>Latest output from the Python service</p>
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
                <span style={styles.logLogger}>{log.logger || 'ml_service'}</span>
                <span style={styles.logMessage}>{log.message}</span>
              </div>
            ))
          ) : (
            <div style={styles.consoleEmpty}>No ML service logs yet</div>
          )}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail, accent }) {
  return (
    <div style={{ ...styles.card, borderTopColor: accent }}>
      <div style={{ ...styles.value, color: accent }}>{value}</div>
      <div style={styles.label}>{label}</div>
      {detail && <div style={styles.detail}>{detail}</div>}
    </div>
  );
}

function DateTimeTick({ x, y, payload }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" fill={T.textMuted} fontSize={10} fontFamily={T.fontBody}>
        <tspan x="0" dy="10">{formatAxisDate(payload.value)}</tspan>
        <tspan x="0" dy="13">{formatClock(payload.value)}</tspan>
      </text>
    </g>
  );
}

const styles = {
  page: {
    minHeight: '100%',
    padding: '26px',
    color: T.text,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: 0,
  },
  subtitle: {
    margin: '6px 0 0',
    color: T.textMuted,
    fontSize: 13,
  },
  status: {
    border: '1px solid',
    borderRadius: 7,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    background: '#ffffff',
    border: `1px solid ${T.border}`,
    borderTop: '3px solid',
    borderRadius: 8,
    padding: '16px 14px',
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
  },
  value: {
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.1,
  },
  label: {
    marginTop: 8,
    color: T.textMuted,
    fontSize: 12,
    fontWeight: 600,
  },
  detail: {
    marginTop: 4,
    color: T.textMuted,
    fontSize: 11,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  rangeButtons: {
    display: 'inline-flex',
    gap: 2,
    padding: 4,
    background: '#eef0f8',
    borderRadius: 8,
  },
  rangeButton: {
    minWidth: 58,
    height: 32,
    border: 0,
    borderRadius: 6,
    background: 'transparent',
    color: T.textMuted,
    fontFamily: T.fontBody,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  rangeButtonActive: {
    background: '#ffffff',
    color: T.accent,
    boxShadow: '0 1px 4px rgba(26,31,60,0.12)',
  },
  customControls: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  inputLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: T.textMuted,
    fontSize: 12,
    fontWeight: 700,
  },
  input: {
    height: 32,
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    padding: '0 8px',
    color: T.text,
    fontFamily: T.fontBody,
    fontSize: 12,
  },
  secondaryButton: {
    height: 34,
    border: `1px solid ${T.border}`,
    borderRadius: 7,
    background: '#ffffff',
    color: T.text,
    fontFamily: T.fontBody,
    fontSize: 12,
    fontWeight: 700,
    padding: '0 12px',
    cursor: 'pointer',
  },
  chartPanel: {
    height: 360,
    background: '#ffffff',
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: 14,
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
  },
  chartScroller: {
    width: '100%',
    height: 'calc(100% - 34px)',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollBehavior: 'smooth',
  },
  fixedLegend: {
    height: 34,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    color: T.text,
    fontSize: 13,
    fontWeight: 600,
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    whiteSpace: 'nowrap',
  },
  legendLine: {
    width: 18,
    height: 3,
    borderRadius: 999,
    display: 'inline-block',
  },
  empty: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: T.textMuted,
    fontSize: 14,
  },
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
