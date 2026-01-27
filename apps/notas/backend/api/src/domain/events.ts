/**
 * Todo Domain Events
 *
 * These events extend DomainEventTemplate from @oxlayer/snippets
 * which aligns with the foundation-kit's DomainEvent interface.
 *
 * @see @oxlayer/snippets/domain
 */

import { DomainEventTemplate } from '@oxlayer/snippets/domain';

/**
 * Base Todo Event
 *
 * Common properties for all Todo domain events
 * Also provides eventType for compatibility with @oxlayer/capabilities-events
 */
export abstract class TodoEvent<TPayload extends { aggregateId: string; userId: string }> extends DomainEventTemplate<TPayload> {
  abstract readonly name: string;
  readonly aggregateType = 'Todo';

  declare readonly payload: TPayload;

  /**
   * Compatibility layer for @oxlayer/capabilities-events
   * The event bus uses eventType for routing
   */
  get eventType(): string {
    return this.name;
  }
}

/**
 * Todo Created Event
 *
 * Emitted when a new todo is created
 */
export class TodoCreatedEvent extends TodoEvent<{
  aggregateId: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}> {
  readonly name = 'Todo.Created';

  constructor(details: {
    aggregateId: string;
    userId: string;
    title: string;
    description?: string;
    dueDate?: Date;
  }, metadata?: { correlationId?: string; causationId?: string }) {
    super(details, metadata);
  }
}

/**
 * Todo Updated Event
 *
 * Emitted when a todo is updated
 */
export class TodoUpdatedEvent extends TodoEvent<{
  aggregateId: string;
  userId: string;
  changes: {
    title?: string;
    description?: string;
    status?: string;
    dueDate?: Date;
  };
}> {
  readonly name = 'Todo.Updated';

  constructor(details: {
    aggregateId: string;
    userId: string;
    changes: {
      title?: string;
      description?: string;
      status?: string;
      dueDate?: Date;
    };
  }, metadata?: { correlationId?: string; causationId?: string }) {
    super(details, metadata);
  }
}

/**
 * Todo Completed Event
 *
 * Emitted when a todo is marked as completed
 */
export class TodoCompletedEvent extends TodoEvent<{
  aggregateId: string;
  userId: string;
  completedAt: Date;
}> {
  readonly name = 'Todo.Completed';

  constructor(details: {
    aggregateId: string;
    userId: string;
    completedAt: Date;
  }, metadata?: { correlationId?: string; causationId?: string }) {
    super(details, metadata);
  }
}

/**
 * Todo Deleted Event
 *
 * Emitted when a todo is deleted
 */
export class TodoDeletedEvent extends TodoEvent<{
  aggregateId: string;
  userId: string;
}> {
  readonly name = 'Todo.Deleted';

  constructor(details: {
    aggregateId: string;
    userId: string;
  }, metadata?: { correlationId?: string; causationId?: string }) {
    super(details, metadata);
  }
}
