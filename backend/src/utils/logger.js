/**
 * Casekaaran — Structured Logger with Sensitive Data Redaction
 */
const sensitiveKeys = ['password', 'secret', 'token', 'authorization', 'signature', 'private_key'];

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (sensitiveKeys.some(s => k.toLowerCase().includes(s))) {
      clean[k] = '***REDACTED***';
    } else if (typeof v === 'object') {
      clean[k] = redact(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

const logger = {
  info: (msg, meta) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta ? redact(meta) : ''),
  warn: (msg, meta) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta ? redact(meta) : ''),
  error: (msg, meta) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta ? redact(meta) : ''),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`, meta ? redact(meta) : '');
    }
  }
};

module.exports = logger;
