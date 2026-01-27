/**
 * Tenancy Capability - Core Types
 *
 * Defines the multi-tenancy model with per-resource isolation strategies.
 * Tenancy is a semantic capability (like events, queues) - it defines
 * resource isolation policies, not infrastructure implementation.
 */

/**
 * Isolation modes for different resources
 *
 * Each resource (database, bucket, cache, etc.) can have its own
 * isolation strategy per tenant. This allows flexible mixed modes:
 * - B2C: shared database + shared bucket
 * - B2B: dedicated database + dedicated bucket
 * - Hybrid: dedicated database + shared bucket (common for cost optimization)
 */
export type IsolationMode =
  | "shared"      // B2C: shared infrastructure with logical separation (key prefixing, tenant_id columns)
  | "schema"      // Separate Postgres schema within same database
  | "database"    // Separate database instance (B2B)
  | "dedicated";  // Dedicated infrastructure instance (bucket, queue, etc.)

/**
 * Per-resource isolation policy
 *
 * Defines how each resource type is isolated for a specific tenant.
 * This is per-tenant configuration, not global.
 *
 * Example:
 * - B2C tenant: { database: "shared", bucket: "shared", cache: "shared" }
 * - B2B enterprise: { database: "database", bucket: "dedicated", cache: "dedicated" }
 * - Hybrid: { database: "database", bucket: "shared" }
 */
export interface TenantIsolationPolicy {
  /** Database isolation strategy */
  database: IsolationMode;

  /** S3/storage bucket isolation strategy */
  bucket?: IsolationMode;

  /** Search engine isolation strategy */
  search?: IsolationMode;

  /** Vector database isolation strategy */
  vector?: IsolationMode;

  /** Cache isolation strategy */
  cache?: IsolationMode;

  /** Queue isolation strategy */
  queue?: IsolationMode;
}

/**
 * Database connection routing metadata
 *
 * Stores HOW to connect to a tenant's database without storing
 * credentials directly. Credentials are resolved via secretRef.
 */
export interface DatabaseRouting {
  /** Database host (RDS endpoint, domain, etc.) */
  host: string;

  /** Database port (default: 5432 for Postgres) */
  port: number;

  /** Database name */
  name: string;

  /** Database user (username, not password) */
  user: string;

  /** Optional: Postgres schema name (for schema isolation) */
  schema?: string;

  /** Reference to secret in Bitwarden/Vault (NOT the secret itself) */
  secretRef: string;

  /** Optional: AWS region or data center location */
  region?: string;
}

/**
 * Storage (S3) routing metadata
 *
 * Stores HOW to access a tenant's storage without storing
 * credentials directly.
 */
export interface StorageRouting {
  /** S3 bucket name */
  bucket: string;

  /** Optional: Key prefix for shared buckets (e.g., "tenant-a/") */
  prefix?: string;

  /** AWS region */
  region: string;

  /** Optional: Reference to secret for dedicated buckets with IAM credentials */
  secretRef?: string;
}

/**
 * Tenant lifecycle states
 *
 * Tracks the provisioning and operational state of a tenant.
 */
export type TenantState =
  | "provisioning"  // Infrastructure being created
  | "ready"         // Tenant is operational
  | "migrating"     // Tenant data being migrated
  | "failed"        // Provisioning or migration failed
  | "disabled";     // Tenant suspended

/**
 * Tenant tier classification
 *
 * Business tier that affects isolation strategy and pricing.
 * This is a business label, not an architectural one.
 */
export type TenantTier = "b2c" | "b2b-enterprise";

/**
 * Complete tenant configuration
 *
 * Contains all metadata needed to resolve tenant resources.
 * This is cached in memory and loaded from the control plane database.
 *
 * Security: Contains NO credentials, only secret references.
 */
export interface TenantConfig {
  /** Unique tenant identifier (e.g., "acme-corp", "main", "tenant-123") */
  tenantId: string;

  /** Current lifecycle state */
  state: TenantState;

  /** Business tier (affects defaults, not isolation) */
  tier: TenantTier;

  /** Geographic region for data residency compliance */
  region: string;

  /** Per-resource isolation policies */
  isolation: TenantIsolationPolicy;

  /** Database connection routing info */
  database: DatabaseRouting;

  /** Optional: Storage routing info */
  storage?: StorageRouting;

  /** When tenant was created */
  createdAt: Date;

  /** When tenant config was last updated */
  updatedAt: Date;

  /** Optional: Schema migration version (for B2B tenant databases) */
  schemaVersion?: string;
}

/**
 * Cached value with TTL
 *
 * Generic wrapper for caching tenant configs, secrets, etc.
 */
export interface CachedValue<T> {
  /** The cached value */
  value: T;

  /** Expiration timestamp (milliseconds since epoch) */
  expiresAt: number;
}

/**
 * Cache configuration
 *
 * Controls caching behavior for tenant resolution.
 */
export interface CacheConfig {
  /** Default TTL for tenant config cache (milliseconds) */
  tenantConfigTtl?: number;

  /** Default TTL for secret cache (milliseconds) */
  secretTtl?: number;

  /** Maximum number of tenant configs to cache */
  maxCacheSize?: number;
}

/**
 * Default cache values
 */
export const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = {
  tenantConfigTtl: 60_000,    // 1 minute
  secretTtl: 300_000,         // 5 minutes
  maxCacheSize: 1000,
} as const;
