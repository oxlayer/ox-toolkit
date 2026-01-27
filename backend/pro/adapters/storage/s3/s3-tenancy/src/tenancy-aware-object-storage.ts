/**
 * Object Storage Tenancy Adapter
 *
 * Multi-tenant Object Storage storage adapter supporting:
 * - Shared: Single bucket with tenant-prefixed keys (B2C)
 * - Dedicated: Separate bucket per tenant (B2B)
 *
 * @example
 * ```ts
 * import { createTenancyAwareObjectStorage } from '@oxlayer/pro-adapters-object-storage-tenancy';
 *
 * const tenantObjectStorage = createTenancyAwareObjectStorage({
 *   tenantResolver,
 *   bitwardenClient,
 *   defaultEndpoint: 'https://object-storage.example.com',
 *   defaultRegion: 'us-east-1',
 * });
 *
 * const objectStorage = await tenantObjectStorage.resolve('acme-corp');
 * await objectStorage.upload('invoice.pdf', buffer);
 * // Returns: object-storage://acme-corp-data/invoice.pdf (dedicated)
 * // Or: object-storage://shared-bucket/acme-corp/invoice.pdf (shared)
 * ```
 */

import type { TenantResolver, StorageResolver } from '@oxlayer/pro-tenancy';
import type { BitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

/**
 * Storage routing metadata
 */
export interface StorageRouting {
  /** Object Storage bucket name */
  bucket: string;

  /** Optional: Key prefix for shared buckets */
  prefix?: string;

  /** Object Storage region */
  region: string;

  /** Optional: Reference to secret for dedicated buckets */
  secretRef?: string;
}

/**
 * Object Storage client interface (minimal)
 */
export interface ObjectStorageClient {
  upload(key: string, body: Buffer | string, options?: UploadOptions): Promise<UploadResult>;
  download(key: string): Promise<DownloadResult>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<ListResult>;
  getPublicUrl(key: string): string;
}

export interface UploadOptions {
  contentType?: string;
  public?: boolean;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url?: string;
  etag?: string;
}

export interface DownloadResult {
  key: string;
  body: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface ListResult {
  objects: Array<{
    key: string;
    size: number;
    lastModified: Date;
  }>;
}

/**
 * Tenancy-aware Object Storage configuration
 */
export interface TenancyAwareObjectStorageConfig {
  /** Tenant resolver */
  tenantResolver: TenantResolver;

  /** Bitwarden secrets client */
  bitwardenClient: BitwardenSecretsClient;

  /** Default Object Storage region */
  defaultRegion: string;

  /** Object Storage endpoint (for non-AWS services like MinIO, R2) */
  endpoint?: string;

  /** Optional: Function to create Object Storage client for tenant */
  createClient?: (tenantId: string, routing: StorageRouting) => Promise<ObjectStorageClient>;
}

/**
 * Tenancy-aware Object Storage storage resolver
 *
 * Resolves tenant-specific Object Storage clients based on isolation strategy.
 *
 * Isolation strategies:
 * - **shared** (B2C): Single bucket with tenant-prefixed keys
 * - **dedicated** (B2B): Separate bucket per tenant with tenant-specific credentials
 */
export class TenancyAwareObjectStorage implements StorageResolver<ObjectStorageClient> {
  private clientCache = new Map<string, ObjectStorageClient>();

  constructor(private config: TenancyAwareObjectStorageConfig) { }

  /**
   * Resolve Object Storage client for tenant
   *
   * @param tenantId - Tenant identifier
   * @returns Tenant-scoped Object Storage client
   */
  async resolve(tenantId: string): Promise<ObjectStorageClient> {
    // Check cache
    if (this.clientCache.has(tenantId)) {
      return this.clientCache.get(tenantId)!;
    }

    // Resolve tenant configuration
    const tenant = await this.config.tenantResolver.resolve(tenantId);

    // Create storage routing config
    const routing: StorageRouting = {
      bucket: tenant.storage?.bucket || `${tenantId}-data`,
      prefix: tenant.storage?.prefix,
      region: tenant.storage?.region || this.config.defaultRegion,
      secretRef: tenant.storage?.secretRef,
    };

    // Determine isolation mode - only 'shared' and 'dedicated' are valid for Object Storage
    // For other modes like 'schema' or 'database', we fall back to 'shared' with prefixing
    const bucketIsolation = tenant.isolation.bucket;
    const isolationMode: 'shared' | 'dedicated' =
      bucketIsolation === 'dedicated' ? 'dedicated' : 'shared';

    // Create appropriate client based on isolation mode
    const client = await this.createClient(tenantId, isolationMode, routing);

    // Cache the client
    this.clientCache.set(tenantId, client);

    return client;
  }

  /**
   * Create Object Storage client for tenant
   */
  private async createClient(
    tenantId: string,
    isolationMode: 'shared' | 'dedicated',
    routing: StorageRouting
  ): Promise<ObjectStorageClient> {
    switch (isolationMode) {
      case 'shared':
        // Shared bucket with key prefixing
        return new TenantScopedObjectStorageClient({
          tenantId,
          bucket: routing.bucket,
          prefix: routing.prefix || tenantId,
          region: routing.region,
          endpoint: this.config.endpoint,
        });

      case 'dedicated':
        // Dedicated bucket with tenant-specific credentials
        if (this.config.createClient) {
          return this.config.createClient(tenantId, routing);
        }

        // Default implementation using Bitwarden for credentials
        const creds = await this.config.bitwardenClient.getStorageCredentials(routing.secretRef!);
        return new DedicatedObjectStorageClient({
          tenantId,
          bucket: routing.bucket,
          region: routing.region,
          accessKeyId: creds.accessKeyId,
          secretAccessKey: creds.secretAccessKey,
          endpoint: this.config.endpoint,
        });

      default:
        throw new Error(`Unsupported bucket isolation mode: ${isolationMode}`);
    }
  }

  /**
   * Invalidate cached client for tenant
   */
  invalidate(tenantId: string): void {
    this.clientCache.delete(tenantId);
  }

  /**
   * Clear all cached clients
   */
  clear(): void {
    this.clientCache.clear();
  }
}

/**
 * Tenant-scoped Object Storage client with key prefixing
 *
 * Wraps a shared Object Storage bucket and prefixes all keys with the tenant ID.
 * Used for shared bucket isolation strategy (B2C).
 */
  class TenantScopedObjectStorageClient implements ObjectStorageClient {
  constructor(
    private config: {
      tenantId: string;
      bucket: string;
      prefix: string;
      region: string;
      endpoint?: string;
    }
  ) { }

  /**
   * Prefix key with tenant ID
   */
  private prefixKey(key: string): string {
    return `${this.config.prefix}/${key}`;
  }

  /**
   * Remove tenant prefix from key
   */
  private unprefixKey(prefixedKey: string): string {
    return prefixedKey.substring(this.config.prefix.length + 1);
  }

  async upload(key: string, body: Buffer | string, options?: UploadOptions): Promise<UploadResult> {
    const prefixedKey = this.prefixKey(key);
    // TODO: Upload to Object Storage
    return { key: prefixedKey };
  }

  async download(key: string): Promise<DownloadResult> {
    const prefixedKey = this.prefixKey(key);
    // TODO: Download from Object Storage
    return { key, body: Buffer.from('') };
  }

  async delete(key: string): Promise<void> {
    const prefixedKey = this.prefixKey(key);
    // TODO: Delete from Object Storage
  }

  async list(prefix?: string): Promise<ListResult> {
    const fullPrefix = prefix ? this.prefixKey(prefix) : this.config.prefix;
      // TODO: List objects from Object Storage with prefix
    return { objects: [] };
  }

  getPublicUrl(key: string): string {
    const prefixedKey = this.prefixKey(key);
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${prefixedKey}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${prefixedKey}`;
  }
}

/**
 * Dedicated Object Storage client for tenant-specific bucket
 *
 * Uses tenant-specific AWS credentials and bucket.
 * Used for dedicated bucket isolation strategy (B2B).
 */
class DedicatedObjectStorageClient implements ObjectStorageClient {
  constructor(
    private config: {
      tenantId: string;
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      endpoint?: string;
    }
  ) { }

  async upload(key: string, body: Buffer | string, options?: UploadOptions): Promise<UploadResult> {
    // TODO: Upload to Object Storage using tenant credentials
    return { key };
  }

  async download(key: string): Promise<DownloadResult> {
    // TODO: Download from Object Storage
    return { key, body: Buffer.from('') };
  }

  async delete(key: string): Promise<void> {
    // TODO: Delete from Object Storage
  }

  async list(prefix?: string): Promise<ListResult> {
    // TODO: List objects from Object Storage
    return { objects: [] };
  }

  getPublicUrl(key: string): string {
    if (this.config.endpoint) {
      return `${this.config.endpoint}/${this.config.bucket}/${key}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }
}

/**
 * Create a tenancy-aware Object Storage resolver
 */
export function createTenancyAwareObjectStorage(
  config: TenancyAwareObjectStorageConfig
): TenancyAwareObjectStorage {
  return new TenancyAwareObjectStorage(config);
}
