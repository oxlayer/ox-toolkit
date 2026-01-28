/**
 * Items Controller
 *
 * HTTP handlers for Item CRUD operations.
 */

import { BaseController, buildPageInfo, buildPaginatedPayload } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type {
  CreateItemUseCase,
  ListItemsUseCase,
  GetItemUseCase,
  UpdateItemUseCase,
  DeleteItemUseCase,
} from '../use-cases/index.js';
import type { ItemRepository } from '../repositories/item.repository.js';

const logger = new Logger('ItemsController');

const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});

const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

const querySchema = z.object({
  search: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
  include: z.string().transform((val) => val ? val.split(',') : []).optional(),
});

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

export class ItemsController extends BaseController {
  constructor(
    private createItemUseCase: CreateItemUseCase,
    private listItemsUseCase: ListItemsUseCase,
    private getItemUseCase: GetItemUseCase,
    private updateItemUseCase: UpdateItemUseCase,
    private deleteItemUseCase: DeleteItemUseCase,
    private itemRepository: ItemRepository
  ) {
    super();
  }

  async listItems(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const { include, ...filters } = query.data;

    // Only fetch total if explicitly requested via include=count
    // Backend rule of thumb: avoid expensive count queries unless needed
    let total: number | undefined;
    if (include?.includes('count')) {
      total = await this.itemRepository.count(filters);
    }

    const result = await this.listItemsUseCase.execute(filters);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch items');
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

  async getItem(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid item ID');
    }

    const result = await this.getItemUseCase.execute({ id: String(id) });

    if (!result.success) {
      return this.notFound(result.error?.message || 'Item not found');
    }

    return this.ok({ item: result.data });
  }

  async createItem(c: Context): Promise<Response> {
    const body = await c.req.json();

    logger.debug('createItem: Received request', { body });

    const input = createItemSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('createItem: Validation failed', { errors });
      return this.validationError(errors);
    }

    const result = await this.createItemUseCase.execute(input.data);

    if (!result.success) {
      logger.error('createItem: Use case failed', { error: result.error });
      return this.badRequest(result.error?.message || 'Failed to create item');
    }

    logger.info('createItem: Created item', { itemId: result.data?.id });
    return this.created({ item: result.data });
  }

  async updateItem(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid item ID');
    }

    const body = await c.req.json();
    const input = updateItemSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateItemUseCase.execute({
      id: String(id),
      input: input.data,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Item not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update item');
    }

    return this.ok({ item: result.data });
  }

  async deleteItem(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid item ID');
    }

    const result = await this.deleteItemUseCase.execute({ id: String(id) });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Item not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete item');
    }

    return this.ok({ message: 'Item deleted successfully' });
  }
}
