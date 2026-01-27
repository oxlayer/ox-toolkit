/**
 * Tags Controller
 *
 * HTTP handlers for tag endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateTagUseCase } from '../../use-cases/tags/create-tag.use-case.js';
import type { GetTagUseCase } from '../../use-cases/tags/get-tag.use-case.js';
import type { ListTagsUseCase } from '../../use-cases/tags/list-tags.use-case.js';
import type { UpdateTagUseCase } from '../../use-cases/tags/update-tag.use-case.js';
import type { DeleteTagUseCase } from '../../use-cases/tags/delete-tag.use-case.js';

/**
 * Create Tag Schema
 */
const createTagSchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID'),
  key: z.string().min(1).max(100).describe('Tag key'),
  value: z.string().min(1).max(255).describe('Tag value'),
  isPrimary: z.boolean().optional().describe('Whether this is a primary tag'),
  description: z.string().optional().describe('Tag description'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().describe('Tag color as hex'),
});

/**
 * Update Tag Schema
 */
const updateTagSchema = z.object({
  key: z.string().min(1).max(255).optional().describe('Tag key'),
  value: z.string().min(1).max(255).optional().describe('Tag value'),
  isPrimary: z.boolean().optional().describe('Whether this is a primary tag'),
  description: z.string().optional().describe('Tag description'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().describe('Tag color as hex'),
});

/**
 * List Tags Query Schema
 */
const listTagsQuerySchema = z.object({
  workspaceId: z.string().uuid().optional().describe('Filter by workspace ID'),
  key: z.string().optional().describe('Filter by key'),
  value: z.string().optional().describe('Filter by value'),
  isPrimary: z.string().transform((v) => v === 'true').optional().describe('Filter primary tags'),
});

/**
 * Tags Controller
 */
export class TagsController extends BaseController {
  constructor(
    private createTagUseCase: CreateTagUseCase,
    private getTagUseCase: GetTagUseCase,
    private listTagsUseCase: ListTagsUseCase,
    private updateTagUseCase: UpdateTagUseCase,
    private deleteTagUseCase: DeleteTagUseCase
  ) {
    super();
  }

  /**
   * POST /api/tags - Create a new tag
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createTagSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.createTagUseCase.execute(input.data);

      return this.created({
        message: 'Tag created successfully',
        tagId: result.tagId,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/tags/:id - Get tag by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid tag ID');
      }

      const result = await this.getTagUseCase.execute({ id });

      return this.ok({
        message: 'Tag retrieved successfully',
        ...result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/tags - List tags
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listTagsQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.listTagsUseCase.execute({
        workspaceId: query.data.workspaceId,
        key: query.data.key,
        value: query.data.value,
        isPrimary: query.data.isPrimary,
      });

      // Return tags array directly (frontend expects array, not wrapped object)
      return c.json(result.tags);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/tags/keys - Get unique tag keys
   */
  async getKeys(c: Context): Promise<Response> {
    try {
      const workspaceId = c.req.query('workspaceId');

      if (!workspaceId || !z.string().uuid().safeParse(workspaceId).success) {
        return this.badRequest('Valid workspace ID is required');
      }

      // This would need a dedicated use case, for now return tags
      const result = await this.listTagsUseCase.execute({ workspaceId });

      // Extract unique keys
      const keys = [...new Set(result.tags.map((t) => t.key))].sort();

      // Return keys array directly (frontend expects array, not wrapped object)
      return c.json(keys);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/tags/values/:key - Get unique values for a key
   */
  async getValuesByKey(c: Context): Promise<Response> {
    try {
      const key = c.req.param('key');
      const workspaceId = c.req.query('workspaceId');

      if (!key) {
        return this.badRequest('Key is required');
      }

      if (!workspaceId || !z.string().uuid().safeParse(workspaceId).success) {
        return this.badRequest('Valid workspace ID is required');
      }

      // This would need a dedicated use case, for now return tags
      const result = await this.listTagsUseCase.execute({ workspaceId, key });

      // Extract unique values
      const values = [...new Set(result.tags.map((t) => t.value))].sort();

      // Return values array directly (frontend expects array, not wrapped object)
      return c.json(values);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/tags/:id - Update a tag
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateTagSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid tag ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.updateTagUseCase.execute({
        id,
        ...input.data,
      });

      return this.ok({
        message: 'Tag updated successfully',
        ...result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/tags/:id - Delete a tag
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid tag ID');
      }

      await this.deleteTagUseCase.execute({ id });

      return this.ok({
        message: 'Tag deleted successfully',
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
