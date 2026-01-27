/**
 * Unified Identity Context
 *
 * Single identity context that works across ALL channels.
 *
 * The key insight: regardless of whether the user comes from web, WhatsApp,
 * Telegram, SMS, email, voice, or mobile app - the identity progression is
 * the same: Anonymous → Lead → User.
 *
 * @example
 * ```typescript
 * import { UnifiedIdentityContext, IdentityState } from '@oxlayer/snippets';
 *
 * // In middleware/controller
 * const identity: UnifiedIdentityContext = c.get('identity');
 *
 * if (identity.state === 'user') {
 *   // Fully authenticated, full access
 * } else if (identity.state === 'lead' && identity.lead.canConvert) {
 *   // High-intent lead, trigger conversion
 * } else {
 *   // Anonymous, show public content
 * }
 * ```
 */

import type { ChannelType, ChannelIdentifier } from './channel-adapter.interface.js';
import type { LeadStatus } from './identity.template.js';

// ============================================================================
// IDENTITY STATE
// ============================================================================

/**
 * Progressive identity states
 *
 * Represents where a user is in their journey from anonymous to authenticated.
 */
export type IdentityState =
  | 'anonymous'    // No identity, just browsing
  | 'identified'   // Has identifier (session, device) but no lead yet
  | 'lead'         // Has lead (known contact), not converted
  | 'converting'   // In process of converting to user
  | 'user';        // Fully authenticated (Keycloak user)

// ============================================================================
// LINKED CHANNELS
// ============================================================================

/**
 * Linked channel information
 *
 * Tracks when the same person appears on multiple channels.
 */
export interface LinkedChannel {
  channelType: ChannelType;
  identifier: string;      // Normalized identifier
  linkedAt: Date;
  confidence: 'high' | 'medium' | 'low';  // How sure are we it's the same person?
  linkMethod: 'explicit' | 'inferred';     // User confirmed or system inferred?
  verifiedAt?: Date;      // When user explicitly confirmed this link
}

/**
 * Link method
 */
export type LinkMethod =
  | 'explicit'     // User confirmed (e.g., verified OTP on both channels)
  | 'inferred';    // System inferred (e.g., matching email/phone)

/**
 * Link confidence
 */
export type LinkConfidence = 'high' | 'medium' | 'low';

// ============================================================================
// LEAD SNAPSHOT (from context)
// ============================================================================

/**
 * Lead information snapshot
 *
 * Subset of lead data stored in identity context for quick access.
 */
export interface LeadSnapshot {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  status: LeadStatus;
  intentScore: number;
  canConvert: boolean;
  channel: ChannelType;       // Channel where lead was created
  source?: string;
}

// ============================================================================
// USER SNAPSHOT (from context)
// ============================================================================

/**
 * User information snapshot
 *
 * Subset of user data stored in identity context for quick access.
 */
export interface UserSnapshot {
  id: string;
  keycloakUserId: string;
  email?: string;
  phone?: string;
  name?: string;
  roles: string[];
}

// ============================================================================
// ANONYMOUS SESSION SNAPSHOT
// ============================================================================

/**
 * Anonymous session snapshot
 *
 * Anonymous user session data.
 */
export interface AnonymousSessionSnapshot {
  sessionId: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  hasLead: boolean;
  leadId?: string;
}

// ============================================================================
// UNIFIED IDENTITY CONTEXT
// ============================================================================

/**
 * Unified identity context
 *
 * This is THE main object that flows through your application.
 * It works identically whether the user came from web, WhatsApp,
 * Telegram, SMS, email, voice, or mobile app.
 *
 * @example
 * ```typescript
 * // In middleware (after progressiveIdentityMiddleware)
 * const identity: UnifiedIdentityContext = c.get('identity');
 *
 * // Check state
 * if (identity.state === 'user') {
 *   // Do user stuff
 * } else if (identity.state === 'lead') {
 *   // Do lead stuff
 * }
 *
 * // Get channel info
 * console.log(identity.channel);      // 'whatsapp', 'web', etc.
 * console.log(identity.channelIdentifier);  // Normalized identifier
 *
 * // Get linked channels
 * console.log(identity.linkedChannels);  // Other channels this person uses
 * ```
 */
export interface UnifiedIdentityContext {
  // ========================================================================
  // CURRENT STATE
  // ========================================================================

  /**
   * Current identity state
   *
   * - anonymous: Just browsing, no identity
   * - identified: Has session/device but no lead yet
   * - lead: Has lead (known contact), not converted
   * - converting: In process of converting to user
   * - user: Fully authenticated
   */
  state: IdentityState;

  // ========================================================================
  // CHANNEL INFORMATION
  // ========================================================================

  /**
   * Channel type for this request
   *
   * Where is this request coming from?
   */
  channel: ChannelType;

  /**
   * Normalized channel identifier
   *
   * Canonical string representation for:
   * - Database lookups
   * - Cross-channel linking
   * - Caching keys
   *
   * Examples:
   * - web:session_abc:fingerprint_xyz
   * - whatsapp:+15551234567
   * - email:user@example.com
   * - telegram:123456789
   */
  channelIdentifier: string;

  /**
   * Raw channel identifier (for adapter use)
   */
  rawIdentifier?: ChannelIdentifier;

  // ========================================================================
  // ANONYMOUS SESSION (if anonymous)
  // ========================================================================

  /**
   * Anonymous session data
   *
   * Present when state is 'anonymous' or 'identified'.
   */
  anonymousSession?: AnonymousSessionSnapshot;

  // ========================================================================
  // LEAD INFORMATION (if lead or converting)
  // ========================================================================

  /**
   * Lead data
   *
   * Present when state is 'lead' or 'converting'.
   */
  lead?: LeadSnapshot;

  // ========================================================================
  // USER INFORMATION (if user)
  // ========================================================================

  /**
   * User data
   *
   * Present when state is 'user'.
   */
  user?: UserSnapshot;

  // ========================================================================
  // CROSS-CHANNEL LINKS
  // ========================================================================

  /**
   * Other channels this person uses
   *
   * When we detect the same person across channels (e.g., same email
   * on web and WhatsApp), we link them here.
   *
   * @example
   * ```typescript
   * // User first came via web
   * // Later, they message on WhatsApp with same email
   * // Now linkedChannels includes both:
   * [
   *   { channelType: 'web', identifier: 'web:session_abc', ... },
   *   { channelType: 'whatsapp', identifier: 'whatsapp:+15551234567', ... }
   * ]
   * ```
   */
  linkedChannels?: LinkedChannel[];

  // ========================================================================
  // METADATA
  // ========================================================================

  /**
   * Tracking metadata
   */
  metadata: {
    firstSeenAt: Date;       // When we first saw this person
    lastSeenAt: Date;        // When we last saw this person
    source?: string;         // UTM source, referrer, etc.
    referrer?: string;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
  };
}

// ============================================================================
// CONTEXT BUILDERS
// ============================================================================

/**
 * Create anonymous identity context
 */
export function createAnonymousIdentityContext(input: {
  channel: ChannelType;
  channelIdentifier: string;
  rawIdentifier?: ChannelIdentifier;
  session?: {
    sessionId: string;
    deviceFingerprint?: string;
    expiresAt: Date;
  };
  metadata?: {
    referrer?: string;
    utm?: UnifiedIdentityContext['metadata']['utm'];
  };
}): UnifiedIdentityContext {
  const now = new Date();

  return {
    state: 'anonymous',
    channel: input.channel,
    channelIdentifier: input.channelIdentifier,
    rawIdentifier: input.rawIdentifier,
    anonymousSession: input.session ? {
      sessionId: input.session.sessionId,
      deviceFingerprint: input.session.deviceFingerprint,
      expiresAt: input.session.expiresAt,
      hasLead: false,
    } : undefined,
    metadata: {
      firstSeenAt: now,
      lastSeenAt: now,
      referrer: input.metadata?.referrer,
      utm: input.metadata?.utm,
    },
  };
}

/**
 * Create lead identity context
 */
export function createLeadIdentityContext(input: {
  channel: ChannelType;
  channelIdentifier: string;
  rawIdentifier?: ChannelIdentifier;
  lead: LeadSnapshot;
  linkedChannels?: LinkedChannel[];
  metadata?: {
    source?: string;
    referrer?: string;
    utm?: UnifiedIdentityContext['metadata']['utm'];
  };
}): UnifiedIdentityContext {
  const now = new Date();

  return {
    state: input.lead.canConvert ? 'lead' : 'identified',
    channel: input.channel,
    channelIdentifier: input.channelIdentifier,
    rawIdentifier: input.rawIdentifier,
    lead: input.lead,
    linkedChannels: input.linkedChannels,
    metadata: {
      firstSeenAt: input.lead.status === 'new' ? now : now, // TODO: load from DB
      lastSeenAt: now,
      source: input.metadata?.source || input.lead.source,
      referrer: input.metadata?.referrer,
      utm: input.metadata?.utm,
    },
  };
}

/**
 * Create user identity context
 */
export function createUserIdentityContext(input: {
  channel: ChannelType;
  channelIdentifier: string;
  rawIdentifier?: ChannelIdentifier;
  user: UserSnapshot;
  linkedChannels?: LinkedChannel[];
  metadata?: {
    source?: string;
    referrer?: string;
    utm?: UnifiedIdentityContext['metadata']['utm'];
  };
}): UnifiedIdentityContext {
  const now = new Date();

  return {
    state: 'user',
    channel: input.channel,
    channelIdentifier: input.channelIdentifier,
    rawIdentifier: input.rawIdentifier,
    user: input.user,
    linkedChannels: input.linkedChannels,
    metadata: {
      firstSeenAt: now, // TODO: load from DB
      lastSeenAt: now,
      source: input.metadata?.source,
      referrer: input.metadata?.referrer,
      utm: input.metadata?.utm,
    },
  };
}

// ============================================================================
// CONTEXT HELPERS
// ============================================================================

/**
 * Check if identity can perform protected action
 */
export function canPerformProtectedAction(context: UnifiedIdentityContext): boolean {
  return context.state === 'user';
}

/**
 * Check if identity should be prompted to convert
 */
export function shouldPromptForConversion(context: UnifiedIdentityContext): boolean {
  return (
    context.state === 'lead' &&
    context.lead?.canConvert === true &&
    context.lead.intentScore >= 70
  );
}

/**
 * Check if identity is authenticated
 */
export function isAuthenticated(context: UnifiedIdentityContext): boolean {
  return context.state === 'user';
}

/**
 * Check if identity is known (not anonymous)
 */
export function isKnown(context: UnifiedIdentityContext): boolean {
  return ['identified', 'lead', 'converting', 'user'].includes(context.state);
}

/**
 * Get contact info from context
 */
export function getContactInfo(context: UnifiedIdentityContext): {
  email?: string;
  phone?: string;
  name?: string;
} {
  if (context.user) {
    return {
      email: context.user.email,
      phone: context.user.phone,
      name: context.user.name,
    };
  }

  if (context.lead) {
    return {
      email: context.lead.email,
      phone: context.lead.phone,
      name: context.lead.name,
    };
  }

  return {};
}
