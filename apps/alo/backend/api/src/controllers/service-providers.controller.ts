/**
 * Service Providers Controller
 *
 * This controller follows the OxLayer DDD patterns.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type {
  CreateServiceProviderUseCase,
  ListServiceProvidersUseCase,
  GetServiceProviderUseCase,
  UpdateServiceProviderUseCase,
  DeleteServiceProviderUseCase,
} from '../use-cases/index.js';

const logger = new Logger('ServiceProvidersController');

/**
 * Create Service Provider Schema
 */
const createServiceProviderSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(10),
  categoryId: z.number().int().positive(),
  document: z.string().min(11),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/),
  available: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
});

/**
 * Update Service Provider Schema
 */
const updateServiceProviderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  password: z.string().min(8).optional(),
  phone: z.string().min(10).optional(),
  categoryId: z.number().int().positive().optional(),
  document: z.string().min(11).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/).optional(),
  available: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Query Params Schema
 */
const querySchema = z.object({
  categoryId: z.string().transform(Number).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  isActive: z.string().transform((v) => v === 'true').optional(),
  available: z.string().transform((v) => v === 'true').optional(),
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

export class ServiceProvidersController extends BaseController {
  constructor(
    private createServiceProviderUseCase: CreateServiceProviderUseCase,
    private listServiceProvidersUseCase: ListServiceProvidersUseCase,
    private getServiceProviderUseCase: GetServiceProviderUseCase,
    private updateServiceProviderUseCase: UpdateServiceProviderUseCase,
    private deleteServiceProviderUseCase: DeleteServiceProviderUseCase
  ) {
    super();
  }

  /**
   * GET /api/service-providers - List service providers
   */
  async listServiceProviders(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const result = await this.listServiceProvidersUseCase.execute(query.data);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch service providers');
    }

    return this.ok({ serviceProviders: result.data?.items || [], total: result.data?.total || 0 });
  }

  /**
   * GET /api/service-providers/:id - Get a single service provider
   */
  async getServiceProvider(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid service provider ID');
    }

    const result = await this.getServiceProviderUseCase.execute(id);

    if (!result.success) {
      return this.notFound(result.error?.message || 'Service provider not found');
    }

    return this.ok({ serviceProvider: result.data });
  }

  /**
   * POST /api/service-providers - Create a new service provider
   */
  async createServiceProvider(c: Context): Promise<Response> {
    const body = await c.req.json();

    logger.debug('createServiceProvider: Received request', { body });

    const input = createServiceProviderSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('createServiceProvider: Validation failed', { errors });
      return this.validationError(errors);
    }

    const result = await this.createServiceProviderUseCase.execute(input.data);

    if (!result.success) {
      logger.error('createServiceProvider: Use case failed', { error: result.error });
      return this.badRequest(result.error?.message || 'Failed to create service provider');
    }

    logger.info('createServiceProvider: Created service provider', { serviceProviderId: result.data?.id });
    return this.created({ serviceProvider: result.data });
  }

  /**
   * PATCH /api/service-providers/:id - Update a service provider
   */
  async updateServiceProvider(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid service provider ID');
    }

    const body = await c.req.json();
    const input = updateServiceProviderSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateServiceProviderUseCase.execute({
      id,
      input: input.data,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Service provider not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update service provider');
    }

    return this.ok({ serviceProvider: result.data });
  }

  /**
   * DELETE /api/service-providers/:id - Delete a service provider
   */
  async deleteServiceProvider(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid service provider ID');
    }

    const result = await this.deleteServiceProviderUseCase.execute(id);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Service provider not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete service provider');
    }

    return this.ok({ message: 'Service provider deleted successfully' });
  }
}
