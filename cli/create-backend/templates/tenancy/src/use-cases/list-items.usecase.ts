/**
 * List Items Use Case
 *
 * This use case extends ListUseCaseTemplate from @oxlayer/snippets
 * which provides the standard list pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { ItemRepository } from '../repositories/item.repository.js';
import { ItemTemplate } from '../domain/item.js';
import { ListUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface ListItemFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ItemOutput extends Record<string, unknown> {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * List Items Use Case
 *
 * Extends ListUseCaseTemplate which provides:
 * - Finding entities with filters
 * - Counting entities
 * - Mapping to output
 * - Tracing spans
 */
export class ListItemsUseCase extends ListUseCaseTemplate<
  ListItemFilters,
  ItemTemplate,
  AppResult<{ items: ItemOutput[]; total: number }>
> {
  constructor(
    private itemRepository: ItemRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (filters) => {
        return itemRepository.findAll(filters);
      },
      countEntities: async (filters) => {
        return itemRepository.count(filters);
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
    return 'ListItems';
  }

  protected setSpanAttributes(_span: any, _input: ListItemFilters): void {
    // Add custom span attributes if needed
  }
}
