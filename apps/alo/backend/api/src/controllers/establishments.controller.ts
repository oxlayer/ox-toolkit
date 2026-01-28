/**
 * Establishments Controller
 *
 * This controller follows the OxLayer DDD patterns.
 */

import { BaseController, buildPageInfo, buildPaginatedPayload } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type {
  CreateEstablishmentUseCase,
  ListEstablishmentsUseCase,
  GetEstablishmentUseCase,
  UpdateEstablishmentUseCase,
  DeleteEstablishmentUseCase,
} from '../use-cases/index.js';
import type { EstablishmentRepository } from '../repositories/index.js';

const logger = new Logger('EstablishmentsController');

/**
 * Create Establishment Schema
 */
const createEstablishmentSchema = z.object({
  name: z.string().min(1).max(200),
  horarioFuncionamento: z.string().min(1),
  description: z.string().optional(),
  ownerId: z.number().int().positive(),
  image: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  lat: z.number().optional(),
  long: z.number().optional(),
  locationString: z.string().optional(),
  maxDistanceDelivery: z.number().int().nonnegative().optional(),
  establishmentTypeId: z.number().int().positive().optional(),
  website: z.string().url().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  googleBusinessUrl: z.string().url().optional(),
});

/**
 * Update Establishment Schema
 */
const updateEstablishmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  horarioFuncionamento: z.string().min(1).optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  lat: z.number().optional(),
  long: z.number().optional(),
  locationString: z.string().optional(),
  maxDistanceDelivery: z.number().int().nonnegative().optional(),
  establishmentTypeId: z.number().int().positive().optional(),
  website: z.string().url().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  googleBusinessUrl: z.string().url().optional(),
  openData: z.record(z.unknown()).optional(),
});

/**
 * Query Params Schema
 */
const querySchema = z.object({
  ownerId: z.string().transform(Number).optional(),
  establishmentTypeId: z.string().transform(Number).optional(),
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

export class EstablishmentsController extends BaseController {
  constructor(
    private createEstablishmentUseCase: CreateEstablishmentUseCase,
    private listEstablishmentsUseCase: ListEstablishmentsUseCase,
    private getEstablishmentUseCase: GetEstablishmentUseCase,
    private updateEstablishmentUseCase: UpdateEstablishmentUseCase,
    private deleteEstablishmentUseCase: DeleteEstablishmentUseCase,
    private establishmentRepository: EstablishmentRepository
  ) {
    super();
  }

  /**
   * GET /api/establishments - List establishments
   *
   * Query params:
   * - include: comma-separated values, e.g., "count" to include total in meta
   * - limit: number of items per page
   * - offset: offset for pagination
   *
   * @example GET /api/establishments?limit=10&offset=0&include=count
   */
  async listEstablishments(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const { include, ...filters } = query.data;

    // Only fetch total if explicitly requested via include=count
    // Backend rule of thumb: avoid expensive count queries unless needed
    let total: number | undefined;
    if (include?.includes('count')) {
      total = await this.establishmentRepository.count(filters);
    }

    const result = await this.listEstablishmentsUseCase.execute(filters);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch establishments');
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
   * GET /api/establishments/:id - Get a single establishment
   */
  async getEstablishment(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid establishment ID');
    }

    const result = await this.getEstablishmentUseCase.execute({ id: String(id) });

    if (!result.success) {
      return this.notFound(result.error?.message || 'Establishment not found');
    }

    return this.ok({ establishment: result.data });
  }

  /**
   * POST /api/establishments - Create a new establishment
   */
  async createEstablishment(c: Context): Promise<Response> {
    const body = await c.req.json();

    logger.debug('createEstablishment: Received request', { body });

    const input = createEstablishmentSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('createEstablishment: Validation failed', { errors });
      return this.validationError(errors);
    }

    const result = await this.createEstablishmentUseCase.execute(input.data);

    if (!result.success) {
      logger.error('createEstablishment: Use case failed', { error: result.error });
      return this.badRequest(result.error?.message || 'Failed to create establishment');
    }

    logger.info('createEstablishment: Created establishment', { establishmentId: result.data?.id });
    return this.created({ establishment: result.data });
  }

  /**
   * PATCH /api/establishments/:id - Update an establishment
   */
  async updateEstablishment(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid establishment ID');
    }

    const body = await c.req.json();
    const input = updateEstablishmentSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateEstablishmentUseCase.execute({
      id: String(id),
      input: input.data,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Establishment not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update establishment');
    }

    return this.ok({ establishment: result.data });
  }

  /**
   * DELETE /api/establishments/:id - Delete an establishment
   */
  async deleteEstablishment(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid establishment ID');
    }

    const result = await this.deleteEstablishmentUseCase.execute({ id: String(id) });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Establishment not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete establishment');
    }

    return this.ok({ message: 'Establishment deleted successfully' });
  }
}
