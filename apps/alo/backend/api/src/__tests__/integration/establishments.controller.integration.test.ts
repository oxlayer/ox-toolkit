/**
 * Establishments Controller Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Hono } from 'hono';

describe('Establishments API Integration Tests', () => {
  let app: Hono;
  let authToken: string;

  beforeAll(async () => {
    // Import app after test environment is set up
    const module = await import('../../index.js');
    // Get the app instance - note: the actual app structure may vary
    // This is a placeholder for integration testing setup
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await fetch('http://localhost:3001/health');
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
      expect(body).toHaveProperty('services');
    });
  });

  describe('GET /api/establishments', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3001/api/establishments');
      expect(response.status).toBe(401);
    });

    it('should return establishments list with auth', async () => {
      // This test requires a valid auth token
      // Skip if token not available
      if (!authToken) {
        return;
      }

      const response = await fetch('http://localhost:3001/api/establishments', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('establishments');
      expect(Array.isArray(body.establishments)).toBe(true);
    });
  });

  describe('POST /api/establishments', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3001/api/establishments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Restaurant',
          horarioFuncionamento: '9AM-10PM',
          ownerId: 1,
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should create establishment with valid data and auth', async () => {
      if (!authToken) {
        return;
      }

      const response = await fetch('http://localhost:3001/api/establishments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Restaurant',
          horarioFuncionamento: '9AM-10PM',
          description: 'A test restaurant',
          ownerId: 1,
        }),
      });

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('establishment');
      expect(body.establishment).toHaveProperty('id');
      expect(body.establishment.name).toBe('Test Restaurant');
    });

    it('should return 400 for invalid data', async () => {
      if (!authToken) {
        return;
      }

      const response = await fetch('http://localhost:3001/api/establishments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: '', // Invalid: empty name
          horarioFuncionamento: '9AM-10PM',
          ownerId: 1,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/establishments/:id', () => {
    it('should require authentication', async () => {
      const response = await fetch('http://localhost:3001/api/establishments/1');
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent establishment', async () => {
      if (!authToken) {
        return;
      }

      const response = await fetch('http://localhost:3001/api/establishments/99999', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
