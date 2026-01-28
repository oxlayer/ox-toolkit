/**
 * Create Item Use Case
 */

import { CreateUseCaseTemplate } from '@oxlayer/snippets';
import { ItemEntity } from '../domain/item.js';
import { ItemRepository } from '../repositories/item.repository.js';
import { ItemCreatedEvent } from '../domain/events.js';

export class CreateItemUseCase extends CreateUseCaseTemplate<ItemEntity, ItemRepository, ItemCreatedEvent> {
  constructor(repository: ItemRepository) {
    super(repository);
  }

  protected createEvent(item: ItemEntity): ItemCreatedEvent {
    return new ItemCreatedEvent(item);
  }
}
