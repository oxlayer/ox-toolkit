/**
 * Bitwarden Secrets Manager Client
 *
 * Provides secure credential storage and retrieval for tenant resources.
 * Integrates with Bitwarden Secrets Manager API.
 *
 * @example
 * ```ts
 * import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';
 *
 * const client = createBitwardenSecretsClient({
 *   accessToken: process.env.BITWARDEN_ACCESS_TOKEN,
 *   organizationId: process.env.BITWARDEN_ORGANIZATION_ID,
 * });
 *
 * const credentials = await client.getDatabaseCredentials('tenants/acme-corp/database');
 * ```
 */

import { defineEnvSchema, getEnvVar } from "@oxlayer/capabilities-internal";

/**
 * Bitwarden Secrets Manager environment configuration
 */
export const bitwardenSecretsEnv = defineEnvSchema({
  BITWARDEN_ACCESS_TOKEN: {
    description: "Bitwarden Secrets Manager access token",
    required: true,
  },
  BITWARDEN_API_URL: {
    description: "Bitwarden Secrets Manager API URL",
    required: false,
    default: "https://api.secrets.bitwarden.com",
  },
  BITWARDEN_ORGANIZATION_ID: {
    description: "Bitwarden organization ID",
    required: true,
  },
});

/**
 * Load and validate Bitwarden environment variables
 *
 * Call this during application initialization to validate configuration.
 */
export function loadBitwardenEnv() {
  return {
    accessToken: getEnvVar("BITWARDEN_ACCESS_TOKEN", { required: true }),
    apiUrl: getEnvVar("BITWARDEN_API_URL", {
      required: false,
      default: "https://api.secrets.bitwarden.com",
    }),
    organizationId: getEnvVar("BITWARDEN_ORGANIZATION_ID", { required: true }),
  };
}

/**
 * Bitwarden Secret value response
 */
export interface SecretValue {
  /** The secret value */
  value: string;

  /** Secret version (for rotation tracking) */
  version: number;

  /** When the secret was created */
  createdAt: Date;

  /** When the secret was last updated */
  updatedAt: Date;
}

/**
 * Database credentials from Bitwarden secret
 */
export interface DatabaseCredentials {
  username: string;
  password: string;
  host?: string;
  port?: number;
}

/**
 * Storage credentials from Bitwarden secret
 */
export interface StorageCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
}

/**
 * Bitwarden Secrets Manager client configuration
 */
export interface BitwardenSecretsClientConfig {
  /** Bitwarden access token */
  accessToken: string;

  /** Bitwarden API URL (default: https://api.secrets.bitwarden.com) */
  apiUrl?: string;

  /** Bitwarden organization ID */
  organizationId: string;

  /** Request timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/**
 * Bitwarden Secrets Manager client
 *
 * Provides methods to retrieve secrets from Bitwarden Secrets Manager.
 * Implements caching for frequently accessed secrets.
 */
export class BitwardenSecretsClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  /** Secret cache (secretRef -> cached value with expiry) */
  private cache = new Map<string, { value: any; expiresAt: number }>();

  /** Default cache TTL: 5 minutes */
  private readonly cacheTtl = 5 * 60 * 1000;

  constructor(private config: BitwardenSecretsClientConfig) {
    this.baseUrl = config.apiUrl || "https://api.secrets.bitwarden.com";
    this.timeout = config.timeout || 10000;
  }

  /**
   * Get a secret by reference ID
   *
   * @param secretRef - Secret reference/ID
   * @returns Secret value
   */
  async getSecret(secretRef: string): Promise<SecretValue> {
    const cached = this.cache.get(secretRef);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const secret = await this.fetchSecret(secretRef);

    this.cache.set(secretRef, {
      value: secret,
      expiresAt: Date.now() + this.cacheTtl,
    });

    return secret;
  }

  /**
   * Get database credentials from secret
   *
   * Secret should be stored as JSON with keys: username, password, (optional) host, (optional) port
   *
   * @param secretRef - Secret reference (e.g., "tenants/acme-corp/database")
   * @returns Database credentials
   */
  async getDatabaseCredentials(secretRef: string): Promise<DatabaseCredentials> {
    const secret = await this.getSecret(secretRef);

    try {
      const creds = JSON.parse(secret.value);
      return {
        username: creds.username,
        password: creds.password,
        host: creds.host,
        port: creds.port,
      };
    } catch (_error) {
      throw new Error(
        `Invalid database credentials format for secret ${secretRef}: expected JSON with username, password`
      );
    }
  }

  /**
   * Get storage credentials from secret
   *
   * Secret should be stored as JSON with keys: accessKeyId, secretAccessKey, (optional) region
   *
   * @param secretRef - Secret reference (e.g., "tenants/acme-corp/storage")
   * @returns Storage credentials
   */
  async getStorageCredentials(secretRef: string): Promise<StorageCredentials> {
    const secret = await this.getSecret(secretRef);

    try {
      const creds = JSON.parse(secret.value);
      return {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        region: creds.region,
      };
    } catch (_error) {
      throw new Error(
        `Invalid storage credentials format for secret ${secretRef}: expected JSON with accessKeyId, secretAccessKey`
      );
    }
  }

  /**
   * Fetch secret from Bitwarden API
   *
   * @param secretId - Secret ID
   * @returns Secret value
   */
  protected async fetchSecret(secretId: string): Promise<SecretValue> {
    const url = `${this.baseUrl}/api/secrets/${secretId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Secret not found: ${secretId}`);
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Unauthorized: Invalid Bitwarden access token`);
      }
      throw new Error(`Bitwarden API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      value?: string;
      note?: string;
      revisionNumber?: number;
      creationDate?: string;
      revisionDate?: string;
    };

    return {
      value: data.value || data.note || "",
      version: data.revisionNumber || 0,
      createdAt: new Date(data.creationDate || Date.now()),
      updatedAt: new Date(data.revisionDate || Date.now()),
    };
  }

  /**
   * Invalidate cached secret
   *
   * Forces next getSecret() to fetch from Bitwarden.
   *
   * @param secretRef - Secret reference to invalidate
   */
  invalidate(secretRef: string): void {
    this.cache.delete(secretRef);
  }

  /**
   * Clear all cached secrets
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Create a Bitwarden Secrets Manager client
 *
 * Factory function that loads configuration from environment variables.
 *
 * @example
 * ```ts
 * import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';
 *
 * const client = createBitwardenSecretsClient();
 * const creds = await client.getDatabaseCredentials('tenants/acme-corp/database');
 * ```
 */
export function createBitwardenSecretsClient(
  config?: Partial<BitwardenSecretsClientConfig>
): BitwardenSecretsClient {
  const env = loadBitwardenEnv();

  return new BitwardenSecretsClient({
    accessToken: env.accessToken,
    apiUrl: env.apiUrl,
    organizationId: env.organizationId,
    ...config,
  });
}

/**
 * Create a mock Bitwarden client for testing
 *
 * Returns secrets from an in-memory map instead of calling Bitwarden API.
 *
 * @example
 * ```ts
 * import { createMockBitwardenClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';
 *
 * const mockClient = createMockBitwardenClient({
 *   'tenants/acme-corp/database': JSON.stringify({
 *     username: 'tenant_user',
 *     password: 'secret123'
 *   })
 * });
 * ```
 */
export function createMockBitwardenClient(
  secrets: Record<string, string>
): BitwardenSecretsClient {
  return new MockBitwardenClient(secrets);
}

/**
 * Mock Bitwarden client for testing
 */
class MockBitwardenClient extends BitwardenSecretsClient {
  constructor(private secrets: Record<string, string>) {
    super({
      accessToken: "mock",
      organizationId: "mock",
      apiUrl: "https://mock.bitwarden.com",
    });
  }

  protected override async fetchSecret(secretId: string): Promise<SecretValue> {
    const value = this.secrets[secretId];
    if (!value) {
      throw new Error(`Secret not found: ${secretId}`);
    }

    return {
      value,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
