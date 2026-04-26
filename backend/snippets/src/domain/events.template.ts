/**
 * Domain Events Template
 *
 * A template for creating domain events that follow DDD patterns.
 * Domain events represent something that happened in the domain that
 * other parts of the system may need to react to.
 *
 * @example
 * ```typescript
 * import { DomainEventTemplate } from '@oxlayer/snippets/domain';
 *
 * export interface TodoCreatedPayload {
 *   aggregateId: string;
 *   userId: string;
 *   title: string;
 * }
 *
 * export class TodoCreatedEvent extends DomainEventTemplate<TodoCreatedPayload> {
 *   readonly name = 'TodoCreated';
 *
 *   constructor(details: TodoCreatedPayload, metadata?: { correlationId?: string; causationId?: string }) {
 *     super(details, metadata);
 *   }
 * }
 * ```
 */

import type { DomainEvent } from '@oxlayer/foundation-domain-kit';

/**
 * Base template for domain events with common metadata
 *
 * Provides helper methods for creating domain events following OxLayer patterns.
 */
export abstract class DomainEventTemplate<TPayload = Record<string, unknown>> implements DomainEvent<TPayload> {
  /**
   * Event name in format: `Context.Action` (e.g., 'Todo.Created')
   */
  abstract readonly name: string;

  /**
   * Schema version for backward compatibility
   */
  readonly version: number = 1;

  /**
   * ISO 8601 timestamp when the event occurred
   */
  readonly occurredAt: string;

  /**
   * Event-specific payload
   */
  readonly payload: TPayload;

  /**
   * Optional correlation ID for tracing related events
   */
  readonly correlationId?: string;

  /**
   * Optional causation ID linking to the event that caused this one
   */
  readonly causationId?: string;

  constructor(payload: TPayload, metadata?: { correlationId?: string; causationId?: string }) {
    this.payload = payload;
    this.occurredAt = new Date().toISOString();
    this.correlationId = metadata?.correlationId;
    this.causationId = metadata?.causationId;
  }

  /**
   * Get event correlation ID for tracing
   */
  getCorrelationId(): string {
    return this.correlationId || this.generateEventId();
  }

  /**
   * Generate a unique event ID
   */
  generateEventId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

/**
 * Template for lifecycle events (created, updated, deleted)
 *
 * @example
 * ```typescript
 * export interface TodoCreatedPayload {
 *   aggregateId: string;
 *   userId: string;
 *   title: string;
 * }
 *
 * export class TodoCreatedEvent extends LifecycleEventTemplate<TodoCreatedPayload> {
 *   readonly name = 'TodoCreated';
 *   readonly aggregateType = 'Todo';
 *
 *   constructor(details: TodoCreatedPayload, metadata?: { correlationId?: string }) {
 *     super(details, metadata);
 *   }
 * }
 * ```
 */
export abstract class LifecycleEventTemplate<TPayload extends { aggregateId: string }> extends DomainEventTemplate<TPayload> {
  /**
   * The type of aggregate that produced this event
   */
  abstract readonly aggregateType: string;

  
}

/**
 * Template for status change events
 *
 * @example
 * ```typescript
 * export interface TodoStatusChangedPayload {
 *   aggregateId: string;
 *   userId: string;
 *   fromStatus: string;
 *   toStatus: string;
 * }
 *
 * export class TodoStatusChangedEvent extends StatusChangedEventTemplate<TodoStatusChangedPayload> {
 *   readonly name = 'TodoStatusChanged';
 *
 *   constructor(details: TodoStatusChangedPayload, metadata?: { correlationId?: string }) {
 *     super(details, metadata);
 *   }
 * }
 * ```
 */
export abstract class StatusChangedEventTemplate<TPayload extends { aggregateId: string; fromStatus: string; toStatus: string }> extends DomainEventTemplate<TPayload> {
  readonly name: string;

  constructor(payload: TPayload, metadata?: { correlationId?: string; causationId?: string }) {
    super(payload, metadata);
    this.name = `${(payload as any).aggregateType || 'Entity'}StatusChanged`;
  }
}

/**
 * Template for ownership transfer events
 *
 * @example
 * ```typescript
 * export interface TodoOwnershipTransferredPayload {
 *   aggregateId: string;
 *   fromUserId: string;
 *   toUserId: string;
 * }
 *
 * export class TodoOwnershipTransferredEvent extends OwnershipTransferredEventTemplate<TodoOwnershipTransferredPayload> {
 *   readonly name = 'TodoOwnershipTransferred';
 *
 *   constructor(details: TodoOwnershipTransferredPayload, metadata?: { correlationId?: string }) {
 *     super(details, metadata);
 *   }
 * }
 * ```
 */
export abstract class OwnershipTransferredEventTemplate<TPayload extends { aggregateId: string; fromUserId: string; toUserId: string }> extends DomainEventTemplate<TPayload> {
  readonly name: string;

  constructor(payload: TPayload, metadata?: { correlationId?: string; causationId?: string }) {
    super(payload, metadata);
    this.name = `${(payload as any).aggregateType || 'Entity'}OwnershipTransferred`;
  }
}

/**
 * Common event name templates for CRUD entities
 */
export const CrudEventNames = {
  created: (entity: string) => `${entity}Created`,
  updated: (entity: string) => `${entity}Updated`,
  deleted: (entity: string) => `${entity}Deleted`,
  statusChanged: (entity: string) => `${entity}StatusChanged`,
  ownershipTransferred: (entity: string) => `${entity}OwnershipTransferred`,
} as const;

/**
 * Create standard CRUD event payload types
 *
 * Helper function to generate consistent payload types for CRUD operations.
 */
export interface CrudEventPayloads {
  created: { aggregateId: string };
  updated: { aggregateId: string; changes: Record<string, unknown> };
  deleted: { aggregateId: string };
  statusChanged: { aggregateId: string; fromStatus: string; toStatus: string };
  ownershipTransferred: { aggregateId: string; fromUserId: string; toUserId: string };
}
