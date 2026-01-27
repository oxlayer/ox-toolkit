/**
 * Scheduler domain errors
 */

/**
 * Base error for scheduler operations
 */
export class SchedulerError extends Error {
  constructor(message: string) {
    super(`[Scheduler] ${message}`);
    this.name = 'SchedulerError';
  }
}

/**
 * Error thrown when a scheduler is not found
 */
export class SchedulerNotFoundError extends SchedulerError {
  constructor(key: string) {
    super(`Scheduler '${key}' not found`);
    this.name = 'SchedulerNotFoundError';
  }
}

/**
 * Error thrown when scheduler validation fails
 */
export class SchedulerValidationError extends SchedulerError {
  constructor(message: string) {
    super(`Validation failed: ${message}`);
    this.name = 'SchedulerValidationError';
  }
}

/**
 * Error thrown when repeat options are invalid
 */
export class InvalidRepeatOptionsError extends SchedulerValidationError {
  constructor(message: string) {
    super(`Invalid repeat options: ${message}`);
    this.name = 'InvalidRepeatOptionsError';
  }
}

/**
 * Error thrown when cron expression is invalid
 */
export class InvalidCronExpressionError extends SchedulerValidationError {
  constructor(pattern: string, cause?: Error) {
    super(`Invalid cron expression '${pattern}'${cause ? `: ${cause.message}` : ''}`);
    this.name = 'InvalidCronExpressionError';
    this.cause = cause;
  }
}
