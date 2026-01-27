/**
 * Base class for HTTP controllers with common response utilities.
 *
 * Controllers should:
 * - Contain NO business logic
 * - Only handle HTTP request/response transformation
 * - Delegate all work to use cases
 * - Let errors propagate to the global error handler for proper logging and sanitization
 *
 * @example
 * ```ts
 * class UserController extends BaseController {
 *   constructor(private getUser: GetUserUseCase) {
 *     super();
 *   }
 *
 *   async handleGetUser(userId: string): Promise<Response> {
 *     // No try-catch - let errors propagate to global error handler
 *     const user = await this.getUser.execute({ userId });
 *     if (!user) {
 *       return this.notFound('User not found');
 *     }
 *     return this.ok({ user });
 *   }
 * }
 * ```
 */
export abstract class BaseController {
  /**
   * Create a successful response (200 OK)
   */
  protected ok<T extends object>(data: T): Response {
    return this.json({ success: true, ...data }, 200);
  }

  /**
   * Create a created response (201 Created)
   */
  protected created<T extends object>(data: T): Response {
    return this.json({ success: true, ...data }, 201);
  }

  /**
   * Create a no content response (204 No Content)
   */
  protected noContent(): Response {
    return new Response(null, { status: 204 });
  }

  /**
   * Create a bad request response (400 Bad Request)
   */
  protected badRequest(message: string = 'Bad request'): Response {
    return this.json({ success: false, error: message }, 400);
  }

  /**
   * Create an unauthorized response (401 Unauthorized)
   */
  protected unauthorized(message: string = 'Unauthorized'): Response {
    return this.json({ success: false, error: message }, 401);
  }

  /**
   * Create a forbidden response (403 Forbidden)
   */
  protected forbidden(message: string = 'Forbidden'): Response {
    return this.json({ success: false, error: message }, 403);
  }

  /**
   * Create a not found response (404 Not Found)
   */
  protected notFound(message: string = 'Resource not found'): Response {
    return this.json({ success: false, error: message }, 404);
  }

  /**
   * Create a conflict response (409 Conflict)
   */
  protected conflict(message: string = 'Conflict'): Response {
    return this.json({ success: false, error: message }, 409);
  }

  /**
   * Create a validation error response (422 Unprocessable Entity)
   */
  protected validationError(errors: Record<string, string[]>): Response {
    return this.json({ success: false, error: 'Validation failed', errors }, 422);
  }

  /**
   * Create an internal server error response (500 Internal Server Error)
   *
   * Foundation is pure and transparent - it passes error details through.
   * The app layer (via capabilities like error-handling middleware) is
   * responsible for sanitization before sending to HTTP clients.
   *
   * Prefer letting errors propagate to the global error handler which
   * will properly log and sanitize them.
   */
  protected error(error: unknown, status: number = 500): Response {
    const message = error instanceof Error ? error.message : String(error);
    return this.json(
      { success: false, error: message },
      status
    );
  }

  /**
   * Create a JSON response with the given data and status
   */
  protected json<T>(data: T, status: number): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
