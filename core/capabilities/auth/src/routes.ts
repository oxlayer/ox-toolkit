/**
 * Auth Routes - Token Generation Endpoints
 *
 * Automatically registers token generation routes when configured.
 * Integrates with OpenAPI for automatic documentation.
 */

import type { Context } from 'hono';
import { Hono } from 'hono';
import type { AuthMiddlewareOptions } from './types.js';
import {
  generateAnonymousToken,
  generateKeycloakToken,
  generateTenantToken,
  type TokenResponse,
} from './token.js';

/**
 * Request body schemas
 */
interface AnonymousTokenRequest {
  userId: string;
  metadata?: Record<string, unknown>;
}

interface KeycloakTokenRequest {
  username: string;
  password: string;
  realm?: string;
}

interface TenantTokenRequest {
  userId: string;
  tenantId: string;
  tenantName?: string;
  metadata?: Record<string, unknown>;
}

interface ErrorResponse {
  error: string;
}

/**
 * Create auth routes for token generation
 *
 * @param options - Auth middleware options (contains tokenRoutes config)
 * @returns Hono app with token generation routes
 *
 * @example
 * ```ts
 * import { createAuthRoutes, authMiddleware } from '@oxlayer/capabilities-auth';
 *
 * const auth = authMiddleware({
 *   jwtSecret: 'secret',
 *   tokenRoutes: {
 *     enableAnonymous: true,
 *     enableKeycloak: true,
 *     enableTenant: true,
 *   },
 * });
 *
 * const tokenRoutes = createAuthRoutes({
 *   jwtSecret: 'secret',
 *   keycloak: { url: 'http://keycloak:8080', realm: 'myrealm', clientId: 'myclient' },
 *   enableTenancy: true,
 *   tokenRoutes: {
 *     enableAnonymous: true,
 *     enableKeycloak: true,
 *     enableTenant: true,
 *   },
 * });
 *
 * app.route('/', tokenRoutes);
 * ```
 */
export function createAuthRoutes(options: AuthMiddlewareOptions): Hono {
  const {
    jwtSecret = '',
    keycloak,
    enableTenancy = false,
    tokenRoutes,
  } = options;

  if (!tokenRoutes) {
    return new Hono();
  }

  const {
    enableAnonymous = false,
    enableKeycloak = false,
    enableTenant = false,
    pathPrefix = '/auth',
    expiresIn = '7d',
  } = tokenRoutes;

  const app = new Hono();

  // Base path for all auth routes
  const basePath = pathPrefix.replace(/\/$/, '');

  /**
   * POST /auth/token/anonymous
   * Generate an anonymous user token
   */
  if (enableAnonymous && jwtSecret) {
    app.post(`${basePath}/token/anonymous`, async (c: Context) => {
      try {
        const body = await c.req.json<AnonymousTokenRequest>();

        if (!body.userId) {
          return c.json<ErrorResponse>({ error: 'userId is required' }, 400);
        }

        const result = generateAnonymousToken(body, { secret: jwtSecret, expiresIn });
        return c.json<TokenResponse>(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return c.json<ErrorResponse>({ error: message }, 400);
      }
    });
  }

  /**
   * POST /auth/token/keycloak
   * Generate token via Keycloak login
   */
  if (enableKeycloak && keycloak) {
    app.post(`${basePath}/token/keycloak`, async (c: Context) => {
      try {
        const body = await c.req.json<KeycloakTokenRequest>();

        if (!body.username || !body.password) {
          return c.json<ErrorResponse>({ error: 'username and password are required' }, 400);
        }

        const result = await generateKeycloakToken(body, {
          secret: jwtSecret,
          keycloak: {
            url: keycloak.url,
            realm: keycloak.realm,
            clientId: keycloak.clientId || '',
            clientSecret: keycloak.clientSecret,
          },
        });
        return c.json<TokenResponse>(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Authentication failed';
        return c.json<ErrorResponse>({ error: message }, 401);
      }
    });
  }

  /**
   * POST /auth/token/tenant
   * Generate a tenant-scoped token
   */
  if (enableTenant && enableTenancy && jwtSecret) {
    app.post(`${basePath}/token/tenant`, async (c: Context) => {
      try {
        const body = await c.req.json<TenantTokenRequest>();

        if (!body.userId || !body.tenantId) {
          return c.json<ErrorResponse>({ error: 'userId and tenantId are required' }, 400);
        }

        // Allow tenant ID from header as well
        const headerTenantId = c.req.header('X-Tenant-Id');
        if (headerTenantId && !body.tenantId) {
          body.tenantId = headerTenantId;
        }

        const result = generateTenantToken(body, {
          secret: jwtSecret,
          expiresIn,
          enableTenancy: true,
        });
        return c.json<TokenResponse>(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return c.json<ErrorResponse>({ error: message }, 400);
      }
    });
  }

  return app;
}

/**
 * Get OpenAPI path definitions for auth routes
 *
 * Use this to manually add auth routes to your OpenAPI spec
 *
 * @param options - Auth middleware options
 * @returns OpenAPI paths object
 */
export function getAuthRoutesOpenAPI(options: AuthMiddlewareOptions) {
  const {
    tokenRoutes,
    enableTenancy = false,
  } = options;

  if (!tokenRoutes) {
    return {};
  }

  const {
    enableAnonymous = false,
    enableKeycloak = false,
    enableTenant = false,
    pathPrefix = '/auth',
  } = tokenRoutes;

  const basePath = pathPrefix.replace(/\/$/, '');
  const paths: Record<string, any> = {};

  /**
   * POST /auth/token/anonymous
   */
  if (enableAnonymous) {
    paths[`${basePath}/token/anonymous`] = {
      post: {
        tags: ['Authentication'],
        summary: 'Generate anonymous user token',
        description: 'Creates a JWT token for anonymous/unauthenticated users',
        operationId: 'generateAnonymousToken',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User identifier for anonymous session',
                  },
                  metadata: {
                    type: 'object',
                    description: 'Optional metadata to include in token',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    type: { type: 'string', enum: ['anonymous'] },
                    expiresIn: { type: 'string' },
                    payload: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  /**
   * POST /auth/token/keycloak
   */
  if (enableKeycloak) {
    paths[`${basePath}/token/keycloak`] = {
      post: {
        tags: ['Authentication'],
        summary: 'Generate token via Keycloak login',
        description: 'Authenticates with Keycloak and returns an access token',
        operationId: 'generateKeycloakToken',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: {
                    type: 'string',
                    description: 'Keycloak username',
                  },
                  password: {
                    type: 'string',
                    description: 'Keycloak password',
                  },
                  realm: {
                    type: 'string',
                    description: 'Keycloak realm (optional, uses default if not provided)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    type: { type: 'string', enum: ['keycloak'] },
                    expiresIn: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Authentication failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  /**
   * POST /auth/token/tenant
   */
  if (enableTenant && enableTenancy) {
    paths[`${basePath}/token/tenant`] = {
      post: {
        tags: ['Authentication'],
        summary: 'Generate tenant-specific token',
        description: 'Creates a JWT token with tenant context for multi-tenant applications',
        operationId: 'generateTenantToken',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId', 'tenantId'],
                properties: {
                  userId: {
                    type: 'string',
                    description: 'User identifier',
                  },
                  tenantId: {
                    type: 'string',
                    description: 'Tenant identifier',
                  },
                  tenantName: {
                    type: 'string',
                    description: 'Tenant display name',
                  },
                  metadata: {
                    type: 'object',
                    description: 'Optional metadata',
                  },
                },
              },
            },
          },
        },
        parameters: [
          {
            name: 'X-Tenant-Id',
            in: 'header',
            description: 'Tenant ID (alternative to body)',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Token generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    type: { type: 'string', enum: ['tenant'] },
                    expiresIn: { type: 'string' },
                    payload: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        tenant_id: { type: 'string' },
                        tenant_name: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request or tenancy not enabled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  return paths;
}

/**
 * Register auth routes and add them to public paths
 *
 * @param app - Hono app to register routes on
 * @param options - Auth middleware options
 * @returns The same app for chaining
 */
export function registerAuthRoutes(app: Hono, options: AuthMiddlewareOptions): Hono {
  const authRoutes = createAuthRoutes(options);

  // Register the routes
  app.route('/', authRoutes);

  // Add auth routes to public paths so they don't require authentication
  if (options.tokenRoutes) {
    const pathPrefix = options.tokenRoutes.pathPrefix || '/auth';
    const publicPaths = options.publicPaths || [];

    // Add auth paths to public paths if not already there
    const authPaths = [
      `${pathPrefix}/token/anonymous`,
      `${pathPrefix}/token/keycloak`,
      `${pathPrefix}/token/tenant`,
    ];

    for (const authPath of authPaths) {
      if (!publicPaths.some(p => authPath.startsWith(p))) {
        publicPaths.push(authPath);
      }
    }

    options.publicPaths = publicPaths;
  }

  return app;
}
