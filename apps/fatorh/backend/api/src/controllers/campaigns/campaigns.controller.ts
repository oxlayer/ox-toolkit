/**
 * Campaigns Controller
 *
 * HTTP handlers for campaign endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateWhatsAppCampaignUseCase } from '../../use-cases/campaigns/create-whatsapp-campaign.use-case.js';
import type { GetWhatsAppCampaignUseCase } from '../../use-cases/campaigns/get-whatsapp-campaign.use-case.js';
import type { ListWhatsAppCampaignsUseCase } from '../../use-cases/campaigns/list-whatsapp-campaigns.use-case.js';
import type { UpdateWhatsAppCampaignUseCase } from '../../use-cases/campaigns/update-whatsapp-campaign.use-case.js';
import type { DeleteWhatsAppCampaignUseCase } from '../../use-cases/campaigns/delete-whatsapp-campaign.use-case.js';

/**
 * Create WhatsApp Campaign Schema
 */
const createCampaignSchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID'),
  examId: z.string().uuid().optional().describe('Exam ID'),
  templateId: z.string().uuid().describe('Template ID'),
  name: z.string().min(1).max(255).describe('Campaign name'),
  description: z.string().optional().describe('Campaign description'),
  scheduledAt: z.string().datetime().optional().describe('Schedule date/time'),
  tags: z.array(z.string()).optional().describe('Tag keys for filtering recipients'),
});

/**
 * Update WhatsApp Campaign Schema
 */
const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Campaign name'),
  description: z.string().optional().describe('Campaign description'),
  templateId: z.string().uuid().optional().describe('Template ID'),
  scheduledAt: z.string().datetime().optional().describe('Schedule date/time'),
  tags: z.array(z.string()).optional().describe('Tag keys for filtering recipients'),
});

/**
 * List Campaigns Query Schema
 */
const listCampaignsQuerySchema = z.object({
  workspaceId: z.string().uuid().optional().describe('Filter by workspace ID'),
  examId: z.string().uuid().optional().describe('Filter by exam ID'),
});

/**
 * Campaigns Controller
 */
export class CampaignsController extends BaseController {
  constructor(
    private createCampaignUseCase: CreateWhatsAppCampaignUseCase,
    private getCampaignUseCase: GetWhatsAppCampaignUseCase,
    private listCampaignsUseCase: ListWhatsAppCampaignsUseCase,
    private updateCampaignUseCase: UpdateWhatsAppCampaignUseCase,
    private deleteCampaignUseCase: DeleteWhatsAppCampaignUseCase
  ) {
    super();
  }

  /**
   * POST /api/campaigns - Create a new campaign
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createCampaignSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.createCampaignUseCase.execute({
        ...input.data,
        scheduledAt: input.data.scheduledAt ? new Date(input.data.scheduledAt) : undefined,
      });

      return this.created({
        message: 'Campaign created successfully',
        campaignId: result.campaignId,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/campaigns/:id - Get campaign by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid campaign ID');
      }

      const result = await this.getCampaignUseCase.execute({ id });

      return this.ok({
        message: 'Campaign retrieved successfully',
        ...result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/campaigns - List campaigns
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listCampaignsQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.listCampaignsUseCase.execute({
        workspaceId: query.data.workspaceId,
        examId: query.data.examId,
      });

      // Return campaigns array directly (frontend expects array, not wrapped object)
      return c.json(result.campaigns);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/campaigns/:id - Update a campaign
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateCampaignSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid campaign ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.updateCampaignUseCase.execute({
        id,
        ...input.data,
        scheduledAt: input.data.scheduledAt ? new Date(input.data.scheduledAt) : undefined,
      });

      return this.ok({
        message: 'Campaign updated successfully',
        ...result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/campaigns/:id - Delete a campaign
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid campaign ID');
      }

      await this.deleteCampaignUseCase.execute({ id });

      return this.ok({
        message: 'Campaign deleted successfully',
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
