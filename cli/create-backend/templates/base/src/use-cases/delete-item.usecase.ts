/**
 * Delete Item Use Case
 *
 * This use case extends DeleteUseCaseTemplate from @oxlayer/snippets
 * which provides the standard delete pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { ItemRepository } from '../repositories/item.repository.js';
import { ItemEntity } from '../domain/item.js';
import { DeleteUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface DeleteItemInput {
  id: string;
}

/**
 * Delete Item Use Case
 *
 * Extends DeleteUseCaseTemplate which provides:
 * - Finding entity by id
 * - Deleting entity
 * - Event publishing
 * - Metrics recording
 * - Tracing spans
 */
export class DeleteItemUseCase extends DeleteUseCaseTemplate<
  DeleteItemInput,
  ItemEntity,
  AppResult<{ deleted: boolean }>
> {
  constructor(
    itemRepository: ItemRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return itemRepository.findById(id);
      },
      deleteEntity: (id) => itemRepository.delete(id),
      publishEvent: async (event) => {
        // Publish domain event if needed
        // await itemRepository.publishEvent(event);
      },
      recordMetric: async (name, value) => {
        // Record metric if needed
        // await metricsService.record(name, value);
      },
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'DeleteItem';
  }

  protected createEvent(entity: ItemEntity): unknown {
    return {
      eventType: 'ItemDeleted',
      aggregateId: entity.id,
    };
  }
}
