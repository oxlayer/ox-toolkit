/**
 * Public Controller - Service Categories
 *
 * Public endpoints for onboarding flow (no authentication required)
 */

import { BaseController, buildPageInfo, buildPaginatedPayload } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type { ListServiceProviderCategoriesUseCase, GetServiceProviderCategoryUseCase } from '../../use-cases/index.js';

const logger = new Logger('PublicServiceCategoriesController');

/**
 * Query Params Schema
 */
const querySchema = z.object({
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

export class PublicServiceCategoriesController extends BaseController {
  constructor(
    private listServiceProviderCategoriesUseCase: ListServiceProviderCategoriesUseCase,
    private getServiceProviderCategoryUseCase: GetServiceProviderCategoryUseCase
  ) {
    super();
  }

  /**
   * GET /public/service-categories - List all service categories (public, no auth)
   */
  async listServiceCategories(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const { include, ...filters } = query.data;

    const result = await this.listServiceProviderCategoriesUseCase.execute(filters);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch categories');
    }

    // Only fetch total if explicitly requested via include=count
    let total: number | undefined;
    if (include?.includes('count')) {
      total = result.data.total;
    }

    const items = result.data.items || [];
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
   * GET /public/service-categories/:id - Get a single category (public, no auth)
   */
  async getServiceCategory(c: Context): Promise<Response> {
    const id = c.req.param('id');

    const result = await this.getServiceProviderCategoryUseCase.execute({ id });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound('Category not found');
      }
      return this.badRequest(result.error?.message || 'Failed to fetch category');
    }

    return this.ok({ category: result.data });
  }
}
