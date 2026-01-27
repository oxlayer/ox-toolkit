---
title: EventEmitter Event Bus
sidebar_label: EventEmitter
description: EventEmitter adapter for in-process event delivery using Node/Bun's built-in EventEmitter
---

# @oxlayer/capabilities-adapters-eventemitter

EventEmitter adapter for @oxlayer/capabilities event bus using Node/Bun's built-in EventEmitter. Ideal for single-process applications, testing, and development.

## Features

- In-process event delivery using EventEmitter
- Zero external dependencies
- Wildcard event subscriptions
- Error capture and handling
- Event envelope support
- Graceful shutdown
- Listener count management

## Installation

```bash
bun add @oxlayer/capabilities-adapters-eventemitter
```

## Usage

### Basic Setup

```typescript
import { createEventEmitterEventBus } from '@oxlayer/capabilities-adapters-eventemitter';

const eventBus = createEventEmitterEventBus({
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
});

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

### Wildcard Subscriptions

```typescript
// Subscribe to all events
await eventBus.onAll(async (event, envelope) => {
  console.log('Event received:', envelope.type, event);
});
```

### Error Handling

```typescript
// Subscribe to errors
eventBus.onError((error, envelope) => {
  console.error('Event error:', error, envelope);
});

// Disable error capture (errors will propagate)
const eventBus = createEventEmitterEventBus({
  serviceName: 'my-service',
  captureErrors: false,
});
```

### Advanced Usage

```typescript
const eventBus = createEventEmitterEventBus({
  serviceName: 'my-service',
  serviceVersion: '1.0.0',
  maxListeners: 100, // Increase listener limit
  captureErrors: true,
});

// Get listener count
const count = eventBus.listenerCount('UserCreated');

// Get all event names with listeners
const events = eventBus.eventNames();

// Access underlying EventEmitter
const emitter = eventBus.getEmitter();
```

### Envelope Subscriptions

```typescript
// Subscribe to full event envelopes
await eventBus.onEnvelope('UserCreated', async (envelope) => {
  console.log('Event type:', envelope.type);
  console.log('Event data:', envelope.data);
  console.log('Event metadata:', envelope.id, envelope.timestamp);
});
```

## API Reference

### `EventEmitterEventBus`

Event bus implementation using Node/Bun's EventEmitter.

#### Constructor

```typescript
constructor(options: EventEmitterEventBusOptions)
```

**Options:**
- `serviceName` - Service name for event source attribution (required)
- `serviceVersion` - Service version (optional)
- `maxListeners` - Maximum listeners per event (default: `100`)
- `captureErrors` - Enable error capture (default: `true`)

#### Methods

##### `start(): Promise<void>`

Start the event bus. Must be called before emitting/subscribing.

##### `stop(): Promise<void>`

Stop the event bus and remove all listeners.

##### `emit<T>(event: T): Promise<void>`

Emit a domain event.

##### `emitEnvelope<T>(envelope: EventEnvelope<T>): Promise<void>`

Emit an event envelope.

##### `on<T>(eventType: string, handler: (event: T) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to events. Returns unsubscribe function.

##### `onEnvelope<T>(eventType: string, handler: (envelope: EventEnvelope<T>) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to event envelopes.

##### `onAll<T>(handler: (event: T, envelope: EventEnvelope<T>) => Promise<void>): Promise<() => Promise<void>>`

Subscribe to all events (wildcard).

##### `onError(handler: (error: Error, envelope?: EventEnvelope) => Promise<void>): () => void`

Subscribe to errors. Returns unsubscribe function.

##### `getEmitter(): EventEmitter`

Get the underlying EventEmitter for advanced usage.

##### `listenerCount(eventType: string): number`

Get listener count for an event.

##### `eventNames(): string[]`

Get all event names with listeners.

## Event Flow

1. Emit: `eventBus.emit(event)`
2. Create envelope with source attribution
3. Emit to both data listeners and envelope listeners
4. Emit to wildcard listeners (`*` and `*:envelope`)
5. Emit to error listeners if exception occurs

## Wildcard Events

The adapter supports wildcard subscriptions:

```typescript
// Subscribe to all event data
await eventBus.on('*', async (event) => {
  console.log('Any event:', event);
});

// Subscribe to all event envelopes
await eventBus.on('*:envelope', async (envelope) => {
  console.log('Any envelope:', envelope.type);
});
```

## Graceful Shutdown

The adapter automatically handles process termination:

```typescript
// Hooks into:
process.on('beforeexit', ...);
process.on('SIGINT', ...);
process.on('SIGTERM', ...);
```

## Error Handling

When `captureErrors` is enabled (default), errors in handlers are caught:

```typescript
eventBus.on('ErrorEvent', async (event) => {
  throw new Error('Handler error');
});

eventBus.onError((error, envelope) => {
  console.error('Caught error:', error);
});
```

When `captureErrors` is disabled, errors propagate:

```typescript
const eventBus = createEventEmitterEventBus({
  serviceName: 'my-service',
  captureErrors: false,
});

// Errors will be thrown and need to be caught
```

## Limitations

- **In-process only**: Events are NOT persisted
- **No cross-process delivery**: Use RabbitMQ/BullMQ/SQS for distributed systems
- **No guaranteed delivery**: If handler throws, subsequent handlers may not run
- **No retries**: Failed events are not retried

## Best Practices

1. **Use for testing**: Perfect for unit and integration tests
2. **Development only**: Don't use in production distributed systems
3. **Handle errors**: Always implement error handlers
4. **Unsubscribe**: Call unsubscribe function when done
5. **Monitor listeners**: Check `listenerCount` to prevent memory leaks

## When to Use

- **Good for**: Single-process applications, testing, development
- **Not good for**: Distributed systems, production event sourcing, microservices

## Alternatives

For production distributed systems, consider:
- **RabbitMQ**: For reliable messaging with exchanges
- **BullMQ**: For job queues with retries
- **SQS**: For AWS-based messaging
- **MQTT**: For IoT and lightweight messaging
