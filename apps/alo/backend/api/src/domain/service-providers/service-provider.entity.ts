/**
 * Service Provider Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { ServiceProvider } from '@/db/schema.js';

export interface ServiceProviderProps {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  categoryId: number | null;
  document: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  available: boolean;
  rating: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceProviderInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  categoryId: number;
  document: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  available?: boolean;
  rating?: number;
}

export interface UpdateServiceProviderInput {
  name?: string;
  password?: string;
  phone?: string;
  categoryId?: number;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  available?: boolean;
  rating?: number;
  isActive?: boolean;
}

/**
 * Service Provider Domain Entity
 */
export class ServiceProviderEntity extends CrudEntityTemplate<number> {
  private props: ServiceProviderProps;

  private constructor(props: ServiceProviderProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get email(): string { return this.props.email; }
  get phone(): string { return this.props.phone; }
  get categoryId(): number | null { return this.props.categoryId; }
  get document(): string { return this.props.document; }
  get address(): string { return this.props.address; }
  get city(): string { return this.props.city; }
  get state(): string { return this.props.state; }
  get zipCode(): string { return this.props.zipCode; }
  get available(): boolean { return this.props.available; }
  get rating(): number | null { return this.props.rating; }
  get isActive(): boolean { return this.props.isActive; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods
  isAvailable(): boolean {
    return this.props.isActive && this.props.available;
  }

  setAvailability(available: boolean): void {
    this.props.available = available;
    this.touch();
  }

  updateRating(rating: number): void {
    this.props.rating = Math.max(1, Math.min(5, rating));
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
  static create(input: CreateServiceProviderInput): ServiceProviderEntity {
    return new ServiceProviderEntity({
      id: 0, // Will be set by database
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.password, // Should be hashed before passing
      phone: input.phone.trim(),
      categoryId: input.categoryId ?? null,
      document: input.document.trim(),
      address: input.address.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      zipCode: input.zipCode.trim(),
      available: input.available ?? true,
      rating: input.rating ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: ServiceProvider): ServiceProviderEntity {
    return new ServiceProviderEntity({
      id: data.id,
      name: data.name,
      email: data.email,
      passwordHash: data.password_hash,
      phone: data.phone,
      categoryId: data.category_id,
      document: data.document,
      address: data.address,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      available: data.available,
      rating: data.rating,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  toPersistence(): Partial<ServiceProvider> {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      password_hash: this.props.passwordHash,
      phone: this.props.phone,
      category_id: this.props.categoryId,
      document: this.props.document,
      address: this.props.address,
      city: this.props.city,
      state: this.props.state,
      zip_code: this.props.zipCode,
      available: this.props.available,
      rating: this.props.rating,
      is_active: this.props.isActive,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
