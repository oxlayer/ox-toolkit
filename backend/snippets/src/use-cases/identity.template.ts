/**
 * Progressive Identity Use Cases
 *
 * Implements the Lead → User conversion flow with protected action detection.
 *
 * @example
 * ```typescript
 * import { ConvertLeadToUserUseCase } from '@oxlayer/snippets/use-cases';
 *
 * const useCase = new ConvertLeadToUserUseCase(keycloakService, leadRepo, userRepo);
 *
 * // When lead tries to checkout (protected action)
 * const result = await useCase.execute({
 *   leadId: 'lead_123',
 *   protectedAction: 'checkout',
 *   contactMethod: 'email', // or 'phone' for WhatsApp
 *   redirectUrl: 'https://app.example.com/checkout'
 * });
 *
 * // Returns magic link or OTP challenge
 * if (result.success) {
 *   // Send magic link/OTP to result.data.contactDestination
 * }
 * ```
 */

import type { AppResult } from './base.template.js';
import type { ProtectedActionType } from '../domain/identity.template.js';
import {
  Lead,
  AnonymousSession,
  PROTECTED_ACTIONS
} from '../domain/identity.template.js';

// ============================================================================
// INPUT/OUTPUT TYPES
// ============================================================================

/**
 * Input for converting lead to user
 */
export interface ConvertLeadToUserInput {
  leadId?: string;
  anonymousSessionId?: string;  // Alternative: convert from anonymous session
  protectedAction: ProtectedActionType;
  contactMethod?: 'email' | 'phone';
  redirectUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Output when conversion is initiated
 */
export interface ConvertLeadToUserOutput {
  leadId: string;
  userId?: string;              // Set if already converted
  keycloakUserId?: string;      // Set if Keycloak user exists
  conversionStatus: 'already_user' | 'initiated' | 'created' | 'completed';
  authChallenge?: {
    type: 'magic_link' | 'otp' | 'password';
    destination: string;        // Email or phone
    code?: string;              // OTP code (if generated)
    link?: string;              // Magic link (if generated)
    expiresAt: Date;
  };
  nextStep: 'verify' | 'complete_profile' | 'proceed';
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Lead repository interface
 */
export interface LeadRepository {
  findById(id: string): Promise<Lead | null>;
  findByEmail(email: string): Promise<Lead | null>;
  findByPhone(phone: string): Promise<Lead | null>;
  save(lead: Lead): Promise<void>;
}

/**
 * User repository interface (app-level, not Keycloak)
 */
export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByPhone(phone: string): Promise<IUser | null>;
  findByKeycloakId(keycloakId: string): Promise<IUser | null>;
  save(user: IUser): Promise<void>;
}

/**
 * User domain (simplified - you'd have your own)
 */
export interface IUser {
  id: string;
  keycloakUserId: string;
  email?: string;
  phone?: string;
  name?: string;
  roles: string[];
}

/**
 * Anonymous session repository
 */
export interface AnonymousSessionRepository {
  findById(id: string): Promise<AnonymousSession | null>;
  findBySessionId(sessionId: string): Promise<AnonymousSession | null>;
  save(session: AnonymousSession): Promise<void>;
}

/**
 * Keycloak service interface
 */
export interface KeycloakService {
  createUser(input: {
    email?: string;
    phone?: string;
    username?: string;
    enabled: boolean;
    attributes?: Record<string, string[]>;
  }): Promise<{ userId: string }>;

  sendMagicLink(userId: string, email: string, redirectUrl: string): Promise<{ link: string; expiresAt: Date }>;

  sendOTP(userId: string, phone: string): Promise<{ code: string; expiresAt: Date }>;

  generateVerificationToken(input: {
    userId: string;
    redirectUrl?: string;
    expiresIn?: number;
  }): Promise<{ token: string; expiresAt: Date }>;
}

// ============================================================================
// USE CASE: CONVERT LEAD TO USER
// ============================================================================

/**
 * Convert lead to user use case
 *
 * Handles the conversion from lead (known contact) to authenticated user (Keycloak).
 * Triggered when a lead attempts a protected action.
 */
export class ConvertLeadToUserUseCase {
  constructor(
    private readonly keycloakService: KeycloakService,
    private readonly leadRepo: LeadRepository,
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo?: AnonymousSessionRepository,
  ) {}

  async execute(input: ConvertLeadToUserInput): Promise<AppResult<ConvertLeadToUserOutput>> {
    // 1. Find the lead (or anonymous session)
    const lead = await this.findLead(input);
    if (!lead) {
      return {
        success: false,
        error: {
          code: 'LEAD_NOT_FOUND',
          message: 'Lead not found. Please provide contact information.',
        },
      };
    }

    // 2. Check if already converted
    if (lead.isConverted) {
      const existingUser = await this.userRepo.findByKeycloakId(lead.keycloakUserId!);
      if (existingUser) {
        return {
          success: true,
          data: {
            leadId: lead.id,
            userId: existingUser.id,
            keycloakUserId: lead.keycloakUserId,
            conversionStatus: 'already_user',
            nextStep: 'proceed',
          },
        };
      }
    }

    // 3. Check if user already exists with this contact
    const existingUser = await this.findExistingUser(lead);
    if (existingUser) {
      // Link lead to existing user
      lead.completeConversion(existingUser.keycloakUserId, existingUser.id);
      await this.leadRepo.save(lead);

      // Send auth challenge to verify
      const authChallenge = await this.sendAuthChallenge(existingUser.keycloakUserId, lead, input.redirectUrl);

      return {
        success: true,
        data: {
          leadId: lead.id,
          userId: existingUser.id,
          keycloakUserId: existingUser.keycloakUserId,
          conversionStatus: 'already_user',
          authChallenge,
          nextStep: 'verify',
        },
      };
    }

    // 4. Initiate conversion
    lead.initiateConversion();
    await this.leadRepo.save(lead);

    // 5. Create Keycloak user
    const keycloakUser = await this.keycloakService.createUser({
      email: lead.email,
      username: lead.email || lead.phone,
      enabled: true,
      attributes: {
        lead_id: [lead.id],
        channel: [lead.channel],
        source: [lead.source || 'direct'],
      },
    });

    // 6. Create app user
    const newUser: IUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      keycloakUserId: keycloakUser.userId,
      email: lead.email,
      phone: lead.phone,
      name: lead.name,
      roles: ['customer'], // Default role
    };
    await this.userRepo.save(newUser);

    // 7. Complete lead conversion
    lead.completeConversion(keycloakUser.userId, newUser.id);
    await this.leadRepo.save(lead);

    // 8. Send auth challenge (magic link or OTP)
    const authChallenge = await this.sendAuthChallenge(keycloakUser.userId, lead, input.redirectUrl);

    return {
      success: true,
      data: {
        leadId: lead.id,
        userId: newUser.id,
        keycloakUserId: keycloakUser.userId,
        conversionStatus: 'created',
        authChallenge,
        nextStep: 'verify',
      },
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async findLead(input: ConvertLeadToUserInput): Promise<Lead | null> {
    if (input.leadId) {
      return await this.leadRepo.findById(input.leadId);
    }

    if (input.anonymousSessionId && this.sessionRepo) {
      const session = await this.sessionRepo.findById(input.anonymousSessionId);
      if (session?.hasLead) {
        return await this.leadRepo.findById(session.leadId!);
      }
    }

    return null;
  }

  private async findExistingUser(lead: Lead): Promise<IUser | null> {
    if (lead.email) {
      const user = await this.userRepo.findByEmail(lead.email);
      if (user) return user;
    }

    if (lead.phone) {
      const user = await this.userRepo.findByPhone(lead.phone);
      if (user) return user;
    }

    return null;
  }

  private async sendAuthChallenge(
    keycloakUserId: string,
    lead: Lead,
    redirectUrl?: string
  ): Promise<ConvertLeadToUserOutput['authChallenge']> {
    // Prefer OTP for WhatsApp (phone), magic link for email
    if (lead.channel === 'whatsapp' || lead.channel === 'sms') {
      if (lead.phone) {
        const otp = await this.keycloakService.sendOTP(keycloakUserId, lead.phone);
        return {
          type: 'otp',
          destination: lead.phone,
          code: otp.code,
          expiresAt: otp.expiresAt,
        };
      }
    }

    if (lead.email) {
      const magicLink = await this.keycloakService.sendMagicLink(
        keycloakUserId,
        lead.email,
        redirectUrl || `${process.env.APP_URL}/auth/callback`
      );
      return {
        type: 'magic_link',
        destination: lead.email,
        link: magicLink.link,
        expiresAt: magicLink.expiresAt,
      };
    }

    throw new Error('No contact method available for auth challenge');
  }
}


// ============================================================================
// USE CASE: TRACK INTENT
// ============================================================================

/**
 * Track intent use case
 *
 * Records intent signals from anonymous users and leads.
 * Used to qualify leads and determine when to prompt for conversion.
 */
export class TrackIntentUseCase {
  constructor(
    private readonly leadRepo: LeadRepository,
    private readonly sessionRepo: AnonymousSessionRepository,
  ) {}

  async execute(input: {
    sessionId?: string;
    leadId?: string;
    intent: import('../domain/identity.template.js').IntentType;
    contactInfo?: {
      name?: string;
      email?: string;
      phone?: string;
    };
    metadata?: Record<string, unknown>;
  }): Promise<AppResult<{ leadId: string; intentScore: number; shouldConvert: boolean }>> {
    // 1. Find or create lead
    let lead: Lead;

    if (input.leadId) {
      const found = await this.leadRepo.findById(input.leadId);
      if (!found) {
        return { success: false, error: { code: 'LEAD_NOT_FOUND', message: 'Lead not found' } };
      }
      lead = found;
    } else if (input.sessionId) {
      const session = await this.sessionRepo.findBySessionId(input.sessionId);
      if (session?.hasLead) {
        const found = await this.leadRepo.findById(session.leadId!);
        if (found) {
          lead = found;
        } else {
          lead = this.createLeadFromSession(session, input.contactInfo);
        }
      } else {
        lead = this.createLeadFromContact(input);
      }
    } else {
      lead = this.createLeadFromContact(input);
    }

    // 2. Update contact info if provided
    if (input.contactInfo) {
      lead.updateContact(input.contactInfo);
      await this.leadRepo.save(lead);
    }

    // 3. Record intent
    lead.recordIntent(input.intent, input.metadata);
    await this.leadRepo.save(lead);

    // 4. Link session to lead
    if (input.sessionId) {
      const session = await this.sessionRepo.findBySessionId(input.sessionId);
      if (session && !session.hasLead) {
        session.linkToLead(lead.id);
        await this.sessionRepo.save(session);
      }
    }

    return {
      success: true,
      data: {
        leadId: lead.id,
        intentScore: lead.intentScore,
        shouldConvert: lead.canConvert,
      },
    };
  }

  private createLeadFromContact(input: { contactInfo?: { name?: string; email?: string; phone?: string } }): Lead {
    return Lead.create({
      name: input.contactInfo?.name,
      email: input.contactInfo?.email,
      phone: input.contactInfo?.phone,
      channel: 'web',
    });
  }

  private createLeadFromSession(
    session: AnonymousSession,
    contactInfo?: { name?: string; email?: string; phone?: string }
  ): Lead {
    return Lead.create({
      name: contactInfo?.name,
      email: contactInfo?.email,
      phone: contactInfo?.phone,
      channel: 'web',
      source: session.landingPage,
      utm: session.utm,
    });
  }
}


// ============================================================================
// MIDDLEWARE: PROTECTED ACTION DETECTION
// ============================================================================

/**
 * Protected action check result
 */
export interface ProtectedActionCheck {
  isProtected: boolean;
  isAuthenticated: boolean;
  isLead: boolean;
  canProceed: boolean;
  requiredAction?: 'convert_to_user' | 'authenticate' | 'upgrade_role';
  leadId?: string;
}

/**
 * Protected action checker
 *
 * Use in controllers/middleware to check if an action requires authentication
 * and trigger conversion flow if needed.
 */
export class ProtectedActionChecker {
  constructor(
    private readonly leadRepo: LeadRepository,
    private readonly sessionRepo?: AnonymousSessionRepository,
  ) {}

  async check(input: {
    action: string;
    anonymousSessionId?: string;
    authenticatedUserId?: string;
  }): Promise<ProtectedActionCheck> {
    const { action, anonymousSessionId, authenticatedUserId } = input;

    // 1. Check if action is protected
    const isProtected = action in PROTECTED_ACTIONS;
    if (!isProtected) {
      return { isProtected: false, isAuthenticated: false, isLead: false, canProceed: true };
    }

    // 2. If authenticated, check roles
    if (authenticatedUserId) {
      return {
        isProtected: true,
        isAuthenticated: true,
        isLead: false,
        canProceed: true,
      };
    }

    // 3. Check if anonymous session has a qualified lead
    if (anonymousSessionId && this.sessionRepo) {
      const session = await this.sessionRepo.findBySessionId(anonymousSessionId);
      if (session?.hasLead) {
        const lead = await this.leadRepo.findById(session.leadId!);
        if (lead?.canConvert) {
          return {
            isProtected: true,
            isAuthenticated: false,
            isLead: true,
            canProceed: false,
            requiredAction: 'convert_to_user',
            leadId: lead.id,
          };
        }
      }
    }

    // 4. Protected action, no auth, no qualified lead
    return {
      isProtected: true,
      isAuthenticated: false,
      isLead: false,
      canProceed: false,
      requiredAction: 'convert_to_user',
    };
  }
}
