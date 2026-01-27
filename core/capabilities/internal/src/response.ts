/**
 * Standard success response wrapper
 */
export interface SuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  statusCode?: number;
}

/**
 * Standard error response wrapper
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  statusCode: number;
  details?: any;
}

/**
 * Create a success response
 */
export function successResponse<T>(data?: T, message?: string, statusCode: number = 200): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    statusCode,
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  statusCode: number,
  message: string,
  error?: string,
  code?: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: error || getErrorTypeFromStatus(statusCode),
    message,
    code,
    statusCode,
    details,
  };
}

/**
 * Get error type from HTTP status code
 */
function getErrorTypeFromStatus(statusCode: number): string {
  const errorTypes: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
  };
  return errorTypes[statusCode] || 'Error';
}

/**
 * HTTP response status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
