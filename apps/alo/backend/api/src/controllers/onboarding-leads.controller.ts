/**
 * Onboarding Leads Controller
 *
 * This controller follows the OxLayer DDD patterns.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type {
  CreateOnboardingLeadUseCase,
  ListOnboardingLeadsUseCase,
  GetOnboardingLeadUseCase,
  UpdateOnboardingLeadUseCase,
  DeleteOnboardingLeadUseCase,
} from '../use-cases/index.js';

const logger = new Logger('OnboardingLeadsController');

/**
 * Create Onboarding Lead Schema
 */
const createOnboardingLeadSchema = z.object({
  userType: z.enum(['provider', 'company']),
  categoryId: z.number().int().positive().optional(),
  establishmentTypeId: z.number().int().positive().optional(),
  document: z.string().min(11),
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(10),
  termsAccepted: z.boolean().refine((v) => v === true, {
    message: 'Terms must be accepted',
  }),
  privacyAccepted: z.boolean().refine((v) => v === true, {
    message: 'Privacy policy must be accepted',
  }),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Update Onboarding Lead Schema
 */
const updateOnboardingLeadSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'rejected']).optional(),
  notes: z.string().optional(),
  contactedAt: z.string().datetime().optional(),
});

/**
 * Query Params Schema
 */
const querySchema = z.object({
  userType: z.enum(['provider', 'company']).optional(),
  categoryId: z.string().transform(Number).optional(),
  establishmentTypeId: z.string().transform(Number).optional(),
  status: z.enum(['new', 'contacted', 'converted', 'rejected']).optional(),
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

export class OnboardingLeadsController extends BaseController {
  constructor(
    private createOnboardingLeadUseCase: CreateOnboardingLeadUseCase,
    private listOnboardingLeadsUseCase: ListOnboardingLeadsUseCase,
    private getOnboardingLeadUseCase: GetOnboardingLeadUseCase,
    private updateOnboardingLeadUseCase: UpdateOnboardingLeadUseCase,
    private deleteOnboardingLeadUseCase: DeleteOnboardingLeadUseCase
  ) {
    super();
  }

  /**
   * GET /api/onboarding-leads - List onboarding leads
   */
  async listOnboardingLeads(c: Context): Promise<Response> {
    const query = querySchema.safeParse(c.req.query());
    if (!query.success) {
      return this.validationError(formatZodErrors(query.error.errors));
    }

    const result = await this.listOnboardingLeadsUseCase.execute(query.data);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch onboarding leads');
    }

    return this.ok({ onboardingLeads: result.data?.items || [], total: result.data?.total || 0 });
  }

  /**
   * GET /api/onboarding-leads/:id - Get a single onboarding lead
   */
  async getOnboardingLead(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid onboarding lead ID');
    }

    const result = await this.getOnboardingLeadUseCase.execute(id);

    if (!result.success) {
      return this.notFound(result.error?.message || 'Onboarding lead not found');
    }

    return this.ok({ onboardingLead: result.data });
  }

  /**
   * POST /api/onboarding-leads - Create a new onboarding lead
   * This is a public endpoint (no auth required)
   */
  async createOnboardingLead(c: Context): Promise<Response> {
    const body = await c.req.json();

    logger.debug('createOnboardingLead: Received request', { body });

    const input = createOnboardingLeadSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('createOnboardingLead: Validation failed', { errors });
      return this.validationError(errors);
    }

    const result = await this.createOnboardingLeadUseCase.execute(input.data);

    if (!result.success) {
      logger.error('createOnboardingLead: Use case failed', { error: result.error });
      return this.badRequest(result.error?.message || 'Failed to create onboarding lead');
    }

    logger.info('createOnboardingLead: Created onboarding lead', { leadId: result.data?.id });
    return this.created({ onboardingLead: result.data });
  }

  /**
   * PATCH /api/onboarding-leads/:id - Update an onboarding lead
   */
  async updateOnboardingLead(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid onboarding lead ID');
    }

    const body = await c.req.json();
    const input = updateOnboardingLeadSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateOnboardingLeadUseCase.execute({
      id,
      input: {
        ...input.data,
        contactedAt: input.data.contactedAt ? new Date(input.data.contactedAt) : undefined,
      },
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Onboarding lead not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update onboarding lead');
    }

    return this.ok({ onboardingLead: result.data });
  }

  /**
   * DELETE /api/onboarding-leads/:id - Delete an onboarding lead
   */
  async deleteOnboardingLead(c: Context): Promise<Response> {
    const id = Number(c.req.param('id'));

    if (isNaN(id)) {
      return this.badRequest('Invalid onboarding lead ID');
    }

    const result = await this.deleteOnboardingLeadUseCase.execute(id);

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Onboarding lead not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete onboarding lead');
    }

    return this.ok({ message: 'Onboarding lead deleted successfully' });
  }

  /**
   * POST /public/onboarding-leads - Public endpoint for creating onboarding leads
   * This is used for the public onboarding form (no auth required)
   */
  async createPublicOnboardingLead(c: Context): Promise<Response> {
    // Same logic as createOnboardingLead but marked as public
    return this.createOnboardingLead(c);
  }
}
