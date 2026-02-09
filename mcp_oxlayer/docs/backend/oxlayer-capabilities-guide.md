# OxLayer Capabilities Reference Guide

A comprehensive guide to all OxLayer capability packages - modular, composable infrastructure for Hono-based applications.

## Overview

OxLayer capabilities are modular packages that provide cross-cutting concerns for applications. Each capability follows a clear separation between the **WHAT** (the capability contract) and **HOW** (the implementation), with adapters providing concrete implementations of defined interfaces.

## Capability Packages

| Package | Version | Purpose |
|---------|---------|---------|
| `@oxlayer/capabilities-auth` | 1.0.3 | Authentication middleware (JWT, Keycloak) |
| `@oxlayer/capabilities-cache` | 1.0.3 | Cache interfaces and in-memory implementation |
| `@oxlayer/capabilities-events` | 1.0.3 | Event-driven architecture (EventBus) |
| `@oxlayer/capabilities-internal` | 1.0.3 | Internal utilities (errors, logging, env) |
| `@oxlayer/capabilities-metrics` | 1.0.3 | Metrics collection (Prometheus) |
| `@oxlayer/capabilities-openapi` | 1.0.0 | OpenAPI/Swagger documentation |
| `@oxlayer/capabilities-queues` | 1.0.3 | Background job processing |
| `@oxlayer/capabilities-scheduler` | 1.0.3 | Scheduled/cron jobs |
| `@oxlayer/capabilities-search` | 1.0.3 | Full-text search interfaces |
| `@oxlayer/capabilities-telemetry` | 1.0.3 | OpenTelemetry tracing |
| `@oxlayer/capabilities-testing` | 1.0.0 | Testing utilities and patterns |
| `@oxlayer/capabilities-vector` | 1.0.3 | Vector similarity search |

---

## 1. @oxlayer/capabilities-auth

**Unified authentication middleware for Hono with JWT and Keycloak support**

### Installation
```bash
bun add @oxlayer/capabilities-auth
```

### Dependencies
- `hono ^4.0.0`
- `jsonwebtoken ^9.0.2`
- `jwks-rsa ^3.1.0`

### Key Exports
```typescript
// Authentication strategies
export { generateToken, verifyToken, jwtStrategy } from './strategies/jwt.js'
export { keycloakStrategy } from './strategies/keycloak.js'

// Middleware
export { authMiddleware, requireAuth, requireStrategy } from './middleware/index.js'

// Guards and routes
export { isAuthenticated } from './guards/index.js'
export { authRoutes } from './routes.js'
```

### Configuration
```typescript
interface AuthMiddlewareOptions {
  enableKeycloak?: boolean;                    // Enable Keycloak auth
  keycloak?: {
    url: string;
    realm: string;
    clientId?: string;
    clientSecret?: string;
  };
  enableJwt?: boolean;                         // Enable JWT auth
  jwtSecret?: string;                          // JWT secret
  publicPaths?: string[];                      // Paths that bypass auth
  adminOnlyRoutes?: string[];                  // Admin-only routes
  enableTenancy?: boolean;                     // Enable tenant context
  tokenRoutes?: {                             // Auto-generate token endpoints
    enableAnonymous?: boolean;
    enableKeycloak?: boolean;
    enableTenant?: boolean;
    pathPrefix?: string;
    expiresIn?: string;
  };
}
```

### Usage Example
```typescript
import { authMiddleware, requireAuth } from '@oxlayer/capabilities-auth'
import { Hono } from 'hono'

const app = new Hono()

// Apply auth middleware
app.use('*', authMiddleware({
  enableKeycloak: true,
  keycloak: {
    url: 'https://auth.example.com',
    realm: 'my-realm',
    clientId: 'my-app',
    clientSecret: 'secret'
  },
  enableJwt: true,
  jwtSecret: 'your-secret',
  publicPaths: ['/health', '/docs']
}))

// Protected routes
app.use('/api/*', requireAuth())

app.get('/api/user/profile', (c) => {
  const user = c.get('authPayload')
  return c.json({ user })
})
```

### Patterns
- **Layered Authentication**: Tries Keycloak first, falls back to JWT
- **Tenant-aware**: Supports multi-tenancy when enabled
- **Public Path Whitelisting**: Health checks and documentation bypass auth

---

## 2. @oxlayer/capabilities-cache

**Cache capability - defines cache semantics and interfaces**

### Installation
```bash
bun add @oxlayer/capabilities-cache
```

### Key Exports
```typescript
// Core interfaces
export interface CacheEntry<T>
export interface CacheStats
export interface Cache

// Cache implementations
export { createCache, InMemoryCache } from './cache-impl.js'
export { CachePolicy } from './policies.js'

// Utilities
export { createCacheKey } from './cache-key.js'
export { CacheRepository } from './repository.js'
```

### Configuration
```typescript
interface CacheOptions {
  ttl?: number;                  // Default TTL in seconds
  maxSize?: number;              // Maximum items
  cleanupInterval?: number;      // Cleanup interval ms
  policy?: CachePolicy;          // Eviction policy
}
```

### Usage Example
```typescript
import { createCache, CacheRepository } from '@oxlayer/capabilities-cache'

// Create cache instance
const cache = createCache({
  ttl: 3600, // 1 hour
  maxSize: 1000,
  policy: { type: 'LRU', maxSize: 1000 }
})

// Cache repository pattern
const userCache = new CacheRepository(cache, 'user')

// Basic operations
await userCache.set('user:123', userData, 3600)
const user = await userCache.get('user:123')
await userCache.delete('user:123')

// With statistics
const stats = await cache.getStats()
console.log(`Cache hits: ${stats.hits}, misses: ${stats.misses}`)
```

### Adapters
- Redis: `@oxlayer/capabilities-adapters-redis`
- Memcached: (coming soon)

---

## 3. @oxlayer/capabilities-events

**Transport-agnostic event handling - defines EventBus contract**

### Installation
```bash
bun add @oxlayer/capabilities-events
```

### Key Exports
```typescript
// Core event types
export { Event, EventEnvelope } from './event.js'
export { EventBus } from './event-bus.js'
export { EventPublisher, EventSubscriber } from './publisher.js'

// Implementations
export { InMemoryEventBus } from './in-memory-bus.js'
export { CompositeEventBus } from './composite-bus.js'
export { InstrumentedEventBus } from './instrumented-bus.js'
```

### Usage Example
```typescript
import { InMemoryEventBus } from '@oxlayer/capabilities-events'

// Create event bus
const bus = new InMemoryEventBus({ serviceName: 'user-service' })
await bus.start()

// Emit events
await bus.emit({
  type: 'UserCreated',
  data: { id: '123', name: 'John', email: 'john@example.com' }
})

// Subscribe to events
await bus.on('UserCreated', async (event) => {
  console.log('User created:', event.data)
  await sendWelcomeEmail(event.data.email)
})
```

### Adapters
- RabbitMQ: `@oxlayer/capabilities-adapters-rabbitmq`
- BullMQ: `@oxlayer/capabilities-adapters-bullmq`
- SQS: `@oxlayer/capabilities-adapters-sqs`
- MQTT: `@oxlayer/capabilities-adapters-mqtt`

---

## 4. @oxlayer/capabilities-internal

**Internal utilities - errors, logging, environment**

### Installation
```bash
bun add @oxlayer/capabilities-internal
```

### Key Exports
```typescript
// Error handling
export { AppError, UnauthorizedError, ForbiddenError } from './errors.js'

// Response utilities
export { createErrorResponse, createSuccessResponse } from './response.js'

// Logging
export { Logger, LogLevel } from './logger.js'

// Environment utilities
export { env, EnvConfig } from './env/index.js'
```

### Usage Example
```typescript
import {
  AppError,
  ForbiddenError,
  createSuccessResponse,
  Logger
} from '@oxlayer/capabilities-internal'

// Custom error handling
function checkPermission(userRole: string) {
  if (userRole !== 'admin') {
    throw new ForbiddenError('Admin access required')
  }
}

// Structured responses
app.get('/api/data', (c) => {
  const data = fetchData()
  return createSuccessResponse(c, data)
})

// Logging with context
const logger = new Logger('userService')
logger.info('Processing user request', { userId: '123' })
```

---

## 5. @oxlayer/capabilities-metrics

**Metrics collection middleware for Hono**

### Installation
```bash
bun add @oxlayer/capabilities-metrics
```

### Key Exports
```typescript
// Metrics client
export { MetricsClient, metricsClient } from './metrics-client.js'

// Middleware
export { metricsMiddleware, metricsEndpoint } from './middleware.js'
```

### Usage Example
```typescript
import {
  metricsMiddleware,
  metricsClient
} from '@oxlayer/capabilities-metrics'

// Apply metrics middleware
app.use('*', metricsMiddleware({
  app: 'my-service',
  version: '1.0.0'
}))

// Track custom metrics
const userRegistrations = metricsClient.createCounter({
  name: 'user_registrations_total',
  description: 'Total number of user registrations'
})

userRegistrations.inc({ status: 'success' })

// Expose metrics endpoint
app.get('/metrics', metricsEndpoint())
```

---

## 6. @oxlayer/capabilities-openapi

**OpenAPI documentation middleware for Hono**

### Installation
```bash
bun add @oxlayer/capabilities-openapi
```

### Key Exports
```typescript
export * from './openapi/index.js'
export * from './hono/index.js'
```

### Usage Example
```typescript
import { openapi } from '@oxlayer/capabilities-openapi'
import { z } from 'zod'

// Define route with OpenAPI metadata
app.openapi({
  method: 'get',
  path: '/users/{id}',
  description: 'Get user by ID',
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: {
      description: 'User found',
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            email: z.string()
          })
        }
      }
    }
  }
}, (c) => {
  const { id } = c.req.param()
  return getUserById(id)
})

// Swagger UI
app.get('/docs', openapi.ui())
```

---

## 7. @oxlayer/capabilities-queues

**Background job processing with retries**

### Installation
```bash
bun add @oxlayer/capabilities-queues
```

### Key Exports
```typescript
// Job types
export enum JobStatus
export enum JobPriority
export interface JobOptions
export interface JobResult<T>

// Core interfaces
export interface Queue
export interface Worker
```

### Usage Example
```typescript
import { Queue, JobPriority } from '@oxlayer/capabilities-queues'
import { BullMQQueue } from '@oxlayer/capabilities-adapters-bullmq'

// Create queue
const emailQueue = new BullMQQueue('email', {
  connection: redisConnection
})

// Add jobs
await emailQueue.add({
  to: 'user@example.com',
  subject: 'Welcome!'
}, {
  priority: JobPriority.HIGH,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  }
})

// Process jobs
await emailQueue.process(async (job) => {
  await sendEmail(job.data.to, job.data.subject)
})
```

### Adapters
- BullMQ: `@oxlayer/capabilities-adapters-bullmq`
- SQS: (coming soon)

---

## 8. @oxlayer/capabilities-scheduler

**Scheduled/cron job management**

### Installation
```bash
bun add @oxlayer/capabilities-scheduler
```

### Key Exports
```typescript
export { Scheduler, createScheduler } from './scheduler.js'
export interface ScheduleOptions
export { SchedulerError } from './errors.js'
```

### Configuration
```typescript
interface ScheduleOptions {
  every?: number;           // Milliseconds between runs
  pattern?: string;         // Cron expression
  timezone?: string;       // Timezone for cron
  immediate?: boolean;      // Run immediately
  maxRuns?: number;        // Maximum number of runs
}
```

### Usage Example
```typescript
import { scheduler } from '@oxlayer/capabilities-scheduler'

// Schedule with interval
await scheduler.schedule('cleanup-tasks', {
  every: 24 * 60 * 60 * 1000, // Every day
  immediate: true
}, {
  name: 'daily-cleanup'
})

// Schedule with cron
await scheduler.schedule('generate-reports', {
  pattern: '0 0 9 * * 1-5', // Weekdays at 9 AM
  timezone: 'America/New_York'
}, {
  name: 'daily-report'
})
```

---

## 9. @oxlayer/capabilities-search

**Full-text search interfaces**

### Installation
```bash
bun add @oxlayer/capabilities-search
```

### Key Exports
```typescript
export interface Search<T>
export interface SearchQuery
export interface SearchResponse<T>
export interface SearchDocument
export interface IndexConfig
export enum SortOrder
```

### Usage Example
```typescript
import { Search, SearchDocument, IndexConfig } from '@oxlayer/capabilities-search'
import { QuickwitSearch } from '@oxlayer/capabilities-adapters-quickwit'

const search = new QuickwitSearch('users')

// Create index
const config: IndexConfig = {
  name: 'users',
  fields: [
    { name: 'name', type: 'text', indexed: true },
    { name: 'email', type: 'keyword', indexed: true }
  ]
}
await search.createIndex(config)

// Index documents
await search.index({
  id: 'user-123',
  fields: { name: 'John Doe', email: 'john@example.com' }
})

// Search
const results = await search.search({
  query: 'john',
  limit: 10
})
```

### Adapters
- Quickwit: `@oxlayer/capabilities-adapters-quickwit`
- OpenSearch: (coming soon)
- Meilisearch: (coming soon)

---

## 10. @oxlayer/capabilities-telemetry

**OpenTelemetry integration middleware**

### Installation
```bash
bun add @oxlayer/capabilities-telemetry
```

### Key Exports
```typescript
// Types and client
export * from './types.js'
export * from './client.js'

// Middleware
export * from './middleware.js'
export * from './tracing.js'
```

### Usage Example
```typescript
import {
  initTelemetry,
  tracingMiddleware,
  getTracer
} from '@oxlayer/capabilities-telemetry'

// Initialize
await initTelemetry({
  serviceName: 'user-service',
  export: {
    otlp: { url: 'http://localhost:4318' }
  }
})

// Apply middleware
app.use('*', tracingMiddleware({ serviceName: 'user-service' }))

// Create spans
const tracer = getTracer('user-service')

app.get('/api/users/:id', async (c) => {
  const span = tracer.startSpan('get-user')
  try {
    const user = await getUser(c.req.param('id'))
    span.setStatus({ code: SpanStatusCode.OK })
    return c.json(user)
  } catch (error) {
    span.recordException(error)
    throw error
  } finally {
    span.end()
  }
})
```

---

## 11. @oxlayer/capabilities-testing

**Shared testing infrastructure**

### Installation
```bash
bun add -D @oxlayer/capabilities-testing
```

### Key Exports
```typescript
// Mock objects
export { MockTracer, MockEventBus, MockRepository } from './mocks/index.js'

// Test builders
export { TestBuilder, CombinedBuilder } from './builders.js'

// Test helpers
export { waitFor, retry, delay, createTestContext } from './test-helpers.js'

// Assertions
export {
  assertEventPublished,
  assertDomainEventEmitted,
  assertMetricRecorded
} from './assertions.js'

// Testing patterns
export {
  describeSecurityTests,
  describeOwnershipTests,
  describePermissionTests,
  describeRaceConditionTests
} from './patterns/index.js'
```

### Usage Example
```typescript
import {
  TestBuilder,
  MockEventBus,
  assertEventPublished,
  describeOwnershipTests
} from '@oxlayer/capabilities-testing'

// Test builder
const userBuilder = new TestBuilder({
  id: () => `user-${Date.now()}`,
  name: 'Test User',
  email: 'test@example.com'
})

const testUser = userBuilder
  .withName('John Doe')
  .build()

// Mock event bus
const mockEventBus = new MockEventBus()
await mockEventBus.start()

// Assert events
await mockEventBus.emit({ type: 'UserCreated', data: testUser })
assertEventPublished(mockEventBus, 'UserCreated', { data: testUser })

// Ownership tests
describeOwnershipTests('userService', {
  createEntity: () => ({ id: 'user-123', owner: 'user-456' }),
  getOwnerId: (entity) => entity.owner
})
```

---

## 12. @oxlayer/capabilities-vector

**Vector similarity search interfaces**

### Installation
```bash
bun add @oxlayer/capabilities-vector
```

### Key Exports
```typescript
export enum DistanceMetric
export interface VectorStore
export interface VectorPoint<T>
export interface VectorSearchQuery
export interface VectorMatch<T>
```

### Usage Example
```typescript
import {
  VectorStore,
  VectorPoint,
  DistanceMetric
} from '@oxlayer/capabilities-vector'
import { QdrantVectorStore } from '@oxlayer/capabilities-adapters-qdrant'

const vectorStore = new QdrantVectorStore('embeddings', {
  host: 'localhost',
  port: 6333,
  distance: DistanceMetric.COSINE
})

// Create collection
await vectorStore.createCollection({ size: 384 })

// Add vectors
await vectorStore.upsert([{
  id: 'doc-1',
  vector: [0.1, 0.2, 0.3, /* ... */],
  payload: { title: 'ML Guide', category: 'education' }
}])

// Search similar vectors
const results = await vectorStore.search({
  vector: queryEmbedding,
  limit: 5,
  scoreThreshold: 0.7,
  filter: { must: [{ key: 'category', match: 'education' }] }
})
```

### Adapters
- Qdrant: `@oxlayer/capabilities-adapters-qdrant`
- Pinecone: (coming soon)

---

## Integration Examples

### Complete Application Setup

```typescript
import { Hono } from 'hono'
import { authMiddleware } from '@oxlayer/capabilities-auth'
import { metricsMiddleware } from '@oxlayer/capabilities-metrics'
import { tracingMiddleware } from '@oxlayer/capabilities-telemetry'
import { openapi } from '@oxlayer/capabilities-openapi'
import { createRabbitMQEventBus } from '@oxlayer/capabilities-adapters-rabbitmq'

const app = new Hono()

// Middleware stack
app.use('*', tracingMiddleware({ serviceName: 'my-service' }))
app.use('*', metricsMiddleware({ app: 'my-service', version: '1.0.0' }))
app.use('*', authMiddleware({
  enableJwt: true,
  jwtSecret: process.env.JWT_SECRET,
  publicPaths: ['/health', '/docs']
}))

// Event bus
const eventBus = await createRabbitMQEventBus({
  url: process.env.RABBITMQ_URL,
  exchange: 'app.events'
})

// OpenAPI documentation
app.get('/docs', openapi.ui())
app.get('/swagger.json', openapi.spec())

// Metrics endpoint
app.get('/metrics', metricsEndpoint())
```

### Event-Driven Architecture

```typescript
// Order service
eventBus.on('OrderCreated', async (event) => {
  await validateOrder(event.data)
  const payment = await processPayment(event.data)
  await eventBus.emit('PaymentProcessed', { orderId: event.data.id, result: payment })
})

// Notification service
eventBus.on('PaymentProcessed', async (event) => {
  await sendPaymentConfirmation(event.data.orderId)
})
```

### Caching Strategy

```typescript
import { CacheRepository } from '@oxlayer/capabilities-cache'
import { RedisCache } from '@oxlayer/capabilities-adapters-redis'

const cache = new RedisCache({ url: 'redis://localhost:6379' })
const userCache = new CacheRepository(cache, 'user', { ttl: 3600 })

async function getUser(id: string) {
  const cached = await userCache.get(id)
  if (cached) return cached

  const user = await db.getUser(id)
  await userCache.set(id, user)
  return user
}
```

### Background Jobs

```typescript
import { Queue } from '@oxlayer/capabilities-queues'
import { BullMQQueue } from '@oxlayer/capabilities-adapters-bullmq'

const queue = new BullMQQueue('processing', { connection: redis })

queue.process(async (job) => {
  if (job.name === 'image-processing') {
    await processImage(job.data.imagePath)
  }
})

await queue.add('image-processing', {
  imagePath: '/uploads/image.jpg'
}, { priority: 5, attempts: 3 })
```

---

## Adapter Packages

Infrastructure adapters provide concrete implementations of capability interfaces:

| Adapter | Implements | Technology |
|---------|------------|------------|
| `@oxlayer/capabilities-adapters-postgres` | Database | PostgreSQL |
| `@oxlayer/capabilities-adapters-redis` | Cache | Redis |
| `@oxlayer/capabilities-adapters-rabbitmq` | Events, Queues | RabbitMQ |
| `@oxlayer/capabilities-adapters-bullmq` | Events, Queues | BullMQ |
| `@oxlayer/capabilities-adapters-sqs` | Events, Queues | AWS SQS |
| `@oxlayer/capabilities-adapters-mqtt` | Events | MQTT |
| `@oxlayer/capabilities-adapters-quickwit` | Search | Quickwit |
| `@oxlayer/capabilities-adapters-qdrant` | Vector | Qdrant |

---

## Best Practices

1. **Start Simple**: Begin with auth, internal, and testing
2. **Add Observability Early**: Integrate metrics and telemetry from the start
3. **Event-Driven**: Use events for loose coupling between services
4. **Cache Strategically**: Add caching for expensive operations
5. **Test Thoroughly**: Use testing patterns for security and authorization
6. **Background Processing**: Offload long-running tasks to queues
7. **Monitor Everything**: Use telemetry and metrics for production readiness

---

## Migration Checklist

- [ ] Install core capabilities: auth, internal, testing
- [ ] Add observability: metrics, telemetry
- [ ] Implement event-driven patterns
- [ ] Add background job processing
- [ ] Implement caching for performance
- [ ] Add search when data grows
- [ ] Use vector search for AI/ML features
- [ ] Set up scheduled jobs for maintenance
- [ ] Document API with OpenAPI
