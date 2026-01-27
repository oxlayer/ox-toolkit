/**
 * Todo Builder
 *
 * Test data builder for Todo entities using the Builder pattern.
 * Provides fluent API for creating test todos with sensible defaults.
 * Uses the generic CombinedBuilder from @oxlayer/capabilities-testing internally.
 */

import { generateTestId } from '@oxlayer/foundation-testing-kit';
import { CombinedBuilder, type BuilderValue } from '@oxlayer/capabilities-testing/builders';
import type { TodoProps, TodoStatus } from '../../domain/todo.js';
import { Todo } from '../../domain/todo.js';

/**
 * Todo data builder
 *
 * Wraps the generic CombinedBuilder with Todo-specific convenience methods.
 */
export class TodoBuilder {
  private builder: CombinedBuilder<TodoProps, TodoStatus>;

  constructor() {
    this.builder = new CombinedBuilder<TodoProps, TodoStatus>({
      id: () => generateTestId('todo'),
      title: 'Test Todo',
      description: 'Test description',
      status: 'pending' as TodoStatus,
      userId: () => generateTestId('user'),
      tenantId: () => generateTestId('tenant'),
      dueDate: undefined,
      completedAt: undefined,
      createdAt: () => new Date(),
      updatedAt: () => new Date(),
    });
  }

  /**
   * Set multiple defaults at once
   */
  withDefaults(defaults: Partial<Record<keyof TodoProps, BuilderValue<TodoProps[keyof TodoProps]>>>): this {
    this.builder.withDefaults(defaults);
    return this;
  }

  /**
   * Set todo ID
   */
  withId(id: string | (() => string)): this {
    this.builder.with('id', id as BuilderValue<TodoProps['id']>);
    return this;
  }

  /**
   * Set todo title
   */
  withTitle(title: string | (() => string)): this {
    this.builder.with('title', title as BuilderValue<TodoProps['title']>);
    return this;
  }

  /**
   * Set todo description
   */
  withDescription(description: string | (() => string)): this {
    this.builder.with('description', description as BuilderValue<TodoProps['description']>);
    return this;
  }

  /**
   * Set todo status
   */
  withStatus(status: TodoStatus): this {
    this.builder.withStatus('status', status);
    return this;
  }

  /**
   * Mark as pending
   */
  pending(): this {
    this.builder.pending('status' as any);
    return this;
  }

  /**
   * Mark as in progress
   */
  inProgress(): this {
    this.builder.withStatus('status', 'in_progress');
    return this;
  }

  /**
   * Mark as completed
   */
  completed(): this {
    this.builder.completed('status' as any);
    return this;
  }

  /**
   * Set user ID
   */
  withUserId(userId: string | (() => string)): this {
    this.builder.with('userId', userId as BuilderValue<TodoProps['userId']>);
    return this;
  }

  /**
   * Set tenant ID (for multi-tenancy testing)
   */
  withTenantId(tenantId: string | (() => string)): this {
    this.builder.with('tenantId', tenantId as BuilderValue<TodoProps['tenantId']>);
    return this;
  }

  /**
   * Set due date
   */
  withDueDate(date: Date | (() => Date)): this {
    this.builder.with('dueDate', date as BuilderValue<TodoProps['dueDate']>);
    return this;
  }

  /**
   * Set due date to X days from now
   */
  withDueInDays(days: number): this {
    this.builder.withFutureDate('dueDate', days);
    return this;
  }

  /**
   * Set completed at date
   */
  withCompletedAt(date: Date | (() => Date)): this {
    this.builder.with('completedAt', date as BuilderValue<TodoProps['completedAt']>);
    return this;
  }

  /**
   * Build the todo as a domain entity
   */
  build(): Todo {
    const props = this.builder.build();
    return Todo.fromPersistence(props);
  }

  /**
   * Build the todo as plain props (for persistence testing)
   */
  buildProps(): TodoProps {
    return this.builder.build();
  }
}

/**
 * Create a todo builder with defaults
 */
export function createTodoBuilder(defaults?: Partial<Record<keyof TodoProps, BuilderValue<TodoProps[keyof TodoProps]>>>): TodoBuilder {
  const builder = new TodoBuilder();
  if (defaults) {
    builder.withDefaults(defaults);
  }
  return builder;
}
