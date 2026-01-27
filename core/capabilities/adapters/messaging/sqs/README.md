# @oxlayer/capabilities-adapters-sqs

SQS adapter for @oxlayer/capabilities event bus. Provides reliable event delivery using AWS SQS queues with built-in retries and persistence.

## Features

- SQS-based event bus using AWS SQS queues
- Reliable message delivery with AWS infrastructure
- Built-in retry logic and dead letter queues
- Long polling for reduced cost
- Message visibility timeout
- Batch operations
- Integration with @oxlayer/capabilities-queues for advanced queue management

## Installation

```bash
bun add @oxlayer/capabilities-adapters-sqs
```

## Dependencies

```bash
bun add @aws-sdk/client-sqs
```

## Usage

### Basic Event Bus Setup

```typescript
import { createSQSEventBus } from '@oxlayer/capabilities-adapters-sqs';

const eventBus = createSQSEventBus(
  {
    connection: {
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'your-key',
        secretAccessKey: 'your-secret',
      },
    },
    queues: {
      'user-events': {
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/user-events',
      },
      'order-events': {
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/order-events',
      },
    },
  },
  {
    serviceName: 'my-service',
    serviceVersion: '1.0.0',
    publishOptions: {
      delaySeconds: 0,
    },
  }
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

### Using Direct Client

```typescript
import { SQSClient } from '@oxlayer/capabilities-adapters-sqs';

const client = new SQSClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'your-key',
    secretAccessKey: 'your-secret',
  },
});

// Define queues
await client.connect({
  'main-queue': {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/main-queue',
  },
});

// Publish message
await client.publish('main-queue', { message: 'hello' });

// Receive messages
const messages = await client.receive('main-queue', {
  maxMessages: 10,
  waitTimeSeconds: 20,
});

// Process and delete messages
for (const message of messages) {
  console.log(message.Body);
  await client.deleteMessage('main-queue', message.ReceiptHandle);
}

// Close connection
await client.close();
```

### Environment Variables

```typescript
// AWS credentials from environment:
// AWS_REGION=us-east-1
// AWS_ACCESS_KEY_ID=your-key
// AWS_SECRET_ACCESS_KEY=your-secret

// Or use IAM roles in EC2/Lambda
```

### Advanced Configuration

```typescript
const eventBus = createSQSEventBus(
  {
    connection: {
      region: 'us-east-1',
    },
    queues: {
      'events': {
        queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/events',
      },
    },
  },
  {
    serviceName: 'my-service',
    publishOptions: {
      delaySeconds: 0,
      messageAttributes: {
        contentType: { stringValue: 'application/json', dataType: 'String' },
      },
    },
  }
);
```

## API Reference

### `SQSEventBus`

Event bus implementation using AWS SQS.

#### Constructor

```typescript
constructor(
  config: SQSEventBusConfig,
  options: SQSEventBusOptions
)
```

**Config:**
- `connection` - AWS connection configuration
  - `region` - AWS region
  - `credentials` - AWS credentials (accessKeyId, secretAccessKey)
- `queues` - Queue configuration map with queue URLs

**Options:**
- `serviceName` - Service name for event source attribution
- `serviceVersion` - Service version
- `publishOptions` - Default publish options (delaySeconds, etc.)

#### Methods

##### `start(): Promise<void>`

Start the event bus and begin polling.

##### `stop(): Promise<void>`

Stop the event bus and stop polling.

##### `emit<T>(event: T): Promise<void>`

Emit a domain event.

##### `emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void>`

Emit an event envelope.

##### `on<T>(eventType: string, handler: (event: T) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to events by polling queue. Returns unsubscribe function.

##### `onEnvelope<T>(eventType: string, handler: (envelope: EventEnvelope<T>) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to event envelopes.

##### `getClient(): SQSClient`

Get the underlying SQS client.

### `SQSClient`

Low-level SQS client.

#### Constructor

```typescript
constructor(config: SQSConnectionConfig)
```

#### Methods

##### `connect(queues: Record<string, SQSQueueConfig>): Promise<void>`

Connect to SQS and configure queues.

##### `publish(queueKey: string, message: any, options?): Promise<void>`

Publish a message to a queue.

##### `receive(queueKey: string, options?): Promise<SQSMessage[]>`

Receive messages from a queue.

##### `deleteMessage(queueKey: string, receiptHandle: string): Promise<void>`

Delete a message from a queue.

##### `close(): Promise<void>`

Close the SQS connection.

## Types

### `SQSConnectionConfig`

```typescript
interface SQSConnectionConfig {
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}
```

### `SQSQueueConfig`

```typescript
interface SQSQueueConfig {
  queueUrl: string;
}
```

### `SQSPublishOptions`

```typescript
interface SQSPublishOptions {
  delaySeconds?: number;
  messageAttributes?: Record<string, {
    stringValue?: string;
    binaryValue?: Buffer;
    stringListValues?: string[];
    binaryListValues?: Buffer[];
    dataType: 'String' | 'Binary' | 'Number';
  }>;
}
```

### `SQSMessage`

```typescript
interface SQSMessage {
  MessageId: string;
  ReceiptHandle: string;
  Body: any;
  Attributes: Record<string, any>;
  MessageAttributes: Record<string, any>;
}
```

## Queue Naming

Event types are converted to queue keys:

```typescript
// Event type: UserCreated
// Queue key: user-created

// Event type: OrderPlaced
// Queue key: order-placed
```

The queue key is used to look up the queue URL from the configured queues map.

## Receiving Messages

The adapter uses long polling by default:

```typescript
const messages = await client.receive('main-queue', {
  maxMessages: 10,      // Maximum messages to receive
  waitTimeSeconds: 20,  // Long polling duration
  visibilityTimeout: 30, // Message visibility timeout
});
```

## Best Practices

1. **Use long polling**: Reduce cost and latency with `waitTimeSeconds`
2. **Delete messages**: Always delete after processing
3. **Handle errors**: Implement retry logic for failed processing
4. **Use dead letter queues**: Configure for failed messages
5. **Monitor queue depth**: Track queue size for scaling

## When to Use

- **Good for**: AWS-based architectures, distributed systems, reliable messaging
- **Not good for**: Low-latency requirements (use Redis/MQTT), simple in-process queues

## Alternatives

- **RabbitMQ**: For complex routing and exchanges
- **BullMQ**: For job queues with Redis backend
- **MQTT**: For IoT and lightweight messaging

## License

MIT
