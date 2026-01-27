/**
 * Base interface for mapping between domain entities and DTOs.
 *
 * Mappers handle the conversion between domain models and data transfer objects,
 * keeping domain entities pure and preventing them from leaking to other layers.
 *
 * @example
 * ```ts
 * class UserMapper implements Mapper<User, UserDTO> {
 *   toDTO(entity: User): UserDTO {
 *     return {
 *       id: entity.id,
 *       email: entity.email.value,
 *       name: entity.name,
 *       createdAt: entity.createdAt.toISOString()
 *     };
 *   }
 *
 *   toDomain(dto: UserDTO): User {
 *     return new User(
 *       dto.id,
 *       Email.create(dto.email),
 *       dto.name,
 *       new Date(dto.createdAt)
 *     );
 *   }
 * }
 * ```
 */
export interface Mapper<TDomain, TDTO> {
  /**
   * Convert domain entity to DTO
   */
  toDTO(entity: TDomain): TDTO;

  /**
   * Convert DTO to domain entity
   */
  toDomain(dto: TDTO): TDomain;
}

/**
 * Mapper that only converts to DTO (read-only scenarios)
 */
export interface ReadMapper<TDomain, TDTO> {
  toDTO(entity: TDomain): TDTO;
}

/**
 * Mapper for database persistence layer
 *
 * Handles conversion between domain entities and database records.
 * This is where fromRaw() logic should live, NOT in domain entities.
 */
export interface PersistenceMapper<TDomain, TRecord> {
  /**
   * Convert domain entity to database record
   */
  toRecord(entity: TDomain): TRecord;

  /**
   * Convert database record to domain entity
   */
  fromRecord(record: TRecord): TDomain;
}

/**
 * Combine multiple items using a mapper
 */
export function mapArray<T, U>(items: T[], mapper: (item: T) => U): U[] {
  return items.map(mapper);
}

/**
 * Map an optional value
 */
export function mapOptional<T, U>(
  item: T | null | undefined,
  mapper: (item: T) => U
): U | null {
  if (item === null || item === undefined) {
    return null;
  }
  return mapper(item);
}
