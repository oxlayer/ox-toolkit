/**
 * Hono Error Handler Middleware
 *
 * Hono-specific error handling middleware that integrates with
 * the pure error handler from @oxlayer/capabilities-internal.
 *
 * @example
 * ```ts
 * import { errorHandlingMiddleware } from '@oxlayer/capabilities-openapi';
 * import { Logger, LogLevel } from '@oxlayer/capabilities-internal';
 *
 * const logger = new Logger('api');
 *
 * app.onError(errorHandlingMiddleware({
 *   logger,
 *   logLevel: LogLevel.INFO,
 *   nodeEnv: 'production',
 * }));
 * ```
 */

import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import {
  handleError,
  type ErrorHandlerOptions,
  type ErrorResponseBody,
} from '@oxlayer/capabilities-internal';

/**
 * Extended error handling options for Hono
 */
export interface HonoErrorHandlerOptions extends ErrorHandlerOptions {
  /**
   * Whether to include Zod validation errors in response
   * @default true
   */
  includeValidationErrors?: boolean;
}

/**
 * Enhanced error response for Hono (includes Zod validation details)
 */
export interface HonoErrorResponse extends ErrorResponseBody {
  validationErrors?: unknown;
}

/**
 * Handle error with Hono-specific handling (Zod, HTTPException)
 */
function handleHonoError(
  error: Error | unknown,
  options: HonoErrorHandlerOptions,
  requestId?: string
):
  | {
      status: number;
      body: HonoErrorResponse;
    }
  | null {
  // Handle ZodError separately to include validation details
  if (error instanceof ZodError) {
    const isDev = options.nodeEnv === 'development';
    const includeValidation = options.includeValidationErrors ?? true;

    return {
      status: 400,
      body: {
        error:
          isDev && error.errors[0]?.message
            ? error.errors[0].message
            : 'Validation failed',
        code: 'VALIDATION_ERROR',
        validationErrors: includeValidation ? error.errors : undefined,
        requestId,
      },
    };
  }

  // Handle HTTPException
  if (error instanceof HTTPException) {
    return {
      status: error.status,
      body: {
        error: error.message || 'Request failed',
        requestId,
      },
    };
  }

  return null; // Delegate to base handler
}

/**
 * Hono error handling middleware
 *
 * @example
 * ```ts
 * import { errorHandlingMiddleware } from '@oxlayer/capabilities-openapi';
 * import { Logger, LogLevel } from '@oxlayer/capabilities-internal';
 *
 * const logger = new Logger('api');
 *
 * app.onError(errorHandlingMiddleware({
 *   logger,
 *   logLevel: LogLevel.INFO,
 *   nodeEnv: process.env.NODE_ENV as 'development' | 'production',
 * }));
 * ```
 */
export function errorHandlingMiddleware(options: HonoErrorHandlerOptions = {}) {
  return (err: Error, c: Context): Response => {
    const requestId = c.get('requestId');

    // Try Hono-specific handling first
    const honoResult = handleHonoError(err, options, requestId);
    if (honoResult) {
      return new Response(JSON.stringify(honoResult.body), {
        status: honoResult.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fall back to base error handler
    const result = handleError(err, options, requestId);
    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

/**
 * Create error handling middleware with preset options
 *
 * @example
 * ```ts
 * import { createErrorHandler } from '@oxlayer/capabilities-openapi';
 * import { Logger, LogLevel } from '@oxlayer/capabilities-internal';
 *
 * const errorHandler = createErrorHandler({
 *   logger: new Logger('api'),
 *   logLevel: LogLevel.INFO,
 *   nodeEnv: 'production',
 * });
 *
 * app.onError(errorHandler);
 * ```
 */
export function createErrorHandler(options: HonoErrorHandlerOptions) {
  return errorHandlingMiddleware(options);
}

// Re-export types from internal for convenience
export type { ErrorResponseBody, ErrorHandlerOptions };
