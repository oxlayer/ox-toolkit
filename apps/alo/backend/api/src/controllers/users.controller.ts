/**
 * Users Controller
 *
 * This controller follows the OxLayer DDD patterns.
 */

import { BaseController, buildPageInfo, buildPaginatedPayload } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type {
  CreateUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
} from '../use-cases/index.js';
import type { UserRepository } from '../repositories/index.js';

const logger = new Logger('UsersController');

/**
 * Create User Schema
 */
const createUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8),
  establishmentId: z.number().int().positive().optional(),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
});

/**
 * Update User Schema
 */
const updateUserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  password: z.string().min(8).optional(),
  establishmentId: z.number().int().positive().optional(),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Query Params Schema
 */
const querySchema = z.object({
  establishmentId: z.string().transform(Number).optional(),
  role: z.enum(['admin', 'manager', 'staff']).optional(),
  isActive: z.string().transform((v) => v === 'true').optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  include: z.string().transform((val) => val ? val.split(',') : []).optional(),
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

export class UsersController extends BaseController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private listUsersUseCase: ListUsersUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private userRepository: UserRepository
  ) {
    super();
  }

  /**
   * GET /api/users - List users
   */
  async listUsers(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const { include, ...filters } = query.data;

    // Only fetch total if explicitly requested via include=count
    let total: number | undefined;
    if (include?.includes('count')) {
      total = await this.userRepository.count(filters);
    }

    const result = await this.listUsersUseCase.execute(filters);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch users');
    }

    const items = result.data?.items || [];
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const pageInfo = buildPageInfo({
      itemsLength: items.length,
      limit,
      nextCursorPayload: { offset: offset + limit, limit },
    });

    return this.ok(
      buildPaginatedPayload({
        data: items,
        pageInfo,
        total,
      })
    );
  }

  /**
   * GET /api/users/:id - Get a single user
   */
  async getUser(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid user ID');
    }

    const listResult = await this.listUsersUseCase.execute({});
    if (!listResult.success || !listResult.data) {
      return this.badRequest('Failed to fetch users');
    }

    const user = listResult.data.items.find((u: any) => u.id === id);

    if (!user) {
      return this.notFound('User not found');
    }

    return this.ok({ user });
  }

  /**
   * POST /api/users - Create a new user
   */
  async createUser(c: Context): Promise<Response> {
    const body = await c.req.json();

    logger.debug('createUser: Received request', { body });

    const input = createUserSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('createUser: Validation failed', { errors });
      return this.validationError(errors);
    }

    const result = await this.createUserUseCase.execute(input.data);

    if (!result.success) {
      logger.error('createUser: Use case failed', { error: result.error });
      return this.badRequest(result.error?.message || 'Failed to create user');
    }

    logger.info('createUser: Created user', { userId: result.data?.id });
    return this.created({ user: result.data });
  }

  /**
   * PATCH /api/users/:id - Update a user
   */
  async updateUser(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid user ID');
    }

    const body = await c.req.json();
    const input = updateUserSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateUserUseCase.execute({
      id: String(id),
      input: input.data,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'User not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update user');
    }

    return this.ok({ user: result.data });
  }

  /**
   * DELETE /api/users/:id - Delete a user
   */
  async deleteUser(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid user ID');
    }

    const result = await this.deleteUserUseCase.execute({ id: String(id) });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'User not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete user');
    }

    return this.ok({ message: 'User deleted successfully' });
  }
}
