import type { ClickHouseClient } from './client.js';
import type { BatchInserterOptions } from './types.js';

/**
 * Batch inserter for efficient bulk inserts
 *
 * Accumulates data and flushes it in batches to minimize network overhead.
 *
 * @example
 * ```ts
 * import { createClickHouseClient, BatchInserter } from '@oxlayer/capabilities-adapters-clickhouse';
 *
 * const ch = createClickHouseClient({ host: 'http://localhost', port: 8123 });
 * const inserter = new BatchInserter(ch, {
 *   table: 'events',
 *   batchSize: 10000,
 *   flushInterval: 5000,
 * });
 *
 * // Add events to the batch
 * for (const event of events) {
 *   await inserter.add(event);
 * }
 *
 * // Flush remaining events
 * await inserter.flush();
 * await inserter.close();
 * ```
 */
export class BatchInserter {
  private buffer: Record<string, unknown>[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;

  constructor(
    private client: ClickHouseClient,
    private options: BatchInserterOptions
  ) {
    const batchSize = options.batchSize || 10000;
    const flushInterval = options.flushInterval || 5000;

    // Set up auto-flush
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error('[BatchInserter] Auto-flush error:', error);
      });
    }, flushInterval);

    console.log(`[BatchInserter] Created for table ${options.table} (batchSize: ${batchSize}, flushInterval: ${flushInterval}ms)`);
  }

  /**
   * Add a row to the batch
   *
   * @param row - Row data
   */
  async add(row: Record<string, unknown>): Promise<void> {
    if (this.closed) {
      throw new Error('BatchInserter is closed');
    }

    this.buffer.push(row);

    // Auto-flush if buffer is full
    if (this.buffer.length >= (this.options.batchSize || 10000)) {
      await this.flush();
    }
  }

  /**
   * Add multiple rows to the batch
   *
   * @param rows - Array of row data
   */
  async addMany(rows: Record<string, unknown>[]): Promise<void> {
    if (this.closed) {
      throw new Error('BatchInserter is closed');
    }

    this.buffer.push(...rows);

    // Auto-flush if buffer is full
    if (this.buffer.length >= (this.options.batchSize || 10000)) {
      await this.flush();
    }
  }

  /**
   * Flush the buffer to ClickHouse
   *
   * @returns Number of rows inserted
   */
  async flush(): Promise<number> {
    if (this.buffer.length === 0) {
      return 0;
    }

    const data = [...this.buffer];
    this.buffer = [];

    const maxRetries = this.options.maxRetries || 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.client.insert({
          table: this.options.table,
          data,
        });

        console.log(`[BatchInserter] Flushed ${data.length} rows to ${this.options.table}`);
        return data.length;
      } catch (error) {
        lastError = error as Error;
        console.error(`[BatchInserter] Flush attempt ${attempt + 1}/${maxRetries} failed:`, error);

        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // Re-add failed data to buffer for retry
    this.buffer.unshift(...data);

    throw new Error(`[BatchInserter] Failed to flush after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Get the current buffer size
   */
  getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Close the inserter and flush remaining data
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    this.closed = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining data
    if (this.buffer.length > 0) {
      await this.flush();
    }

    console.log('[BatchInserter] Closed');
  }

  /**
   * Check if the inserter is closed
   */
  isClosed(): boolean {
    return this.closed;
  }
}

/**
 * Create a batch inserter
 *
 * @param client - ClickHouseClient instance
 * @param options - Batch inserter options
 * @returns BatchInserter instance
 */
export function createBatchInserter(
  client: ClickHouseClient,
  options: BatchInserterOptions
): BatchInserter {
  return new BatchInserter(client, options);
}
