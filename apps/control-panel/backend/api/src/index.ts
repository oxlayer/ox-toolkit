/**
 * OxLayer Control Panel API
 *
 * Main entry point for the SDK distribution control panel backend
 * Using Hono with Zod OpenAPI for schema validation and documentation
 */

import { serve } from '@hono/node-server';
import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from './config/index.js';

// API Version - should be incremented for breaking changes
// This version is used for client generation and compatibility checking
export const API_VERSION = '0.0.1';
import {
  ErrorResponseSchema,
  HealthResponseSchema,
  LicenseTierSchema,
  LicenseStatusSchema,
  EnvironmentSchema,
  ApiKeyScopeSchema,
  ApiKeyStatusSchema,
  SdkPackageTypeSchema,
  CapabilityNameSchema,
  CapabilityLimitsSchema,
  OrganizationSchema,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  DeveloperSchema,
  CreateDeveloperSchema,
  LicenseSchema,
  CreateLicenseSchema,
  UpdateLicenseSchema,
  AddPackageSchema,
  UpdateCapabilitySchema,
  ApiKeySchema,
  CreateApiKeySchema,
  CapabilityResolutionRequestSchema,
  CapabilityResolutionResponseSchema,
  PackageDownloadRequestSchema,
  PackageDownloadResponseSchema,
  createPaginatedResponseSchema,
} from './routes/v1/schemas.js';

// Create OpenAPIHono app
const app = new OpenAPIHono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean);
    return allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  },
  credentials: true,
}));

// ============================================================================
// Health Check
// ============================================================================

const healthRoute = app.openapi(
  {
    method: 'get',
    path: '/health',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: HealthResponseSchema,
          },
        },
        description: 'Health check response',
      },
    },
  },
  (c) => {
    return c.json({
      status: 'ok' as const,
      version: API_VERSION,
      timestamp: new Date().toISOString(),
    });
  }
);

// Version endpoint - for client compatibility checking
const versionSchema = z.object({
  version: z.string().openapi({
    example: '0.0.1',
    description: 'API version for client compatibility checking',
  }),
  minClientVersion: z.string().openapi({
    example: '0.0.1',
    description: 'Minimum client version compatible with this API',
  }),
});

app.openapi(
  {
    method: 'get',
    path: '/version',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: versionSchema,
          },
        },
        description: 'API version information',
      },
    },
  },
  (c) => {
    return c.json({
      version: API_VERSION,
      minClientVersion: '0.0.1', // Minimum client version that works with this API
    });
  }
);

// ============================================================================
// API v1 Routes
// ============================================================================

const v1 = new OpenAPIHono();

// Health check (v1)
v1.openapi(
  {
    method: 'get',
    path: '/health',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: HealthResponseSchema,
          },
        },
        description: 'Health check response',
      },
    },
  },
  (c) => {
    return c.json({
      status: 'ok' as const,
      version: '0.0.1',
      timestamp: new Date().toISOString(),
    });
  }
);

// ============================================================================
// Capabilities Resolution (SDK-facing endpoint)
// ============================================================================

v1.openapi(
  {
    method: 'post',
    path: '/capabilities/resolve',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CapabilityResolutionRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: CapabilityResolutionResponseSchema,
          },
        },
        description: 'Capability resolution response with limits and configuration',
      },
      401: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Unauthorized - invalid API key',
      },
    },
  },
  async (c) => {
    const body = c.req.valid('json') as {
      apiKey: string;
      projectId?: string;
      environment: 'development' | 'staging' | 'production';
      requested: Array<'auth' | 'storage' | 'search' | 'vector' | 'cache' | 'events' | 'metrics' | 'telemetry' | 'queues' | 'scheduler'>;
    };
    // TODO: Implement actual capability resolution with license validation
    return c.json({
      data: {
        apiKey: body.apiKey,
        projectId: body.projectId ?? undefined,
        environment: body.environment,
        requested: body.requested as Array<'auth' | 'storage' | 'search' | 'vector' | 'cache' | 'events' | 'metrics' | 'telemetry' | 'queues' | 'scheduler'>,
        capabilities: {
          auth: { maxRealms: 10, sso: true, rbac: true },
          storage: { encryption: true, maxStorageGb: 1000 },
          search: { maxResults: 10000 },
        },
        restrictions: [] as string[],
        resolvedAt: new Date().toISOString(),
      },
    }, 200);
  }
);

// ============================================================================
// Package Download (SDK-facing endpoint)
// ============================================================================

v1.openapi(
  {
    method: 'post',
    path: '/packages/download',
    request: {
      body: {
        content: {
          'application/json': {
            schema: PackageDownloadRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: PackageDownloadResponseSchema,
          },
        },
        description: 'Signed download URL for the requested package',
      },
      401: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Unauthorized - invalid API key or insufficient license',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Package not found',
      },
    },
  },
  async (c) => {
    const body = c.req.valid('json') as {
      apiKey: string;
      packageType: 'backend-sdk' | 'frontend-sdk' | 'cli-tools' | 'channels';
      version?: string;
    };
    // TODO: Implement actual package download with R2/S3 signed URL
    return c.json({
      data: {
        packageType: body.packageType as 'backend-sdk' | 'frontend-sdk' | 'cli-tools' | 'channels',
        version: body.version || '2025_02_08_001',
        downloadUrl: `https://storage.example.com/sdk/${body.packageType}.zip?signature=...`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        sha256: 'a1b2c3d4e5f6...',
        size: 10485760,
      },
    }, 200);
  }
);

// ============================================================================
// Latest Version
// ============================================================================

v1.openapi(
  {
    method: 'get',
    path: '/latest-version',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: z.object({
                version: z.string().openapi({
                  example: '2025_02_08_001',
                  description: 'Latest SDK version in YYYY_MM_DD_NNN format',
                }),
              }),
            }),
          },
        },
        description: 'Latest available SDK version',
      },
    },
  },
  (c) => {
    return c.json({
      data: {
        version: '2025_02_08_001',
      },
    });
  }
);

// ============================================================================
// Organizations Routes
// ============================================================================

const organizations = new OpenAPIHono();

// List organizations
organizations.openapi(
  {
    method: 'get',
    path: '/',
    responses: {
      200: {
        content: {
          'application/json': {
            schema: createPaginatedResponseSchema(OrganizationSchema),
          },
        },
        description: 'List all organizations',
      },
    },
  },
  (c) => {
    return c.json({
      data: [],
      meta: { count: 0, total: 0 },
    });
  }
);

// Create organization
organizations.openapi(
  {
    method: 'post',
    path: '/',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateOrganizationSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: z.object({
              data: OrganizationSchema,
            }),
          },
        },
        description: 'Organization created successfully',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Bad request - validation error',
      },
      409: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Conflict - slug already exists',
      },
    },
  },
  async (c) => {
    const body = c.req.valid('json') as {
      name: string;
      slug: string;
      tier?: 'starter' | 'professional' | 'enterprise' | 'custom';
      maxDevelopers?: number;
      maxProjects?: number;
    };
    // TODO: Implement actual organization creation
    return c.json({
      data: {
        id: crypto.randomUUID(),
        name: body.name,
        slug: body.slug,
        tier: (body.tier || 'starter') as 'starter' | 'professional' | 'enterprise' | 'custom',
        maxDevelopers: body.maxDevelopers ?? 5,
        maxProjects: body.maxProjects ?? 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, 201);
  }
);

// Get organization by ID
organizations.openapi(
  {
    method: 'get',
    path: '/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: {
            name: 'id',
            in: 'path',
          },
          example: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: OrganizationSchema,
            }),
          },
        },
        description: 'Organization details',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Organization not found',
      },
    },
  },
  (c) => {
    const { id } = c.req.valid('param');
    // TODO: Implement actual organization fetch
    return c.json({
      data: {
        id,
        name: 'Example Org',
        slug: 'example-org',
        tier: 'starter' as const,
        maxDevelopers: 5,
        maxProjects: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, 200);
  }
);

// Update organization
organizations.openapi(
  {
    method: 'patch',
    path: '/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: { name: 'id', in: 'path' },
          example: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }),
      body: {
        content: {
          'application/json': {
            schema: UpdateOrganizationSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: OrganizationSchema,
            }),
          },
        },
        description: 'Organization updated successfully',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Organization not found',
      },
    },
  },
  async (c) => {
    const { id } = c.req.valid('param');
    const body = c.req.valid('json') as {
      name?: string;
      tier?: 'starter' | 'professional' | 'enterprise' | 'custom';
      maxDevelopers?: number;
      maxProjects?: number;
    };
    // TODO: Implement actual organization update
    return c.json({
      data: {
        id,
        name: body.name ?? 'Example Org',
        slug: 'example-org',
        tier: (body.tier ?? 'starter') as 'starter' | 'professional' | 'enterprise' | 'custom',
        maxDevelopers: body.maxDevelopers ?? 5,
        maxProjects: body.maxProjects ?? 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, 200);
  }
);

// Delete organization
organizations.openapi(
  {
    method: 'delete',
    path: '/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: { name: 'id', in: 'path' },
          example: '550e8400-e29b-41d4-a716-446655440000',
        }),
      }),
    },
    responses: {
      204: {
        description: 'Organization deleted successfully',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Organization not found',
      },
    },
  },
  (c) => {
    const { id } = c.req.valid('param');
    // TODO: Implement actual organization delete
    return c.newResponse(null, { status: 204 });
  }
);

// Mount organizations
v1.route('/organizations', organizations);

// ============================================================================
// Developers Routes
// ============================================================================

const developers = new OpenAPIHono();

// Get developer by ID
developers.openapi(
  {
    method: 'get',
    path: '/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: { name: 'id', in: 'path' },
          example: '550e8400-e29b-41d4-a716-446655440001',
        }),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: DeveloperSchema,
            }),
          },
        },
        description: 'Developer details',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'Developer not found',
      },
    },
  },
  (c) => {
    const { id } = c.req.valid('param');
    return c.json({
      data: {
        id,
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john@example.com',
        environments: ['development'] as Array<'development' | 'staging' | 'production'>,
        createdAt: new Date().toISOString(),
      },
    }, 200);
  }
);

// Mount developers
v1.route('/developers', developers);

// ============================================================================
// Licenses Routes
// ============================================================================

const licenses = new OpenAPIHono();

// Get license by ID
licenses.openapi(
  {
    method: 'get',
    path: '/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: { name: 'id', in: 'path' },
          example: '550e8400-e29b-41d4-a716-446655440002',
        }),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: LicenseSchema,
            }),
          },
        },
        description: 'License details with full capability configuration',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'License not found',
      },
    },
  },
  (c) => {
    const { id } = c.req.valid('param');
    return c.json({
      data: {
        id,
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Enterprise License',
        tier: 'enterprise' as 'starter' | 'professional' | 'enterprise' | 'custom',
        status: 'active' as 'active' | 'suspended' | 'expired' | 'revoked',
        packages: ['backend-sdk', 'frontend-sdk'] as Array<'backend-sdk' | 'frontend-sdk' | 'cli-tools' | 'channels'>,
        capabilities: {
          auth: { maxRealms: 100, sso: true, rbac: true },
          storage: { encryption: true, maxStorageGb: -1 },
        },
        expiresAt: null,
        isValid: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, 200);
  }
);

// Mount licenses
v1.route('/licenses', licenses);

// ============================================================================
// API Keys Routes
// ============================================================================

const apiKeys = new OpenAPIHono();

// Get API key by ID
apiKeys.openapi(
  {
    method: 'get',
    path: '/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: { name: 'id', in: 'path' },
          example: '550e8400-e29b-41d4-a716-446655440003',
        }),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              data: ApiKeySchema,
            }),
          },
        },
        description: 'API key details',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorResponseSchema,
          },
        },
        description: 'API key not found',
      },
    },
  },
  (c) => {
    const { id } = c.req.valid('param');
    return c.json({
      data: {
        id,
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
        developerId: '550e8400-e29b-41d4-a716-446655440001' as string | null,
        licenseId: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Production Key',
        keyPrefix: 'oxl_',
        keyPreview: 'oxl_****',
        scopes: ['read', 'write'] as Array<'read' | 'write' | 'admin' | 'install'>,
        status: 'active' as 'active' | 'revoked' | 'expired',
        expiresAt: null,
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, 200);
  }
);

// Mount API keys
v1.route('/api-keys', apiKeys);

// ============================================================================
// Mount v1 routes
// ============================================================================

app.route('/v1', v1);

// ============================================================================
// OpenAPI Documentation
// ============================================================================

app.doc('/doc', {
  openapi: '3.1.0',
  info: {
    version: API_VERSION,
    title: 'OxLayer Control Panel API',
    description: `
# OxLayer Control Panel API

The OxLayer Control Panel API provides endpoints for managing SDK distribution,
including organizations, developers, licenses, and API keys.

## Key Concepts

### Capability Resolution

The API returns **capability configuration**, not boolean flags. This allows SDKs
to enforce limits and features based on the license tier.

\`\`\`json
{
  "auth": { "maxRealms": 10, "sso": true, "rbac": true },
  "storage": { "encryption": true, "maxStorageGb": 1000 }
}
\`\`\`

### License Tiers

- **starter**: 5 developers, 3 projects
- **professional**: 25 developers, 20 projects
- **enterprise**: 100 developers, unlimited projects
- **custom**: Flexible limits

### Authentication

All SDK-facing endpoints require an API key in the format \`oxl_*\`.
    `,
    contact: {
      name: 'OxLayer Support',
      email: 'support@oxlayer.dev',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server',
    },
    {
      url: 'https://api.oxlayer.dev',
      description: 'Production server',
    },
  ],
  tags: [
    { name: 'health', description: 'Health check endpoints' },
    { name: 'capabilities', description: 'SDK capability resolution' },
    { name: 'packages', description: 'Package download endpoints' },
    { name: 'organizations', description: 'Organization management' },
    { name: 'developers', description: 'Developer management' },
    { name: 'licenses', description: 'License management' },
    { name: 'api-keys', description: 'API key management' },
  ],
});

// Swagger UI route
app.get('/swagger-ui', async (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OxLayer Control Panel API</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; padding: 0; }
      #swagger-ui { max-width: 1460px; margin: 0 auto; padding: 20px; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: '/doc',
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
        })
      }
    </script>
  </body>
</html>
  `;
  return c.html(html);
});

// ============================================================================
// Error Handling
// ============================================================================

app.notFound((c) => {
  return c.json({
    error: {
      message: 'Not Found',
      status: 404,
    },
  });
});

app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    error: {
      message: err.message || 'Internal Server Error',
      status: 500,
    },
  });
});

// ============================================================================
// Start Server
// ============================================================================

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           OxLayer Control Panel API                       ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(48)}║
║  Host:        ${config.host.padEnd(48)}║
║  Port:        ${String(config.port).padEnd(48)}║
║  Database:    ${config.database.host.padEnd(48)}║
╚════════════════════════════════════════════════════════════╝

  📦 SDK Distribution Control Panel
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  API Endpoints:
    GET    /health                          Health check
    GET    /doc                            OpenAPI specification (JSON)
    GET    /swagger-ui                     Interactive API documentation

    SDK-facing:
      POST   /v1/capabilities/resolve       Resolve capabilities for SDK
      POST   /v1/packages/download          Get signed download URL
      GET    /v1/latest-version             Latest SDK version

    Organizations:
      GET    /v1/organizations              List organizations
      POST   /v1/organizations              Create organization
      GET    /v1/organizations/:id          Get organization
      PATCH  /v1/organizations/:id          Update organization
      DELETE /v1/organizations/:id          Delete organization

    Developers:
      GET    /v1/developers/:id             Get developer

    Licenses:
      GET    /v1/licenses/:id               Get license

    API Keys:
      GET    /v1/api-keys/:id               Get API key

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  📚 Interactive Documentation:
     http://${config.host}:${config.port}/swagger-ui

  🚀 Server starting...
`);

  console.log(`✅ Server ready at http://${config.host}:${config.port}`);
  console.log(`📚 Swagger UI available at http://${config.host}:${config.port}/swagger-ui`);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
