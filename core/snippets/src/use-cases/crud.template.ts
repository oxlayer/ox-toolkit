/**
 * CRUD Use Case Templates
 *
 * Complete template implementations for common CRUD operations.
 * These templates are ready to use with minimal customization.
 *
 * @example
 * ```typescript
 * import { CreateUseCaseTemplate, UpdateUseCaseTemplate, DeleteUseCaseTemplate, GetByIdUseCaseTemplate, ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
 *
 * export class CreateTodoUseCase extends CreateUseCaseTemplate<CreateTodoInput, Todo, TodoOutput> {
 *   // Implement abstract methods
 * }
 * ```
 */


import { withUseCaseSpan } from '@oxlayer/capabilities-telemetry';
import type { AppResult } from './base.template.js';

/**
 * Template for Create use case with tracing
 *
 * Implements the standard create pattern:
 * 1. Generate ID
 * 2. Create entity
 * 3. Persist to database
 * 4. Publish domain event
 * 5. Record metric
 * 6. Return output
 */
export abstract class CreateUseCaseTemplate<
  TInput,
  TEntity,
  TOutput extends AppResult<Record<string, unknown>>
> {
  constructor(
    protected readonly dependencies: {
      generateId: () => string;
      createEntity: (data: TInput & { id: string }) => TEntity;
      persistEntity: (entity: TEntity) => Promise<void>;
      publishEvent: (event: unknown) => Promise<void>;
      recordMetric: (name: string, value: number) => Promise<void>;
      toOutput: (entity: TEntity) => TOutput extends AppResult<infer O> ? O : never;
      tracer?: unknown | null;
    }
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    return withUseCaseSpan(
      this.dependencies.tracer as any || null,
      this.getUseCaseName(),
      async (span) => {
        this.setSpanAttributes(span, input);

        // 1. Generate ID
        const id = this.dependencies.generateId();
        span?.setAttribute('entity.id', id);

        // 2. Create entity
        const entity = this.dependencies.createEntity({ ...input, id } as TInput & { id: string });

        // 3. Persist
        await this.dependencies.persistEntity(entity);
        span?.setAttribute('entity.persisted', true);

        // 4. Publish event
        const event = this.createEvent(entity, id);
        await this.dependencies.publishEvent(event);
        span?.setAttribute('event.published', true);

        // 5. Record metric
        await this.dependencies.recordMetric(this.getMetricName('created'), 1);

        // 6. Return output
        const output = this.dependencies.toOutput(entity);
        span?.setAttribute('result.success', true);

        return {
          success: true,
          data: output,
        } as unknown as TOutput;
      }
    );
  }

  /**
   * Override to customize the use case name for tracing
   */
  protected getUseCaseName(): string {
    return 'CreateEntity';
  }

  /**
   * Override to set custom span attributes
   */
  protected setSpanAttributes(_span: any, _input: TInput): void {
    // Override to add custom attributes
  }

  /**
   * Override to customize the event creation
   */
  protected createEvent(entity: TEntity, id: string): unknown {
    return {
      eventType: `${this.getUseCaseName()}Completed`,
      aggregateId: id,
      entity,
    };
  }

  /**
   * Override to customize the metric name
   */
  protected getMetricName(action: string): string {
    return `entity.${action}`;
  }
}

/**
 * Template for Get By ID use case with tracing
 */
export abstract class GetByIdUseCaseTemplate<
  TInput extends { id: string },
  TEntity,
  TOutput extends AppResult<Record<string, unknown>>
> {
  constructor(
    protected readonly dependencies: {
      findEntity: (id: string) => Promise<TEntity | null>;
      checkAccess: (entity: TEntity, input: TInput) => boolean;
      toOutput: (entity: TEntity) => TOutput extends AppResult<infer O> ? O : never;
      tracer?: unknown | null;
    }
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    return withUseCaseSpan(
      this.dependencies.tracer as any || null,
      this.getUseCaseName(),
      async (span) => {
        span?.setAttribute('entity.id', input.id);

        // Find entity
        const entity = await this.dependencies.findEntity(input.id);
        if (!entity) {
          span?.setAttribute('entity.found', false);
          return this.notFoundError(input.id) as TOutput;
        }

        span?.setAttribute('entity.found', true);

        // Check access
        if (!this.dependencies.checkAccess(entity, input)) {
          span?.setAttribute('access.denied', true);
          return this.accessDeniedError() as TOutput;
        }

        span?.setAttribute('access.granted', true);

        // Return output
        const output = this.dependencies.toOutput(entity);
        return {
          success: true,
          data: output,
        } as unknown as TOutput;
      }
    );
  }

  protected getUseCaseName(): string {
    return 'GetById';
  }

  protected notFoundError(id: string): AppResult<never> {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Entity with ID ${id} not found`,
      },
    };
  }

  protected accessDeniedError(): AppResult<never> {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
      },
    };
  }
}

/**
 * Template for Update use case with tracing
 */
export abstract class UpdateUseCaseTemplate<
  TInput extends { id: string },
  TEntity,
  TOutput extends AppResult<Record<string, unknown>>
> {
  constructor(
    protected readonly dependencies: {
      findEntity: (id: string) => Promise<TEntity | null>;
      updateEntity: (entity: TEntity, input: TInput) => void;
      persistEntity: (entity: TEntity) => Promise<void>;
      publishEvent: (event: unknown) => Promise<void>;
      recordMetric: (name: string, value: number) => Promise<void>;
      toOutput: (entity: TEntity) => TOutput extends AppResult<infer O> ? O : never;
      tracer?: unknown | null;
    }
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    return withUseCaseSpan(
      this.dependencies.tracer as any || null,
      this.getUseCaseName(),
      async (span) => {
        span?.setAttribute('entity.id', input.id);

        // Find entity
        const entity = await this.dependencies.findEntity(input.id);
        if (!entity) {
          span?.setAttribute('entity.found', false);
          return this.notFoundError(input.id) as TOutput;
        }

        span?.setAttribute('entity.found', true);

        // Track changes
        const changes = this.trackChanges(input);

        // Update entity
        this.dependencies.updateEntity(entity, input);
        span?.setAttribute('entity.updated', true);

        // Persist
        await this.dependencies.persistEntity(entity);

        // Publish event
        await this.dependencies.publishEvent(this.createEvent(entity, changes));

        // Record metric
        await this.dependencies.recordMetric('entity.updated', 1);

        // Return output
        const output = this.dependencies.toOutput(entity);
        return {
          success: true,
          data: output,
        } as unknown as TOutput;
      }
    );
  }

  protected getUseCaseName(): string {
    return 'UpdateEntity';
  }

  protected trackChanges(input: TInput): Record<string, unknown> {
    const { id, ...changes } = input as any;
    return changes;
  }

  protected createEvent(entity: TEntity, changes: Record<string, unknown>): unknown {
    return {
      eventType: 'EntityUpdated',
      aggregateId: (entity as any).id,
      changes,
    };
  }

  protected notFoundError(id: string): AppResult<never> {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Entity with ID ${id} not found`,
      },
    };
  }
}

/**
 * Template for Delete use case with tracing
 */
export abstract class DeleteUseCaseTemplate<
  TInput extends { id: string },
  TEntity,
  TOutput extends AppResult<{ deleted: boolean }>
> {
  constructor(
    protected readonly dependencies: {
      findEntity: (id: string) => Promise<TEntity | null>;
      deleteEntity: (id: string) => Promise<void>;
      publishEvent: (event: unknown) => Promise<void>;
      recordMetric: (name: string, value: number) => Promise<void>;
      tracer?: unknown | null;
    }
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    return withUseCaseSpan(
      this.dependencies.tracer as any || null,
      this.getUseCaseName(),
      async (span) => {
        span?.setAttribute('entity.id', input.id);

        // Find entity
        const entity = await this.dependencies.findEntity(input.id);
        if (!entity) {
          span?.setAttribute('entity.found', false);
          return this.notFoundError(input.id) as TOutput;
        }

        span?.setAttribute('entity.found', true);

        // Delete
        await this.dependencies.deleteEntity(input.id);
        span?.setAttribute('entity.deleted', true);

        // Publish event
        await this.dependencies.publishEvent(this.createEvent(entity));

        // Record metric
        await this.dependencies.recordMetric('entity.deleted', 1);

        return {
          success: true,
          data: { deleted: true },
        } as unknown as TOutput;
      }
    );
  }

  protected getUseCaseName(): string {
    return 'DeleteEntity';
  }

  protected createEvent(entity: TEntity): unknown {
    return {
      eventType: 'EntityDeleted',
      aggregateId: (entity as any).id,
    };
  }

  protected notFoundError(id: string): AppResult<never> {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Entity with ID ${id} not found`,
      },
    };
  }
}

/**
 * Template for List use case with tracing
 */
export abstract class ListUseCaseTemplate<
  TInput,
  TEntity,
  TOutput extends AppResult<{ items: unknown[]; total: number }>
> {
  constructor(
    protected readonly dependencies: {
      findEntities: (input: TInput) => Promise<TEntity[]>;
      countEntities: (input: TInput) => Promise<number>;
      toOutput: (entity: TEntity) => TOutput extends AppResult<infer O> ? O extends infer U ? U : never : never;
      tracer?: unknown | null;
    }
  ) {}

  async execute(input: TInput): Promise<TOutput> {
    return withUseCaseSpan(
      this.dependencies.tracer as any || null,
      this.getUseCaseName(),
      async (span) => {
        this.setSpanAttributes(span, input);

        // Find entities
        const entities = await this.dependencies.findEntities(input);
        span?.setAttribute('entities.count', entities.length);

        // Count total
        const total = await this.dependencies.countEntities(input);
        span?.setAttribute('entities.total', total);

        // Convert to output
        const items = entities.map(entity => this.dependencies.toOutput(entity));

        return {
          success: true,
          data: { items, total },
        } as unknown as TOutput;
      }
    );
  }

  protected getUseCaseName(): string {
    return 'ListEntities';
  }

  protected setSpanAttributes(_span: any, _input: TInput): void {
    // Override to add custom attributes
  }
}
