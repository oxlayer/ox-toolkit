/**
 * Create Item Use Case
 *
 * This use case extends CreateUseCaseTemplate from @oxlayer/snippets
 * which provides the standard create pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { ItemRepository } from '../repositories/item.repository.js';
import { ItemEntity } from '../domain/item.js';
import { CreateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface CreateItemInput {
  name: string;
  description?: string;
}

export interface ItemOutput extends Record<string, unknown> {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Item Use Case
 *
 * Extends CreateUseCaseTemplate which provides:
 * - ID generation
 * - Entity creation
 * - Persistence
 * - Event publishing
 * - Metrics recording
 * - Tracing spans
 */
export class CreateItemUseCase extends CreateUseCaseTemplate<
  CreateItemInput,
  ItemEntity,
  AppResult<ItemOutput>
> {
  constructor(
    itemRepository: ItemRepository,
    tracer?: unknown | null
  ) {
    super({
      generateId: () => crypto.randomUUID(),
      createEntity: (data) => new ItemEntity(data),
      persistEntity: (entity) => itemRepository.create(entity),
      publishEvent: async (event) => {
        // Publish domain event if needed
        // await itemRepository.publishEvent(event);
      },
      recordMetric: async (name, value) => {
        // Record metric if needed
        // await metricsService.record(name, value);
      },
      toOutput: (entity) => {
        const response = entity.toResponse();
        return {
          id: response.id,
          name: response.name,
          description: response.description,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        };
      },
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'CreateItem';
  }

  protected setSpanAttributes(_span: any, input: CreateItemInput): void {
    // Add custom span attributes if needed
  }

  protected createEvent(entity: ItemEntity, id: string): unknown {
    return {
      eventType: 'ItemCreated',
      aggregateId: id,
      entity,
    };
  }

  protected getMetricName(action: string): string {
    return `item.${action}`;
  }
}
