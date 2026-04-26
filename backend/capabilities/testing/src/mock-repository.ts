/**
 * Generic Mock Repository
 *
 * A generic in-memory repository implementation for testing without database.
 * Supports CRUD operations, filtering, and test utilities like seed/clear.
 *
 * @example
 * ```typescript
 * import { MockRepository } from '@oxlayer/capabilities-testing/mock-repository';
 *
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 *
 * const userRepo = new MockRepository<User, string>({
 *   getId: (user) => user.id,
 *   filter: (user, filters) => {
 *     if (filters.name && !user.name.includes(filters.name)) return false;
 *     return true;
 *   }
 * });
 *
 * // Seed with test data
 * userRepo.seed([
 *   { id: '1', name: 'Alice', email: 'alice@example.com' },
 *   { id: '2', name: 'Bob', email: 'bob@example.com' }
 * ]);
 *
 * // Find all
 * const users = await userRepo.findAll();
 *
 * // Find by ID
 * const user = await userRepo.findById('1');
 *
 * // Filter
 * const filtered = await userRepo.findAll({ name: 'Alice' });
 *
 * // Create
 * await userRepo.create({ id: '3', name: 'Charlie', email: 'charlie@example.com' });
 *
 * // Update
 * await userRepo.update({ id: '1', name: 'Alice Updated', email: 'alice@example.com' });
 *
 * // Delete
 * await userRepo.delete('1');
 *
 * // Count
 * const count = await userRepo.count({ name: 'Alice' });
 *
 * // Clear all
 * userRepo.clear();
 * ```
 */

export interface MockRepositoryOptions<T, ID, F = Record<string, unknown>> {
  /**
   * Extract the ID from an entity
   */
  getId: (entity: T) => ID;

  /**
   * Optional filter function for findAll
   * Returns true if the entity matches the filter
   */
  filter?: (entity: T, filters: F) => boolean;

  /**
   * Optional search function for text search
   * Returns true if the entity matches the search query
   */
  search?: (entity: T, query: string) => boolean;
}

export interface MockRepositoryFilters<_F = Record<string, unknown>> {
  status?: string;
  userId?: string;
  search?: string;
  [key: string]: unknown;
}

/**
 * Generic Mock Repository for testing
 *
 * Provides an in-memory implementation of a repository with full CRUD operations.
 * Perfect for unit tests and integration tests that don't need a real database.
 *
 * @template T - The entity type
 * @template ID - The ID type (usually string or number)
 * @template F - The filters type (defaults to MockRepositoryFilters)
 */
export class MockRepository<T, ID, F extends MockRepositoryFilters = MockRepositoryFilters> {
  protected items: Map<ID, T> = new Map();
  private readonly getIdFn: (entity: T) => ID;
  private readonly filterFn?: (entity: T, filters: F) => boolean;
  private readonly searchFn?: (entity: T, query: string) => boolean;

  constructor(options: MockRepositoryOptions<T, ID, F>) {
    this.getIdFn = options.getId;
    this.filterFn = options.filter;
    this.searchFn = options.search;
  }

  /**
   * Seed the repository with initial data
   *
   * Useful for setting up test fixtures.
   *
   * @param data - Array of entities to seed
   *
   * @example
   * ```typescript
   * repository.seed([
   *   { id: '1', name: 'Alice' },
   *   { id: '2', name: 'Bob' }
   * ]);
   * ```
   */
  seed(data: T[]): void {
    for (const item of data) {
      this.items.set(this.getIdFn(item), item);
    }
  }

  /**
   * Clear all items from the repository
   *
   * Call this in test setup/teardown to ensure test isolation.
   *
   * @example
   * ```typescript
   * beforeEach(() => {
   *   repository.clear();
   * });
   * ```
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Find an entity by ID
   *
   * @param id - The ID of the entity to find
   * @returns The entity if found, null otherwise
   *
   * @example
   * ```typescript
   * const user = await repository.findById('user-1');
   * if (user) {
   *   console.log(user.name);
   * }
   * ```
   */
  async findById(id: ID): Promise<T | null> {
    return this.items.get(id) ?? null;
  }

  /**
   * Find all entities, optionally filtered
   *
   * @param filters - Optional filters to apply
   * @returns Array of matching entities
   *
   * @example
   * ```typescript
   * // Get all
   * const all = await repository.findAll();
   *
   * // Get with filters
   * const active = await repository.findAll({ status: 'active' });
   *
   * // Search
   * const results = await repository.findAll({ search: 'Alice' });
   * ```
   */
  async findAll(filters?: F): Promise<T[]> {
    let items = Array.from(this.items.values());

    // Apply custom filter if provided
    if (this.filterFn && filters) {
      items = items.filter(item => this.filterFn!(item, filters as F));
    }

    // Apply search if query provided and search function available
    if (filters?.search && this.searchFn) {
      const query = String(filters.search).toLowerCase();
      items = items.filter(item => this.searchFn!(item, query));
    }

    return items;
  }

  /**
   * Create a new entity
   *
   * @param entity - The entity to create
   *
   * @example
   * ```typescript
   * await repository.create({
   *   id: 'user-3',
   *   name: 'Charlie',
   *   email: 'charlie@example.com'
   * });
   * ```
   */
  async create(entity: T): Promise<void> {
    const id = this.getIdFn(entity);
    this.items.set(id, entity);
  }

  /**
   * Update an existing entity
   *
   * If the entity doesn't exist, it will be created (upsert behavior).
   *
   * @param entity - The entity to update
   *
   * @example
   * ```typescript
   * await repository.update({
   *   id: 'user-1',
   *   name: 'Alice Updated',
   *   email: 'alice@example.com'
   * });
   * ```
   */
  async update(entity: T): Promise<void> {
    const id = this.getIdFn(entity);
    this.items.set(id, entity);
  }

  /**
   * Delete an entity by ID
   *
   * @param id - The ID of the entity to delete
   *
   * @example
   * ```typescript
   * await repository.delete('user-1');
   * ```
   */
  async delete(id: ID): Promise<void> {
    this.items.delete(id);
  }

  /**
   * Count entities, optionally filtered
   *
   * @param filters - Optional filters to apply
   * @returns The count of matching entities
   *
   * @example
   * ```typescript
   * const total = await repository.count();
   * const activeCount = await repository.count({ status: 'active' });
   * ```
   */
  async count(filters?: F): Promise<number> {
    const items = await this.findAll(filters);
    return items.length;
  }

  /**
   * Check if an entity exists by ID
   *
   * @param id - The ID to check
   * @returns true if the entity exists
   *
   * @example
   * ```typescript
   * const exists = await repository.exists('user-1');
   * ```
   */
  async exists(id: ID): Promise<boolean> {
    return this.items.has(id);
  }

  /**
   * Get all IDs in the repository
   *
   * @returns Array of all IDs
   *
   * @example
   * ```typescript
   * const ids = await repository.ids();
   * // ['user-1', 'user-2', 'user-3']
   * ```
   */
  async ids(): Promise<ID[]> {
    return Array.from(this.items.keys());
  }

  /**
   * Get the total number of entities
   *
   * @returns The total count
   *
   * @example
   * ```typescript
   * const total = await repository.size();
   * ```
   */
  async size(): Promise<number> {
    return this.items.size;
  }
}

/**
 * Create a new MockRepository instance
 *
 * Convenience function for creating a mock repository.
 *
 * @example
 * ```typescript
 * import { createMockRepository } from '@oxlayer/capabilities-testing/mock-repository';
 *
 * const repository = createMockRepository<User, string>({
 *   getId: (user) => user.id,
 *   filter: (user, filters) => {
 *     if (filters.status && user.status !== filters.status) return false;
 *     return true;
 *   }
 * });
 * ```
 */
export function createMockRepository<T, ID, F extends MockRepositoryFilters = MockRepositoryFilters>(
  options: MockRepositoryOptions<T, ID, F>
): MockRepository<T, ID, F> {
  return new MockRepository<T, ID, F>(options);
}
