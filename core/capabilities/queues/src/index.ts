/**
 * Queues capability - defines job queue semantics and interfaces
 *
 * This is the WHAT (capability): background work, retries, visibility, ack/nack
 * Adapters like BullMQ, SQS, RabbitMQ implement this.
 */

/**
 * Job status
 */
export enum JobStatus {
  /**
   * Job is waiting to be processed
   */
  PENDING = 'pending',

  /**
   * Job is currently being processed
   */
  ACTIVE = 'active',

  /**
   * Job completed successfully
   */
  COMPLETED = 'completed',

  /**
   * Job failed
   */
  FAILED = 'failed',

  /**
   * Job was delayed
   */
  DELAYED = 'delayed',
}

/**
 * Job priority levels
 */
export enum JobPriority {
  /**
   * Low priority
   */
  LOW = 1,

  /**
   * Normal priority
   */
  NORMAL = 5,

  /**
   * High priority
   */
  HIGH = 8,

  /**
   * Critical priority
   */
  CRITICAL = 10,
}

/**
 * Job options
 */
export interface JobOptions {
  /**
   * Job priority (1-10)
   */
  priority?: JobPriority;

  /**
   * Delay job until timestamp (millis since epoch)
   */
  delayUntil?: number;

  /**
   * Delay job by duration (milliseconds)
   */
  delay?: number;

  /**
   * Maximum number of retry attempts
   */
  attempts?: number;

  /**
   * Backoff strategy for retries
   */
  backoff?: {
    /**
     * Type of backoff
     */
    type: 'exponential' | 'fixed';

    /**
     * Initial delay in milliseconds
     */
    delay: number;

    /**
     * Multiplier for exponential backoff
     */
    multiplier?: number;
  };

  /**
   * Remove job after completion
   */
  removeOnComplete?: boolean;

  /**
   * Remove job after failure
   */
  removeOnFail?: boolean;

  /**
   * Job ID for deduplication
   */
  jobId?: string;
}

/**
 * Job result
 */
export interface JobResult<T = unknown> {
  /**
   * Job data
   */
  data: T;

  /**
   * Return value from processor
   */
  returnvalue?: unknown;

  /**
   * Number of attempts made
   */
  attemptsMade: number;

  /**
   * Timestamp when job finished
   */
  finishedOn?: number;

  /**
   * Error message if job failed
   */
  failedReason?: string;

  /**
   * Stack trace if job failed
   */
  stacktrace?: string;
}

/**
 * Job progress
 */
export interface JobProgress {
  /**
   * Current progress (0-100)
   */
  current: number;

  /**
   * Total (100 or custom max)
   */
  total: number;

  /**
   * Progress message
   */
  message?: string;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  /**
   * Total number of jobs waiting
   */
  waiting: number;

  /**
   * Total number of active jobs
   */
  active: number;

  /**
   * Total number of completed jobs
   */
  completed: number;

  /**
   * Total number of failed jobs
   */
  failed: number;

  /**
   * Total number of delayed jobs
   */
  delayed: number;

  /**
   * Whether the queue is paused
   */
  isPaused: boolean;
}

/**
 * Queue interface - the core capability contract
 *
 * Defines queue semantics (WHAT), not implementation (HOW).
 * Adapters like BullMQ, SQS, RabbitMQ implement this.
 */
export interface Queue {
  /**
   * Queue name
   */
  readonly name: string;

  /**
   * Add a job to the queue
   *
   * @param data - Job data
   * @param options - Job options
   * @returns Job ID
   */
  add<T = unknown>(data: T, options?: JobOptions): Promise<string>;

  /**
   * Add multiple jobs to the queue
   *
   * @param jobs - Array of job data
   * @returns Array of job IDs
   */
  addBulk<T = unknown>(jobs: T[]): Promise<string[]>;

  /**
   * Process jobs from the queue
   *
   * @param handler - Job handler function
   * @param options - Processing options
   */
  process<T = unknown>(
    handler: (job: JobResult<T>) => Promise<unknown>
  ): Promise<void>;

  /**
   * Get a job by ID
   *
   * @param jobId - Job ID
   * @returns Job data or null
   */
  getJob<T = unknown>(jobId: string): Promise<JobResult<T> | null>;

  /**
   * Remove a job from the queue
   *
   * @param jobId - Job ID
   * @returns True if job was removed
   */
  remove(jobId: string): Promise<boolean>;

  /**
   * Retry a failed job
   *
   * @param jobId - Job ID
   * @returns True if job was queued for retry
   */
  retry(jobId: string): Promise<boolean>;

  /**
   * Get queue statistics
   *
   * @returns Queue statistics
   */
  getStats(): Promise<QueueStats>;

  /**
   * Pause job processing
   */
  pause(): Promise<void>;

  /**
   * Resume job processing
   */
  resume(): Promise<void>;

  /**
   * Is the queue paused?
   */
  isPaused(): Promise<boolean>;

  /**
   * Obliterate (empty) the queue
   *
   * @param count - Maximum number of jobs to remove (default: all)
   * @returns Number of jobs removed
   */
  obliterate(count?: number): Promise<number>;

  /**
   * Clean up completed/failed jobs
   *
   * @param grace - Grace period in milliseconds
   * @param limit - Maximum number of jobs to clean
   * @returns Number of jobs cleaned
   */
  clean(grace: number, limit?: number): Promise<number>;

  /**
   * Stop processing jobs
   */
  close(): Promise<void>;
}

/**
 * Queue store interface for adapter implementations
 *
 * Lower-level interface that adapters implement.
 */
export interface QueueStore {
  /**
   * Add job to store
   */
  add<T>(queue: string, data: T, options?: JobOptions): Promise<string>;

  /**
   * Get next job(s) to process
   */
  getNext<T>(queue: string, count: number): Promise<JobResult<T>[]>;

  /**
   * Complete a job
   */
  complete(jobId: string, result?: unknown): Promise<void>;

  /**
   * Fail a job
   */
  fail(jobId: string, error: Error): Promise<void>;

  /**
   * Update job progress
   */
  progress(jobId: string, progress: JobProgress): Promise<void>;

  /**
   * Get queue stats
   */
  getStats(queue: string): Promise<QueueStats>;
}

/**
 * Worker configuration
 */
export interface WorkerConfig {
  /**
   * Concurrency level (number of jobs processed simultaneously)
   */
  concurrency?: number;

  /**
   * Maximum number of failed jobs per second before backing off
   */
  limiter?: {
    /**
     * Maximum jobs per interval
     */
    max: number;

    /**
     * Duration in milliseconds
     */
    duration: number;
  };

  /**
   * Grouping for jobs with same key
   */
  group?: {
    /**
     * Limit per group
     */
    limit: number;
  };
}

/**
 * Worker interface for processing jobs
 */
export interface Worker {
  /**
   * Start processing jobs
   */
  start(): Promise<void>;

  /**
   * Stop processing jobs (graceful shutdown)
   */
  stop(): Promise<void>;

  /**
   * Is worker running?
   */
  isRunning(): boolean;

  /**
   * Get worker stats
   */
  getStats(): Promise<{
    /**
     * Number of jobs processed
     */
    processed: number;

    /**
     * Number of jobs failed
     */
    failed: number;
  }>;
}
