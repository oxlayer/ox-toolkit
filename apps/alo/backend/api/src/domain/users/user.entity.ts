/**
 * User Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { User } from '@/db/schema.js';

export type UserStatus = 'pending_review' | 'active' | 'suspended';
export type DocumentType = 'cpf' | 'cnpj';

export interface UserProps {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  establishmentId: number | null;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
  // Onboarding fields
  status: UserStatus;
  documentType: DocumentType | null;
  document: string | null;
  keycloakId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  establishmentId?: number;
  role?: 'admin' | 'manager' | 'staff';
  status?: UserStatus;
  documentType?: DocumentType;
  document?: string;
  keycloakId?: string;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  establishmentId?: number;
  role?: 'admin' | 'manager' | 'staff';
  isActive?: boolean;
  status?: UserStatus;
  documentType?: DocumentType;
  document?: string;
  keycloakId?: string;
}

/**
 * User Domain Entity
 */
export class UserEntity extends CrudEntityTemplate<number> {
  private props: UserProps;

  private constructor(props: UserProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get establishmentId(): number | null { return this.props.establishmentId; }
  get role(): 'admin' | 'manager' | 'staff' { return this.props.role; }
  get isActive(): boolean { return this.props.isActive; }
  get status(): UserStatus { return this.props.status; }
  get documentType(): DocumentType | null { return this.props.documentType; }
  get document(): string | null { return this.props.document; }
  get keycloakId(): string | null { return this.props.keycloakId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Setters for onboarding
  set status(value: UserStatus) {
    this.props.status = value;
    this.touch();
  }

  set documentType(value: DocumentType | null) {
    this.props.documentType = value;
    this.touch();
  }

  set document(value: string | null) {
    this.props.document = value;
    this.touch();
  }

  set keycloakId(value: string | null) {
    this.props.keycloakId = value;
    this.touch();
  }

  // Business methods
  isAdmin(): boolean {
    return this.props.role === 'admin';
  }

  isManager(): boolean {
    return this.props.role === 'manager';
  }

  isPendingReview(): boolean {
    return this.props.status === 'pending_review';
  }

  isActiveStatus(): boolean {
    return this.props.status === 'active';
  }

  isSuspended(): boolean {
    return this.props.status === 'suspended';
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  assignToEstablishment(establishmentId: number): void {
    this.props.establishmentId = establishmentId;
    this.touch();
  }

  markAsActive(): void {
    this.props.status = 'active';
    this.touch();
  }

  markAsSuspended(): void {
    this.props.status = 'suspended';
    this.touch();
  }

  // Factory method
  static create(input: CreateUserInput): UserEntity {
    return new UserEntity({
      id: 0, // Will be set by database
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.password, // Should be hashed before passing
      establishmentId: input.establishmentId ?? null,
      role: input.role ?? 'staff',
      isActive: true,
      status: input.status ?? 'pending_review',
      documentType: input.documentType ?? null,
      document: input.document ?? null,
      keycloakId: input.keycloakId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: User): UserEntity {
    return new UserEntity({
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.password_hash,
      establishmentId: data.establishment_id,
      role: data.role,
      isActive: data.is_active,
      status: (data.status as UserStatus) ?? 'pending_review',
      documentType: data.document_type as DocumentType | null,
      document: data.document,
      keycloakId: data.keycloak_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  toPersistence(): Partial<User> {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      password_hash: this.props.passwordHash,
      establishment_id: this.props.establishmentId,
      role: this.props.role,
      is_active: this.props.isActive,
      status: this.props.status,
      document_type: this.props.documentType,
      document: this.props.document,
      keycloak_id: this.props.keycloakId,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
