/**
 * Contact Entity
 *
 * A Contact is an EXTERNAL PERSON that exists independently of your system.
 * They are NOT users and NOT necessarily leads.
 *
 * Examples:
 * - end-users provided by a client
 * - Survey recipients
 * - WhatsApp numbers uploaded by a customer
 * - External users with external_user_id
 *
 * Key invariant: Contacts are subjects of workflows, NOT users of your system.
 *
 * @example
 * ```typescript
 * // end-user uploaded by client
 * const member = Contact.create({
 *   externalUserId: 'hr_client_123_candidate_456',
 *   tenantId: 'client_abc',
 *   name: 'Jane Doe',
 *   email: 'jane@example.com',
 *   phone: '+15551234567',
 *   source: 'hr_import',
 * });
 *
 * // They can receive messages and answer questions
 * // But they CANNOT log in, have NO permissions, NO IAM
 * ```
 */

import { TimestampedEntityTemplate } from './entity.template.js';

// ============================================================================
// CONTACT TYPES
// ============================================================================

/**
 * Contact source
 * Where did this contact come from?
 */
export type ContactSource =
  | 'hr_import'        // Bulk import from HR system
  | 'csv_upload'       // CSV file upload
  | 'manual_entry'     // Manually entered
  | 'web_form'         // Web form submission
  | 'whatsapp'         // WhatsApp conversation
  | 'telegram'         // Telegram conversation
  | 'sms'              // SMS conversation
  | 'email'            // Email thread
  | 'api'              // API/webhook
  | 'referral';        // Referred by someone

/**
 * Contact status
 * What is the state of this contact?
 */
export type ContactStatus =
  | 'pending'          // Just added, not yet contacted
  | 'contacted'        // We've reached out to them
  | 'engaged'          // They've responded
  | 'disengaged'       // They stopped responding
  | 'unsubscribed'     // Opted out
  | 'bounced';         // Contact info invalid

// ============================================================================
// CONTACT PROPS
// ============================================================================

/**
 * Contact properties
 */
export interface ContactProps {
  id: string;

  // External identity (from client system)
  externalUserId?: string;      // External user ID from client system
  tenantId?: string;             // If multi-tenant

  // Contact information
  name?: string;
  email?: string;
  phone?: string;

  // Metadata
  status: ContactStatus;
  source: ContactSource;
  sourceDetails?: {
    campaignId?: string;
    listId?: string;
    importBatchId?: string;
    referredBy?: string;
  };

  // Tracking
  lastContactedAt?: Date;
  lastResponseAt?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CONTACT ENTITY
// ============================================================================

/**
 * Contact entity
 *
 * Represents an external person that exists independently of your system.
 * They participate in workflows but are NOT users.
 */
export class Contact extends TimestampedEntityTemplate<ContactProps> {
  declare protected props: ContactProps;

  private constructor(props: ContactProps) {
    super(props.id);
    this.props = props;
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  // Note: 'id' is inherited from Entity base class as public readonly
  get externalUserId(): string | undefined { return this.props.externalUserId; }
  get tenantId(): string | undefined { return this.props.tenantId; }
  get name(): string | undefined { return this.props.name; }
  get email(): string | undefined { return this.props.email; }
  get phone(): string | undefined { return this.props.phone; }
  get status(): ContactStatus { return this.props.status; }
  get source(): ContactSource { return this.props.source; }
  get sourceDetails(): ContactProps['sourceDetails'] { return this.props.sourceDetails; }
  get lastContactedAt(): Date | undefined { return this.props.lastContactedAt; }
  get lastResponseAt(): Date | undefined { return this.props.lastResponseAt; }

  // ==========================================================================
  // BUSINESS METHODS
  // ==========================================================================

  /**
   * Record that we've contacted this person
   *
   * @example
   * ```typescript
   * contact.markAsContacted();
   * ```
   */
  markAsContacted(): void {
    if (this.props.status === 'pending') {
      this.props.status = 'contacted';
      this.props.lastContactedAt = new Date();
      this.touch();
    }
  }

  /**
   * Record that they responded
   *
   * @example
   * ```typescript
   * contact.recordResponse();
   * ```
   */
  recordResponse(): void {
    this.props.status = 'engaged';
    this.props.lastResponseAt = new Date();
    this.touch();
  }

  /**
   * Mark as disengaged (stopped responding)
   *
   * @example
   * ```typescript
   * contact.markAsDisengaged();
   * ```
   */
  markAsDisengaged(): void {
    this.props.status = 'disengaged';
    this.touch();
  }

  /**
   * Mark as unsubscribed
   *
   * @example
   * ```typescript
   * contact.unsubscribe();
   * ```
   */
  unsubscribe(): void {
    this.props.status = 'unsubscribed';
    this.touch();
  }

  /**
   * Mark as bounced (invalid contact info)
   *
   * @example
   * ```typescript
   * contact.markAsBounced();
   * ```
   */
  markAsBounced(): void {
    this.props.status = 'bounced';
    this.touch();
  }

  /**
   * Update contact information
   *
   * @example
   * ```typescript
   * contact.updateInfo({
   *   name: 'Jane Doe',
   *   email: 'jane@example.com',
   *   phone: '+15551234567',
   * });
   * ```
   */
  updateInfo(info: {
    name?: string;
    email?: string;
    phone?: string;
  }): void {
    if (info.name) this.props.name = info.name;
    if (info.email) this.props.email = info.email;
    if (info.phone) this.props.phone = info.phone;
    this.touch();
  }

  // ==========================================================================
  // FACTORY METHODS
  // ==========================================================================

  /**
   * Create a new contact
   *
   * @example
   * ```typescript
   * const contact = Contact.create({
   *   externalUserId: 'hr_123_candidate_456',
   *   tenantId: 'client_abc',
   *   name: 'John Doe',
   *   email: 'john@example.com',
   *   phone: '+15551234567',
   *   source: 'hr_import',
   * });
   * ```
   */
  static create(input: {
    externalUserId?: string;
    tenantId?: string;
    name?: string;
    email?: string;
    phone?: string;
    source: ContactSource;
    sourceDetails?: ContactProps['sourceDetails'];
  }): Contact {
    const now = new Date();

    const props: ContactProps = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      externalUserId: input.externalUserId,
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      phone: input.phone,
      status: 'pending',
      source: input.source,
      sourceDetails: input.sourceDetails,
      createdAt: now,
      updatedAt: now,
    };

    return new Contact(props);
  }

  /**
   * Reconstruct from persistence
   *
   * @example
   * ```typescript
   * const contact = Contact.fromPersistence(dbRecord);
   * ```
   */
  static fromPersistence(props: ContactProps): Contact {
    return new Contact(props);
  }

  /**
   * Convert to persistence format
   *
   * @example
   * ```typescript
   * await contactRepository.save(contact);
   * const dbRecord = contact.toPersistence();
   * ```
   */
  toPersistence(): Record<string, unknown> {
    return { ...this.props };
  }

  // ==========================================================================
  // DOMAIN HELPERS
  // ==========================================================================

  /**
   * Check if contact can be communicated with
   */
  canCommunicate(): boolean {
    return this.props.status !== 'unsubscribed' &&
           this.props.status !== 'bounced';
  }

  /**
   * Check if contact has ever responded
   */
  hasResponded(): boolean {
    return this.props.lastResponseAt !== undefined;
  }

  /**
   * Get contact method preference
   */
  getPreferredMethod(): 'email' | 'phone' | null {
    if (this.props.email && !this.props.phone) return 'email';
    if (this.props.phone && !this.props.email) return 'phone';
    if (this.props.email && this.props.phone) {
      // Prefer the method they last responded to
      // For now, default to email
      return 'email';
    }
    return null;
  }
}

// ============================================================================
// CONTACT REPOSITORY INTERFACE
// ============================================================================

/**
 * Contact repository interface
 */
export interface ContactRepository {
  findById(id: string): Promise<Contact | null>;
  findByEmail(email: string): Promise<Contact | null>;
  findByPhone(phone: string): Promise<Contact | null>;
  findByExternalUserId(externalUserId: string, tenantId: string): Promise<Contact | null>;
  findByTenant(tenantId: string): Promise<Contact[]>;
  save(contact: Contact): Promise<void>;
  delete(id: string): Promise<void>;
}
