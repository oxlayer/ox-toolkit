/**
 * Items Controller Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

describe('Items API Integration Tests', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = process.env.API_URL || 'http://localhost:{{PORT}}';
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /api/items', () => {
    it('should return items list', async () => {
      const response = await fetch(`${baseUrl}/api/items`);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('items');
      expect(Array.isArray(body.items)).toBe(true);
    });
  });

  describe('POST /api/items', () => {
    it('should create item with valid data', async () => {
      const response = await fetch(`${baseUrl}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Item',
          description: 'A test item',
        }),
      });

      expect(response.status).toBe(201);

      const body = await response.json();
      expect(body).toHaveProperty('item');
      expect(body.item).toHaveProperty('id');
      expect(body.item.name).toBe('Test Item');
    });

    it('should return 400 for invalid data', async () => {
      const response = await fetch(`${baseUrl}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/items/:id', () => {
    it('should return 404 for non-existent item', async () => {
      const response = await fetch(`${baseUrl}/api/items/99999`);
      expect(response.status).toBe(404);
    });
  });
});
