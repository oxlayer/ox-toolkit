/**
 * Value Objects Template
 *
 * A template for creating value objects and input/output types.
 * Value objects are immutable objects that represent concepts in the domain.
 *
 * @example
 * ```typescript
 * // Input types (for use cases)
 * export interface CreateTodoInput {
 *   title: string;
 *   description?: string;
 *   dueDate?: Date;
 * }
 *
 * export interface UpdateTodoInput {
 *   title?: string;
 *   description?: string;
 *   status?: TodoStatus;
 *   dueDate?: Date;
 * }
 *
 * // Filter types (for queries)
 * export interface TodoFilters {
 *   status?: TodoStatus;
 *   userId?: string;
 *   search?: string;
 *   dueBefore?: Date;
 *   dueAfter?: Date;
 * }
 *
 * // Output types (for API responses)
 * export interface TodoOutput {
 *   id: string;
 *   title: string;
 *   description?: string;
 *   status: TodoStatus;
 *   createdAt: Date;
 *   updatedAt: Date;
 * }
 * ```
 */

/**
 * Base class for value objects
 *
 * Value objects are identified by their attributes, not by an ID.
 * Two value objects are equal if all their attributes are equal.
 */
export abstract class ValueObject {
  /**
   * Check equality with another value object
   */
  equals(other: ValueObject): boolean {
    if (this === other) return true;
    if (this.constructor.name !== other.constructor.name) return false;

    return this.toJSON() === other.toJSON();
  }

  /**
   * Convert to plain object for comparison
   */
  abstract toJSON(): unknown;

  /**
   * Get hash code for use in Maps/Sets
   */
  getHashCode(): string {
    return JSON.stringify(this.toJSON());
  }
}

/**
 * Template for single-value value objects (like Email, PhoneNumber)
 */
export abstract class PrimitiveValueObject<T> extends ValueObject {
  constructor(private readonly value: T) {
    super();
    this.validate(value);
  }

  /**
   * Validate the value
   * Override this to add validation logic
   */
  protected validate(_value: T): void {
    // No-op by default
  }

  getValue(): T {
    return this.value;
  }

  toJSON(): T {
    return this.value;
  }

  toString(): string {
    return String(this.value);
  }
}

/**
 * Template for composite value objects
 * (value objects that contain multiple fields)
 */
export abstract class CompositeValueObject extends ValueObject {
  protected constructor(protected readonly props: Record<string, unknown>) {
    super();
    this.validate(props);
  }

  /**
   * Validate the props
   * Override this to add validation logic
   */
  protected validate(_props: Record<string, unknown>): void {
    // No-op by default
  }

  get<K extends keyof typeof this.props>(key: K): typeof this.props[K] {
    return this.props[key];
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }

  equals(other: CompositeValueObject): boolean {
    if (this === other) return true;
    const keys = Object.keys(this.props);
    const otherKeys = Object.keys(other.props);

    if (keys.length !== otherKeys.length) return false;

    return keys.every(key => this.props[key] === other.props[key]);
  }
}

/**
 * Common value object implementations
 */

/**
 * Email value object with validation
 */
export class Email extends PrimitiveValueObject<string> {
  protected validate(value: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
  }
}

/**
 * PhoneNumber value object with validation
 */
export class PhoneNumber extends PrimitiveValueObject<string> {
  protected validate(value: string): void {
    // Basic phone validation - adjust as needed
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(value)) {
      throw new Error(`Invalid phone number: ${value}`);
    }
  }
}

/**
 * Money value object for monetary amounts
 */
export class Money extends CompositeValueObject {
  constructor(amount: number, currency: string = 'USD') {
    super({ amount, currency });
  }

  get amount(): number {
    return this.props.amount as number;
  }

  get currency(): string {
    return this.props.currency as string;
  }

  protected validate(props: Record<string, unknown>): void {
    if (typeof props.amount !== 'number' || props.amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    if (typeof props.currency !== 'string' || props.currency.length !== 3) {
      throw new Error('Currency must be a 3-letter ISO code');
    }
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }
}

/**
 * DateRange value object for representing time periods
 */
export class DateRange extends CompositeValueObject {
  constructor(startDate: Date, endDate: Date) {
    super({ startDate, endDate });
  }

  get startDate(): Date {
    return this.props.startDate as Date;
  }

  get endDate(): Date {
    return this.props.endDate as Date;
  }

  protected validate(props: Record<string, unknown>): void {
    const startDate = props.startDate as Date;
    const endDate = props.endDate as Date;

    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
      throw new Error('Start and end must be Date objects');
    }

    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  contains(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && this.endDate >= other.startDate;
  }

  getDuration(): number {
    return this.endDate.getTime() - this.startDate.getTime();
  }
}

/**
 * Pagination value object
 */
export class Pagination extends CompositeValueObject {
  constructor(page: number = 1, pageSize: number = 20) {
    super({ page, pageSize });
  }

  get page(): number {
    return this.props.page as number;
  }

  get pageSize(): number {
    return this.props.pageSize as number;
  }

  protected validate(props: Record<string, unknown>): void {
    const page = props.page as number;
    const pageSize = props.pageSize as number;

    if (page < 1) {
      throw new Error('Page must be at least 1');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw new Error('Page size must be between 1 and 100');
    }
  }

  getOffset(): number {
    return (this.page - 1) * this.pageSize;
  }

  static fromQuery(query: { page?: string; pageSize?: string }): Pagination {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize, 10) : 20;
    return new Pagination(page, pageSize);
  }
}
