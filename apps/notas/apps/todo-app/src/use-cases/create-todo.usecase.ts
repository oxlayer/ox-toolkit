/**
 * Create Todo Use Case
 *
 * This use case extends CreateUseCaseTemplate from @oxlayer/snippets
 * which provides the standard create pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { TodoRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { Todo, TodoCreatedEvent, TodoValidationError, type CreateTodoInput } from '../domain/todo.js';
import { domainEvents } from '../config/clickhouse.config.js';
import { CreateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';
import { Logger } from '@oxlayer/capabilities-internal';

const logger = new Logger('CreateTodoUseCase');

// Lazy import to avoid circular reference
type BusinessMetricsType = typeof import('../config/clickhouse.config.js').businessMetrics;

export interface CreateTodoInputWithAuth extends CreateTodoInput {
  userId: string;
}

export interface CreateTodoOutput extends Record<string, unknown> {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date;
  createdAt: Date;
  projectId?: string;
  sectionId?: string;
  priority?: number;
  order?: number;
}

/**
 * Create Todo Use Case
 *
 * Extends CreateUseCaseTemplate which provides:
 * - ID generation
 * - Entity creation
 * - Persistence
 * - Event publishing
 * - Metrics recording
 * - Tracing spans
 */
export class CreateTodoUseCase extends CreateUseCaseTemplate<
  CreateTodoInputWithAuth,
  Todo,
  AppResult<CreateTodoOutput>
> {
  constructor(
    todoRepository: TodoRepository,
    eventBus: EventBus,
    private clickhouseDomainEvents: Pick<typeof domainEvents, 'emit'>,
    private businessMetrics?: Pick<BusinessMetricsType, 'increment'>,
    tracer?: unknown | null
  ) {
    super({
      generateId: () => `todo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      createEntity: (data) => Todo.create(data),
      persistEntity: async (entity) => todoRepository.create(entity),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          // Non-critical: don't fail the operation if event bus fails
          // In production, this should be logged and monitored
          // Consider implementing retry logic or dead letter queue
          logger.warn('Event bus publish failed', { error });
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
          createdAt: response.createdAt,
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
   * Override execute to add ClickHouse analytics and error handling
   */
  async execute(input: CreateTodoInputWithAuth): Promise<AppResult<CreateTodoOutput>> {
    try {
      logger.debug('Input received', { userId: input.userId, title: input.title });
      const result = await super.execute(input);

      if (result.success && result.data) {
        // Emit domain event to ClickHouse for analytics
        // This is separate from RabbitMQ - used for business intelligence
        try {
          await this.clickhouseDomainEvents.emit(
            'todo_created',
            {
              todo_id: result.data.id,
              user_id: input.userId,
              title: result.data.title,
              description: result.data.description,
              status: result.data.status,
              due_date: result.data.dueDate,
            },
            {
              // TODO: Get these from auth context when multi-tenancy is implemented
              tenant: 'default',
              plan: 'free',
            }
          );
        } catch {
          // Non-critical: don't fail the create operation if analytics fail
        }
      }

      return result;
    } catch (error) {
      logger.error('Unexpected error', { error: error instanceof Error ? error : undefined });

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

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `An error occurred while creating the todo`,
        },
      };
    }
  }

  protected override createEvent(entity: Todo, _id: string): unknown {
    return new TodoCreatedEvent({
      aggregateId: entity.id,
      userId: entity.userId,
      title: entity.title,
      description: entity.description,
      dueDate: entity.dueDate,
    });
  }

  protected getUseCaseName(): string {
    return 'CreateTodo';
  }
}
