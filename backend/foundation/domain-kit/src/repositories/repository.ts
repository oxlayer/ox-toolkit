/**
 * Base repository interface for aggregate roots.
 *
 * Repositories provide collection-like access to aggregates.
 * They abstract away the persistence mechanism.
 *
 * @example
 * ```ts
 * interface IUserRepository extends Repository<User, UserId> {
 *   findByEmail(email: string): Promise<User | null>;
 * }
 * ```
 */
export interface Repository<T, ID> {
  /**
   * Find an entity by its ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Persist an entity (create or update)
   */
  save(entity: T): Promise<void>;

  /**
   * Delete an entity by its ID
   */
  delete(id: ID): Promise<void>;

  /**
   * Check if an entity exists
   */
  exists(id: ID): Promise<boolean>;
}

/**
 * Repository with batch operations
 */
export interface BatchRepository<T, ID> extends Repository<T, ID> {
  /**
   * Find multiple entities by their IDs
   */
  findByIds(ids: ID[]): Promise<T[]>;

  /**
   * Persist multiple entities
   */
  saveMany(entities: T[]): Promise<void>;

  /**
   * Delete multiple entities by their IDs
   */
  deleteMany(ids: ID[]): Promise<void>;
}

/**
 * Read-only repository for query-heavy operations
 */
export interface ReadRepository<T, ID> {
  /**
   * Find an entity by its ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Check if an entity exists
   */
  exists(id: ID): Promise<boolean>;
}

/**
 * Query Service for read projections and read models.
 *
 * This is the CQRS "Q" side - optimized for reading, separate from write model.
 *
 * Use QueryService when:
 * - You need complex queries across aggregates
 * - You want to return read models (DTOs) different from domain entities
 * - You need read-optimized data structures (denormalized, flattened)
 * - You're querying from projections/views, not the write database
 *
 * ⚠️ PHILOSOPHICAL NOTE: Repository vs QueryService
 *
 * Repository<T, ID>:
 * - For aggregates only (the write model)
 * - Returns full domain entities with behavior
 * - Simple CRUD + findByX operations
 * - Enforces aggregate boundaries
 *
 * QueryService<TProjection>:
 * - For projections and read models (the read model)
 * - Returns DTOs, read models, or primitive types
 * - Complex queries, joins, aggregations
 * - No domain behavior, just data
 *
 * @example
 * ```ts
 * // ✅ Repository - write model, returns aggregate
 * interface OrderRepository extends Repository<Order, OrderId> {
 *   findByCustomer(customerId: CustomerId): Promise<Order[]>;
 * }
 *
 * // ✅ QueryService - read model, returns DTO
 * interface OrderQueryService {
 *   // Returns read-optimized DTO, not domain entity
 *   getOrderSummary(orderId: string): Promise<OrderSummaryDto>;
 *
 *   // Complex query across aggregates
 *   findPendingOrders(limit: number): Promise<OrderListItemDto[]>;
 *
 *   // Aggregated data
 *   getCustomerOrderStats(customerId: string): Promise<OrderStats>;
 * }
 * ```
 */
export interface QueryService<TProjection = unknown> {
  /**
   * Query for a single result
   *
   * @param criteria - Query criteria specific to the use case
   * @returns The projection or null if not found
   */
  queryOne<TCriteria = unknown>(
    criteria: TCriteria
  ): Promise<TProjection | null>;

  /**
   * Query for multiple results
   *
   * @param criteria - Query criteria specific to the use case
   * @returns Array of projections
   */
  queryMany<TCriteria = unknown>(
    criteria: TCriteria
  ): Promise<TProjection[]>;

  /**
   * Check if any result exists for the given criteria
   *
   * @param criteria - Query criteria specific to the use case
   */
  exists<TCriteria = unknown>(criteria: TCriteria): Promise<boolean>;
}
