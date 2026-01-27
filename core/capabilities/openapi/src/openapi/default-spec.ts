import type { OpenAPISpec, OpenAPISpecConfig } from './types.js';

/**
 * Default OpenAPI specification
 */
export const defaultSpec: OpenAPISpec = {
  openapi: '3.1.0',
  info: {
    title: 'API Documentation',
    description: 'Interactive API documentation',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  paths: {},
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
          },
          message: {
            type: 'string',
          },
          code: {
            type: 'string',
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

/**
 * Create default OpenAPI spec with optional tenancy support
 *
 * @param config - Spec configuration
 * @returns OpenAPI specification
 */
export function createDefaultSpec(config: OpenAPISpecConfig = {}): OpenAPISpec {
  const { tenancyEnabled = false } = config;

  const spec: OpenAPISpec = {
    openapi: '3.1.0',
    info: {
      title: 'API Documentation',
      description: tenancyEnabled
        ? 'Multi-tenant API with tenant-aware resources'
        : 'Interactive API documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    paths: {},
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
            },
            code: {
              type: 'string',
            },
            requestId: {
              type: 'string',
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: tenancyEnabled
            ? 'JWT token with optional tenant_id claim'
            : 'JWT token for authentication',
        },
      },
    },
  };

  // Add tenant-related schemas when tenancy is enabled
  if (tenancyEnabled) {
    spec.components!.schemas = {
      ...spec.components!.schemas,
      TenantContext: {
        type: 'object',
        properties: {
          tenantId: {
            type: 'string',
            description: 'Unique identifier for the tenant',
          },
          tenantName: {
            type: 'string',
            description: 'Display name of the tenant',
          },
        },
        required: ['tenantId'],
      },
      TenantHeader: {
        type: 'string',
        description: 'Tenant identifier (optional if token contains tenant_id)',
        example: 'tenant-123',
      },
    };
  }

  return spec;
}
