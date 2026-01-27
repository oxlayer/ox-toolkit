/**
 * Sections Controller
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type {
  CreateSectionUseCase,
  GetSectionsUseCase,
  UpdateSectionUseCase,
  DeleteSectionUseCase,
} from '../use-cases/index.js';

/**
 * Create Section Schema
 */
const createSectionSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(100),
});

/**
 * Update Section Schema
 */
const updateSectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  order: z.number().int().min(0).optional(),
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

export class SectionsController extends BaseController {
  constructor(
    private createSectionUseCase: CreateSectionUseCase,
    private getSectionsUseCase: GetSectionsUseCase,
    private updateSectionUseCase: UpdateSectionUseCase,
    private deleteSectionUseCase: DeleteSectionUseCase
  ) {
    super();
  }

  /**
   * GET /api/sections - List sections
   */
  async getSections(c: Context): Promise<Response> {
    const projectId = c.req.query('projectId');

    const result = await this.getSectionsUseCase.execute({
      filters: projectId ? { projectId } : undefined,
    });

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch sections');
    }

    return this.ok({ sections: result.data?.items || [] });
  }

  /**
   * GET /api/sections/:id - Get a single section
   */
  async getSectionById(c: Context): Promise<Response> {
    const id = c.req.param('id');

    const result = await this.getSectionsUseCase.execute({});

    if (!result.success || !result.data) {
      return this.badRequest('Failed to fetch sections');
    }

    const section = result.data.items.find((s: any) => s.id === id);

    if (!section) {
      return this.notFound('Section not found');
    }

    return this.ok({ section });
  }

  /**
   * POST /api/sections - Create a new section
   */
  async createSection(c: Context): Promise<Response> {
    const body = await c.req.json();
    const input = createSectionSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.createSectionUseCase.execute({
      projectId: input.data.projectId,
      name: input.data.name,
    });

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to create section');
    }

    return this.created({ section: result.data });
  }

  /**
   * PATCH /api/sections/:id - Update a section
   */
  async updateSection(c: Context): Promise<Response> {
    const id = c.req.param('id');

    const body = await c.req.json();
    const input = updateSectionSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateSectionUseCase.execute({
      id,
      ...input.data,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Section not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update section');
    }

    return this.ok({ section: result.data });
  }

  /**
   * DELETE /api/sections/:id - Delete a section
   */
  async deleteSection(c: Context): Promise<Response> {
    const id = c.req.param('id');

    const result = await this.deleteSectionUseCase.execute({
      id,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Section not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete section');
    }

    return this.ok({ message: 'Section deleted successfully' });
  }
}
