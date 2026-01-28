/**
 * List Items Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets';
import { ItemEntity } from '../domain/item.js';
import { ItemRepository } from '../repositories/item.repository.js';

export class ListItemsUseCase extends ListUseCaseTemplate<ItemEntity, ItemRepository> {
  constructor(repository: ItemRepository) {
    super(repository);
  }
}
