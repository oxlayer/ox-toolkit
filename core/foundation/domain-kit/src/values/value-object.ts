/**
 * Base class for Value Objects.
 *
 * Value Objects are immutable and compared by their attributes, not identity.
 * Two value objects with the same attributes are considered equal.
 *
 * @example
 * ```ts
 * class Email extends ValueObject<string> {
 *   private constructor(value: string) {
 *     super(value);
 *   }
 *
 *   static create(value: string): Email {
 *     if (!value.includes('@')) {
 *       throw new InvalidEmailError(value);
 *     }
 *     return new Email(value.toLowerCase());
 *   }
 * }
 * ```
 */
export abstract class ValueObject<T> {
  protected constructor(public readonly value: T) {
    Object.freeze(this);
    // Deep freeze Map and Set to prevent mutation through leaked references
    if (value instanceof Map) {
      Object.freeze(value);
    } else if (value instanceof Set) {
      Object.freeze(value);
    }
  }

  /**
   * Equality comparison using deep structural equality.
   *
   * Handles:
   * - Primitives (string, number, boolean, null, undefined)
   * - Objects and arrays (order-independent for objects)
   * - Date objects (compares by timestamp)
   * - Map and Set (compares by contents)
   *
   * @example
   * ```ts
   * // ✅ Works - primitives and flat objects
   * class Money extends ValueObject<{ amount: number; currency: string }> {}
   *
   * // ✅ Works - Dates are compared by timestamp
   * class Timestamp extends ValueObject<Date> {}
   *
   * // ✅ Works - Maps and Sets are compared by contents
   * class Tags extends ValueObject<Set<string>> {}
   * ```
   */
  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return deepEqual(this.value, other.value);
  }

  toString(): string {
    return String(this.value);
  }
}

/**
 * Value Object with multiple properties.
 *
 * @example
 * ```ts
 * interface AddressProps {
 *   street: string;
 *   city: string;
 *   zipCode: string;
 * }
 *
 * class Address extends CompositeValueObject<AddressProps> {
 *   get street() { return this.props.street; }
 *   get city() { return this.props.city; }
 *   get zipCode() { return this.props.zipCode; }
 * }
 * ```
 */
export abstract class CompositeValueObject<T extends object> {
  protected constructor(protected readonly props: Readonly<T>) {
    Object.freeze(this);
    Object.freeze(deepFreeze(props));
  }

  /**
   * Equality comparison using deep structural equality.
   *
   * Handles:
   * - Primitives (string, number, boolean, null, undefined)
   * - Objects and arrays (order-independent for objects)
   * - Date objects (compares by timestamp)
   * - Map and Set (compares by contents)
   */
  equals(other: CompositeValueObject<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return deepEqual(this.props, other.props);
  }
}

/**
 * Deep equality check for value objects.
 *
 * Handles primitives, objects, arrays, Date, Map, Set.
 * Object key order is ignored (deep equality).
 */
function deepEqual(a: unknown, b: unknown): boolean {
  // Fast path for primitives and reference equality
  if (a === b) return true;

  // Handle null/undefined (strict equality already handled above)
  if (a == null || b == null) return false;

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle Map
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key))) {
        return false;
      }
    }
    return true;
  }

  // Handle Set
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const value of a) {
      if (!b.has(value)) {
        // For Sets containing objects, we need to check deeply
        let found = false;
        for (const bValue of b) {
          if (deepEqual(value, bValue)) {
            found = true;
            break;
          }
        }
        if (!found) return false;
      }
    }
    return true;
  }

  // Handle Array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // Handle Object (order-independent key comparison)
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (
        !Object.prototype.hasOwnProperty.call(b, key) ||
        !deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Deep freeze an object to ensure immutability.
 *
 * Freezes objects, arrays, Map, and Set recursively.
 * This prevents mutation through leaked references.
 *
 * Note: This is a best-effort approach. Some edge cases
 * (like circular references) are not handled to avoid complexity.
 */
function deepFreeze<T>(obj: T): T {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }

  // Handle primitives already returned above
  if (Object.isFrozen(obj)) {
    return obj;
  }

  // Handle Date - freeze but don't recurse (no nested properties)
  if (obj instanceof Date) {
    Object.freeze(obj);
    return obj;
  }

  // Handle Map - freeze and recurse on values
  if (obj instanceof Map) {
    obj.forEach((value, key) => {
      deepFreeze(value);
      // Also freeze keys if they're objects
      if (typeof key === 'object') {
        deepFreeze(key);
      }
    });
    Object.freeze(obj);
    return obj;
  }

  // Handle Set - freeze and recurse on values
  if (obj instanceof Set) {
    obj.forEach((value) => {
      deepFreeze(value);
    });
    Object.freeze(obj);
    return obj;
  }

  // Handle Array - freeze and recurse on elements
  if (Array.isArray(obj)) {
    obj.forEach((item) => deepFreeze(item));
    Object.freeze(obj);
    return obj;
  }

  // Handle plain object - freeze and recurse on values
  for (const value of Object.values(obj)) {
    deepFreeze(value);
  }
  Object.freeze(obj);

  return obj;
}
