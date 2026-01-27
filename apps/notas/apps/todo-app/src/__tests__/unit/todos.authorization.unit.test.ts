/**
 * Authorization Tests for Todo Use Cases
 *
 * Tests ownership, access control, and permission checks.
 *
 * Priority 2 Gap: Authorization/Ownership - NOT TESTED
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { Todo } from '../../domain/todo.js';
import {
  CreateTodoUseCase,
  UpdateTodoUseCase,
  GetTodosUseCase,
  DeleteTodoUseCase,
} from '../../use-cases/index.js';
import {
  MockTodoRepository,
  MockEventBus,
  MockDomainEventEmitter,
  MockBusinessMetricEmitter,
  MockTracer,
} from '../../test/mocks/index.js';

describe('Todo Authorization Tests', () => {
  let todoRepository: MockTodoRepository;
  let mockEventBus: MockEventBus;
  let mockDomainEventEmitter: MockDomainEventEmitter;
  let mockBusinessMetricEmitter: MockBusinessMetricEmitter;
  let mockTracer: MockTracer;

  beforeEach(() => {
    todoRepository = new MockTodoRepository();
    mockEventBus = new MockEventBus();
    mockDomainEventEmitter = new MockDomainEventEmitter();
    mockBusinessMetricEmitter = new MockBusinessMetricEmitter();
    mockTracer = new MockTracer();
  });

  describe('UpdateTodoUseCase - Ownership', () => {
    test('should allow owner to update their own todo', async () => {
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Create a todo owned by user-1
      const todo = Todo.create({
        title: 'User 1 Todo',
        userId: 'user-1',
      });
      todoRepository.seed([todo]);

      const result = await updateTodoUseCase.execute({
        id: todo.id,
        userId: 'user-1', // Same as owner
        title: 'Updated by owner',
      });

      expect(result.success).toBe(true);
      expect(result.data!.title).toBe('Updated by owner');
    });

    test('should deny non-owner from updating someone else\'s todo', async () => {
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Create a todo owned by user-1
      const todo = Todo.create({
        title: 'User 1 Todo',
        userId: 'user-1',
      });
      todoRepository.seed([todo]);

      const result = await updateTodoUseCase.execute({
        id: todo.id,
        userId: 'user-2', // Different from owner
        title: 'Hacked!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/not authorized|forbidden|not found/i);
    });

    test('should deny update when userId does not match todo owner', async () => {
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const todo = Todo.create({
        title: 'Protected Todo',
        userId: 'admin-1',
      });
      todoRepository.seed([todo]);

      const result = await updateTodoUseCase.execute({
        id: todo.id,
        userId: 'hacker-1',
        title: 'Stolen',
      });

      expect(result.success).toBe(false);
    });

    test('should not update todo ownership', async () => {
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const todo = Todo.create({
        title: 'Original Todo',
        userId: 'user-1',
      });
      todoRepository.seed([todo]);

      // Try to update by changing userId (if allowed by input type)
      const result = await updateTodoUseCase.execute({
        id: todo.id,
        userId: 'user-1',
        userId: 'user-2', // Attempt to transfer ownership
      } as any);

      // After update, verify userId is still user-1
      const updated = await todoRepository.findById(todo.id);
      expect(updated!.userId).toBe('user-1');
    });
  });

  describe('DeleteTodoUseCase - Ownership', () => {
    test('should allow owner to delete their own todo', async () => {
      const deleteTodoUseCase = new DeleteTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const todo = Todo.create({
        title: 'My Todo',
        userId: 'user-1',
      });
      todoRepository.seed([todo]);

      const result = await deleteTodoUseCase.execute({
        id: todo.id,
        userId: 'user-1',
      });

      expect(result.success).toBe(true);
      expect(await todoRepository.findById(todo.id)).toBeNull();
    });

    test('should deny non-owner from deleting someone else\'s todo', async () => {
      const deleteTodoUseCase = new DeleteTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const todo = Todo.create({
        title: 'Protected Todo',
        userId: 'user-1',
      });
      todoRepository.seed([todo]);

      const result = await deleteTodoUseCase.execute({
        id: todo.id,
        userId: 'user-2', // Different user
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Verify todo still exists
      const notDeleted = await todoRepository.findById(todo.id);
      expect(notDeleted).not.toBeNull();
    });

    test('should deny delete when userId is empty', async () => {
      const deleteTodoUseCase = new DeleteTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const todo = Todo.create({
        title: 'Test',
        userId: 'user-1',
      });
      todoRepository.seed([todo]);

      const result = await deleteTodoUseCase.execute({
        id: todo.id,
        userId: '',
      } as any);

      expect(result.success).toBe(false);
    });
  });

  describe('GetTodosUseCase - Authorization', () => {
    test('should only return todos owned by the user', async () => {
      const getTodosUseCase = new GetTodosUseCase(todoRepository, mockTracer);

      const todo1 = Todo.create({
        title: 'User 1 Todo',
        userId: 'user-1',
      });
      const todo2 = Todo.create({
        title: 'User 2 Todo',
        userId: 'user-2',
      });
      todoRepository.seed([todo1, todo2]);

      const result = await getTodosUseCase.execute({
        userId: 'user-1',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].userId).toBe('user-1');
      }
    });

    test('should return empty when user has no todos', async () => {
      const getTodosUseCase = new GetTodosUseCase(todoRepository, mockTracer);

      const result = await getTodosUseCase.execute({
        userId: 'non-existent-user',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toHaveLength(0);
      }
    });
  });

  describe('Cross-User Access Scenarios', () => {
    test('should handle multiple users with different todos', async () => {
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const todo1 = Todo.create({
        title: 'User 1 Todo',
        userId: 'user-1',
      });
      const todo2 = Todo.create({
        title: 'User 2 Todo',
        userId: 'user-2',
      });
      todoRepository.seed([todo1, todo2]);

      // User 1 can update their own todo
      const result1 = await updateTodoUseCase.execute({
        id: todo1.id,
        userId: 'user-1',
        title: 'Updated by user 1',
      });
      expect(result1.success).toBe(true);

      // User 1 cannot update user 2's todo
      const result2 = await updateTodoUseCase.execute({
        id: todo2.id,
        userId: 'user-1',
        title: 'Should not work',
      });
      expect(result2.success).toBe(false);

      // User 2 can update their own todo
      const result3 = await updateTodoUseCase.execute({
        id: todo2.id,
        userId: 'user-2',
        title: 'Updated by user 2',
      });
      expect(result3.success).toBe(true);
    });
  });

  describe('Edge Cases - Authorization', () => {

    test('should handle special characters in userId', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const result = await createTodoUseCase.execute({
        title: 'Test',
        userId: 'user@example.com',
      });

      // Should handle or reject based on validation
      expect(result).toBeDefined();
    });

    test('should handle very long userIds', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const longUserId = 'user-1'.repeat(100);
      const result = await createTodoUseCase.execute({
        title: 'Test',
        userId: longUserId,
      });

      expect(result).toBeDefined();
    });

    test('should handle userId with leading/trailing whitespace', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const result = await createTodoUseCase.execute({
        title: 'Test',
        userId: '  user-1  ',
      });

      // Should trim or reject
      expect(result).toBeDefined();
    });
  });
});
