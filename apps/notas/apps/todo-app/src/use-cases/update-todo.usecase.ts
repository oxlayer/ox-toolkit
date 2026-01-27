/**
 * Update Todo Use Case
 *
 * This use case extends UpdateUseCaseTemplate from @oxlayer/snippets
 * which provides the standard update pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { TodoRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { Todo, TodoUpdatedEvent, TodoCompletedEvent, TodoValidationError, type UpdateTodoInput, type TodoStatus } from '../domain/todo.js';
import { domainEvents } from '../config/clickhouse.config.js';
import { UpdateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

// Lazy import to avoid circular reference
type BusinessMetricsType = typeof import('../config/clickhouse.config.js').businessMetrics;

export interface UpdateTodoInputWithAuth extends UpdateTodoInput {
  id: string;
  userId: string;
}

export interface UpdateTodoOutput extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  completedAt?: Date;
  updatedAt: Date;
  projectId?: string;
  sectionId?: string;
  priority?: number;
  order?: number;
}

/**
 * Update Todo Use Case
 *
 * Extends UpdateUseCaseTemplate which provides:
 * - Finding entity by ID
 * - Updating entity
 * - Persistence
 * - Event publishing
 * - Metrics recording
 * - Tracing spans
 */
export class UpdateTodoUseCase extends UpdateUseCaseTemplate<
  UpdateTodoInputWithAuth,
  Todo,
  AppResult<UpdateTodoOutput>
> {
  private changes: Record<string, unknown> = {};
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
        return entity;
      },
      updateEntity: (entity, input) => {
        // Track changes for event
        if (input.status !== undefined && input.status !== entity.status) {
          // Validate status first
          const validStatuses: TodoStatus[] = ['pending', 'in_progress', 'completed'];
          if (!validStatuses.includes(input.status as TodoStatus)) {
            throw new TodoValidationError('status', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
          }

          this.changes.status = input.status;

          if (input.status === 'completed') {
            entity.markAsCompleted();
          } else if (input.status === 'in_progress') {
            entity.markAsInProgress();
          } else {
            entity.resetToPending();
          }
        }

        // Track other changes
        if (input.title !== undefined) {
          this.changes.title = input.title;
        }
        if (input.description !== undefined) {
          this.changes.description = input.description;
        }
        if (input.dueDate !== undefined) {
          this.changes.dueDate = input.dueDate;
        }
        if (input.projectId !== undefined) {
          this.changes.projectId = input.projectId;
        }
        if (input.sectionId !== undefined) {
          this.changes.sectionId = input.sectionId;
        }
        if (input.priority !== undefined) {
          this.changes.priority = input.priority;
        }
        if (input.order !== undefined) {
          this.changes.order = input.order;
        }

        // Apply title/description/dueDate/projectId/sectionId/priority/order changes if any
        if (
          input.title !== undefined ||
          input.description !== undefined ||
          input.dueDate !== undefined ||
          input.projectId !== undefined ||
          input.sectionId !== undefined ||
          input.priority !== undefined ||
          input.order !== undefined
        ) {
          entity.updateDetails(input);
        }
      },
      persistEntity: async (entity) => todoRepository.update(entity),
      publishEvent: async (event) => {
        // Only publish event if there are actual changes
        if (Object.keys(this.changes).length > 0) {
          try {
            await eventBus.emit(event as any);
          } catch (error) {
            // Non-critical: don't fail the update operation if event bus fails
            // In production, this should be logged and monitored
            // Consider implementing retry logic or dead letter queue
            console.error('[UpdateTodoUseCase] Event bus publish failed:', error);
          }
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
      toOutput: (entity) => {
        const response = entity.toResponse();
        return {
          id: response.id,
          title: response.title,
          description: response.description,
          status: response.status,
          dueDate: response.dueDate,
          completedAt: response.completedAt,
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

  /**
   * Override execute to add custom business logic, error handling, and ClickHouse analytics
   */
  async execute(input: UpdateTodoInputWithAuth): Promise<AppResult<UpdateTodoOutput>> {
    try {
      this.changes = {};
      this.lastUserId = input.userId;
      const result = await super.execute(input);

      if (result.success && result.data && Object.keys(this.changes).length > 0) {
        // Emit domain event to ClickHouse for analytics
        try {
          await this.clickhouseDomainEvents.emit(
            'todo_updated',
            {
              todo_id: result.data.id,
              user_id: input.userId,
              changes: this.changes,
              status: result.data.status,
            },
            {
              tenant: 'default',
              plan: 'free',
            }
          );
        } catch {
          // Non-critical: don't fail the update operation if analytics fail
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
          message: 'An error occurred while updating the todo',
        },
      };
    }
  }

  protected createEvent(entity: Todo, changes: Record<string, unknown>): unknown {
    // If the status changed to completed, publish Todo.Completed event
    if (this.changes.status === 'completed' && entity.completedAt) {
      return new TodoCompletedEvent({
        aggregateId: entity.id,
        userId: entity.userId,
        completedAt: entity.completedAt,
      });
    }
    return new TodoUpdatedEvent({
      aggregateId: entity.id,
      userId: entity.userId,
      changes,
    });
  }

  protected getUseCaseName(): string {
    return 'UpdateTodo';
  }
}
