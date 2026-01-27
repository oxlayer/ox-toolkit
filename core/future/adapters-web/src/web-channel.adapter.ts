/**
 * Web Channel Adapter
 *
 * Handles browser-based interactions with:
 * - Session cookies for tracking
 * - Device fingerprinting for anonymous users
 * - Magic links for authentication
 * - Email verification
 *
 * @example
 * ```typescript
 * import { WebChannelAdapter } from '@oxlayer/capabilities-adapters-web';
 *
 * const adapter = new WebChannelAdapter({
 *   sessionStore: new SessionStore(),
 *   emailService: new EmailService(),
 *   fingerprintService: new FingerprintService(),
 * });
 * ```
 */

import type {
  ChannelAdapter,
  ChannelType,
  ChannelIdentifier,
  ChannelCapabilities,
  ChannelOutboundMessage,
  ChannelAuthChallenge,
  ChannelMessageResult,
  ContactInfo,
} from '@oxlayer/snippets';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Web channel adapter configuration
 */
export interface WebChannelAdapterOptions {
  /**
   * Session store for managing web sessions
   */
  sessionStore: SessionStore;

  /**
   * Email service for sending magic links
   */
  emailService: EmailService;

  /**
   * Optional device fingerprinting service
   */
  fingerprintService?: FingerprintService;

  /**
   * Session TTL in milliseconds
   * @default 24 hours
   */
  sessionTtl?: number;
}

/**
 * Session store interface
 *
 * Implement this with your session storage (Redis, database, etc.)
 */
export interface SessionStore {
  /**
   * Get session data
   */
  get(sessionId: string): Promise<SessionData | null>;

  /**
   * Set session data
   */
  set(sessionId: string, data: SessionData): Promise<void>;

  /**
   * Delete session
   */
  delete(sessionId: string): Promise<void>;

  /**
   * Generate new session ID
   */
  generateId(): string;
}

/**
 * Session data structure
 */
export interface SessionData {
  userId?: string;
  leadId?: string;
  email?: string;
  phone?: string;
  deviceFingerprint?: string;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Email service interface
 *
 * Implement this with your email provider (SendGrid, Postmark, etc.)
 */
export interface EmailService {
  /**
   * Send email
   */
  send(input: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): Promise<{ messageId: string }>;

  /**
   * Send magic link email
   */
  sendMagicLink(input: {
    email: string;
    link: string;
    expiresIn?: number;
  }): Promise<{ messageId: string }>;
}

/**
 * Device fingerprint service interface (optional)
 *
 * Implement this with FingerprintJS or similar
 */
export interface FingerprintService {
  /**
   * Generate fingerprint from request data
   */
  generate(requestData: {
    userAgent?: string;
    ipAddress?: string;
    canvas?: string;
    webgl?: string;
  }): string;

  /**
   * Verify fingerprint matches
   */
  verify(fingerprint: string, requestData: unknown): boolean;
}

// ============================================================================
// WEB CHANNEL ADAPTER
// ============================================================================

/**
 * Web channel adapter
 *
 * Implements ChannelAdapter for web/browser interactions.
 */
export class WebChannelAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'web';

  readonly capabilities: ChannelCapabilities = {
    supportsTwoWay: true,       // Via AJAX/websocket
    supportsRichMedia: true,     // Full HTML/CSS
    supportsAsyncAuth: true,     // Magic link is async
    preferredAuthMethod: 'magic_link',
    fallbackAuthMethods: ['otp', 'session_cookie'],
  };

  private readonly sessionTtl: number;

  constructor(private readonly options: WebChannelAdapterOptions) {
    this.sessionTtl = options.sessionTtl ?? 24 * 60 * 60 * 1000; // 24 hours default
  }

  // ========================================================================
  // ChannelAdapter implementation
  // ========================================================================

  /**
   * Extract identifier from web request
   */
  async extractIdentifier(rawData: unknown): Promise<ChannelIdentifier> {
    const data = rawData as WebRequestData;

    return {
      type: 'web',
      sessionId: data.sessionId || data.cookie?.session_id || this.options.sessionStore.generateId(),
      deviceFingerprint: data.deviceFingerprint || (data.fingerprintData
        ? this.options.fingerprintService?.generate(data.fingerprintData)
        : undefined
      ),
    };
  }

  /**
   * Normalize web identifier
   *
   * Format: web:{sessionId}:{fingerprint}
   */
  normalizeIdentifier(identifier: ChannelIdentifier): string {
    if (identifier.type !== 'web') {
      throw new Error('Invalid identifier type for WebChannelAdapter');
    }

    const parts = [
      'web',
      identifier.sessionId,
      identifier.deviceFingerprint || 'unknown',
    ];

    return parts.join(':');
  }

  /**
   * Send message through web channel
   *
   * For web, this means:
   * - Email (if templateId is 'email_notification')
   * - Session storage (for in-app notifications)
   */
  async sendMessage(message: ChannelOutboundMessage): Promise<ChannelMessageResult> {
    // Email notification
    if (message.content.templateId === 'email_notification' || message.content.html) {
      const email = await this.extractEmail(message.to);

      if (!email) {
        return {
          success: false,
          error: 'No email address found for recipient',
        };
      }

      const result = await this.options.emailService.send({
        to: email,
        subject: message.content.text ?? 'Notification',
        html: message.content.html,
        text: message.content.text,
      });

      return {
        success: true,
        messageId: result?.messageId,
      };
    }

    // Store in session for in-app display
    if (message.metadata?.sessionId) {
      await this.options.sessionStore.set(message.metadata.sessionId, {
        notification: message.content,
      } as unknown as SessionData);
    }

    return {
      success: true,
      messageId: `web_notification_${Date.now()}`,
    };
  }

  /**
   * Send auth challenge via web channel
   *
   * Primarily uses magic links sent via email.
   */
  async sendAuthChallenge(
    identifier: ChannelIdentifier,
    challenge: ChannelAuthChallenge
  ): Promise<ChannelMessageResult> {
    if (challenge.type === 'magic_link') {
      const email = await this.extractEmail(identifier);

      if (!email) {
        return {
          success: false,
          error: 'No email address found for magic link',
        };
      }

      const result = await this.options.emailService.sendMagicLink({
        email,
        link: challenge.link ?? '',
        expiresIn: Math.floor((challenge.expiresAt.getTime() - Date.now()) / 1000),
      });

      return {
        success: true,
        messageId: result?.messageId,
      };
    }

    if (challenge.type === 'otp') {
      // Store OTP in session for in-app verification
      if (identifier.type === 'web') {
        await this.options.sessionStore.set(identifier.sessionId, {
          otp: challenge.code,
          otpExpiresAt: challenge.expiresAt,
          expiresAt: new Date(Date.now() + this.sessionTtl),
        } as unknown as SessionData);
      }

      return {
        success: true,
        messageId: `web_otp_${Date.now()}`,
      };
    }

    return {
      success: false,
      error: `Unsupported auth method for web: ${challenge.type}`,
    };
  }

  /**
   * Verify auth challenge response
   *
   * For web, this verifies OTP stored in session.
   */
  async verifyAuthChallenge(
    identifier: ChannelIdentifier,
    response: string
  ): Promise<{ valid: boolean; identifier?: string; error?: string }> {
    if (identifier.type !== 'web') {
      return { valid: false, error: 'Invalid identifier type' };
    }

    const session = await this.options.sessionStore.get(identifier.sessionId);

    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    const otp = (session as any).otp;
    const otpExpiresAt = (session as any).otpExpiresAt;

    if (!otp || !otpExpiresAt) {
      return { valid: false, error: 'No OTP pending' };
    }

    if (new Date() > otpExpiresAt) {
      return { valid: false, error: 'OTP expired' };
    }

    if (otp !== response) {
      return { valid: false, error: 'Invalid OTP' };
    }

    // Clear OTP after successful verification
    await this.options.sessionStore.set(identifier.sessionId, {
      ...session,
      otp: undefined,
      otpExpiresAt: undefined,
    } as unknown as SessionData);

    return {
      valid: true,
      identifier: this.normalizeIdentifier(identifier),
    };
  }

  /**
   * Validate web identifier
   */
  isValidIdentifier(identifier: ChannelIdentifier): boolean {
    return identifier.type === 'web' && !!identifier.sessionId;
  }

  /**
   * Extract contact info from web identifier
   *
   * Web sessions may have email/phone attached.
   */
  extractContactInfo(identifier: ChannelIdentifier): ContactInfo {
    if (identifier.type !== 'web') {
      return {};
    }

    // Would need to load from session to get email/phone
    // For now, return empty - this should be populated from session data
    return {
      deviceId: identifier.deviceFingerprint,
    };
  }

  // ========================================================================
  // PRIVATE HELPERS
  // ========================================================================

  /**
   * Extract email from channel identifier
   *
   * Loads from session store if available.
   */
  private async extractEmail(identifier: ChannelIdentifier): Promise<string | undefined> {
    if (identifier.type !== 'web') {
      return undefined;
    }

    const session = await this.options.sessionStore.get(identifier.sessionId);
    return session?.email;
  }
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Web request data structure
 */
export interface WebRequestData {
  sessionId?: string;
  cookie?: Record<string, string>;
  deviceFingerprint?: string;
  fingerprintData?: {
    userAgent?: string;
    ipAddress?: string;
    canvas?: string;
    webgl?: string;
  };
}
