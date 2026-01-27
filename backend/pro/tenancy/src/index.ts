/**
 * Tenancy Capability
 *
 * Multi-tenancy support for per-resource isolation strategies.
 *
 * This capability defines:
 * - Tenant configuration model (TenantConfig, isolation policies)
 * - Tenant resolution interface (TenantResolver)
 * - Resource-specific resolvers (DatabaseResolver, StorageResolver, CacheResolver)
 * - Tenant guards for route protection
 *
 * Architecture Principles:
 * - Tenancy is a semantic capability (like events, queues), not infrastructure
 * - Applications consume resolved resources, never credentials or env vars
 * - Tenancy controls isolation per resource, not per tenant
 * - Environment variables are immutable at runtime
 *
 * Example Usage:
 * ```ts
 * import { tenancy } from '@oxlayer/pro-tenancy';
 *
 * // Resolve tenant-scoped database
 * const db = await tenancy.database.resolve('acme-corp');
 *
 * // Resolve tenant-scoped cache
 * const cache = await tenancy.cache.resolve('acme-corp');
 *
 * // Resolve tenant-scoped storage
 * const s3 = await tenancy.storage.resolve('acme-corp');
 *
 * // Protect routes with tenant guards
 * import { requireTenant } from '@oxlayer/pro-tenancy';
 * app.use('/api/*', requireTenant({ resolver }));
 * ```
 *
 * Implementations:
 * - DatabaseTenantResolver: Loads tenant config from control plane database
 * - TenancyAwarePostgres: Resolves Postgres connections per isolation mode
 * - TenancyAwareCache: Resolves Redis with key prefixing or dedicated instance
 * - TenancyAwareS3: Resolves S3 with dedicated or shared buckets
 */

// Core types
export * from "./types.js";

// Domain errors
export * from "./errors.js";

// Tenant resolver
export * from "./resolver.js";

// Isolation strategies and resource resolvers
export * from "./isolation.js";

// Tenant guards for route protection
export * from "./guards.js";

// Keycloak-based tenant context propagation
export * from "./keycloak-context.js";

// API routes for tenant management
export * from "./api/tenancy-routes.js";
