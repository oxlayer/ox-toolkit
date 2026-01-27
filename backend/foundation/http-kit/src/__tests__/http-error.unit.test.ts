/**
 * Unit Tests for HTTP Error Utilities
 *
 * Tests HTTP error mapping and response creation from domain errors.
 */

import { describe, it, expect } from 'bun:test';
import {
  HttpError,
  HttpStatus,
  mapDomainErrorToHttpStatus,
  domainErrorToResponse,
  errorToResponse,
} from '../errors/http-error';
import {
  DomainError,
  EntityNotFoundError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
  BusinessRuleViolationError,
} from '@oxlayer/foundation-domain-kit';

describe('HTTP Error Utilities', () => {
  describe('HttpError', () => {
    it('should create HTTP error with status code and message', () => {
      const error = new HttpError(404, 'Not Found');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.name).toBe('HttpError');
    });

    it('should be instance of Error', () => {
      const error = new HttpError(500, 'Server Error');
      expect(error instanceof Error).toBe(true);
    });

    it('should have stack trace', () => {
      const error = new HttpError(400, 'Bad Request');
      expect(error.stack).toBeDefined();
    });
  });

  describe('HttpStatus', () => {
    it('should have all standard HTTP status codes', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.NO_CONTENT).toBe(204);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.CONFLICT).toBe(409);
      expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
      expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(503);
    });
  });

  describe('mapDomainErrorToHttpStatus()', () => {
    it('should map EntityNotFoundError to 404', () => {
      const error = new EntityNotFoundError('User', '123');
      expect(mapDomainErrorToHttpStatus(error)).toBe(HttpStatus.NOT_FOUND);
    });

    it('should map ValidationError to 422', () => {
      const error = new ValidationError('email', 'Invalid format');
      expect(mapDomainErrorToHttpStatus(error)).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should map ConflictError to 409', () => {
      const error = new ConflictError('Duplicate entry');
      expect(mapDomainErrorToHttpStatus(error)).toBe(HttpStatus.CONFLICT);
    });

    it('should map UnauthorizedError to 401', () => {
      const error = new UnauthorizedError('Access denied');
      expect(mapDomainErrorToHttpStatus(error)).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('should map BusinessRuleViolationError to 400', () => {
      const error = new BusinessRuleViolationError('Invalid operation');
      expect(mapDomainErrorToHttpStatus(error)).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should map unknown DomainError to 500', () => {
      class UnknownError extends DomainError {
        constructor() {
          super('UNKNOWN', 'Unknown error');
        }
      }
      const error = new UnknownError();
      expect(mapDomainErrorToHttpStatus(error)).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('domainErrorToResponse()', () => {
    it('should create response with correct status code', async () => {
      const error = new EntityNotFoundError('User', '123');
      const response = domainErrorToResponse(error);

      expect(response.status).toBe(404);
    });

    it('should include error message in body', async () => {
      const error = new ValidationError('email', 'Invalid format');
      const response = domainErrorToResponse(error);
      const body = await response.json();

      expect(body.error).toBe('Validation failed for \'email\': Invalid format');
    });

    it('should include error code in body', async () => {
      const error = new ConflictError('Duplicate entry');
      const response = domainErrorToResponse(error);
      const body = await response.json();

      expect(body.code).toBe('CONFLICT');
    });

    it('should include success flag as false', async () => {
      const error = new UnauthorizedError('Not authorized');
      const response = domainErrorToResponse(error);
      const body = await response.json();

      expect(body.success).toBe(false);
    });

    it('should set Content-Type header', () => {
      const error = new BusinessRuleViolationError('Invalid state');
      const response = domainErrorToResponse(error);

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('errorToResponse()', () => {
    it('should handle DomainError', async () => {
      const error = new EntityNotFoundError('Product', '456');
      const response = errorToResponse(error);

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.code).toBe('ENTITY_NOT_FOUND');
    });

    it('should handle HttpError', async () => {
      const error = new HttpError(418, "I'm a teapot");
      const response = errorToResponse(error);

      expect(response.status).toBe(418);
      const body = await response.json();
      expect(body.error).toBe("I'm a teapot");
    });

    it('should handle generic Error', async () => {
      const error = new Error('Something went wrong');
      const response = errorToResponse(error);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Something went wrong');
    });

    it('should handle string error', async () => {
      const response = errorToResponse('String error');

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('String error');
    });

    it('should handle non-Error object', async () => {
      const response = errorToResponse({ code: 'CUSTOM' });

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('[object Object]');
    });

    it('should handle null error', async () => {
      const response = errorToResponse(null);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });

    it('should handle undefined error', async () => {
      const response = errorToResponse(undefined);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe('Internal server error');
    });

    it('should include success flag for HttpError', async () => {
      const error = new HttpError(400, 'Bad request');
      const response = errorToResponse(error);
      const body = await response.json();

      expect(body.success).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('should correctly map all domain error types to HTTP responses', async () => {
      const errors = [
        new EntityNotFoundError('Test', '1'),
        new ValidationError('field', 'error'),
        new ConflictError('conflict'),
        new UnauthorizedError('unauthorized'),
        new BusinessRuleViolationError('rule'),
      ];

      const expectedStatuses = [404, 422, 409, 401, 400];

      for (let i = 0; i < errors.length; i++) {
        const response = errorToResponse(errors[i]);
        expect(response.status).toBe(expectedStatuses[i]);
      }
    });

    it('should handle error with special characters in message', async () => {
      const error = new Error("Error with 'quotes' and \"double quotes\"");
      const response = errorToResponse(error);
      const body = await response.json();

      expect(body.error).toContain('quotes');
    });

    it('should handle error with newlines in message', async () => {
      const error = new Error('Error\nwith\nnewlines');
      const response = errorToResponse(error);
      const body = await response.json();

      expect(body.error).toBe('Error\nwith\nnewlines');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error message', async () => {
      const error = new Error('');
      const response = errorToResponse(error);
      const body = await response.json();

      expect(body.error).toBe('');
    });

    it('should handle very long error message', async () => {
      const longMessage = 'A'.repeat(10000);
      const error = new Error(longMessage);
      const response = errorToResponse(error);
      const body = await response.json();

      expect(body.error.length).toBe(10000);
    });

    it('should handle error with Unicode characters', async () => {
      const error = new Error('Error with emoji 🎉 and Chinese 中文');
      const response = errorToResponse(error);
      const body = await response.json();

      expect(body.error).toContain('🎉');
      expect(body.error).toContain('中文');
    });

    it('should handle DomainError with complex message', async () => {
      const error = new BusinessRuleViolationError(
        'Cannot delete user with active subscriptions',
        'User has 3 active subscriptions'
      );
      const response = domainErrorToResponse(error);
      const body = await response.json();

      expect(body.error).toContain('Cannot delete user');
      expect(body.error).toContain('3 active subscriptions');
    });
  });
});
