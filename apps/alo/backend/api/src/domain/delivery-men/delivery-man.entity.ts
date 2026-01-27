/**
 * Delivery Man Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { DeliveryMan } from '@/db/schema.js';

export interface DeliveryManProps {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  establishmentId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDeliveryManInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  establishmentId?: number;
}

export interface UpdateDeliveryManInput {
  name?: string;
  password?: string;
  phone?: string;
  establishmentId?: number;
  isActive?: boolean;
}

/**
 * Delivery Man Domain Entity
 */
export class DeliveryManEntity extends CrudEntityTemplate<number> {
  private props: DeliveryManProps;

  private constructor(props: DeliveryManProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get phone(): string { return this.props.phone; }
  get establishmentId(): number | null { return this.props.establishmentId; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  isAvailable(): boolean {
    return this.props.isActive;
  }

  assignToEstablishment(establishmentId: number): void {
    this.props.establishmentId = establishmentId;
    this.touch();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.touch();
  }

  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  // Factory method
  static create(input: CreateDeliveryManInput): DeliveryManEntity {
    return new DeliveryManEntity({
      id: 0, // Will be set by database
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.password, // Should be hashed before passing
      phone: input.phone.trim(),
      establishmentId: input.establishmentId ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: DeliveryMan): DeliveryManEntity {
    return new DeliveryManEntity({
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.password_hash,
      phone: data.phone,
      establishmentId: data.establishment_id,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  toPersistence(): Partial<DeliveryMan> {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      password_hash: this.props.passwordHash,
      phone: this.props.phone,
      establishment_id: this.props.establishmentId,
      is_active: this.props.isActive,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
