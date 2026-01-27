import type { CursorPage, CursorQueryOptions } from '@oxlayer/foundation-domain-kit';

/**
 * Encode a cursor value (typically an ID or timestamp) to a base64 string
 */
export function encodeCursor(value: string | number | Date): string {
  const stringValue = value instanceof Date ? value.toISOString() : String(value);
  return Buffer.from(stringValue).toString('base64');
}

/**
 * Decode a base64 cursor to its original value
 */
export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString('utf-8');
}

/**
 * Create a cursor page from query results
 *
 * @example
 * ```ts
 * const results = await db.query<User>('SELECT * FROM users WHERE id > ? LIMIT ?', [decodedCursor, limit + 1]);
 * return createCursorPage(results, options.limit, (user) => user.id);
 * ```
 */
export function createCursorPage<T>(
  items: T[],
  limit: number,
  getCursorValue: (item: T) => string | number | Date
): CursorPage<T> {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor(getCursorValue(lastItem)) : undefined;

  return {
    items: pageItems,
    nextCursor,
  };
}

/**
 * Build pagination parameters for SQL queries
 */
export function buildCursorPaginationParams(
  options: CursorQueryOptions,
  defaultLimit: number = 50
): {
  cursor: string | null;
  limit: number;
} {
  const cursor = options.cursor ? decodeCursor(options.cursor) : null;
  const limit = options.limit ?? defaultLimit;

  return { cursor, limit };
}

/**
 * Type for cursor-based query functions
 */
export type CursorQueryFn<T, TOptions extends CursorQueryOptions> = (
  options: TOptions
) => Promise<CursorPage<T>>;
