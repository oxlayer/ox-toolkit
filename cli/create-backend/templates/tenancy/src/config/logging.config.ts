/**
 * Logging Configuration
 */

import { Logger } from '@oxlayer/capabilities-internal';

/**
 * Create app logger
 */
export function createAppLogger(context: string) {
  return new Logger(context);
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
