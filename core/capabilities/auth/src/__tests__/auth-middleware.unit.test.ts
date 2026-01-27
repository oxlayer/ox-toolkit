/**
 * Unit Tests for Auth Middleware
 *
 * Tests authentication middleware with various strategies and configurations.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { authMiddleware, requireAuth, requireStrategy, getAuthPayload, isAuthenticated, getAuthStrategy } from '../middleware/auth';
import type { Context, Next } from 'hono';

// Mock dependencies
const mockKeycloakStrategy = jest.fn();
const mockJwtStrategy = jest.fn();

// Mock the strategy imports
jest.mock('../strategies/index.js', () => ({
  keycloakStrategy: mockKeycloakStrategy,
  jwtStrategy: mockJwtStrategy,
}));

// Helper to create mock context
function createMockContext(
  path = '/api/test',
  headers: Record<string, string> = {}
): Context {
  const contextData: Record<string, any> = {
    req: {
      path,
      header: (name: string) => headers[name.toLowerCase()],
    },
    get: (key: string) => contextData[key],
    set: (key: string, value: any) => {
      contextData[key] = value;
    },
    json: (data: any, status?: number) => ({
      status: status || 200,
      json: async () => data,
    }),
  };

  return contextData as Context;
}

// Helper to create mock next function
function createMockNext(): Next {
  return async () => Promise.resolve();
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware()', () => {
    it('should skip authentication for public paths', async () => {
      const middleware = authMiddleware({ enableJwt: true, jwtSecret: 'secret' });
      const context = createMockContext('/health');
      const next = createMockNext();

      await middleware(context, next);

      expect(context.get('authStrategy')).toBe('none');
      expect(context.get('isAuthenticated')).toBe(false);
    });

    it('should skip authentication for docs path', async () => {
      const middleware = authMiddleware({ enableJwt: true, jwtSecret: 'secret' });
      const context = createMockContext('/docs');
      const next = createMockNext();

      await middleware(context, next);

      expect(context.get('authStrategy')).toBe('none');
    });

    it('should skip authentication for OpenAPI JSON', async () => {
      const middleware = authMiddleware({ enableJwt: true, jwtSecret: 'secret' });
      const context = createMockContext('/openapi.json');
      const next = createMockNext();

      await middleware(context, next);

      expect(context.get('authStrategy')).toBe('none');
    });

    it('should skip authentication for reference path', async () => {
      const middleware = authMiddleware({ enableJwt: true, jwtSecret: 'secret' });
      const context = createMockContext('/reference');
      const next = createMockNext();

      await middleware(context, next);

      expect(context.get('authStrategy')).toBe('none');
    });

    it('should use custom public paths when provided', async () => {
      const customPublicPaths = ['/custom-public', '/another-public'];
      const middleware = authMiddleware({
        enableJwt: true,
        jwtSecret: 'secret',
        publicPaths: customPublicPaths,
      });
      const context = createMockContext('/custom-public');
      const next = createMockNext();

      await middleware(context, next);

      expect(context.get('authStrategy')).toBe('none');
    });

    it('should throw error when JWT enabled but no secret provided', () => {
      expect(() => {
        authMiddleware({ enableJwt: true });
      }).toThrow('JWT secret is required');
    });

    it('should not throw error when JWT disabled', () => {
      expect(() => {
        authMiddleware({ enableJwt: false });
      }).not.toThrow();
    });

    it('should try Keycloak first when enabled', async () => {
      mockKeycloakStrategy.mockResolvedValue({
        valid: true,
        strategy: 'keycloak',
        payload: { sub: 'user-123' },
      });

      const middleware = authMiddleware({
        enableKeycloak: true,
        keycloak: { url: 'http://localhost:8080', realm: 'test' },
        enableJwt: true,
        jwtSecret: 'secret',
      });
      const context = createMockContext('/api/protected');
      const next = createMockNext();

      await middleware(context, next);

      expect(mockKeycloakStrategy).toHaveBeenCalledWith(context, expect.any(Object));
      expect(context.get('authStrategy')).toBe('keycloak');
    });

    it('should fall back to JWT when Keycloak fails', async () => {
      mockKeycloakStrategy.mockResolvedValue({
        valid: false,
        error: 'Keycloak auth failed',
      });
      mockJwtStrategy.mockResolvedValue({
        valid: true,
        strategy: 'jwt',
        payload: { id: 123, email: 'test@example.com' },
      });

      const middleware = authMiddleware({
        enableKeycloak: true,
        keycloak: { url: 'http://localhost:8080', realm: 'test' },
        enableJwt: true,
        jwtSecret: 'secret',
      });
      const context = createMockContext('/api/protected');
      const next = createMockNext();

      await middleware(context, next);

      expect(mockKeycloakStrategy).toHaveBeenCalled();
      expect(mockJwtStrategy).toHaveBeenCalled();
      expect(context.get('authStrategy')).toBe('jwt');
    });

    it('should use JWT only when Keycloak disabled', async () => {
      mockJwtStrategy.mockResolvedValue({
        valid: true,
        strategy: 'jwt',
        payload: { id: 123 },
      });

      const middleware = authMiddleware({
        enableKeycloak: false,
        enableJwt: true,
        jwtSecret: 'secret',
      });
      const context = createMockContext('/api/protected');
      const next = createMockNext();

      await middleware(context, next);

      expect(mockKeycloakStrategy).not.toHaveBeenCalled();
      expect(mockJwtStrategy).toHaveBeenCalled();
      expect(context.get('authStrategy')).toBe('jwt');
    });

    it('should return 401 when both strategies fail', async () => {
      mockKeycloakStrategy.mockResolvedValue({
        valid: false,
        error: 'Keycloak failed',
      });
      mockJwtStrategy.mockResolvedValue({
        valid: false,
        error: 'JWT failed',
      });

      const middleware = authMiddleware({
        enableKeycloak: true,
        keycloak: { url: 'http://localhost:8080', realm: 'test' },
        enableJwt: true,
        jwtSecret: 'secret',
      });
      const context = createMockContext('/api/protected');
      const next = createMockNext();

      const result = await middleware(context, next);

      expect(result).toBeDefined();
      expect(result.status).toBe(401);
    });

    it('should set auth payload in context on successful auth', async () => {
      const payload = { id: 123, email: 'test@example.com' };
      mockJwtStrategy.mockResolvedValue({
        valid: true,
        strategy: 'jwt',
        payload,
      });

      const middleware = authMiddleware({
        enableJwt: true,
        jwtSecret: 'secret',
      });
      const context = createMockContext('/api/protected');
      const next = createMockNext();

      await middleware(context, next);

      expect(context.get('authPayload')).toEqual(payload);
      expect(context.get('isAuthenticated')).toBe(true);
    });
  });

  describe('requireAuth()', () => {
    it('should pass when authenticated', async () => {
      const middleware = requireAuth();
      const context = createMockContext('/api/protected');
      context.set('isAuthenticated', true);
      const next = createMockNext();

      await middleware(context, next);

      // Should not throw, next should be called
    });

    it('should return 401 when not authenticated', async () => {
      const middleware = requireAuth();
      const context = createMockContext('/api/protected');
      context.set('isAuthenticated', false);
      const next = createMockNext();

      const result = await middleware(context, next);

      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 when isAuthenticated not set', async () => {
      const middleware = requireAuth();
      const context = createMockContext('/api/protected');
      const next = createMockNext();

      const result = await middleware(context, next);

      expect(result.status).toBe(401);
    });
  });

  describe('requireStrategy()', () => {
    it('should pass when strategy matches', async () => {
      const middleware = requireStrategy('jwt');
      const context = createMockContext('/api/protected');
      context.set('authStrategy', 'jwt');
      const next = createMockNext();

      await middleware(context, next);

      // Should not throw
    });

    it('should return 401 when strategy does not match', async () => {
      const middleware = requireStrategy('keycloak');
      const context = createMockContext('/api/protected');
      context.set('authStrategy', 'jwt');
      const next = createMockNext();

      const result = await middleware(context, next);

      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('keycloak authentication required');
    });

    it('should support keycloak strategy requirement', async () => {
      const middleware = requireStrategy('keycloak');
      const context = createMockContext('/api/protected');
      context.set('authStrategy', 'keycloak');
      const next = createMockNext();

      await middleware(context, next);

      // Should pass
    });

    it('should support jwt strategy requirement', async () => {
      const middleware = requireStrategy('jwt');
      const context = createMockContext('/api/protected');
      context.set('authStrategy', 'jwt');
      const next = createMockNext();

      await middleware(context, next);

      // Should pass
    });
  });

  describe('Helper Functions', () => {
    it('getAuthPayload() should return payload from context', () => {
      const payload = { id: 123, email: 'test@example.com' };
      const context = createMockContext('/api/test');
      context.set('authPayload', payload);

      const result = getAuthPayload(context);

      expect(result).toEqual(payload);
    });

    it('getAuthPayload() should return undefined when not set', () => {
      const context = createMockContext('/api/test');

      const result = getAuthPayload(context);

      expect(result).toBeUndefined();
    });

    it('isAuthenticated() should return true when authenticated', () => {
      const context = createMockContext('/api/test');
      context.set('isAuthenticated', true);

      expect(isAuthenticated(context)).toBe(true);
    });

    it('isAuthenticated() should return false when not authenticated', () => {
      const context = createMockContext('/api/test');
      context.set('isAuthenticated', false);

      expect(isAuthenticated(context)).toBe(false);
    });

    it('isAuthenticated() should return false when not set', () => {
      const context = createMockContext('/api/test');

      expect(isAuthenticated(context)).toBe(false);
    });

    it('getAuthStrategy() should return strategy from context', () => {
      const context = createMockContext('/api/test');
      context.set('authStrategy', 'jwt');

      expect(getAuthStrategy(context)).toBe('jwt');
    });

    it('getAuthStrategy() should return none when not set', () => {
      const context = createMockContext('/api/test');

      expect(getAuthStrategy(context)).toBe('none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle public path as prefix', async () => {
      const middleware = authMiddleware({
        enableJwt: true,
        jwtSecret: 'secret',
        publicPaths: ['/api/public'],
      });
      const context = createMockContext('/api/public/data');
      const next = createMockNext();

      await middleware(context, next);

      expect(context.get('authStrategy')).toBe('none');
    });

    it('should handle empty public paths array', async () => {
      mockJwtStrategy.mockResolvedValue({
        valid: true,
        strategy: 'jwt',
        payload: { id: 123 },
      });

      const middleware = authMiddleware({
        enableJwt: true,
        jwtSecret: 'secret',
        publicPaths: [],
      });
      const context = createMockContext('/any/path');
      const next = createMockNext();

      await middleware(context, next);

      expect(mockJwtStrategy).toHaveBeenCalled();
    });

    it('should handle JWT secret from environment', () => {
      process.env.JWT_SECRET = 'env-secret';

      expect(() => {
        authMiddleware({ enableJwt: true });
      }).not.toThrow();

      delete process.env.JWT_SECRET;
    });

    it('should handle missing environment secret', () => {
      delete process.env.JWT_SECRET;

      expect(() => {
        authMiddleware({ enableJwt: true });
      }).toThrow();
    });
  });
});
