/**
 * Mock Item Repository
 *
 * Mock implementation of the item repository for testing.
 */

import type { ItemRepository } from '../../repositories/item.repository.js';
import type { Item } from '../../domain/item.js';
import type { ListFilter } from '@oxlayer/foundation-persistence-kit';
import { Result } from '@oxlayer/foundation-domain-kit';

export class MockItemRepository implements ItemRepository {
  private items: Map<number, Item> = new Map();
  private nextId = 1;

  constructor(initialData?: Item[]) {
    if (initialData) {
      initialData.forEach((item) => {
        this.items.set(item.id, item);
        if (item.id >= this.nextId) {
          this.nextId = item.id + 1;
        }
      });
    }
  }

  async create(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>): Promise<Item> {
    const now = new Date();
    const item: Item = {
      id: this.nextId++,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, item);
    return item;
  }

  async findById(id: number): Promise<Item | null> {
    return this.items.get(id) || null;
  }

  async findAll(filter?: ListFilter): Promise<{ items: Item[]; total: number }> {
    let items = Array.from(this.items.values());

    if (filter?.limit) {
      const offset = filter.offset || 0;
      items = items.slice(offset, offset + filter.limit);
    }

    return { items, total: this.items.size };
  }

  async update(id: number, data: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Item | null> {
    const existing = this.items.get(id);
    if (!existing) return null;

    const updated: Item = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  reset(): void {
    this.items.clear();
    this.nextId = 1;
  }

  count(): number {
    return this.items.size;
  }
}
