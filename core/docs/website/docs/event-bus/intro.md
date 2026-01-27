# Event Bus

OxLayer event bus adapters provide a unified interface for pub/sub messaging across different backends. Switch between in-process, Redis-based, and cloud messaging without changing your application code.

## Overview

Event bus implementations:

### In-Process
- **EventEmitter** - Node/Bun EventEmitter for synchronous in-process events

### Cloud-Based
- **BullMQ** - Reliable event delivery with Redis
- **RabbitMQ** - AMQP-based messaging with exchanges and queues
- **SQS** - AWS SQS for reliable cloud messaging
- **MQTT** - Lightweight messaging for IoT and edge devices

### Scheduling
- **BullMQ Scheduler** - Cron and interval-based job scheduling

## Installation

```bash
# Install an event bus adapter
pnpm add @oxlayer/capabilities-eventbus-bullmq

# Install the scheduler
pnpm add @oxlayer/capabilities-eventbus-bullmq-scheduler
```

## Common API

All event buses implement the same interface:

```typescript
interface EventBus {
  // Subscribe to events
  subscribe(event: string, handler: (data: any) => void | Promise<void>): void;

  // Publish events
  publish(event: string, data: any): Promise<void>;

  // Unsubscribe
  unsubscribe(event: string, handler?: Function): void;

  // Disconnect
  disconnect(): Promise<void>;
}
```

## Usage Example

```typescript
import { createBullMQEventBus } from '@oxlayer/capabilities-eventbus-bullmq';

const eventBus = createBullMQEventBus({
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  },
});

// Subscribe to events
eventBus.subscribe('user.created', async (data) => {
  console.log('New user:', data);
});

// Publish events
await eventBus.publish('user.created', {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
});
```

## Choosing an Event Bus

### EventEmitter
- **Best for:** Simple in-process communication
- **Pros:** No external dependencies, synchronous
- **Cons:** No persistence, single-process only

### BullMQ
- **Best for:** Reliable event delivery with Redis
- **Pros:** Job queues, retries, dead letter queues
- **Cons:** Requires Redis

### RabbitMQ
- **Best for:** Complex routing with exchanges
- **Pros:** Flexible routing, acknowledgments
- **Cons:** Requires RabbitMQ broker

### SQS
- **Best for:** AWS-native applications
- **Pros:** Serverless, auto-scaling
- **Cons:** AWS vendor lock-in

### MQTT
- **Best for:** IoT and edge devices
- **Pros:** Lightweight, QoS levels
- **Cons:** Requires MQTT broker

## Next Steps

Explore specific event bus implementations:
- [BullMQ Event Bus](./bullmq)
- [RabbitMQ Event Bus](./rabbitmq)
- [SQS Event Bus](./sqs)
- [BullMQ Scheduler](./bullmq-scheduler)
