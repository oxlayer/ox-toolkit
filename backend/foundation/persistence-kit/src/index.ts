// Adapters
export type {
  DatabaseAdapter,
  TransactionalDatabaseAdapter,
  ConnectionPool,
} from './adapters/database-adapter.js';

// Patterns
export {
  encodeCursor,
  decodeCursor,
  createCursorPage,
  buildCursorPaginationParams,
} from './patterns/cursor-pagination.js';
export type { CursorQueryFn } from './patterns/cursor-pagination.js';

export { withUnitOfWork } from './patterns/unit-of-work.js';
export type { UnitOfWork, UnitOfWorkFactory } from './patterns/unit-of-work.js';
