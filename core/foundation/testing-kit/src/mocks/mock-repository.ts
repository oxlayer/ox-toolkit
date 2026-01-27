import type { Repository, CursorPage } from '@oxlayer/foundation-domain-kit';

/**
 * In-memory mock repository for testing.
 *
 * Provides a simple implementation of the Repository interface that stores
 * entities in memory. Useful for unit testing use cases without hitting a database.
 *
 * @example
 * ```ts
 * class MockUserRepository extends InMemoryRepository<User, string> {
 *   protected getId(entity: User): string {
 *     return entity.id;
 *   }
 *
 *   async findByEmail(email: string): Promise<User | null> {
 *     return this.findOne((user) => user.email === email);
 *   }
 * }
 *
 * // In tests:
 * const userRepo = new MockUserRepository();
 * userRepo.seed([user1, user2]);
 * ```
 */
export abstract class InMemoryRepository<T, ID> implements Repository<T, ID> {
  protected entities: Map<ID, T> = new Map();

  /**
   * Extract the ID from an entity
   */
  protected abstract getId(entity: T): ID;

  async findById(id: ID): Promise<T | null> {
    return this.entities.get(id) ?? null;
  }

  async save(entity: T): Promise<void> {
    const id = this.getId(entity);
    this.entities.set(id, entity);
  }

  async delete(id: ID): Promise<void> {
    this.entities.delete(id);
  }

  async exists(id: ID): Promise<boolean> {
    return this.entities.has(id);
  }

  /**
   * Seed the repository with initial data
   */
  seed(entities: T[]): void {
    for (const entity of entities) {
      this.entities.set(this.getId(entity), entity);
    }
  }

  /**
   * Clear all entities from the repository
   */
  clear(): void {
    this.entities.clear();
  }

  /**
   * Get all entities (useful for assertions)
   */
  getAll(): T[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get the count of entities
   */
  count(): number {
    return this.entities.size;
  }

  /**
   * Find a single entity matching a predicate
   */
  protected findOne(predicate: (entity: T) => boolean): T | null {
    for (const entity of this.entities.values()) {
      if (predicate(entity)) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Find all entities matching a predicate
   */
  protected findMany(predicate: (entity: T) => boolean): T[] {
    const results: T[] = [];
    for (const entity of this.entities.values()) {
      if (predicate(entity)) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Create a cursor page from filtered results
   */
  protected paginate(
    items: T[],
    limit: number,
    cursor?: string
  ): CursorPage<T> {
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = items.findIndex(
        (item) => String(this.getId(item)) === cursor
      );
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    const pageItems = items.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < items.length;
    const lastItem = pageItems[pageItems.length - 1];
    const nextCursor = hasMore && lastItem ? String(this.getId(lastItem)) : undefined;

    return {
      items: pageItems,
      nextCursor,
    };
  }
}
