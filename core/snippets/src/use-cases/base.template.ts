/**
 * Use Case Base Templates
 *
 * Base classes and templates for creating use cases that follow DDD patterns.
 * Use cases orchestrate business logic and coordinate between entities, repositories,
 * and external services like event buses.
 *
 * @example
 * ```typescript
 * import type { UseCase } from '@oxlayer/foundation-app-kit';
 * import type { Result } from '@oxlayer/foundation-app-kit';
 * import { withUseCaseSpan } from '@oxlayer/capabilities-telemetry';
 *
 * export class CreateTodoUseCase implements UseCase<CreateTodoInput, AppResult<TodoOutput>> {
 *   constructor(
 *     private todoRepository: TodoRepository,
 *     private eventBus: EventBus,
 *     private tracer?: unknown | null
 *   ) {}
 *
 *   async execute(input: CreateTodoInput): Promise<AppResult<TodoOutput>> {
 *     return withUseCaseSpan(
 *       this.tracer as any || null,
 *       'CreateTodo',
 *       async (span) => {
 *         span?.setAttribute('user.id', input.userId);
 *         // ... business logic ...
 *         return { success: true, data: output };
 *       }
 *     );
 *   }
 * }
 * ```
 */

import type { UseCase } from '@oxlayer/foundation-app-kit';

/**
 * Application result type for use case outputs.
 *
 * This is a plain object pattern commonly used in OxLayer applications
 * for explicit error handling with { success, data, error } shape.
 *
 * Note: This differs from foundation's Result type (Success/Failure classes)
 * but matches the pattern used in many OxLayer applications.
 */
export type AppResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Base class for use cases with common patterns
 *
 * Provides:
 * - Tracing integration
 * - Common error handling
 * - Event publishing hooks
 * - Metrics recording hooks
 */
export abstract class BaseUseCase<TInput, TOutput extends AppResult<unknown>> implements UseCase<TInput, TOutput> {
  constructor(
    protected readonly dependencies: {
      tracer?: unknown | null;
      eventBus?: { emit(event: unknown): Promise<void> };
      metrics?: { record(metric: string, value: number): Promise<void> };
    }
  ) {}

  /**
   * Execute the use case
   * Override this method to implement business logic
   */
  abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Get the tracer for span creation
   */
  protected getTracer(): any {
    return this.dependencies.tracer as any;
  }

  /**
   * Emit a domain event
   */
  protected async emitEvent(event: unknown): Promise<void> {
    if (this.dependencies.eventBus) {
      await this.dependencies.eventBus.emit(event);
    }
  }

  /**
   * Record a metric
   */
  protected async recordMetric(metric: string, value: number = 1): Promise<void> {
    if (this.dependencies.metrics) {
      await this.dependencies.metrics.record(metric, value);
    }
  }

  /**
   * Handle errors consistently
   * Override to customize error handling
   */
  protected handleError(error: unknown): TOutput {
    if (error instanceof Error) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      } as unknown as TOutput;
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
    } as unknown as TOutput;
  }
}

/**
 * Base class for create use cases
 *
 * Common pattern: create an entity, persist it, emit an event
 */
export abstract class CreateUseCase<
  TInput,
  TEntity,
  TOutput extends AppResult<{ id: string } & Record<string, unknown>>
> extends BaseUseCase<TInput, TOutput> {
  /**
   * Create the entity from input
   */
  protected abstract createEntity(input: TInput): TEntity;

  /**
   * Persist the entity
   */
  protected abstract persistEntity(entity: TEntity): Promise<void>;

  /**
   * Create the domain event
   */
  protected abstract createEvent(entity: TEntity): unknown;

  /**
   * Convert entity to output
   */
  protected abstract toOutput(entity: TEntity): TOutput extends AppResult<infer O> ? O : never;

  /**
   * Execute the create use case
   */
  async execute(input: TInput): Promise<TOutput> {
    try {
      // Create entity
      const entity = this.createEntity(input);

      // Persist
      await this.persistEntity(entity);

      // Emit event
      const event = this.createEvent(entity);
      await this.emitEvent(event);

      // Record metric
      await this.recordMetric(`entity.created`, 1);

      // Return output
      return {
        success: true,
        data: this.toOutput(entity),
      } as unknown as TOutput;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * Base class for update use cases
 *
 * Common pattern: find entity, update it, persist, emit event
 */
export abstract class UpdateUseCase<
  TInput extends { id: string },
  TEntity,
  TOutput extends AppResult<Record<string, unknown>>
> extends BaseUseCase<TInput, TOutput> {
  /**
   * Find the entity by ID
   */
  protected abstract findEntity(id: string): Promise<TEntity | null>;

  /**
   * Update the entity with input data
   */
  protected abstract updateEntity(entity: TEntity, input: TInput): void;

  /**
   * Persist the entity
   */
  protected abstract persistEntity(entity: TEntity): Promise<void>;

  /**
   * Create the domain event
   */
  protected abstract createEvent(entity: TEntity, changes: Record<string, unknown>): unknown;

  /**
   * Convert entity to output
   */
  protected abstract toOutput(entity: TEntity): TOutput extends AppResult<infer O> ? O : never;

  /**
   * Execute the update use case
   */
  async execute(input: TInput): Promise<TOutput> {
    try {
      // Find entity
      const entity = await this.findEntity(input.id);
      if (!entity) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Entity not found',
          },
        } as unknown as TOutput;
      }

      // Track changes
      const changes: Record<string, unknown> = {};

      // Update entity
      this.updateEntity(entity, input);

      // Persist
      await this.persistEntity(entity);

      // Emit event
      const event = this.createEvent(entity, changes);
      await this.emitEvent(event);

      // Record metric
      await this.recordMetric(`entity.updated`, 1);

      // Return output
      return {
        success: true,
        data: this.toOutput(entity),
      } as unknown as TOutput;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * Base class for delete use cases
 *
 * Common pattern: find entity, delete it, emit event
 */
export abstract class DeleteUseCase<
  TInput extends { id: string },
  TEntity,
  TOutput extends AppResult<{ deleted: boolean }>
> extends BaseUseCase<TInput, TOutput> {
  /**
   * Find the entity by ID
   */
  protected abstract findEntity(id: string): Promise<TEntity | null>;

  /**
   * Delete the entity
   */
  protected abstract deleteEntity(id: string): Promise<void>;

  /**
   * Create the domain event
   */
  protected abstract createEvent(entity: TEntity): unknown;

  /**
   * Execute the delete use case
   */
  async execute(input: TInput): Promise<TOutput> {
    try {
      // Find entity
      const entity = await this.findEntity(input.id);
      if (!entity) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Entity not found',
          },
        } as unknown as TOutput;
      }

      // Delete
      await this.deleteEntity(input.id);

      // Emit event
      const event = this.createEvent(entity);
      await this.emitEvent(event);

      // Record metric
      await this.recordMetric(`entity.deleted`, 1);

      // Return output
      return {
        success: true,
        data: { deleted: true },
      } as unknown as TOutput;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * Base class for get by ID use cases
 *
 * Common pattern: find entity by ID and return it
 */
export abstract class GetByIdUseCase<
  TInput extends { id: string },
  TEntity,
  TOutput extends AppResult<Record<string, unknown>>
> extends BaseUseCase<TInput, TOutput> {
  /**
   * Find the entity by ID
   */
  protected abstract findEntity(id: string): Promise<TEntity | null>;

  /**
   * Check if user has access to entity
   */
  protected abstract hasAccess(entity: TEntity, input: TInput): boolean;

  /**
   * Convert entity to output
   */
  protected abstract toOutput(entity: TEntity): TOutput extends AppResult<infer O> ? O : never;

  /**
   * Execute the get by ID use case
   */
  async execute(input: TInput): Promise<TOutput> {
    try {
      // Find entity
      const entity = await this.findEntity(input.id);
      if (!entity) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Entity not found',
          },
        } as unknown as TOutput;
      }

      // Check access
      if (!this.hasAccess(entity, input)) {
        return {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        } as unknown as TOutput;
      }

      // Return output
      return {
        success: true,
        data: this.toOutput(entity),
      } as unknown as TOutput;
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * Base class for list use cases
 *
 * Common pattern: find entities with filters and pagination
 */
export abstract class ListUseCase<
  TInput,
  TEntity,
  TOutput extends AppResult<{ items: unknown[]; total: number }>
> extends BaseUseCase<TInput, TOutput> {
  /**
   * Find entities with filters
   */
  protected abstract findEntities(input: TInput): Promise<TEntity[]>;

  /**
   * Count entities with filters
   */
  protected abstract countEntities(input: TInput): Promise<number>;

  /**
   * Convert entity to output
   */
  protected abstract toOutput(entity: TEntity): TOutput extends AppResult<infer O> ? O extends infer U ? U : never : never;

  /**
   * Execute the list use case
   */
  async execute(input: TInput): Promise<TOutput> {
    try {
      // Find entities
      const entities = await this.findEntities(input);

      // Count total
      const total = await this.countEntities(input);

      // Convert to output
      const items = entities.map(entity => this.toOutput(entity));

      // Return output
      return {
        success: true,
        data: { items, total },
      } as unknown as TOutput;
    } catch (error) {
      return this.handleError(error);
    }
  }
}
