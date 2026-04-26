/**
 * RabbitMQ Tenancy Adapter
 *
 * Multi-tenant RabbitMQ adapter supporting:
 * - Shared: Single exchange with tenant-prefixed routing keys (B2C)
 * - Vhost: Separate vhost per tenant (B2B)
 *
 * @example
 * ```ts
 * import { createTenancyAwareRabbitMQ } from '@oxlayer/pro-adapters-rabbitmq-tenancy';
 *
 * const tenantMQ = createTenancyAwareRabbitMQ({
 *   tenantResolver,
 *   connection: { url: 'amqp://localhost' },
 * });
 *
 * const mq = await tenantMQ.resolve('acme-corp');
 * await mq.publish('events.user.created', eventData);
 * ```
 */

import type { TenantResolver } from '@oxlayer/pro-tenancy';

/**
 * Message queue client interface
 */
export interface QueueClient {
  publish(routingKey: string, message: any): Promise<void>;
  subscribe(queue: string, handler: (msg: any) => void): Promise<void>;
  createQueue(queue: string): Promise<void>;
}

/**
 * Tenancy-aware RabbitMQ configuration
 */
export interface TenancyAwareRabbitMQConfig {
  tenantResolver: TenantResolver;
  connection: {
    url: string;
  };
  defaultExchange?: string;
}

/**
 * Tenancy-aware RabbitMQ resolver
 */
export class TenancyAwareRabbitMQ {
  constructor(private config: TenancyAwareRabbitMQConfig) { }

  async resolve(tenantId: string): Promise<QueueClient> {
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    switch (tenant.isolation.queue) {
      case 'shared':
        return new SharedRabbitMQClient({
          tenantId,
          url: this.config.connection.url,
          exchange: this.config.defaultExchange || 'app_events',
        });

      case 'dedicated':
        return new DedicatedRabbitMQClient({
          tenantId,
          url: this.config.connection.url,
          exchange: `${tenantId}_events`,
        });

      default:
        throw new Error(`Unsupported queue isolation mode: ${tenant.isolation.queue}`);
    }
  }
}

/**
 * Shared RabbitMQ client with tenant-prefixed routing keys
 */
class SharedRabbitMQClient implements QueueClient {
  constructor(
    private config: {
      tenantId: string;
      url: string;
      exchange: string;
    }
  ) { }

  async publish(routingKey: string, _message: any): Promise<void> {
    const _prefixedKey = `${this.config.tenantId}.${routingKey}`;
    // TODO: Publish to RabbitMQ with prefixed routing key
  }

  async subscribe(queue: string, _handler: (msg: any) => void): Promise<void> {
    const _prefixedQueue = `${this.config.tenantId}.${queue}`;
    // TODO: Subscribe to RabbitMQ queue
  }

  async createQueue(queue: string): Promise<void> {
    const _prefixedQueue = `${this.config.tenantId}.${queue}`;
    // TODO: Create queue in RabbitMQ
  }
}

/**
 * Dedicated RabbitMQ client for tenant-specific exchange
 */
class DedicatedRabbitMQClient implements QueueClient {
  constructor(
    private config: {
      tenantId: string;
      url: string;
      exchange: string;
    }
  ) { }

  async publish(_routingKey: string, _message: any): Promise<void> {
    // TODO: Publish to tenant's dedicated exchange
  }

  async subscribe(_queue: string, _handler: (msg: any) => void): Promise<void> {
    // TODO: Subscribe to tenant's dedicated queue
  }

  async createQueue(_queue: string): Promise<void> {
    // TODO: Create queue in tenant's vhost or exchange
  }
}

export function createTenancyAwareRabbitMQ(
  config: TenancyAwareRabbitMQConfig
): TenancyAwareRabbitMQ {
  return new TenancyAwareRabbitMQ(config);
}
