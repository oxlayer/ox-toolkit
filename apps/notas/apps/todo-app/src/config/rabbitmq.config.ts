/**
 * RabbitMQ Event Bus Configuration
 */

import { createRabbitMQEventBus } from '@oxlayer/capabilities-adapters-rabbitmq';
import { ENV } from './app.config.js';
import { getTelemetryClient } from './metrics.config.js';

/**
 * Create RabbitMQ event bus
 *
 * Sets up:
 * - Connection to RabbitMQ
 * - Event exchange
 * - Event queue
 * - Message routing
 * - OpenTelemetry tracing for messaging operations
 */
export async function createEventBus() {
  // Build RabbitMQ URL from environment variables
  const rabbitmqUrl = `amqp://${ENV.RABBITMQ_USERNAME}:${ENV.RABBITMQ_PASSWORD}@${ENV.RABBITMQ_HOST}:${ENV.RABBITMQ_PORT}${ENV.RABBITMQ_VHOST}`;

  // Get tracer from telemetry client
  const telemetryClient = getTelemetryClient();
  const tracer = telemetryClient?.getTracer() || null;

  const eventBus = createRabbitMQEventBus(
    {
      url: rabbitmqUrl,
      exchange: 'todo.events',
      exchangeType: 'topic',
      queue: ENV.RABBITMQ_QUEUE,
      routingKey: 'todo.*',
      durable: true,
      autoDelete: false,
      heartbeat: 10
    },
    {
      serviceName: 'todo-app',
      serviceVersion: '1.0.0',
      tracer, // Pass tracer for instrumentation
    }
  );

  // Connect to RabbitMQ
  await eventBus.start();

  return eventBus;
}

/**
 * Event bus setup and subscription
 *
 * Sets up event handlers for all domain events
 */
export async function setupEventHandlers(eventBus: any) {
  // Subscribe to todo events
  // Note: New events use dotted names like "Todo.Created", "Todo.Updated"
  await eventBus.on('Todo.Created', async (event: any) => {
    console.log('📝 Todo Created:', event);
    // Handle todo created event
    // - Send notifications
    // - Update analytics
    // - Trigger workflows
  });

  await eventBus.on('Todo.Updated', async (event: any) => {
    console.log('✏️ Todo Updated:', event);
    // Handle todo updated event
  });

  await eventBus.on('Todo.Completed', async (event: any) => {
    console.log('✅ Todo Completed:', event);
    // Handle todo completed event
    // - Send congratulations notification
    // - Update progress tracking
    // - Award achievements
  });

  await eventBus.on('Todo.Deleted', async (event: any) => {
    console.log('🗑️ Todo Deleted:', event);
    // Handle todo deleted event
    // - Archive deleted todos
    // - Update statistics
  });

  return eventBus;
}
