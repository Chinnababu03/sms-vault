// ============================================================
// SMS Vault v2.0 - Logger
// Analytics-free, local-only debug logging.
// Can be disabled in production builds via __DEV__ flag.
// ============================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  debug: 'DEBUG',
  info: ' INFO',
  warn: ' WARN',
  error: 'ERROR',
};

// Minimum level to emit. Promote to 'info' in production.
const MIN_LEVEL: LogLevel = __DEV__ ? 'debug' : 'warn';

// Sensitive key patterns that must never be logged.
const SENSITIVE_KEYS = [
  'password',
  'passcode',
  'pin',
  'token',
  'accesstoken',
  'refreshtoken',
  'key',
  'salt',
  'iv',
  'tag',
  'secret',
  'auth',
  'credential',
];

function isSensitive(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((s) => lower.includes(s));
}

function redact(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (seen.has(value as object)) return '[Circular]';
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((v) => redact(v, seen));
  }

  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (isSensitive(k)) {
      redacted[k] = '[REDACTED]';
    } else {
      redacted[k] = redact(v, seen);
    }
  }
  return redacted;
}

function format(level: LogLevel, tag: string, message: string, data?: unknown): string {
  const ts = new Date().toISOString();
  const dataStr = data !== undefined ? ' ' + JSON.stringify(redact(data)) : '';
  return `${ts} [${LEVEL_LABEL[level]}] [${tag}] ${message}${dataStr}`;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL];
}

export const logger = {
  debug(tag: string, message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      console.debug(format('debug', tag, message, data));
    }
  },

  info(tag: string, message: string, data?: unknown): void {
    if (shouldLog('info')) {
      console.info(format('info', tag, message, data));
    }
  },

  warn(tag: string, message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      console.warn(format('warn', tag, message, data));
    }
  },

  error(tag: string, message: string, data?: unknown): void {
    if (shouldLog('error')) {
      console.error(format('error', tag, message, data));
    }
  },

  // Explicit error capture for caught exceptions
  exception(tag: string, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const data = error instanceof Error ? { stack: error.stack, name: error.name } : { value: error };
    this.error(tag, message, data);
  },
};

// Domain-specific loggers for organization
export const log = {
  backup: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('Backup', message, data),
  encryption: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('Encryption', message, data),
  storage: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('Storage', message, data),
  cloud: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('Cloud', message, data),
  permission: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('Permission', message, data),
  network: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('Network', message, data),
  ui: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('UI', message, data),
  scheduler: (level: LogLevel, message: string, data?: unknown) =>
    logger[level]('Scheduler', message, data),
};

export default logger;
