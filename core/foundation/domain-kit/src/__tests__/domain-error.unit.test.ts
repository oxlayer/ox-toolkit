/**
 * Unit Tests for Domain Errors
 *
 * Tests domain-specific error types and error handling.
 */

import { describe, it, expect } from 'bun:test';
import {
  DomainError,
  EntityNotFoundError,
  BusinessRuleViolationError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from '../errors/domain-error';

describe('Domain Errors', () => {
  describe('DomainError (Base)', () => {
    it('should create error with code and message', () => {
      const error = new DomainError('TEST_CODE', 'Test error message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test error message');
    });

    it('should have error name set to class name', () => {
      class CustomError extends DomainError {
        constructor() {
          super('CUSTOM', 'Custom error');
        }
      }

      const error = new CustomError();
      expect(error.name).toBe('CustomError');
    });

    it('should have timestamp', () => {
      const before = Date.now();
      const error = new DomainError('TEST', 'Test');
      const after = Date.now();

      expect(error.timestamp).toBeDefined();
      expect(new Date(error.timestamp).getTime()).toBeGreaterThanOrEqual(before);
      expect(new Date(error.timestamp).getTime()).toBeLessThanOrEqual(after);
    });

    it('should have stack trace', () => {
      const error = new DomainError('TEST', 'Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DomainError');
    });

    it('should be instance of Error', () => {
      const error = new DomainError('TEST', 'Test');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof DomainError).toBe(true);
    });
  });

  describe('EntityNotFoundError', () => {
    it('should create error with entity type and ID', () => {
      const error = new EntityNotFoundError('User', 'user-123');
      expect(error.code).toBe('ENTITY_NOT_FOUND');
      expect(error.message).toBe("User with id 'user-123' was not found");
    });

    it('should handle numeric IDs', () => {
      const error = new EntityNotFoundError('Product', 12345);
      expect(error.message).toBe("Product with id '12345' was not found");
    });

    it('should handle special characters in ID', () => {
      const error = new EntityNotFoundError('Document', 'doc/with/slashes');
      expect(error.message).toBe("Document with id 'doc/with/slashes' was not found");
    });

    it('should handle empty ID', () => {
      const error = new EntityNotFoundError('Entity', '');
      expect(error.message).toBe("Entity with id '' was not found");
    });

    it('should be instanceof DomainError', () => {
      const error = new EntityNotFoundError('Test', '1');
      expect(error instanceof DomainError).toBe(true);
      expect(error instanceof EntityNotFoundError).toBe(true);
    });
  });

  describe('BusinessRuleViolationError', () => {
    it('should create error with rule only', () => {
      const error = new BusinessRuleViolationError('Account cannot be negative');
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.message).toBe('Account cannot be negative');
    });

    it('should create error with rule and details', () => {
      const error = new BusinessRuleViolationError(
        'Insufficient funds',
        'Account has $100, attempted to withdraw $150'
      );
      expect(error.message).toBe('Insufficient funds: Account has $100, attempted to withdraw $150');
    });

    it('should handle empty details', () => {
      const error = new BusinessRuleViolationError('Rule violated', '');
      expect(error.message).toBe('Rule violated: ');
    });

    it('should handle complex details', () => {
      const details = 'Multiple violations: age < 18, no parent consent, region not supported';
      const error = new BusinessRuleViolationError('Registration failed', details);
      expect(error.message).toBe(`Registration failed: ${details}`);
    });
  });

  describe('ValidationError', () => {
    it('should create error with field and message', () => {
      const error = new ValidationError('email', 'Invalid email format');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.field).toBe('email');
      expect(error.message).toBe("Validation failed for 'email': Invalid email format");
    });

    it('should handle nested field names', () => {
      const error = new ValidationError('user.profile.age', 'Must be 18 or older');
      expect(error.field).toBe('user.profile.age');
      expect(error.message).toContain('user.profile.age');
    });

    it('should handle special characters in field name', () => {
      const error = new ValidationError('field-with-dashes', 'Error message');
      expect(error.field).toBe('field-with-dashes');
    });

    it('should handle empty field name', () => {
      const error = new ValidationError('', 'Generic validation error');
      expect(error.field).toBe('');
      expect(error.message).toBe("Validation failed for '': Generic validation error");
    });

    it('should handle empty message', () => {
      const error = new ValidationError('field', '');
      expect(error.message).toBe("Validation failed for 'field': ");
    });
  });

  describe('ConflictError', () => {
    it('should create error with message', () => {
      const error = new ConflictError('Duplicate email address');
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('Duplicate email address');
    });

    it('should handle empty message', () => {
      const error = new ConflictError('');
      expect(error.message).toBe('');
    });

    it('should handle detailed conflict message', () => {
      const error = new ConflictError(
        'Resource already exists: User with email test@example.com already registered'
      );
      expect(error.message).toContain('already exists');
    });

    it('should be instanceof DomainError', () => {
      const error = new ConflictError('Conflict');
      expect(error instanceof DomainError).toBe(true);
      expect(error instanceof ConflictError).toBe(true);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create error with default message', () => {
      const error = new UnauthorizedError();
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Operation not authorized');
    });

    it('should create error with custom message', () => {
      const error = new UnauthorizedError('Admin access required');
      expect(error.message).toBe('Admin access required');
    });

    it('should handle empty message', () => {
      const error = new UnauthorizedError('');
      expect(error.message).toBe('');
    });

    it('should handle detailed authorization message', () => {
      const error = new UnauthorizedError(
        'User does not have required role: admin. Current roles: user, guest'
      );
      expect(error.message).toContain('required role');
    });
  });

  describe('Error Usage Patterns', () => {
    it('should throw and catch EntityNotFoundError', () => {
      expect(() => {
        throw new EntityNotFoundError('User', '123');
      }).toThrow(EntityNotFoundError);
    });

    it('should throw and catch with instanceof', () => {
      try {
        throw new ValidationError('email', 'Invalid');
      } catch (error) {
        expect(error instanceof ValidationError).toBe(true);
        if (error instanceof ValidationError) {
          expect(error.field).toBe('email');
        }
      }
    });

    it('should preserve error through async/await', async () => {
      const asyncOperation = async (): Promise<void> => {
        throw new BusinessRuleViolationError('Async rule violation');
      };

      await expect(asyncOperation()).rejects.toThrow(BusinessRuleViolationError);
    });

    it('should work with Promise rejection', async () => {
      const promise = Promise.reject(new ConflictError('Conflict!'));

      await expect(promise).rejects.toThrow('Conflict!');
    });
  });

  describe('Custom Domain Errors', () => {
    it('should support custom error extending DomainError', () => {
      class InsufficientFundsError extends DomainError {
        constructor(accountId: string, requested: number, available: number) {
          super(
            'INSUFFICIENT_FUNDS',
            `Account ${accountId} has insufficient funds. Requested: ${requested}, Available: ${available}`
          );
        }
      }

      const error = new InsufficientFundsError('acc-123', 1000, 500);
      expect(error.code).toBe('INSUFFICIENT_FUNDS');
      expect(error.message).toContain('acc-123');
      expect(error.message).toContain('1000');
      expect(error.message).toContain('500');
    });

    it('should support custom error with additional properties', () => {
      class PaymentError extends DomainError {
        constructor(
          message: string,
            public readonly paymentId: string,
            public readonly amount: number,
            public readonly currency: string
        ) {
          super('PAYMENT_ERROR', message);
        }
      }

      const error = new PaymentError('Payment failed', 'pay-123', 99.99, 'USD');
      expect(error.paymentId).toBe('pay-123');
      expect(error.amount).toBe(99.99);
      expect(error.currency).toBe('USD');
    });

    it('should support multiple levels of inheritance', () => {
      class BasePaymentError extends DomainError {
        constructor(message: string) {
          super('PAYMENT_ERROR', message);
        }
      }

      class InsufficientFundsError extends BasePaymentError {
        constructor(amount: number) {
          super(`Insufficient funds: ${amount}`);
        }
      }

      const error = new InsufficientFundsError(100);
      expect(error instanceof DomainError).toBe(true);
      expect(error instanceof BasePaymentError).toBe(true);
      expect(error instanceof InsufficientFundsError).toBe(true);
      expect(error.code).toBe('PAYMENT_ERROR');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(10000);
      const error = new DomainError('LONG', longMessage);
      expect(error.message.length).toBe(10000);
    });

    it('should handle Unicode in error messages', () => {
      const error = new DomainError('UNICODE', 'Error with emoji 🎉 and Chinese 中文 and Arabic العربية');
      expect(error.message).toContain('🎉');
      expect(error.message).toContain('中文');
      expect(error.message).toContain('العربية');
    });

    it('should handle newlines in error messages', () => {
      const error = new ValidationError('field', 'Line 1\nLine 2\nLine 3');
      expect(error.message).toContain('\n');
    });

    it('should handle special JSON characters', () => {
      const error = new ConflictError('Conflict with "quotes" and {braces} and [brackets]');
      expect(error.message).toContain('"quotes"');
    });

    it('should handle extremely long entity IDs', () => {
      const longId = 'a'.repeat(1000);
      const error = new EntityNotFoundError('Entity', longId);
      expect(error.message).toContain(longId);
    });

    it('should handle null-like strings in IDs', () => {
      const error1 = new EntityNotFoundError('Entity', 'null');
      const error2 = new EntityNotFoundError('Entity', 'undefined');
      expect(error1.message).toContain('null');
      expect(error2.message).toContain('undefined');
    });
  });

  describe('Error Serialization', () => {
    it('should serialize to JSON', () => {
      const error = new ValidationError('email', 'Invalid format');
      const json = JSON.stringify(error);
      const parsed = JSON.parse(json);

      expect(parsed.code).toBe('VALIDATION_ERROR');
      expect(parsed.message).toContain('email');
      expect(parsed.field).toBe('email');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should handle circular references if present', () => {
      class CircularError extends DomainError {
        public self?: CircularError;

        constructor() {
          super('CIRCULAR', 'Circular reference');
        }
      }

      const error = new CircularError();
      error.self = error;

      const json = JSON.stringify(error);
      expect(json).toBeDefined();
    });
  });
});
