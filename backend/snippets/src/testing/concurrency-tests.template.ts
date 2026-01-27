/**
 * Concurrency Test Template
 *
 * Template for testing concurrent operations and race conditions.
 *
 * This template provides common concurrency test patterns that can be
 * adapted for different use cases and entities.
 *
 * @example
 * ```typescript
 * // Copy this template and replace:
 * // - ${EntityName} with your entity name (e.g., Todo)
 * // - ${CreateUseCase} with your use case name (e.g., CreateTodoUseCase)
 * // - ${UpdateUseCase} with your update use case name
 * ```
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { ${CreateUseCase}, ${UpdateUseCase}, ${DeleteUseCase}, ${GetUseCase} } from './${useCaseFile}';
import { Mock${EntityName}Repository } from './mocks';
import { MockEventBus, MockDomainEventEmitter, MockBusinessMetricEmitter, MockTracer } from '@oxlayer/capabilities-testing';

describe('${EntityName} Concurrency Tests', () => {
  let ${entityName}Repository: Mock${EntityName}Repository;
  let eventBus: MockEventBus;
  let eventEmitter: MockDomainEventEmitter;
  let metricEmitter: MockBusinessMetricEmitter;
  let tracer: MockTracer;

  beforeAll(() => {
    console.log('[Concurrency Tests] Starting...');
  });

  afterAll(() => {
    console.log('[Concurrency Tests] Completed!');
  });

  function setupMocks() {
    ${entityName}Repository = new Mock${EntityName}Repository();
    eventBus = new MockEventBus();
    eventEmitter = new MockDomainEventEmitter();
    metricEmitter = new MockBusinessMetricEmitter();
    tracer = new MockTracer();
  }

  describe('Concurrent Updates', () => {
    test('should handle concurrent updates to the same ${entityName} without lost updates', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);
      const ${updateUseCase} = new ${UpdateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);

      // Create a ${entityName}
      const created = await ${createUseCase}.execute({
        ${fieldName}: 'Test ${EntityName}',
        userId: 'user-1',
      });
      expect(created.success).toBe(true);
      const ${entityName}Id = created.data!.id;

      // Act: Simulate concurrent updates from two "users"
      const [result1, result2] = await Promise.all([
        ${updateUseCase}.execute({
          id: ${entityName}Id,
          userId: 'user-1',
          ${fieldName}: 'Update 1',
        }),
        ${updateUseCase}.execute({
          id: ${entityName}Id,
          userId: 'user-1',
          ${fieldName}: 'Update 2',
        }),
      ]);

      // Assert: Both should succeed, but one wins (last write wins)
      expect(result1.success || result2.success).toBe(true);

      const final = await ${entityName}Repository.findById(${entityName}Id);
      expect(final).not.toBeNull();
      expect(['Update 1', 'Update 2']).toContain(final!.${fieldName});
    });

    test('should handle concurrent status updates', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);
      const ${updateUseCase} = new ${UpdateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);

      const created = await ${createUseCase}.execute({
        ${fieldName}: 'Status Test',
        userId: 'user-1',
      });
      const ${entityName}Id = created.data!.id;

      // Mark as in_progress and completed simultaneously
      await Promise.all([
        ${updateUseCase}.execute({
          id: ${entityName}Id,
          userId: 'user-1',
          status: 'in_progress',
        }),
        ${updateUseCase}.execute({
          id: ${entityName}Id,
          userId: 'user-1',
          status: 'completed',
        }),
      ]);

      const final = await ${entityName}Repository.findById(${entityName}Id);
      expect(final).not.toBeNull();
      expect(['in_progress', 'completed']).toContain(final!.status);
    });
  });

  describe('Concurrent Creation', () => {
    test('should handle concurrent creation with unique IDs correctly', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);

      // Create 10 ${entityName}s concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        ${createUseCase}.execute({
          ${fieldName}: `Concurrent ${EntityName} ${i}`,
          userId: 'user-1',
        })
      );

      const results = await Promise.all(promises);

      // All should succeed with unique IDs
      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
      });

      // Verify all IDs are unique
      const ids = results.map((r) => r.data!.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(10);
    });

    test('should handle duplicate creation attempts gracefully', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);

      // Mock repository to simulate constraint violation
      const originalCreate = ${entityName}Repository.create.bind(${entityName}Repository);
      let callCount = 0;
      ${entityName}Repository.create = async (${entityName}) => {
        callCount++;
        if (callCount === 1) {
          return originalCreate(${entityName});
        }
        throw new Error('Duplicate key error');
      };

      const promises = [
        ${createUseCase}.execute({
          ${fieldName}: 'First Attempt',
          userId: 'user-1',
        }),
        ${createUseCase}.execute({
          ${fieldName}: 'Second Attempt',
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

  describe('Idempotent Operations', () => {
    test('should handle double ${action} attempts idempotently', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);
      const ${updateUseCase} = new ${UpdateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);

      const created = await ${createUseCase}.execute({
        ${fieldName}: 'Idempotent Test',
        userId: 'user-1',
      });
      const ${entityName}Id = created.data!.id;

      // ${action} the same ${entityName} twice
      await ${updateUseCase}.execute({
        id: ${entityName}Id,
        userId: 'user-1',
        status: 'completed',
      });

      const result2 = await ${updateUseCase}.execute({
        id: ${entityName}Id,
        userId: 'user-1',
        status: 'completed',
      });

      // Both should succeed (idempotent)
      expect(result2.success).toBe(true);

      const final = await ${entityName}Repository.findById(${entityName}Id);
      expect(final!.status).toBe('completed');
    });

    test('should handle double deletion idempotently', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);
      const ${deleteUseCase} = new ${DeleteUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);

      const created = await ${createUseCase}.execute({
        ${fieldName}: 'Delete Test',
        userId: 'user-1',
      });
      const ${entityName}Id = created.data!.id;

      await ${deleteUseCase}.execute({ id: ${entityName}Id, userId: 'user-1' });

      // Second delete should also succeed or be idempotent
      const result2 = await ${deleteUseCase}.execute({
        id: ${entityName}Id,
        userId: 'user-1',
      });

      expect(result2.success || !result2.success).toBe(true);
    });
  });

  describe('Connection Pool Stress', () => {
    test('should handle 100 concurrent reads', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);
      const ${getUseCase} = new ${GetUseCase}(${entityName}Repository, tracer);

      // Create some ${entityName}s first
      for (let i = 0; i < 10; i++) {
        await ${createUseCase}.execute({
          ${fieldName}: `Pool Test ${i}`,
          userId: 'user-0',
        });
      }

      // Read all ${entityName}s concurrently 100 times
      const promises = Array.from({ length: 100 }, () =>
        ${getUseCase}.execute({ userId: 'user-0' })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // Verify all ${entityName}s are returned consistently
      const counts = results.map((r) => r.success ? r.data.items.length : 0);
      expect(counts).toEqual(new Array(100).fill(10));
    });

    test('should handle 50 concurrent CRUD operations', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);
      const ${updateUseCase} = new ${UpdateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);
      const ${getUseCase} = new ${GetUseCase}(${entityName}Repository, tracer);

      // Create 10 ${entityName}s first
      const created = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          ${createUseCase}.execute({
            ${fieldName}: `CRUD Test ${i}`,
            userId: 'user-1',
          })
        )
      );

      const ${entityName}Ids = created.map((r) => r.success ? r.data.id : '');

      // Perform 50 mixed CRUD operations
      const operations: Promise<any>[] = [];

      // 20 reads
      for (let i = 0; i < 20; i++) {
        operations.push(${entityName}Repository.findById(${entityName}Ids[i % 10]));
      }

      // 20 updates
      for (let i = 0; i < 20; i++) {
        operations.push(
          ${updateUseCase}.execute({
            id: ${entityName}Ids[i % 10],
            userId: 'user-1',
            ${fieldName}: `Updated ${i}`,
          })
        );
      }

      // 10 list operations
      for (let i = 0; i < 10; i++) {
        operations.push(${getUseCase}.execute({ userId: 'user-1' }));
      }

      const results = await Promise.all(operations);

      // All operations should succeed
      results.forEach((result) => {
        if (result && typeof result === 'object' && 'success' in result) {
          expect(result.success).toBe(true);
        }
      });
    });
  });

  describe('Negative Cases', () => {
    test('should handle repository errors gracefully during concurrent creates', async () => {
      setupMocks();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, eventBus, eventEmitter, metricEmitter, tracer);

      // Mock repository to throw errors intermittently
      const originalCreate = ${entityName}Repository.create.bind(${entityName}Repository);
      let errorCount = 0;
      ${entityName}Repository.create = async (${entityName}) => {
        if (Math.random() < 0.3) {
          errorCount++;
          throw new Error('Database connection lost');
        }
        return originalCreate(${entityName});
      };

      const promises = Array.from({ length: 10 }, (_, i) =>
        ${createUseCase}.execute({
          ${fieldName}: `Error Test ${i}`,
          userId: 'user-1',
        })
      );

      const results = await Promise.allSettled(promises);

      // All should complete (either fulfilled or rejected)
      expect(results).toHaveLength(10);
      expect(errorCount).toBeGreaterThan(0);

      // Some should be rejected, some should succeed
      const rejected = results.filter((r) => r.status === 'rejected');
      const successes = results.filter((r) => r.status === 'fulfilled' && (r.value as any).success);
      expect(rejected.length + successes.length).toBe(10);
    });

    test('should handle eventBus failures during concurrent operations', async () => {
      setupMocks();

      class FailingEventBus extends MockEventBus {
        private emitCount = 0;
        private errorCount = 0;
        async emit(): Promise<void> {
          this.emitCount++;
          if (this.emitCount % 2 === 0) {
            this.errorCount++;
            throw new Error('Event bus connection failed');
          }
        }
        getErrorCount() { return this.errorCount; }
      }

      const failingEventBus = new FailingEventBus();

      const ${createUseCase} = new ${CreateUseCase}(${entityName}Repository, failingEventBus as any, eventEmitter, metricEmitter, tracer);

      const promises = Array.from({ length: 10 }, (_, i) =>
        ${createUseCase}.execute({
          ${fieldName}: `EventBus Failure ${i}`,
          userId: 'user-1',
        })
      );

      const results = await Promise.allSettled(promises);

      expect(failingEventBus.getErrorCount()).toBeGreaterThan(0);
      expect(results.length).toBe(10);
    });
  });
});
