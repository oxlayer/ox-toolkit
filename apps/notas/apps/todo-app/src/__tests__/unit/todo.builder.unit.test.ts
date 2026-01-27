/**
 * Unit Tests for Todo Builder
 *
 * Tests the Todo builder methods to ensure fluent API works correctly.
 */

import { describe, it, expect } from 'bun:test';
import { createTodoBuilder } from '../../test/builders/todo.builder';
import { Todo } from '../../domain/todo';

describe('TodoBuilder', () => {
  describe('withDefaults', () => {
    it('should set multiple defaults at once', () => {
      const todo = createTodoBuilder()
        .withDefaults({
          id: 'custom-id',
          title: 'Custom Title',
          status: 'completed',
        })
        .build();

      expect(todo.id).toBe('custom-id');
      expect(todo.title).toBe('Custom Title');
      expect(todo.status).toBe('completed');
    });

    it('should chain withDefaults with other methods', () => {
      const todo = createTodoBuilder()
        .withDefaults({ title: 'Base Title' })
        .withTitle('Overridden Title')
        .build();

      expect(todo.title).toBe('Overridden Title');
    });
  });

  describe('withDueInDays', () => {
    it('should set due date to X days from now', () => {
      const todo = createTodoBuilder()
        .withDueInDays(7)
        .build();

      expect(todo.dueDate).toBeDefined();
      const expectedTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
      const actualTime = todo.dueDate!.getTime();
      // Allow 1 second tolerance
      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
    });

    it('should handle negative days (past due date)', () => {
      const todo = createTodoBuilder()
        .withDueInDays(-3)
        .build();

      expect(todo.dueDate).toBeDefined();
      const expectedTime = Date.now() - 3 * 24 * 60 * 60 * 1000;
      const actualTime = todo.dueDate!.getTime();
      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000);
    });

    it('should handle zero days (due today)', () => {
      const todo = createTodoBuilder()
        .withDueInDays(0)
        .build();

      expect(todo.dueDate).toBeDefined();
      const now = Date.now();
      const actualTime = todo.dueDate!.getTime();
      expect(Math.abs(actualTime - now)).toBeLessThan(1000);
    });
  });

  describe('withCompletedAt', () => {
    it('should set completed at date', () => {
      const completedDate = new Date('2024-01-15T10:30:00Z');
      const todo = createTodoBuilder()
        .withCompletedAt(completedDate)
        .build();

      expect(todo.completedAt).toEqual(completedDate);
    });

    it('should set completed at when also marked as completed', () => {
      const completedDate = new Date('2024-01-15T10:30:00Z');
      const todo = createTodoBuilder()
        .completed()
        .withCompletedAt(completedDate)
        .build();

      expect(todo.status).toBe('completed');
      expect(todo.completedAt).toEqual(completedDate);
    });
  });

  describe('withTenantId', () => {
    it('should set tenant ID', () => {
      const todoProps = createTodoBuilder()
        .withTenantId('tenant-123')
        .buildProps();

      expect(todoProps.tenantId).toBe('tenant-123');
    });

    it('should preserve tenant ID in built entity', () => {
      const todoProps = createTodoBuilder()
        .withTenantId('tenant-abc')
        .buildProps();

      const todo = Todo.fromPersistence(todoProps);
      expect((todo as any).props.tenantId).toBe('tenant-abc');
    });
  });

  describe('buildProps', () => {
    it('should return plain object with all properties', () => {
      const props = createTodoBuilder()
        .withId('todo-123')
        .withTitle('Test Todo')
        .withDescription('Test Description')
        .pending()
        .withUserId('user-456')
        .withTenantId('tenant-789')
        .buildProps();

      expect(props).toEqual({
        id: 'todo-123',
        title: 'Test Todo',
        description: 'Test Description',
        status: 'pending',
        userId: 'user-456',
        tenantId: 'tenant-789',
        dueDate: undefined,
        completedAt: undefined,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return a copy (not reference to defaults)', () => {
      const builder = createTodoBuilder().withTitle('Original');
      const props1 = builder.buildProps();
      const props2 = builder.buildProps();

      expect(props1).not.toBe(props2);
      expect(props1.title).toBe(props2.title);
    });
  });

  describe('Complex chaining', () => {
    it('should support complex fluent API chains', () => {
      const dueDate = new Date('2024-12-31');
      const completedAt = new Date('2024-12-25');

      const todo = createTodoBuilder()
        .withDefaults({ title: 'Default Title' })
        .withId('todo-1')
        .withTitle('Final Title')
        .withDescription('Final Description')
        .completed()
        .withUserId('user-1')
        .withDueDate(dueDate)
        .withCompletedAt(completedAt)
        .withTenantId('tenant-1')
        .build();

      expect(todo.id).toBe('todo-1');
      expect(todo.title).toBe('Final Title');
      expect(todo.description).toBe('Final Description');
      expect(todo.status).toBe('completed');
      expect(todo.userId).toBe('user-1');
      expect(todo.dueDate).toEqual(dueDate);
      expect(todo.completedAt).toEqual(completedAt);
    });

    it('should allow building multiple todos from same builder with different values', () => {
      const builder = createTodoBuilder();

      const todo1 = builder.withId('todo-1').withTitle('Todo 1').build();
      const todo2 = builder.withId('todo-2').withTitle('Todo 2').build();

      expect(todo1.id).toBe('todo-1');
      expect(todo1.title).toBe('Todo 1');
      expect(todo2.id).toBe('todo-2');
      expect(todo2.title).toBe('Todo 2');
    });
  });
});
