/**
 * Logging Configuration
 */

import { Logger } from '@oxlayer/capabilities-internal';
import { ENV } from './app.config.js';

/**
 * Create app logger
 */
export function createAppLogger(context: string) {
  return new Logger(context);
}

/**
 * Create Alo Manager logger
 */
export function createAloLogger(context: string): QuickwitLogger {
  return new QuickwitLogger(context);
}

/**
 * HTTP Request logger
 */
export interface HttpRequestLog {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  traceId?: string;
  spanId?: string;
}

/**
 * Log HTTP request (async, doesn't block response)
 */
export async function logHttpRequest(data: HttpRequestLog) {
  const logger = createAppLogger('HTTP');
  logger.info('HTTP Request', {
    method: data.method,
    path: data.path,
    status: data.statusCode,
    duration: `${data.duration}ms`,
    userId: data.userId,
    traceId: data.traceId,
    spanId: data.spanId,
  });
}

/**
 * Create Quickwit logger for structured logging
 */
export class QuickwitLogger {
  private logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context, {
      level: ENV.LOG_LEVEL as any,
      format: 'json',
    });
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }

  error(message: string, error?: Error) {
    this.logger.error(message, { error: error?.message, stack: error?.stack });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }

  async initializeQuickwit() {
    // Quickwit initialization would go here
    // For now, we'll just log that we're ready
    this.info('Quickwit logger initialized');
  }

  async close() {
    this.info('Closing Quickwit logger');
  }
}

/**
 * Set global Quickwit logger
 */
let appLogger: QuickwitLogger | null = null;

export function setQuickwitLogger(logger: QuickwitLogger) {
  appLogger = logger;
}

export function getAppLogger(): QuickwitLogger {
  if (!appLogger) {
    appLogger = new QuickwitLogger('AloManager');
  }
  return appLogger;
}
