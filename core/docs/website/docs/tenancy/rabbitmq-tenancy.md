---
title: RabbitMQ Tenancy Adapter
sidebar_label: RabbitMQ Tenancy
description: RabbitMQ multi-tenant queue adapter for tenant-isolated messaging
---

# @oxlayer/capabilities-adapters-rabbitmq-tenancy

RabbitMQ multi-tenant queue adapter for tenant-isolated messaging. Provides tenant-isolated RabbitMQ operations with shared or dedicated exchange isolation strategies.

## Features

- Multi-tenant RabbitMQ with automatic tenant resolution
- Shared exchange: Single exchange with tenant routing
- Dedicated exchange: Separate exchange per tenant
- Automatic tenant ID injection in routing keys
- Connection pooling and caching
- Support for B2B (dedicated) and B2C (shared) isolation modes

## Installation

```bash
bun add @oxlayer/capabilities-adapters-rabbitmq-tenancy
```

## Dependencies

```bash
bun add @oxlayer/capabilities-tenancy
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareRabbitMQ } from '@oxlayer/capabilities-adapters-rabbitmq-tenancy';

const tenantMQ = createTenancyAwareRabbitMQ({
  tenantResolver,
  connection: {
    url: 'amqp://guest:guest@localhost',
  },
});

// Resolve RabbitMQ for a tenant
const mq = await tenantMQ.resolve('acme-corp');

// Publish - tenant automatically added to routing key
await mq.publish('events.user.created', { userId: '123' });
// Routing key becomes: tenants.acme-corp.events.user.created

// Consume - tenant filter automatically applied
await mq.consume('events', async (message) => {
  console.log('Event:', message);
});
// Queue bound to: tenants.acme-corp.events.#
```

### Tenant Configuration

```typescript
// B2C tenant - shared exchange
const sharedTenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  rabbitmq: {
    exchange: 'shared-exchange',
    queuePrefix: 'tenants',
  },
};

// B2B tenant - dedicated exchange
const dedicatedTenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  rabbitmq: {
    exchange: 'enterprise-456-exchange',
    credentialsRef: 'tenants/enterprise-456/rabbitmq',
  },
};
```

### Topic Structure

For shared mode, topics include tenant ID:

```
{prefix}/{tenantId}/{topic}
```

Examples:
- `tenants/acme-corp/events/user.created`
- `tenants/acme-corp/commands/process`

For dedicated mode, topics don't include tenant ID:

```
{topic}
```

Examples:
- `events/user.created`
- `commands/process`

## API Reference

### `TenancyAwareRabbitMQ`

Main entry point for tenant-isolated RabbitMQ operations.

#### Constructor

```typescript
constructor(config: TenancyAwareRabbitMQConfig)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `connection` - RabbitMQ connection configuration
- `defaultExchange` - Default exchange name
- `exchangeType` - Default exchange type (default: `'topic'`)
- `durable` - Create durable resources (default: `true`)

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedRabbitMQ>`

Resolve RabbitMQ client for a tenant.

**Returns:** Tenant-scoped RabbitMQ client

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedRabbitMQ`

Tenant-isolated RabbitMQ client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `exchange` - Exchange name
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

##### `publish(routingKey: string, message: any): Promise<void>`

Publish a message. Tenant ID automatically added to routing key for shared mode.

##### `consume(queue: string, callback: (message: any) => void): Promise<void>`

Consume messages from a queue with tenant-specific binding.

##### `bindQueue(queue: string, pattern: string): Promise<void>`

Bind a queue to the exchange with tenant-specific routing.

## Types

### `TenancyAwareRabbitMQConfig`

```typescript
interface TenancyAwareRabbitMQConfig {
  tenantResolver: TenantResolver;
  connection: {
    url: string;
  };
  defaultExchange?: string;
  exchangeType?: 'direct' | 'topic' | 'fanout' | 'headers';
  durable?: boolean;
}
```

### `RabbitMQRouting`

```typescript
interface RabbitMQRouting {
  exchange: string;
  queuePrefix?: string;
  vhost?: string;
  username?: string;
  password?: string;
  credentialsRef?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share an exchange with tenant prefixing:

- Routing key format: `{prefix}/{tenantId}/{key}`
- Cost-effective for B2C applications
- Easier exchange management

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  rabbitmq: {
    exchange: 'shared-exchange',
    queuePrefix: 'tenants',
  },
};
```

### Dedicated Mode

Each tenant has a dedicated exchange:

- Complete routing isolation
- Separate credentials and vhost
- Better for B2B with high message volume

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  rabbitmq: {
    exchange: 'enterprise-456-exchange',
    credentialsRef: 'tenants/enterprise-456/rabbitmq',
  },
};
```

## Binding Patterns

For shared mode, queue bindings include tenant prefix:

```typescript
// Bind to all events for this tenant
await mq.bindQueue('my-queue', 'events.#');
// Actually binds to: tenants/acme-corp/events.#

// Bind to specific event
await mq.bindQueue('my-queue', 'events.user.created');
// Actually binds to: tenants/acme-corp/events.user.created
```

For dedicated mode, no prefix:

```typescript
// Bind to all events
await mq.bindQueue('my-queue', 'events.#');
// Binds to: events.#
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Use topic exchanges**: For flexible routing patterns
3. **Make resources durable**: Prevent data loss
4. **Set TTL on queues**: Auto-delete unused queues
5. **Monitor queue depths**: Prevent memory issues

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `ConnectionError` - Failed to connect to RabbitMQ
