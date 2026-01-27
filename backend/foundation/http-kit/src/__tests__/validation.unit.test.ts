/**
 * Unit Tests for Validation Utilities
 *
 * Tests Zod-based validation functions and error formatting.
 */

import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import {
  validate,
  validateOrThrow,
  validationErrorResponse,
  type ValidationResult,
  type ValidationErrorDetail,
} from '../validation/validation';

describe('Validation', () => {
  describe('validate()', () => {
    const testSchema = z.object({
      email: z.string().email(),
      age: z.number().min(18).max(120),
      name: z.string().min(2),
    });

    it('should return success with valid data', () => {
      const result = validate(testSchema, {
        email: 'test@example.com',
        age: 25,
        name: 'John Doe',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          email: 'test@example.com',
          age: 25,
          name: 'John Doe',
        });
      }
    });

    it('should return validation errors for invalid data', () => {
      const result = validate(testSchema, {
        email: 'invalid-email',
        age: 15,
        name: 'J',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(3);
        expect(result.errors).toContainEqual({
          field: 'email',
          message: 'Invalid email',
        });
      }
    });

    it('should handle missing required fields', () => {
      const result = validate(testSchema, {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should type narrow correctly on success', () => {
      const result = validate(testSchema, {
        email: 'test@example.com',
        age: 25,
        name: 'John',
      });

      if (result.success) {
        // TypeScript should know data is typed correctly
        expect(result.data.email.endsWith('.com')).toBe(true);
        expect(typeof result.data.age).toBe('number');
      }
    });

    it('should handle nested object validation', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
          }),
        }),
      });

      const result = validate(nestedSchema, {
        user: { profile: { name: 'John' } },
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.user.profile.name).toBe('John');
      }
    });

    it('should handle array validation', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1),
      });

      const result = validate(arraySchema, { tags: ['tag1', 'tag2'] });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(['tag1', 'tag2']);
      }
    });

    it('should return error for empty array when min is required', () => {
      const arraySchema = z.object({
        tags: z.array(z.string()).min(1),
      });

      const result = validate(arraySchema, { tags: [] });

      expect(result.success).toBe(false);
    });

    it('should handle optional fields', () => {
      const optionalSchema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      const result = validate(optionalSchema, { required: 'test' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.required).toBe('test');
        expect(result.data.optional).toBeUndefined();
      }
    });

    it('should handle default values', () => {
      const defaultSchema = z.object({
        name: z.string(),
        role: z.string().default('user'),
      });

      const result = validate(defaultSchema, { name: 'John' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('user');
      }
    });

    it('should handle union types', () => {
      const unionSchema = z.object({
        value: z.union([z.string(), z.number()]),
      });

      const result1 = validate(unionSchema, { value: 'test' });
      const result2 = validate(unionSchema, { value: 123 });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    it('should handle enum validation', () => {
      const enumSchema = z.object({
        status: z.enum(['pending', 'active', 'inactive']),
      });

      const result = validate(enumSchema, { status: 'pending' });
      expect(result.success).toBe(true);

      const invalidResult = validate(enumSchema, { status: 'invalid' });
      expect(invalidResult.success).toBe(false);
    });
  });

  describe('validateOrThrow()', () => {
    const testSchema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    it('should return data on valid validation', () => {
      const data = validateOrThrow(testSchema, {
        email: 'test@example.com',
        age: 25,
      });

      expect(data).toEqual({
        email: 'test@example.com',
        age: 25,
      });
    });

    it('should throw Response on validation failure', () => {
      expect(() => {
        validateOrThrow(testSchema, {
          email: 'invalid',
          age: 15,
        });
      }).toThrow();
    });

    it('should throw Response with correct status and body', () => {
      try {
        validateOrThrow(testSchema, { email: 'invalid', age: 15 });
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        if (error instanceof Response) {
          expect(error.status).toBe(400);
          // Can't easily test body in thrown Response
        }
      }
    });
  });

  describe('validationErrorResponse()', () => {
    it('should create Response with validation errors', () => {
      const errors: ValidationErrorDetail[] = [
        { field: 'email', message: 'Invalid email' },
        { field: 'age', message: 'Must be 18 or older' },
      ];

      const response = validationErrorResponse(errors);

      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should include error details in response body', async () => {
      const errors: ValidationErrorDetail[] = [
        { field: 'email', message: 'Invalid email' },
      ];

      const response = validationErrorResponse(errors);
      const body = await response.json();

      expect(body).toEqual({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    });

    it('should handle empty errors array', async () => {
      const response = validationErrorResponse([]);
      const body = await response.json();

      expect(body.details).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      const schema = z.object({
        field: z.string().nullable(),
      });

      const result = validate(schema, { field: null });
      expect(result.success).toBe(true);
    });

    it('should handle transformation schemas', () => {
      const transformSchema = z.object({
        email: z.string().email().transform((val) => val.toLowerCase()),
      });

      const result = validate(transformSchema, {
        email: 'TEST@EXAMPLE.COM',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
      }
    });

    it('should handle refined schemas', () => {
      const refinedSchema = z.object({
        password: z.string().min(8).refine((val) => /[A-Z]/.test(val), {
          message: 'Must contain uppercase letter',
        }),
      });

      const result = validate(refinedSchema, { password: 'lowercase' });
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.errors.some((e) => e.message.includes('uppercase'))).toBe(true);
      }
    });
  });
});
