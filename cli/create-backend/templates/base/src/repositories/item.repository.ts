/**
 * Item Repository
 *
 * Data access layer for Item entity.
 */

import { PostgresRepositoryTemplate } from '@oxlayer/snippets';
import { ItemEntity } from '../domain/item.js';

export class ItemRepository extends PostgresRepositoryTemplate<ItemEntity> {
  constructor(db: any) {
    super(db, 'items', ItemEntity);
  }
}
