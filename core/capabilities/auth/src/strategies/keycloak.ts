import type { Context } from 'hono';
import { KeycloakService } from '../keycloak/index.js';
import type {
  KeycloakConfig,
  TenantContext,
} from '../keycloak/types.js';
import type { AuthResult } from '../types.js';

export interface KeycloakStrategyOptions extends KeycloakConfig {
  /**
   * Enable tenant context extraction from authentication tokens
   * When false (default), auth is tenant-agnostic and no tenant context is set
   * When true, tenant_id is extracted from JWT claims or organization_id
   *
   * @default false
   */
  enableTenancy?: boolean;
}

/**
 * Keycloak authentication strategy
 * Attempts to authenticate using a Keycloak JWT token from the Authorization header
 *
 * When enableTenancy is true, extracts tenant context from:
 * 1. Custom "tenant_id" claim in JWT (legacy)
 * 2. "realm" claim (legal/security boundary)
 * 3. "workspace" claim with "id" (data boundary)
 * 4. "organization" claim with "id" (business boundary)
 *
 * When enableTenancy is false (default), authentication is tenant-agnostic.
 */
export async function keycloakStrategy(
  c: Context,
  options: KeycloakStrategyOptions
): Promise<AuthResult> {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return {
      valid: false,
      error: 'Missing Authorization header',
    };
  }

  try {
    const keycloakService = new KeycloakService(options);
    const validation = await keycloakService.validateToken(authHeader);

    if (!validation.valid || !validation.payload) {
      return {
        valid: false,
        error: validation.error || 'Keycloak token validation failed',
      };
    }

    // Extract additional user information
    const organizationId = await keycloakService.getOrganizationIdFromToken(authHeader);
    const workspaceId = await keycloakService.getWorkspaceIdFromToken(authHeader);
    const userType = await keycloakService.getUserTypeFromToken(authHeader);
    const userId = await keycloakService.getUserIdFromToken(authHeader);
    const userEmail = await keycloakService.getUserEmailFromToken(authHeader);
    const userRoles = await keycloakService.getUserRolesFromToken(authHeader);

    // Ensure userId is not null - if token is valid, userId should exist
    if (!userId) {
      return {
        valid: false,
        error: 'Token missing user ID (sub claim)',
      };
    }

    // Get realm from token or config
    const realm = validation.realm || keycloakService.getRealm();

    // Set context variables for easy access
    c.set('organizationId', organizationId);
    c.set('userId', userId);
    if (userEmail) {
      c.set('userEmail', userEmail);
    }
    c.set('userRoles', userRoles);
    c.set('userType', userType);
    c.set('keycloakPayload', validation.payload);
    c.set('realm', realm);

    // Build base payload
    const payload: any = {
      ...validation.payload,
      organizationId,
      workspaceId,
      realm,
      userType,
      userId,
      userEmail,
      userRoles,
    };

    // Conditionally extract and set tenant context
    let tenantContext: TenantContext | undefined;

    if (options.enableTenancy) {
      // Extract enhanced tenant context (multi-realm)
      try {
        tenantContext = extractTenantContext(validation.payload, organizationId ?? undefined);
        c.set('tenantContext', tenantContext);
        c.set('tenantId', tenantContext.workspaceId);
        c.set('workspaceId', tenantContext.workspaceId);
        payload.tenantContext = tenantContext;
        payload.tenantId = tenantContext.workspaceId;
      } catch (error) {
        // If tenant context extraction fails, log but don't fail auth
        console.warn('Failed to extract tenant context:', (error as Error).message);
      }
    }

    return {
      valid: true,
      strategy: 'keycloak',
      payload,
      tenantContext,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Keycloak authentication failed',
    };
  }
}

/**
 * Extract tenant context from JWT payload
 *
 * @param payload - Decoded JWT payload
 * @param organizationId - Organization ID from Keycloak (optional, for backward compat)
 * @returns Tenant context with realm, workspace, organization
 * @throws Error if required claims are missing
 */
export function extractTenantContext(payload: any, organizationId?: string): TenantContext {
  // Extract realm (from claim or issuer)
  const realm = payload.realm || payload.iss?.split('/').pop();
  if (!realm) {
    throw new Error('No realm found in token');
  }

  // Extract workspace
  const workspace = payload.workspace;
  const workspaceId = workspace?.id || (typeof workspace === 'string' ? workspace : undefined);
  if (!workspaceId) {
    throw new Error('No workspace found in token');
  }

  // Extract organization (optional for members, or use provided orgId)
  let orgId: string | undefined;
  if (organizationId) {
    orgId = organizationId;
  } else if (workspace && typeof workspace === 'object' && 'organizationId' in workspace) {
    orgId = workspace.organizationId;
  } else if (payload.organization) {
    const org = payload.organization;
    if (typeof org === 'string') {
      orgId = org;
    } else if (typeof org === 'object' && 'id' in org) {
      orgId = org.id;
    } else if (!Array.isArray(org)) {
      // Legacy format: { "org-name": { "id": "uuid" } }
      const firstOrg = Object.values(org)[0] as Record<string, unknown> | undefined;
      if (firstOrg && typeof firstOrg === 'object' && 'id' in firstOrg) {
        orgId = firstOrg.id as string | undefined;
      }
    }
  }

  // Extract user info
  const userId = payload.sub;
  if (!userId) {
    throw new Error('No user ID found in token');
  }

  const roles = payload.realm_access?.roles || payload.roles || [];

  return {
    realm,
    workspaceId,
    organizationId: orgId,
    userId,
    roles,
    email: payload.email,
    userType: payload.user_type,
  };
}

/**
 * Validate tenant context claims
 * Throws if required claims are missing or malformed
 *
 * @param payload - Decoded JWT payload
 * @returns Validated tenant context
 */
export function validateTenantContext(payload: any): TenantContext {
  const context = extractTenantContext(payload);

  // Validate realm format
  if (!context.realm || typeof context.realm !== 'string') {
    throw new Error('Invalid realm claim');
  }

  // Validate workspace format
  if (!context.workspaceId || typeof context.workspaceId !== 'string') {
    throw new Error('Invalid workspace claim');
  }

  // Validate roles
  if (!Array.isArray(context.roles)) {
    throw new Error('Invalid roles claim');
  }

  return context;
}
