/**
 * Unit Tests for Todo Domain Events
 *
 * Tests all domain events to ensure proper instantiation and properties.
 */

import { describe, it, expect } from 'bun:test';
import {
  TodoCreatedEvent,
  TodoUpdatedEvent,
  TodoCompletedEvent,
  TodoDeletedEvent,
} from '../../domain/events';

describe('Todo Domain Events', () => {
  const basePayload = {
    aggregateId: 'todo-1',
    userId: 'user-1',
  };

  describe('TodoCreatedEvent', () => {
    it('should create event with all fields', () => {
      const event = new TodoCreatedEvent({
        ...basePayload,
        title: 'New Todo',
        description: 'Test description',
        dueDate: new Date('2024-12-31'),
      });

      expect(event.name).toBe('Todo.Created');
      expect(event.eventType).toBe('Todo.Created');
      expect(event.aggregateType).toBe('Todo');
      expect(event.payload).toMatchObject({
        aggregateId: 'todo-1',
        userId: 'user-1',
        title: 'New Todo',
        description: 'Test description',
        dueDate: new Date('2024-12-31'),
      });
    });

    it('should create event with minimal fields', () => {
      const event = new TodoCreatedEvent({
        ...basePayload,
        title: 'Simple Todo',
      });

      expect(event.payload.title).toBe('Simple Todo');
      expect(event.payload.description).toBeUndefined();
      expect(event.payload.dueDate).toBeUndefined();
    });
  });

  describe('TodoUpdatedEvent', () => {
    it('should create event with all change types', () => {
      const changes = {
        title: 'Updated Title',
        description: 'Updated description',
        status: 'completed' as const,
        dueDate: new Date('2024-12-31'),
      };

      const event = new TodoUpdatedEvent({
        ...basePayload,
        changes,
      });

      expect(event.name).toBe('Todo.Updated');
      expect(event.eventType).toBe('Todo.Updated');
      expect(event.aggregateType).toBe('Todo');
      expect(event.payload.changes).toEqual(changes);
    });

    it('should create event with partial changes', () => {
      const event = new TodoUpdatedEvent({
        ...basePayload,
        changes: { title: 'New Title' },
      });

      expect(event.payload.changes.title).toBe('New Title');
      expect(event.payload.changes.description).toBeUndefined();
      expect(event.payload.changes.status).toBeUndefined();
      expect(event.payload.changes.dueDate).toBeUndefined();
    });
  });

  describe('TodoCompletedEvent', () => {
    it('should create event with completion timestamp', () => {
      const completedAt = new Date('2024-12-31T10:30:00Z');

      const event = new TodoCompletedEvent({
        ...basePayload,
        completedAt,
      });

      expect(event.name).toBe('Todo.Completed');
      expect(event.eventType).toBe('Todo.Completed');
      expect(event.aggregateType).toBe('Todo');
      expect(event.payload).toMatchObject({
        aggregateId: 'todo-1',
        userId: 'user-1',
        completedAt,
      });
    });
  });

  describe('TodoDeletedEvent', () => {
    it('should create event with minimal payload', () => {
      const event = new TodoDeletedEvent(basePayload);

      expect(event.name).toBe('Todo.Deleted');
      expect(event.eventType).toBe('Todo.Deleted');
      expect(event.aggregateType).toBe('Todo');
      expect(event.payload).toEqual(basePayload);
    });
  });

  describe('DomainEventTemplate Methods', () => {
    it('should generate unique event IDs', () => {
      const event = new TodoCreatedEvent({
        ...basePayload,
        title: 'Test Todo',
      });

      const eventId1 = event.generateEventId();
      const eventId2 = event.generateEventId();

      expect(eventId1).toContain('Todo.Created_');
      expect(eventId2).toContain('Todo.Created_');
      expect(eventId1).not.toBe(eventId2); // Should be unique
    });

    it('should return correlation ID when set', () => {
      const correlationId = 'corr-123';
      const event = new TodoCreatedEvent(
        {
          ...basePayload,
          title: 'Test Todo',
        },
        { correlationId }
      );

      expect(event.getCorrelationId()).toBe(correlationId);
      expect(event.correlationId).toBe(correlationId);
    });

    it('should generate correlation ID when not set', () => {
      const event = new TodoCreatedEvent({
        ...basePayload,
        title: 'Test Todo',
      });

      const correlationId = event.getCorrelationId();
      expect(correlationId).toBeDefined();
      expect(correlationId).toContain('Todo.Created_');
    });

    it('should support causation ID', () => {
      const causationId = 'cause-456';
      const event = new TodoUpdatedEvent(
        {
          ...basePayload,
          changes: { title: 'Updated' },
        },
        { causationId }
      );

      expect(event.causationId).toBe(causationId);
    });

    it('should have version property', () => {
      const event = new TodoCreatedEvent({
        ...basePayload,
        title: 'Test Todo',
      });

      expect(event.version).toBe(1);
    });

    it('should have occurredAt timestamp', () => {
      const before = new Date().toISOString();
      const event = new TodoCreatedEvent({
        ...basePayload,
        title: 'Test Todo',
      });
      const after = new Date().toISOString();

      expect(event.occurredAt).toBeDefined();
      expect(event.occurredAt >= before).toBe(true);
      expect(event.occurredAt <= after).toBe(true);
    });
  });
});
