/**
 * Delivery Men Controller
 *
 * This controller follows the OxLayer DDD patterns.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type {
  CreateDeliveryManUseCase,
  ListDeliveryMenUseCase,
  GetDeliveryManUseCase,
  UpdateDeliveryManUseCase,
  DeleteDeliveryManUseCase,
} from '../use-cases/index.js';

const logger = new Logger('DeliveryMenController');

/**
 * Create Delivery Man Schema
 */
const createDeliveryManSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  establishmentId: z.number().int().positive().optional(),
});

/**
 * Update Delivery Man Schema
 */
const updateDeliveryManSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  password: z.string().min(8).optional(),
  phone: z.string().min(10).optional(),
  establishmentId: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Query Params Schema
 */
const querySchema = z.object({
  establishmentId: z.string().transform(Number).optional(),
  isActive: z.string().transform((v) => v === 'true').optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
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

export class DeliveryMenController extends BaseController {
  constructor(
    private createDeliveryManUseCase: CreateDeliveryManUseCase,
    private listDeliveryMenUseCase: ListDeliveryMenUseCase,
    private getDeliveryManUseCase: GetDeliveryManUseCase,
    private updateDeliveryManUseCase: UpdateDeliveryManUseCase,
    private deleteDeliveryManUseCase: DeleteDeliveryManUseCase
  ) {
    super();
  }

  /**
   * GET /api/delivery-men - List delivery men
   */
  async listDeliveryMen(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const result = await this.listDeliveryMenUseCase.execute(query.data);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch delivery men');
    }

    return this.ok({ deliveryMen: result.data?.items || [], total: result.data?.total || 0 });
  }

  /**
   * GET /api/delivery-men/:id - Get a single delivery man
   */
  async getDeliveryMan(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid delivery man ID');
    }

    const result = await this.getDeliveryManUseCase.execute(id);

    if (!result.success) {
      return this.notFound(result.error?.message || 'Delivery man not found');
    }

    return this.ok({ deliveryMan: result.data });
  }

  /**
   * POST /api/delivery-men - Create a new delivery man
   */
  async createDeliveryMan(c: Context): Promise<Response> {
    const body = await c.req.json();

    logger.debug('createDeliveryMan: Received request', { body });

    const input = createDeliveryManSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('createDeliveryMan: Validation failed', { errors });
      return this.validationError(errors);
    }

    const result = await this.createDeliveryManUseCase.execute(input.data);

    if (!result.success) {
      logger.error('createDeliveryMan: Use case failed', { error: result.error });
      return this.badRequest(result.error?.message || 'Failed to create delivery man');
    }

    logger.info('createDeliveryMan: Created delivery man', { deliveryManId: result.data?.id });
    return this.created({ deliveryMan: result.data });
  }

  /**
   * PATCH /api/delivery-men/:id - Update a delivery man
   */
  async updateDeliveryMan(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid delivery man ID');
    }

    const body = await c.req.json();
    const input = updateDeliveryManSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateDeliveryManUseCase.execute({
      id,
      input: input.data,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Delivery man not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update delivery man');
    }

    return this.ok({ deliveryMan: result.data });
  }

  /**
   * DELETE /api/delivery-men/:id - Delete a delivery man
   */
  async deleteDeliveryMan(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid delivery man ID');
    }

    const result = await this.deleteDeliveryManUseCase.execute(id);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Delivery man not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete delivery man');
    }

    return this.ok({ message: 'Delivery man deleted successfully' });
  }
}
