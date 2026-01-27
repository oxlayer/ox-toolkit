/**
 * Controller Template
 *
 * A template for creating REST controllers that handle HTTP requests.
 * Controllers delegate business logic to use cases and handle HTTP-specific concerns.
 *
 * @example
 * ```typescript
 * import type { Context } from 'hono';
 *
 * export class TodosController {
 *   constructor(
 *     private createTodoUseCase: CreateTodoUseCase,
 *     private getTodoUseCase: GetTodoUseCase,
 *     private updateTodoUseCase: UpdateTodoUseCase,
 *     private deleteTodoUseCase: DeleteTodoUseCase,
 *     private listTodosUseCase: ListTodosUseCase
 *   ) {}
 *
 *   async create(c: Context) {
 *     const userId = c.get('userId') as string;
 *     const body = await c.req.json();
 *
 *     const result = await this.createTodoUseCase.execute({ ...body, userId });
 *
 *     if (!result.success) {
 *       return c.json({ error: result.error }, 400);
 *     }
 *
 *     return c.json(result.data, 201);
 *   }
 *
 *   async getById(c: Context) {
 *     const id = c.req.param('id') as string;
 *     const userId = c.get('userId') as string;
 *
 *     const result = await this.getTodoUseCase.execute({ id, userId });
 *
 *     if (!result.success) {
 *       return c.json({ error: result.error }, 404);
 *     }
 *
 *     return c.json(result.data);
 *   }
 *
 *   async list(c: Context) {
 *     const userId = c.get('userId') as string;
 *     const filters = c.req.query();
 *
 *     const result = await this.listTodosUseCase.execute({ userId, ...filters });
 *
 *     if (!result.success) {
 *       return c.json({ error: result.error }, 400);
 *     }
 *
 *     return c.json(result.data);
 *   }
 *
 *   async update(c: Context) {
 *     const id = c.req.param('id') as string;
 *     const userId = c.get('userId') as string;
 *     const body = await c.req.json();
 *
 *     const result = await this.updateTodoUseCase.execute({ id, userId, ...body });
 *
 *     if (!result.success) {
 *       return c.json({ error: result.error }, 400);
 *     }
 *
 *     return c.json(result.data);
 *   }
 *
 *   async delete(c: Context) {
 *     const id = c.req.param('id') as string;
 *     const userId = c.get('userId') as string;
 *
 *     const result = await this.deleteTodoUseCase.execute({ id, userId });
 *
 *     if (!result.success) {
 *       return c.json({ error: result.error }, 404);
 *     }
 *
 *     return c.json({ success: true });
 *   }
 * }
 * ```
 */

import type { Context } from 'hono';

/**
 * Base class for REST controllers with common patterns
 *
 * Provides:
 * - Standard response formatting
 * - Error handling
 * - Status code mapping
 * - User context extraction
 */
export abstract class ControllerTemplate {
  /**
   * Extract user ID from context
   * Assumes authentication middleware has set 'userId' in context
   */
  protected getUserId(c: Context): string {
    return c.get('userId') as string;
  }

  /**
   * Extract tenant ID from context
   * Assumes multi-tenant middleware has set 'tenantId' in context
   */
  protected getTenantId(c: Context): string {
    return c.get('tenantId') as string || 'default';
  }

  /**
   * Parse request body as JSON
   */
  protected async getBody<T = unknown>(c: Context): Promise<T> {
    return c.req.json() as Promise<T>;
  }

  /**
   * Get path parameter
   */
  protected getParam(c: Context, name: string): string {
    return c.req.param(name) as string;
  }

  /**
   * Get query parameter
   */
  protected getQuery(c: Context, name: string): string | undefined {
    return c.req.query(name);
  }

  /**
   * Get all query parameters
   */
  protected getAllQuery(c: Context): Record<string, string> {
    return c.req.query();
  }

  /**
   * Create a success response
   */
  protected success<T>(data: T, status: number = 200): Response {
    return Response.json(data, { status });
  }

  /**
   * Create an error response
   */
  protected error(
    message: string,
    status: number = 400,
    code?: string
  ): Response {
    const body: any = { error: message };
    if (code) {
      body.code = code;
    }
    return Response.json(body, { status });
  }

  /**
   * Create a not found response
   */
  protected notFound(message: string = 'Resource not found'): Response {
    return this.error(message, 404, 'NOT_FOUND');
  }

  /**
   * Create a forbidden response
   */
  protected forbidden(message: string = 'Access denied'): Response {
    return this.error(message, 403, 'FORBIDDEN');
  }

  /**
   * Create an unauthorized response
   */
  protected unauthorized(message: string = 'Unauthorized'): Response {
    return this.error(message, 401, 'UNAUTHORIZED');
  }

  /**
   * Create a validation error response
   */
  protected validationError(errors: Record<string, string>[]): Response {
    return Response.json(
      {
        error: 'Validation failed',
        details: errors,
      },
      { status: 400 }
    );
  }

  /**
   * Handle use case result
   * Converts Result<T> type to HTTP response
   */
  protected handleResult<T>(result: { success: boolean; data?: T; error?: { code: string; message: string } }): Response {
    if (result.success && result.data) {
      return this.success(result.data);
    }

    if (result.error) {
      return this.error(result.error.message, this.getErrorCode(result.error.code), result.error.code);
    }

    return this.error('An unknown error occurred', 500);
  }

  /**
   * Map error code to HTTP status code
   */
  protected getErrorCode(code: string): number {
    const statusMap: Record<string, number> = {
      NOT_FOUND: 404,
      FORBIDDEN: 403,
      UNAUTHORIZED: 401,
      VALIDATION_ERROR: 400,
      ALREADY_EXISTS: 409,
      CONFLICT: 409,
      INTERNAL_ERROR: 500,
    };

    return statusMap[code] || 400;
  }
}

/**
 * Template for CRUD controllers
 *
 * Provides standard CRUD endpoints with minimal boilerplate
 */
export abstract class CrudControllerTemplate<
  TCreateInput,
  TUpdateInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TCreateOutput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TGetOutput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TUpdateOutput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TListOutput
> extends ControllerTemplate {
  constructor(
    protected readonly useCases: {
      create: { execute: (input: any) => Promise<any> };
      getById: { execute: (input: any) => Promise<any> };
      update: { execute: (input: any) => Promise<any> };
      delete: { execute: (input: any) => Promise<any> };
      list: { execute: (input: any) => Promise<any> };
    }
  ) {
    super();
  }

  /**
   * POST / - Create a new resource
   */
  async create(c: Context): Promise<Response> {
    try {
      const userId = this.getUserId(c);
      const tenantId = this.getTenantId(c);
      const body = await this.getBody<TCreateInput>(c);

      const result = await this.useCases.create.execute({
        ...body,
        userId,
        tenantId,
      });

      return this.handleResult(result);
    } catch (error) {
      return this.error('Failed to create resource', 500);
    }
  }

  /**
   * GET /:id - Get a resource by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = this.getParam(c, 'id');
      const userId = this.getUserId(c);
      const tenantId = this.getTenantId(c);

      const result = await this.useCases.getById.execute({
        id,
        userId,
        tenantId,
      });

      return this.handleResult(result);
    } catch (error) {
      return this.error('Failed to get resource', 500);
    }
  }

  /**
   * GET / - List resources with optional filters
   */
  async list(c: Context): Promise<Response> {
    try {
      const userId = this.getUserId(c);
      const tenantId = this.getTenantId(c);
      const filters = this.getAllQuery(c);

      const result = await this.useCases.list.execute({
        userId,
        tenantId,
        ...filters,
      });

      return this.handleResult(result);
    } catch (error) {
      return this.error('Failed to list resources', 500);
    }
  }

  /**
   * PATCH /:id - Update a resource
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = this.getParam(c, 'id');
      const userId = this.getUserId(c);
      const tenantId = this.getTenantId(c);
      const body = await this.getBody<TUpdateInput>(c);

      const result = await this.useCases.update.execute({
        id,
        userId,
        tenantId,
        ...body,
      });

      return this.handleResult(result);
    } catch (error) {
      return this.error('Failed to update resource', 500);
    }
  }

  /**
   * DELETE /:id - Delete a resource
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = this.getParam(c, 'id');
      const userId = this.getUserId(c);
      const tenantId = this.getTenantId(c);

      const result = await this.useCases.delete.execute({
        id,
        userId,
        tenantId,
      });

      return this.handleResult(result);
    } catch (error) {
      return this.error('Failed to delete resource', 500);
    }
  }

  /**
   * Register all CRUD routes with a Hono app
   */
  registerRoutes(app: any, path: string = ''): void {
    const basePath = path || this.getResourcePath();

    app.post(`${basePath}`, this.create.bind(this));
    app.get(`${basePath}/:id`, this.getById.bind(this));
    app.get(`${basePath}`, this.list.bind(this));
    app.patch(`${basePath}/:id`, this.update.bind(this));
    app.delete(`${basePath}/:id`, this.delete.bind(this));
  }

  /**
   * Get the resource path for this controller
   * Override to customize
   */
  protected getResourcePath(): string {
    return '/resources';
  }
}

/**
 * Template for read-only controllers (list and get by ID only)
 */
export abstract class ReadOnlyControllerTemplate<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TGetOutput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _TListOutput
> extends ControllerTemplate {
  constructor(
    protected readonly useCases: {
      getById: { execute: (input: any) => Promise<any> };
      list: { execute: (input: any) => Promise<any> };
    }
  ) {
    super();
  }

  /**
   * GET /:id - Get a resource by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = this.getParam(c, 'id');
      const userId = this.getUserId(c);
      const tenantId = this.getTenantId(c);

      const result = await this.useCases.getById.execute({
        id,
        userId,
        tenantId,
      });

      return this.handleResult(result);
    } catch (error) {
      return this.error('Failed to get resource', 500);
    }
  }

  /**
   * GET / - List resources with optional filters
   */
  async list(c: Context): Promise<Response> {
    try {
      const userId = this.getUserId(c);
      const tenantId = this.getTenantId(c);
      const filters = this.getAllQuery(c);

      const result = await this.useCases.list.execute({
        userId,
        tenantId,
        ...filters,
      });

      return this.handleResult(result);
    } catch (error) {
      return this.error('Failed to list resources', 500);
    }
  }

  /**
   * Register read-only routes with a Hono app
   */
  registerRoutes(app: any, path: string = ''): void {
    const basePath = path || this.getResourcePath();

    app.get(`${basePath}/:id`, this.getById.bind(this));
    app.get(`${basePath}`, this.list.bind(this));
  }

  /**
   * Get the resource path for this controller
   * Override to customize
   */
  protected getResourcePath(): string {
    return '/resources';
  }
}
