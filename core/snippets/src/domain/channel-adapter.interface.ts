/**
 * Channel Adapter Interface
 *
 * Abstracts all communication channels (web, WhatsApp, Telegram, SMS, email, voice, mobile app)
 * behind a unified interface. The channel is just the "pipe" - the identity progression
 * (Anonymous → Lead → User) is the same for all channels.
 *
 * @example
 * ```typescript
 * import { ChannelAdapter, ChannelType } from '@oxlayer/snippets';
 *
 * // All channels implement this interface
 * class WhatsAppChannelAdapter implements ChannelAdapter {
 *   readonly channelType: ChannelType = 'whatsapp';
 *   readonly capabilities: ChannelCapabilities = { ... };
 *
 *   async sendMessage(message: ChannelOutboundMessage) { ... }
 *   async sendAuthChallenge(identifier, challenge) { ... }
 *   // ...
 * }
 * ```
 */

// ============================================================================
// CHANNEL TYPES
// ============================================================================

/**
 * All supported channel types
 */
export type ChannelType =
  | 'web'           // Browser/webapp with sessions
  | 'whatsapp'      // WhatsApp Business API
  | 'telegram'      // Telegram Bot API
  | 'sms'           // SMS (Twilio, etc.)
  | 'email'         // Email (SendGrid, Postmark, etc.)
  | 'voice'         // Voice call (Twilio Voice, etc.)
  | 'mobile_app';   // Native mobile app

/**
 * Authentication methods per channel
 *
 * Different channels support different authentication mechanisms.
 */
export type ChannelAuthMethod =
  | 'otp'                // One-time password (SMS, WhatsApp, Telegram)
  | 'magic_link'         // Email magic link
  | 'voice_verification' // Phone call with spoken code
  | 'push_notification'  // Mobile app push with verification
  | 'session_cookie'     // Web session cookie
  | 'biometric';         // Mobile biometric (Face ID, fingerprint)

// ============================================================================
// CHANNEL IDENTIFIERS
// ============================================================================

/**
 * Web channel identifier
 */
export interface WebIdentifier {
  type: 'web';
  sessionId: string;
  deviceFingerprint?: string;
}

/**
 * WhatsApp channel identifier
 */
export interface WhatsAppIdentifier {
  type: 'whatsapp';
  phoneNumber: string;  // E.164 format: +15551234567
}

/**
 * Telegram channel identifier
 */
export interface TelegramIdentifier {
  type: 'telegram';
  telegramId: string | number;  // Telegram user ID
  username?: string;  // @username
}

/**
 * SMS channel identifier
 */
export interface SMSIdentifier {
  type: 'sms';
  phoneNumber: string;  // E.164 format
}

/**
 * Email channel identifier
 */
export interface EmailIdentifier {
  type: 'email';
  emailAddress: string;
}

/**
 * Voice channel identifier
 */
export interface VoiceIdentifier {
  type: 'voice';
  phoneNumber: string;  // E.164 format
}

/**
 * Mobile app channel identifier
 */
export interface MobileAppIdentifier {
  type: 'mobile_app';
  deviceId: string;
  pushToken?: string;
  platform?: 'ios' | 'android';
}

/**
 * Discriminated union of all channel identifiers
 */
export type ChannelIdentifier =
  | WebIdentifier
  | WhatsAppIdentifier
  | TelegramIdentifier
  | SMSIdentifier
  | EmailIdentifier
  | VoiceIdentifier
  | MobileAppIdentifier;

// ============================================================================
// CHANNEL CAPABILITIES
// ============================================================================

/**
 * What each channel can do
 *
 * Different channels have different capabilities that affect how we
 * handle authentication and messaging.
 */
export interface ChannelCapabilities {
  /**
   * Can user reply to our messages?
   *
   * Two-way channels allow inline OTP verification (user replies with code).
   * One-way channels require user to visit a URL/app.
   */
  supportsTwoWay: boolean;

  /**
   * Can we send rich media (images, files, interactive elements)?
   *
   * Affects how we format messages and verification UI.
   */
  supportsRichMedia: boolean;

  /**
   * Can authentication be asynchronous?
   *
   * If true, we can send OTP and user verifies later (SMS, email).
   * If false, verification is inline (WhatsApp, Telegram webapp).
   */
  supportsAsyncAuth: boolean;

  /**
   * Preferred auth method for this channel
   *
   * Best balance of UX and security for this channel.
   */
  preferredAuthMethod: ChannelAuthMethod;

  /**
   * Fallback auth methods if preferred fails
   *
   * Alternative methods supported by this channel.
   */
  fallbackAuthMethods: ChannelAuthMethod[];
}

// ============================================================================
// MESSAGE FORMATS
// ============================================================================

/**
 * Unified outbound message format
 *
 * Same structure works for ALL channels.
 */
export interface ChannelOutboundMessage {
  to: ChannelIdentifier;
  content: {
    text?: string;              // Plain text (all channels)
    html?: string;              // HTML for email
    mediaUrl?: string;          // Image/file URL
    templateId?: string;        // Structured message template
    templateData?: Record<string, unknown>;  // Template variables
  };
  metadata?: {
    sessionId?: string;         // For linking to web session
    correlationId?: string;      // For tracing
    conversationId?: string;     // For messaging channels
    expiresAt?: Date;           // For OTP/links
    quickReplies?: string[];     // Interactive buttons (WhatsApp, Telegram)
  };
}

/**
 * Unified inbound message format
 *
 * Normalized format for receiving messages from ANY channel.
 */
export interface ChannelInboundMessage {
  from: ChannelIdentifier;
  channel: ChannelType;
  content: {
    text?: string;
    payload?: string;           // Button click, form submission, etc.
    mediaUrl?: string;
  };
  timestamp: Date;
  metadata?: {
    messageId?: string;          // Provider message ID
    conversationId?: string;
    referrer?: string;           // For web
    userAgent?: string;          // For web
    ipAddress?: string;          // For web
  };
}

// ============================================================================
// AUTH CHALLENGE
// ============================================================================

/**
 * Auth challenge payload
 *
 * Sent through channel to verify user identity.
 */
export interface ChannelAuthChallenge {
  type: ChannelAuthMethod;
  destination: string;          // Email address, phone number, etc.
  code?: string;                // OTP code (for otp, voice_verification)
  link?: string;                // Magic link (for magic_link, push_notification)
  expiresAt: Date;
  instructions?: string;        // User-friendly instructions
  metadata?: Record<string, unknown>;
}

// ============================================================================
// CONTACT INFO
// ============================================================================

/**
 * Contact information extracted from channel identifier
 *
 * Used for lead creation and user lookup.
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  deviceId?: string;
  username?: string;
}

// ============================================================================
// CHANNEL ADAPTER INTERFACE
// ============================================================================

/**
 * Channel adapter interface
 *
 * ALL channel adapters must implement this interface.
 * This abstraction allows the same identity flow to work across all channels.
 *
 * @example
 * ```typescript
 * class WhatsAppChannelAdapter implements ChannelAdapter {
 *   readonly channelType: ChannelType = 'whatsapp';
 *   readonly capabilities: ChannelCapabilities = {
 *     supportsTwoWay: true,
 *     supportsRichMedia: true,
 *     supportsAsyncAuth: false,
 *     preferredAuthMethod: 'otp',
 *     fallbackAuthMethods: ['voice_verification'],
 *   };
 *
 *   async sendMessage(message: ChannelOutboundMessage) { ... }
 *   async sendAuthChallenge(identifier, challenge) { ... }
 *   async verifyAuthChallenge(identifier, response) { ... }
 *   extractContactInfo(identifier) { ... }
 * }
 * ```
 */
export interface ChannelAdapter {
  /**
   * Channel type identifier
   */
  readonly channelType: ChannelType;

  /**
   * What this channel can do
   */
  readonly capabilities: ChannelCapabilities;

  /**
   * Extract normalized identifier from raw channel data
   *
   * Converts channel-specific request format to ChannelIdentifier.
   *
   * @example
   * ```typescript
   * // WhatsApp: { from: '+15551234567' } → WhatsAppIdentifier
   * // Web: { cookie: 'session=abc', headers: { ... } } → WebIdentifier
   * ```
   */
  extractIdentifier(rawData: unknown): Promise<ChannelIdentifier>;

  /**
   * Normalize identifier to canonical string form
   *
   * Used for:
   * - Looking up existing identities
   * - Storing in database
   * - Cross-channel linking
   *
   * @example
   * ```typescript
   * // WhatsApp: '+1 (555) 123-4567' → 'whatsapp:+15551234567'
   * // Email: 'User@Example.COM' → 'email:user@example.com'
   * ```
   */
  normalizeIdentifier(identifier: ChannelIdentifier): string;

  /**
   * Send message through this channel
   *
   * @returns Message ID for tracking, or error
   */
  sendMessage(message: ChannelOutboundMessage): Promise<ChannelMessageResult>;

  /**
   * Send auth challenge through this channel
   *
   * Sends OTP, magic link, or other verification method.
   *
   * @returns Challenge delivery result
   */
  sendAuthChallenge(
    identifier: ChannelIdentifier,
    challenge: ChannelAuthChallenge
  ): Promise<ChannelMessageResult>;

  /**
   * Verify auth challenge response (optional)
   *
   * Some channels (WhatsApp, Telegram) can verify OTP inline
   * when user replies with the code. Other channels require
   * separate verification endpoint.
   *
   * @returns Verification result with normalized identifier
   */
  verifyAuthChallenge?(
    identifier: ChannelIdentifier,
    response: string
  ): Promise<ChannelVerificationResult>;

  /**
   * Check if identifier is valid for this channel
   *
   * @example
   * ```typescript
   * // WhatsApp: Valid phone number in E.164 format
   * // Email: Valid email address format
   * ```
   */
  isValidIdentifier(identifier: ChannelIdentifier): boolean;

  /**
   * Extract contact info from identifier
   *
   * Returns email, phone, or device ID for lead creation
   * and user lookup.
   */
  extractContactInfo(identifier: ChannelIdentifier): ContactInfo;
}

// ============================================================================
// RESULT TYPES
// ============================================================================

/**
 * Result of sending a message through a channel
 */
export interface ChannelMessageResult {
  success: boolean;
  messageId?: string;  // Provider message ID for tracking
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of verifying an auth challenge
 */
export interface ChannelVerificationResult {
  valid: boolean;
  identifier?: string;  // Normalized identifier if valid
  error?: string;
}

// ============================================================================
// CHANNEL REGISTRY
// ============================================================================

/**
 * Channel adapter registry
 *
 * Manages all available channel adapters.
 */
export class ChannelAdapterRegistry {
  private adapters = new Map<ChannelType, ChannelAdapter>();

  register(adapter: ChannelAdapter): void {
    this.adapters.set(adapter.channelType, adapter);
  }

  get(channelType: ChannelType): ChannelAdapter | undefined {
    return this.adapters.get(channelType);
  }

  has(channelType: ChannelType): boolean {
    return this.adapters.has(channelType);
  }

  getAll(): ChannelAdapter[] {
    return Array.from(this.adapters.values());
  }

  getSupportedChannels(): ChannelType[] {
    return Array.from(this.adapters.keys());
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get channel type from identifier
 */
export function getChannelType(identifier: ChannelIdentifier): ChannelType {
  return identifier.type;
}

/**
 * Check if channel is messaging (two-way communication)
 */
export function isMessagingChannel(channelType: ChannelType): boolean {
  return ['whatsapp', 'telegram', 'web', 'mobile_app'].includes(channelType);
}

/**
 * Check if channel is async (one-way communication)
 */
export function isAsyncChannel(channelType: ChannelType): boolean {
  return ['email', 'sms', 'voice'].includes(channelType);
}

/**
 * Check if channel requires device identifier
 */
export function requiresDeviceId(channelType: ChannelType): boolean {
  return ['web', 'mobile_app'].includes(channelType);
}
