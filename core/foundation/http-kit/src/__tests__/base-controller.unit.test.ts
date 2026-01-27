/**
 * Unit Tests for BaseController
 *
 * Tests HTTP response helpers and controller utilities.
 */

import { describe, it, expect } from 'bun:test';
import { BaseController } from '../controllers/base-controller';

describe('BaseController', () => {
  class TestController extends BaseController {}

  let controller: TestController;

  beforeEach(() => {
    controller = new TestController();
  });

  describe('Success Responses', () => {
    it('should create OK response (200)', async () => {
      const response = controller.ok({ message: 'Success' });
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toEqual({ success: true, message: 'Success' });
    });

    it('should create Created response (201)', async () => {
      const data = { id: '123', name: 'Test' };
      const response = controller.created(data);
      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toEqual({ success: true, id: '123', name: 'Test' });
    });

    it('should create No Content response (204)', () => {
      const response = controller.noContent();
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });
  });

  describe('Error Responses', () => {
    it('should create Bad Request response (400)', async () => {
      const response = controller.badRequest('Invalid input');
      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Invalid input' });
    });

    it('should create Bad Request with default message', async () => {
      const response = controller.badRequest();
      const body = await response.json();
      expect(body.error).toBe('Bad request');
    });

    it('should create Unauthorized response (401)', async () => {
      const response = controller.unauthorized('Access denied');
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Access denied' });
    });

    it('should create Forbidden response (403)', async () => {
      const response = controller.forbidden('Not allowed');
      expect(response.status).toBe(403);

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Not allowed' });
    });

    it('should create Not Found response (404)', async () => {
      const response = controller.notFound('Resource not found');
      expect(response.status).toBe(404);

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Resource not found' });
    });

    it('should create Conflict response (409)', async () => {
      const response = controller.conflict('Duplicate entry');
      expect(response.status).toBe(409);

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Duplicate entry' });
    });
  });

  describe('Validation Error Response', () => {
    it('should create validation error with field errors', async () => {
      const errors = {
        email: ['Invalid email format', 'Email already taken'],
        password: ['Password too short'],
      };
      const response = controller.validationError(errors);
      expect(response.status).toBe(422);

      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: 'Validation failed',
        errors,
      });
    });
  });

  describe('Generic Error Response', () => {
    it('should handle Error instance', async () => {
      const error = new Error('Database connection failed');
      const response = controller.error(error);
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Database connection failed' });
    });

    it('should handle string error', async () => {
      const response = controller.error('Something went wrong');
      expect(response.status).toBe(500);

      const body = await response.json();
      expect(body).toEqual({ success: false, error: 'Something went wrong' });
    });

    it('should handle custom status code', async () => {
      const error = new Error('Service unavailable');
      const response = controller.error(error, 503);
      expect(response.status).toBe(503);
    });

    it('should handle non-Error object', async () => {
      const response = controller.error({ code: 'CUSTOM_ERROR' });
      const body = await response.json();
      expect(body.error).toBe('[object Object]');
    });
  });

  describe('JSON Response', () => {
    it('should create JSON response with custom status', async () => {
      const data = { custom: 'data' };
      const response = controller.json(data, 202);
      expect(response.status).toBe(202);

      const body = await response.json();
      expect(body).toEqual(data);
    });

    it('should set Content-Type header', () => {
      const response = controller.ok({ test: 'data' });
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data in ok()', async () => {
      const response = controller.ok({});
      const body = await response.json();
      expect(body).toEqual({ success: true });
    });

    it('should handle nested objects in ok()', async () => {
      const data = {
        user: { id: '1', profile: { name: 'John' } },
        meta: { count: 5 },
      };
      const response = controller.ok(data);
      const body = await response.json();
      expect(body).toEqual({ success: true, ...data });
    });

    it('should handle arrays in ok()', async () => {
      const response = controller.ok({ items: [1, 2, 3] });
      const body = await response.json();
      expect(body.items).toEqual([1, 2, 3]);
    });
  });
});
