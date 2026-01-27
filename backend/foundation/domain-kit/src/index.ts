// Entities
export { Entity } from './entities/entity.js';
export { AggregateRoot } from './entities/aggregate-root.js';

// Value Objects
export { ValueObject, CompositeValueObject } from './values/value-object.js';

// Utils
export { generateId } from './utils/id.js';

// Errors
export {
  DomainError,
  EntityNotFoundError,
  BusinessRuleViolationError,
  ValidationError,
  ConflictError,
  UnauthorizedError,
} from './errors/domain-error.js';

// Events
export type { DomainEvent, EventEnvelope } from './events/domain-event.js';

// Repositories
export type { Repository, BatchRepository, ReadRepository } from './repositories/repository.js';
export type {
  CursorPage,
  OffsetPage,
  QueryOptions,
  CursorQueryOptions,
  OffsetQueryOptions,
  SortDirection,
  SortSpec,
  DateRange,
} from './repositories/query.js';
