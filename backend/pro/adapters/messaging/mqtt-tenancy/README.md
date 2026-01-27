# @oxlayer/pro-adapters-mqtt-tenancy

MQTT multi-tenant messaging adapter for tenant-isolated pub/sub. Provides tenant-isolated MQTT operations with topic prefixing for tenant isolation.

## Features

- Multi-tenant MQTT with automatic tenant resolution
- Topic prefixing for tenant isolation
- Automatic tenant ID injection in topics
- Connection pooling and caching
- Support for shared and dedicated broker configurations
- Compatible with all MQTT 3.1.1/5.0 brokers

## Installation

```bash
bun add @oxlayer/pro-adapters-mqtt-tenancy
```

## Dependencies

```bash
bun add @oxlayer/pro-tenancy
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareMQTT } from '@oxlayer/pro-adapters-mqtt-tenancy';

const tenantMQTT = createTenancyAwareMQTT({
  tenantResolver,
  brokerUrl: 'mqtt://localhost:1883',
  topicPrefix: 'events',
});

// Resolve MQTT client for a tenant
const mqtt = await tenantMQTT.resolve('acme-corp');

// Publish - tenant automatically added to topic
await mqtt.publish('user.created', { userId: '123' });
// Topic becomes: events/tenants/acme-corp/user.created

// Subscribe - tenant automatically added to topic filter
await mqtt.subscribe('user.created', async (topic, message) => {
  console.log('User created:', message);
});
// Subscribes to: events/tenants/acme-corp/user.created
```

### Tenant Configuration

Tenants can be configured with different broker settings:

```typescript
// B2C tenant - shared broker with topic prefix
const sharedTenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  mqtt: {
    brokerUrl: 'mqtt://shared-broker.example.com',
    topicPrefix: 'events/tenants',
  },
};

// B2B tenant - dedicated broker
const dedicatedTenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  mqtt: {
    brokerUrl: 'mqtt://enterprise-broker.example.com',
    credentialsRef: 'tenants/enterprise-456/mqtt',
  },
};
```

### Topic Structure

For shared mode, topics include tenant ID:

```
{prefix}/tenants/{tenantId}/{event-type}
```

Examples:
- `events/tenants/acme-corp/user.created`
- `events/tenants/acme-corp/order.placed`

For dedicated mode, topics don't include tenant ID:

```
{event-type}
```

Examples:
- `user.created`
- `order.placed`

### Advanced Usage

```typescript
const mqtt = await tenantMQTT.resolve('acme-corp');

// Publish with options
await mqtt.publish('events/status', { status: 'active' }, {
  qos: 1,
  retain: true,
});

// Subscribe with wildcard
await mqtt.subscribe('events/#', async (topic, message) => {
  console.log('Event:', topic, message);
});

// Unsubscribe
await mqtt.unsubscribe('events/status');

// Get underlying client
const client = mqtt.getClient();
```

## API Reference

### `TenancyAwareMQTT`

Main entry point for tenant-isolated MQTT operations.

#### Constructor

```typescript
constructor(config: TenancyAwareMQTTConfig)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `brokerUrl` - Default MQTT broker URL
- `topicPrefix` - Topic prefix for tenant isolation
- `connectionOptions` - Default MQTT connection options

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedMQTT>`

Resolve MQTT client for a tenant.

**Returns:** Tenant-scoped MQTT client

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedMQTT`

Tenant-isolated MQTT client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `brokerUrl` - Broker URL
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

##### `publish(topic: string, message: any, options?): Promise<void>`

Publish a message. Tenant ID automatically added to topic for shared mode.

##### `subscribe(topic: string, callback: (topic, message) => void): Promise<void>`

Subscribe to a topic. Tenant ID automatically added to topic for shared mode.

##### `unsubscribe(topic: string): Promise<void>`

Unsubscribe from a topic.

##### `getClient(): any`

Get the underlying MQTT client.

## Types

### `TenancyAwareMQTTConfig`

```typescript
interface TenancyAwareMQTTConfig {
  tenantResolver: TenantResolver;
  brokerUrl: string;
  topicPrefix?: string;
  connectionOptions?: {
    qos?: 0 | 1 | 2;
    retain?: boolean;
    clean?: boolean;
    keepalive?: number;
  };
}
```

### `MQTTRouting`

```typescript
interface MQTTRouting {
  brokerUrl: string;
  topicPrefix?: string;
  username?: string;
  password?: string;
  credentialsRef?: string;
  clientId?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share a broker with topic prefixing:

- Topic format: `{prefix}/tenants/{tenantId}/{topic}`
- Cost-effective for B2C applications
- Easier broker management

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  mqtt: {
    brokerUrl: 'mqtt://broker.example.com',
    topicPrefix: 'events/tenants',
  },
};
```

### Dedicated Mode

Each tenant has a dedicated broker or connection:

- Complete topic isolation
- Separate credentials
- Better for B2B with high message volume

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  mqtt: {
    brokerUrl: 'mqtt://enterprise-broker.example.com',
    credentialsRef: 'tenants/enterprise-456/mqtt',
  },
};
```

## Wildcard Subscriptions

For shared mode, wildcard subscriptions work within tenant scope:

```typescript
const mqtt = await tenantMQTT.resolve('acme-corp');

// Subscribe to all events for this tenant
await mqtt.subscribe('events/#', handler);
// Actually subscribes to: events/tenants/acme-corp/#
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Prefix topics wisely**: Use hierarchical topics
3. **Use QoS appropriately**: QoS 1 for most cases
4. **Handle reconnection**: Client auto-reconnects
5. **Monitor broker**: Track connection metrics

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `ConnectionError` - Failed to connect to broker

## License

MIT
