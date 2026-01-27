# @oxlayer/pro-adapters-s3-tenancy

S3 multi-tenant storage adapter for tenant-isolated object storage. Provides tenant-isolated S3 operations with shared or dedicated bucket isolation strategies.

## Features

- Multi-tenant S3 with automatic tenant resolution
- Shared bucket: Single bucket with path prefixing
- Dedicated bucket: Separate bucket per tenant
- Automatic credential retrieval via Bitwarden Secrets Manager
- Connection pooling and caching
- Support for B2B (dedicated) and B2C (shared) isolation modes
- Works with AWS S3 and S3-compatible services

## Installation

```bash
bun add @oxlayer/pro-adapters-s3-tenancy
```

## Dependencies

```bash
bun add @oxlayer/pro-tenancy @oxlayer/capabilities-adapters-bitwarden-secrets
```

## Usage

### Basic Setup

```typescript
import { createTenancyAwareS3 } from '@oxlayer/pro-adapters-s3-tenancy';
import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

const bitwardenClient = createBitwardenSecretsClient();

const tenantS3 = createTenancyAwareS3({
  tenantResolver,
  bitwardenClient,
  defaultRegion: 'us-east-1',
});

// Resolve S3 for a tenant
const s3 = await tenantS3.resolve('acme-corp');

// Upload - path automatically prefixed with tenant ID
await s3.upload('documents/report.pdf', fileBuffer, {
  contentType: 'application/pdf',
});
// Actual path: tenants/acme-corp/documents/report.pdf

// Download - tenant prefix automatically handled
const { body } = await s3.download('documents/report.pdf');
```

### Tenant Configuration

```typescript
// B2C tenant - shared bucket with path prefixing
const sharedTenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  s3: {
    bucket: 'shared-storage',
    region: 'us-east-1',
    pathPrefix: 'tenants',
  },
};

// B2B tenant - dedicated bucket
const dedicatedTenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  s3: {
    bucket: 'enterprise-456-storage',
    region: 'us-west-2',
    credentialsRef: 'tenants/enterprise-456/s3',
  },
};
```

### Credential Management

Credentials are retrieved from Bitwarden Secrets Manager:

```typescript
// Store in Bitwarden:
// Secret ID: tenants/acme-corp/s3
// Value: {"accessKeyId": "AKIA...", "secretAccessKey": "secret...", "region": "us-east-1"}

const s3 = await tenantS3.resolve('acme-corp');
// Credentials automatically loaded for dedicated mode
```

## API Reference

### `TenancyAwareS3`

Main entry point for tenant-isolated S3 operations.

#### Constructor

```typescript
constructor(config: TenancyAwareS3Config)
```

**Config:**
- `tenantResolver` - Tenant resolver for loading tenant configuration
- `bitwardenClient` - Bitwarden client for credential retrieval
- `defaultRegion` - Default AWS region
- `defaultBucket` - Default bucket name

#### Methods

##### `resolve(tenantId: string): Promise<TenantScopedS3>`

Resolve S3 client for a tenant.

**Throws:**
- `TenantNotFoundError` - If tenant doesn't exist
- `TenantNotReadyError` - If tenant is not in ready state

##### `invalidate(tenantId: string): void`

Invalidate cached connection for a tenant.

##### `clear(): void`

Clear all cached connections.

### `TenantScopedS3`

Tenant-isolated S3 client wrapper.

#### Properties

- `tenantId` - Tenant identifier
- `bucket` - Bucket name
- `region` - AWS region
- `isolationMode` - `'shared'` or `'dedicated'`

#### Methods

All standard S3 operations with automatic path prefixing for shared mode:

- `upload(path, body, options?)` - Upload file
- `uploadImage(path, file, options?)` - Upload image
- `download(path, options?)` - Download file
- `delete(path)` - Delete file
- `deleteMany(paths)` - Delete multiple files
- `exists(path)` - Check if file exists
- `copy(source, dest)` - Copy file
- `list(options?)` - List objects
- `getMetadata(path)` - Get file metadata
- `getPublicUrl(path)` - Get public URL

## Types

### `TenancyAwareS3Config`

```typescript
interface TenancyAwareS3Config {
  tenantResolver: TenantResolver;
  bitwardenClient: BitwardenSecretsClient;
  defaultRegion: string;
  defaultBucket?: string;
}
```

### `S3Routing`

```typescript
interface S3Routing {
  bucket: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  pathPrefix?: string;
  credentialsRef?: string;
}
```

## Isolation Modes

### Shared Mode

All tenants share a bucket with path prefixing:

- Path format: `{prefix}/{tenantId}/{path}`
- Cost-effective for B2C applications
- Easier bucket management

```typescript
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  s3: {
    bucket: 'shared-storage',
    pathPrefix: 'tenants',
  },
};
```

File paths become:
```
tenants/tenant-123/documents/report.pdf
tenants/tenant-123/images/avatar.jpg
```

### Dedicated Mode

Each tenant has a dedicated bucket:

- Complete data isolation
- Separate bucket policies
- Better for B2B with high storage needs

```typescript
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  s3: {
    bucket: 'enterprise-456-storage',
    credentialsRef: 'tenants/enterprise-456/s3',
  },
};
```

File paths are normal:
```
documents/report.pdf
images/avatar.jpg
```

## S3-Compatible Services

Works with S3-compatible services like MinIO, R2, etc.:

```typescript
// MinIO (shared mode)
const tenant = {
  id: 'tenant-123',
  isolation: { cache: 'shared' },
  s3: {
    bucket: 'shared-storage',
    endpoint: 'http://localhost:9000',
    pathPrefix: 'tenants',
  },
};

// Cloudflare R2 (dedicated mode)
const tenant = {
  id: 'enterprise-456',
  isolation: { cache: 'dedicated' },
  s3: {
    bucket: 'enterprise-456-r2',
    endpoint: 'https://your-account.r2.cloudflarestorage.com',
    credentialsRef: 'tenants/enterprise-456/r2',
  },
};
```

## Upload/Download Examples

```typescript
const s3 = await tenantS3.resolve('acme-corp');

// Upload with tenant prefix
await s3.upload('documents/report.pdf', fileBuffer);
// Shared mode: tenants/acme-corp/documents/report.pdf
// Dedicated mode: documents/report.pdf

// Download with tenant prefix
const { body } = await s3.download('documents/report.pdf');
// Shared mode: loads tenants/acme-corp/documents/report.pdf
// Dedicated mode: loads documents/report.pdf

// Get public URL
const url = s3.getPublicUrl('documents/report.pdf');
// Shared mode: https://bucket.s3.region.amazonaws.com/tenants/acme-corp/documents/report.pdf
// Dedicated mode: https://bucket.s3.region.amazonaws.com/documents/report.pdf
```

## Best Practices

1. **Use appropriate isolation**: Shared for B2C, dedicated for B2B
2. **Use path prefixes**: Organize tenant data hierarchically
3. **Set bucket policies**: Configure appropriate access policies
4. **Monitor storage usage**: Track storage per tenant
5. **Use lifecycle policies**: Auto-delete old files

## Error Handling

The adapter throws specific errors:

- `TenantNotFoundError` - Tenant doesn't exist
- `TenantNotReadyError` - Tenant is not in ready state
- `UnsupportedIsolationModeError` - Isolation mode not supported

## License

MIT
