/**
 * Test Setup Template
 *
 * Standard test file boilerplate for OxLayer applications.
 *
 * This template provides the standard imports and setup for test files.
 *
 * @example
 * ```typescript
 * // Copy this template and replace:
 * // - ${EntityName} with your entity name (e.g., Todo)
 * // - ${useCases} with your use cases
 * ```
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

// Import mocks from capabilities-testing
import {
  MockEventBus,
  MockDomainEventEmitter,
  MockBusinessMetricEmitter,
  MockTracer
} from '@oxlayer/capabilities-testing';

// Import app-specific mocks
import { Mock${EntityName}Repository } from './mocks';

// Import use cases
import {
  ${CreateUseCase},
  ${GetByIdUseCase},
  ${UpdateUseCase},
  ${DeleteUseCase},
  ${ListUseCase}
} from './use-cases';

// Import domain
import { ${EntityName} } from './domain/${entityName}';

/**
 * Standard test setup pattern.
 *
 * Use this as a starting point for new test files.
 */
describe('${EntityName}', () => {
  // Mock instances
  let ${entityName}Repository: Mock${EntityName}Repository;
  let eventBus: MockEventBus;
  let eventEmitter: MockDomainEventEmitter;
  let metricEmitter: MockBusinessMetricEmitter;
  let tracer: MockTracer;

  // Use case instances
  let ${createUseCase}: ${CreateUseCase};
  let ${getByIdUseCase}: ${GetByIdUseCase};
  let ${updateUseCase}: ${UpdateUseCase};
  let ${deleteUseCase}: ${DeleteUseCase};
  let ${listUseCase}: ${ListUseCase};

  /**
   * Setup fresh mocks before each test.
   *
   * This ensures test isolation by creating new instances
   * before each test runs.
   */
  beforeEach(() => {
    // Initialize mocks
    ${entityName}Repository = new Mock${EntityName}Repository();
    eventBus = new MockEventBus();
    eventEmitter = new MockDomainEventEmitter();
    metricEmitter = new MockBusinessMetricEmitter();
    tracer = new MockTracer();

    // Initialize use cases
    ${createUseCase} = new ${CreateUseCase}(
      ${entityName}Repository,
      eventBus,
      eventEmitter,
      metricEmitter,
      tracer
    );

    ${getByIdUseCase} = new ${GetByIdUseCase}(
      ${entityName}Repository,
      tracer
    );

    ${updateUseCase} = new ${UpdateUseCase}(
      ${entityName}Repository,
      eventBus,
      eventEmitter,
      metricEmitter,
      tracer
    );

    ${deleteUseCase} = new ${DeleteUseCase}(
      ${entityName}Repository,
      eventBus,
      eventEmitter,
      metricEmitter,
      tracer
    );

    ${listUseCase} = new ${ListUseCase}(
      ${entityName}Repository,
      tracer
    );
  });

  /**
   * Clean up after each test.
   *
   * Clear mock state to prevent test pollution.
   */
  afterEach(() => {
    ${entityName}Repository.clear();
    eventBus.clear();
    eventEmitter.clear();
    metricEmitter.clear();
    tracer.reset();
  });

  // ============================================================================
  // Test Sections
  // ============================================================================

  describe('Creation', () => {
    test('should create a new ${entityName}', async () => {
      // Arrange
      const input = {
        ${fieldName}: 'Test ${EntityName}',
        userId: 'user-1',
      };

      // Act
      const result = await ${createUseCase}.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data!.${fieldName}).toBe(input.${fieldName});
    });

    test('should emit events on creation', async () => {
      // Arrange
      const input = {
        ${fieldName}: 'Test ${EntityName}',
        userId: 'user-1',
      };

      // Act
      await ${createUseCase}.execute(input);

      // Assert
      expect(eventBus.wasPublished('${EntityName}.Created')).toBe(true);
      expect(eventEmitter.wasEventEmitted('${EntityName}.Created')).toBe(true);
      expect(metricEmitter.wasMetricRecorded('${entityName}s.created')).toBe(true);
    });
  });

  describe('Retrieval', () => {
    test('should get a ${entityName} by ID', async () => {
      // Arrange
      const ${entityName} = ${EntityName}.create({
        ${fieldName}: 'Test',
        userId: 'user-1',
      });
      ${entityName}Repository.seed([${entityName}]);

      // Act
      const result = await ${getByIdUseCase}.execute({
        id: ${entityName}.id,
        userId: 'user-1',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.id).toBe(${entityName}.id);
    });

    test('should return not found for non-existent ID', async () => {
      // Act
      const result = await ${getByIdUseCase}.execute({
        id: 'non-existent',
        userId: 'user-1',
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Update', () => {
    test('should update a ${entityName}', async () => {
      // Arrange
      const ${entityName} = ${EntityName}.create({
        ${fieldName}: 'Original',
        userId: 'user-1',
      });
      ${entityName}Repository.seed([${entityName}]);

      // Act
      const result = await ${updateUseCase}.execute({
        id: ${entityName}.id,
        userId: 'user-1',
        ${fieldName}: 'Updated',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.${fieldName}).toBe('Updated');
    });

    test('should emit events on update', async () => {
      // Arrange
      const ${entityName} = ${EntityName}.create({
        ${fieldName}: 'Original',
        userId: 'user-1',
      });
      ${entityName}Repository.seed([${entityName}]);

      // Act
      await ${updateUseCase}.execute({
        id: ${entityName}.id,
        userId: 'user-1',
        ${fieldName}: 'Updated',
      });

      // Assert
      expect(eventBus.wasPublished('${EntityName}.Updated')).toBe(true);
    });
  });

  describe('Deletion', () => {
    test('should delete a ${entityName}', async () => {
      // Arrange
      const ${entityName} = ${EntityName}.create({
        ${fieldName}: 'Test',
        userId: 'user-1',
      });
      ${entityName}Repository.seed([${entityName}]);

      // Act
      const result = await ${deleteUseCase}.execute({
        id: ${entityName}.id,
        userId: 'user-1',
      });

      // Assert
      expect(result.success).toBe(true);
    });

    test('should emit events on deletion', async () => {
      // Arrange
      const ${entityName} = ${EntityName}.create({
        ${fieldName}: 'Test',
        userId: 'user-1',
      });
      ${entityName}Repository.seed([${entityName}]);

      // Act
      await ${deleteUseCase}.execute({
        id: ${entityName}.id,
        userId: 'user-1',
      });

      // Assert
      expect(eventBus.wasPublished('${EntityName}.Deleted')).toBe(true);
    });
  });

  describe('Listing', () => {
    test('should list all ${entityName}s for a user', async () => {
      // Arrange
      const ${entityName}1 = ${EntityName}.create({
        ${fieldName}: 'First',
        userId: 'user-1',
      });
      const ${entityName}2 = ${EntityName}.create({
        ${fieldName}: 'Second',
        userId: 'user-1',
      });
      const other${EntityName} = ${EntityName}.create({
        ${fieldName}: 'Other',
        userId: 'user-2',
      });
      ${entityName}Repository.seed([${entityName}1, ${entityName}2, other${EntityName}]);

      // Act
      const result = await ${listUseCase}.execute({
        userId: 'user-1',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(2);
    });

    test('should support pagination', async () => {
      // Arrange
      const ${entityName}s = Array.from({ length: 25 }, (_, i) =>
        ${EntityName}.create({
          ${fieldName}: `Item ${i}`,
          userId: 'user-1',
        })
      );
      ${entityName}Repository.seed(${entityName}s);

      // Act
      const result = await ${listUseCase}.execute({
        userId: 'user-1',
        page: 1,
        limit: 10,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data!.items).toHaveLength(10);
      expect(result.data!.total).toBe(25);
    });
  });
});

/**
 * Helper functions for tests.
 *
 * These can be used across multiple test files.
 */
export const TestHelpers = {
  /**
   * Create a test ${entityName} with default values.
   */
  createTest${EntityName}(overrides: Partial<any> = {}): any {
    return {
      id: 'test-${entityName}-1',
      ${fieldName}: 'Test ${EntityName}',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  },

  /**
   * Wait for an event to be published.
   */
  async waitForEvent(eventBus: MockEventBus, eventType: string, timeout = 1000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (eventBus.wasPublished(eventType)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Event "${eventType}" not published within ${timeout}ms`);
  },

  /**
   * Assert that all expected events were published.
   */
  assertEventsPublished(eventBus: MockEventBus, expectedEvents: string[]) {
    expectedEvents.forEach(eventType => {
      expect(eventBus.wasPublished(eventType)).toBe(true);
    });
  },

  /**
   * Assert that all expected metrics were recorded.
   */
  assertMetricsRecorded(metricEmitter: MockBusinessMetricEmitter, expectedMetrics: string[]) {
    expectedMetrics.forEach(metricName => {
      expect(metricEmitter.wasMetricRecorded(metricName)).toBe(true);
    });
  },
};
