/**
 * Unit Tests for Mock Event Bus
 *
 * Tests the mock event bus to ensure all methods work correctly.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MockEventBus } from '@oxlayer/capabilities-testing';
import { TodoCreatedEvent, TodoUpdatedEvent } from '../../domain/events';
import type { EventEnvelope } from '@oxlayer/capabilities-events';

describe('MockEventBus', () => {
  let eventBus: MockEventBus;

  beforeEach(() => {
    eventBus = new MockEventBus();
  });

  describe('emit', () => {
    it('should publish domain events', async () => {
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Test Todo',
      });

      await eventBus.emit(event as any);

      expect(eventBus.wasPublished('Todo.Created')).toBe(true);
      expect(eventBus.count('Todo.Created')).toBe(1);
    });

    it('should store event with timestamp', async () => {
      const before = new Date();
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Test Todo',
      });

      await eventBus.emit(event as any);

      const events = eventBus.getEvents('Todo.Created');
      expect(events[0].event).toEqual(event);
      expect(events[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('should handle events without eventType', async () => {
      const eventWithoutType = { eventType: (undefined as any), aggregateId: 'test' };

      await eventBus.emit(eventWithoutType as any);

      expect(eventBus.count('unknown')).toBe(1);
    });
  });

  describe('emitEnvelope', () => {
    it('should publish event envelopes', async () => {
      const envelope: EventEnvelope<{ data: string }> = {
        id: 'env-1',
        type: 'Test.Envelope',
        version: '1.0',
        timestamp: new Date().toISOString(),
        source: 'test',
        data: { data: 'value' },
      };

      await eventBus.emitEnvelope(envelope);

      expect(eventBus.wasPublished('Test.Envelope')).toBe(true);
      expect(eventBus.count('Test.Envelope')).toBe(1);
    });
  });

  describe('on', () => {
    it('should register event handlers', async () => {
      let called = false;
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Handler Test',
      });

      await eventBus.on('Todo.Created', async (e: any) => {
        called = true;
        expect(e.payload.title).toBe('Handler Test');
      });

      await eventBus.emit(event as any);

      expect(called).toBe(true);
    });

    it('should support multiple handlers for same event', async () => {
      let count = 0;
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Multi Handler',
      });

      await eventBus.on('Todo.Created', async () => { count++; });
      await eventBus.on('Todo.Created', async () => { count++; });

      await eventBus.emit(event as any);

      expect(count).toBe(2);
    });

    it('should return unsubscribe function', async () => {
      let called = false;
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Unsubscribe Test',
      });

      const unsubscribe = await eventBus.on('Todo.Created', async () => {
        called = true;
      });

      await unsubscribe();
      await eventBus.emit(event as any);

      expect(called).toBe(false);
    });

    it('should call handlers on emit', async () => {
      const results: string[] = [];
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Handler Chain',
      });

      await eventBus.on('Todo.Created', async () => { results.push('first'); });
      await eventBus.on('Todo.Created', async () => { results.push('second'); });

      await eventBus.emit(event as any);

      expect(results).toEqual(['first', 'second']);
    });
  });

  describe('onEnvelope', () => {
    it('should register envelope handlers', async () => {
      let receivedEnvelope: EventEnvelope<unknown> | null = null;

      await eventBus.onEnvelope('Todo.Created', async (envelope) => {
        receivedEnvelope = envelope;
      });

      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Envelope Test',
      });
      await eventBus.emit(event as any);

      expect(receivedEnvelope).not.toBeNull();
      expect(receivedEnvelope!.type).toBe('Todo.Created');
    });
  });

  describe('getAllEvents', () => {
    it('should return all published events', async () => {
      const event1 = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Event 1',
      });
      const event2 = new TodoCreatedEvent({
        aggregateId: 'todo-2',
        userId: 'user-1',
        title: 'Event 2',
      });

      await eventBus.emit(event1 as any);
      await eventBus.emit(event2 as any);

      const allEvents = eventBus.getAllEvents();
      expect(allEvents).toHaveLength(2);
    });

    it('should return empty array when no events published', () => {
      expect(eventBus.getAllEvents()).toHaveLength(0);
    });

    it('should include events from multiple types', async () => {
      await eventBus.emit(new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'A',
      }) as any);
      await eventBus.emit(new TodoUpdatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        changes: { title: 'Updated' },
      }) as any);

      const allEvents = eventBus.getAllEvents();
      expect(allEvents).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all events and handlers', async () => {
      await eventBus.emit(new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Clear Test',
      }) as any);

      eventBus.clear();

      expect(eventBus.wasPublished('Todo.Created')).toBe(false);
      expect(eventBus.getAllEvents()).toHaveLength(0);
    });

    it('should clear handlers', async () => {
      let called = false;

      await eventBus.on('Todo.Created', async () => { called = true; });
      eventBus.clear();
      await eventBus.emit(new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'After Clear',
      }) as any);

      expect(called).toBe(false);
    });
  });

  describe('Deprecated Methods', () => {
    it('should support publish as emit alias', async () => {
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Publish Test',
      });

      await eventBus.publish(event as any);

      expect(eventBus.wasPublished('Todo.Created')).toBe(true);
    });

    it('should support subscribe as on alias', async () => {
      let called = false;

      await eventBus.subscribe('Todo.Created', async () => { called = true; });
      await eventBus.emit(new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'Subscribe Test',
      }) as any);

      expect(called).toBe(true);
    });
  });

  describe('Connection Status', () => {
    it('should always report as connected', () => {
      expect(eventBus.isConnected()).toBe(true);
    });

    it('should support disconnect', async () => {
      await eventBus.disconnect();
      expect(eventBus.isConnected()).toBe(true); // Mock is always connected
    });
  });

  describe('Lifecycle Methods', () => {
    it('should support start', async () => {
      await eventBus.start();
      // Mock is a no-op, just ensure it doesn't throw
      expect(eventBus.isConnected()).toBe(true);
    });

    it('should support stop', async () => {
      await eventBus.stop();
      // Mock is a no-op, just ensure it doesn't throw
      expect(eventBus.isConnected()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle emit for eventType with no existing handlers', async () => {
      const event = new TodoCreatedEvent({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'No Handlers',
      });

      await eventBus.emit(event as any);

      expect(eventBus.wasPublished('Todo.Created')).toBe(true);
    });

    it('should return empty array for unknown event type', () => {
      const events = eventBus.getEvents('NonExistent.Event');
      expect(events).toEqual([]);
    });

    it('should handle unsubscribe of non-existent handler', async () => {
      const unsubscribe = await eventBus.on('Todo.Created', async () => {});

      // Call unsubscribe twice - should not error
      await unsubscribe();
      await unsubscribe();

      expect(eventBus.count('Todo.Created')).toBe(0);
    });

    it('should handle unsubscribe when no handlers exist', async () => {
      const unsubscribe = await eventBus.on('Todo.Created', async () => {});

      // Clear all handlers first
      eventBus.clear();

      // Unsubscribe should not throw
      await unsubscribe();
    });
  });
});
