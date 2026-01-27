# @oxlayer/capabilities-adapters-bullmq

BullMQ adapter for the @oxlayer/capabilities event bus and queue system. Provides reliable event delivery with retries, persistence, and job scheduling using Redis-backed queues.

## Features

- Event bus implementation using BullMQ for reliable message delivery
- Built-in retry logic with exponential backoff
- Job persistence and durability
- Support for multiple queues and workers
- Redis connection reuse from existing Redis client
- Concurrent job processing
- Job event monitoring (waiting, active, completed, failed)

## Installation

```bash
bun add @oxlayer/capabilities-adapters-bullmq
```

## Dependencies

This adapter requires Redis and has a peer dependency on the Redis adapter:

```bash
bun add @oxlayer/capabilities-adapters-redis bullmq
```

## Usage

### Basic Event Bus Setup

```typescript
import { createBullMQEventBus } from '@oxlayer/capabilities-adapters-bullmq';
import { createDefaultRedisClient } from '@oxlayer/capabilities-adapters-redis';

// Create Redis client (recommended)
const redisClient = createDefaultRedisClient();

// Create event bus
const eventBus = createBullMQEventBus(
  {
    queuePrefix: 'events',
  },
  {
    serviceName: 'my-service',
    serviceVersion: '1.0.0',
    jobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
  },
  redisClient
);

// Start the event bus
await eventBus.start();

// Emit events
await eventBus.emit({ type: 'UserCreated', data: { userId: '123' } });

// Subscribe to events
await eventBus.on('UserCreated', async (event) => {
  console.log('User created:', event.userId);
});

// Stop when done
await eventBus.stop();
```

### Using Connection Config (Without Redis Client)

```typescript
const eventBus = createBullMQEventBus(
  {
    connection: {
      host: 'localhost',
      port: 6379,
      password: 'optional-password',
      db: 0,
    },
    queuePrefix: 'events',
  },
  {
    serviceName: 'my-service',
  }
);
```

### Advanced Queue Management

```typescript
import { BullMQClient } from '@oxlayer/capabilities-adapters-bullmq';

const client = new BullMQClient(
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
    queues: {
      emails: {
        name: 'email-queue',
        queueOptions: {
          defaultJobOptions: {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          },
        },
        workerOptions: {
          processor: async (job) => {
            console.log('Processing email:', job.data);
            // Send email logic
          },
          concurrency: 10,
        },
      },
    },
  },
  redisClient
);

await client.initialize();

// Add jobs
await client.addJob('emails', 'welcome-email', { email: 'user@example.com' });

// Get queue/workers for advanced use
const queue = client.getQueue('emails');
const worker = client.getWorker('emails');

// Close connections
await client.close();
```

## API Reference

### `BullMQEventBus`

Event bus implementation using BullMQ queues.

#### Constructor

```typescript
constructor(
  config: BullMQEventBusConfig,
  options: BullMQEventBusOptions,
  redisClient?: RedisClient
)
```

**Config Parameters:**
- `config.connection` - Redis connection config (if not using redisClient)
- `config.queuePrefix` - Prefix for queue names (default: `'events'`)

**Options Parameters:**
- `serviceName` - Service name for event source attribution
- `serviceVersion` - Service version
- `jobOptions` - Default BullMQ job options (attempts, backoff, etc.)

#### Methods

##### `start(): Promise<void>`

Start the event bus and initialize workers.

##### `stop(): Promise<void>`

Stop the event bus and close all connections.

##### `emit<T>(event: T): Promise<void>`

Emit a domain event.

##### `emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void>`

Emit an event envelope.

##### `on<T>(eventType: string, handler: (event: T) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to events. Returns unsubscribe function.

##### `onEnvelope<T>(eventType: string, handler: (envelope: EventEnvelope<T>) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to event envelopes.

### `BullMQClient`

Low-level client for BullMQ queue and worker management.

#### Constructor

```typescript
constructor(
  config: BullMQConfig,
  redisClient?: RedisClient
)
```

**Config Parameters:**
- `connection` - Redis connection config
- `queues` - Queue configuration map

#### Methods

##### `initialize(): Promise<void>`

Initialize all configured queues, workers, and event listeners.

##### `getQueue<T>(key: string): Queue | undefined`

Get a queue by key.

##### `getWorker(key: string): Worker | undefined`

Get a worker by key.

##### `getQueueEvents(key: string): QueueEvents | undefined`

Get queue events listener by key.

##### `addJob(queueKey: string, jobName: string, data: any, opts?: any): Promise<void>`

Add a job to a queue.

##### `close(): Promise<void>`

Close all connections (queues, workers, events).

## Types

### `BullMQEventBusConfig`

```typescript
interface BullMQEventBusConfig {
  connection?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queuePrefix?: string;
}
```

### `BullMQEventBusOptions`

```typescript
interface BullMQEventBusOptions {
  serviceName: string;
  serviceVersion?: string;
  jobOptions?: JobsOptions;
}
```

### `BullMQConfig`

```typescript
interface BullMQConfig {
  connection?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queues: Record<string, BullMQQueueConfig>;
}
```

### `BullMQQueueConfig`

```typescript
interface BullMQQueueConfig {
  name: string;
  queueOptions?: any;
  workerOptions?: {
    processor: (job: any) => Promise<void>;
    concurrency?: number;
  };
}
```

## Queue Naming

Queues are named using the pattern: `{prefix}:{eventType}`

For example, with `queuePrefix: 'events'`:
- `UserCreated` event → `events:user.created`
- `OrderPlaced` event → `events:order.placed`

## Job Processing

Jobs are processed with the following default options:

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
}
```

Workers process jobs concurrently with a default concurrency of 5.

## Event Monitoring

The adapter logs the following events:
- Queue creation
- Worker creation
- Job waiting
- Job active
- Job completed
- Job failed

## Reconnecting

BullMQ handles automatic reconnection to Redis. If the connection is lost, jobs will be retried once the connection is restored.

## Best Practices

1. **Use Redis connection reuse**: Pass an existing Redis client when possible
2. **Set appropriate retry limits**: Configure `attempts` based on your use case
3. **Monitor failed jobs**: Implement error tracking for failed jobs
4. **Use job priorities**: For critical events, use BullMQ's priority feature
5. **Clean up old jobs**: Periodically remove completed jobs from Redis

## License

MIT
