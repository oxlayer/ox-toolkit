# @oxlayer/capabilities-adapters-mqtt

MQTT adapter for @oxlayer/capabilities event bus. Compatible with all MQTT 3.1.1/5.0 brokers including Mosquitto, HiveMQ, EMQX, RabbitMQ (with MQTT plugin), ActiveMQ Artemis, and VerneMQ.

## Features

- MQTT-based event bus using publish/subscribe pattern
- Compatible with all MQTT 3.1.1/5.0 brokers
- Lightweight and efficient messaging
- Wildcard subscriptions
- QoS support (0, 1, 2)
- Retain messages
- Last Will and Testament
- Automatic reconnection
- TLS/SSL support

## Installation

```bash
bun add @oxlayer/capabilities-adapters-mqtt
```

## Dependencies

```bash
bun add mqtt
```

## Usage

### Basic Event Bus Setup

```typescript
import { createMQTTEventBus } from '@oxlayer/capabilities-adapters-mqtt';

const eventBus = createMQTTEventBus(
  {
    connection: {
      hostname: 'localhost',
      port: 1883,
      protocol: 'mqtt',
    },
    topicPrefix: 'events',
  },
  {
    serviceName: 'my-service',
    serviceVersion: '1.0.0',
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

### Connection Options

```typescript
const eventBus = createMQTTEventBus(
  {
    connection: {
      hostname: 'broker.example.com',
      port: 8883,
      protocol: 'mqtts', // Secure MQTT
      username: 'user',
      password: 'pass',
    },
    topicPrefix: 'myapp/events',
  },
  {
    serviceName: 'my-service',
    publishOptions: {
      qos: 1,
      retain: false,
    },
  }
);
```

### Wildcard Subscriptions

```typescript
// Subscribe to all events
await eventBus.onAll(async (event, envelope) => {
  console.log('Event received:', envelope.type, event);
});
```

### Topic Naming

Topics are automatically generated from event types:

```typescript
// Event type: UserCreated
// Topic: events/user.created

// Event type: OrderPlaced
// Topic: events/order.placed
```

Customize topic prefix:

```typescript
const eventBus = createMQTTEventBus(
  { connection: {...}, topicPrefix: 'myapp/events' },
  { serviceName: 'my-service' }
);

// Now topics are: myapp/events/user.created
```

### Using Direct Client

```typescript
import { MQTTClient } from '@oxlayer/capabilities-adapters-mqtt';

const client = new MQTTClient({
  hostname: 'localhost',
  port: 1883,
  protocol: 'mqtt',
});

await client.connect();

// Publish
await client.publish('my/topic', { message: 'hello' }, { qos: 1 });

// Subscribe
await client.subscribe('my/topic', async (topic, message) => {
  console.log('Received:', topic, message);
});

// Unsubscribe
await client.unsubscribe('my/topic');

// End connection
await client.end();
```

## API Reference

### `MQTTEventBus`

Event bus implementation using MQTT.

#### Constructor

```typescript
constructor(
  config: MQTTEventBusConfig,
  options: MQTTEventBusOptions
)
```

**Config:**
- `connection` - MQTT connection config
  - `hostname` - Broker hostname
  - `port` - Broker port (default: `1883`)
  - `protocol` - `mqtt` or `mqtts` (default: `mqtt`)
  - `username` - Optional username
  - `password` - Optional password
- `topicPrefix` - Prefix for all topics (default: `'events'`)

**Options:**
- `serviceName` - Service name for event source attribution
- `serviceVersion` - Service version
- `publishOptions` - Default publish options (qos, retain)

#### Methods

##### `start(): Promise<void>`

Start the event bus and connect to broker.

##### `stop(): Promise<void>`

Stop the event bus and disconnect.

##### `emit<T>(event: T): Promise<void>`

Emit a domain event.

##### `emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void>`

Emit an event envelope.

##### `on<T>(eventType: string, handler: (event: T) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to events. Returns unsubscribe function.

##### `onEnvelope<T>(eventType: string, handler: (envelope: EventEnvelope<T>) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to event envelopes.

##### `onAll<T>(handler: (event: T, envelope: EventEnvelope<T>) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to all events using MQTT wildcard.

##### `getClient(): MQTTClient`

Get the underlying MQTT client.

### `MQTTClient`

Low-level MQTT client.

#### Constructor

```typescript
constructor(config: MQTTConnectionConfig)
```

#### Methods

##### `connect(): Promise<void>`

Connect to the broker.

##### `end(): Promise<void>`

Disconnect from the broker.

##### `publish(topic: string, message: any, options?: MQTTPublishOptions): Promise<void>`

Publish a message to a topic.

##### `subscribe(topic: string, callback: (topic: string, message: any) => void): Promise<void>`

Subscribe to a topic.

##### `unsubscribe(topic: string): Promise<void>`

Unsubscribe from a topic.

## Types

### `MQTTConnectionConfig`

```typescript
interface MQTTConnectionConfig {
  hostname: string;
  port?: number;
  protocol?: 'mqtt' | 'mqtts' | 'ws' | 'wss';
  username?: string;
  password?: string;
  clientId?: string;
  clean?: boolean;
  keepalive?: number;
}
```

### `MQTTPublishOptions`

```typescript
interface MQTTPublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
  dup?: boolean;
}
```

## Topic Structure

Topics follow this pattern:

```
{prefix}/{event-type}
```

Examples:
- `events/user.created`
- `events/order.placed`
- `events/payment.completed`

## Broker Compatibility

The adapter works with all MQTT 3.1.1/5.0 brokers:

### Mosquitto

```typescript
const eventBus = createMQTTEventBus(
  { connection: { hostname: 'localhost', port: 1883 } },
  { serviceName: 'my-service' }
);
```

### HiveMQ

```typescript
const eventBus = createMQTTEventBus(
  { connection: { hostname: 'broker.hivemq.com', port: 1883 } },
  { serviceName: 'my-service' }
);
```

### EMQX

```typescript
const eventBus = createMQTTEventBus(
  { connection: { hostname: 'localhost', port: 1883 } },
  { serviceName: 'my-service' }
);
```

### RabbitMQ (with MQTT plugin)

```typescript
const eventBus = createMQTTEventBus(
  { connection: { hostname: 'localhost', port: 1883 } },
  { serviceName: 'my-service' }
);
```

### VerneMQ

```typescript
const eventBus = createMQTTEventBus(
  { connection: { hostname: 'localhost', port: 1883 } },
  { serviceName: 'my-service' }
);
```

## QoS Levels

Quality of Service levels:

- **0**: At most once (fire and forget)
- **1**: At least once (acknowledged delivery)
- **2**: Exactly once (assured delivery)

```typescript
const eventBus = createMQTTEventBus(
  { connection: {...} },
  {
    serviceName: 'my-service',
    publishOptions: { qos: 1 },
  }
);
```

## TLS/SSL

Use secure MQTT:

```typescript
const eventBus = createMQTTEventBus(
  {
    connection: {
      hostname: 'broker.example.com',
      port: 8883,
      protocol: 'mqtts',
    },
  },
  { serviceName: 'my-service' }
);
```

## Best Practices

1. **Use appropriate QoS**: QoS 1 for most cases, QoS 2 for critical messages
2. **Set reasonable keepalive**: Default is 60 seconds
3. **Use wildcards carefully**: `#` matches all subtopics
4. **Handle reconnection**: Client auto-reconnects on disconnect
5. **Monitor connection**: Check broker logs for connection issues

## When to Use

- **Good for**: IoT, lightweight messaging, pub/sub patterns, low-bandwidth networks
- **Not good for**: Complex routing, message transformation, guaranteed ordering

## Alternatives

- **RabbitMQ**: For complex routing and exchanges
- **BullMQ**: For job queues with retries
- **SQS**: For AWS-based messaging

## License

MIT
