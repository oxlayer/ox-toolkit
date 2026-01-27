/**
 * Todo Fixtures
 *
 * Pre-defined test data for todos.
 */

import { createTodoBuilder } from '../builders/todo.builder.js';

/**
 * Common todo fixtures
 */
export const todoFixtures = {
  /**
   * Basic pending todo
   */
  pending: createTodoBuilder().pending().build(),

  /**
   * In-progress todo
   */
  inProgress: createTodoBuilder().inProgress().build(),

  /**
   * Completed todo
   */
  completed: createTodoBuilder().completed().build(),

  /**
   * Todo with due date
   */
  withDueDate: createTodoBuilder()
    .withTitle('Todo with Due Date')
    .withDueInDays(7)
    .build(),

  /**
   * Todo for different tenant
   */
  otherTenant: createTodoBuilder()
    .withTenantId('other-tenant')
    .withTitle('Other Tenant Todo')
    .build(),

  /**
   * Completed todo with completion date
   */
  completedWithDate: createTodoBuilder()
    .completed()
    .withCompletedAt(new Date('2024-01-15T10:00:00Z'))
    .build(),
};

/**
 * Create multiple todos for testing
 */
export function createTodoFixtures(count: number): any[] {
  return Array.from({ length: count }, (_, i) =>
    createTodoBuilder()
      .withId(`todo_${i}`)
      .withTitle(`Todo ${i}`)
      .build()
  );
}

/**
 * Create todos for pagination testing
 */
export function createPaginatedTodos(page: number, pageSize: number): any[] {
  const todos = createTodoFixtures(50); // Create 50 todos
  const start = page * pageSize;
  return todos.slice(start, start + pageSize);
}
