/**
 * Unit Tests for Use Case Patterns
 *
 * Tests use case interfaces and patterns for application logic.
 */

import { describe, it, expect } from 'bun:test';
import {
  UseCase,
  ResultUseCase,
  QueryUseCase,
  CommandUseCase,
  MutationUseCase,
} from '../use-cases/use-case';
import { Result } from '../result/result';

describe('Use Case Patterns', () => {
  // Test implementation of UseCase
  class CreateTodoUseCase implements UseCase<{ title: string }, { id: string; title: string }> {
    async execute(input: { title: string }): Promise<{ id: string; title: string }> {
      return {
        id: `todo-${Date.now()}`,
        title: input.title,
      };
    }
  }

  // Test implementation of ResultUseCase
  class DivideUseCase implements ResultUseCase<{ a: number; b: number }, number, Error> {
    async execute(input: { a: number; b: number }): Promise<Result<number, Error>> {
      if (input.b === 0) {
        return Result.fail(new Error('Division by zero'));
      }
      return Result.ok(input.a / input.b);
    }
  }

  // Test implementation of QueryUseCase
  class GetAllTodosUseCase implements QueryUseCase<{ id: string; title: string }[]> {
    async execute(): Promise<{ id: string; title: string }[]> {
      return [
        { id: '1', title: 'Todo 1' },
        { id: '2', title: 'Todo 2' },
      ];
    }
  }

  // Test implementation of CommandUseCase
  class DeleteTodoUseCase implements CommandUseCase<{ id: string }> {
    async execute(_input: { id: string }): Promise<void> {
      // Delete logic here
    }
  }

  // Test implementation of MutationUseCase
  class UpdateTodoUseCase implements MutationUseCase<{ id: string; title: string }, { id: string; title: string }> {
    readonly __mutation = true;

    async execute(input: { id: string; title: string }): Promise<{ id: string; title: string }> {
      return {
        id: input.id,
        title: input.title,
      };
    }
  }

  describe('UseCase', () => {
    it('should execute with input and return output', async () => {
      const useCase = new CreateTodoUseCase();
      const result = await useCase.execute({ title: 'Test Todo' });

      expect(result.id).toMatch(/^todo-\d+$/);
      expect(result.title).toBe('Test Todo');
    });

    it('should handle complex input types', async () => {
      interface ComplexInput {
        user: { id: string; name: string };
        items: { productId: string; quantity: number }[];
      }

      class ComplexUseCase implements UseCase<ComplexInput, string> {
        async execute(input: ComplexInput): Promise<string> {
          return `Order for ${input.user.name} with ${input.items.length} items`;
        }
      }

      const useCase = new ComplexUseCase();
      const result = await useCase.execute({
        user: { id: '1', name: 'John' },
        items: [{ productId: 'p1', quantity: 2 }],
      });

      expect(result).toContain('John');
      expect(result).toContain('1 items');
    });
  });

  describe('ResultUseCase', () => {
    it('should return successful Result on valid operation', async () => {
      const useCase = new DivideUseCase();
      const result = await useCase.execute({ a: 10, b: 2 });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(5);
      }
    });

    it('should return failed Result on error', async () => {
      const useCase = new DivideUseCase();
      const result = await useCase.execute({ a: 10, b: 0 });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Division by zero');
      }
    });

    it('should handle complex Result chains', async () => {
      class ValidateAndDivideUseCase implements ResultUseCase<{ a: number; b: number }, number, Error> {
        async execute(input: { a: number; b: number }): Promise<Result<number, Error>> {
          // Validate input
          if (input.a < 0 || input.b < 0) {
            return Result.fail(new Error('Negative numbers not allowed'));
          }

          // Perform division
          if (input.b === 0) {
            return Result.fail(new Error('Division by zero'));
          }

          return Result.ok(input.a / input.b);
        }
      }

      const useCase = new ValidateAndDivideUseCase();
      const result = await useCase.execute({ a: 10, b: 2 });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(5);
      }
    });
  });

  describe('QueryUseCase', () => {
    it('should execute without input and return data', async () => {
      const useCase = new GetAllTodosUseCase();
      const result = await useCase.execute();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should handle empty results', async () => {
      class EmptyQueryUseCase implements QueryUseCase<string[]> {
        async execute(): Promise<string[]> {
          return [];
        }
      }

      const useCase = new EmptyQueryUseCase();
      const result = await useCase.execute();

      expect(result).toEqual([]);
    });

    it('should handle single value return', async () => {
      class CountQueryUseCase implements QueryUseCase<number> {
        async execute(): Promise<number> {
          return 42;
        }
      }

      const useCase = new CountQueryUseCase();
      const result = await useCase.execute();

      expect(result).toBe(42);
    });
  });

  describe('CommandUseCase', () => {
    it('should execute with input and return void', async () => {
      const useCase = new DeleteTodoUseCase();
      const result = await useCase.execute({ id: 'todo-1' });

      expect(result).toBeUndefined();
    });

    it('should handle side effects', async () => {
      let sideEffectExecuted = false;

      class SideEffectCommandUseCase implements CommandUseCase<{ id: string }> {
        async execute(_input: { id: string }): Promise<void> {
          sideEffectExecuted = true;
        }
      }

      const useCase = new SideEffectCommandUseCase();
      await useCase.execute({ id: 'todo-1' });

      expect(sideEffectExecuted).toBe(true);
    });
  });

  describe('MutationUseCase', () => {
    it('should have mutation marker', () => {
      const useCase = new UpdateTodoUseCase();
      expect(useCase.__mutation).toBe(true);
    });

    it('should execute like regular UseCase', async () => {
      const useCase = new UpdateTodoUseCase();
      const result = await useCase.execute({ id: 'todo-1', title: 'Updated' });

      expect(result.id).toBe('todo-1');
      expect(result.title).toBe('Updated');
    });
  });

  describe('Integration Patterns', () => {
    it('should compose multiple use cases', async () => {
      // Setup use case
      class SetupUseCase implements UseCase<{ name: string }, { id: string; name: string }> {
        async execute(input: { name: string }): Promise<{ id: string; name: string }> {
          return { id: `setup-${Date.now()}`, name: input.name };
        }
      }

      // Process use case (depends on setup)
      class ProcessUseCase implements ResultUseCase<{ id: string }, string, Error> {
        async execute(input: { id: string }): Promise<Result<string, Error>> {
          if (!input.id) {
            return Result.fail(new Error('Invalid ID'));
          }
          return Result.ok(`Processed ${input.id}`);
        }
      }

      const setup = new SetupUseCase();
      const process = new ProcessUseCase();

      const setupResult = await setup.execute({ name: 'Test' });
      const processResult = await process.execute(setupResult);

      expect(processResult.isOk()).toBe(true);
      if (processResult.isOk()) {
        expect(processResult.value).toContain('Processed setup-');
      }
    });

    it('should handle error propagation in use case chains', async () => {
      class ValidateUseCase implements ResultUseCase<{ value: number }, number, Error> {
        async execute(input: { value: number }): Promise<Result<number, Error>> {
          if (input.value < 0) {
            return Result.fail(new Error('Value must be positive'));
          }
          return Result.ok(input.value);
        }
      }

      class DoubleUseCase implements ResultUseCase<number, number, Error> {
        async execute(input: number): Promise<Result<number, Error>> {
          return Result.ok(input * 2);
        }
      }

      const validate = new ValidateUseCase();
      const _double = new DoubleUseCase();

      const validationResult = await validate.execute({ value: -5 });
      expect(validationResult.isErr()).toBe(true);

      // Should not proceed to double if validation fails
      if (validationResult.isErr()) {
        expect(validationResult.error.message).toBe('Value must be positive');
      }
    });
  });

  describe('Type Safety', () => {
    it('should enforce input types', async () => {
      class StrictUseCase implements UseCase<{ required: string }, string> {
        async execute(input: { required: string }): Promise<string> {
          return input.required;
        }
      }

      const useCase = new StrictUseCase();

      // Valid call
      const result1 = await useCase.execute({ required: 'test' });
      expect(result1).toBe('test');

      // Invalid calls would cause TypeScript errors (commented out)
      // @ts-expect-error - missing required field
      // await useCase.execute({});
    });

    it('should enforce output types', async () => {
      class OutputUseCase implements UseCase<string, { value: number }> {
        async execute(input: string): Promise<{ value: number }> {
          return { value: parseInt(input, 10) };
        }
      }

      const useCase = new OutputUseCase();
      const result = await useCase.execute('42');

      expect(result.value).toBe(42);
      expect(typeof result.value).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input values', async () => {
      class NullHandlingUseCase implements UseCase<{ value: string | null }, string> {
        async execute(input: { value: string | null }): Promise<string> {
          return input.value ?? 'default';
        }
      }

      const useCase = new NullHandlingUseCase();
      const result = await useCase.execute({ value: null });

      expect(result).toBe('default');
    });

    it('should handle undefined in optional fields', async () => {
      interface OptionalInput {
        required: string;
        optional?: string;
      }

      class OptionalUseCase implements UseCase<OptionalInput, string> {
        async execute(input: OptionalInput): Promise<string> {
          return input.optional ?? input.required;
        }
      }

      const useCase = new OptionalUseCase();
      const result = await useCase.execute({ required: 'test' });

      expect(result).toBe('test');
    });

    it('should handle large datasets in queries', async () => {
      class LargeQueryUseCase implements QueryUseCase<number[]> {
        async execute(): Promise<number[]> {
          return Array.from({ length: 10000 }, (_, i) => i);
        }
      }

      const useCase = new LargeQueryUseCase();
      const result = await useCase.execute();

      expect(result.length).toBe(10000);
      expect(result[0]).toBe(0);
      expect(result[9999]).toBe(9999);
    });
  });
});
