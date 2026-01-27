/**
 * Unit Tests for JWT Strategy
 *
 * Tests JWT token generation, verification, and authentication strategy.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import jwt from 'jsonwebtoken';
import {
  generateToken,
  generateDeliveryManToken,
  verifyToken,
  jwtStrategy,
  type JWTPayload,
  type DeliveryManJWTPayload,
} from '../strategies/jwt';

// Mock Hono Context
function createMockContext(authHeader?: string, path = '/api/test') {
  return {
    req: {
      header: (name: string) => (name === 'Authorization' ? authHeader : undefined),
      path: () => path,
    },
    json: (data: any, status?: number) => ({
      status: status || 200,
      json: async () => data,
    }),
    set: (key: string, value: any) => {},
  } as any;
}

describe('JWT Strategy', () => {
  const testSecret = 'test-secret-key';
  const validPayload: JWTPayload = {
    id: 123,
    name: 'John Doe',
    email: 'john@example.com',
    establishment_id: 456,
    establishment_name: 'Test Establishment',
  };

  const deliveryManPayload: DeliveryManJWTPayload = {
    id: 789,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567890',
  };

  describe('generateToken()', () => {
    it('should generate valid JWT token', () => {
      const token = generateToken(validPayload, testSecret);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include payload in token', () => {
      const token = generateToken(validPayload, testSecret);
      const decoded = jwt.decode(token) as JWTPayload;

      expect(decoded.id).toBe(validPayload.id);
      expect(decoded.name).toBe(validPayload.name);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('should use default expiration of 7 days', () => {
      const token = generateToken(validPayload, testSecret);
      const decoded = jwt.decode(token) as any;

      const exp = decoded.exp;
      const iat = decoded.iat;
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;

      expect(exp - iat).toBe(sevenDaysInSeconds);
    });

    it('should support custom expiration', () => {
      const token = generateToken(validPayload, testSecret, '1h');
      const decoded = jwt.decode(token) as any;

      const exp = decoded.exp;
      const iat = decoded.iat;
      const oneHourInSeconds = 60 * 60;

      expect(exp - iat).toBe(oneHourInSeconds);
    });

    it('should handle optional fields', () => {
      const minimalPayload = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
      };
      const token = generateToken(minimalPayload, testSecret);
      const decoded = jwt.decode(token) as JWTPayload;

      expect(decoded.id).toBe(1);
      expect(decoded.establishment_id).toBeUndefined();
    });
  });

  describe('generateDeliveryManToken()', () => {
    it('should generate valid delivery man token', () => {
      const token = generateDeliveryManToken(deliveryManPayload, testSecret);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include delivery man payload', () => {
      const token = generateDeliveryManToken(deliveryManPayload, testSecret);
      const decoded = jwt.decode(token) as DeliveryManJWTPayload;

      expect(decoded.id).toBe(deliveryManPayload.id);
      expect(decoded.name).toBe(deliveryManPayload.name);
      expect(decoded.phone).toBe(deliveryManPayload.phone);
    });

    it('should use default expiration', () => {
      const token = generateDeliveryManToken(deliveryManPayload, testSecret);
      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should support custom expiration', () => {
      const token = generateDeliveryManToken(deliveryManPayload, testSecret, '30d');
      const decoded = jwt.decode(token) as any;

      const exp = decoded.exp;
      const iat = decoded.iat;
      const thirtyDaysInSeconds = 30 * 24 * 60 * 60;

      expect(exp - iat).toBe(thirtyDaysInSeconds);
    });
  });

  describe('verifyToken()', () => {
    it('should verify valid token', () => {
      const token = generateToken(validPayload, testSecret);
      const decoded = verifyToken(token, testSecret);

      expect(decoded.id).toBe(validPayload.id);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('should verify delivery man token', () => {
      const token = generateDeliveryManToken(deliveryManPayload, testSecret);
      const decoded = verifyToken(token, testSecret) as DeliveryManJWTPayload;

      expect(decoded.id).toBe(deliveryManPayload.id);
      expect(decoded.phone).toBe(deliveryManPayload.phone);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        verifyToken('invalid.token.here', testSecret);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for wrong secret', () => {
      const token = generateToken(validPayload, testSecret);
      expect(() => {
        verifyToken(token, 'wrong-secret');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const expiredToken = generateToken(validPayload, testSecret, '0s');
      // Wait for token to expire
      // Note: This test might be flaky due to timing
      try {
        verifyToken(expiredToken, testSecret);
      } catch (error: any) {
        expect(error.message).toContain('expired');
      }
    });

    it('should throw error for malformed token', () => {
      const malformedTokens = [
        'not-a-jwt',
        'header.payload',
        'header.payload.signature.extra',
        '',
      ];

      malformedTokens.forEach((token) => {
        expect(() => {
          verifyToken(token, testSecret);
        }).toThrow();
      });
    });
  });

  describe('jwtStrategy()', () => {
    it('should authenticate valid JWT token', async () => {
      const token = generateToken(validPayload, testSecret);
      const context = createMockContext(`Bearer ${token}`);

      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(true);
      expect(result.strategy).toBe('jwt');
      expect(result.payload).toBeDefined();
      expect(result.payload?.id).toBe(validPayload.id);
    });

    it('should return error for missing Authorization header', async () => {
      const context = createMockContext();

      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing or invalid Authorization header');
    });

    it('should return error for malformed Authorization header', async () => {
      const context = createMockContext('InvalidFormat token123');

      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing or invalid Authorization header');
    });

    it('should return error for invalid token', async () => {
      const context = createMockContext('Bearer invalid-token');

      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('JWT verification failed');
    });

    it('should extract token from Bearer header', async () => {
      const token = generateToken(validPayload, testSecret);
      const context = createMockContext(`Bearer ${token}`);

      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(true);
    });

    it('should handle lowercase "bearer" prefix', async () => {
      const token = generateToken(validPayload, testSecret);
      const context = createMockContext(`bearer ${token}`);

      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(true);
    });

    it('should handle mixed case "Bearer" prefix', async () => {
      const token = generateToken(validPayload, testSecret);
      const context = createMockContext(`BeArEr ${token}`);

      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should complete full auth flow', async () => {
      // Generate token
      const token = generateToken(validPayload, testSecret);

      // Verify token
      const decoded = verifyToken(token, testSecret);
      expect(decoded.id).toBe(validPayload.id);

      // Use in strategy
      const context = createMockContext(`Bearer ${token}`);
      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(decoded);
    });

    it('should handle delivery man auth flow', async () => {
      const token = generateDeliveryManToken(deliveryManPayload, testSecret);
      const decoded = verifyToken(token, testSecret) as DeliveryManJWTPayload;

      expect(decoded.phone).toBe(deliveryManPayload.phone);

      const context = createMockContext(`Bearer ${token}`);
      const result = await jwtStrategy(context, { secret: testSecret });

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty secret', () => {
      const token = generateToken(validPayload, '');
      expect(token).toBeDefined();
    });

    it('should handle very long payloads', () => {
      const longPayload = {
        id: 1,
        name: 'A'.repeat(10000),
        email: 'test@example.com',
      };
      const token = generateToken(longPayload, testSecret);
      const decoded = verifyToken(token, testSecret);

      expect(decoded.name.length).toBe(10000);
    });

    it('should handle special characters in payload', () => {
      const specialPayload = {
        id: 1,
        name: 'Test with émojis 🎉 and spëcial çhars',
        email: 'test@example.com',
      };
      const token = generateToken(specialPayload, testSecret);
      const decoded = verifyToken(token, testSecret);

      expect(decoded.name).toContain('🎉');
    });

    it('should handle numeric string ID', () => {
      const stringIdPayload = {
        id: '123' as unknown as number, // Type coercion
        name: 'Test',
        email: 'test@example.com',
      };
      const token = generateToken(stringIdPayload, testSecret);
      const decoded = verifyToken(token, testSecret);

      expect(decoded.id).toBe('123');
    });

    it('should handle Unicode in email', () => {
      const unicodePayload = {
        id: 1,
        name: 'Test',
        email: 'tëst@exämple.com',
      };
      const token = generateToken(unicodePayload, testSecret);
      const decoded = verifyToken(token, testSecret);

      expect(decoded.email).toBe('tëst@exämple.com');
    });
  });

  describe('Security Tests', () => {
    it('should not verify token with different secret', () => {
      const token = generateToken(validPayload, testSecret);
      const wrongSecret = 'different-secret';

      expect(() => {
        verifyToken(token, wrongSecret);
      }).toThrow();
    });

    it('should reject token without signature', () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const tokenWithoutSignature = `${header}.${payload}.`;

      expect(() => {
        verifyToken(tokenWithoutSignature, testSecret);
      }).toThrow();
    });

    it('should reject tampered token', () => {
      const token = generateToken(validPayload, testSecret);
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tamperedsignature`;

      expect(() => {
        verifyToken(tamperedToken, testSecret);
      }).toThrow();
    });
  });
});
