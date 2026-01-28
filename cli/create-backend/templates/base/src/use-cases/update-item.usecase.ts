/**
 * Update Item Use Case
 *
 * This use case extends UpdateUseCaseTemplate from @oxlayer/snippets
 * which provides the standard update pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { ItemRepository } from '../repositories/item.repository.js';
import { ItemEntity } from '../domain/item.js';
import { UpdateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface UpdateItemInput {
  name?: string;
  description?: string;
}

export interface UpdateItemParams {
  id: string;
  input: UpdateItemInput;
}

export interface ItemOutput extends Record<string, unknown> {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update Item Use Case
 *
 * Extends UpdateUseCaseTemplate which provides:
 * - Finding entity by id
 * - Updating entity
 * - Persistence
 * - Event publishing
 * - Metrics recording
 * - Tracing spans
 */
export class UpdateItemUseCase extends UpdateUseCaseTemplate<
  UpdateItemParams,
  ItemEntity,
  AppResult<ItemOutput>
> {
  constructor(
    itemRepository: ItemRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return itemRepository.findById(id);
      },
      updateEntity: (entity, { input }) => {
        entity.update(input);
      },
      persistEntity: (entity) => itemRepository.update(entity),
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
    return 'UpdateItem';
  }

  protected trackChanges(input: UpdateItemParams): Record<string, unknown> {
    const { id, ...changes } = input;
    return changes;
  }

  protected createEvent(entity: ItemEntity, changes: Record<string, unknown>): unknown {
    return {
      eventType: 'ItemUpdated',
      aggregateId: entity.id,
      changes,
    };
  }
}
