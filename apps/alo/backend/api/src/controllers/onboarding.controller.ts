/**
 * User Onboarding Configuration Controller
 *
 * Handles the onboarding completion flow for new users
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import { Logger } from '@oxlayer/capabilities-internal';
import type { UserRepository } from '../repositories/index.js';
import type { EstablishmentRepository } from '../repositories/index.js';
import { UserEntity, EstablishmentEntity } from '../domain/index.js';

const logger = new Logger('OnboardingController');

/**
 * Complete Onboarding Schema
 */
const completeOnboardingSchema = z.object({
  // User info
  name: z.string().min(1).max(200).optional(),

  // Logo (URL)
  logo: z.string().url().optional(),

  // Business info (for companies)
  legalName: z.string().min(1).max(200).optional(), // Razão social
  businessType: z.enum(['me', 'mei']).optional(),

  // Address
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/).optional(), // CEP format: 00000-000 or 00000000
  address: z.string().min(1).max(500).optional(),
  addressNumber: z.string().min(1).max(20).optional(),
  addressComplement: z.string().max(200).optional(),
  neighborhood: z.string().min(1).max(100).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().length(2).optional(), // UF (2 letters)
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

export class OnboardingController extends BaseController {
  constructor(
    private userRepository: UserRepository,
    private establishmentRepository: EstablishmentRepository
  ) {
    super();
  }

  /**
   * GET /api/onboarding/me - Get current user's onboarding status
   */
  async getOnboardingStatus(c: Context): Promise<Response> {
    // Get user ID from context (set by auth middleware)
    const userId = c.get('userId');
    if (!userId) {
      return this.unauthorized('User not authenticated');
    }

    const user = await this.userRepository.findById(Number(userId));
    if (!user) {
      return this.notFound('User not found');
    }

    let establishment = null;
    if (user.establishmentId) {
      establishment = await this.establishmentRepository.findById(user.establishmentId);
    }

    return this.ok({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        documentType: user.documentType,
        document: user.document,
        status: user.status,
        establishmentId: user.establishmentId,
      },
      establishment: establishment ? {
        id: establishment.id,
        name: establishment.name,
        logo: establishment.logo,
        legalName: establishment.legalName,
        businessType: establishment.businessType,
        address: {
          zipCode: establishment.zipCode,
          address: establishment.address,
          addressNumber: establishment.addressNumber,
          addressComplement: establishment.addressComplement,
          neighborhood: establishment.neighborhood,
          city: establishment.city,
          state: establishment.state,
        },
      } : null,
      isComplete: user.status === 'active',
    });
  }

  /**
   * POST /api/onboarding/complete - Complete onboarding
   */
  async completeOnboarding(c: Context): Promise<Response> {
    // Get user ID from context (set by auth middleware)
    const userId = c.get('userId');
    if (!userId) {
      return this.unauthorized('User not authenticated');
    }

    const body = await c.req.json();
    const input = completeOnboardingSchema.safeParse(body);

    if (!input.success) {
      const errors = formatZodErrors(input.error.errors);
      logger.warn('completeOnboarding: Validation failed', { errors });
      return this.validationError(errors);
    }

    const user = await this.userRepository.findById(Number(userId));
    if (!user) {
      return this.notFound('User not found');
    }

    // Check if user can complete onboarding
    if (user.status === 'active') {
      return this.badRequest('Onboarding already completed');
    }

    // Update user info
    if (input.data.name) {
      // Update name via repository
      // Note: We'll need to add a name update method or use the update use case
    }

    // Update establishment if user has one
    if (user.establishmentId) {
      const establishment = await this.establishmentRepository.findById(user.establishmentId);
      if (establishment) {
        // Update establishment fields
        if (input.data.logo !== undefined) {
          establishment.logo = input.data.logo;
        }
        if (input.data.legalName !== undefined) {
          establishment.legalName = input.data.legalName;
        }
        if (input.data.businessType !== undefined) {
          establishment.businessType = input.data.businessType;
        }

        // Update address fields
        if (input.data.zipCode !== undefined ||
            input.data.address !== undefined ||
            input.data.addressNumber !== undefined ||
            input.data.addressComplement !== undefined ||
            input.data.neighborhood !== undefined ||
            input.data.city !== undefined ||
            input.data.state !== undefined) {
          establishment.updateAddress({
            zipCode: input.data.zipCode,
            address: input.data.address,
            addressNumber: input.data.addressNumber,
            addressComplement: input.data.addressComplement,
            neighborhood: input.data.neighborhood,
            city: input.data.city,
            state: input.data.state,
          });
        }

        await this.establishmentRepository.update(establishment.id, establishment);
      }
    }

    // Mark user as active
    user.markAsActive();
    await this.userRepository.update(user);

    logger.info('completeOnboarding: User completed onboarding', { userId: user.id });

    return this.ok({
      message: 'Onboarding completed successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  }

  /**
   * POST /api/onboarding/address/cep - Lookup address by CEP
   */
  async lookupCep(c: Context): Promise<Response> {
    const body = await c.req.json();
    const { cep } = body;

    if (!cep || typeof cep !== 'string') {
      return this.badRequest('CEP is required');
    }

    // Clean CEP (remove non-digits)
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      return this.badRequest('CEP must have 8 digits');
    }

    try {
      // Use ViaCEP API for address lookup
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        return this.notFound('CEP not found');
      }

      return this.ok({
        address: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        complement: data.complemento,
      });
    } catch (error) {
      logger.error('lookupCep: Failed to lookup CEP', { error });
      return this.badRequest('Failed to lookup CEP');
    }
  }
}
