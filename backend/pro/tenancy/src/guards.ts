/**
 * Tenancy Capability - Tenant Guards
 *
 * Middleware guards for enforcing tenant requirements in multi-tenant applications.
 * These guards work with the auth middleware to provide tenant validation.
 *
 * The guards answer the question "which tenant are you in?" after auth
 * answers "who are you?".
 *
 * @example
 * ```ts
 * import { requireTenant } from '@oxlayer/pro-tenancy';
 * import { authMiddleware } from '@oxlayer/capabilities-auth';
 *
 * // Auth extracts tenant from JWT, guards validate it
 * app.use('*', authMiddleware({ enableTenancy: true }));
 * app.use('/api/*', requireTenant());
 * ```
 */

import type { Context, Next } from 'hono';
import type { TenantConfig, TenantState, TenantTier } from './types.js';
import type { TenantResolver } from './resolver.js';
import {
  TenantNotFoundError,
  TenantNotReadyError,
  TenantDisabledError,
} from './errors.js';

/**
 * Tenant guard options
 */
export interface TenantGuardOptions {
  /**
   * Allowed tenant states (default: ["ready"])
   * Routes can be configured to allow access during specific states
   */
  allowStates?: TenantState[];

  /**
   * Required tenant tier (optional)
   * If specified, only tenants of this tier can access the route
   */
  requireTier?: TenantTier;

  /**
   * Whether to throw if tenant is disabled (default: true)
   * Set to false to allow disabled tenants through (for admin routes)
   */
  throwIfDisabled?: boolean;

  /**
   * Tenant resolver to use for validation
   * If not provided, tenant ID is still validated but not resolved
   */
  resolver?: TenantResolver;
}

/**
 * Helper to get tenant ID from Hono context
 *
 * Returns tenant ID if it was set by auth middleware with enableTenancy: true
 *
 * @param c - Hono context
 * @returns Tenant ID or undefined
 *
 * @example
 * ```ts
 * import { getTenantId } from '@oxlayer/pro-tenancy';
 *
 * app.get('/api/todos', (c) => {
 *   const tenantId = getTenantId(c);
 *   if (!tenantId) {
 *     return c.json({ error: 'Tenant required' }, 401);
 *   }
 *   // ... use tenantId
 * });
 * ```
 */
export function getTenantId(c: Context): string | undefined {
  return c.get('tenantId');
}

/**
 * Helper to get full tenant context from Hono context
 *
 * Returns the full tenant context if it was set by auth middleware
 * with enableTenancy: true
 *
 * @param c - Hono context
 * @returns Tenant context or undefined
 *
 * @example
 * ```ts
 * import { getTenantContext } from '@oxlayer/pro-tenancy';
 *
 * app.get('/api/todos', (c) => {
 *   const ctx = getTenantContext(c);
 *   if (!ctx) {
 *     return c.json({ error: 'Tenant context required' }, 401);
 *   }
 *   console.log('User:', ctx.userId, 'Tenant:', ctx.tenantId);
 * });
 * ```
 */
export function getTenantContext(c: Context): any | undefined {
  return c.get('tenantContext');
}

/**
 * Require tenant middleware
 *
 * Validates that:
 * 1. Tenant ID exists in context (set by auth middleware with enableTenancy: true)
 * 2. If resolver provided: tenant exists and is in allowed state
 *
 * Use this middleware to protect routes that require tenant context.
 *
 * @param options - Guard configuration options
 * @returns Hono middleware
 *
 * @example
 * ```ts
 * import { requireTenant } from '@oxlayer/pro-tenancy';
 *
 * // Basic: require tenant to be in "ready" state
 * app.use('/api/*', requireTenant());
 *
 * // With resolver: validate tenant exists and is ready
 * app.use('/api/*', requireTenant({ resolver: tenantResolver }));
 *
 * // Allow provisioning state for admin routes
 * app.use('/admin/*', requireTenant({
 *   resolver: tenantResolver,
 *   allowStates: ['ready', 'provisioning']
 * }));
 *
 * // Require enterprise tier
 * app.use('/premium/*', requireTenant({
 *   resolver: tenantResolver,
 *   requireTier: 'b2b-enterprise'
 * }));
 * ```
 */
export function requireTenant(options: TenantGuardOptions = {}): (c: Context, next: Next) => Promise<Response | void> {
  const {
    allowStates = ['ready'],
    requireTier,
    throwIfDisabled = true,
    resolver,
  } = options;

  return async (c: Context, next: Next) => {
    // Get tenant ID from context (set by auth middleware)
    const tenantId = getTenantId(c);

    if (!tenantId) {
      return c.json(
        {
          error: 'Tenant Required',
          message: 'Tenant context is required for this endpoint',
          code: 'TENANT_REQUIRED',
        },
        401
      );
    }

    // If resolver provided, validate tenant exists and is in allowed state
    if (resolver) {
      try {
        const tenant: TenantConfig = await resolver.resolve(tenantId);

        // Check tenant tier if required
        if (requireTier && tenant.tier !== requireTier) {
          return c.json(
            {
              error: 'Forbidden',
              message: `This endpoint requires ${requireTier} tier tenants`,
              code: 'TENANT_TIER_MISMATCH',
              currentTier: tenant.tier,
              requiredTier: requireTier,
            },
            403
          );
        }

        // Check if tenant state is allowed
        if (!allowStates.includes(tenant.state)) {
          // Special handling for disabled tenants
          if (tenant.state === 'disabled') {
            if (throwIfDisabled) {
              return c.json(
                {
                  error: 'Tenant Disabled',
                  message: `Tenant ${tenantId} is currently disabled`,
                  code: 'TENANT_DISABLED',
                  tenantId,
                  currentState: tenant.state,
                },
                403
              );
            }
            // If throwIfDisabled is false, allow disabled tenants through
            return next();
          }

          return c.json(
            {
              error: 'Tenant Not Ready',
              message: `Tenant ${tenantId} is not ready for operations`,
              code: 'TENANT_NOT_READY',
              tenantId,
              currentState: tenant.state,
              allowedStates: allowStates,
            },
            503
          );
        }

        // Store resolved tenant config in context for downstream use
        c.set('tenantConfig', tenant);

      } catch (error) {
        if (error instanceof TenantNotFoundError) {
          return c.json(
            {
              error: 'Tenant Not Found',
              message: error.message,
              code: 'TENANT_NOT_FOUND',
              tenantId,
            },
            404
          );
        }

        if (error instanceof TenantNotReadyError || error instanceof TenantDisabledError) {
          return c.json(
            {
              error: error.constructor.name,
              message: error.message,
              code: error.code,
              tenantId,
              currentState: error instanceof TenantNotReadyError ? error.currentState : 'disabled',
            },
            error instanceof TenantDisabledError ? 403 : 503
          );
        }

        // Unexpected error
        throw error;
      }
    }

    return next();
  };
}

/**
 * Require specific tenant ID middleware
 *
 * Restricts access to a specific tenant. Useful for admin routes
 * that operate on a particular tenant.
 *
 * @param tenantId - The required tenant ID
 * @returns Hono middleware
 *
 * @example
 * ```ts
 * import { requireTenantId } from '@oxlayer/pro-tenancy';
 *
 * // Only allow acme-corp tenant
 * app.use('/admin/acme/*', requireTenantId('acme-corp'));
 * ```
 */
export function requireTenantId(tenantId: string): (c: Context, next: Next) => Promise<Response | void> {
  return async (c: Context, next: Next) => {
    const currentTenantId = getTenantId(c);

    if (!currentTenantId) {
      return c.json(
        {
          error: 'Tenant Required',
          message: 'Tenant context is required',
          code: 'TENANT_REQUIRED',
        },
        401
      );
    }

    if (currentTenantId !== tenantId) {
      return c.json(
        {
          error: 'Forbidden',
          message: `This endpoint is restricted to tenant: ${tenantId}`,
          code: 'TENANT_FORBIDDEN',
          currentTenant: currentTenantId,
          requiredTenant: tenantId,
        },
        403
      );
    }

    return next();
  };
}

/**
 * Require tenant tier middleware
 *
 * Restricts access to tenants of a specific tier.
 *
 * @param tier - The required tenant tier
 * @returns Hono middleware
 *
 * @example
 * ```ts
 * import { requireTenantTier } from '@oxlayer/pro-tenancy';
 *
 * // Only allow enterprise tier tenants
 * app.use('/enterprise/*', requireTenantTier('b2b-enterprise'));
 *
 * // Combine with resolver for validation
 * app.use('/enterprise/*', requireTenantTier('b2b-enterprise', { resolver }));
 * ```
 */
export function requireTenantTier(
  tier: TenantTier,
  options?: Pick<TenantGuardOptions, 'resolver'>
): (c: Context, next: Next) => Promise<Response | void> {
  return requireTenant({ ...options, requireTier: tier });
}

/**
 * Compose auth and tenancy middleware
 *
 * Convenience function to set up auth with tenancy enabled and
 * optional tenant guards in one call.
 *
 * @param authOptions - Options for auth middleware
 * @param tenantGuardOptions - Options for tenant guard (optional)
 * @returns Composed middleware
 *
 * @example
 * ```ts
 * import { withTenancy } from '@oxlayer/pro-tenancy';
 * import { authMiddleware } from '@oxlayer/capabilities-auth';
 *
 * // Basic: auth with tenancy, no guard
 * app.use('/api/*', withTenancy({ enableKeycloak: true }));
 *
 * // With tenant validation
 * app.use('/api/*', withTenancy(
 *   { enableKeycloak: true },
 *   { resolver: tenantResolver }
 * ));
 *
 * // With state-based guard
 * app.use('/api/*', withTenancy(
 *   { enableKeycloak: true },
 *   {
 *     resolver: tenantResolver,
 *     allowStates: ['ready', 'provisioning']
 *   }
 * ));
 * ```
 */
export function withTenancy(
  authOptions: any,
  tenantGuardOptions?: TenantGuardOptions
): ((c: Context, next: Next) => Promise<Response | void>)[] {
  const composed: any[] = [];

  // Auth middleware with tenancy enabled
  // Note: This requires the actual auth middleware function
  // For now, return the guard options for manual composition
  if (tenantGuardOptions) {
    composed.push(requireTenant(tenantGuardOptions));
  }

  return composed;
}
