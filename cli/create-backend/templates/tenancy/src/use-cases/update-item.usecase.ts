/**
 * Update Item Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets';
import { ItemEntity } from '../domain/item.js';
import { ItemRepository } from '../repositories/item.repository.js';
import { ItemUpdatedEvent } from '../domain/events.js';

export class UpdateItemUseCase extends UpdateUseCaseTemplate<ItemEntity, ItemRepository, ItemUpdatedEvent> {
  constructor(repository: ItemRepository) {
    super(repository);
  }

  protected createEvent(item: ItemEntity): ItemUpdatedEvent {
    return new ItemUpdatedEvent(item);
  }
}
