/**
 * RabbitMQ Configuration
 */

import { createEventBus, createDomainEventsEmitter } from '@oxlayer/capabilities-adapters-rabbitmq';

/**
 * Create RabbitMQ event bus
 */
export async function createEventBus() {
  return createEventBus({
    hostname: process.env.RABBITMQ_HOST || 'localhost',
    port: Number(process.env.RABBITMQ_PORT) || 5672,
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
    queue: process.env.RABBITMQ_QUEUE || '{{PROJECT_SLUG}}.events',
  });
}

/**
 * Create domain events emitter for ClickHouse
 */
export async function createDomainEventsEmitter() {
  const DOMAIN_EVENTS_ENDPOINT = process.env.DOMAIN_EVENTS_ENDPOINT;

  if (!DOMAIN_EVENTS_ENDPOINT) {
    console.log('[Events] Domain events endpoint not configured, skipping');
    return undefined;
  }

  return createDomainEventsEmitter({
    endpoint: DOMAIN_EVENTS_ENDPOINT,
  });
}
