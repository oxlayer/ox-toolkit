/**
 * Onboarding Lead Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { OnboardingLead } from '@/db/schema.js';

export type OnboardingLeadStatus = 'new' | 'contacted' | 'converted' | 'rejected';
export type OnboardingLeadUserType = 'provider' | 'company';

export interface OnboardingLeadProps {
  id: number;
  userType: OnboardingLeadUserType;
  categoryId: number | null;
  establishmentTypeId: number | null;
  document: string;
  email: string;
  name: string | null;
  phone: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  status: OnboardingLeadStatus;
  contactedAt: Date | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOnboardingLeadInput {
  userType: OnboardingLeadUserType;
  categoryId?: number;
  establishmentTypeId?: number;
  document: string;
  email: string;
  name?: string;
  phone: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOnboardingLeadInput {
  status?: OnboardingLeadStatus;
  notes?: string;
  contactedAt?: Date;
}

/**
 * Onboarding Lead Domain Entity
 */
export class OnboardingLeadEntity extends CrudEntityTemplate<number> {
  private props: OnboardingLeadProps;

  private constructor(props: OnboardingLeadProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): number { return this.props.id; }
  get userType(): OnboardingLeadUserType { return this.props.userType; }
  get categoryId(): number | null { return this.props.categoryId; }
  get establishmentTypeId(): number | null { return this.props.establishmentTypeId; }
  get document(): string { return this.props.document; }
  get email(): string { return this.props.email; }
  get name(): string | null { return this.props.name; }
  get phone(): string { return this.props.phone; }
  get termsAccepted(): boolean { return this.props.termsAccepted; }
  get privacyAccepted(): boolean { return this.props.privacyAccepted; }
  get status(): OnboardingLeadStatus { return this.props.status; }
  get contactedAt(): Date | null { return this.props.contactedAt; }
  get notes(): string | null { return this.props.notes; }
  get metadata(): Record<string, unknown> { return this.props.metadata; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  isNew(): boolean {
    return this.props.status === 'new';
  }

  isContacted(): boolean {
    return this.props.status === 'contacted';
  }

  isConverted(): boolean {
    return this.props.status === 'converted';
  }

  isRejected(): boolean {
    return this.props.status === 'rejected';
  }

  markAsContacted(): void {
    this.props.status = 'contacted';
    this.props.contactedAt = new Date();
    this.touch();
  }

  markAsConverted(): void {
    this.props.status = 'converted';
    this.touch();
  }

  markAsRejected(notes?: string): void {
    this.props.status = 'rejected';
    if (notes) {
      this.props.notes = notes;
    }
    this.touch();
  }

  // Factory method
  static create(input: CreateOnboardingLeadInput): OnboardingLeadEntity {
    return new OnboardingLeadEntity({
      id: 0, // Will be set by database
      userType: input.userType,
      categoryId: input.categoryId ?? null,
      establishmentTypeId: input.establishmentTypeId ?? null,
      document: input.document.trim(),
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() ?? null,
      phone: input.phone.trim(),
      termsAccepted: input.termsAccepted,
      privacyAccepted: input.privacyAccepted,
      status: 'new',
      contactedAt: null,
      notes: input.notes?.trim() ?? null,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: OnboardingLead): OnboardingLeadEntity {
    return new OnboardingLeadEntity({
      id: data.id,
      userType: data.user_type as OnboardingLeadUserType,
      categoryId: data.category_id,
      establishmentTypeId: data.establishment_type_id,
      document: data.document,
      email: data.email,
      name: data.name,
      phone: data.phone,
      termsAccepted: data.terms_accepted,
      privacyAccepted: data.privacy_accepted,
      status: data.status as OnboardingLeadStatus,
      contactedAt: data.contacted_at ? new Date(data.contacted_at) : null,
      notes: data.notes,
      metadata: (data.metadata as Record<string, unknown>) ?? {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  toPersistence(): Partial<OnboardingLead> {
    return {
      id: this.props.id,
      user_type: this.props.userType,
      category_id: this.props.categoryId,
      establishment_type_id: this.props.establishmentTypeId,
      document: this.props.document,
      email: this.props.email,
      name: this.props.name,
      phone: this.props.phone,
      terms_accepted: this.props.termsAccepted,
      privacy_accepted: this.props.privacyAccepted,
      status: this.props.status,
      contacted_at: this.props.contactedAt,
      notes: this.props.notes,
      metadata: this.props.metadata as any,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
