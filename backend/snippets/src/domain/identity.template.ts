/**
 * Progressive Identity Domain Templates
 *
 * Implements the Anonymous → Lead → User progression model.
 *
 * Flow:
 * 1. Anonymous: Browser/device, no identity
 * 2. Lead: Known contact (email/phone), no Keycloak
 * 3. User: Keycloak-authenticated, protected actions
 *
 * @example
 * ```typescript
 * import { Lead, LeadStatus, LeadChannel } from '@oxlayer/snippets/domain';
 *
 * // Create a lead from WhatsApp
 * const lead = Lead.create({
 *   name: 'John Doe',
 *   phone: '+5511999999999',
 *   channel: 'whatsapp',
 *   source: 'inbound_message'
 * });
 *
 * // Lead shows intent (e.g., asks about pricing)
 * lead.recordIntent('pricing_inquiry', { product_id: 'prod_123' });
 *
 * // Later: convert to user when they want to buy
 * lead.convertToUser();
 * ```
 */

import { StatusEntityTemplate, TimestampedEntityTemplate } from './entity.template.js';

// ============================================================================
// LEAD DOMAIN
// ============================================================================

/**
 * Lead status progression
 */
export type LeadStatus =
  | 'new'           // Just created, no interaction yet
  | 'contacted'     // First response sent/received
  | 'engaged'       // Active conversation/interest
  | 'qualified'     // High intent, ready to convert
  | 'converting'    // In process of creating Keycloak user
  | 'converted'     // Successfully converted to user
  | 'lost';         // No longer interested

/**
 * Lead channel/source
 */
export type LeadChannel =
  | 'web'           // Website form/browse
  | 'whatsapp'      // WhatsApp conversation
  | 'sms'           // SMS conversation
  | 'email'         // Email thread
  | 'app'           // Mobile app
  | 'pwa'           // Progressive Web App
  | 'referral';     // Referred by someone

/**
 * Intent signal types
 */
export type IntentType =
  | 'view_pricing'
  | 'request_demo'
  | 'start_checkout'
  | 'add_to_cart'
  | 'schedule_call'
  | 'request_quote'
  | 'download_catalog'
  | 'subscribe_newsletter'
  | 'initiate_conversation';

/**
 * Lead properties interface
 */
export interface LeadProps {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status: LeadStatus;
  channel: LeadChannel;
  source?: string;              // UTM, referrer, etc.
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  referrer?: string;            // Person who referred them
  companyId?: string;           // If B2B

  // Intent tracking
  intentScore: number;          // 0-100, calculated from signals
  lastIntentAt?: Date;
  intentSignals: IntentSignal[];

  // Conversion tracking
  convertedAt?: Date;
  keycloakUserId?: string;      // Set when converted
  appUserId?: string;           // Set when converted

  // Metadata
  metadata: Record<string, unknown>;

  // Timestamps
  firstContactAt: Date;
  lastContactAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Intent signal - records lead behavior
 */
export interface IntentSignal {
  type: IntentType;
  timestamp: Date;
  score: number;                // Contribution to intent score
  metadata?: Record<string, unknown>;
}

/**
 * Lead aggregate root
 *
 * Manages the lead lifecycle from anonymous contact to converted user.
 */
export class Lead extends StatusEntityTemplate<LeadProps> {
  declare protected props: LeadProps;

  private constructor(props: LeadProps) {
    super(props.id);
    this.props = props;
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  // Note: 'id' is inherited from Entity base class as public readonly
  get name(): string | undefined { return this.props.name; }
  get email(): string | undefined { return this.props.email; }
  get phone(): string | undefined { return this.props.phone; }
  get status(): LeadStatus { return this.props.status; }
  get channel(): LeadChannel { return this.props.channel; }
  get source(): string | undefined { return this.props.source; }
  get referrer(): string | undefined { return this.props.referrer; }
  get keycloakUserId(): string | undefined { return this.props.keycloakUserId; }
  get appUserId(): string | undefined { return this.props.appUserId; }
  get intentScore(): number { return this.props.intentScore; }
  get isConverted(): boolean { return this.props.status === 'converted'; }
  get canConvert(): boolean {
    return ['qualified', 'engaged'].includes(this.props.status) &&
           !!this.props.email || !!this.props.phone;
  }
  get contactMethod(): 'email' | 'phone' | 'both' | 'none' {
    const hasEmail = !!this.props.email;
    const hasPhone = !!this.props.phone;
    if (hasEmail && hasPhone) return 'both';
    if (hasEmail) return 'email';
    if (hasPhone) return 'phone';
    return 'none';
  }

  // ==========================================================================
  // BUSINESS METHODS
  // ==========================================================================

  /**
   * Record an intent signal from the lead
   *
   * @example
   * ```typescript
   * lead.recordIntent('view_pricing', { product_id: '123' });
   * lead.recordIntent('start_checkout', { cart_value: 500 });
   * ```
   */
  recordIntent(type: IntentType, metadata?: Record<string, unknown>, score = 10): void {
    const signal: IntentSignal = {
      type,
      timestamp: new Date(),
      score,
      metadata,
    };

    this.props.intentSignals.push(signal);
    this.props.intentScore = Math.min(100, this.props.intentScore + score);
    this.props.lastIntentAt = signal.timestamp;
    this.props.lastContactAt = signal.timestamp;
    this.touch();

    // Auto-advance status based on intent score
    this.maybeAdvanceStatus();
  }

  /**
   * Update lead contact information
   */
  updateContact(info: { name?: string; email?: string; phone?: string }): void {
    if (info.name) this.props.name = info.name;
    if (info.email) this.props.email = info.email;
    if (info.phone) this.props.phone = info.phone;
    this.touch();
  }

  /**
   * Mark lead as qualified (high intent, ready for conversion)
   */
  qualify(): void {
    if (this.props.status === 'converted') {
      throw new Error('Cannot qualify a converted lead');
    }
    this.props.status = 'qualified';
    this.touch();
  }

  /**
   * Mark lead as lost (no longer interested)
   */
  markAsLost(reason?: string): void {
    if (this.props.status === 'converted') {
      throw new Error('Cannot mark a converted lead as lost');
    }
    this.props.status = 'lost';
    if (reason) {
      this.props.metadata.lostReason = reason;
    }
    this.touch();
  }

  /**
   * Initiate conversion to Keycloak user
   *
   * This is called when the lead performs a protected action.
   * Returns the contact method to use for authentication.
   */
  initiateConversion(): 'email' | 'phone' {
    if (!this.canConvert) {
      throw new Error('Lead cannot be converted: missing contact info or not qualified');
    }

    this.props.status = 'converting';
    this.touch();

    // Prefer email over phone if both available
    if (this.props.email) return 'email';
    if (this.props.phone) return 'phone';
    return 'email'; // fallback
  }

  /**
   * Complete conversion to user
   *
   * Called after successful Keycloak user creation
   */
  completeConversion(keycloakUserId: string, appUserId: string): void {
    if (this.props.status !== 'converting') {
      throw new Error('Lead must be in "converting" status to complete conversion');
    }

    this.props.status = 'converted';
    this.props.convertedAt = new Date();
    this.props.keycloakUserId = keycloakUserId;
    this.props.appUserId = appUserId;
    this.touch();
  }

  /**
   * Re-engagement - reactivate a lost/old lead
   */
  reengage(): void {
    if (this.props.status === 'converted') {
      throw new Error('Cannot re-engage a converted lead');
    }
    this.props.status = 'engaged';
    this.touch();
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private maybeAdvanceStatus(): void {
    // Auto-advance based on intent score and signals
    if (this.props.intentScore >= 50 && this.props.status === 'new') {
      this.props.status = 'contacted';
    }
    if (this.props.intentScore >= 70 && this.props.status === 'contacted') {
      this.props.status = 'engaged';
    }
    if (this.props.intentScore >= 90 && this.props.status === 'engaged') {
      this.props.status = 'qualified';
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  // ==========================================================================
  // FACTORY METHODS
  // ==========================================================================

  /**
   * Create a new lead from first contact
   *
   * @example
   * ```typescript
   * // From WhatsApp inbound message
   * const lead = Lead.create({
   *   phone: '+5511999999999',
   *   channel: 'whatsapp',
   *   source: 'inbound_message'
   * });
   *
   * // From web form
   * const lead = Lead.create({
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   channel: 'web',
   *   source: 'landing_page_form',
   *   utm: { source: 'google', medium: 'cpc' }
   * });
   * ```
   */
  static create(input: {
    name?: string;
    email?: string;
    phone?: string;
    channel: LeadChannel;
    source?: string;
    utm?: LeadProps['utm'];
    referrer?: string;
    companyId?: string;
  }): Lead {
    const now = new Date();
    return new Lead({
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      status: 'new',
      channel: input.channel,
      source: input.source,
      utm: input.utm,
      referrer: input.referrer,
      companyId: input.companyId,
      intentScore: 0,
      intentSignals: [],
      metadata: {},
      firstContactAt: now,
      lastContactAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: LeadProps): Lead {
    return new Lead(props);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, unknown> {
    return { ...this.props };
  }
}


// ============================================================================
// PROTECTED ACTION DOMAIN
// ============================================================================

/**
 * Protected action types that require authentication
 *
 * These are the "hard boundaries" that trigger Lead → User conversion.
 */
export type ProtectedActionType =
  | 'checkout'                // Purchase/payment
  | 'place_order'             // Order placement
  | 'view_orders'             // Order history
  | 'view_dashboard'          // Private dashboard
  | 'peer_messaging'          // User-to-user messaging
  | 'api_access'              // API key access
  | 'subscription_manage'     // Manage subscriptions
  | 'profile_update'          // Update personal data
  | 'document_upload'         // Upload documents
  | 'payment_method_add'      // Add payment method
  | 'shipping_address_add'    // Add shipping address;

/**
 * Protected action definition
 */
export interface ProtectedAction {
  type: ProtectedActionType;
  requiresAuth: true;
  allowedRoles?: string[];     // If empty, any authenticated user can do it
  allowedForLead?: boolean;    // Some actions allowed for leads with high intent
  metadata?: Record<string, unknown>;
}

/**
 * Protected action registry
 *
 * Central place to define what requires authentication.
 */
export const PROTECTED_ACTIONS: Record<ProtectedActionType, ProtectedAction> = {
  checkout: {
    type: 'checkout',
    requiresAuth: true,
    allowedForLead: false,     // Must be authenticated user
  },
  place_order: {
    type: 'place_order',
    requiresAuth: true,
    allowedForLead: false,
  },
  view_orders: {
    type: 'view_orders',
    requiresAuth: true,
    allowedForLead: false,
  },
  view_dashboard: {
    type: 'view_dashboard',
    requiresAuth: true,
    allowedForLead: false,
  },
  peer_messaging: {
    type: 'peer_messaging',
    requiresAuth: true,
    allowedForLead: false,
  },
  api_access: {
    type: 'api_access',
    requiresAuth: true,
    allowedRoles: ['admin', 'developer'],
  },
  subscription_manage: {
    type: 'subscription_manage',
    requiresAuth: true,
    allowedForLead: false,
  },
  profile_update: {
    type: 'profile_update',
    requiresAuth: true,
    allowedForLead: false,
  },
  document_upload: {
    type: 'document_upload',
    requiresAuth: true,
    allowedForLead: false,
  },
  payment_method_add: {
    type: 'payment_method_add',
    requiresAuth: true,
    allowedForLead: false,
  },
  shipping_address_add: {
    type: 'shipping_address_add',
    requiresAuth: true,
    allowedForLead: true,     // High-intent leads can do this
  },
};

/**
 * Check if an action requires authentication
 */
export function isProtectedAction(action: string): action is ProtectedActionType {
  return action in PROTECTED_ACTIONS;
}

/**
 * Get protected action definition
 */
export function getProtectedAction(type: ProtectedActionType): ProtectedAction {
  return PROTECTED_ACTIONS[type];
}


// ============================================================================
// ANONYMOUS SESSION DOMAIN
// ============================================================================

/**
 * Anonymous session properties
 */
export interface AnonymousSessionProps {
  id: string;
  sessionId: string;           // Browser session ID
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;

  // Tracking
  pageViews: number;
  lastPageView?: string;
  referrer?: string;
  landingPage?: string;

  // Lead association (if converted to lead)
  leadId?: string;

  // UTM tracking
  utm?: LeadProps['utm'];

  // Timestamps
  firstSeenAt: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Anonymous session aggregate
 *
 * Tracks anonymous users before they become leads.
 */
export class AnonymousSession extends TimestampedEntityTemplate<AnonymousSessionProps> {
  declare protected props: AnonymousSessionProps;

  private constructor(props: AnonymousSessionProps) {
    super(props.id);
    this.props = props;
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  // Note: 'id' is inherited from Entity base class as public readonly
  get sessionId(): string { return this.props.sessionId; }
  get leadId(): string | undefined { return this.props.leadId; }
  get deviceFingerprint(): string | undefined { return this.props.deviceFingerprint; }
  get ipAddress(): string | undefined { return this.props.ipAddress; }
  get userAgent(): string | undefined { return this.props.userAgent; }
  get referrer(): string | undefined { return this.props.referrer; }
  get landingPage(): string | undefined { return this.props.landingPage; }
  get utm(): LeadProps['utm'] | undefined { return this.props.utm; }
  get expiresAt(): Date { return this.props.expiresAt; }
  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }
  get hasLead(): boolean { return !!this.props.leadId; }

  // ==========================================================================
  // BUSINESS METHODS
  // ==========================================================================

  /**
   * Record a page view
   */
  recordPageView(url: string): void {
    this.props.pageViews++;
    this.props.lastPageView = url;
    this.props.lastSeenAt = new Date();
    this.touch();
  }

  /**
   * Link to a lead
   */
  linkToLead(leadId: string): void {
    this.props.leadId = leadId;
    this.touch();
  }

  /**
   * Extend session expiration
   */
  extendSession(durationMs: number): void {
    this.props.expiresAt = new Date(Date.now() + durationMs);
    this.touch();
  }

  // ==========================================================================
  // FACTORY METHODS
  // ==========================================================================

  /**
   * Create a new anonymous session
   */
  static create(input: {
    sessionId: string;
    deviceFingerprint?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    landingPage?: string;
    utm?: LeadProps['utm'];
    ttlMs?: number;             // Time to live, default 24h
  }): AnonymousSession {
    const now = new Date();
    const ttl = input.ttlMs ?? 24 * 60 * 60 * 1000; // 24 hours default

    return new AnonymousSession({
      id: `anon_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      sessionId: input.sessionId,
      deviceFingerprint: input.deviceFingerprint,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      pageViews: 0,
      referrer: input.referrer,
      landingPage: input.landingPage,
      utm: input.utm,
      firstSeenAt: now,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + ttl),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: AnonymousSessionProps): AnonymousSession {
    return new AnonymousSession(props);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): Record<string, unknown> {
    return { ...this.props };
  }
}
