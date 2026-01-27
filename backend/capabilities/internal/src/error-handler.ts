/**
 * Error Handler
 *
 * Pure error handling utilities without framework dependencies.
 * Provides logging, sanitization, and response formatting.
 *
 * This can be adapted to any HTTP framework (Hono, Express, Fastify, etc.)
 */

import { Logger, LogLevel } from './logger.js';
import { AppError } from './errors.js';

export interface ErrorHandlerOptions {
  /**
   * Logger instance
   * If not provided, creates a default one
   */
  logger?: Logger;

  /**
   * Log level threshold (logs at or above this level will be output)
   * @default 'INFO'
   */
  logLevel?: LogLevel;

  /**
   * Node environment
   * - 'development': Shows detailed error messages to clients
   * - 'production': Shows generic error messages, logs details
   * @default 'production'
   */
  nodeEnv?: 'development' | 'production' | 'test';

  /**
   * Whether to include stack traces in logs
   * @default true in development, false in production
   */
  includeStackInLogs?: boolean;
}

/**
 * Default logger instance
 */
function createDefaultLogger(): Logger {
  return new Logger('error-handler');
}

/**
 * Get log level threshold
 */
function getLogLevelThreshold(options: ErrorHandlerOptions): LogLevel {
  return options.logLevel ?? LogLevel.INFO;
}

/**
 * Check if a log level should be output
 */
function shouldLog(messageLevel: LogLevel, threshold: LogLevel): boolean {
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const messageIndex = levels.indexOf(messageLevel);
  const thresholdIndex = levels.indexOf(threshold);
  return messageIndex >= thresholdIndex;
}

/**
 * Check if we're in development mode
 */
function isDevelopment(options: ErrorHandlerOptions): boolean {
  return options.nodeEnv === 'development';
}

/**
 * Sanitized error details for logging
 */
export interface SanitizedError {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

/**
 * Sanitize error details for logging
 */
export function sanitizeError(
  error: Error | unknown,
  options: ErrorHandlerOptions
): SanitizedError {
  const err = error instanceof Error ? error : new Error(String(error));

  const sanitized: SanitizedError = {
    name: err.name,
    message: err.message,
  };

  // Include stack trace if configured
  const includeStack = options.includeStackInLogs ?? isDevelopment(options);
  if (includeStack && err.stack) {
    sanitized.stack = err.stack;
  }

  // Include code for AppError
  if (err instanceof AppError && err.code) {
    sanitized.code = err.code;
  }

  return sanitized;
}

/**
 * Get user-friendly error message (safe to send to clients)
 *
 * Always returns generic messages - actual errors are logged only.
 */
export function getUserMessage(
  error: Error | unknown,
  options: ErrorHandlerOptions
): string {
  // Always use generic messages - never leak error details to clients
  // Logs contain the full error details
  return 'An unexpected error occurred';
}

/**
 * Get HTTP status code from error
 */
export function getStatusCode(error: Error | unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  // Default to 500 for unhandled errors
  return 500;
}

/**
 * Determine log level from error
 */
export function getLogLevel(error: Error | unknown): LogLevel {
  if (error instanceof AppError) {
    // Client errors (4xx) are WARN, server errors (5xx) are ERROR
    return error.statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN;
  }

  return LogLevel.ERROR;
}

/**
 * Error response body type
 */
export interface ErrorResponseBody {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Handle an error: log it and return formatted response data
 *
 * This is the core error handling logic - framework agnostic.
 * Can be wrapped in Hono middleware, Express middleware, etc.
 *
 * @example
 * ```ts
 * import { handleError } from '@oxlayer/capabilities-internal';
 *
 * // Hono example
 * app.onError((err, c) => {
 *   const result = handleError(err, { logger, nodeEnv: 'production' }, c.get('requestId'));
 *   return c.json(result.body, result.status);
 * });
 *
 * // Express example
 * app.use((err, req, res, next) => {
 *   const result = handleError(err, { logger, nodeEnv: 'production' }, req.id);
 *   res.status(result.status).json(result.body);
 * });
 * ```
 */
export function handleError(
  error: Error | unknown,
  options: ErrorHandlerOptions,
  requestId?: string
): {
  status: number;
  body: ErrorResponseBody;
} {
  const logger = options.logger ?? createDefaultLogger();
  const threshold = getLogLevelThreshold(options);

  // Log the error
  const sanitized = sanitizeError(error, options);
  const level = getLogLevel(error);

  if (shouldLog(level, threshold)) {
    const message = getUserMessage(error, options);
    switch (level) {
      case LogLevel.DEBUG:
        logger.debug(message, { ...sanitized, requestId });
        break;
      case LogLevel.INFO:
        logger.info(message, { ...sanitized, requestId });
        break;
      case LogLevel.WARN:
        logger.warn(message, { ...sanitized, requestId });
        break;
      case LogLevel.ERROR:
        logger.error(message, { ...sanitized, requestId });
        break;
    }
  }

  const status = getStatusCode(error);
  const userMessage = getUserMessage(error, options);

  const body: ErrorResponseBody = {
    error: userMessage,
    requestId,
  };

  // Add error code for AppError (safe to expose)
  if (error instanceof AppError && error.code) {
    body.code = error.code;
  }

  return { status, body };
}

/**
 * Create an error handler with preset options
 *
 * @example
 * ```ts
 * import { createErrorHandler } from '@oxlayer/capabilities-internal';
 *
 * const handler = createErrorHandler({
 *   logger: myLogger,
 *   nodeEnv: process.env.NODE_ENV,
 *   logLevel: process.env.LOG_LEVEL,
 * });
 *
 * // Use it
 * const result = handler(error, requestId);
 * ```
 */
export function createErrorHandler(options: ErrorHandlerOptions = {}) {
  return (error: Error | unknown, requestId?: string) => {
    return handleError(error, options, requestId);
  };
}
