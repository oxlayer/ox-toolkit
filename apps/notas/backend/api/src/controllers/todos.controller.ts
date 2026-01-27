/**
 * Todos Controller
 *
 * This controller follows the OxLayer DDD patterns.
 * For templates to create similar controllers, see @oxlayer/snippets
 *
 * @see https://github.com/oxlayer/snippets/blob/main/src/controllers/controller.template.ts
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type {
  CreateTodoUseCase,
  GetTodosUseCase,
  UpdateTodoUseCase,
  DeleteTodoUseCase,
} from '../use-cases/index.js';

const logger = new Logger('TodosController');

/**
 * Create Todo Schema
 */
const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().optional(),
  priority: z.number().int().min(0).max(5).optional(),
  order: z.number().int().optional(),
  workspaceId: z.string().default('default'),
});

/**
 * Update Todo Schema
 */
const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().optional(),
  priority: z.number().int().min(0).max(5).optional(),
  order: z.number().int().optional(),
});

/**
 * Query Params Schema
 */
const querySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  search: z.string().optional(),
  projectId: z.string().optional(),
  sectionId: z.string().optional(),
});

/**
 * Convert Zod errors to Record<string, string[]>
 */
function formatZodErrors(errors: z.ZodIssue[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const error of errors) {
    const field = error.path.join('.');
    if (!formatted[field]) {
      formatted[field] = [];
    }
    formatted[field].push(error.message);
  }
  return formatted;
}

export class TodosController extends BaseController {
  constructor(
    private createTodoUseCase: CreateTodoUseCase,
    private getTodosUseCase: GetTodosUseCase,
    private updateTodoUseCase: UpdateTodoUseCase,
    private deleteTodoUseCase: DeleteTodoUseCase
  ) {
    super();
  }

  /**
   * GET /api/todos - List todos
   */
  async getTodos(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;

    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const result = await this.getTodosUseCase.execute({
      userId,
      filters: query.data,
    });

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch todos');
    }

    return this.ok({ todos: result.data?.items || [] });
  }

  /**
   * GET /api/todos/:id - Get a single todo
   */
  async getTodoById(c: Context): Promise<Response> {
    const id = c.req.param('id');

    // For now, use getTodos with filter (single item)
    const result = await this.getTodosUseCase.execute({});

    if (!result.success || !result.data) {
      return this.badRequest('Failed to fetch todos');
    }

    const todo = result.data.items.find((t: any) => t.id === id);

    if (!todo) {
      return this.notFound('Todo not found');
    }

    return this.ok({ todo });
  }

  /**
   * POST /api/todos - Create a new todo
   */
  async createTodo(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;

    const body = await c.req.json();

    // Debug logging for development
    logger.debug('createTodo: Received request', { userId, body });

    const input = createTodoSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('createTodo: Validation failed', { errors });
      return this.validationError(errors);
    }

    const result = await this.createTodoUseCase.execute({
      ...input.data,
      dueDate: input.data.dueDate ? new Date(input.data.dueDate) : undefined,
      userId,
    });

    if (!result.success) {
      logger.error('createTodo: Use case failed', { error: result.error });
      return this.badRequest(result.error?.message || 'Failed to create todo');
    }

    logger.info('createTodo: Created todo', { todoId: result.data?.id });
    return this.created({ todo: result.data });
  }

  /**
   * PATCH /api/todos/:id - Update a todo
   */
  async updateTodo(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const body = await c.req.json();
    const input = updateTodoSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateTodoUseCase.execute({
      id,
      ...input.data,
      dueDate: input.data.dueDate ? new Date(input.data.dueDate) : undefined,
      userId,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Todo not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update todo');
    }

    return this.ok({ todo: result.data });
  }

  /**
   * DELETE /api/todos/:id - Delete a todo
   */
  async deleteTodo(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const result = await this.deleteTodoUseCase.execute({
      id,
      userId,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Todo not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete todo');
    }

    return this.ok({ message: 'Todo deleted successfully' });
  }

  /**
   * PATCH /api/todos/:id/complete - Mark todo as completed
   */
  async completeTodo(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const result = await this.updateTodoUseCase.execute({
      id,
      status: 'completed',
      userId,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Todo not found');
      }
      return this.badRequest(result.error?.message || 'Failed to complete todo');
    }

    return this.ok({ todo: result.data });
  }

  /**
   * GET /public/todos - List all todos from all users (PUBLIC, NO AUTH)
   *
   * This endpoint demonstrates how to create public routes without authentication.
   * It returns all todos from all users without any filtering.
   *
   * Use cases:
   * - Public showcase/demo
   * - Anonymous read access
   * - Testing and debugging
   *
   * WARNING: In production, you typically want some form of access control
   * even for "public" endpoints (rate limiting, IP restrictions, etc.)
   */
  async getAllTodosPublic(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    // Get ALL todos without userId filter
    const result = await this.getTodosUseCase.execute({
      filters: query.data, // Apply status/search filters but no userId filter
    });

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch todos');
    }

    return this.ok({
      todos: result.data?.items || [],
      meta: {
        total: result.data?.total || 0,
        public: true,
        authentication: 'none',
      },
    });
  }
}
