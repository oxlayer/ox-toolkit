/**
 * RabbitMQ Event Bus Configuration
 *
 * Sets up event-driven architecture for the globex application.
 * Handles domain events for exams, evaluations, candidates, and workflows.
 */

import { createRabbitMQEventBus, type RabbitMQEventBus } from '@oxlayer/capabilities-adapters-rabbitmq';
import { ENV } from './app.config.js';

// Re-export EventBus type for convenience
export type EventBus = RabbitMQEventBus;

/**
 * Create RabbitMQ event bus for globex application
 *
 * Sets up:
 * - Connection to RabbitMQ using environment configuration
 * - Event exchange for domain events
 * - Event queue for message consumption
 * - Message routing with topic exchange
 *
 * @returns RabbitMQ event bus instance
 */
export function createEventBus(): RabbitMQEventBus {
  // Build RabbitMQ URL from environment variables
  const rabbitmqUrl = `amqp://${ENV.RABBITMQ_USERNAME}:${ENV.RABBITMQ_PASSWORD}@${ENV.RABBITMQ_HOST}:${ENV.RABBITMQ_PORT}${ENV.RABBITMQ_VHOST}`;

  const eventBus = createRabbitMQEventBus(
    {
      url: rabbitmqUrl,
      exchange: 'globex.events',
      exchangeType: 'topic',
      queue: ENV.RABBITMQ_QUEUE,
      routingKey: 'globex.*',
      durable: true,
      autoDelete: false,
      heartbeat: 10,
    },
    {
      serviceName: 'globex-api',
      serviceVersion: '1.0.0',
      tracer: null, // TODO: Add OpenTelemetry tracing support
    }
  );

  // Extend with publish() method for backwards compatibility
  return extendEventBusWithPublish(eventBus);
}

/**
 * Event bus setup and subscription
 *
 * Sets up event handlers for all domain events in the globex application.
 * Events follow the pattern: {Domain}.{Action} (e.g., Exam.Created, Evaluation.Completed)
 *
 * @param eventBus - RabbitMQ event bus instance
 */
export async function setupEventHandlers(eventBus: RabbitMQEventBus) {
  // Connect to RabbitMQ
  await eventBus.start();

  // ============================
  // Exam Events
  // ============================

  await eventBus.on('Exam.Created', async (event: any) => {
    console.log('📝 Exam Created:', event);
    // Handle exam created event
    // - Initialize exam metadata
    // - Trigger evaluation workflows
    // - Update analytics
  });

  await eventBus.on('Exam.Updated', async (event: any) => {
    console.log('✏️ Exam Updated:', event);
    // Handle exam updated event
    // - Update cached exam data
    // - Notify assigned candidates of changes
  });

  await eventBus.on('Exam.Deleted', async (event: any) => {
    console.log('🗑️ Exam Deleted:', event);
    // Handle exam deleted event
    // - Cancel pending evaluations
    // - Archive evaluation results
    // - Update statistics
  });

  await eventBus.on('Exam.Assigned', async (event: any) => {
    console.log('📋 Exam Assigned:', event);
    // Handle exam assignment event
    // - Send notification to candidate
    // - Schedule evaluation reminders
    // - Initialize evaluation workflow
  });

  // ============================
  // Evaluation Events
  // ============================

  await eventBus.on('Evaluation.Started', async (event: any) => {
    console.log('🔄 Evaluation Started:', event);
    // Handle evaluation started event
    // - Record start time
    // - Initialize workflow execution
    // - Update candidate status
  });

  await eventBus.on('Evaluation.Completed', async (event: any) => {
    console.log('✅ Evaluation Completed:', event);
    // Handle evaluation completed event
    // - Calculate final scores
    // - Generate evaluation report
    // - Trigger webhook notifications
    // - Update candidate progress
  });

  await eventBus.on('Evaluation.Failed', async (event: any) => {
    console.log('❌ Evaluation Failed:', event);
    // Handle evaluation failed event
    // - Log failure details
    // - Notify administrators
    // - Offer retry option to candidate
  });

  await eventBus.on('Evaluation.AnalysisCompleted', async (event: any) => {
    console.log('🔍 Evaluation Analysis Completed:', event);
    // Handle AI analysis completion
    // - Store analysis results
    // - Update evaluation scores
    // - Trigger next workflow step
  });

  // ============================
  // Candidate Events
  // ============================

  await eventBus.on('Candidate.Created', async (event: any) => {
    console.log('👤 Candidate Created:', event);
    // Handle candidate created event
    // - Initialize candidate profile
    // - Send welcome notification
  });

  await eventBus.on('Candidate.Updated', async (event: any) => {
    console.log('👤 Candidate Updated:', event);
    // Handle candidate updated event
    // - Update cached profile data
  });

  // ============================
  // Workflow Events
  // ============================

  await eventBus.on('Workflow.Started', async (event: any) => {
    console.log('⚙️ Workflow Started:', event);
    // Handle workflow started event
    // - Initialize workflow execution
    // - Track workflow metrics
  });

  await eventBus.on('Workflow.Completed', async (event: any) => {
    console.log('⚙️ Workflow Completed:', event);
    // Handle workflow completed event
    // - Update evaluation status
    // - Trigger next workflow step
    // - Store workflow results
  });

  await eventBus.on('Workflow.Failed', async (event: any) => {
    console.log('⚙️ Workflow Failed:', event);
    // Handle workflow failed event
    // - Log error details
    // - Retry or mark as failed
    // - Notify administrators
  });

  // ============================
  // Bulk Evaluation Events
  // ============================

  await eventBus.on('BulkEvaluation.Completed', async (event: any) => {
    console.log('📊 Bulk Evaluation Completed:', event);
    // Handle bulk evaluation completion
    // - Update statistics
    // - Generate summary report
    // - Trigger follow-up actions
  });

  console.log('✅ All event handlers registered');

  return eventBus;
}

/**
 * Disconnect event bus gracefully
 *
 * @param eventBus - RabbitMQ event bus instance
 */
export async function disconnectEventBus(eventBus: RabbitMQEventBus) {
  await eventBus.disconnect();
  console.log('✅ RabbitMQ event bus disconnected');
}

/**
 * Extend RabbitMQEventBus with publish() method for backwards compatibility
 *
 * Adds a publish() method that takes exchange, routing key, and payload as separate arguments.
 * This wraps the client's publish method.
 */
export function extendEventBusWithPublish(eventBus: RabbitMQEventBus): RabbitMQEventBus {
  // Add publish method to the event bus instance using defineProperty for better compatibility
  Object.defineProperty(eventBus, 'publish', {
    value: async (
      exchange: string,
      routingKey: string,
      payload: any
    ): Promise<void> => {
      const client = eventBus.getClient();

      // Build envelope format that the event bus expects
      const envelope = {
        id: crypto.randomUUID(),
        type: routingKey,
        version: '1.0',
        source: 'globex-api',
        timestamp: new Date().toISOString(),
        data: payload,
      };

      await client.publish(routingKey, envelope);
    },
    writable: true,
    enumerable: true,
    configurable: true,
  });

  return eventBus;
}
