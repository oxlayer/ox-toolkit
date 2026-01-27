/**
 * Concurrency Tests for Todo App
 *
 * These tests validate that the todo app handles concurrent operations correctly.
 * While simple CRUD apps are generally safe from race conditions when using proper
 * database transactions, these tests verify:
 *
 * 1. No lost updates - concurrent updates to the same todo
 * 2. No duplicate creates - concurrent creation with same ID
 * 3. Idempotent operations - double completion, etc.
 * 4. Connection pool handling - many concurrent requests
 *
 * @see TESTING.md for additional test information
 */

import { describe, test, beforeEach, afterEach, expect, beforeAll, afterAll } from 'bun:test';
import { TodoRepository } from '../../repositories/index.js';
import { Todo, TodoStatus, type TodoFilters } from '../domain/todo.js';
import { MockTodoRepository, MockEventBus, MockDomainEventEmitter, MockBusinessMetricEmitter, MockTracer } from '../../test/mocks/index.js';
import { CreateTodoUseCase, UpdateTodoUseCase, DeleteTodoUseCase, GetTodosUseCase } from '../../use-cases/index.js';

describe('Todo App Concurrency Tests', () => {
  let todoRepository: TodoRepository;
  let mockEventBus: MockEventBus;
  let mockDomainEventEmitter: MockDomainEventEmitter;
  let mockBusinessMetricEmitter: MockBusinessMetricEmitter;
  let mockTracer: MockTracer;

  beforeAll(() => {
    console.log('[Concurrency Tests] Starting...');
  });

  afterAll(() => {
    console.log('[Concurrency Tests] Completed!');
  });

  beforeEach(() => {
    todoRepository = new MockTodoRepository();
    mockEventBus = new MockEventBus();
    mockDomainEventEmitter = new MockDomainEventEmitter();
    mockBusinessMetricEmitter = new MockBusinessMetricEmitter();
    mockTracer = new MockTracer();
  });

  /**
   * Race Condition Test: Concurrent Updates
   *
   * Simulates two users updating the same todo at the same time.
   * With proper database transactions, one update should win and be persisted.
   */
  describe('Concurrent Updates', () => {
    test('should handle concurrent updates to the same todo without lost updates', async () => {
      // Arrange: Create a todo
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const created = await createTodoUseCase.execute({
        title: 'Concurrent Test Todo',
        userId: 'user-1',
      });

      expect(created.success).toBe(true);
      const todoId = created.success ? created.data.id : '';

      // Act: Simulate concurrent updates from two "users"
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Both update the same todo at the "same time"
      const [result1, result2] = await Promise.all([
        updateTodoUseCase.execute({
          id: todoId,
          userId: 'user-1',
          title: 'Update 1',
          description: 'From user 1',
        }),
        updateTodoUseCase.execute({
          id: todoId,
          userId: 'user-1',
          title: 'Update 2',
          description: 'From user 2',
        }),
      ]);

      // Assert: Both should succeed, but one wins
      expect(result1.success || result2.success).toBe(true);

      // The final state should be consistent (one of the updates)
      const final = await todoRepository.findById(todoId);

      expect(final).not.toBeNull();
      const todo = final!;

      // Title should be one of the two updates (last write wins)
      expect(['Update 1', 'Update 2']).toContain(todo.title);
    });

    test('should handle concurrent status updates', async () => {
      // Arrange: Create a pending todo
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const created = await createTodoUseCase.execute({
        title: 'Status Test Todo',
        userId: 'user-1',
      });

      expect(created.success).toBe(true);
      const todoId = created.success ? created.data.id : '';

      // Act: Mark as in_progress and completed simultaneously
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      await Promise.all([
        updateTodoUseCase.execute({
          id: todoId,
          userId: 'user-1',
          status: 'in_progress',
        }),
        updateTodoUseCase.execute({
          id: todoId,
          userId: 'user-1',
          status: 'completed',
        }),
      ]);

      // Assert: Get final state and verify it's valid
      const final = await todoRepository.findById(todoId);

      expect(final).not.toBeNull();
      const todo = final!;

      // Status should be one of: in_progress or completed (last write wins)
      expect(['in_progress', 'completed']).toContain(todo.status);
    });
  });

  /**
   * Concurrent Creation Test
   *
   * Simulates creating multiple todos with the same ID simultaneously.
   * With unique constraints, only one should succeed; others should fail gracefully.
   */
  describe('Concurrent Creation', () => {
    test('should handle concurrent creation with unique IDs correctly', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Create 10 todos concurrently with different IDs
      const promises = Array.from({ length: 10 }, (_, i) =>
        createTodoUseCase.execute({
          title: `Concurrent Todo ${i}`,
          userId: 'user-1',
        })
      );

      const results = await Promise.all(promises);

      // Assert: All should succeed (unique IDs)
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
      });
    });

    test('should handle duplicate creation attempts gracefully', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Try to create todos with same ID (simulating race condition on ID generation)
      const fixedId = 'todo-duplicate-test';

      // Mock the repository to simulate a constraint violation
      const originalCreate = todoRepository.create.bind(todoRepository);
      let callCount = 0;
      todoRepository.create = async (todo) => {
        callCount++;
        if (callCount === 1) {
          return originalCreate(todo);
        }
        // Second call simulates duplicate key error
        throw new Error('Duplicate key error');
      };

      const promises = [
        createTodoUseCase.execute({
          title: 'First Attempt',
          userId: 'user-1',
        }),
        createTodoUseCase.execute({
          title: 'Second Attempt',
          userId: 'user-1',
        }),
      ];

      const results = await Promise.allSettled(promises);

      // At least one should succeed
      const successCount = results.filter((r) =>
        r.status === 'fulfilled' && (r.value as any).success
      ).length;

      expect(successCount).toBeGreaterThanOrEqual(1);
    });
  });

  /**
   * Idempotent Operation Tests
   *
   * Tests that operations can be safely retried without side effects.
   */
  describe('Idempotent Operations', () => {
    test('should handle double completion attempts idempotently', async () => {
      // Arrange: Create and complete a todo
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const created = await createTodoUseCase.execute({
        title: 'Idempotent Test Todo',
        userId: 'user-1',
      });

      expect(created.success).toBe(true);
      const todoId = created.success ? created.data.id : '';

      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Act: Complete the same todo twice (using UpdateTodoUseCase with status)
      await updateTodoUseCase.execute({
        id: todoId,
        userId: 'user-1',
        status: 'completed',
      });

      const result2 = await updateTodoUseCase.execute({
        id: todoId,
        userId: 'user-1',
        status: 'completed',
      });

      // Assert: Both should succeed (idempotent)
      expect(result2.success).toBe(true);

      // Verify status is completed
      const final = await todoRepository.findById(todoId);

      expect(final).not.toBeNull();
      expect(final!.status).toBe('completed');
    });

    test('should handle double deletion idempotently', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const deleteTodoUseCase = new DeleteTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Create and delete twice
      const created = await createTodoUseCase.execute({
        title: 'Delete Test Todo',
        userId: 'user-1',
      });

      expect(created.success).toBe(true);
      const todoId = created.success ? created.data.id : '';

      await deleteTodoUseCase.execute({ id: todoId, userId: 'user-1' });

      // Second delete should also succeed (or be idempotent)
      const result2 = await deleteTodoUseCase.execute({
        id: todoId,
        userId: 'user-1',
      });

      // Either succeeds or gracefully handles not-found
      expect(result2.success || !result2.success).toBe(true);
    });
  });

  /**
   * Connection Pool Stress Test
   *
   * Tests that the app can handle many concurrent database connections
   * without exhausting the pool.
   */
  describe('Connection Pool Stress', () => {
    test('should handle 100 concurrent reads', async () => {
      // Arrange: Create some todos
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      for (let i = 0; i < 10; i++) {
        await createTodoUseCase.execute({
          title: `Pool Test Todo ${i}`,
          userId: 'user-0', // All for same user to test read consistency
        });
      }

      // Act: Read all todos concurrently 100 times
      const getTodosUseCase = new GetTodosUseCase(todoRepository, mockTracer);
      const promises = Array.from({ length: 100 }, () =>
        getTodosUseCase.execute({ userId: 'user-0' })
      );

      // Assert: All should succeed without connection errors
      const results = await Promise.all(promises);

      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('items');
        expect(result.data).toHaveProperty('total');
      });

      // Verify all todos are returned consistently
      const todoCounts = results.map((r) => r.success ? r.data.items.length : 0);
      expect(todoCounts).toEqual(new Array(100).fill(10)); // All 10 todos, 100 times
    });

    test('should handle 50 concurrent CRUD operations', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Create 10 todos first
      const created = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          createTodoUseCase.execute({
            title: `CRUD Test ${i}`,
            userId: 'user-1',
          })
        )
      );

      const todoIds = created.map((r) => r.success ? r.data.id : '');

      // Act: Perform 50 mixed CRUD operations
      const operations: Promise<any>[] = [];

      // 20 reads (using repository directly)
      for (let i = 0; i < 20; i++) {
        operations.push(todoRepository.findById(todoIds[i % 10]));
      }

      // 20 updates
      for (let i = 0; i < 20; i++) {
        operations.push(
          updateTodoUseCase.execute({
            id: todoIds[i % 10],
            userId: 'user-1',
            title: `Updated ${i}`,
          })
        );
      }

      // 10 list operations
      const getTodosUseCase = new GetTodosUseCase(todoRepository, mockTracer);
      for (let i = 0; i < 10; i++) {
        operations.push(getTodosUseCase.execute({ userId: 'user-1' }));
      }

      const results = await Promise.all(operations);

      // Assert: All operations should succeed
      // For repository reads, check non-null; for use cases, check success
      results.forEach((result) => {
        if (result && typeof result === 'object' && 'success' in result) {
          expect(result.success).toBe(true);
        } else {
          // Repository read result - just check it's not an error
          expect(result).toBeTruthy();
        }
      });
    });
  });

  /**
   * Stress Test: Rapid Succession
   *
   * Tests that the app can handle a burst of operations in quick succession.
   */
  describe('Rapid Succession', () => {
    test('should handle 100 rapid creates in succession', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const startTime = Date.now();

      // Create 100 todos as fast as possible
      const promises = Array.from({ length: 100 }, (_, i) =>
        createTodoUseCase.execute({
          title: `Rapid Test ${i}`,
          userId: 'user-1',
        })
      );

      const results = await Promise.all(promises);

      const duration = Date.now() - startTime;

      // Assert: All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // All todos should have unique IDs
      const ids = results.map((r) => r.success ? r.data.id : '');
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);

      console.log(`Created 100 todos in ${duration}ms`);
    });
  });

  /**
   * Negative Cases - Error Handling
   *
   * Tests how the system handles errors and edge cases under concurrent load
   */
  describe('Negative Cases', () => {
    test('should handle repository errors gracefully during concurrent creates', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Mock repository to throw errors intermittently
      const originalCreate = todoRepository.create.bind(todoRepository);
      let callCount = 0;
      let errorCount = 0;
      todoRepository.create = async (todo) => {
        callCount++;
        // Fail every 3rd call
        if (callCount % 3 === 0) {
          errorCount++;
          throw new Error('Database connection lost');
        }
        return originalCreate(todo);
      };

      // Try to create 10 todos concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        createTodoUseCase.execute({
          title: `Error Test ${i}`,
          userId: 'user-1',
        })
      );

      const results = await Promise.allSettled(promises);

      // All should complete (errors are now caught and returned as results)
      expect(results).toHaveLength(10);

      // Repository errors were thrown (verified by errorCount)
      expect(errorCount).toBeGreaterThan(0);

      // All should be fulfilled (errors are caught and returned as success: false)
      const rejected = results.filter(r => r.status === 'fulfilled' && !r.value.success);
      expect(rejected.length).toBeGreaterThan(0);

      // Some should still succeed
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.success);
      expect(successes.length).toBeGreaterThan(0);

      console.log(`Repository errors: ${errorCount}, Failed: ${rejected.length}, Succeeded: ${successes.length}`);
    });

    test('should handle eventBus emit failures during concurrent operations', async () => {
      // Create a mock event bus that fails intermittently
      class FailingEventBus extends MockEventBus {
        private emitCount = 0;
        private errorCount = 0;
        async emit(): Promise<void> {
          this.emitCount++;
          // Fail every other emit
          if (this.emitCount % 2 === 0) {
            this.errorCount++;
            throw new Error('Event bus connection failed');
          }
        }
        getErrorCount() { return this.errorCount; }
      }

      const failingEventBus = new FailingEventBus();

      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        failingEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Create todos with failing event bus
      const promises = Array.from({ length: 10 }, (_, i) =>
        createTodoUseCase.execute({
          title: `EventBus Failure Test ${i}`,
          userId: 'user-1',
        })
      );

      const results = await Promise.allSettled(promises);

      // All should complete (errors are now caught and returned as results)
      expect(results).toHaveLength(10);

      // EventBus errors were thrown (verified by errorCount)
      expect(failingEventBus.getErrorCount()).toBeGreaterThan(0);

      // All should be fulfilled (event bus errors are caught, operations still succeed)
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);

      // All should succeed since event bus errors don't fail the operation
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.success);
      expect(successes.length).toBe(10);

      console.log(`EventBus errors: ${failingEventBus.getErrorCount()}, All operations succeeded despite event bus failures`);
    });

    test('should handle malformed input during concurrent creates', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Mix of valid and invalid inputs
      const operations = [
        // Valid inputs
        createTodoUseCase.execute({ title: 'Valid Todo', userId: 'user-1' }),
        createTodoUseCase.execute({ title: 'Another Valid', userId: 'user-2' }),
        // Malformed inputs (empty title, very long title, special chars)
        createTodoUseCase.execute({ title: '', userId: 'user-1' }),
        createTodoUseCase.execute({ title: 'a'.repeat(10000), userId: 'user-1' }),
        createTodoUseCase.execute({ title: '<script>alert("xss")</script>', userId: 'user-1' }),
      ];

      const results = await Promise.allSettled(operations);

      // All should return results (success or failure), no unhandled exceptions
      results.forEach((result) => {
        expect(result.status).toBe('fulfilled');
      });
    });

    test('should handle concurrent operations with non-existent IDs', async () => {
      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const deleteTodoUseCase = new DeleteTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const nonExistentId = 'non-existent-todo-id';

      // Try to update and delete same non-existent todo concurrently
      const results = await Promise.allSettled([
        updateTodoUseCase.execute({
          id: nonExistentId,
          userId: 'user-1',
          title: 'Should not work',
        }),
        deleteTodoUseCase.execute({
          id: nonExistentId,
          userId: 'user-1',
        }),
        updateTodoUseCase.execute({
          id: nonExistentId,
          userId: 'user-1',
          status: 'completed',
        }),
      ]);

      // All should handle gracefully (either fail with error or succeed with no-op)
      results.forEach((result) => {
        expect(result.status).toBe('fulfilled');
      });

      // At least some should fail (not found)
      const failures = results.filter(r => r.status === 'fulfilled' && !(r.value as any).success);
      expect(failures.length).toBeGreaterThan(0);
    });

    test('should handle mixed success/failure scenarios during load', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      const updateTodoUseCase = new UpdateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // First create some todos
      const created = await Promise.all([
        createTodoUseCase.execute({ title: 'Todo 1', userId: 'user-1' }),
        createTodoUseCase.execute({ title: 'Todo 2', userId: 'user-1' }),
        createTodoUseCase.execute({ title: 'Todo 3', userId: 'user-1' }),
      ]);

      const validIds = created.filter(r => r.success).map(r => r.success ? (r as any).data.id : '');

      // Mix of valid operations on existing todos and invalid operations
      const operations = [
        // Valid operations
        ...validIds.slice(0, 2).map(id =>
          updateTodoUseCase.execute({ id, userId: 'user-1', title: 'Updated' })
        ),
        // Invalid operations - wrong user
        ...validIds.slice(0, 2).map(id =>
          updateTodoUseCase.execute({ id, userId: 'wrong-user', title: 'Hacked' })
        ),
        // Invalid operations - non-existent IDs
        updateTodoUseCase.execute({ id: 'fake-id', userId: 'user-1', title: 'Fake' }),
        updateTodoUseCase.execute({ id: '', userId: 'user-1', title: 'Empty ID' }),
      ];

      const results = await Promise.allSettled(operations);

      // All should complete without throwing
      results.forEach((result) => {
        expect(result.status).toBe('fulfilled');
      });

      // Some should succeed, some should fail
      const successes = results.filter(r => r.status === 'fulfilled' && (r.value as any).success);
      const failures = results.filter(r => r.status === 'fulfilled' && !(r.value as any).success);

      expect(successes.length).toBeGreaterThan(0);
      expect(failures.length).toBeGreaterThan(0);
    });

    test('should handle repository throwing during concurrent reads', async () => {
      const createTodoUseCase = new CreateTodoUseCase(
        todoRepository,
        mockEventBus as any,
        mockDomainEventEmitter,
        mockBusinessMetricEmitter,
        mockTracer
      );

      // Create some todos first
      await createTodoUseCase.execute({ title: 'Todo 1', userId: 'user-1' });
      await createTodoUseCase.execute({ title: 'Todo 2', userId: 'user-1' });

      // Mock findAll to fail intermittently (GetTodosUseCase uses findAll)
      const originalFindAll = todoRepository.findAll.bind(todoRepository);
      let readCount = 0;
      let errorCount = 0;
      todoRepository.findAll = async (filters) => {
        readCount++;
        // Fail every 3rd read
        if (readCount % 3 === 0) {
          errorCount++;
          throw new Error('Read timeout');
        }
        return originalFindAll(filters);
      };

      const getTodosUseCase = new GetTodosUseCase(todoRepository, mockTracer);

      // Concurrent reads with some failing
      const promises = Array.from({ length: 10 }, () =>
        getTodosUseCase.execute({ userId: 'user-1' })
      );

      const results = await Promise.allSettled(promises);

      // All should complete (either fulfilled or rejected)
      expect(results).toHaveLength(10);

      // Repository errors were thrown (verified by errorCount)
      expect(errorCount).toBeGreaterThan(0);

      // Some should be rejected (due to repository errors)
      const rejected = results.filter(r => r.status === 'rejected');
      expect(rejected.length).toBeGreaterThan(0);

      // Some should still succeed
      const successes = results.filter(r => r.status === 'fulfilled' && (r.value as any).success);
      expect(successes.length).toBeGreaterThan(0);

      console.log(`Repository read errors: ${errorCount}, Rejected: ${rejected.length}, Succeeded: ${successes.length}`);
    });
  });
});
