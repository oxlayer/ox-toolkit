/**
 * Convert Onboarding Lead Use Case
 *
 * Converts an onboarding lead to an actual user by:
 * 1. Creating a Keycloak user with CPF/CNPJ as username
 * 2. Creating a local user record with pending_review status
 * 3. Marking the lead as converted
 */

import type { AppResult } from '@oxlayer/snippets/use-cases';
import { OnboardingLeadRepository } from '@/repositories/index.js';
import { UserRepository } from '@/repositories/index.js';
import { EstablishmentRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { UserEntity, EstablishmentEntity, OnboardingLeadEntity } from '@/domain/index.js';
import { KeycloakAdminService } from '@oxlayer/capabilities-auth';
import { ENV } from '@/config/app.config.js';

export interface ConvertLeadInput {
  leadId: number;
  temporaryPassword?: string; // Optional, will generate if not provided
}

export interface ConvertLeadOutput {
  userId: number;
  keycloakUserId: string;
  username: string; // CPF or CNPJ
  email: string;
  status: 'pending_review';
  establishmentId?: number;
  redirectUrl: string; // URL to manager app for configuration
}

export class ConvertOnboardingLeadUseCase {
  constructor(
    private onboardingLeadRepository: OnboardingLeadRepository,
    private userRepository: UserRepository,
    private establishmentRepository: EstablishmentRepository,
    private eventBus: EventBus,
    private tracer?: unknown | null
  ) {}

  async execute(input: ConvertLeadInput): Promise<AppResult<ConvertLeadOutput>> {
    try {
      // 1. Get the onboarding lead
      const lead = await this.onboardingLeadRepository.findById(input.leadId);
      if (!lead) {
        return {
          success: false,
          error: {
            code: 'LEAD_NOT_FOUND',
            message: `Onboarding lead with ID ${input.leadId} not found`,
          },
        };
      }

      // Check if lead is already converted
      if (lead.isConverted()) {
        return {
          success: false,
          error: {
            code: 'LEAD_ALREADY_CONVERTED',
            message: 'This lead has already been converted to a user',
          },
        };
      }

      // 2. Generate temporary password if not provided
      const temporaryPassword = input.temporaryPassword || this.generateTemporaryPassword();

      // 3. Create Keycloak user
      const keycloakConfig = {
        url: ENV.KEYCLOAK_SERVER_URL,
        realm: ENV.KEYCLOAK_REALM,
        adminClientId: ENV.KEYCLOAK_ADMIN_CLIENT_ID,
        adminClientSecret: ENV.KEYCLOAK_ADMIN_CLIENT_SECRET,
        adminUsername: ENV.KEYCLOAK_ADMIN_USERNAME,
        adminPassword: ENV.KEYCLOAK_ADMIN_PASSWORD,
      };

      const keycloakAdmin = new KeycloakAdminService(keycloakConfig);
      const keycloakUserId = await keycloakAdmin.createUser({
        username: lead.document, // Use CPF/CNPJ as username
        email: lead.email,
        firstName: lead.name || '',
        lastName: '',
        password: temporaryPassword,
        enabled: true,
        emailVerified: false,
        attributes: {
          document_type: [lead.userType === 'company' ? 'cnpj' : 'cpf'],
          document: [lead.document],
        },
      });

      // 4. Determine user role and document type
      const documentType = lead.userType === 'company' ? 'cnpj' : 'cpf';
      const userRole = 'manager'; // New users start as managers of their own establishment

      // 5. Create local user record with pending_review status
      const user = UserEntity.create({
        name: lead.name || 'Usuário',
        email: lead.email,
        password: temporaryPassword, // Will be hashed by repository
        role: userRole,
        status: 'pending_review',
        documentType,
        document: lead.document,
        keycloakId: keycloakUserId,
      });

      const createdUser = await this.userRepository.create(user);

      // 6. Create establishment if company type
      let establishmentId: number | undefined;
      if (lead.userType === 'company' && lead.establishmentTypeId) {
        const establishment = EstablishmentEntity.create({
          name: lead.name || 'Novo Estabelecimento',
          horarioFuncionamento: '00:00-23:59',
          description: 'Estabelecimento em configuração',
          ownerId: createdUser.id,
          establishmentTypeId: lead.establishmentTypeId,
        });

        const createdEstablishment = await this.establishmentRepository.create(establishment);
        establishmentId = createdEstablishment.id;

        // Update user with establishment association
        createdUser.assignToEstablishment(establishmentId);
        await this.userRepository.update(createdUser);
      }

      // 7. Mark lead as converted
      lead.markAsConverted();
      await this.onboardingLeadRepository.update(lead);

      // 8. Publish event
      try {
        await this.eventBus.emit({
          type: 'onboarding.lead.converted',
          data: {
            leadId: lead.id,
            userId: createdUser.id,
            keycloakUserId,
            document: lead.document,
            email: lead.email,
          },
          timestamp: new Date(),
        });
      } catch (error) {
        console.warn('Failed to publish event:', error);
      }

      // 9. Return success with redirect URL
      return {
        success: true,
        data: {
          userId: createdUser.id,
          keycloakUserId,
          username: lead.document, // CPF or CNPJ for login
          email: lead.email,
          status: 'pending_review',
          establishmentId,
          redirectUrl: this.buildRedirectUrl(lead.document, temporaryPassword),
        },
      };
    } catch (error) {
      console.error('Error converting onboarding lead:', error);
      return {
        success: false,
        error: {
          code: 'CONVERSION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to convert onboarding lead',
        },
      };
    }
  }

  private generateTemporaryPassword(): string {
    // Generate a random temporary password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + '!'; // Add a special character
  }

  private buildRedirectUrl(username: string, password: string): string {
    const managerAppUrl = ENV.MANAGER_APP_URL || 'http://localhost:6174';
    // Encode credentials for auto-login (in production, use a token instead)
    return `${managerAppUrl}/onboarding/complete?u=${encodeURIComponent(username)}&p=${encodeURIComponent(password)}`;
  }
}
