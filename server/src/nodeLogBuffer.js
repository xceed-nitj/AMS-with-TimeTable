// server/src/nodeLogBuffer.js
// In-memory ring buffer capturing this Node process's own console output, so
// it can be viewed as a browser console the same way the Python ML service's
// /logs endpoint exposes its own log buffer (see python-ml-service/ml_service.py:
// LOG_BUFFER deque + _MemoryLogHandler + _TeeStream). Must be required before
// anything else logs, so require this first in index.js.

const MAX_LINES = 500;
const BUFFER = [];

function push(level, args) {
  const message = args
    .map((a) => (typeof a === "string" ? a : safeStringify(a)))
    .join(" ");
  BUFFER.push({
    timestamp: new Date().toISOString(),
    level,
    logger: "node",
    message,
  });
  if (BUFFER.length > MAX_LINES) BUFFER.shift();
}

function safeStringify(value) {
  if (value instanceof Error) return value.stack || value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const original = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};

console.log = (...args) => { push("INFO", args); original.log(...args); };
console.info = (...args) => { push("INFO", args); original.info(...args); };
console.warn = (...args) => { push("WARN", args); original.warn(...args); };
console.error = (...args) => { push("ERROR", args); original.error(...args); };
console.debug = (...args) => { push("DEBUG", args); original.debug(...args); };

function getLogs(limit = 200) {
  const n = Number.isFinite(limit) && limit > 0 ? limit : 200;
  return { logs: BUFFER.slice(-n), total: BUFFER.length };
}

module.exports = { getLogs };
