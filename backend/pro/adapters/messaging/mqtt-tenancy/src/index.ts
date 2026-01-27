/**
 * MQTT Tenancy Adapter
 *
 * Multi-tenant MQTT with topic prefixing for tenant isolation.
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

export * from './tenancy-aware-mqtt.js';
