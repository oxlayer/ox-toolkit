/**
 * Delete Todo Use Case
 *
 * This use case extends DeleteUseCaseTemplate from @oxlayer/snippets
 * which provides the standard delete pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { TodoRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { Todo, TodoDeletedEvent, TodoValidationError } from '../domain/todo.js';
import { domainEvents } from '../config/clickhouse.config.js';
import { DeleteUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

// Lazy import to avoid circular reference
type BusinessMetricsType = typeof import('../config/clickhouse.config.js').businessMetrics;

export interface DeleteTodoInput {
  id: string;
  userId: string;
}

export interface DeleteTodoOutput extends Record<string, unknown> {
  deleted: boolean;
}

/**
 * Delete Todo Use Case
 *
 * Extends DeleteUseCaseTemplate which provides:
 * - Finding entity by ID
 * - Deleting entity
 * - Event publishing
 * - Metrics recording
 * - Tracing spans
 */
export class DeleteTodoUseCase extends DeleteUseCaseTemplate<
  DeleteTodoInput,
  Todo,
  AppResult<DeleteTodoOutput>
> {
  private deletedTodo: Todo | null = null;
  private lastUserId: string | undefined;

  constructor(
    todoRepository: TodoRepository,
    eventBus: EventBus,
    private clickhouseDomainEvents: Pick<typeof domainEvents, 'emit'>,
    private businessMetrics?: Pick<BusinessMetricsType, 'increment'>,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        const entity = await todoRepository.findById(id);
        // Ownership check - return null if not owned by user (will be treated as not found)
        if (entity && this.lastUserId && entity.userId !== this.lastUserId) {
          return null;
        }
        this.deletedTodo = entity;
        return entity;
      },
      deleteEntity: async (id) => todoRepository.delete(id),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          // Non-critical: don't fail the operation if event bus fails
          // In production, this should be logged and monitored
          // Consider implementing retry logic or dead letter queue
          console.error('[DeleteTodoUseCase] Event bus publish failed:', error);
        }
      },
      recordMetric: async (name: string, value: number) => {
        if (this.businessMetrics) {
          await this.businessMetrics.increment(name, {
            tenant: 'default',
            plan: 'free',
            value,
          });
        }
      },
      tracer,
    });
  }

  /**
   * Override execute to add ClickHouse analytics and error handling
   */
  async execute(input: DeleteTodoInput): Promise<AppResult<DeleteTodoOutput>> {
    try {
      // Validate userId
      if (!input.userId || input.userId.trim() === '') {
        throw new TodoValidationError('userId', 'userId is required');
      }

      // Validate id
      if (!input.id || input.id.trim() === '') {
        throw new TodoValidationError('id', 'id is required');
      }

      this.lastUserId = input.userId;
      const result = await super.execute(input);

      if (result.success && this.deletedTodo) {
        // Emit domain event to ClickHouse for analytics
        try {
          await this.clickhouseDomainEvents.emit(
            'todo_deleted',
            {
              todo_id: this.deletedTodo.id,
              user_id: this.deletedTodo.userId,
              status: this.deletedTodo.status,
            },
            {
              tenant: 'default',
              plan: 'free',
            }
          );
        } catch {
          // Non-critical: don't fail the delete operation if analytics fail
        }
      }

      return result;
    } catch (error) {
      // Handle validation errors
      if (error instanceof TodoValidationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        };
      }

      // Handle other errors
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the todo',
        },
      };
    }
  }

  protected override createEvent(entity: Todo): unknown {
    return new TodoDeletedEvent({
      aggregateId: entity.id,
      userId: entity.userId,
    });
  }

  protected getUseCaseName(): string {
    return 'DeleteTodo';
  }
}
