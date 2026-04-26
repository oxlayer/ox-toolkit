/**
 * SQS Tenancy Adapter
 *
 * Multi-tenant AWS SQS adapter supporting:
 * - Shared: Single SQS queue with message attributes (B2C)
 * - Dedicated: Separate SQS queue per tenant (B2B)
 *
 * @example
 * ```ts
 * import { createTenancyAwareSQS } from '@oxlayer/pro-adapters-sqs-tenancy';
 *
 * const tenantSQS = createTenancyAwareSQS({
 *   tenantResolver,
 *   region: 'us-east-1',
 * });
 *
 * const sqs = await tenantSQS.resolve('acme-corp');
 * await sqs.send('events', message);
 * ```
 */

import type { TenantResolver } from '@oxlayer/pro-tenancy';

/**
 * SQS client interface
 */
export interface SQSClient {
  send(queueName: string, message: any): Promise<void>;
  receive(queueName: string, handler: (msg: any) => void): Promise<void>;
}

/**
 * Tenancy-aware SQS configuration
 */
export interface TenancyAwareSQSConfig {
  tenantResolver: TenantResolver;
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Tenancy-aware SQS resolver
 */
export class TenancyAwareSQS {
  constructor(private config: TenancyAwareSQSConfig) { }

  async resolve(tenantId: string): Promise<SQSClient> {
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    switch (tenant.isolation.queue) {
      case 'shared':
        return new SharedSQSClient({
          tenantId,
          region: this.config.region,
          credentials: this.config.credentials,
        });

      case 'dedicated':
        return new DedicatedSQSClient({
          tenantId,
          queueName: `${tenantId}-events`,
          region: this.config.region,
          credentials: this.config.credentials,
        });

      default:
        throw new Error(`Unsupported queue isolation mode: ${tenant.isolation.queue}`);
    }
  }
}

/**
 * Shared SQS client with tenant message attributes
 */
class SharedSQSClient implements SQSClient {
  constructor(
    private config: {
      tenantId: string;
      region: string;
      credentials?: { accessKeyId: string; secretAccessKey: string };
    }
  ) { }

  async send(queueName: string, message: any): Promise<void> {
    // Add tenant_id as message attribute
    const _messageWithTenant = {
      ...message,
      tenant_id: this.config.tenantId,
      messageAttributes: {
        tenant_id: {
          DataType: 'String',
          StringValue: this.config.tenantId,
        },
      },
    };
    // TODO: Send to SQS
  }

  async receive(_queueName: string, _handler: (msg: any) => void): Promise<void> {
    // TODO: Receive from SQS and filter by tenant_id attribute
  }
}

/**
 * Dedicated SQS client for tenant-specific queue
 */
class DedicatedSQSClient implements SQSClient {
  constructor(
    private config: {
      tenantId: string;
      queueName: string;
      region: string;
      credentials?: { accessKeyId: string; secretAccessKey: string };
    }
  ) { }

  async send(_queueName: string, _message: any): Promise<void> {
    // TODO: Send to tenant's dedicated SQS queue
  }

  async receive(_queueName: string, _handler: (msg: any) => void): Promise<void> {
    // TODO: Receive from tenant's dedicated SQS queue
  }
}

export function createTenancyAwareSQS(
  config: TenancyAwareSQSConfig
): TenancyAwareSQS {
  return new TenancyAwareSQS(config);
}
