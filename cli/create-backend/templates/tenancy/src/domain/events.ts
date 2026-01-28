/**
 * Domain Events - Multi-Tenant
 *
 * All domain events include tenantId for proper tenant isolation
 * in event processing and analytics.
 */

import { DomainEventTemplate } from '@oxlayer/foundation-domain-kit';
import type { UUID } from '@oxlayer/foundation-domain-kit';
import { ItemTemplate } from './item.js';
import { TenantTemplate } from './tenant.js';

/**
 * Base Tenant-Aware Domain Event
 * Includes tenantId for all events in a multi-tenant system
 */
export abstract class TenantAwareDomainEvent extends DomainEventTemplate {
  readonly tenantId: UUID;

  constructor(props: {
    eventName: string;
    entityType: string;
    entityId: string;
    tenantId: UUID;
  }) {
    super({
      eventName: props.eventName,
      entityType: props.entityType,
      entityId: props.entityId,
    });
    this.tenantId = props.tenantId;
  }

  /**
   * Override to include tenantId in metadata
   */
  toJSON() {
    return {
      ...super.toJSON(),
      tenantId: this.tenantId,
    };
  }
}

/**
 * Item Events - Tenant Aware
 */
export class ItemCreatedEvent extends TenantAwareDomainEvent {
  readonly entity: ItemTemplate;

  constructor(item: ItemTemplate) {
    super({
      eventName: 'Item.Created',
      entityType: 'Item',
      entityId: String(item.id),
      tenantId: item.tenantId,
    });
    this.entity = item;
  }
}

export class ItemUpdatedEvent extends TenantAwareDomainEvent {
  readonly entity: ItemTemplate;

  constructor(item: ItemTemplate) {
    super({
      eventName: 'Item.Updated',
      entityType: 'Item',
      entityId: String(item.id),
      tenantId: item.tenantId,
    });
    this.entity = item;
  }
}

export class ItemDeletedEvent extends TenantAwareDomainEvent {
  readonly itemId: UUID;
  readonly tenantId: UUID;

  constructor(itemId: UUID, tenantId: UUID) {
    super({
      eventName: 'Item.Deleted',
      entityType: 'Item',
      entityId: String(itemId),
      tenantId,
    });
    this.itemId = itemId;
    this.tenantId = tenantId;
  }
}

/**
 * Tenant Events - System Level
 * These events are NOT tenant-aware (they manage tenants themselves)
 */
export class TenantCreatedEvent extends DomainEventTemplate {
  readonly entity: TenantTemplate;

  constructor(tenant: TenantTemplate) {
    super({
      eventName: 'Tenant.Created',
      entityType: 'Tenant',
      entityId: tenant.tenantId,
    });
    this.entity = tenant;
  }
}

export class TenantUpdatedEvent extends DomainEventTemplate {
  readonly entity: TenantTemplate;

  constructor(tenant: TenantTemplate) {
    super({
      eventName: 'Tenant.Updated',
      entityType: 'Tenant',
      entityId: tenant.tenantId,
    });
    this.entity = tenant;
  }
}

export class TenantSuspendedEvent extends DomainEventTemplate {
  readonly tenantId: UUID;
  readonly reason?: string;

  constructor(tenantId: UUID, reason?: string) {
    super({
      eventName: 'Tenant.Suspended',
      entityType: 'Tenant',
      entityId: tenantId,
    });
    this.tenantId = tenantId;
    this.reason = reason;
  }
}

export class TenantActivatedEvent extends DomainEventTemplate {
  readonly tenantId: UUID;

  constructor(tenantId: UUID) {
    super({
      eventName: 'Tenant.Activated',
      entityType: 'Tenant',
      entityId: tenantId,
    });
    this.tenantId = tenantId;
  }
}
