/**
 * Unit of Work pattern for coordinating multiple repository operations
 * within a single transaction.
 *
 * @example
 * ```ts
 * class OrderUnitOfWork implements UnitOfWork {
 *   constructor(
 *     private orderRepo: IOrderRepository,
 *     private inventoryRepo: IInventoryRepository,
 *     private db: TransactionalDatabaseAdapter
 *   ) {}
 *
 *   async commit(): Promise<void> {
 *     await this.db.commit();
 *   }
 *
 *   async rollback(): Promise<void> {
 *     await this.db.rollback();
 *   }
 * }
 * ```
 */
export interface UnitOfWork {
  /**
   * Commit all changes made within this unit of work
   */
  commit(): Promise<void>;

  /**
   * Rollback all changes made within this unit of work
   */
  rollback(): Promise<void>;
}

/**
 * Unit of Work factory for creating scoped transactions
 */
export interface UnitOfWorkFactory<T extends UnitOfWork = UnitOfWork> {
  /**
   * Create a new unit of work
   */
  create(): Promise<T>;
}

/**
 * Execute a function within a unit of work, automatically committing on success
 * or rolling back on failure.
 *
 * @example
 * ```ts
 * await withUnitOfWork(uowFactory, async (uow) => {
 *   await uow.orderRepo.save(order);
 *   await uow.inventoryRepo.decreaseStock(productId, quantity);
 * });
 * ```
 */
export async function withUnitOfWork<T extends UnitOfWork, R>(
  factory: UnitOfWorkFactory<T>,
  fn: (uow: T) => Promise<R>
): Promise<R> {
  const uow = await factory.create();
  try {
    const result = await fn(uow);
    await uow.commit();
    return result;
  } catch (error) {
    await uow.rollback();
    throw error;
  }
}
