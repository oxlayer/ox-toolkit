/**
 * Delete Item Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets';
import { ItemEntity } from '../domain/item.js';
import { ItemRepository } from '../repositories/item.repository.js';
import { ItemDeletedEvent } from '../domain/events.js';

export class DeleteItemUseCase extends DeleteUseCaseTemplate<ItemEntity, ItemRepository, ItemDeletedEvent> {
  constructor(repository: ItemRepository) {
    super(repository);
  }

  protected createEvent(itemId: number): ItemDeletedEvent {
    return new ItemDeletedEvent(itemId);
  }
}
