/**
 * Cursor-based pagination result
 *
 * Preferred over offset pagination for large datasets.
 */
export interface CursorPage<T> {
  /**
   * Items in this page
   */
  items: T[];

  /**
   * Cursor to fetch the next page, undefined if no more pages
   */
  nextCursor?: string;

  /**
   * Optional: total count (expensive for large datasets)
   */
  totalCount?: number;
}

/**
 * Offset-based pagination result
 *
 * Use only when random page access is required.
 */
export interface OffsetPage<T> {
  /**
   * Items in this page
   */
  items: T[];

  /**
   * Total number of items across all pages
   */
  total: number;

  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Items per page
   */
  pageSize: number;

  /**
   * Total number of pages
   */
  totalPages: number;
}

/**
 * Common query options
 */
export interface QueryOptions {
  /**
   * Maximum number of items to return
   */
  limit?: number;
}

/**
 * Cursor-based query options
 */
export interface CursorQueryOptions extends QueryOptions {
  /**
   * Cursor from previous page
   */
  cursor?: string;
}

/**
 * Offset-based query options
 */
export interface OffsetQueryOptions extends QueryOptions {
  /**
   * Number of items to skip
   */
  offset?: number;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort specification
 */
export interface SortSpec<T> {
  field: keyof T;
  direction: SortDirection;
}

/**
 * Date range filter
 */
export interface DateRange {
  from?: Date;
  to?: Date;
}
