/**
 * Role-based access control guards
 *
 * Provides middleware for protecting routes based on user roles
 * and tenant context (realm, workspace, organization).
 */

import type { Context, MiddlewareHandler } from 'hono';
import type { TenantContext } from '../keycloak/types.js';

export interface RoleGuardOptions {
  /** Allowed roles for this route */
  roles: string[];

  /** Allow cross-workspace access for specific roles */
  multiWorkspaceAccess?: string[];

  /** Require specific organization access */
  requireOrganization?: boolean;

  /** Require realm to match specific value */
  requireRealm?: string[];

  /** Allow platform realm only */
  platformOnly?: boolean;
}

/**
 * Extract tenant context from Hono context
 */
function getTenantContext(c: Context): TenantContext | undefined {
  return c.get('tenantContext');
}

/**
 * Check if user has any of the required roles
 */
function hasRequiredRoles(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * Role-based access control middleware
 *
 * Validates that the authenticated user has the required roles
 * and optionally enforces tenant context rules.
 *
 * @example
 * ```ts
 * import { roleGuard, clientGuard, candidateGuard } from '@oxlayer/capabilities-auth';
 *
 * // Custom role guard
 * app.use('/api/admin', roleGuard({ roles: ['admin', 'super-admin'] }));
 *
 * // Client realm guard (owner/supervisor/manager)
 * app.use('/api/people', clientGuard());
 *
 * // Candidate guard (hard workspace lock)
 * app.use('/api/candidate', candidateGuard());
 * ```
 */
export function roleGuard(options: RoleGuardOptions): MiddlewareHandler {
  return async (c, next) => {
    const tenantContext = getTenantContext(c);

    if (!tenantContext) {
      return c.json({ error: 'No tenant context found' }, 401);
    }

    // Get user roles
    const userRoles = 'roles' in tenantContext ? tenantContext.roles : [];

    // Check if user has required role
    const hasRole = hasRequiredRoles(userRoles, options.roles);

    if (!hasRole) {
      return c.json({
        error: 'Insufficient permissions',
        required: options.roles,
        userRoles,
      }, 403);
    }

    // Check platform-only restriction
    if (options.platformOnly) {
      const realm = 'realm' in tenantContext ? tenantContext.realm : undefined;
      if (realm && !realm.startsWith('realm-platform') && realm !== 'platform') {
        return c.json({
          error: 'Platform access only',
          realm,
        }, 403);
      }
    }

    // Check realm restriction
    if (options.requireRealm && options.requireRealm.length > 0) {
      const realm = 'realm' in tenantContext ? tenantContext.realm : undefined;
      if (!realm || !options.requireRealm.includes(realm)) {
        return c.json({
          error: 'Realm access denied',
          allowedRealms: options.requireRealm,
          userRealm: realm,
        }, 403);
      }
    }

    // Check organization requirement
    if (options.requireOrganization) {
      const organizationId = 'organizationId' in tenantContext ? tenantContext.organizationId : undefined;
      if (!organizationId) {
        return c.json({ error: 'Organization context required' }, 403);
      }
    }

    // Set workspace locked flag
    const canAccessMultipleWorkspaces = options.multiWorkspaceAccess?.some(role =>
      userRoles.includes(role)
    );

    c.set('multiWorkspaceAccess', canAccessMultipleWorkspaces);

    await next();
  };
}

/**
 * Platform-only guard
 * Restricts access to platform realm users only
 *
 * Allowed roles: platform-admin, platform-support, platform-ops
 *
 * @example
 * ```ts
 * import { platformGuard } from '@oxlayer/capabilities-auth';
 *
 * app.use('/api/platform', platformGuard());
 * app.use('/api/platform/admin', platformGuard(['platform-admin']));
 * ```
 */
export function platformGuard(requiredRoles: string[] = ['platform-admin', 'platform-support', 'platform-ops']): MiddlewareHandler {
  return roleGuard({
    roles: requiredRoles,
    platformOnly: true,
  });
}

/**
 * Client realm guard
 * Restricts access to client realm users (owner/supervisor/manager)
 *
 * Role permissions:
 * - owner: Multi-workspace access (all organizations/workspaces)
 * - supervisor: Multi-workspace access (all organizations/workspaces)
 * - manager: Organization-scoped access (single organization)
 *
 * @example
 * ```ts
 * import { clientGuard } from '@oxlayer/capabilities-auth';
 *
 * app.use('/api/people', clientGuard());
 * ```
 */
export function clientGuard(
  requiredRoles: string[] = ['owner', 'supervisor', 'manager'],
  options?: Partial<Pick<RoleGuardOptions, 'requireOrganization'>>
): MiddlewareHandler {
  return roleGuard({
    roles: requiredRoles,
    requireOrganization: options?.requireOrganization ?? true,
    multiWorkspaceAccess: ['owner', 'supervisor'],
  });
}

/**
 * Candidate guard
 * Restricts access to candidates only (hard workspace lock)
 *
 * Candidates can ONLY access their own workspace
 * No cross-workspace access allowed
 *
 * @example
 * ```ts
 * import { candidateGuard } from '@oxlayer/capabilities-auth';
 *
 * app.use('/api/app', candidateGuard());
 * ```
 */
export function candidateGuard(): MiddlewareHandler {
  return roleGuard({
    roles: ['candidate'],
  });
}

/**
 * Workspace-scoped guard
 * Ensures user can only access their assigned workspace
 *
 * For candidates and managers, this enforces hard workspace isolation
 * For owners and supervisors, allows multi-workspace access
 *
 * @example
 * ```ts
 * import { workspaceGuard } from '@oxlayer/capabilities-auth';
 *
 * app.use('/api/workspace', workspaceGuard());
 * ```
 */
export function workspaceGuard(): MiddlewareHandler {
  return async (c, next) => {
    const tenantContext = getTenantContext(c);

    if (!tenantContext) {
      return c.json({ error: 'No tenant context found' }, 401);
    }

    const userRoles = 'roles' in tenantContext ? tenantContext.roles : [];
    const canAccessMultipleWorkspaces = c.get('multiWorkspaceAccess') === true;

    // If user doesn't have multi-workspace access, verify workspace matches
    if (!canAccessMultipleWorkspaces) {
      const workspaceId = tenantContext.workspaceId;

      // Get workspace from request (if provided)
      const requestWorkspaceId = c.req.param('workspaceId') ||
        c.req.query()['workspace'] ||
        c.req.header('X-Workspace-Id');

      if (requestWorkspaceId && requestWorkspaceId !== workspaceId) {
        return c.json({
          error: 'Workspace access denied',
          userWorkspace: workspaceId,
          requestedWorkspace: requestWorkspaceId,
        }, 403);
      }
    }

    await next();
  };
}

/**
 * Organization-scoped guard
 * Ensures user can only access their assigned organization
 *
 * For managers, this enforces hard organization isolation
 * For owners and supervisors, allows multi-organization access
 *
 * @example
 * ```ts
 * import { organizationGuard } from '@oxlayer/capabilities-auth';
 *
 * app.use('/api/organization', organizationGuard());
 * ```
 */
export function organizationGuard(): MiddlewareHandler {
  return async (c, next) => {
    const tenantContext = getTenantContext(c);

    if (!tenantContext) {
      return c.json({ error: 'No tenant context found' }, 401);
    }

    const userRoles = 'roles' in tenantContext ? tenantContext.roles : [];
    const canAccessMultipleWorkspaces = c.get('multiWorkspaceAccess') === true;

    // If user doesn't have multi-workspace access, verify organization matches
    if (!canAccessMultipleWorkspaces) {
      const organizationId = 'organizationId' in tenantContext ? tenantContext.organizationId : undefined;

      if (!organizationId) {
        return c.json({ error: 'Organization context required' }, 403);
      }

      // Get organization from request (if provided)
      const requestOrgId = c.req.param('organizationId') ||
        c.req.query()['organization'] ||
        c.req.header('X-Organization-Id');

      if (requestOrgId && requestOrgId !== organizationId) {
        return c.json({
          error: 'Organization access denied',
          userOrganization: organizationId,
          requestedOrganization: requestOrgId,
        }, 403);
      }
    }

    await next();
  };
}

/**
 * Require specific realm access
 *
 * @example
 * ```ts
 * import { realmGuard } from '@oxlayer/capabilities-auth';
 *
 * // Only allow platform realm
 * app.use('/api/platform', realmGuard(['realm-platform', 'platform']));
 *
 * // Only allow specific client realms
 * app.use('/api/client', realmGuard(['realm-acme', 'realm-globex']));
 * ```
 */
export function realmGuard(allowedRealms: string[]): MiddlewareHandler {
  return roleGuard({
    roles: [], // No specific role requirement, just realm check
    requireRealm: allowedRealms,
  });
}
