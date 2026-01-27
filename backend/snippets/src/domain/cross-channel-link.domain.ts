/**
 * Cross-Channel Link Domain
 *
 * Handles linking the same person across multiple channels.
 *
 * Use cases:
 * - User starts on web (anonymous session)
 * - User messages on WhatsApp with same phone number
 * - System links both channels to same identity
 * - User can now continue seamlessly across channels
 *
 * @example
 * ```typescript
 * import { CrossChannelLinkingService } from '@oxlayer/snippets';
 *
 * const linking = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);
 *
 * // Explicit link (user confirms they own both channels)
 * await linking.explicitLink({
 *   primaryIdentityId: 'identity_123',
 *   newChannel: 'whatsapp',
 *   newIdentifier: '+15551234567',
 *   verificationMethod: 'otp'
 * });
 *
 * // Inferred link (system detects same email/phone)
 * await linking.inferLinkFromContact({
 *   channel: 'whatsapp',
 *   identifier: '+15551234567',
 *   email: 'user@example.com'  // Same email as web user
 * });
 * ```
 */

import type { ChannelType } from './channel-adapter.interface.js';
import type { AppResult } from '../use-cases/base.template.js';
import type { LinkedChannel, LinkMethod } from './unified-identity.context.js';

// ============================================================================
// CROSS-CHANNEL LINK ENTITY
// ============================================================================

/**
 * Cross-channel link
 *
 * Represents when we detect the same person on multiple channels.
 */
export interface CrossChannelLink {
  /**
   * Primary identity ID
   *
   * The canonical identity that links all channels together.
   * Could be a user_id, lead_id, or a synthetic identity_id.
   */
  primaryIdentityId: string;

  /**
   * The linked channel
   */
  linkedChannel: LinkedChannel;

  /**
   * Evidence for this link
   *
   * Why we think this is the same person.
   */
  linkEvidence: LinkEvidence;

  /**
   * Timestamps
   */
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Evidence for linking channels
 *
 * Why we think these are the same person.
 */
export interface LinkEvidence {
  /**
   * Method used to detect the link
   */
  method: LinkMethod;

  /**
   * Confidence score (0-1)
   *
   * How sure are we this is the same person?
   * - 1.0 = Explicit verification (user confirmed)
   * - 0.9+ = Strong inference (matching unique identifier like email)
   * - 0.7+ = Medium inference (matching phone, similar behavior)
   * - 0.5+ = Weak inference (similar patterns, time windows)
   */
  confidence: number;

  /**
   * When this evidence was verified
   */
  verifiedAt?: Date;

  /**
   * Additional evidence details
   */
  details?: {
    matchField?: 'email' | 'phone' | 'deviceId' | 'behavior';
    matchValue?: string;
    additionalSignals?: string[];
  };
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Cross-channel link repository
 */
export interface CrossChannelLinkRepository {
  /**
   * Find all links for a primary identity
   */
  findByPrimaryIdentity(identityId: string): Promise<CrossChannelLink[]>;

  /**
   * Find link by channel identifier
   */
  findByIdentifier(channel: ChannelType, identifier: string): Promise<CrossChannelLink | null>;

  /**
   * Find all identities that have this channel
   */
  findByChannel(channel: ChannelType, identifier: string): Promise<CrossChannelLink[]>;

  /**
   * Save a link (create or update)
   */
  save(link: CrossChannelLink): Promise<void>;

  /**
   * Delete a link
   */
  delete(primaryIdentityId: string, channel: ChannelType, identifier: string): Promise<void>;

  /**
   * Find potential matches for linking
   *
   * For inference - find identities that might be the same person.
   */
  findPotentialMatches(input: {
    email?: string;
    phone?: string;
    deviceId?: string;
    confidenceThreshold?: number;
  }): Promise<CrossChannelLink[]>;
}

// ============================================================================
// CROSS-CHANNEL LINKING SERVICE
// ============================================================================

/**
 * Cross-channel linking service
 *
 * Handles linking identities when the same person appears on multiple channels.
 *
 * Linking strategies:
 * 1. **EXPLICIT**: User confirms they own both identifiers (e.g., verifies OTP on both channels)
 * 2. **INFERRED**: System infers based on matching contact info (email/phone)
 *
 * @example
 * ```typescript
 * const linking = new CrossChannelLinkingService(linkRepo, leadRepo, userRepo);
 *
 * // Explicit link (highest confidence)
 * const result = await linking.explicitLink({
 *   primaryIdentityId: 'user_123',
 *   newChannel: 'whatsapp',
 *   newIdentifier: '+15551234567',
 *   verificationMethod: 'otp'
 * });
 *
 * // Inferred link (from matching contact)
 * const link = await linking.inferLinkFromContact({
 *   channel: 'whatsapp',
 *   identifier: '+15551234567',
 *   email: 'user@example.com'
 * });
 *
 * // Get all channels for an identity
 * const channels = await linking.getLinkedChannels('user_123');
 * ```
 */
export class CrossChannelLinkingService {
  constructor(
    private readonly linkRepo: CrossChannelLinkRepository,
    private readonly contactRepo: IContactRepository,
    private readonly userRepo: IUserRepositoryRef,
  ) {}

  /**
   * Explicitly link channels
   *
   * User confirms they own both identifiers (e.g., verifies OTP on both channels).
   * This creates a HIGH confidence link.
   *
   * @example
   * ```typescript
   * // User on web wants to link their WhatsApp
   * // 1. Send OTP to WhatsApp
   * // 2. User replies with correct OTP
   * // 3. Call explicitLink
   * const result = await linking.explicitLink({
   *   primaryIdentityId: 'user_123',
   *   newChannel: 'whatsapp',
   *   newIdentifier: '+15551234567',
   *   verificationMethod: 'otp'
   * });
   * ```
   */
  async explicitLink(input: {
    primaryIdentityId: string;
    newChannel: ChannelType;
    newIdentifier: string;
    verificationMethod: 'otp' | 'magic_link' | 'biometric';
  }): Promise<AppResult<{ linkId: string }>> {
    // 1. Check if link already exists
    const existing = await this.linkRepo.findByIdentifier(
      input.newChannel,
      input.newIdentifier
    );

    if (existing && existing.primaryIdentityId === input.primaryIdentityId) {
      // Already linked to this identity
      return {
        success: true,
        data: { linkId: existing.primaryIdentityId },
      };
    }

    if (existing && existing.primaryIdentityId !== input.primaryIdentityId) {
      // Already linked to DIFFERENT identity
      return {
        success: false,
        error: {
          code: 'ALREADY_LINKED',
          message: 'This identifier is already linked to another account',
        },
      };
    }

    // 2. Create new high-confidence link
    const link: CrossChannelLink = {
      primaryIdentityId: input.primaryIdentityId,
      linkedChannel: {
        channelType: input.newChannel,
        identifier: input.newIdentifier,
        linkedAt: new Date(),
        confidence: 'high',
        linkMethod: 'explicit',
        verifiedAt: new Date(),
      },
      linkEvidence: {
        method: 'explicit',
        confidence: 1.0,
        verifiedAt: new Date(),
        details: {
          matchField: this.getMatchFieldForChannel(input.newChannel),
          matchValue: input.newIdentifier,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.linkRepo.save(link);

    return {
      success: true,
      data: { linkId: link.primaryIdentityId },
    };
  }

  /**
   * Infer link based on matching contact info
   *
   * When we see the same email/phone on different channels, infer they're the same person.
   * Creates a MEDIUM confidence link that can be promoted to EXPLICIT later.
   *
   * @example
   * ```typescript
   * // User messages on WhatsApp
   * // System finds existing lead/user with same phone
   * const link = await linking.inferLinkFromContact({
   *   channel: 'whatsapp',
   *   identifier: '+15551234567',
   *   phone: '+15551234567'
   * });
   *
   * // Later, user verifies OTP - upgrade to explicit
   * await linking.explicitLink({ ... });
   * ```
   */
  async inferLinkFromContact(input: {
    channel: ChannelType;
    identifier: string;
    email?: string;
    phone?: string;
    deviceId?: string;
  }): Promise<CrossChannelLink | null> {
    if (!input.email && !input.phone && !input.deviceId) {
      return null; // Nothing to match on
    }

    // 1. Search for existing identity with matching contact
    let existingIdentity: string | null = null;
    let matchField: 'email' | 'phone' | 'deviceId' | null = null;

    // Check users first (highest confidence)
    if (input.email) {
      const user = await this.userRepo.findByEmail(input.email);
      if (user) {
        existingIdentity = user.id;
        matchField = 'email';
      }
    }

    // Then check contacts
    if (!existingIdentity && input.email) {
      const contact = await this.contactRepo.findByEmail(input.email);
      if (contact) {
        existingIdentity = contact.id;
        matchField = 'email';
      }
    }

    if (!existingIdentity && input.phone) {
      const contact = await this.contactRepo.findByPhone(input.phone);
      if (contact) {
        existingIdentity = contact.id;
        matchField = 'phone';
      }
    }

    if (!existingIdentity) {
      return null; // No match found
    }

    // 2. Check if link already exists
    const existing = await this.linkRepo.findByIdentifier(input.channel, input.identifier);
    if (existing && existing.primaryIdentityId === existingIdentity) {
      return existing; // Already linked
    }

    // 3. Create inferred link
    const confidence = matchField === 'email' ? 0.9 : matchField === 'phone' ? 0.7 : 0.5;

    const link: CrossChannelLink = {
      primaryIdentityId: existingIdentity,
      linkedChannel: {
        channelType: input.channel,
        identifier: input.identifier,
        linkedAt: new Date(),
        confidence: confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low',
        linkMethod: 'inferred',
      },
      linkEvidence: {
        method: 'inferred',
        confidence,
        details: {
          matchField: matchField || undefined,
          matchValue: matchField === 'email' ? input.email : matchField === 'phone' ? input.phone : input.deviceId,
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.linkRepo.save(link);

    return link;
  }

  /**
   * Get all linked channels for an identity
   *
   * Returns all channels this person uses.
   *
   * @example
   * ```typescript
   * const channels = await linking.getLinkedChannels('user_123');
   * // Returns:
   * // [
   * //   { channelType: 'web', identifier: 'web:session_abc', ... },
   * //   { channelType: 'whatsapp', identifier: 'whatsapp:+15551234567', ... }
   * // ]
   * ```
   */
  async getLinkedChannels(identityId: string): Promise<LinkedChannel[]> {
    const links = await this.linkRepo.findByPrimaryIdentity(identityId);
    return links.map(l => l.linkedChannel);
  }

  /**
   * Unlink a channel
   *
   * User explicitly removes a channel from their account.
   *
   * @example
   * ```typescript
   * await linking.unlink({
   *   identityId: 'user_123',
   *   channel: 'whatsapp',
   *   identifier: '+15551234567'
   * });
   * ```
   */
  async unlink(input: {
    identityId: string;
    channel: ChannelType;
    identifier: string;
  }): Promise<void> {
    await this.linkRepo.delete(input.identityId, input.channel, input.identifier);
  }

  /**
   * Promote inferred link to explicit
   *
   * When user verifies ownership of a channel, upgrade the link confidence.
   *
   * @example
   * ```typescript
   * // Link was previously inferred from matching email
   * // User now verifies OTP on WhatsApp
   * await linking.promoteToExplicit({
   *   identityId: 'user_123',
   *   channel: 'whatsapp',
   *   identifier: '+15551234567'
   * });
   * ```
   */
  async promoteToExplicit(input: {
    identityId: string;
    channel: ChannelType;
    identifier: string;
  }): Promise<AppResult<{ promoted: boolean }>> {
    const link = await this.linkRepo.findByIdentifier(input.channel, input.identifier);

    if (!link || link.primaryIdentityId !== input.identityId) {
      return {
        success: false,
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'No link found to promote',
        },
      };
    }

    if (link.linkedChannel.linkMethod === 'explicit') {
      return {
        success: true,
        data: { promoted: false }, // Already explicit
      };
    }

    // Upgrade to explicit
    link.linkedChannel.linkMethod = 'explicit';
    link.linkedChannel.confidence = 'high';
    link.linkedChannel.verifiedAt = new Date();
    link.linkEvidence.method = 'explicit';
    link.linkEvidence.confidence = 1.0;
    link.linkEvidence.verifiedAt = new Date();
    link.updatedAt = new Date();

    await this.linkRepo.save(link);

    return {
      success: true,
      data: { promoted: true },
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private getMatchFieldForChannel(channel: ChannelType): 'email' | 'phone' | 'deviceId' {
    if (channel === 'email') return 'email';
    if (['whatsapp', 'telegram', 'sms', 'voice'].includes(channel)) return 'phone';
    if (['web', 'mobile_app'].includes(channel)) return 'deviceId';
    return 'email'; // default
  }
}

// ============================================================================
// REPOSITORY STUBS (for reference)
// ============================================================================

/**
 * Contact repository interface
 * NOTE: These are placeholder interfaces - actual repositories should be in your app layer
 *
 * IMPORTANT: A Contact is an external person (not a User, not a Lead)
 * Examples: HR candidates, survey recipients, external users with external_user_id
 */
export interface IContactRepository {
  findById(id: string): Promise<IContact | null>;
  findByEmail(email: string): Promise<IContact | null>;
  findByPhone(phone: string): Promise<IContact | null>;
  findByExternalUserId(externalUserId: string, tenantId: string): Promise<IContact | null>;
}

/**
 * User repository interface (app-level cache of Keycloak users)
 * NOTE: This is only a reference table. The truth is in Keycloak.
 */
export interface IUserRepositoryRef {
  findById(id: string): Promise<IUserRef | null>;
  findByKeycloakId(keycloakId: string): Promise<IUserRef | null>;
  findByEmail(email: string): Promise<IUserRef | null>;
}

/**
 * Contact entity (stub)
 * External person that exists independently of your system
 */
export interface IContact {
  id: string;
  tenantId?: string;
  externalUserId?: string;  // External user ID from client system
  name?: string;
  email?: string;
  phone?: string;
  source?: string;  // hr_import, whatsapp, csv, etc.
}

/**
 * User reference entity (stub)
 * App-level cache of Keycloak user. The truth is in Keycloak.
 */
export interface IUserRef {
  id: string;
  keycloakUserId: string;
  email?: string;
  phone?: string;
  tenantId?: string;
}
