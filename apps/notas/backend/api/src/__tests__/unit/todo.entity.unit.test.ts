/**
 * Unit Tests for Todo Entity
 *
 * Tests the Todo domain entity business logic.
 */

import { describe, it, expect } from 'bun:test';
import { Todo } from '../../domain/todo';
import { createTodoBuilder } from '../../test/builders/todo.builder';

describe('Todo Entity', () => {
  describe('Creation', () => {
    it('should create a new todo with pending status', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        userId: 'user-1',
      });

      expect(todo.id).toBe('todo-1');
      expect(todo.title).toBe('Test Todo');
      expect(todo.status).toBe('pending');
      expect(todo.userId).toBe('user-1');
      expect(todo.completedAt).toBeUndefined();
    });

    it('should create a todo with optional fields', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        description: 'Test description',
        userId: 'user-1',
        dueDate: new Date('2024-12-31'),
      });

      expect(todo.description).toBe('Test description');
      expect(todo.dueDate).toEqual(new Date('2024-12-31'));
    });
  });

  describe('State Transitions', () => {
    it('should mark todo as completed', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        userId: 'user-1',
      });

      (todo as any).markAsCompleted();

      expect(todo.status).toBe('completed');
      expect(todo.completedAt).toBeInstanceOf(Date);
    });

    it('should not mark as completed if already completed (idempotent)', () => {
      const todo = createTodoBuilder().completed().build();
      const originalCompletedAt = todo.completedAt;

      (todo as any).markAsCompleted();

      expect(todo.status).toBe('completed');
      expect(todo.completedAt).toBe(originalCompletedAt);
    });

    it('should mark todo as in progress', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        userId: 'user-1',
      });

      (todo as any).markAsInProgress();

      expect(todo.status).toBe('in_progress');
    });

    it('should not mark as in progress if already in progress (idempotent)', () => {
      const todo = createTodoBuilder().inProgress().build();
      const originalUpdatedAt = todo.updatedAt;

      (todo as any).markAsInProgress();

      expect(todo.status).toBe('in_progress');
      expect(todo.updatedAt).toBe(originalUpdatedAt);
    });

    it('should reset todo to pending', () => {
      const todo = createTodoBuilder().completed().build();

      (todo as any).resetToPending();

      expect(todo.status).toBe('pending');
      expect(todo.completedAt).toBeUndefined();
    });

    it('should not reset to pending if already pending (idempotent)', () => {
      const todo = createTodoBuilder().pending().build();
      const originalUpdatedAt = todo.updatedAt;

      (todo as any).resetToPending();

      expect(todo.status).toBe('pending');
      expect(todo.updatedAt).toBe(originalUpdatedAt);
    });
  });

  describe('Updating Details', () => {
    it('should update todo title', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Original Title',
        userId: 'user-1',
      });

      todo.updateDetails({ title: 'Updated Title' });

      expect(todo.title).toBe('Updated Title');
    });

    it('should update todo description', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        userId: 'user-1',
      });

      todo.updateDetails({ description: 'New description' });

      expect(todo.description).toBe('New description');
    });

    it('should update todo due date', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        userId: 'user-1',
      });

      const newDate = new Date('2024-12-31');
      todo.updateDetails({ dueDate: newDate });

      expect(todo.dueDate).toEqual(newDate);
    });

    it('should update multiple fields at once', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Original Title',
        userId: 'user-1',
      });

      const newDate = new Date('2024-12-31');
      todo.updateDetails({
        title: 'Updated Title',
        description: 'Updated Description',
        dueDate: newDate,
      });

      expect(todo.title).toBe('Updated Title');
      expect(todo.description).toBe('Updated Description');
      expect(todo.dueDate).toEqual(newDate);
    });

    it('should update updatedAt timestamp', async () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        userId: 'user-1',
      });

      const originalUpdatedAt = todo.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      todo.updateDetails({ title: 'Updated' });

      expect(todo.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    it('should handle update with no changes gracefully', async () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        userId: 'user-1',
      });

      const originalUpdatedAt = todo.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      todo.updateDetails({});

      expect(todo.title).toBe('Test Todo');
      expect(todo.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Persistence', () => {
    it('should convert to persistence format', () => {
      const todo = Todo.create({
        id: 'todo-1',
        title: 'Test Todo',
        description: 'Test description',
        userId: 'user-1',
        dueDate: new Date('2024-12-31'),
      });

      const persistence = todo.toPersistence();

      expect(persistence).toEqual({
        id: 'todo-1',
        title: 'Test Todo',
        description: 'Test description',
        status: 'pending',
        userId: 'user-1',
        dueDate: new Date('2024-12-31'),
        completedAt: undefined,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
      });
    });

    it('should reconstruct from persistence', () => {
      const persistenceData = {
        id: 'todo-1',
        title: 'Test Todo',
        description: 'Test description',
        status: 'completed' as const,
        userId: 'user-1',
        dueDate: new Date('2024-12-31'),
        completedAt: new Date('2024-01-15'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
      };

      const todo = Todo.fromPersistence(persistenceData);

      expect(todo.id).toBe('todo-1');
      expect(todo.title).toBe('Test Todo');
      expect(todo.status).toBe('completed');
      expect(todo.completedAt).toEqual(new Date('2024-01-15'));
    });

    it('should reconstruct completed todo from persistence', () => {
      const completedTodo = createTodoBuilder().completed().build();
      const persistence = completedTodo.toPersistence();

      const reconstructed = Todo.fromPersistence(persistence);

      expect(reconstructed.id).toBe(completedTodo.id);
      expect(reconstructed.status).toBe('completed');
      expect(reconstructed.completedAt).toEqual(completedTodo.completedAt);
    });

    it('should reconstruct in progress todo from persistence', () => {
      const inProgressTodo = createTodoBuilder().inProgress().build();
      const persistence = inProgressTodo.toPersistence();

      const reconstructed = Todo.fromPersistence(persistence);

      expect(reconstructed.id).toBe(inProgressTodo.id);
      expect(reconstructed.status).toBe('in_progress');
    });

    it('should reconstruct pending todo from persistence', () => {
      const pendingTodo = createTodoBuilder().pending().build();
      const persistence = pendingTodo.toPersistence();

      const reconstructed = Todo.fromPersistence(persistence);

      expect(reconstructed.id).toBe(pendingTodo.id);
      expect(reconstructed.status).toBe('pending');
    });
  });

  describe('Getters - Coverage for lines 60-73', () => {
    it('should expose all getters', () => {
      const todo = createTodoBuilder()
        .withTitle('Getter Test')
        .withDescription('Getter Description')
        .withDueDate(new Date('2024-12-31'))
        .pending()
        .build();

      expect(todo.title).toBe('Getter Test');
      expect(todo.description).toBe('Getter Description');
      expect(todo.status).toBe('pending');
      expect(todo.userId).toBeDefined();
      expect(todo.dueDate).toBeDefined();
      expect(todo.completedAt).toBeUndefined();
      expect(todo.createdAt).toBeInstanceOf(Date);
      expect(todo.updatedAt).toBeInstanceOf(Date);
    });
  });
});
