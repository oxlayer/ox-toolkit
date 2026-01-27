/**
 * Tenant Management API Routes
 *
 * HTTP endpoints for tenant provisioning and management.
 * These routes provide the control plane API for multi-tenancy.
 *
 * @example
 * ```ts
 * import { tenantManagementRoutes } from '@oxlayer/pro-tenancy';
 * import { Hono } from 'hono';
 *
 * const app = new Hono();
 * app.route('/admin/tenants', tenantManagementRoutes(tenancy));
 * ```
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type {
  TenantResolver,
} from '../resolver.js';
import type {
  TenantConfig,
  TenantIsolationPolicy,
  TenantState,
  TenantTier,
  IsolationMode,
} from '../types.js';
import {
  TenantNotFoundError,
  TenantNotReadyError,
  TenantConfigInvalidError,
} from '../errors.js';

/**
 * Request validation types
 */
interface ListTenantsQuery {
  state?: TenantState;
  tier?: TenantTier;
  limit?: number;
  offset?: number;
}

interface CreateTenantRequest {
  tenantId: string;
  tier: TenantTier;
  region: string;
  isolation?: TenantIsolationPolicy;
}

interface UpdateTenantStateRequest {
  state: TenantState;
}

interface UpdateTenantIsolationRequest {
  isolation: TenantIsolationPolicy;
}

interface TenantResponse {
  tenantId: string;
  state: TenantState;
  tier: TenantTier;
  region: string;
  isolation: TenantIsolationPolicy;
  createdAt: string;
  updatedAt: string;
  schemaVersion?: string;
}

/**
 * Create tenant management routes
 *
 * @param controlDb - Control plane database for tenant metadata
 * @param tenantResolver - Tenant resolver for loading config
 * @returns Hono router with tenant management endpoints
 */
export function tenantManagementRoutes(options: {
  tenantResolver: TenantResolver;
  provisionTenant?: (input: CreateTenantRequest) => Promise<TenantConfig>;
}): Hono {
  const app = new Hono();

  /**
   * GET /admin/tenants
   * List all tenants with optional filtering
   */
  app.get('/', async (c: Context) => {
    const query = c.req.query();
    const state = query.state as TenantState | undefined;
    const tier = query.tier as TenantTier | undefined;
    const limit = query.limit ? parseInt(query.limit) : 100;
    const offset = query.offset ? parseInt(query.offset) : 0;

    // TODO: Implement filtering and pagination with controlDb
    // For now, return a placeholder response
    return c.json({
      tenants: [],
      total: 0,
      limit,
      offset,
    });
  });

  /**
   * GET /admin/tenants/:id
   * Get tenant by ID
   */
  app.get('/:id', async (c: Context) => {
    const tenantId = c.req.param('id');

    if (!tenantId) {
      return c.json({ error: 'Tenant ID is required' }, 400);
    }

    try {
      const tenant = await options.tenantResolver.resolve(tenantId);

      return c.json({
        tenantId: tenant.tenantId,
        state: tenant.state,
        tier: tenant.tier,
        region: tenant.region,
        isolation: tenant.isolation,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
        schemaVersion: tenant.schemaVersion,
      } as TenantResponse);
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        return c.json({ error: 'Tenant not found', tenantId }, 404);
      }
      if (error instanceof TenantNotReadyError) {
        return c.json({
          error: 'Tenant not ready',
          tenantId,
          currentState: error.currentState,
        }, 503);
      }
      throw error;
    }
  });

  /**
   * POST /admin/tenants
   * Create (provision) a new tenant
   *
   * This triggers the provisioning workflow:
   * 1. Creates infrastructure (RDS, S3, etc.)
   * 2. Generates credentials
   * 3. Stores secrets in Bitwarden
   * 4. Stores config in control plane
   * 5. Runs migrations
   * 6. Marks as ready
   */
  app.post('/', async (c: Context) => {
    const body = await c.req.json<CreateTenantRequest>();

    // Validate request
    if (!body.tenantId) {
      return c.json({ error: 'tenantId is required' }, 400);
    }
    if (!body.tier || !['b2c', 'b2b-enterprise'].includes(body.tier)) {
      return c.json({ error: 'tier must be "b2c" or "b2b-enterprise"' }, 400);
    }
    if (!body.region) {
      return c.json({ error: 'region is required' }, 400);
    }

    // Set default isolation based on tier
    const isolation: TenantIsolationPolicy = body.isolation ?? {
      database: body.tier === 'b2b-enterprise' ? 'database' : 'shared',
      bucket: body.tier === 'b2b-enterprise' ? 'dedicated' : 'shared',
      cache: body.tier === 'b2b-enterprise' ? 'dedicated' : 'shared',
    };

    const input: CreateTenantRequest = {
      ...body,
      isolation,
    };

    try {
      if (!options.provisionTenant) {
        return c.json({
          error: 'Provisioning not enabled',
          message: 'A provisionTenant function must be provided to enable tenant creation',
        }, 501);
      }

      const tenant = await options.provisionTenant(input);

      return c.json({
        tenantId: tenant.tenantId,
        state: tenant.state,
        tier: tenant.tier,
        region: tenant.region,
        isolation: tenant.isolation,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
      } as TenantResponse, 201);
    } catch (error: any) {
      return c.json({
        error: 'Provisioning failed',
        message: error.message,
      }, 500);
    }
  });

  /**
   * PATCH /admin/tenants/:id/state
   * Update tenant state (for migration, disable, etc.)
   */
  app.patch('/:id/state', async (c: Context) => {
    const tenantId = c.req.param('id');
    const body = await c.req.json<UpdateTenantStateRequest>();

    if (!tenantId) {
      return c.json({ error: 'Tenant ID is required' }, 400);
    }

    if (!body.state || !['provisioning', 'ready', 'migrating', 'failed', 'disabled'].includes(body.state)) {
      return c.json({
        error: 'state must be one of: provisioning, ready, migrating, failed, disabled',
      }, 400);
    }

    // TODO: Update tenant state in controlDb
    return c.json({
      tenantId,
      state: body.state,
      message: 'State updated (not implemented)',
    });
  });

  /**
   * PATCH /admin/tenants/:id/isolation
   * Update tenant isolation policy (for migration between isolation modes)
   */
  app.patch('/:id/isolation', async (c: Context) => {
    const tenantId = c.req.param('id');
    const body = await c.req.json<UpdateTenantIsolationRequest>();

    if (!tenantId) {
      return c.json({ error: 'Tenant ID is required' }, 400);
    }

    // Validate isolation policy
    if (!body.isolation) {
      return c.json({ error: 'isolation is required' }, 400);
    }

    const validModes: IsolationMode[] = ['shared', 'schema', 'database', 'dedicated'];
    if (body.isolation.database && !validModes.includes(body.isolation.database)) {
      return c.json({ error: `Invalid database isolation mode: ${body.isolation.database}` }, 400);
    }
    if (body.isolation.bucket && !validModes.includes(body.isolation.bucket)) {
      return c.json({ error: `Invalid bucket isolation mode: ${body.isolation.bucket}` }, 400);
    }
    if (body.isolation.cache && !validModes.includes(body.isolation.cache)) {
      return c.json({ error: `Invalid cache isolation mode: ${body.isolation.cache}` }, 400);
    }

    // TODO: Update isolation in controlDb
    return c.json({
      tenantId,
      isolation: body.isolation,
      message: 'Isolation updated (not implemented)',
    });
  });

  /**
   * DELETE /admin/tenants/:id
   * Delete a tenant (and all their data)
   *
   * WARNING: This is a destructive operation
   */
  app.delete('/:id', async (c: Context) => {
    const tenantId = c.req.param('id');

    if (!tenantId) {
      return c.json({ error: 'Tenant ID is required' }, 400);
    }

    // Confirm deletion
    const confirm = c.req.header('X-Confirm-Deletion');
    if (confirm !== tenantId) {
      return c.json({
        error: 'Deletion requires confirmation',
        message: 'Include header "X-Confirm-Deletion: <tenant-id>" to confirm deletion',
      }, 400);
    }

    // TODO: Implement deletion workflow
    // 1. Mark tenant as 'disabled'
    // 2. Delete data from tenant database
    // 3. Delete S3 bucket (for dedicated buckets)
    // 4. Delete secrets from Bitwarden
    // 5. Remove from control plane

    return c.json({
      tenantId,
      message: 'Tenant deletion initiated (not implemented)',
    });
  });

  /**
   * GET /admin/tenants/:id/database
   * Get tenant database configuration (without secrets)
   */
  app.get('/:id/database', async (c: Context) => {
    const tenantId = c.req.param('id');

    try {
      const tenant = await options.tenantResolver.resolve(tenantId);

      return c.json({
        tenantId: tenant.tenantId,
        isolation: tenant.isolation.database,
        host: tenant.database.host,
        port: tenant.database.port,
        name: tenant.database.name,
        user: tenant.database.user,
        schema: tenant.database.schema,
        region: tenant.database.region,
        secretRef: tenant.database.secretRef,
      });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        return c.json({ error: 'Tenant not found', tenantId }, 404);
      }
      throw error;
    }
  });

  /**
   * GET /admin/tenants/:id/storage
   * Get tenant storage configuration (without secrets)
   */
  app.get('/:id/storage', async (c: Context) => {
    const tenantId = c.req.param('id');

    try {
      const tenant = await options.tenantResolver.resolve(tenantId);

      if (!tenant.storage) {
        return c.json({ error: 'Storage not configured for tenant', tenantId }, 404);
      }

      return c.json({
        tenantId: tenant.tenantId,
        isolation: tenant.isolation.bucket,
        bucket: tenant.storage.bucket,
        prefix: tenant.storage.prefix,
        region: tenant.storage.region,
        secretRef: tenant.storage.secretRef,
      });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        return c.json({ error: 'Tenant not found', tenantId }, 404);
      }
      throw error;
    }
  });

  /**
   * POST /admin/tenants/:id/cache/clear
   * Clear cached tenant configuration
   */
  app.post('/:id/cache/clear', async (c: Context) => {
    const tenantId = c.req.param('id');

    options.tenantResolver.invalidate(tenantId);

    return c.json({
      tenantId,
      message: 'Cache cleared',
    });
  });

  return app;
}

/**
 * Create tenant health check routes
 *
 * Provides endpoints for monitoring tenant health status.
 */
export function tenantHealthRoutes(options: {
  tenantResolver: TenantResolver;
}): Hono {
  const app = new Hono();

  /**
   * GET /health/tenants
   * Health check for all tenants
   */
  app.get('/', async (c: Context) => {
    // TODO: Implement health check for all tenants
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      tenants: 'not implemented',
    });
  });

  /**
   * GET /health/tenants/:id
   * Health check for specific tenant
   */
  app.get('/:id', async (c: Context) => {
    const tenantId = c.req.param('id');

    try {
      const tenant = await options.tenantResolver.resolve(tenantId);

      return c.json({
        tenantId,
        status: tenant.state === 'ready' ? 'healthy' : 'unhealthy',
        state: tenant.state,
        tier: tenant.tier,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        return c.json({
          tenantId,
          status: 'unknown',
          error: 'Tenant not found',
        }, 404);
      }
      return c.json({
        tenantId,
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }, 503);
    }
  });

  return app;
}
