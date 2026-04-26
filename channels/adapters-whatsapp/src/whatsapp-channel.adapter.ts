/**
 * WhatsApp Channel Adapter
 *
 * Implements ChannelAdapter interface for WhatsApp Business API.
 * Handles WhatsApp-specific messaging and OTP authentication.
 *
 * @example
 * ```typescript
 * import { WhatsAppChannelAdapter } from '@oxlayer/capabilities-adapters-whatsapp';
 *
 * const adapter = new WhatsAppChannelAdapter({
 *   messageService: new TwilioWhatsAppService(),
 *   conversationRepo: new WhatsAppConversationRepository(),
 * });
 *
 * // Send auth challenge (OTP via WhatsApp)
 * await adapter.sendAuthChallenge(
 *   { type: 'whatsapp', phoneNumber: '+15551234567' },
 *   { type: 'otp', destination: '+15551234567', code: '123456', expiresAt: ... }
 * );
 *
 * // Verify OTP from user reply
 * const result = await adapter.verifyAuthChallenge(
 *   { type: 'whatsapp', phoneNumber: '+15551234567' },
 *   '123456'
 * );
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
  ChannelVerificationResult,
  ContactInfo,
} from '@oxlayer/snippets';

// ============================================================================
// TYPES
// ============================================================================

/**
 * WhatsApp channel adapter configuration
 */
export interface WhatsAppChannelAdapterOptions {
  /**
   * WhatsApp message service
   *
   * Implement this with your WhatsApp provider (Twilio, Meta, etc.)
   */
  messageService: WhatsAppMessageService;

  /**
   * WhatsApp conversation repository (optional)
   *
   * For tracking conversation state and OTP.
   */
  conversationRepo?: WhatsAppConversationRepository;
}

/**
 * WhatsApp message service interface
 *
 * Implement this with your WhatsApp provider.
 */
export interface WhatsAppMessageService {
  /**
   * Send text message
   */
  sendMessage(message: {
    to: string;           // E.164 phone number
    body: string;
    conversationId?: string;
  }): Promise<{ messageId: string }>;

  /**
   * Send template message
   */
  sendTemplate(message: {
    to: string;
    templateId: string;
    templateData?: Record<string, string>;
  }): Promise<{ messageId: string }>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature?(payload: unknown, signature: string): boolean;
}

/**
 * WhatsApp conversation repository interface
 *
 * For tracking conversation state and OTP.
 */
export interface WhatsAppConversationRepository {
  findByPhoneNumber(phone: string): Promise<WhatsAppConversation | null>;
  findByConversationId(convId: string): Promise<WhatsAppConversation | null>;
  save(conv: WhatsAppConversation): Promise<void>;
}

/**
 * WhatsApp conversation aggregate
 *
 * Tracks WhatsApp conversation state including OTP verification.
 */
export class WhatsAppConversation {
  private props: WhatsAppConversationProps;

  private constructor(props: WhatsAppConversationProps) {
    this.props = props;
  }

  get id(): string { return this.props.id; }
  get phoneNumber(): string { return this.props.phoneNumber; }
  get state(): WhatsAppConversationState { return this.props.state; }
  get isAuthenticated(): boolean {
    return this.props.state === 'verified' || this.props.state === 'converted';
  }
  get hasOtpPending(): boolean {
    return this.props.state === 'otp_sent' &&
           this.props.lastOtpExpiresAt &&
           new Date() < this.props.lastOtpExpiresAt;
  }

  /**
   * Record an inbound message
   */
  recordMessage(): void {
    this.props.messageCount++;
    this.props.lastMessageAt = new Date();
    this.touch();
  }

  /**
   * Transition to new state
   */
  transitionTo(newState: WhatsAppConversationState): void {
    this.props.state = newState;
    this.touch();
  }

  /**
   * Store OTP code
   */
  setOtp(code: string, expiresAt: Date): void {
    this.props.lastOtpCode = code;
    this.props.lastOtpExpiresAt = expiresAt;
    this.props.otpAttempts = 0;
    this.transitionTo('otp_sent');
  }

  /**
   * Verify OTP code
   */
  verifyOtp(code: string): boolean {
    if (!this.hasOtpPending) return false;
    if (this.props.lastOtpCode !== code) return false;

    this.props.lastOtpCode = undefined;
    this.props.lastOtpExpiresAt = undefined;
    this.transitionTo('verified');
    return true;
  }

  /**
   * Record failed OTP attempt
   */
  recordFailedOtpAttempt(): void {
    this.props.otpAttempts++;
    if (this.props.otpAttempts >= 3) {
      // Reset after too many attempts
      this.props.lastOtpCode = undefined;
      this.props.lastOtpExpiresAt = undefined;
      this.transitionTo('engaged');
    }
    this.touch();
  }

  /**
   * Link to user after conversion
   */
  linkToUser(keycloakUserId: string, appUserId: string): void {
    this.props.keycloakUserId = keycloakUserId;
    this.props.appUserId = appUserId;
    this.transitionTo('converted');
  }

  /**
   * Link to lead
   */
  linkToLead(leadId: string): void {
    this.props.leadId = leadId;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  // ==========================================================================
  // FACTORY METHODS
  // ==========================================================================

  static create(input: {
    phoneNumber: string;
    conversationId: string;
  }): WhatsAppConversation {
    const now = new Date();
    return new WhatsAppConversation({
      id: `wa_conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      phoneNumber: input.phoneNumber,
      conversationId: input.conversationId,
      state: 'new',
      otpAttempts: 0,
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: WhatsAppConversationProps): WhatsAppConversation {
    return new WhatsAppConversation(props);
  }

  toPersistence(): WhatsAppConversationProps {
    return { ...this.props };
  }
}

/**
 * WhatsApp conversation properties
 */
export interface WhatsAppConversationProps {
  id: string;
  phoneNumber: string;
  conversationId: string;
  state: WhatsAppConversationState;
  leadId?: string;
  lastOtpCode?: string;
  lastOtpExpiresAt?: Date;
  otpAttempts: number;
  keycloakUserId?: string;
  appUserId?: string;
  lastMessageAt?: Date;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * WhatsApp conversation state
 */
export type WhatsAppConversationState =
  | 'new'
  | 'greeting'
  | 'engaged'
  | 'otp_sent'
  | 'verified'
  | 'converted';

// ============================================================================
// WHATSAPP CHANNEL ADAPTER
// ============================================================================

/**
 * WhatsApp channel adapter
 *
 * Implements ChannelAdapter for WhatsApp Business API.
 */
export class WhatsAppChannelAdapter implements ChannelAdapter {
  readonly channelType: ChannelType = 'whatsapp';

  readonly capabilities: ChannelCapabilities = {
    supportsTwoWay: true,       // Users can reply with OTP
    supportsRichMedia: true,     // Images, audio, documents
    supportsAsyncAuth: false,    // OTP is synchronous (user replies)
    preferredAuthMethod: 'otp',
    fallbackAuthMethods: ['voice_verification'],
  };

  constructor(private readonly options: WhatsAppChannelAdapterOptions) {}

  // ========================================================================
  // ChannelAdapter implementation
  // ========================================================================

  /**
   * Extract identifier from WhatsApp request data
   */
  async extractIdentifier(rawData: unknown): Promise<ChannelIdentifier> {
    const data = rawData as WhatsAppRequestData;

    return {
      type: 'whatsapp',
      phoneNumber: normalizePhoneNumber(data.phoneNumber || data.from || data.phone_number),
    };
  }

  /**
   * Normalize WhatsApp identifier
   *
   * Format: whatsapp:{phoneNumber}
   * Phone number is normalized to E.164 format.
   */
  normalizeIdentifier(identifier: ChannelIdentifier): string {
    if (identifier.type !== 'whatsapp') {
      throw new Error('Invalid identifier type for WhatsAppChannelAdapter');
    }

    return `whatsapp:${identifier.phoneNumber}`;
  }

  /**
   * Send message through WhatsApp
   */
  async sendMessage(message: ChannelOutboundMessage): Promise<ChannelMessageResult> {
    if (message.to.type !== 'whatsapp') {
      return { success: false, error: 'Invalid channel identifier' };
    }

    const phoneNumber = message.to.phoneNumber;

    try {
      const result = await this.options.messageService.sendMessage({
        to: phoneNumber,
        body: message.content.text || '',
        conversationId: message.metadata?.conversationId as string,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
      };
    }
  }

  /**
   * Send auth challenge (OTP) via WhatsApp
   *
   * Sends OTP code via WhatsApp message.
   */
  async sendAuthChallenge(
    identifier: ChannelIdentifier,
    challenge: ChannelAuthChallenge
  ): Promise<ChannelMessageResult> {
    if (identifier.type !== 'whatsapp') {
      return { success: false, error: 'Invalid identifier type' };
    }

    if (challenge.type !== 'otp') {
      return { success: false, error: 'WhatsApp only supports OTP auth method' };
    }

    const phoneNumber = identifier.phoneNumber;
    const message = `Your verification code is: *${challenge.code}*`;

    try {
      const result = await this.options.messageService.sendMessage({
        to: phoneNumber,
        body: message,
      });

      // Store OTP in conversation if repo available
      if (this.options.conversationRepo) {
        const conv = await this.options.conversationRepo.findByPhoneNumber(phoneNumber);

        if (conv) {
          conv.setOtp(challenge.code!, challenge.expiresAt);
          await this.options.conversationRepo.save(conv);
        }
      }

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send OTP via WhatsApp',
      };
    }
  }

  /**
   * Verify auth challenge response
   *
   * Verifies OTP code from user's WhatsApp reply.
   */
  async verifyAuthChallenge(
    identifier: ChannelIdentifier,
    response: string
  ): Promise<ChannelVerificationResult> {
    if (identifier.type !== 'whatsapp') {
      return { valid: false, error: 'Invalid identifier type' };
    }

    if (!this.options.conversationRepo) {
      return {
        valid: false,
        error: 'No conversation repo configured - cannot verify OTP',
      };
    }

    const phoneNumber = identifier.phoneNumber;
    const conv = await this.options.conversationRepo.findByPhoneNumber(phoneNumber);

    if (!conv) {
      return { valid: false, error: 'Conversation not found' };
    }

    const isValid = conv.verifyOtp(response);
    if (isValid) {
      await this.options.conversationRepo.save(conv);
      return {
        valid: true,
        identifier: this.normalizeIdentifier(identifier),
      };
    }

    conv.recordFailedOtpAttempt();
    await this.options.conversationRepo.save(conv);

    return { valid: false, error: 'Invalid or expired OTP' };
  }

  /**
   * Validate WhatsApp identifier
   */
  isValidIdentifier(identifier: ChannelIdentifier): boolean {
    return identifier.type === 'whatsapp' && isValidE164Number(identifier.phoneNumber);
  }

  /**
   * Extract contact info from WhatsApp identifier
   */
  extractContactInfo(identifier: ChannelIdentifier): ContactInfo {
    if (identifier.type !== 'whatsapp') {
      return {};
    }

    return {
      phone: identifier.phoneNumber,
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize phone number to E.164 format
 *
 * @example
 * normalizePhoneNumber('11999999999', '55') // '+5511999999999'
 * normalizePhoneNumber('+55 11 99999-9999') // '+5511999999999'
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode = '55'): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if missing
  if (!cleaned.startsWith('00') && !cleaned.startsWith('+')) {
    // Check if it already has country code
    if (cleaned.length === 11 && cleaned.startsWith('9')) {
      // Brazilian mobile without country code (9 + 10 digits)
      cleaned = defaultCountryCode + cleaned;
    } else if (cleaned.length === 10) {
      // Brazilian landline without country code
      cleaned = defaultCountryCode + cleaned;
    }
  }

  // Remove leading 00 from international format
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  }

  // Add + if missing
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Validate E.164 phone number format
 */
function isValidE164Number(phone: string): boolean {
  // E.164 format: +[country code][subscriber number]
  // Minimum: +[1 digit][1 digit] = 3 chars
  // Maximum: +[15 digits][15 digits] = 31 chars (theoretical)
  const e164Pattern = /^\+[1-9]\d{1,14}$/;
  return e164Pattern.test(phone);
}

// ============================================================================
// TYPES (for backward compatibility with existing code)
// ============================================================================

/**
 * @deprecated Use ChannelInboundMessage instead
 */
export interface WhatsAppInboundMessage {
  from: string;
  to: string;
  message: string;
  conversationId: string;
  timestamp?: Date;
  metadata?: {
    message_id?: string;
    referrer_id?: string;
  };
}

/**
 * @deprecated Use ChannelOutboundMessage instead
 */
export interface WhatsAppOutboundMessage {
  to: string;
  message: string;
  conversationId?: string;
  metadata?: {
    template_id?: string;
    quick_replies?: string[];
  };
}

/**
 * WhatsApp request data structure
 */
export interface WhatsAppRequestData {
  phoneNumber?: string;
  from?: string;
  phone_number?: string;
  conversationId?: string;
}

// ============================================================================
// EXPORTS (for backward compatibility)
// ============================================================================

/**
 * WhatsApp → Keycloak Identity Bridge
 *
 * @deprecated Use WhatsAppChannelAdapter + ConvertLeadToUserUseCase instead
 * Kept for backward compatibility.
 */
export class WhatsAppIdentityBridge {
  constructor(
    public readonly messageService: WhatsAppMessageService,
    public readonly conversationRepo: WhatsAppConversationRepository,
    public readonly leadRepo: any,
    public readonly userRepo: any,
    public readonly keycloakService: any,
  ) {}

  /**
   * Handle inbound WhatsApp message
   *
   * Creates or updates lead based on message content.
   */
  async handleInboundMessage(_message: WhatsAppInboundMessage): Promise<any> {
    // Implementation moved to use case pattern
    throw new Error('Use WhatsAppChannelAdapter + TrackIntentUseCase instead');
  }

  /**
   * Initiate conversion via WhatsApp OTP
   */
  async initiateConversion(_input: {
    phoneNumber: string;
    action: string;
    redirectUrl?: string;
  }): Promise<any> {
    // Implementation moved to use case pattern
    throw new Error('Use WhatsAppChannelAdapter + ConvertLeadToUserUseCase instead');
  }

  /**
   * Verify OTP from WhatsApp reply
   */
  async verifyOTP(_input: {
    phoneNumber: string;
    code: string;
  }): Promise<any> {
    // Implementation moved to use case pattern
    throw new Error('Use WhatsAppChannelAdapter + ConvertLeadToUserUseCase instead');
  }
}
