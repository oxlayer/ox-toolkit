/**
 * WhatsApp → Keycloak Identity Bridge Adapter
 *
 * Handles the conversion from WhatsApp conversations to authenticated users.
 *
 * Flow:
 * 1. Inbound WhatsApp message → Create/update Lead
 * 2. User wants to do protected action → Send OTP via WhatsApp
 * 3. User replies with OTP → Verify and create Keycloak user
 * 4. Link WhatsApp number to Keycloak user
 *
 * @example
 * ```typescript
 * import { WhatsAppIdentityBridge } from '@oxlayer/capabilities-adapters-whatsapp';
 *
 * const bridge = new WhatsAppIdentityBridge(keycloakService, leadRepo, userRepo);
 *
 * // Handle inbound message
 * await bridge.handleInboundMessage({
 *   from: '+5511999999999',
 *   message: 'I want to buy',
 *   conversationId: 'conv_123'
 * });
 *
 * // Trigger conversion when user wants protected action
 * const result = await bridge.initiateConversion({
 *   phoneNumber: '+5511999999999',
 *   action: 'checkout'
 * });
 * // Send result.data.otp via WhatsApp
 *
 * // Verify OTP reply
 * const verified = await bridge.verifyOTP({
 *   phoneNumber: '+5511999999999',
 *   code: '123456'
 * });
 * ```
 */

import type {
  LeadRepository,
  UserRepository,
  KeycloakService,
  IntentType,
} from '@oxlayer/snippets';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Inbound WhatsApp message
 */
export interface WhatsAppInboundMessage {
  from: string;                  // Phone number with country code, e.g., '+5511999999999'
  to: string;                    // Your WhatsApp business number
  message: string;
  conversationId: string;
  timestamp?: Date;
  metadata?: {
    message_id?: string;
    referrer_id?: string;        // Who referred them
  };
}

/**
 * WhatsApp outbound message
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
 * WhatsApp conversation state
 */
export type WhatsAppConversationState =
  | 'new'              // First message
  | 'greeting'         // Bot greeting sent
  | 'engaged'          // Active conversation
  | 'otp_sent'         // OTP sent, waiting for reply
  | 'verified'         // OTP verified, now authenticated
  | 'converted';       // Converted to user

/**
 * WhatsApp conversation properties
 */
export interface WhatsAppConversationProps {
  id: string;
  phoneNumber: string;          // Normalized: +country_code number
  conversationId: string;
  state: WhatsAppConversationState;

  // Lead association
  leadId?: string;

  // OTP tracking
  lastOtpCode?: string;
  lastOtpExpiresAt?: Date;
  otpAttempts: number;

  // User association (after conversion)
  keycloakUserId?: string;
  appUserId?: string;

  // Context
  lastMessageAt?: Date;
  messageCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * WhatsApp conversation repository
 */
export interface WhatsAppConversationRepository {
  findByPhoneNumber(phone: string): Promise<WhatsAppConversation | null>;
  findByConversationId(convId: string): Promise<WhatsAppConversation | null>;
  save(conv: WhatsAppConversation): Promise<void>;
}

/**
 * WhatsApp message service interface
 *
 * Implement this with your WhatsApp provider (Twilio, Meta, etc.)
 */
export interface WhatsAppMessageService {
  sendMessage(message: WhatsAppOutboundMessage): Promise<{ messageId: string }>;
  verifyWebhookSignature(payload: unknown, signature: string): boolean;
}

/**
 * WhatsApp conversation aggregate
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

// ============================================================================
// BRIDGE SERVICE
// ============================================================================

/**
 * WhatsApp → Keycloak identity bridge
 *
 * Orchestrates the flow from WhatsApp conversation to authenticated user.
 */
export class WhatsAppIdentityBridge {
  constructor(
    private readonly whatsappService: WhatsAppMessageService,
    private readonly whatsappConvRepo: WhatsAppConversationRepository,
    private readonly leadRepo: LeadRepository,
    private readonly userRepo: UserRepository,
    private readonly keycloakService: KeycloakService,
  ) {}

  /**
   * Handle inbound WhatsApp message
   *
   * Creates or updates lead based on message content.
   */
  async handleInboundMessage(message: WhatsAppInboundMessage): Promise<{
    leadId?: string;
    conversationState: WhatsAppConversationState;
    shouldReply: boolean;
    suggestedReply?: string;
  }> {
    // 1. Find or create conversation
    let conv = await this.whatsappConvRepo.findByPhoneNumber(message.from);
    if (!conv) {
      conv = WhatsAppConversation.create({
        phoneNumber: message.from,
        conversationId: message.conversationId,
      });
    } else {
      conv.recordMessage();
    }
    await this.whatsappConvRepo.save(conv);

    // 2. Check if this is an OTP reply
    if (conv.state === 'otp_sent') {
      const otpMatch = message.message.trim().match(/^\d{4,6}$/);
      if (otpMatch) {
        // Verify OTP
        const verified = await this.verifyOTP({
          phoneNumber: message.from,
          code: otpMatch[0],
        });

        if (verified.success && verified.data) {
          return {
            leadId: verified.data.leadId,
            conversationState: conv.state,
            shouldReply: true,
            suggestedReply: this.getWelcomeMessage(verified.data.userName),
          };
        }
      }
    }

    // 3. Find or create lead
    let lead = conv.props.leadId ? await this.leadRepo.findById(conv.props.leadId) : null;

    if (!lead) {
      lead = Lead.create({
        phone: message.from,
        channel: 'whatsapp',
        source: 'inbound_message',
      });
      await this.leadRepo.save(lead);
      conv.linkToLead(lead.id);
      await this.whatsappConvRepo.save(conv);
    }

    // 4. Analyze message for intent signals
    const intents = this.detectIntents(message.message);
    for (const intent of intents) {
      lead.recordIntent(intent.type, intent.metadata, intent.score);
    }
    await this.leadRepo.save(lead);

    // 5. Determine if we should prompt for conversion
    const shouldPrompt = lead.canConvert && intents.some(i => i.highIntent);

    return {
      leadId: lead.id,
      conversationState: conv.state,
      shouldReply: shouldPrompt || conv.state === 'new',
      suggestedReply: shouldPrompt
        ? this.getConversionPrompt()
        : conv.state === 'new'
        ? this.getGreetingMessage()
        : undefined,
    };
  }

  /**
   * Initiate conversion via WhatsApp OTP
   *
   * Call this when lead wants to do a protected action.
   */
  async initiateConversion(input: {
    phoneNumber: string;
    action: string;
    redirectUrl?: string;
  }): Promise<{
    success: true;
    data: {
      leadId: string;
      otpSent: boolean;
      expiresAt: Date;
    };
  } | {
    success: false;
    error: { code: string; message: string };
  }> {
    // 1. Find conversation and lead
    const conv = await this.whatsappConvRepo.findByPhoneNumber(input.phoneNumber);
    if (!conv) {
      return {
        success: false,
        error: { code: 'CONVERSATION_NOT_FOUND', message: 'No conversation found' },
      };
    }

    const lead = conv.props.leadId ? await this.leadRepo.findById(conv.props.leadId) : null;
    if (!lead) {
      return {
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: 'Lead not found' },
      };
    }

    // 2. Initiate conversion
    if (!lead.canConvert) {
      return {
        success: false,
        error: { code: 'LEAD_NOT_QUALIFIED', message: 'Lead not ready for conversion' },
      };
    }
    lead.initiateConversion();
    await this.leadRepo.save(lead);

    // 3. Check if user already exists
    const existingUser = await this.userRepo.findByPhone(input.phoneNumber);
    const keycloakUserId = existingUser?.keycloakUserId;

    // 4. Generate OTP via Keycloak
    const otp = await this.keycloakService.sendOTP(
      keycloakUserId || input.phoneNumber, // Use phone as identifier if no user yet
      input.phoneNumber
    );

    // 5. Store OTP in conversation
    conv.setOtp(otp.code, otp.expiresAt);
    await this.whatsappConvRepo.save(conv);

    // 6. Send OTP via WhatsApp
    await this.whatsappService.sendMessage({
      to: input.phoneNumber,
      message: this.getOtpMessage(otp.code, otp.expiresAt),
      metadata: { quick_replies: ['I didn\'t request this'] },
    });

    return {
      success: true,
      data: {
        leadId: lead.id,
        otpSent: true,
        expiresAt: otp.expiresAt,
      },
    };
  }

  /**
   * Verify OTP from WhatsApp reply
   *
   * Verifies the OTP code sent by user and completes conversion.
   */
  async verifyOTP(input: {
    phoneNumber: string;
    code: string;
  }): Promise<{
    success: true;
    data: {
      leadId: string;
      userId: string;
      keycloakUserId: string;
      userName?: string;
    };
  } | {
    success: false;
    error: { code: string; message: string };
  }> {
    // 1. Find conversation
    const conv = await this.whatsappConvRepo.findByPhoneNumber(input.phoneNumber);
    if (!conv) {
      return {
        success: false,
        error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found' },
      };
    }

    // 2. Verify OTP
    const isValid = conv.verifyOtp(input.code);
    if (!isValid) {
      conv.recordFailedOtpAttempt();
      await this.whatsappConvRepo.save(conv);
      return {
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid or expired OTP' },
      };
    }
    await this.whatsappConvRepo.save(conv);

    // 3. Find lead
    const lead = conv.props.leadId ? await this.leadRepo.findById(conv.props.leadId) : null;
    if (!lead) {
      return {
        success: false,
        error: { code: 'LEAD_NOT_FOUND', message: 'Lead not found' },
      };
    }

    // 4. Check if already converted
    if (lead.isConverted) {
      return {
        success: true,
        data: {
          leadId: lead.id,
          userId: lead.props.appUserId!,
          keycloakUserId: lead.props.keycloakUserId!,
        },
      };
    }

    // 5. Create Keycloak user (if not exists)
    const keycloakUser = await this.keycloakService.createUser({
      phone: input.phoneNumber,
      username: input.phoneNumber,
      enabled: true,
      attributes: {
        channel: ['whatsapp'],
        verified: ['true'],
      },
    });

    // 6. Create app user
    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      keycloakUserId: keycloakUser.userId,
      phone: input.phoneNumber,
      name: lead.name,
      roles: ['customer'],
    };
    await this.userRepo.save(newUser);

    // 7. Complete conversion
    lead.completeConversion(keycloakUser.userId, newUser.id);
    await this.leadRepo.save(lead);

    // 8. Link conversation to user
    conv.linkToUser(keycloakUser.userId, newUser.id);
    await this.whatsappConvRepo.save(conv);

    return {
      success: true,
      data: {
        leadId: lead.id,
        userId: newUser.id,
        keycloakUserId: keycloakUser.userId,
        userName: lead.name,
      },
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private detectIntents(message: string): Array<{
    type: IntentType;
    score: number;
    highIntent: boolean;
    metadata?: Record<string, unknown>;
  }> {
    const lower = message.toLowerCase();
    const intents: Array<{ type: IntentType; score: number; highIntent: boolean; metadata?: Record<string, unknown> }> = [];

    // High intent signals
    if (lower.match(/buy|purchase|order|checkout|pagar|comprar/)) {
      intents.push({ type: 'start_checkout', score: 30, highIntent: true });
    }
    if (lower.match(/price|how much|quanto|valor|preço/)) {
      intents.push({ type: 'view_pricing', score: 20, highIntent: false });
    }
    if (lower.match(/demo|schedule|call|agendar/)) {
      intents.push({ type: 'schedule_call', score: 25, highIntent: true });
    }

    return intents;
  }

  private getGreetingMessage(): string {
    return "Hi! 👋 Welcome to our service. How can I help you today?";
  }

  private getConversionPrompt(): string {
    return (
      "To continue, I'll need to verify your account. " +
      "I'll send you a code via WhatsApp. Reply with the code to verify."
    );
  }

  private getOtpMessage(code: string, expiresAt: Date): string {
    const minutes = Math.floor((expiresAt.getTime() - Date.now()) / 60000);
    return `Your verification code is: *${code}*\n\nThis code expires in ${minutes} minutes.`;
  }

  private getWelcomeMessage(userName?: string): string {
    const name = userName ? ` ${userName.split(' ')[0]}` : '';
    return `Welcome${name}! 🎉\n\nYour account is verified. What would you like to do next?`;
  }
}

// ============================================================================
// HELPER: NORMALIZE PHONE NUMBER
// ============================================================================

/**
 * Normalize phone number to E.164 format
 *
 * @example
 * ```typescript
 * normalizePhoneNumber('11999999999', '55') // '+5511999999999'
 * normalizePhoneNumber('+55 11 99999-9999') // '+5511999999999'
 * ```
 */
export function normalizePhoneNumber(phone: string, defaultCountryCode = '55'): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // Add country code if missing
  if (!cleaned.startsWith('00') && !cleaned.startsWith('+')) {
    // Check if it already has country code (11 digits for Brazil with 55)
    if (cleaned.length === 11 && cleaned.startsWith('9')) {
      // Brazilian mobile without country code
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
