import {
  DomainError,
  EntityNotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  BusinessRuleViolationError,
} from '@oxlayer/foundation-domain-kit';

/**
 * HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/**
 * HTTP-specific error with status code
 */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: HttpStatusCode,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Map domain errors to HTTP status codes
 */
export function mapDomainErrorToHttpStatus(error: DomainError): HttpStatusCode {
  if (error instanceof EntityNotFoundError) {
    return HttpStatus.NOT_FOUND;
  }
  if (error instanceof ValidationError) {
    return HttpStatus.UNPROCESSABLE_ENTITY;
  }
  if (error instanceof ConflictError) {
    return HttpStatus.CONFLICT;
  }
  if (error instanceof UnauthorizedError) {
    return HttpStatus.UNAUTHORIZED;
  }
  if (error instanceof BusinessRuleViolationError) {
    return HttpStatus.BAD_REQUEST;
  }

  // Default for unknown domain errors
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

/**
 * Create an HTTP error response from a domain error
 */
export function domainErrorToResponse(error: DomainError): Response {
  const statusCode = mapDomainErrorToHttpStatus(error);
  return new Response(
    JSON.stringify({
      success: false,
      error: error.message,
      code: error.code,
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create an HTTP error response from any error
 */
export function errorToResponse(error: unknown): Response {
  if (error instanceof DomainError) {
    return domainErrorToResponse(error);
  }

  if (error instanceof HttpError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
    }),
    {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
