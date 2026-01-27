/**
 * Entity Template
 *
 * A template for creating domain entities that follow DDD patterns.
 * Replace ${EntityName} with your actual entity name (e.g., Todo, Product, User)
 * and ${entityName} with the lowercase version (e.g., todo, product, user).
 *
 * @example
 * ```typescript
 * import { Entity } from '@oxlayer/foundation-domain-kit';
 *
 * export type TodoStatus = 'pending' | 'in_progress' | 'completed';
 *
 * export interface TodoProps {
 *   id: string;
 *   title: string;
 *   status: TodoStatus;
 *   userId: string;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 *
 * export class Todo extends Entity<string> {
 *   private props: TodoProps;
 *
 *   private constructor(props: TodoProps) {
 *     super(props.id);
 *     this.props = props;
 *   }
 *
 *   // Getters
 *   get title(): string { return this.props.title; }
 *   get status(): TodoStatus { return this.props.status; }
 *   // ... etc
 *
 *   // Business methods
 *   markAsCompleted(): void {
 *     if (this.props.status === 'completed') return;
 *     this.props.status = 'completed';
 *     this.props.updatedAt = new Date();
 *   }
 *
 *   // Factory methods
 *   static create(data: CreateTodoInput): Todo {
 *     return new Todo({
 *       id: generateId(),
 *       title: data.title,
 *       status: 'pending',
 *       createdAt: new Date(),
 *       updatedAt: new Date(),
 *     });
 *   }
 *
 *   static fromPersistence(data: TodoProps): Todo {
 *     return new Todo(data);
 *   }
 *
 *   toPersistence(): TodoProps {
 *     return { ...this.props };
 *   }
 * }
 * ```
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

/**
 * Base template for domain entities
 *
 * Key patterns:
 * - Private props with public getters
 * - Factory methods: create() for new entities, fromPersistence() for reconstruction
 * - Business methods that encapsulate domain logic
 * - Immutability through private constructor
 */
export abstract class EntityTemplate<TProps = unknown> extends Entity<TProps> {

  /**
   * Generate a unique ID for new entities
   * Override this with your preferred ID generation strategy
   */
  protected generateId(): string {
    return `${this.constructor.name.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get the entity's current state as plain object
   * Useful for serialization and API responses
   */
  toJSON() {
    return this.toPersistence();
  }

  /**
   * Convert entity to persistence format
   * Override this in your concrete entity
   */
  abstract toPersistence(): Record<string, unknown>;
}

/**
 * Template for status-based entities
 *
 * Common pattern: entities that have a status field with state transitions
 */
export abstract class StatusEntityTemplate<TProps = unknown> extends EntityTemplate<TProps> {
  /**
   * Check if entity is in a specific status
   */
  protected isStatus(status: string): boolean {
    return (this.props as any)?.status === status;
  }

  /**
   * Update status with timestamp
   */
  protected updateStatus(newStatus: string): void {
    if (this.isStatus(newStatus)) return;

    const props = this.props as any;
    if (props) {
      props.status = newStatus;
      props.updatedAt = new Date();
    }
  }
}

/**
 * Template for timestamped entities
 *
 * Common pattern: entities with createdAt and updatedAt timestamps
 */
export abstract class TimestampedEntityTemplate<TProps = unknown> extends EntityTemplate<TProps> {
  /**
   * Update the updatedAt timestamp
   */
  protected touch(): void {
    const props = this.props as any;
    if (props && props.updatedAt) {
      props.updatedAt = new Date();
    }
  }

  /**
   * Check if entity was created after a given date
   */
  protected createdAfter(date: Date): boolean {
    const props = this.props as any;
    return props?.createdAt instanceof Date && props.createdAt > date;
  }

  /**
   * Check if entity was updated after a given date
   */
  protected updatedAfter(date: Date): boolean {
    const props = this.props as any;
    return props?.updatedAt instanceof Date && props.updatedAt > date;
  }
}

/**
 * Template for owned entities (entities with a userId or ownerId)
 *
 * Common pattern: multi-tenant applications where entities belong to users
 */
export abstract class OwnedEntityTemplate<TProps = unknown> extends EntityTemplate<TProps> {
  /**
   * Get the owner ID
   */
  get ownerId(): string {
    const props = this.props as any;
    return props?.userId || props?.ownerId || '';
  }

  /**
   * Check if entity belongs to a specific user
   */
  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  /**
   * Transfer ownership to another user
   */
  transferOwnership(newUserId: string): void {
    const props = this.props as any;
    if (props) {
      if (props.userId !== undefined) {
        props.userId = newUserId;
      }
      if (props.ownerId !== undefined) {
        props.ownerId = newUserId;
      }
      // Update timestamp if available
      if (props.updatedAt !== undefined) {
        props.updatedAt = new Date();
      }
    }
  }
}

/**
 * Combined template for entities with status, timestamps, and ownership
 *
 * Most common combination for CRUD entities
 * Note: This combines the methods from all three templates into one class
 * since TypeScript doesn't support multiple inheritance.
 */
export abstract class CrudEntityTemplate<TProps = unknown> extends EntityTemplate<TProps> {
  // Status methods from StatusEntityTemplate
  protected isStatus(status: string): boolean {
    return (this.props as any)?.status === status;
  }

  protected updateStatus(newStatus: string): void {
    if (this.isStatus(newStatus)) return;

    const props = this.props as any;
    if (props) {
      props.status = newStatus;
      props.updatedAt = new Date();
    }
  }

  // Timestamp methods from TimestampedEntityTemplate
  protected touch(): void {
    const props = this.props as any;
    if (props && props.updatedAt) {
      props.updatedAt = new Date();
    }
  }

  protected createdAfter(date: Date): boolean {
    const props = this.props as any;
    return props?.createdAt instanceof Date && props.createdAt > date;
  }

  protected updatedAfter(date: Date): boolean {
    const props = this.props as any;
    return props?.updatedAt instanceof Date && props.updatedAt > date;
  }

  // Ownership methods from OwnedEntityTemplate
  get ownerId(): string {
    const props = this.props as any;
    return props?.userId || props?.ownerId || '';
  }

  isOwnedBy(userId: string): boolean {
    return this.ownerId === userId;
  }

  transferOwnership(newUserId: string): void {
    const props = this.props as any;
    if (props) {
      if (props.userId !== undefined) {
        props.userId = newUserId;
      }
      if (props.ownerId !== undefined) {
        props.ownerId = newUserId;
      }
      this.touch();
    }
  }
}
