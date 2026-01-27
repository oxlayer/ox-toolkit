# @oxlayer/capabilities-adapters-bitwarden-secrets

Bitwarden Secrets Manager adapter for secure credential storage and retrieval. Provides a unified interface for accessing secrets stored in Bitwarden Secrets Manager, with built-in caching and support for tenant-specific credentials.

## Features

- Secure credential storage and retrieval via Bitwarden Secrets Manager API
- Built-in caching with configurable TTL (default: 5 minutes)
- Support for database credentials, storage credentials, and custom secrets
- Tenant-aware secret resolution for multi-tenant applications
- Mock client for testing
- Automatic secret invalidation

## Installation

```bash
bun add @oxlayer/capabilities-adapters-bitwarden-secrets
```

## Environment Variables

```bash
# Required
BITWARDEN_ACCESS_TOKEN=your_access_token
BITWARDEN_ORGANIZATION_ID=your_org_id

# Optional
BITWARDEN_API_URL=https://api.secrets.bitwarden.com
```

## Usage

### Basic Usage

```typescript
import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

const client = createBitwardenSecretsClient();

// Get database credentials
const dbCreds = await client.getDatabaseCredentials('tenants/acme-corp/database');
console.log(dbCreds.username, dbCreds.password);

// Get storage credentials
const storageCreds = await client.getStorageCredentials('tenants/acme-corp/storage');
console.log(storageCreds.accessKeyId, storageCreds.secretAccessKey);
```

### Custom Configuration

```typescript
import { BitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

const client = new BitwardenSecretsClient({
  accessToken: 'your_token',
  apiUrl: 'https://api.secrets.bitwarden.com',
  organizationId: 'your_org_id',
  timeout: 10000,
});

const secret = await client.getSecret('secret-id');
console.log(secret.value, secret.version);
```

### Secret Formats

Secrets should be stored as JSON with the following formats:

#### Database Credentials
```json
{
  "username": "db_user",
  "password": "secure_password",
  "host": "localhost",
  "port": 5432
}
```

#### Storage Credentials
```json
{
  "accessKeyId": "AKIA...",
  "secretAccessKey": "secret...",
  "region": "us-east-1"
}
```

### Cache Management

```typescript
// Invalidate specific secret
client.invalidate('tenants/acme-corp/database');

// Clear all cached secrets
client.clear();

// Get cache statistics
const stats = client.getStats();
console.log(stats.size, stats.keys);
```

### Testing with Mock Client

```typescript
import { createMockBitwardenClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

const mockClient = createMockBitwardenClient({
  'tenants/acme-corp/database': JSON.stringify({
    username: 'test_user',
    password: 'test_pass'
  })
});

const creds = await mockClient.getDatabaseCredentials('tenants/acme-corp/database');
```

## API Reference

### `BitwardenSecretsClient`

Main client class for interacting with Bitwarden Secrets Manager.

#### Constructor

```typescript
constructor(config: BitwardenSecretsClientConfig)
```

**Parameters:**
- `config.accessToken` - Bitwarden access token
- `config.apiUrl` - API URL (default: `https://api.secrets.bitwarden.com`)
- `config.organizationId` - Bitwarden organization ID
- `config.timeout` - Request timeout in milliseconds (default: `10000`)

#### Methods

##### `getSecret(secretRef: string): Promise<SecretValue>`

Get a secret by reference ID.

**Returns:**
- `value` - The secret value
- `version` - Secret version number
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

##### `getDatabaseCredentials(secretRef: string): Promise<DatabaseCredentials>`

Get database credentials from a secret.

**Returns:**
- `username` - Database username
- `password` - Database password
- `host` - Optional database host
- `port` - Optional database port

##### `getStorageCredentials(secretRef: string): Promise<StorageCredentials>`

Get storage credentials from a secret.

**Returns:**
- `accessKeyId` - Access key ID
- `secretAccessKey` - Secret access key
- `region` - Optional region

##### `invalidate(secretRef: string): void`

Invalidate cached secret, forcing next fetch from Bitwarden.

##### `clear(): void`

Clear all cached secrets.

##### `getStats(): { size: number, keys: string[] }`

Get cache statistics including size and cached keys.

### Factory Functions

#### `createBitwardenSecretsClient(config?: Partial<BitwardenSecretsClientConfig>): BitwardenSecretsClient`

Create a Bitwarden client using environment variables.

#### `createMockBitwardenClient(secrets: Record<string, string>): BitwardenSecretsClient`

Create a mock client for testing with in-memory secrets.

## Types

### `BitwardenSecretsClientConfig`

```typescript
interface BitwardenSecretsClientConfig {
  accessToken: string;
  apiUrl?: string;
  organizationId: string;
  timeout?: number;
}
```

### `SecretValue`

```typescript
interface SecretValue {
  value: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### `DatabaseCredentials`

```typescript
interface DatabaseCredentials {
  username: string;
  password: string;
  host?: string;
  port?: number;
}
```

### `StorageCredentials`

```typescript
interface StorageCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}
```

## Error Handling

The adapter throws specific errors for different scenarios:

- `Secret not found: {id}` - Secret doesn't exist in Bitwarden
- `Unauthorized: Invalid Bitwarden access token` - Authentication failed
- `Bitwarden API error: {status} {statusText}` - API request failed
- `Invalid database credentials format...` - Secret JSON format is incorrect

## Best Practices

1. **Use tenant-specific secret paths**: Store tenant credentials under paths like `tenants/{tenantId}/{service}`
2. **Implement secret rotation**: Use the `version` field to track secret rotations
3. **Cache appropriately**: The default 5-minute cache reduces API calls while maintaining freshness
4. **Use mock clients in tests**: Avoid calling Bitwarden API during tests
5. **Handle errors gracefully**: Implement fallback logic when secrets are unavailable

## License

MIT
