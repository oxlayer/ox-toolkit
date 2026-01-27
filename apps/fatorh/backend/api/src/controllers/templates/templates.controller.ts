/**
 * Templates Controller
 *
 * HTTP handlers for template endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateTemplateUseCase } from '../../use-cases/templates/create-template.use-case.js';
import type { GetTemplateUseCase } from '../../use-cases/templates/get-template.use-case.js';
import type { ListTemplatesUseCase } from '../../use-cases/templates/list-templates.use-case.js';
import type { UpdateTemplateUseCase } from '../../use-cases/templates/update-template.use-case.js';
import type { DeleteTemplateUseCase } from '../../use-cases/templates/delete-template.use-case.js';

/**
 * Template Media Schema
 */
const templateMediaSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(['image', 'video', 'document']),
  url: z.string().url(),
  alt: z.string().optional(),
});

/**
 * Template Button Schema
 */
const templateButtonSchema = z.object({
  id: z.string().uuid().optional(),
  text: z.string().min(1).max(255),
  url: z.string().url().optional(),
  type: z.enum(['url', 'phone']),
});

/**
 * Create Template Schema
 */
const createTemplateSchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID'),
  name: z.string().min(1).max(255).describe('Template name'),
  type: z.enum(['whatsapp', 'email', 'sms']).describe('Template type'),
  title: z.string().optional().describe('Template title'),
  subject: z.string().optional().describe('Template subject (for email)'),
  content: z.string().min(1).describe('Template content/body'),
  body: z.string().min(1).optional().describe('Template body (alias for content)'),
  variables: z.array(z.string()).optional().describe('Template variables'),
  footer: z.string().optional().describe('Template footer'),
  media: z.array(templateMediaSchema).optional().describe('Template media'),
  buttons: z.array(templateButtonSchema).optional().describe('Template buttons'),
  category: z.string().optional().describe('Template category'),
  language: z.string().optional().describe('Template language code'),
  isActive: z.boolean().optional().describe('Whether template is active'),
  externalId: z.string().optional().describe('External template ID'),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional().describe('Template status'),
}).transform((data) => {
  // Normalize: use content if body is not provided
  const body = data.body || data.content;
  // Normalize: use title if subject is not provided
  const subject = data.subject || data.title || undefined;
  return { ...data, body, subject };
});

/**
 * Update Template Schema
 */
const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Template name'),
  type: z.enum(['whatsapp', 'email', 'sms']).optional().describe('Template type'),
  subject: z.string().optional().describe('Template subject (for email)'),
  body: z.string().min(1).optional().describe('Template body'),
  variables: z.array(z.string()).optional().describe('Template variables'),
  category: z.string().optional().describe('Template category'),
  language: z.string().optional().describe('Template language code'),
  isActive: z.boolean().optional().describe('Whether template is active'),
  externalId: z.string().optional().describe('External template ID'),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional().describe('Template status'),
});

/**
 * List Templates Query Schema
 */
const listTemplatesQuerySchema = z.object({
  workspaceId: z.string().uuid().optional().describe('Filter by workspace ID'),
  type: z.enum(['whatsapp', 'email', 'sms']).optional().describe('Filter by type'),
  category: z.string().optional().describe('Filter by category'),
  status: z.enum(['draft', 'pending', 'approved', 'rejected']).optional().describe('Filter by status'),
  isActive: z.string().transform((v) => v === 'true').optional().describe('Filter active templates'),
});

/**
 * Templates Controller
 */
export class TemplatesController extends BaseController {
  constructor(
    private createTemplateUseCase: CreateTemplateUseCase,
    private getTemplateUseCase: GetTemplateUseCase,
    private listTemplatesUseCase: ListTemplatesUseCase,
    private updateTemplateUseCase: UpdateTemplateUseCase,
    private deleteTemplateUseCase: DeleteTemplateUseCase
  ) {
    super();
  }

  /**
   * POST /api/templates - Create a new template
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createTemplateSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.createTemplateUseCase.execute(input.data);

      return this.created({
        message: 'Template created successfully',
        templateId: result.templateId,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/templates/:id - Get template by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid template ID');
      }

      const result = await this.getTemplateUseCase.execute({ id });

      return this.ok({
        message: 'Template retrieved successfully',
        ...result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/templates - List templates
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listTemplatesQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.listTemplatesUseCase.execute({
        workspaceId: query.data.workspaceId,
        type: query.data.type,
        category: query.data.category,
        status: query.data.status,
        isActive: query.data.isActive,
      });

      // Return templates array directly (frontend expects array, not wrapped object)
      return c.json(result.templates);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/templates/:id - Update a template
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateTemplateSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid template ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.updateTemplateUseCase.execute({
        id,
        ...input.data,
      });

      return this.ok({
        message: 'Template updated successfully',
        ...result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/templates/:id - Delete a template
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid template ID');
      }

      await this.deleteTemplateUseCase.execute({ id });

      return this.ok({
        message: 'Template deleted successfully',
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
