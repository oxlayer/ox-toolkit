/**
 * Item Builder
 *
 * Fluent builder for creating test Item data.
 */

import type { Item } from '../../domain/item.js';

type ItemData = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>;

export class ItemBuilder {
  private data: Partial<ItemData> = {
    name: 'Test Item',
    description: 'A test item',
  };

  withId(id: number): this {
    this.data.id = id;
    return this;
  }

  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  build(): Item {
    const now = new Date();
    return {
      id: this.data.id || 1,
      ...this.data,
      createdAt: now,
      updatedAt: now,
    } as Item;
  }

  buildCreateInput(): Omit<ItemData, 'id' | 'createdAt' | 'updatedAt'> & { name: string } {
    return {
      name: this.data.name!,
      description: this.data.description,
    };
  }
}
