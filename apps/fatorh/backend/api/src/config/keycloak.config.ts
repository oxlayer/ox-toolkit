/**
 * Keycloak Authentication Configuration with Multi-Tenancy
 *
 * Supports Keycloak-based multi-tenant architecture with:
 * - Realm-based tenant isolation (legal/security boundary)
 * - Workspace-based data isolation (database-per-workspace)
 * - Organization-based business boundary
 */

import type { MiddlewareHandler } from 'hono';
import { authMiddleware, type AuthMiddlewareOptions, registerAuthRoutes, getAuthRoutesOpenAPI } from '@oxlayer/capabilities-auth';
import { ENV } from './app.config.js';

/**
 * Auth middleware options (exported for route registration)
 *
 * Multi-tenant configuration:
 * - enableTenancy: true enables tenant context extraction from Keycloak JWT
 * - Tenant claims: realm, workspace.id, organization.id, roles, etc.
 *
 * IMPORTANT: JWT fallback is disabled when Keycloak is enabled to prevent
 * algorithm mismatch errors. Keycloak tokens use RS256 (asymmetric) while
 * JWT fallback expects HS256 (symmetric).
 */
export const authOptions: AuthMiddlewareOptions = {
  enableKeycloak: ENV.KEYCLOAK_ENABLED,
  keycloak: ENV.KEYCLOAK_SERVER_URL ? {
    url: ENV.KEYCLOAK_SERVER_URL,
    realm: ENV.KEYCLOAK_REALM || 'globex',
    clientId: ENV.KEYCLOAK_CLIENT_ID || 'globex-api',
  } : undefined,
  // Enable tenant context extraction from Keycloak JWT
  enableTenancy: true,
  // Enable JWT fallback for development without Keycloak
  // IMPORTANT: Disable when Keycloak is enabled to prevent algorithm mismatch
  enableJwt: !ENV.KEYCLOAK_ENABLED,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  },
  // Public paths that don't require authentication
  publicPaths: ['/health', '/public', '/docs', '/openapi.json', '/auth', '/api/auth', '/metrics'],
  // Enable token generation routes
  tokenRoutes: {
    enableAnonymous: true,
    enableKeycloak: ENV.KEYCLOAK_ENABLED,
    enableTenant: true, // Enable tenant token generation
    pathPrefix: '/auth',
    expiresIn: '7d',
  },
};

/**
 * Middleware to extract userId from authPayload and set it in context
 * This runs after authMiddleware to ensure userId is available for controllers
 */
const extractUserIdMiddleware: MiddlewareHandler = async (c, next) => {
  const authPayload = c.get('authPayload');
  if (authPayload) {
    // For JWT tokens, userId is in the 'sub' field
    // For Keycloak tokens, userId is extracted by the Keycloak strategy
    const userId = authPayload.sub || authPayload.user_id || authPayload.id;
    if (userId) {
      c.set('userId', String(userId));
    }
  }
  await next();
};

/**
 * Get auth middleware with Keycloak configuration
 * Returns the base auth middleware - userId extraction is handled separately
 */
export function getAuthMiddleware(): MiddlewareHandler {
  return authMiddleware(authOptions);
}

/**
 * Export the extractUserId middleware to be applied after auth middleware
 */
export { extractUserIdMiddleware };
export { registerAuthRoutes, getAuthRoutesOpenAPI };

/**
 * Keycloak configuration for direct integration (optional)
 */
export const keycloakConfig = {
  url: ENV.KEYCLOAK_SERVER_URL || '',
  realm: ENV.KEYCLOAK_REALM || 'globex',
  clientId: ENV.KEYCLOAK_CLIENT_ID || 'globex-api',
  // These would typically come from Bitwarden for service accounts
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
};

/**
 * Get Keycloak public key for JWT verification
 */
export async function getKeycloakPublicKey(): Promise<string> {
  if (!keycloakConfig.url) {
    return '';
  }

  const response = await fetch(
    `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`
  );
  const certs = await response.json();
  // Return the first public key (simplified - production would handle rotation)
  return certs.keys[0]?.n || '';
}

/**
 * Tenant context propagation middleware
 *
 * Extracts tenant context from Hono context (set by auth middleware)
 * and stores it in AsyncLocalStorage for automatic propagation to database layer.
 *
 * This enables the KeycloakDatabaseResolver to automatically resolve
 * the correct workspace database based on JWT claims.
 *
 * Note: Uses dynamic import with type assertion to work around DTS issues.
 */
export function tenantContextPropagationMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const tenantContext = c.get('tenantContext');

    if (tenantContext) {
      // Import dynamically - runtime works even if types are missing
      const tenancyModule = await import('@oxlayer/pro-tenancy');
      const setTenantContext = (tenancyModule as any).setTenantContext;
      if (typeof setTenantContext === 'function') {
        return setTenantContext(tenantContext, next);
      }
    }

    await next();
  };
}

/**
 * Realm-agnostic admin auth middleware
 *
 * Validates JWT tokens from any Keycloak realm (platform or client realms)
 * Extracts the issuer from the token's 'iss' claim to fetch the correct JWKS
 * Sets authPayload in context for role checking in controllers
 */
export function getAdminAuthMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-auth');

    log.debug('Admin auth middleware starting');

    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      log.debug('Missing or invalid Authorization header');
      return c.json({ error: 'Unauthorized', details: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.substring(7);
    log.debug('Token received', { tokenLength: token.length });

    // Decode token to get issuer without verification
    const jwt = await import('jsonwebtoken');
    const jwksRsa = await import('jwks-rsa');

    let decoded: any;
    try {
      decoded = jwt.decode(token, { complete: true });
      log.debug('Token decoded successfully', { header: decoded.header });
    } catch (err) {
      log.error('Failed to decode token', { error: err });
      return c.json({ error: 'Unauthorized', details: 'Invalid token format' }, 401);
    }

    if (!decoded || typeof decoded === 'string') {
      log.error('Invalid decoded token format');
      return c.json({ error: 'Unauthorized', details: 'Invalid token format' }, 401);
    }

    const payload = decoded.payload as any;
    const issuer = payload.iss;
    const kid = decoded.header.kid;

    log.debug('Token details', { issuer, kid });

    if (!issuer || !kid) {
      log.error('Missing issuer or kid in token');
      return c.json({ error: 'Unauthorized', details: 'Token missing issuer or kid' }, 401);
    }

    // Extract realm from issuer URL
    const realm = issuer.split('/').pop();
    if (!realm) {
      log.error('Could not extract realm from issuer', { issuer });
      return c.json({ error: 'Unauthorized', details: 'Invalid issuer format' }, 401);
    }

    log.debug('Extracted realm', { realm });

    // Build JWKS URI from token's issuer
    const keycloakUrl = ENV.KEYCLOAK_SERVER_URL || issuer.substring(0, issuer.lastIndexOf('/realms/'));
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    log.debug('Fetching JWKS', { jwksUri });

    // Get signing key - access jwksClient via the module
    // The package exports it as both named and default, use 'as any' to bypass type issues
    const createClient = (jwksRsa as any).jwksClient || (jwksRsa as any).default;
    const client = createClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 86400000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    let signingKey: string;
    try {
      log.debug('Fetching signing key', { kid });
      signingKey = await new Promise<string>((resolve, reject) => {
        client.getSigningKey(kid, (err: any, key: any) => {
          if (err) {
            log.error('getSigningKey error', { error: err });
            return reject(err);
          }
          log.debug('Signing key retrieved successfully');
          resolve(key.getPublicKey());
        });
      });
    } catch (err: any) {
      log.error('Failed to get signing key', { error: err?.message || err });
      return c.json({ error: 'Unauthorized', details: 'Failed to get signing key' }, 401);
    }

    // Verify token
    try {
      log.debug('Verifying token...');
      const verified = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer,
      }) as any;

      log.debug('Token verified successfully', { subject: verified.sub, realm_access: verified.realm_access?.roles });

      // Set verified payload in context for controllers
      c.set('authPayload', verified);
      c.set('realm', realm);

      await next();
    } catch (verifyError: any) {
      log.error('Token verification failed', { error: verifyError?.message || verifyError });
      return c.json({ error: 'Unauthorized', details: verifyError.message || 'Token verification failed' }, 401);
    }
  };
}

/**
 * Allowed Keycloak clients for API access
 *
 * This allow-list enables multi-tenant access where the same API serves
 * multiple client applications (web, candidate, supervisor, manager, etc.)
 * across different realms.
 *
 * Each tenant realm has the same client layout:
 * - globex_web (web app)
 * - globex_candidate (candidate app)
 * - globex_supervisor (supervisor app)
 * - globex_manager (manager app)
 * - globex_api (service/API client)
 */
const ALLOWED_KEYCLOAK_CLIENTS = new Set([
  'globex_web',
  'globex_people',
  'globex_candidate',
  'globex_supervisor',
  'globex_manager',
  'globex_api',
  'example-app',
  'example-people',
  'example-admin',
]);

/**
 * Realm-agnostic authentication middleware for API routes
 *
 * Validates JWT tokens from ANY Keycloak realm (platform or client realms)
 * by extracting the realm from the token's 'iss' claim and fetching the
 * correct JWKS dynamically.
 *
 * This enables multi-tenant SaaS architecture where:
 * - Each tenant = 1 Keycloak realm
 * - API accepts tokens from any realm
 * - Tenant context is derived from realm + claims
 *
 * Sets in context:
 * - authPayload: Full verified JWT payload
 * - userId: User ID from 'sub' claim
 * - realm: Realm name (extracted from iss)
 * - tenantContext: Tenant context for database resolver
 *
 * @returns Hono middleware handler
 */
export function getRealmAgnosticAuthMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('auth');

    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      log.debug('Missing Authorization header');
      return c.json({ error: 'Unauthorized', details: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.substring(7);

    // Decode token to get issuer without verification
    const jwt = await import('jsonwebtoken');
    const jwksRsa = await import('jwks-rsa');

    let decoded: any;
    try {
      decoded = jwt.decode(token, { complete: true });
    } catch (err) {
      log.error('Failed to decode token', { error: err });
      return c.json({ error: 'Unauthorized', details: 'Invalid token format' }, 401);
    }

    if (!decoded || typeof decoded === 'string') {
      log.error('Invalid decoded token format');
      return c.json({ error: 'Unauthorized', details: 'Invalid token format' }, 401);
    }

    const payload = decoded.payload as any;
    const issuer = payload.iss;
    const kid = decoded.header.kid;

    if (!issuer || !kid) {
      log.error('Missing issuer or kid in token');
      return c.json({ error: 'Unauthorized', details: 'Token missing issuer or kid' }, 401);
    }

    // Extract realm from issuer URL
    const realm = issuer.split('/').pop();
    if (!realm) {
      log.error('Could not extract realm from issuer', { issuer });
      return c.json({ error: 'Unauthorized', details: 'Invalid issuer format' }, 401);
    }

    // Build JWKS URI from token's issuer
    const keycloakUrl = ENV.KEYCLOAK_SERVER_URL || issuer.substring(0, issuer.lastIndexOf('/realms/'));
    const jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    // Get signing key
    const createClient = (jwksRsa as any).jwksClient || (jwksRsa as any).default;
    const client = createClient({
      jwksUri,
      cache: true,
      cacheMaxAge: 86400000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    let signingKey: string;
    try {
      signingKey = await new Promise<string>((resolve, reject) => {
        client.getSigningKey(kid, (err: any, key: any) => {
          if (err) return reject(err);
          resolve(key.getPublicKey());
        });
      });
    } catch (err: any) {
      log.error('Failed to get signing key', { kid, realm, error: err?.message });
      return c.json({ error: 'Unauthorized', details: 'Failed to get signing key' }, 401);
    }

    // Verify token
    try {
      const verified = jwt.verify(token, signingKey, {
        algorithms: ['RS256'],
        issuer,
      }) as any;

      log.debug('Token verified', {
        realm,
        userId: verified.sub?.slice(0, 8),
        client: verified.azp,
      });

      // Verify client is in allow-list
      const azp = verified.azp || verified.client_id;
      if (azp && !ALLOWED_KEYCLOAK_CLIENTS.has(azp)) {
        log.warn('Client not in allow-list', { azp, realm });
        return c.json({
          error: 'Forbidden',
          details: `Client "${azp}" is not authorized to access this API`,
        }, 403);
      }

      // Extract tenant context for multi-tenancy (optional - for workspace-based routing)
      let tenantContext: any = undefined;
      const hasOrganizationId = !!verified.organization_id;

      if (hasOrganizationId) {
        try {
          const { extractTenantContext } = await import('@oxlayer/capabilities-auth');
          tenantContext = extractTenantContext(verified, verified.organization_id);
          log.debug('Tenant context extracted', {
            realm: tenantContext.realm,
            workspaceId: tenantContext.workspaceId,
            organizationId: tenantContext.organizationId,
          });
        } catch (err: any) {
          log.debug('Failed to extract tenant context', {
            organizationId: verified.organization_id,
            error: err?.message || err?.toString() || String(err),
          });
        }
      }

      // Set verified payload and context in controllers
      c.set('authPayload', verified);
      c.set('authStrategy', 'keycloak');
      c.set('isAuthenticated', true);
      c.set('realm', realm);
      c.set('userId', String(verified.sub));

      // Set tenant context if available
      if (tenantContext) {
        c.set('tenantContext', tenantContext);
        c.set('tenantId', tenantContext.workspaceId);
        c.set('workspaceId', tenantContext.workspaceId);
      }

      await next();
    } catch (verifyError: any) {
      log.error('Token verification failed', { error: verifyError?.message || verifyError });
      return c.json({ error: 'Unauthorized', details: verifyError.message || 'Token verification failed' }, 401);
    }
  };
}
