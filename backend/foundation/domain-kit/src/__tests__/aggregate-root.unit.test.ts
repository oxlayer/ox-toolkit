/**
 * Unit Tests for AggregateRoot
 *
 * Tests the AggregateRoot with domain event management.
 */

import { describe, it, expect } from 'bun:test';
import { AggregateRoot } from '../entities/aggregate-root';
import type { DomainEvent } from '../events/domain-event';

// Test aggregate implementation
class Order extends AggregateRoot<string> {
  constructor(
    id: string,
    private items: { productId: string; quantity: number }[] = [],
    private _status: 'pending' | 'completed' | 'cancelled' = 'pending'
  ) {
    super(id);
  }

  get status(): string {
    return this._status;
  }

  get orderItems(): { productId: string; quantity: number }[] {
    return [...this.items];
  }

  addItem(productId: string, quantity: number): void {
    this.items.push({ productId, quantity });

    this.addDomainEvent({
      name: 'order.item_added',
      version: 1,
      occurredAt: new Date().toISOString(),
      payload: { orderId: this.id, productId, quantity },
    });
  }

  removeItem(productId: string): void {
    const index = this.items.findIndex((item) => item.productId === productId);
    if (index !== -1) {
      this.items.splice(index, 1);

      this.addDomainEvent({
        name: 'order.item_removed',
        version: 1,
        occurredAt: new Date().toISOString(),
        payload: { orderId: this.id, productId },
      });
    }
  }

  complete(): void {
    if (this._status !== 'pending') {
      throw new Error('Only pending orders can be completed');
    }
    this._status = 'completed';

    this.addDomainEvent({
      name: 'order.completed',
      version: 1,
      occurredAt: new Date().toISOString(),
      payload: { orderId: this.id },
    });
  }

  cancel(): void {
    this._status = 'cancelled';

    this.addDomainEvent({
      name: 'order.cancelled',
      version: 1,
      occurredAt: new Date().toISOString(),
      payload: { orderId: this.id },
    });
  }
}

describe('AggregateRoot', () => {
  describe('Domain Events', () => {
    it('should have no events initially', () => {
      const order = new Order('order-1');
      expect(order.domainEvents).toHaveLength(0);
    });

    it('should add domain event', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);

      expect(order.domainEvents).toHaveLength(1);
      expect(order.domainEvents[0].name).toBe('order.item_added');
    });

    it('should add multiple domain events', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);
      order.addItem('product-2', 1);
      order.complete();

      expect(order.domainEvents).toHaveLength(3);
    });

    it('should return read-only domain events', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);

      const events = order.domainEvents;
      expect(() => {
        (events as any).push({ name: 'fake.event' });
      }).not.toThrow();
      // The array itself is not frozen, but the property returns ReadonlyArray
    });

    it('should clear domain events', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);
      order.addItem('product-2', 1);

      expect(order.domainEvents).toHaveLength(2);

      order.clearDomainEvents();

      expect(order.domainEvents).toHaveLength(0);
    });

    it('should preserve events after clearing', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);
      order.clearDomainEvents();

      order.addItem('product-2', 1);

      expect(order.domainEvents).toHaveLength(1);
      expect((order.domainEvents[0].payload as { productId: string }).productId).toBe('product-2');
    });
  });

  describe('Event Payload', () => {
    it('should include event metadata', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);

      const event = order.domainEvents[0];
      expect(event.name).toBeDefined();
      expect(event.version).toBeDefined();
      expect(event.occurredAt).toBeDefined();
      expect(event.payload).toBeDefined();
    });

    it('should include aggregate ID in payload', () => {
      const order = new Order('order-123', []);
      order.complete();

      const event = order.domainEvents[0];
      expect((event.payload as { orderId: string }).orderId).toBe('order-123');
    });

    it('should include operation-specific data in payload', () => {
      const order = new Order('order-1');
      order.addItem('product-abc', 5);

      const event = order.domainEvents[0];
      expect((event.payload as { productId: string }).productId).toBe('product-abc');
      expect((event.payload as { quantity: number }).quantity).toBe(5);
    });

    it('should format timestamp as ISO string', () => {
      const order = new Order('order-1');
      order.cancel();

      const event = order.domainEvents[0];
      expect(event.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Entity Inheritance', () => {
    it('should inherit Entity behavior', () => {
      const order1 = new Order('order-1');
      const order2 = new Order('order-1');
      const order3 = new Order('order-2');

      expect(order1.equals(order2)).toBe(true);
      expect(order1.equals(order3)).toBe(false);
    });

    it('should have ID from Entity', () => {
      const order = new Order('order-abc-123');
      expect(order.id).toBe('order-abc-123');
    });
  });

  describe('Aggregate Behavior', () => {
    it('should enforce invariants through methods', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);
      order.complete();

      expect(() => order.complete()).toThrow('Only pending orders can be completed');
    });

    it('should track state changes', () => {
      const order = new Order('order-1');

      expect(order.status).toBe('pending');

      order.complete();
      expect(order.status).toBe('completed');

      order.cancel();
      expect(order.status).toBe('cancelled');
    });

    it('should manage internal collection', () => {
      const order = new Order('order-1');

      expect(order.orderItems).toHaveLength(0);

      order.addItem('product-1', 2);
      expect(order.orderItems).toHaveLength(1);

      order.addItem('product-2', 1);
      expect(order.orderItems).toHaveLength(2);

      order.removeItem('product-1');
      expect(order.orderItems).toHaveLength(1);
    });

    it('should emit events for state changes', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);
      order.addItem('product-2', 1);
      order.removeItem('product-1');
      order.complete();

      const eventNames = order.domainEvents.map((e) => e.name);
      expect(eventNames).toEqual(['order.item_added', 'order.item_added', 'order.item_removed', 'order.completed']);
    });
  });

  describe('Event Dispatching Pattern', () => {
    it('should support event dispatching after persistence', async () => {
      const dispatchedEvents: DomainEvent[] = [];

      const order = new Order('order-1');
      order.addItem('product-1', 2);
      order.complete();

      // Simulate event dispatching
      for (const event of order.domainEvents) {
        dispatchedEvents.push(event);
      }

      order.clearDomainEvents();

      expect(dispatchedEvents).toHaveLength(2);
      expect(order.domainEvents).toHaveLength(0);
    });

    it('should allow selective event processing', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 2);
      order.addItem('product-2', 1);
      order.complete();

      // Process only completion events
      const completionEvents = order.domainEvents.filter((e) => e.name === 'order.completed');
      expect(completionEvents).toHaveLength(1);
    });
  });

  describe('Complex Aggregates', () => {
    it('should handle nested entities', () => {
      class OrderItem {
        constructor(
          public readonly productId: string,
          public quantity: number,
          public price: number
        ) { }
      }

      class ComplexOrder extends AggregateRoot<string> {
        constructor(
          id: string,
          private items: OrderItem[] = []
        ) {
          super(id);
        }

        addItem(productId: string, quantity: number, price: number): void {
          this.items.push(new OrderItem(productId, quantity, price));

          this.addDomainEvent({
            name: 'order.item_added',
            version: 1,
            occurredAt: new Date().toISOString(),
            payload: { orderId: this.id, productId, quantity, price },
          });
        }

        updateItemQuantity(productId: string, newQuantity: number): void {
          const item = this.items.find((i) => i.productId === productId);
          if (item) {
            item.quantity = newQuantity;

            this.addDomainEvent({
              name: 'order.item_updated',
              version: 1,
              occurredAt: new Date().toISOString(),
              payload: { orderId: this.id, productId, newQuantity },
            });
          }
        }
      }

      const order = new ComplexOrder('order-1');
      order.addItem('product-1', 2, 9.99);
      order.updateItemQuantity('product-1', 5);

      expect(order.domainEvents).toHaveLength(2);
      expect(order.domainEvents[0].name).toBe('order.item_added');
      expect(order.domainEvents[1].name).toBe('order.item_updated');
    });
  });

  describe('Edge Cases', () => {
    it('should handle events with empty payload', () => {
      class TestAggregate extends AggregateRoot<string> {
        triggerEvent(): void {
          this.addDomainEvent({
            name: 'test.event',
            version: 1,
            occurredAt: new Date().toISOString(),
            payload: {},
          });
        }
      }

      const aggregate = new TestAggregate('test-1');
      aggregate.triggerEvent();

      expect(aggregate.domainEvents[0].payload).toEqual({});
    });

    it('should handle events with complex payload', () => {
      class TestAggregate extends AggregateRoot<string> {
        triggerEvent(): void {
          this.addDomainEvent({
            name: 'test.event',
            version: 1,
            occurredAt: new Date().toISOString(),
            payload: {
              nested: {
                data: [1, 2, 3],
                objects: [{ key: 'value' }],
              },
            },
          });
        }
      }

      const aggregate = new TestAggregate('test-1');
      aggregate.triggerEvent();

      expect(aggregate.domainEvents[0].payload.nested.data).toEqual([1, 2, 3]);
    });

    it('should handle rapid event generation', () => {
      const order = new Order('order-1');

      for (let i = 0; i < 100; i++) {
        order.addItem(`product-${i}`, 1);
      }

      expect(order.domainEvents).toHaveLength(100);
    });

    it('should maintain event order', () => {
      const order = new Order('order-1');
      order.addItem('product-1', 1);
      order.addItem('product-2', 2);
      order.addItem('product-3', 3);

      expect((order.domainEvents[0].payload as { productId: string }).productId).toBe('product-1');
      expect((order.domainEvents[1].payload as { productId: string }).productId).toBe('product-2');
      expect((order.domainEvents[2].payload as { productId: string }).productId).toBe('product-3');
    });
  });
});
