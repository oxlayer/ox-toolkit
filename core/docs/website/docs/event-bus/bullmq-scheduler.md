---
title: BullMQ Scheduler
sidebar_label: BullMQ Scheduler
description: BullMQ scheduler adapter for scheduled job execution with interval-based and cron-based scheduling
---

# @oxlayer/capabilities-adapters-bullmq-scheduler

BullMQ scheduler adapter for @oxlayer/capabilities. Provides scheduled job execution using BullMQ's job schedulers with support for interval-based, cron-based, and custom scheduling strategies.

## Features

- Schedule recurring jobs using "every" interval strategy
- Schedule jobs using cron expressions
- Support for custom repeat strategies (e.g., RRULE)
- Redis connection reuse from existing Redis client
- Job scheduler management (create, update, remove, list)
- Next run time tracking
- Timezone support

## Installation

```bash
bun add @oxlayer/capabilities-adapters-bullmq-scheduler
```

## Dependencies

Requires Redis and the Redis adapter:

```bash
bun add @oxlayer/capabilities-adapters-redis bullmq
```

## Usage

### Basic Usage with Redis Client

```typescript
import { createBullMQScheduler } from '@oxlayer/capabilities-adapters-bullmq-scheduler';
import { createDefaultRedisClient } from '@oxlayer/capabilities-adapters-redis';

const redisClient = createDefaultRedisClient();

const scheduler = createBullMQScheduler({
  redisClient,
  queueName: 'scheduled-jobs',
});

// Schedule a job every minute
await scheduler.schedule('cleanup', {
  every: 60_000,
}, {
  name: 'cleanup-task',
  data: { type: 'logs' },
});

// Schedule with cron (9 AM weekdays)
await scheduler.schedule('reports', {
  pattern: '0 0 9 * * 1-5',
}, {
  name: 'daily-report',
  data: { format: 'pdf' },
});

// Get scheduler info
const info = await scheduler.get('cleanup');
console.log(info?.next); // Next run timestamp

// List all schedulers
const schedulers = await scheduler.list();

// Remove a scheduler
await scheduler.remove('cleanup');

await scheduler.close();
```

### Using Connection Config

```typescript
const scheduler = createBullMQScheduler({
  connection: {
    host: 'localhost',
    port: 6379,
    password: 'optional-password',
    db: 0,
  },
  queueName: 'my-jobs',
});
```

### Advanced Scheduling Options

```typescript
// Schedule with start/end dates
await scheduler.schedule('seasonal-job', {
  every: 24 * 60 * 60 * 1000, // Daily
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  tz: 'America/New_York',
}, {
  name: 'yearly-task',
  data: { year: 2024 },
});

// Schedule with limit
await scheduler.schedule('limited-job', {
  every: 60_000,
  limit: 100, // Run only 100 times
}, {
  name: 'limited-task',
});
```

### Custom Repeat Strategy (RRULE)

```typescript
import { createBullMQScheduler, createRRuleStrategy } from '@oxlayer/capabilities-adapters-bullmq-scheduler';
import { rrulestr } from 'rrule';

const scheduler = createBullMQScheduler({
  redisClient,
  repeatStrategy: (millis, opts) => {
    const currentDate = opts.startDate && new Date(opts.startDate) > new Date(millis)
      ? new Date(opts.startDate)
      : new Date(millis);

    const rrule = rrulestr(opts.pattern);
    const next = rrule.after(currentDate, false);
    return next?.getTime();
  },
});

// Schedule using RRULE pattern
await scheduler.schedule('complex-schedule', {
  pattern: 'DTSTART=20240101T090000Z RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR',
}, {
  name: 'monday-wednesday-friday-task',
});
```

## API Reference

### `BullMQScheduler`

Main scheduler class.

#### Constructor

```typescript
constructor(options: BullMQSchedulerOptions)
```

**Options:**
- `redisClient` - Redis client for connection reuse
- `connection` - Redis connection config (if not using redisClient)
- `queueName` - Queue name for scheduled jobs (default: `'scheduled-jobs'`)
- `repeatStrategy` - Custom repeat strategy function
- `settings` - Additional BullMQ queue settings

#### Methods

##### `schedule(key: string, repeat: RepeatOptions, job: ScheduledJob): Promise<void>`

Schedule a job to repeat based on the provided options.

**Parameters:**
- `key` - Unique identifier for the scheduler
- `repeat` - Repeat options (every, pattern, or custom)
- `job` - Job definition with name, data, and opts

##### `update(key: string, repeat: RepeatOptions, job: ScheduledJob): Promise<void>`

Update an existing scheduler or create if it doesn't exist.

##### `remove(key: string): Promise<boolean>`

Remove a scheduler by its key. Returns `true` if removed, `false` if not found.

##### `get(key: string): Promise<JobScheduler | undefined>`

Get a scheduler by its key.

**Returns:**
- `key` - Scheduler identifier
- `repeat` - Repeat options
- `job` - Job definition
- `next` - Next run timestamp
- `created` - Creation timestamp

##### `list(options?: SchedulerListOptions): Promise<JobScheduler[]>`

List all schedulers with optional pagination.

**Options:**
- `start` - Start index (default: 0)
- `end` - End index (default: 99)
- `ascending` - Sort order (default: true)

##### `removeAll(): Promise<number>`

Remove all schedulers. Returns number of schedulers removed.

##### `close(): Promise<void>`

Close the underlying queue connection.

##### `getQueue(): Queue`

Get the underlying BullMQ queue for advanced operations.

## Types

### `BullMQSchedulerOptions`

```typescript
interface BullMQSchedulerOptions {
  redisClient?: RedisClient;
  connection?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  queueName?: string;
  repeatStrategy?: (
    millis: number,
    opts: RepeatOptions,
    jobName: string,
  ) => number | undefined;
  settings?: {
    repeatStrategy?: (
      millis: number,
      opts: any,
      jobName: string,
    ) => number | undefined;
  };
}
```

### `RepeatOptions`

```typescript
type RepeatOptions =
  | { every: number; startDate?: Date; endDate?: Date; limit?: number; tz?: string }
  | { pattern: string; startDate?: Date; endDate?: Date; limit?: number; tz?: string };
```

### `ScheduledJob`

```typescript
interface ScheduledJob {
  name: string;
  data: any;
  opts?: any;
}
```

### `JobScheduler`

```typescript
interface JobScheduler {
  key: string;
  repeat: RepeatOptions;
  job: ScheduledJob;
  next?: number;
  created?: number;
}
```

## Repeat Strategies

### "Every" Strategy

Schedule jobs at fixed intervals:

```typescript
{
  every: 60_000, // Every minute
}
```

### "Pattern" Strategy (Cron)

Schedule jobs using cron expressions:

```typescript
{
  pattern: '0 0 9 * * 1-5', // 9 AM weekdays
}
```

### Custom Strategy

Implement custom scheduling logic:

```typescript
{
  repeatStrategy: (millis, opts) => {
    // Custom logic to calculate next run time
    return nextRunTimestamp;
  },
}
```

## Cron Expression Format

The adapter supports standard cron expressions with 6 fields:

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └─ Day of week (0-7, Sunday = 0 or 7)
│ │ │ │ └─── Month (1-12)
│ │ │ └───── Day of month (1-31)
│ │ └─────── Hour (0-23)
│ └───────── Minute (0-59)
└─────────── Second (0-59)
```

## Timezone Support

Specify timezones for scheduled jobs:

```typescript
await scheduler.schedule('tz-job', {
  every: 60 * 60 * 1000, // Hourly
  tz: 'America/New_York',
}, {
  name: 'hourly-task',
});
```

## Best Practices

1. **Use unique keys**: Each scheduler must have a unique key
2. **Set reasonable limits**: Use `limit` for jobs that shouldn't run forever
3. **Handle job failures**: Implement error handling in your workers
4. **Monitor schedulers**: Check `next` run times to verify scheduling
5. **Clean up old schedulers**: Remove schedulers that are no longer needed
