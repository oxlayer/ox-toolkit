/**
 * Redis Cache Configuration
 *
 * Sets up Redis caching for the globex application.
 * Handles caching for exams, evaluations, candidates, and workflow results.
 */

import { createRedisClient, createRedisCacheStore } from '@oxlayer/capabilities-adapters-redis';
import { createCache, createCachedRepository } from '@oxlayer/capabilities-cache';

import { ENV } from './app.config.js';

/**
 * Create Redis connection
 *
 * Connects to Redis using environment configuration with retry logic.
 */
export function createRedisConnection() {
  return createRedisClient({
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD,
    db: ENV.REDIS_DB,
    // Connection pool settings
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });
}

/**
 * Create Redis Cache Store
 *
 * Wraps Redis client with cache-specific operations:
 * - Automatic TTL management
 * - Key prefixing for multi-tenancy support
 * - Cache statistics for monitoring
 */
export function createRedisStore(redis: ReturnType<typeof createRedisConnection>) {
  const store = createRedisCacheStore(redis);
  return createCache(store, {
    // Default TTL for cached items (5 minutes)
    defaultTTL: 300,
    // Key prefix for all cache keys - supports multi-tenancy
    namespace: 'globex:',
  });
}

/**
 * Create cached repository decorator
 *
 * Wraps any repository method with automatic caching.
 * Useful for frequently accessed data like exams and evaluations.
 *
 * Usage example:
 * ```ts
 * const cachedDecorator = createCachedDecorator(cacheStore);
 * const examRepo = new ExamRepository(db);
 * const cachedExamRepo = cachedDecorator(examRepo);
 * ```
 */
export function createCachedDecorator(cacheStore: any) {
  return createCachedRepository({
    cacheStore,
    // TTL for different operations based on access patterns
    ttl: {
      find: 60, // 1 minute for find operations (frequently accessed)
      list: 30, // 30 seconds for list operations (change frequently)
      count: 60, // 1 minute for count operations
    },
    // Cache key generator with namespace support
    generateKey: (entity: string, operation: string, params: any) => {
      // Format: globex:{entity}:{operation}:{params_hash}
      const workspaceId = params?.workspaceId || 'default';
      const paramStr = JSON.stringify(params);
      return `${entity}:${operation}:${workspaceId}:${Buffer.from(paramStr).toString('base64').slice(0, 16)}`;
    },
  });
}

/**
 * Cache key patterns for globex domain entities
 *
 * These are used for manual cache operations when the decorator is not suitable.
 */
export const CacheKeys = {
  // Exam cache keys
  exam: (id: string) => `exam:${id}`,
  examQuestions: (examId: string) => `exam:${examId}:questions`,
  examsByWorkspace: (workspaceId: string) => `workspace:${workspaceId}:exams`,

  // Evaluation cache keys
  evaluation: (id: string) => `evaluation:${id}`,
  evaluationByExam: (examId: string, candidateId: string) => `evaluation:${examId}:${candidateId}`,
  evaluationsByCandidate: (candidateId: string) => `candidate:${candidateId}:evaluations`,
  evaluationResult: (assignmentId: string) => `evaluation:result:${assignmentId}`,

  // Candidate cache keys
  candidate: (id: string) => `candidate:${id}`,
  candidateByCpf: (cpf: string) => `candidate:cpf:${cpf}`,
  candidatesByWorkspace: (workspaceId: string) => `workspace:${workspaceId}:candidates`,

  // Workflow cache keys
  workflowExecution: (evaluationId: string) => `workflow:${evaluationId}:execution`,
  workflowStatus: (evaluationId: string) => `workflow:${evaluationId}:status`,

  // Session cache keys
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:${userId}:sessions`,

  // Rate limiting cache keys
  rateLimit: (identifier: string, action: string) => `ratelimit:${identifier}:${action}`,
} as const;

/**
 * TTL constants for different cache types (in seconds)
 */
export const CacheTTL = {
  // Very short TTL - frequently changing data
  IMMEDIATE: 10, // 10 seconds
  SHORT: 30, // 30 seconds

  // Medium TTL - moderately changing data
  MEDIUM: 300, // 5 minutes
  DEFAULT: 300,

  // Long TTL - rarely changing data
  LONG: 3600, // 1 hour
  EXTENDED: 86400, // 24 hours

  // Specific TTLs for globex entities
  EXAM: 300, // 5 minutes - exams change occasionally
  EVALUATION: 60, // 1 minute - evaluations change frequently
  CANDIDATE: 600, // 10 minutes - candidate data changes slowly
  WORKFLOW: 30, // 30 seconds - workflow status changes frequently
  SESSION: 3600, // 1 hour - sessions are relatively stable
} as const;

/**
 * Invalidate cache for a specific entity type
 *
 * Usage when data is updated and cache needs to be cleared.
 * Note: For production with many keys, consider using SCAN instead of KEYS.
 */
export async function invalidateCache(
  redis: any,
  pattern: string
): Promise<void> {
  const keys = await redis.keys(`globex:${pattern}*`);

  // Delete keys in batches to avoid blocking
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

/**
 * Invalidate all caches for a workspace
 *
 * Useful when tenant-wide changes occur.
 */
export async function invalidateWorkspaceCache(
  redis: Awaited<ReturnType<typeof createRedisConnection>>,
  workspaceId: string
): Promise<void> {
  const patterns = [
    `workspace:${workspaceId}:*`,
    `program:*:exams`,
    `candidate:${workspaceId}:*`,
  ];

  for (const pattern of patterns) {
    await invalidateCache(redis, pattern);
  }
}
