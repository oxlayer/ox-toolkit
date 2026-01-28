/**
 * Pagination Utilities
 *
 * Canonical pagination contract for OxLayer HTTP controllers.
 * Provides consistent cursor-based pagination across all APIs.
 */

/**
 * Base64 encode a cursor value for pagination
 *
 * @param value - The value to encode (typically offset/limit or other pagination state)
 * @returns Base64 encoded string
 *
 * @example
 * ```ts
 * const cursor = base64Encode({ offset: 10, limit: 20 });
 * // Returns "eyJvZmZzZXQiOjEwLCJsaW1pdCI6MjB9"
 * ```
 */
export function base64Encode(value: unknown): string {
  const str = JSON.stringify(value);
  return Buffer.from(str).toString('base64');
}

/**
 * Base64 decode a cursor value for pagination
 *
 * @param cursor - The base64 encoded cursor string
 * @returns The decoded value
 *
 * @example
 * ```ts
 * const value = base64Decode("eyJvZmZzZXQiOjEwLCJsaW1pdCI6MjB9");
 * // Returns { offset: 10, limit: 20 }
 * ```
 */
export function base64Decode<T = unknown>(cursor: string): T {
  const str = Buffer.from(cursor, 'base64').toString('utf-8');
  return JSON.parse(str) as T;
}

/**
 * PageInfo structure for cursor-based pagination
 */
export type PageInfo = {
  limit: number;
  nextCursor?: string;
  hasNext: boolean;
};

/**
 * Optional meta information for pagination responses
 */
export type PaginationMeta = {
  total?: number;
};

/**
 * Build pageInfo object for cursor-based pagination
 *
 * @param options - Pagination options
 * @param options.itemsLength - The number of items returned in current page
 * @param options.limit - The page size limit
 * @param options.nextCursorPayload - The payload to encode in nextCursor (if hasNext)
 * @returns pageInfo object with nextCursor and hasNext
 *
 * @example
 * ```ts
 * const pageInfo = buildPageInfo({
 *   itemsLength: 10,
 *   limit: 10,
 *   nextCursorPayload: { offset: 10, limit: 10 },
 * });
 * // Returns { limit: 10, nextCursor: "abc123", hasNext: true }
 * ```
 */
export function buildPageInfo(options: {
  itemsLength: number;
  limit: number;
  nextCursorPayload: unknown;
}): PageInfo {
  const { itemsLength, limit, nextCursorPayload } = options;
  const hasNext = itemsLength >= limit;

  return {
    limit,
    hasNext,
    nextCursor: hasNext ? base64Encode(nextCursorPayload) : undefined,
  };
}

/**
 * Build the full paginated response payload
 *
 * @param options - Response options
 * @param options.data - The items to return
 * @param options.pageInfo - The pagination info
 * @param options.total - Optional total count (only included if provided)
 * @returns Complete paginated response
 *
 * @example
 * ```ts
 * return this.ok(
 *   buildPaginatedPayload({
 *     data: items,
 *     pageInfo,
 *     total, // optional
 *   })
 * );
 * ```
 */
export function buildPaginatedPayload<T>(options: {
  data: T[];
  pageInfo: PageInfo;
  total?: number;
}): {
  data: T[];
  pageInfo: PageInfo;
  meta?: PaginationMeta;
} {
  const { data, pageInfo, total } = options;

  return {
    data,
    pageInfo,
    ...(total !== undefined ? { meta: { total } } : {}),
  };
}
