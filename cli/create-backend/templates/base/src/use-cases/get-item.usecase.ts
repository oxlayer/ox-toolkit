/**
 * Get Item Use Case
 */

import { GetUseCaseTemplate } from '@oxlayer/snippets';
import { ItemEntity } from '../domain/item.js';
import { ItemRepository } from '../repositories/item.repository.js';

export class GetItemUseCase extends GetUseCaseTemplate<ItemEntity, ItemRepository> {
  constructor(repository: ItemRepository) {
    super(repository);
  }
}
