/**
 * Get Item Use Case
 *
 * This use case extends GetByIdUseCaseTemplate from @oxlayer/snippets
 * which provides the standard get by id pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { ItemRepository } from '../repositories/item.repository.js';
import { ItemTemplate } from '../domain/item.js';
import { GetByIdUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface GetItemInput {
  id: string;
}

export interface ItemOutput extends Record<string, unknown> {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Item Use Case
 *
 * Extends GetByIdUseCaseTemplate which provides:
 * - Finding entity by id
 * - Access control check
 * - Mapping to output
 * - Tracing spans
 */
export class GetItemUseCase extends GetByIdUseCaseTemplate<
  GetItemInput,
  ItemTemplate,
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
      checkAccess: (_entity, _input) => {
        // Implement access control logic if needed
        // For tenant-aware apps, you may want to check tenant ownership
        return true;
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
    return 'GetItem';
  }
}
