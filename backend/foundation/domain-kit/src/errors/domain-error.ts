/**
 * Base class for all domain errors.
 *
 * Domain errors represent business rule violations or invalid states.
 * They should be specific and meaningful to the domain, not technical errors.
 *
 * @example
 * ```ts
 * class InsufficientFundsError extends DomainError {
 *   constructor(accountId: string, requested: number, available: number) {
 *     super(
 *       'INSUFFICIENT_FUNDS',
 *       `Account ${accountId} has insufficient funds. Requested: ${requested}, Available: ${available}`
 *     );
 *   }
 * }
 * ```
 */
export abstract class DomainError extends Error {
  public readonly timestamp: string;

  protected constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when an entity is not found
 */
export class EntityNotFoundError extends DomainError {
  constructor(entityType: string, id: string) {
    super('ENTITY_NOT_FOUND', `${entityType} with id '${id}' was not found`);
  }
}

/**
 * Error thrown when a business rule is violated
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string, details?: string) {
    super(
      'BUSINESS_RULE_VIOLATION',
      details ? `${rule}: ${details}` : rule
    );
  }
}

/**
 * Error thrown when domain invariant validation fails.
 *
 * ⚠️ IMPORTANT: This is for DOMAIN validation only.
 *
 * Use ValidationError for:
 * - Domain invariant violations (e.g., email format in Email value object)
 * - Business rule validation within entities/aggregates
 * - Domain-level constraints
 *
 * DO NOT use for:
 * - HTTP request validation (use HTTP framework validation instead)
 * - Input sanitization (handle before entering domain)
 * - Transport-level errors (use appropriate HTTP status codes)
 *
 * @example
 * ```ts
 * // ✅ Correct - domain invariant validation
 * class Email extends ValueObject<string> {
 *   static create(value: string): Email {
 *     if (!value.includes('@')) {
 *       throw new ValidationError('value', 'Email must contain @ symbol');
 *     }
 *     return new Email(value);
 *   }
 * }
 *
 * // ❌ Wrong - HTTP layer validation belongs in controllers/handlers
 * // Use your HTTP framework's validation (zod, class-validator, etc.) instead
 * ```
 */
export class ValidationError extends DomainError {
  constructor(
    public readonly field: string,
    message: string
  ) {
    super('VALIDATION_ERROR', `Validation failed for '${field}': ${message}`);
  }
}

/**
 * Error thrown when an operation conflicts with current state
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super('CONFLICT', message);
  }
}

/**
 * Error thrown when an operation is not authorized
 */
export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Operation not authorized') {
    super('UNAUTHORIZED', message);
  }
}
