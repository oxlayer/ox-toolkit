/**
 * Get Todos Use Case
 *
 * This use case extends ListUseCaseTemplate from @oxlayer/snippets
 * which provides the standard list pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { TodoRepository } from '../repositories/index.js';
import type { TodoFilters } from '../domain/todo.js';
import type { Todo } from '../domain/todo.js';
import { ListUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface GetTodosInput {
  userId?: string;
  filters?: TodoFilters;
}

export interface TodoOutput extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string;
  status: string;
  userId: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  sectionId?: string;
  priority?: number;
  order?: number;
}

/**
 * Get Todos Use Case
 *
 * Extends ListUseCaseTemplate which provides:
 * - Finding entities with filters
 * - Counting entities
 * - Mapping to output
 * - Tracing spans
 */
export class GetTodosUseCase extends ListUseCaseTemplate<
  GetTodosInput,
  Todo,
  AppResult<{ items: TodoOutput[]; total: number }>
> {
  constructor(
    todoRepository: TodoRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (input) => {
        // If userId is provided, add it to filters
        const filters = input.userId
          ? { ...input.filters, userId: input.userId }
          : input.filters;

        return todoRepository.findAll(filters);
      },
      countEntities: async (input) => {
        // If userId is provided, add it to filters
        const filters = input.userId
          ? { ...input.filters, userId: input.userId }
          : input.filters;

        return todoRepository.count(filters);
      },
      toOutput: (entity) => {
        const response = entity.toResponse();
        return {
          id: response.id,
          title: response.title,
          description: response.description,
          status: response.status,
          userId: response.userId,
          dueDate: response.dueDate,
          completedAt: response.completedAt,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
          projectId: response.projectId,
          sectionId: response.sectionId,
          priority: response.priority,
          order: response.order,
        };
      },
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'GetTodos';
  }
}
