/**
 * Mock Establishment Repository
 *
 * Mock implementation of the establishment repository for testing.
 */

import type { EstablishmentRepository } from '../../repositories/establishment.repository.js';
import type { Establishment } from '../../domain/establishment.js';
import type { ListFilter } from '@oxlayer/foundation-persistence-kit';
import { Result } from '@oxlayer/foundation-domain-kit';

export class MockEstablishmentRepository implements EstablishmentRepository {
  private establishments: Map<number, Establishment> = new Map();
  private nextId = 1;

  constructor(initialData?: Establishment[]) {
    if (initialData) {
      initialData.forEach((e) => {
        this.establishments.set(e.id, e);
        if (e.id >= this.nextId) {
          this.nextId = e.id + 1;
        }
      });
    }
  }

  async create(data: Omit<Establishment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Establishment> {
    const now = new Date();
    const establishment: Establishment = {
      id: this.nextId++,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.establishments.set(establishment.id, establishment);
    return establishment;
  }

  async findById(id: number): Promise<Establishment | null> {
    return this.establishments.get(id) || null;
  }

  async findAll(filter?: ListFilter): Promise<{ items: Establishment[]; total: number }> {
    let items = Array.from(this.establishments.values());

    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      items = items.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchLower) ||
          e.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filter?.limit) {
      const offset = filter.offset || 0;
      items = items.slice(offset, offset + filter.limit);
    }

    return { items, total: this.establishments.size };
  }

  async update(id: number, data: Partial<Omit<Establishment, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Establishment | null> {
    const existing = this.establishments.get(id);
    if (!existing) {
      return null;
    }

    const updated: Establishment = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.establishments.set(id, updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.establishments.delete(id);
  }

  // Mock helper methods
  reset(): void {
    this.establishments.clear();
    this.nextId = 1;
  }

  count(): number {
    return this.establishments.size;
  }

  // Support for Result-based operations (if needed by use cases)
  createWithResult(data: Omit<Establishment, 'id' | 'createdAt' | 'updatedAt'>): Result<Establishment> {
    const now = new Date();
    const establishment: Establishment = {
      id: this.nextId++,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.establishments.set(establishment.id, establishment);
    return Result.ok(establishment);
  }
}
