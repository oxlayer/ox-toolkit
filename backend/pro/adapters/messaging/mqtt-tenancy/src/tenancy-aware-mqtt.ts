/**
 * MQTT Tenancy Adapter
 *
 * Multi-tenant MQTT adapter supporting:
 * - Shared: Single broker with tenant-prefixed topics (B2C)
 * - Dedicated: Separate topic namespace per tenant (B2B)
 *
 * @example
 * ```ts
 * import { createTenancyAwareMQTT } from '@oxlayer/pro-adapters-mqtt-tenancy';
 *
 * const tenantMQTT = createTenancyAwareMQTT({
 *   tenantResolver,
 *   brokerUrl: 'mqtt://localhost:1883',
 * });
 *
 * const mqtt = await tenantMQTT.resolve('acme-corp');
 * await mqtt.publish('events/user.created', data);
 * ```
 */

import type { TenantResolver } from '@oxlayer/pro-tenancy';

/**
 * MQTT client interface
 */
export interface MQTTClient {
  publish(topic: string, message: string | Buffer): Promise<void>;
  subscribe(topic: string, handler: (topic: string, message: Buffer) => void): Promise<void>;
}

/**
 * Tenancy-aware MQTT configuration
 */
export interface TenancyAwareMQTTConfig {
  tenantResolver: TenantResolver;
  brokerUrl: string;
  clientId?: string;
}

/**
 * Tenancy-aware MQTT resolver
 */
export class TenancyAwareMQTT {
  constructor(private config: TenancyAwareMQTTConfig) { }

  async resolve(tenantId: string): Promise<MQTTClient> {
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    // For MQTT, isolation is usually topic-based (not connection-based)
    // Both B2C and B2B can use topic prefixing for isolation
    return new TenantScopedMQTTClient({
      tenantId,
      brokerUrl: this.config.brokerUrl,
      clientId: this.config.clientId,
      topicPrefix: tenant.isolation.queue === 'dedicated'
        ? `${tenantId}/`
        : `app/${tenantId}/`,
    });
  }
}

/**
 * Tenant-scoped MQTT client with topic prefixing
 */
class TenantScopedMQTTClient implements MQTTClient {
  constructor(
    private config: {
      tenantId: string;
      brokerUrl: string;
      clientId?: string;
      topicPrefix: string;
    }
  ) { }

  private prefixTopic(topic: string): string {
    return `${this.config.topicPrefix}${topic}`;
  }

  async publish(topic: string, _message: string | Buffer): Promise<void> {
    const prefixedTopic = this.prefixTopic(topic);
    // TODO: Publish to MQTT broker
    console.log(`[MQTT-${this.config.tenantId}] Publishing to ${prefixedTopic}`);
  }

  async subscribe(topic: string, _handler: (topic: string, message: Buffer) => void): Promise<void> {
    const prefixedTopic = this.prefixTopic(topic);
    // TODO: Subscribe to MQTT topic
    console.log(`[MQTT-${this.config.tenantId}] Subscribing to ${prefixedTopic}`);
  }
}

export function createTenancyAwareMQTT(
  config: TenancyAwareMQTTConfig
): TenancyAwareMQTT {
  return new TenancyAwareMQTT(config);
}
