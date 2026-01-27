/**
 * User Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { User } from '@/db/schema.js';

export interface UserProps {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  establishmentId: number | null;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  establishmentId?: number;
  role?: 'admin' | 'manager' | 'staff';
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  establishmentId?: number;
  role?: 'admin' | 'manager' | 'staff';
  isActive?: boolean;
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
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  isAdmin(): boolean {
    return this.props.role === 'admin';
  }

  isManager(): boolean {
    return this.props.role === 'manager';
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
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
