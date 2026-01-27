/**
 * Todo Repository Interface
 */

import type { Todo, TodoFilters } from '../domain/todo.js';

export interface TodoRepository {
  /**
   * Find todo by ID
   */
  findById(id: string): Promise<Todo | null>;

  /**
   * Find all todos with optional filters
   */
  findAll(filters?: TodoFilters): Promise<Todo[]>;

  /**
   * Find todos by user
   */
  findByUser(userId: string): Promise<Todo[]>;

  /**
   * Create a new todo
   */
  create(todo: Todo): Promise<void>;

  /**
   * Update an existing todo
   */
  update(todo: Todo): Promise<void>;

  /**
   * Delete a todo
   */
  delete(id: string): Promise<void>;

  /**
   * Count todos
   */
  count(filters?: TodoFilters): Promise<number>;
}
