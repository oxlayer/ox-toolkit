/**
 * Domain Events
 */

import { DomainEventTemplate } from '@oxlayer/snippets';
import { ItemEntity } from './item.js';

export class ItemCreatedEvent extends DomainEventTemplate {
  readonly entity: ItemEntity;

  constructor(item: ItemEntity) {
    super({
      eventName: 'Item.Created',
      entityType: 'Item',
      entityId: String(item.id),
    });
    this.entity = item;
  }
}

export class ItemUpdatedEvent extends DomainEventTemplate {
  readonly entity: ItemEntity;

  constructor(item: ItemEntity) {
    super({
      eventName: 'Item.Updated',
      entityType: 'Item',
      entityId: String(item.id),
    });
    this.entity = item;
  }
}

export class ItemDeletedEvent extends DomainEventTemplate {
  readonly itemId: number;

  constructor(itemId: number) {
    super({
      eventName: 'Item.Deleted',
      entityType: 'Item',
      entityId: String(itemId),
    });
    this.itemId = itemId;
  }
}
