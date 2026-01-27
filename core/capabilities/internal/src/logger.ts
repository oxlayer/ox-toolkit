/**
 * Structured logger utility with log level filtering and sensitive data sanitization
 *
 * Features:
 * - LOG_LEVEL filtering (DEBUG, INFO, WARN, ERROR)
 * - Sensitive data sanitization for production
 * - Development-friendly pretty printing vs JSON in production
 * - Context propagation for tracing
 *
 * Environment variables:
 * - LOG_LEVEL: Minimum log level (default: INFO)
 * - NODE_ENV: development | production (affects output format)
 * - LOG_PRETTY: true | false (force pretty printing, default: true in development)
 * - LOG_SANITIZE: true | false (enable sensitive data sanitization, default: true in production)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 99,
}

export type LogLevelName = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT';

/**
 * Convert log level name to number for comparison
 */
function parseLogLevel(level: string | undefined): LogLevel {
  const levelMap: Record<string, LogLevel> = {
    DEBUG: LogLevel.DEBUG,
    INFO: LogLevel.INFO,
    WARN: LogLevel.WARN,
    ERROR: LogLevel.ERROR,
    SILENT: LogLevel.SILENT,
  };
  return levelMap[(level || 'INFO').toUpperCase()] ?? LogLevel.INFO;
}

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev';
}

/**
 * Check if pretty printing is enabled
 */
function isPretty(): boolean {
  const env = process.env.LOG_PRETTY;
  if (env !== undefined) return env === 'true';
  return isDevelopment();
}

/**
 * Check if sanitization is enabled
 */
function shouldSanitize(): boolean {
  const env = process.env.LOG_SANITIZE;
  if (env !== undefined) return env === 'true';
  return !isDevelopment();
}

/**
 * Fields that should be sanitized in production logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'session',
  'creditCard',
  'ssn',
  'socialSecurity',
];

/**
 * Sanitize sensitive data from log objects
 */
function sanitizeData(data: unknown, depth = 0): unknown {
  if (depth > 10) return '[Max depth reached]';

  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
    };
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some((field) => lowerKey.includes(field));
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value, depth + 1);
      }
    }
    return sanitized;
  }

  return String(data);
}

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  error?: {
    name: string;
    message: string;
  };
  [key: string]: any;
}

export class Logger {
  protected context: string;
  private minLevel: LogLevel;
  private pretty: boolean;
  private sanitize: boolean;

  constructor(context = 'app') {
    this.context = context;
    this.minLevel = parseLogLevel(process.env.LOG_LEVEL);
    this.pretty = isPretty();
    this.sanitize = shouldSanitize();
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  /**
   * Get log level name for display
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'DEBUG';
      case LogLevel.INFO:
        return 'INFO';
      case LogLevel.WARN:
        return 'WARN';
      case LogLevel.ERROR:
        return 'ERROR';
      default:
        return 'UNKNOWN';
    }
  }

  /**
   * Get ANSI color code for log level (development only)
   */
  private getLevelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      [LogLevel.DEBUG]: '\x1b[36m', // cyan
      [LogLevel.INFO]: '\x1b[32m',  // green
      [LogLevel.WARN]: '\x1b[33m',  // yellow
      [LogLevel.ERROR]: '\x1b[31m', // red
      [LogLevel.SILENT]: '\x1b[0m', // reset (shouldn't be logged)
    };
    return colors[level] ?? '\x1b[0m';
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(level: LogLevel, message: string, meta?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: this.getLevelName(level),
      context: this.context,
      message,
      ...meta,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
      };
    }

    return entry;
  }

  /**
   * Output log to console
   */
  private log(level: LogLevel, message: string, meta?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.formatLogEntry(level, message, meta, error);
    const data = this.sanitize ? sanitizeData(entry) : entry;

    if (this.pretty) {
      this.logPretty(level, data as LogEntry);
    } else {
      this.logJson(level, data as LogEntry);
    }
  }

  /**
   * Pretty print for development (easy to read)
   */
  private logPretty(level: LogLevel, entry: LogEntry): void {
    const reset = '\x1b[0m';
    const color = this.getLevelColor(level);
    const levelStr = `${color}[${entry.level}]${reset}`;
    const contextStr = `\x1b[90m${entry.context}\x1b[0m`;
    const timeStr = `\x1b[90m${entry.timestamp}\x1b[0m`;

    // Build the prefix
    const prefix = `${timeStr} ${levelStr} ${contextStr}`;

    // Handle error logging
    if (entry.error) {
      console.error(`${prefix} ${entry.message}`);
      console.error(`  \x1b[31mError: ${entry.error.name}: ${entry.error.message}\x1b[0m`);
    } else {
      console.log(`${prefix} ${entry.message}`);
    }

    // Log additional metadata (excluding standard fields)
    const standardFields = ['timestamp', 'level', 'context', 'message', 'error'];
    const hasExtra = Object.keys(entry).some((key) => !standardFields.includes(key));

    if (hasExtra) {
      const extra: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(entry)) {
        if (!standardFields.includes(key)) {
          extra[key] = value;
        }
      }
      if (Object.keys(extra).length > 0) {
        console.log('  \x1b[90mMetadata:\x1b[0m', JSON.stringify(extra, null, 2).split('\n').map((line) => `    ${line}`).join('\n'));
      }
    }
  }

  /**
   * JSON output for production (structured logs)
   */
  private logJson(level: LogLevel, entry: LogEntry): void {
    const jsonStr = JSON.stringify(entry);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(jsonStr);
        break;
      case LogLevel.WARN:
        console.warn(jsonStr);
        break;
      case LogLevel.ERROR:
        console.error(jsonStr);
        break;
    }
  }

  debug(message: string, meta?: LogContext): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: LogContext): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: LogContext): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, meta, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(childContext: string): Logger {
    const logger = new Logger(`${this.context}:${childContext}`);
    logger.minLevel = this.minLevel;
    logger.pretty = this.pretty;
    logger.sanitize = this.sanitize;
    return logger;
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();
