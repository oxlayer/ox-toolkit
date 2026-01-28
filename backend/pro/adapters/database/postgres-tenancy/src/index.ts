/**
 * PostgreSQL Tenancy Adapter
 *
 * Multi-tenant database resolution supporting shared, schema, and database isolation.
 * Works with ANY client database/schema.
 *
 * @example
 * ```ts
 * import { createTenancyAwarePostgres } from '@oxlayer/pro-adapters-postgres-tenancy';
 *
 * const tenancyPostgres = createTenancyAwarePostgres({
 *   tenantResolver,
 *   bitwardenClient,
 *   sharedDb: getDatabase(),
 * });
 *
 * // Enable RLS on all tables (adds tenant_id if needed)
 * await tenancyPostgres.enableRLS();
 *
 * const db = await tenancyPostgres.resolve('acme-corp');
 * ```
 *
 * Keycloak-based workspace tenancy:
 * ```ts
 * import { createKeycloakDatabaseResolver } from '@oxlayer/pro-adapters-postgres-tenancy';
 *
 * const resolver = createKeycloakDatabaseResolver({
 *   baseHost: 'localhost',
 *   basePort: 5432,
 *   baseUser: 'postgres',
 *   getCredentials: async (secretRef) => ({ username, password }),
 * });
 *
 * // Set tenant context from JWT
 * await setTenantContext({ realm: 'realm-client', workspaceId: 'acme' }, async () => {
 *   const db = await resolver.resolve('any-id');
 *   // => Connects to database: workspace_realm-client_acme
 * });
 * ```
 */

export * from "./tenancy-aware-postgres.js";
export * from "./database-pool.js";
export * from "./rls-manager.js";
export * from "./keycloak-resolver.js";
