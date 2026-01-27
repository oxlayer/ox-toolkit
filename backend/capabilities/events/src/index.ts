// Core event types
export * from './event.js';
export * from './envelope.js';

// Event bus contract
export * from './event-bus.js';

// Event publisher and subscriber
export * from './publisher.js';
export * from './subscriber.js';

// In-memory implementation (for testing)
export * from './in-memory-bus.js';

// Composite implementation (for multiple transports)
export * from './composite-bus.js';

// Instrumented implementation (for observability)
export * from './instrumented-bus.js';

/**
 * Event Bus Implementations
 *
 * This package provides the EventBus interface and core event primitives.
 *
 * For transport-specific implementations, use the separate adapter packages:
 *
 * - EventEmitterEventBus: import from '@oxlayer/capabilities-adapters-eventemitter' (in-process, built-in)
 * - RabbitMQEventBus: import from '@oxlayer/capabilities-adapters-rabbitmq' (AMQP messaging)
 * - BullMQEventBus: import from '@oxlayer/capabilities-adapters-bullmq' (Redis job queue)
 * - SQSEventBus: import from '@oxlayer/capabilities-adapters-sqs' (AWS cloud messaging)
 * - MQTTEventBus: import from '@oxlayer/capabilities-adapters-mqtt' (IoT/lightweight pub-sub)
 *
 * Example usage:
 *
 * ```ts
 * import { EventEmitterEventBus } from '@oxlayer/capabilities-adapters-eventemitter';
 *
 * const bus = new EventEmitterEventBus({ serviceName: 'my-service' });
 * await bus.start();
 *
 * // Emit events
 * await bus.emit({ type: 'UserCreated', data: { id: 1, name: 'John' } });
 *
 * // Subscribe to events
 * await bus.on('UserCreated', async (event) => {
 *   console.log('User created:', event);
 * });
 * ```
 */
