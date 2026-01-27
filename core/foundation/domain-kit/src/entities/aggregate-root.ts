import { Entity } from './entity.js';
import type { DomainEvent } from '../events/domain-event.js';

/**
 * Aggregate Root is the entry point to an aggregate.
 *
 * An aggregate is a cluster of domain objects that can be treated as a single unit.
 * The aggregate root is responsible for enforcing invariants across the aggregate
 * and is the only object that external objects can hold references to.
 *
 * Aggregate roots can emit domain events that are collected and dispatched
 * after the aggregate is persisted.
 *
 * @example
 * ```ts
 * class Order extends AggregateRoot<OrderId> {
 *   private items: OrderItem[] = [];
 *
 *   addItem(product: Product, quantity: number): void {
 *     this.items.push(new OrderItem(product, quantity));
 *     this.addDomainEvent({
 *       name: 'order.item_added',
 *       version: 1,
 *       occurredAt: new Date().toISOString(),
 *       payload: { orderId: this.id, productId: product.id }
 *     });
 *   }
 * }
 * ```
 */
export abstract class AggregateRoot<ID> extends Entity<ID> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
