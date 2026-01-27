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
      exchange: 'alo.events',
      exchangeType: 'topic',
      queue: ENV.RABBITMQ_QUEUE,
      routingKey: 'alo.*',
      durable: true,
      autoDelete: false,
      heartbeat: 10
    },
    {
      serviceName: 'alo-manager',
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
  // Subscribe to establishment events
  await eventBus.on('Establishment.Created', async (event: any) => {
    console.log('🏪 Establishment Created:', event);
    // Handle establishment created event
  });

  await eventBus.on('Establishment.Updated', async (event: any) => {
    console.log('✏️ Establishment Updated:', event);
  });

  await eventBus.on('Establishment.Deleted', async (event: any) => {
    console.log('🗑️ Establishment Deleted:', event);
  });

  // Subscribe to user events
  await eventBus.on('User.Created', async (event: any) => {
    console.log('👤 User Created:', event);
  });

  // Subscribe to delivery man events
  await eventBus.on('DeliveryMan.Created', async (event: any) => {
    console.log('🚴 Delivery Man Created:', event);
  });

  await eventBus.on('DeliveryMan.Updated', async (event: any) => {
    console.log('✏️ Delivery Man Updated:', event);
  });

  await eventBus.on('DeliveryMan.Deleted', async (event: any) => {
    console.log('🗑️ Delivery Man Deleted:', event);
  });

  // Subscribe to service provider events
  await eventBus.on('ServiceProvider.Created', async (event: any) => {
    console.log('🔧 Service Provider Created:', event);
  });

  await eventBus.on('ServiceProvider.Updated', async (event: any) => {
    console.log('✏️ Service Provider Updated:', event);
  });

  await eventBus.on('ServiceProvider.Deleted', async (event: any) => {
    console.log('🗑️ Service Provider Deleted:', event);
  });

  // Subscribe to onboarding lead events
  await eventBus.on('OnboardingLead.Created', async (event: any) => {
    console.log('📋 Onboarding Lead Created:', event);
    // Send notification to admin
    // Schedule follow-up
  });

  await eventBus.on('OnboardingLead.StatusChanged', async (event: any) => {
    console.log('📊 Onboarding Lead Status Changed:', event);
  });

  return eventBus;
}
