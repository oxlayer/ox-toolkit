/**
 * Tenant Aggregate Root
 *
 * Represents a tenant in the multi-tenant system.
 * Each tenant has isolated data and resources.
 */

import {
  CrudEntityTemplate,
  UUID,
  positiveNumber,
} from '@oxlayer/foundation-domain-kit';

/**
 * Tenant status enum
 */
export enum TenantStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

/**
 * Tenant Entity
 * Inherits from CrudEntityTemplate for full CRUD capabilities
 */
export class TenantTemplate extends CrudEntityTemplate {
  readonly tenantId: UUID;
  readonly name: string;
  readonly domain: string;
  readonly status: TenantStatus;
  readonly maxUsers: positiveNumber;
  readonly maxStorageGB: positiveNumber;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    tenantId: UUID;
    name: string;
    domain: string;
    status: TenantStatus;
    maxUsers: positiveNumber;
    maxStorageGB: positiveNumber;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super();
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.domain = props.domain;
    this.status = props.status;
    this.maxUsers = props.maxUsers;
    this.maxStorageGB = props.maxStorageGB;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Activate tenant
   */
  activate(): TenantTemplate {
    if (this.status === TenantStatus.ACTIVE) {
      return this;
    }
    return new TenantTemplate({
      ...this,
      status: TenantStatus.ACTIVE,
      updatedAt: new Date(),
    });
  }

  /**
   * Suspend tenant
   */
  suspend(): TenantTemplate {
    if (this.status === TenantStatus.SUSPENDED) {
      return this;
    }
    return new TenantTemplate({
      ...this,
      status: TenantStatus.SUSPENDED,
      updatedAt: new Date(),
    });
  }

  /**
   * Update tenant limits
   */
  updateLimits(limits: { maxUsers: positiveNumber; maxStorageGB: positiveNumber }): TenantTemplate {
    return new TenantTemplate({
      ...this,
      ...limits,
      updatedAt: new Date(),
    });
  }
}

/**
 * Tenant value object (used in other entities)
 */
export class TenantRef {
  readonly tenantId: UUID;
  readonly tenantName: string;

  constructor(tenantId: UUID, tenantName: string) {
    this.tenantId = tenantId;
    this.tenantName = tenantName;
  }
}
