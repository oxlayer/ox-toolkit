/**
 * Base class for all domain entities.
 *
 * Entities have identity - two entities with the same ID are considered equal,
 * regardless of their other attributes.
 *
 * This base class supports both direct property patterns and props-based patterns.
 *
 * @example
 * ```ts
 * // Direct property pattern
 * class User extends Entity<string> {
 *   constructor(
 *     id: string,
 *     public readonly email: string,
 *     public readonly name: string
 *   ) {
 *     super(id);
 *   }
 * }
 *
 * // Props-based pattern
 * class Exam extends Entity<ExamProps> {
 *   protected props: ExamProps;
 *   constructor(props: ExamProps) {
 *     super(props.id);
 *     this.props = props;
 *   }
 * }
 * ```
 */
export abstract class Entity<TProps> {
  /**
   * The entity's unique identifier
   */
  readonly id: string;

  /**
   * Optional props object for props-based entities
   */
  protected props?: TProps;

  protected constructor(id: string) {
    this.id = id;
  }

  equals(other: unknown): boolean {
    if (!other) return false;
    if (typeof other !== 'object') return false;
    const otherId = (other as Partial<Entity<TProps>>).id;
    return typeof otherId !== 'undefined' && otherId === this.id;
  }
}
