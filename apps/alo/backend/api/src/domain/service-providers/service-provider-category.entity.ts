/**
 * Service Provider Category Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { ServiceProviderCategory } from '@/db/schema.js';

export interface ServiceProviderCategoryProps {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceProviderCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateServiceProviderCategoryInput {
  name?: string;
  description?: string;
}

/**
 * Service Provider Category Domain Entity
 */
export class ServiceProviderCategoryEntity extends CrudEntityTemplate<number> {
  private props: ServiceProviderCategoryProps;

  private constructor(props: ServiceProviderCategoryProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Factory method
  static create(input: CreateServiceProviderCategoryInput): ServiceProviderCategoryEntity {
    return new ServiceProviderCategoryEntity({
      id: 0, // Will be set by database
      name: input.name.trim(),
      description: input.description?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: ServiceProviderCategory): ServiceProviderCategoryEntity {
    return new ServiceProviderCategoryEntity({
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  toPersistence(): Partial<ServiceProviderCategory> {
    return {
      id: this.props.id,
      name: this.props.name,
      description: this.props.description,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
