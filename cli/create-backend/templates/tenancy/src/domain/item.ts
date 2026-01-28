/**
 * Tenant-Aware Item Entity
 *
 * Example entity showing how to create tenant-aware domain entities.
 * All tenant-aware entities must include a tenantId for data isolation.
 */

import {
  CrudEntityTemplate,
  UUID,
  positiveNumber,
} from '@oxlayer/foundation-domain-kit';
import { TenantRef } from './tenant.js';

/**
 * Item Entity - Tenant Aware
 * Inherits from CrudEntityTemplate for full CRUD capabilities
 */
export class ItemTemplate extends CrudEntityTemplate {
  readonly id: UUID;
  readonly tenantId: UUID;
  readonly name: string;
  readonly description: string;
  readonly quantity: positiveNumber;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: UUID;
    tenantId: UUID;
    name: string;
    description: string;
    quantity: positiveNumber;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.description = props.description;
    this.quantity = props.quantity;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Verify item belongs to tenant
   */
  belongsToTenant(tenantId: UUID): boolean {
    return this.tenantId === tenantId;
  }

  /**
   * Update item details
   */
  updateDetails(details: { name?: string; description?: string }): ItemTemplate {
    return new ItemTemplate({
      ...this,
      ...details,
      updatedAt: new Date(),
    });
  }

  /**
   * Update quantity
   */
  updateQuantity(quantity: positiveNumber): ItemTemplate {
    return new ItemTemplate({
      ...this,
      quantity,
      updatedAt: new Date(),
    });
  }

  /**
   * Get tenant reference
   */
  getTenantRef(): TenantRef {
    return new TenantRef(this.tenantId, ''); // Tenant name loaded separately
  }
}
