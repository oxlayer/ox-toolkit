/**
 * Mock Todo Repository
 *
 * In-memory repository for testing without database.
 * Now extends the generic MockRepository from @oxlayer/capabilities-testing.
 */

import { MockRepository, createMockRepository } from '@oxlayer/capabilities-testing/mock-repository';
import type { TodoRepository } from '../../repositories/todo.repository.js';
import type { Todo, TodoFilters } from '../../domain/todo.js';

/**
 * Mock implementation of TodoRepository
 *
 * Extends the generic MockRepository with Todo-specific filtering logic.
 */
export class MockTodoRepository extends MockRepository<Todo, string, TodoFilters> {
  constructor() {
    super({
      getId: (todo) => todo.id,
      filter: (todo, filters) => {
        // Apply filters
        if (filters?.status && todo.status !== filters.status) {
          return false;
        }
        if (filters?.userId && todo.userId !== filters.userId) {
          return false;
        }
        return true;
      },
      search: (todo, query) => {
        const q = query.toLowerCase();
        return (
          todo.title.toLowerCase().includes(q) ||
          (todo.description?.toLowerCase().includes(q) ?? false)
        );
      },
    });
  }

  /**
   * Find todos by user ID
   *
   * @param userId - The user ID to filter by
   * @returns Array of todos owned by the user
   *
   * @example
   * ```typescript
   * const userTodos = await repository.findByUser('user-1');
   * ```
   */
  async findByUser(userId: string): Promise<Todo[]> {
    const allTodos = await this.findAll();
    return allTodos.filter((t) => t.userId === userId);
  }
}

/**
 * Create a new MockTodoRepository instance
 *
 * Convenience function for creating a mock todo repository.
 *
 * @example
 * ```typescript
 * import { createMockTodoRepository } from '@oxlayer/capabilities-testing/mock-todo-repository';
 *
 * const repository = createMockTodoRepository();
 * ```
 */
export function createMockTodoRepository(): MockTodoRepository {
  return new MockTodoRepository();
}
