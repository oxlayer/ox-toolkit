# @oxlayer/capabilities-adapters-rabbitmq

RabbitMQ adapter for @oxlayer/capabilities event bus. Provides reliable event delivery with exchanges, queues, and routing using AMQP protocol.

## Features

- RabbitMQ-based event bus using topic exchanges
- Support for direct, topic, fanout, and headers exchanges
- Durable queues and exchanges
- Connection management with auto-reconnect
- Queue and exchange declaration
- Message publishing with routing keys
- Integration with @oxlayer/capabilities-queues for advanced queue management

## Installation

```bash
bun add @oxlayer/capabilities-adapters-rabbitmq
```

## Dependencies

```bash
bun add amqplib
```

## Usage

### Basic Event Bus Setup

```typescript
import { createRabbitMQEventBus } from '@oxlayer/capabilities-adapters-rabbitmq';

const eventBus = createRabbitMQEventBus(
  {
    url: 'amqp://guest:guest@localhost',
    exchange: 'events',
    exchangeType: 'topic',
    queue: 'my-service-events',
    routingKey: '#',
    durable: true,
  },
  {
    serviceName: 'my-service',
    serviceVersion: '1.0.0',
    routingKeyPattern: '{eventType}',
  }
);

// Start the event bus
await eventBus.start();

// Emit events
await eventBus.emit({ type: 'UserCreated', data: { userId: '123' } });

// Or publish directly with explicit exchange and routing key
await eventBus.publish('events', 'user.created', {
  userId: '123',
  email: 'user@example.com',
});

// Stop when done
await eventBus.stop();
```

### Publishing Events

You have two ways to publish events:

#### Using `emit()` - Type-safe Domain Events

```typescript
// Define a DomainEvent class
class UserCreatedEvent {
  type = 'UserCreated';
  data = {
    userId: '123',
    email: 'user@example.com',
    name: 'John Doe',
  };
}

// Emit - envelope and routing key are created automatically
await eventBus.emit(new UserCreatedEvent());
```

#### Using `publish()` - Direct Publishing

```typescript
// Publish directly with explicit parameters
await eventBus.publish(
  'my-app.events',     // exchange
  'user.created',      // routing key
  {                    // payload
    userId: '123',
    email: 'user@example.com',
    name: 'John Doe',
  }
);
```

**When to use each:**
- Use `emit()` for type-safe events with DomainEvent classes
- Use `publish()` for simple, direct event publishing without class definitions

### Exchange Types

```typescript
// Topic exchange (default for event routing)
const eventBus = createRabbitMQEventBus(
  {
    url: 'amqp://localhost',
    exchange: 'events',
    exchangeType: 'topic',
  },
  { serviceName: 'my-service' }
);

// Fanout exchange (broadcast to all queues)
const broadcastBus = createRabbitMQEventBus(
  {
    url: 'amqp://localhost',
    exchange: 'broadcast',
    exchangeType: 'fanout',
  },
  { serviceName: 'my-service' }
);

// Direct exchange (exact routing key matching)
const directBus = createRabbitMQEventBus(
  {
    url: 'amqp://localhost',
    exchange: 'commands',
    exchangeType: 'direct',
  },
  { serviceName: 'my-service' }
);
```

### Using Direct Client

```typescript
import { RabbitMQClient } from '@oxlayer/capabilities-adapters-rabbitmq';

const client = new RabbitMQClient(
  {
    hostname: 'localhost',
    port: 5672,
    username: 'guest',
    password: 'guest',
    vhost: '/',
  },
  {
    events: {
      name: 'events',
      type: 'topic',
      options: { durable: true },
    },
  },
  {
    events: {
      name: 'my-service-queue',
      routingKey: 'events.#',
      options: { durable: true },
    },
  }
);

await client.connect();

// Publish message
await client.publish('user.created', { userId: '123', name: 'John' });

// Close connection
await client.close();
```

### Connection URL Format

```typescript
// Full connection URL
const url = 'amqp://username:password@hostname:port/vhost';

// Examples
'amqp://guest:guest@localhost:5672/'
'amqp://user:pass@rabbitmq.example.com:5672/myapp'
'amqps://user:pass@secure-rabbitmq.example.com:5671/' // SSL
```

### Custom Configuration

```typescript
const client = new RabbitMQClient(
  {
    hostname: 'rabbitmq.example.com',
    port: 5672,
    username: 'myapp',
    password: 'secret',
    vhost: '/production',
  },
  {
    // Define exchanges
    events: {
      name: 'domain-events',
      type: 'topic',
      options: {
        durable: true,
        autoDelete: false,
        internal: false,
      },
    },
    commands: {
      name: 'commands',
      type: 'direct',
      options: { durable: true },
    },
  },
  {
    // Define queues and bindings
    eventHandlers: {
      name: 'event-handler-queue',
      routingKey: 'events.#',
      options: { durable: true },
    },
    commandProcessor: {
      name: 'command-queue',
      routingKey: 'commands.process',
      options: { durable: true },
    },
  }
);
```

## API Reference

### `RabbitMQEventBus`

Event bus implementation using RabbitMQ.

#### Constructor

```typescript
constructor(
  config: RabbitMQEventBusConfig,
  options: RabbitMQEventBusOptions
)
```

**Config:**
- `url` - RabbitMQ connection URL
- `exchange` - Exchange name
- `exchangeType` - Exchange type: `'direct'` | `'topic'` | `'fanout'` | `'headers'` (default: `'topic'`)
- `queue` - Optional queue name for consuming events
- `routingKey` - Queue binding routing key (default: `'#'`)
- `durable` - Create durable resources (default: `true`)
- `autoDelete` - Auto-delete resources (default: `false`)

**Options:**
- `serviceName` - Service name for event source attribution
- `serviceVersion` - Service version
- `routingKeyPattern` - Custom routing key pattern with `{eventType}` placeholder

#### Methods

##### `start(): Promise<void>`

Start the event bus and connect to RabbitMQ.

##### `stop(): Promise<void>`

Stop the event bus and close connection.

##### `emit<T>(event: T): Promise<void>`

Emit a domain event. The event envelope is created automatically with a unique ID, timestamp, and proper routing key generation.

##### `emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void>`

Emit an event envelope directly.

##### `publish(exchange: string, routingKey: string, payload: any): Promise<void>`

Publish a message directly to a specific exchange with an explicit routing key and payload. This method creates the event envelope automatically and provides a simple way to publish events without defining DomainEvent classes.

```typescript
await eventBus.publish('acme.events', 'exam.assigned', {
  assignmentId: '123',
  examId: 'exam-001',
  candidateId: 'candidate-001',
});
```

##### `getClient(): RabbitMQClient`

Get the underlying RabbitMQ client.

##### `getChannel(): any`

Get the raw AMQP channel for advanced operations.

### `RabbitMQClient`

Low-level RabbitMQ client.

#### Constructor

```typescript
constructor(
  connectionConfig: RabbitMQConnectionConfig,
  exchanges: Record<string, RabbitMQExchangeConfig>,
  queues: Record<string, RabbitMQQueueConfig>
)
```

#### Methods

##### `connect(): Promise<void>`

Connect to RabbitMQ and declare exchanges/queues.

##### `publish(routingKey: string, message: any): Promise<void>`

Publish a message to an exchange.

##### `close(): Promise<void>`

Close the connection.

## Types

### `RabbitMQConnectionConfig`

```typescript
interface RabbitMQConnectionConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
  vhost: string;
}
```

### `RabbitMQExchangeConfig`

```typescript
interface RabbitMQExchangeConfig {
  name: string;
  type: 'direct' | 'topic' | 'fanout' | 'headers';
  options?: {
    durable?: boolean;
    autoDelete?: boolean;
    internal?: boolean;
  };
}
```

### `RabbitMQQueueConfig`

```typescript
interface RabbitMQQueueConfig {
  name: string;
  routingKey: string;
  options?: {
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
  };
}
```

## Routing Key Format

Event types are converted to routing keys:

```typescript
// Event type: UserCreated
// Routing key: user.created

// Event type: OrderPlaced
// Routing key: order.placed
```

Custom routing key pattern:

```typescript
const eventBus = createRabbitMQEventBus(
  { url: 'amqp://localhost', exchange: 'events' },
  {
    serviceName: 'my-service',
    routingKeyPattern: 'app.{eventType}', // app.user.created
  }
);
```

## Exchange Types

### Topic Exchange (default)

Routes messages based on pattern matching in routing keys:

```
user.created       -> matches: user.*, *.created, #
user.created.email -> matches: user.#, *.*.*
```

### Direct Exchange

Routes messages based on exact routing key match:

```
process.order     -> matches: process.order only
```

### Fanout Exchange

Broadcasts messages to all bound queues:

```
any message       -> delivered to all bound queues
```

## Best Practices

1. **Use topic exchanges**: For flexible event routing
2. **Make resources durable**: Prevent data loss on restart
3. **Use meaningful routing keys**: Enable complex routing patterns
4. **Monitor queue depths**: Prevent memory issues
5. **Connection is resilient**: The `publish()` method automatically attempts to reconnect if the connection is lost

## When to Use

- **Good for**: Complex routing, message transformation, pub/sub patterns
- **Not good for**: Simple FIFO queues (use BullMQ), AWS environments (use SQS)

## Alternatives

- **BullMQ**: For job queues with retries
- **SQS**: For AWS-based messaging
- **MQTT**: For IoT and lightweight messaging

## License

MIT
