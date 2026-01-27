/**
 * Unit Tests for Result Type
 *
 * Tests the Result type for explicit error handling without exceptions.
 */

import { describe, it, expect } from 'bun:test';
import { Result, Success, Failure, isOk, isErr } from '../result/result';

describe('Result Type', () => {
  describe('Success', () => {
    it('should create success with value', () => {
      const success = new Success(42);
      expect(success.ok).toBe(true);
      expect(success.value).toBe(42);
    });

    it('should return true for isOk()', () => {
      const success = new Success('test');
      expect(success.isOk()).toBe(true);
    });

    it('should return false for isErr()', () => {
      const success = new Success('test');
      expect(success.isErr()).toBe(false);
    });

    it('should unwrap value', () => {
      const success = new Success({ id: 1, name: 'test' });
      expect(success.unwrap()).toEqual({ id: 1, name: 'test' });
    });

    it('should unwrapOr with default returns value', () => {
      const success = new Success('actual');
      expect(success.unwrapOr('default')).toBe('actual');
    });

    it('should map value', () => {
      const success = new Success(5);
      const mapped = success.map((x) => x * 2);
      expect(mapped.isOk()).toBe(true);
      if (mapped.isOk()) {
        expect(mapped.value).toBe(10);
      }
    });

    it('should flatMap value', async () => {
      const success = new Success(5);
      const flatMapped = success.flatMap((x) => Result.ok(x * 2));
      expect(flatMapped.isOk()).toBe(true);
      if (flatMapped.isOk()) {
        expect(flatMapped.value).toBe(10);
      }
    });
  });

  describe('Failure', () => {
    class TestError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'TestError';
      }
    }

    it('should create failure with error', () => {
      const error = new Error('Something went wrong');
      const failure = new Failure(error);
      expect(failure.ok).toBe(false);
      expect(failure.error).toBe(error);
    });

    it('should return false for isOk()', () => {
      const error = new Error('test');
      const failure = new Failure(error);
      expect(failure.isOk()).toBe(false);
    });

    it('should return true for isErr()', () => {
      const error = new Error('test');
      const failure = new Failure(error);
      expect(failure.isErr()).toBe(true);
    });

    it('should throw on unwrap', () => {
      const error = new TestError('Test error');
      const failure = new Failure(error);
      expect(() => failure.unwrap()).toThrow('Test error');
    });

    it('should unwrapOr with default returns default', () => {
      const error = new Error('test');
      const failure = new Failure(error);
      expect(failure.unwrapOr('default')).toBe('default');
    });

    it('should map and remain failure', () => {
      const error = new Error('test');
      const failure = new Failure(error);
      const mapped = failure.map((x: never) => x + 1);
      expect(mapped.isErr()).toBe(true);
      if (mapped.isErr()) {
        expect(mapped.error).toBe(error);
      }
    });

    it('should flatMap and remain failure', () => {
      const error = new Error('test');
      const failure = new Failure(error);
      const flatMapped = failure.flatMap((x: never) => Result.ok(10));
      expect(flatMapped.isErr()).toBe(true);
      if (flatMapped.isErr()) {
        expect(flatMapped.error).toBe(error);
      }
    });
  });

  describe('Result.ok()', () => {
    it('should create Success instance', () => {
      const result = Result.ok(42);
      expect(result instanceof Success).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should handle complex objects', () => {
      const obj = { nested: { value: 123 } };
      const result = Result.ok(obj);
      expect(result.value).toEqual(obj);
    });

    it('should handle null values', () => {
      const result = Result.ok(null);
      expect(result.value).toBeNull();
    });

    it('should handle undefined values', () => {
      const result = Result.ok(undefined);
      expect(result.value).toBeUndefined();
    });
  });

  describe('Result.fail()', () => {
    it('should create Failure instance', () => {
      const error = new Error('Failed');
      const result = Result.fail(error);
      expect(result instanceof Failure).toBe(true);
      expect(result.error).toBe(error);
    });

    it('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(code: string) {
          super(`Error: ${code}`);
          this.name = 'CustomError';
        }
      }
      const error = new CustomError('CODE_123');
      const result = Result.fail(error);
      expect(result.error).toBe(error);
    });
  });

  describe('Result.fromPromise()', () => {
    it('should resolve to Success on successful promise', async () => {
      const promise = Promise.resolve(42);
      const result = await Result.fromPromise(promise);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });

    it('should resolve to Failure on rejected promise', async () => {
      const error = new Error('Async error');
      const promise = Promise.reject(error);
      const result = await Result.fromPromise(promise);
      expect(result.isErr()).toBe(true);
    });

    it('should use errorMapper when provided', async () => {
      const promise = Promise.reject('raw error');
      const result = await Result.fromPromise(promise, (err) => {
        return new Error(`Mapped: ${String(err)}`);
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Mapped: raw error');
      }
    });

    it('should handle non-Error rejections', async () => {
      const promise = Promise.reject('string error');
      const result = await Result.fromPromise(promise);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe('string error');
      }
    });
  });

  describe('Result.all()', () => {
    it('should combine all successes', () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const combined = Result.all(results);
      expect(combined.isOk()).toBe(true);
      if (combined.isOk()) {
        expect(combined.value).toEqual([1, 2, 3]);
      }
    });

    it('should return first failure', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      const results = [Result.ok(1), Result.fail(error1), Result.ok(3), Result.fail(error2)];
      const combined = Result.all(results);
      expect(combined.isErr()).toBe(true);
      if (combined.isErr()) {
        expect(combined.error).toBe(error1);
      }
    });

    it('should handle empty array', () => {
      const combined = Result.all([]);
      expect(combined.isOk()).toBe(true);
      if (combined.isOk()) {
        expect(combined.value).toEqual([]);
      }
    });

    it('should handle all failures', () => {
      const error1 = new Error('Error 1');
      const error2 = new Error('Error 2');
      const results = [Result.fail(error1), Result.fail(error2)];
      const combined = Result.all(results);
      expect(combined.isErr()).toBe(true);
    });
  });

  describe('isOk()', () => {
    it('should return true for Success', () => {
      const result = Result.ok(42);
      expect(isOk(result)).toBe(true);
    });

    it('should return false for Failure', () => {
      const result = Result.fail(new Error('test'));
      expect(isOk(result)).toBe(false);
    });

    it('should type narrow correctly', () => {
      const result: Result<number, Error> = Result.ok(42);
      if (isOk(result)) {
        // TypeScript should know result is Success
        expect(result.value * 2).toBe(84);
      }
    });
  });

  describe('isErr()', () => {
    it('should return false for Success', () => {
      const result = Result.ok(42);
      expect(isErr(result)).toBe(false);
    });

    it('should return true for Failure', () => {
      const result = Result.fail(new Error('test'));
      expect(isErr(result)).toBe(true);
    });

    it('should type narrow correctly', () => {
      const result: Result<number, Error> = Result.fail(new Error('test'));
      if (isErr(result)) {
        // TypeScript should know result is Failure
        expect(result.error.message).toBe('test');
      }
    });
  });

  describe('Type Safety', () => {
    it('should preserve type information through map', () => {
      const result = Result.ok('5');
      const mapped = result.map(parseInt);
      if (mapped.isOk()) {
        // TypeScript should know mapped is Result<number, never>
        expect(mapped.value).toBe(5);
        expect(typeof mapped.value).toBe('number');
      }
    });

    it('should preserve type information through flatMap', () => {
      const result = Result.ok(10);
      const flatMapped = result.flatMap((n) =>
        n > 5 ? Result.ok('big') : Result.fail(new Error('small'))
      );
      if (flatMapped.isOk()) {
        expect(flatMapped.value).toBe('big');
        expect(typeof flatMapped.value).toBe('string');
      }
    });

    it('should handle different error types', () => {
      class ErrorA extends Error {
        constructor() {
          super('ErrorA');
          this.name = 'ErrorA';
        }
      }
      class ErrorB extends Error {
        constructor() {
          super('ErrorB');
          this.name = 'ErrorB';
        }
      }

      const result1: Result<number, ErrorA> = Result.fail(new ErrorA());
      const result2: Result<number, ErrorB> = Result.fail(new ErrorB());

      expect(result1.isErr()).toBe(true);
      expect(result2.isErr()).toBe(true);
    });
  });

  describe('Chaining Operations', () => {
    it('should chain multiple maps', () => {
      const result = Result.ok(5)
        .map((x) => x * 2)
        .map((x) => x + 1)
        .map((x) => x.toString());

      if (result.isOk()) {
        expect(result.value).toBe('11');
      }
    });

    it('should short-circuit on failure in map chain', () => {
      const result = Result.ok(5)
        .map((x) => x * 2)
        .map(() => {
          throw new Error('Should not reach here');
        });

      // Actually, map won't short-circuit for Success
      // Let's test with a failure
      const failure = Result.fail<number, Error>(new Error('Initial error'))
        .map((x) => x * 2);

      expect(failure.isErr()).toBe(true);
    });

    it('should chain flatMaps', () => {
      const divide = (a: number, b: number): Result<number, Error> => {
        if (b === 0) return Result.fail(new Error('Division by zero'));
        return Result.ok(a / b);
      };

      const result = Result.ok(20)
        .flatMap((x) => divide(x, 2))
        .flatMap((x) => divide(x, 5));

      if (result.isOk()) {
        expect(result.value).toBe(2);
      }
    });

    it('should short-circuit on failure in flatMap chain', () => {
      const divide = (a: number, b: number): Result<number, Error> => {
        if (b === 0) return Result.fail(new Error('Division by zero'));
        return Result.ok(a / b);
      };

      const result = Result.ok(20)
        .flatMap((x) => divide(x, 0))
        .flatMap((x) => divide(x, 5)); // Should not execute

      expect(result.isErr()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle functions returning void', () => {
      const result = Result.ok(undefined);
      expect(result.isOk()).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should handle Promise<void> in fromPromise', async () => {
      const promise = Promise.resolve();
      const result = await Result.fromPromise(promise);
      expect(result.isOk()).toBe(true);
    });

    it('should handle boolean values', () => {
      const result = Result.ok(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
        expect(typeof result.value).toBe('boolean');
      }
    });

    it('should handle array values', () => {
      const arr = [1, 2, 3];
      const result = Result.ok(arr);
      if (result.isOk()) {
        expect(result.value).toEqual(arr);
        expect(Array.isArray(result.value)).toBe(true);
      }
    });
  });
});
