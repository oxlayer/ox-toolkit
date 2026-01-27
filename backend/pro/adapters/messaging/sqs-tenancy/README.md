# @oxlayer/pro-adapters-sqs-tenancy

SQS multi-tenant queue adapter for tenant-isolated AWS messaging. Provides tenant-isolated SQS operations with shared or dedicated queue isolation strategies.

## Features

- Multi-tenant SQS with automatic tenant resolution
- Shared queue: Single SQS queue with tenant filtering
- Dedicated queue: Separate SQS queue per tenant
- Automatic tenant ID injection in messages
- Connection pooling and caching
- Support for B2B (dedicated) and B2C (shared) isolation modes

## Installation

```bash
bun add @oxlayer/pro-adapters-sqs-tenancy
```

## Dependencies

```bash
bun add @oxlayer/pro-tenancy
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareSQS } from '@oxlayer/pro-adapters-sqs-tenancy';

const tenantSQS = createTenancyAwareSQS({
  tenantResolver,
  region: 'us-east-1',
});

// Resolve SQS for a tenant
const sqs = await tenantSQS.resolve('acme-corp');

// Send message - tenant_id automatically injected
await sqs.send('events', { type: 'UserCreated', data: { userId: '123' } });
// Message body includes: { tenantId: 'acme-corp', type: 'UserCreated', data: {...} }

// Receive messages - tenant filter automatically applied
const messages = await sqs.receive('events', {
  maxMessages: 10,
  waitTimeSeconds: 20,
});
// Only returns messages with tenant_id matching 'acme-corp'
```

### Tenant Configuration

```typescript
// B2C tenant - shared queue
const sharedTenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  sqs: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/shared-events',
    region: 'us-east-1',
  },
};

// B2B tenant - dedicated queue
const dedicatedTenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  sqs: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/enterprise-456-events',
    region: 'us-west-2',
    credentialsRef: 'tenants/enterprise-456/sqs',
  },
};
```

### Message Enrichment

For shared queue mode, `tenant_id` is automatically added to messages:

```typescript
// Original message:
{ type: 'UserCreated', userId: '123' }

// Automatically becomes (for shared mode):
{
  tenantId: 'acme-corp',
  type: 'UserCreated',
  userId: '123',
  original: { type: 'UserCreated', userId: '123' }
}
```

## API Reference

### `TenancyAwareSQS`

Main entry point for tenant-isolated SQS operations.

#### Constructor

```typescript
constructor(config: TenancyAwareSQSConfig)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `region` - Default AWS region
- `credentials` - Optional default AWS credentials
- `defaultQueueUrl` - Optional default queue URL

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedSQS>`

Resolve SQS client for a tenant.

**Throws:**
- `TenantNotFoundError` - If tenant doesn't exist
- `TenantNotReadyError` - If tenant is not in ready state

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedSQS`

Tenant-isolated SQS client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `queueUrl` - Queue URL
- `region` - AWS region
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

- `send(queueKey, message, options?)` - Send message with tenant_id injection
- `receive(queueKey, options?)` - Receive messages with tenant filtering
- `deleteMessage(queueKey, receiptHandle)` - Delete message

## Types

### `TenancyAwareSQSConfig`

```typescript
interface TenancyAwareSQSConfig {
  tenantResolver: TenantResolver;
  region: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  defaultQueueUrl?: string;
}
```

### `SQSRouting`

```typescript
interface SQSRouting {
  queueUrl: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  credentialsRef?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share a queue with tenant_id filtering:

- Automatic `tenant_id` injection in messages
- Automatic tenant filtering on receive
- Cost-effective for B2C applications

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  sqs: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/shared-events',
  },
};
```

### Dedicated Mode

Each tenant has a dedicated SQS queue:

- Complete message isolation
- Separate queue policies
- Better for B2B with high message volume

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  sqs: {
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789012/enterprise-456-events',
    credentialsRef: 'tenants/enterprise-456/sqs',
  },
};
```

## Message Examples

### Send Operations

```typescript
const sqs = await tenantSQS.resolve('acme-corp');

// Send message
await sqs.send('events', { type: 'UserCreated', userId: '123' });

// Shared mode - message becomes:
{
  tenantId: 'acme-corp',
  original: { type: 'UserCreated', userId: '123' }
}

// Dedicated mode - message stays as:
{ type: 'UserCreated', userId: '123' }
```

### Receive Operations

```typescript
const sqs = await tenantSQS.resolve('acme-corp');

// Receive messages
const messages = await sqs.receive('events', {
  maxMessages: 10,
  waitTimeSeconds: 20,
});

// Shared mode - only returns messages with tenant_id = 'acme-corp'
// Dedicated mode - returns all messages (queue is isolated)
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Process and delete**: Always delete messages after processing
3. **Use long polling**: Reduce cost with `waitTimeSeconds`
4. **Handle errors**: Implement retry logic for failed processing
5. **Monitor queue depth**: Track queue size per tenant

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `UnsupportedIsolationModeError` - Isolation mode not supported

## License

MIT
