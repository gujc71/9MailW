// ── Logging middleware ──
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

function pad(n) { return String(n).padStart(2, '0'); }

function timestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,'0')}`;
}

function getLogFileName() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.log`;
}

function writeLog(line) {
  const file = path.join(logDir, getLogFileName());
  fs.appendFileSync(file, line + '\n', 'utf8');
}

/**
 * Express middleware – logs every request & response in detail.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  const ts = timestamp();
  const id = Math.random().toString(36).slice(2, 10);

  // Capture request body (for POST/PUT)
  const bodySnippet = req.body && Object.keys(req.body).length
    ? JSON.stringify(req.body).slice(0, 500)
    : '-';

  const userEmail = req.user ? req.user.email : 'anonymous';

  // Log request
  writeLog(`[${ts}] REQ  ${id} | ${req.method} ${req.originalUrl} | user=${userEmail} | ip=${req.ip} | body=${bodySnippet}`);

  // Intercept response finish
  const origEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    const rts = timestamp();
    writeLog(`[${rts}] RES  ${id} | ${req.method} ${req.originalUrl} | status=${res.statusCode} | ${duration}ms | user=${userEmail}`);
    origEnd.apply(res, args);
  };

  next();
}

/** Utility – log arbitrary events */
function logEvent(level, message, meta = {}) {
  const ts = timestamp();
  const metaStr = Object.keys(meta).length ? ' | ' + JSON.stringify(meta) : '';
  writeLog(`[${ts}] ${level.toUpperCase().padEnd(5)} ${message}${metaStr}`);
}

module.exports = { requestLogger, logEvent };
