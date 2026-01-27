/**
 * Integration Test Template
 *
 * Template for integration tests that test the full stack
 * from HTTP layer through to persistence.
 *
 * @example
 * ```typescript
 * // Copy this template and replace:
 * // - ${EntityName} with your entity name (e.g., Todo)
 * // - ${Controller} with your controller name
 * ```
 */

import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { createApp } from './app'; // Your Hono app
import { Mock${EntityName}Repository } from './mocks';
import {
  MockEventBus,
  MockDomainEventEmitter,
  MockBusinessMetricEmitter,
  MockTracer
} from '@oxlayer/capabilities-testing';

/**
 * Integration test setup for ${EntityName}.
 *
 * These tests verify that the entire stack works together,
 * from HTTP request to response, including all middleware.
 */
describe('${EntityName} Integration Tests', () => {
  let app: ReturnType<typeof createApp>;
  let ${entityName}Repository: Mock${EntityName}Repository;
  let eventBus: MockEventBus;
  let eventEmitter: MockDomainEventEmitter;
  let metricEmitter: MockBusinessMetricEmitter;
  let tracer: MockTracer;

  beforeAll(async () => {
    // Setup test infrastructure
    ${entityName}Repository = new Mock${EntityName}Repository();
    eventBus = new MockEventBus();
    eventEmitter = new MockDomainEventEmitter();
    metricEmitter = new MockBusinessMetricEmitter();
    tracer = new MockTracer();

    // Create app with test dependencies
    app = createApp({
      ${entityName}Repository,
      eventBus,
      eventEmitter,
      metricEmitter,
      tracer,
    });
  });

  afterAll(() => {
    // Cleanup
    ${entityName}Repository.clear();
    eventBus.clear();
    eventEmitter.clear();
    metricEmitter.clear();
  });

  describe('POST /${entityName}s', () => {
    test('should create a new ${entityName}', async () => {
      const response = await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Test ${EntityName}',
        }),
      });

      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json).toHaveProperty('id');
      expect(json.${fieldName}).toBe('Test ${EntityName}');

      // Verify events were published
      expect(eventBus.wasPublished('${EntityName}.Created')).toBe(true);
      expect(eventEmitter.wasEventEmitted('${EntityName}.Created')).toBe(true);
      expect(metricEmitter.wasMetricRecorded('${entityName}s.created')).toBe(true);
    });

    test('should return 400 for invalid input', async () => {
      const response = await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: '', // Invalid: empty string
        }),
      });

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toHaveProperty('error');
    });

    test('should return 401 for missing auth', async () => {
      const response = await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ${fieldName}: 'Test ${EntityName}',
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /${entityName}s/:id', () => {
    test('should get a ${entityName} by ID', async () => {
      // First create a ${entityName}
      const createResponse = await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Test ${EntityName}',
        }),
      });

      const created = await createResponse.json();

      // Then get it by ID
      const response = await app.request(`/${entityName}s/${created.id}`, {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.id).toBe(created.id);
    });

    test('should return 404 for non-existent ${entityName}', async () => {
      const response = await app.request('/${entityName}s/non-existent', {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toHaveProperty('error');
    });

    test('should return 403 for accessing another user\'s ${entityName}', async () => {
      // Create a ${entityName} for user-1
      const createResponse = await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Test ${EntityName}',
        }),
      });

      const created = await createResponse.json();

      // Try to access it as user-2
      const response = await app.request(`/${entityName}s/${created.id}`, {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-2',
        },
      });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /${entityName}s', () => {
    test('should list ${entityName}s', async () => {
      // Create some ${entityName}s first
      await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'First',
        }),
      });

      await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Second',
        }),
      });

      // List all
      const response = await app.request('/${entityName}s', {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.items).toHaveLength(2);
      expect(json.total).toBe(2);
    });

    test('should support pagination', async () => {
      // Create 15 ${entityName}s
      for (let i = 0; i < 15; i++) {
        await app.request('/${entityName}s', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token',
            'X-User-Id': 'user-1',
          },
          body: JSON.stringify({
            ${fieldName}: `Item ${i}`,
          }),
        });
      }

      // Get first page
      const response = await app.request('/${entityName}s?page=1&limit=10', {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.items).toHaveLength(10);
      expect(json.total).toBe(15);
      expect(json.page).toBe(1);
      expect(json.pageSize).toBe(10);
    });

    test('should support filtering', async () => {
      // Create ${entityName}s with different statuses
      await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Active',
          status: 'active',
        }),
      });

      await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Completed',
          status: 'completed',
        }),
      });

      // Filter by status
      const response = await app.request('/${entityName}s?status=active', {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.items).toHaveLength(1);
      expect(json.items[0].status).toBe('active');
    });
  });

  describe('PATCH /${entityName}s/:id', () => {
    test('should update a ${entityName}', async () => {
      // Create a ${entityName}
      const createResponse = await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Original',
        }),
      });

      const created = await createResponse.json();

      // Update it
      const response = await app.request(`/${entityName}s/${created.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Updated',
        }),
      });

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.${fieldName}).toBe('Updated');

      // Verify event was published
      expect(eventBus.wasPublished('${EntityName}.Updated')).toBe(true);
    });

    test('should return 404 for non-existent ${entityName}', async () => {
      const response = await app.request('/${entityName}s/non-existent', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'Updated',
        }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /${entityName}s/:id', () => {
    test('should delete a ${entityName}', async () => {
      // Create a ${entityName}
      const createResponse = await app.request('/${entityName}s', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
        body: JSON.stringify({
          ${fieldName}: 'To Delete',
        }),
      });

      const created = await createResponse.json();

      // Delete it
      const response = await app.request(`/${entityName}s/${created.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(response.status).toBe(200);

      // Verify it's actually deleted
      const getResponse = await app.request(`/${entityName}s/${created.id}`, {
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(getResponse.status).toBe(404);

      // Verify event was published
      expect(eventBus.wasPublished('${EntityName}.Deleted')).toBe(true);
    });

    test('should return 404 for non-existent ${entityName}', async () => {
      const response = await app.request('/${entityName}s/non-existent', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer valid-token',
          'X-User-Id': 'user-1',
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
