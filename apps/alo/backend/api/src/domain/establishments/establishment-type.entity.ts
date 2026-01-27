/**
 * Establishment Type Domain Entity
 */

import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
import type { EstablishmentType } from '@/db/schema.js';

export interface EstablishmentTypeProps {
  id: number;
  name: string;
  description: string | null;
  requiresDelivery: boolean;
  requiresLocation: boolean;
  requiresMenu: boolean;
  requiresHours: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEstablishmentTypeInput {
  name: string;
  description?: string;
  requiresDelivery?: boolean;
  requiresLocation?: boolean;
  requiresMenu?: boolean;
  requiresHours?: boolean;
}

/**
 * Establishment Type Domain Entity
 */
export class EstablishmentTypeEntity extends CrudEntityTemplate<number> {
  private props: EstablishmentTypeProps;

  private constructor(props: EstablishmentTypeProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): number { return this.props.id; }
  get name(): string { return this.props.name; }
  get description(): string | null { return this.props.description; }
  get requiresDelivery(): boolean { return this.props.requiresDelivery; }
  get requiresLocation(): boolean { return this.props.requiresLocation; }
  get requiresMenu(): boolean { return this.props.requiresMenu; }
  get requiresHours(): boolean { return this.props.requiresHours; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Factory method
  static create(input: CreateEstablishmentTypeInput): EstablishmentTypeEntity {
    return new EstablishmentTypeEntity({
      id: 0, // Will be set by database
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      requiresDelivery: input.requiresDelivery ?? false,
      requiresLocation: input.requiresLocation ?? false,
      requiresMenu: input.requiresMenu ?? false,
      requiresHours: input.requiresHours ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: EstablishmentType): EstablishmentTypeEntity {
    return new EstablishmentTypeEntity({
      id: data.id,
      name: data.name,
      description: data.description,
      requiresDelivery: data.requires_delivery,
      requiresLocation: data.requires_location,
      requiresMenu: data.requires_menu,
      requiresHours: data.requires_hours,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  toPersistence(): Partial<EstablishmentType> {
    return {
      id: this.props.id,
      name: this.props.name,
      description: this.props.description,
      requires_delivery: this.props.requiresDelivery,
      requires_location: this.props.requiresLocation,
      requires_menu: this.props.requiresMenu,
      requires_hours: this.props.requiresHours,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }
}
