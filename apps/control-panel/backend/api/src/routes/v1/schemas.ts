/**
 * OpenAPI Schemas
 *
 * Zod schemas for OpenAPI validation and documentation
 */

import { z } from '@hono/zod-openapi';

/**
 * Common error response schema
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    status: z.number().int().positive(),
    code: z.string().optional(),
    details: z.array(z.any()).optional(),
  }),
});

/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z.object({
  count: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  hasMore: z.boolean().optional(),
});

/**
 * License tier enum
 */
export const LicenseTierSchema = z.enum(['starter', 'professional', 'enterprise', 'custom']);

/**
 * License status enum
 */
export const LicenseStatusSchema = z.enum(['active', 'suspended', 'expired', 'revoked']);

/**
 * Environment enum
 */
export const EnvironmentSchema = z.enum(['development', 'staging', 'production']);

/**
 * API key scope enum
 */
export const ApiKeyScopeSchema = z.enum(['read', 'write', 'admin', 'install']);

/**
 * API key status enum
 */
export const ApiKeyStatusSchema = z.enum(['active', 'revoked', 'expired']);

/**
 * SDK package type enum
 */
export const SdkPackageTypeSchema = z.enum(['backend-sdk', 'frontend-sdk', 'cli-tools', 'channels']);

/**
 * Capability name enum
 */
export const CapabilityNameSchema = z.enum([
  'auth',
  'storage',
  'search',
  'vector',
  'cache',
  'events',
  'metrics',
  'telemetry',
  'queues',
  'scheduler',
]);

/**
 * Capability limits schema
 */
export const CapabilityLimitsSchema = z.object({
  maxRealms: z.number().int().nonnegative().optional(),
  maxUsers: z.number().int().nonnegative().optional(),
  maxProjects: z.number().int().nonnegative().optional(),
  maxRequestsPerMinute: z.number().int().nonnegative().optional(),
  maxStorageGb: z.number().optional(),
  maxVectorCollections: z.number().int().nonnegative().optional(),
  maxVectorDimensions: z.number().int().nonnegative().optional(),
  hybridSearch: z.boolean().optional(),
  sso: z.boolean().optional(),
  rbac: z.boolean().optional(),
  encryption: z.boolean().optional(),
  regions: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

/**
 * Capability config schema
 */
export const CapabilityConfigSchema = z.object({
  name: CapabilityNameSchema,
  enabled: z.boolean(),
  limits: CapabilityLimitsSchema,
});

/**
 * Organization schema
 */
export const OrganizationSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'Organization unique identifier',
    }),
    name: z.string().min(1).max(255).openapi({
      example: 'Acme Corp',
      description: 'Organization display name',
    }),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).openapi({
      example: 'acme-corp',
      description: 'URL-friendly organization identifier',
    }),
    tier: LicenseTierSchema.openapi({
      example: 'professional',
      description: 'License tier determining limits',
    }),
    maxDevelopers: z.number().int().nonnegative().openapi({
      example: 25,
      description: 'Maximum number of developers allowed',
    }),
    maxProjects: z.number().int().nonnegative().openapi({
      example: 20,
      description: 'Maximum number of projects allowed (-1 for unlimited)',
    }),
    createdAt: z.string().datetime().openapi({
      example: '2025-01-01T00:00:00Z',
    }),
    updatedAt: z.string().datetime().openapi({
      example: '2025-01-01T00:00:00Z',
    }),
  })
  .openapi('Organization');

/**
 * Create organization input schema
 */
export const CreateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).openapi({
    example: 'Acme Corp',
    description: 'Organization display name',
  }),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).openapi({
      example: 'acme-corp',
      description: 'URL-friendly organization identifier',
    }),
  tier: LicenseTierSchema.openapi({
    example: 'professional',
    description: 'License tier',
    default: 'starter',
  }),
  maxDevelopers: z.number().int().nonnegative().optional().openapi({
    example: 25,
    default: 5,
    description: 'Maximum developers allowed',
  }),
  maxProjects: z.number().int().nonnegative().optional().openapi({
    example: 20,
    default: 3,
    description: 'Maximum projects allowed (-1 for unlimited)',
  }),
});

/**
 * Update organization input schema
 */
export const UpdateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  tier: LicenseTierSchema.optional(),
  maxDevelopers: z.number().int().nonnegative().optional(),
  maxProjects: z.number().int().optional(),
});

/**
 * Developer schema
 */
export const DeveloperSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    organizationId: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    name: z.string().min(1).max(255).openapi({
      example: 'John Doe',
    }),
    email: z.string().email().openapi({
      example: 'john@example.com',
    }),
    environments: z.array(EnvironmentSchema).openapi({
      example: ['development', 'production'],
    }),
    createdAt: z.string().datetime(),
  })
  .openapi('Developer');

/**
 * Create developer input schema
 */
export const CreateDeveloperSchema = z.object({
  organizationId: z.string().uuid().openapi({
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  name: z.string().min(1).max(255).openapi({
    example: 'John Doe',
  }),
  email: z.string().email().openapi({
    example: 'john@example.com',
  }),
  environments: z.array(EnvironmentSchema).optional().openapi({
    example: ['development'],
    default: ['development'],
  }),
});

/**
 * License schema
 */
export const LicenseSchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    organizationId: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    name: z.string().min(1).max(255).openapi({
      example: 'Enterprise License',
    }),
    tier: LicenseTierSchema.openapi({
      example: 'enterprise',
    }),
    status: LicenseStatusSchema.openapi({
      example: 'active',
    }),
    packages: z.array(SdkPackageTypeSchema).openapi({
      example: ['backend-sdk', 'frontend-sdk'],
    }),
    capabilities: z.record(CapabilityLimitsSchema).openapi({
      example: {
        auth: { maxRealms: 100, sso: true, rbac: true },
        storage: { encryption: true, maxStorageGb: -1 },
      },
    }),
    expiresAt: z.string().datetime().nullable().openapi({
      example: '2026-01-01T00:00:00Z',
    }),
    isValid: z.boolean().openapi({
      example: true,
    }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('License');

/**
 * Create license input schema
 */
export const CreateLicenseSchema = z.object({
  organizationId: z.string().uuid().openapi({
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  name: z.string().min(1).max(255).openapi({
    example: 'Enterprise License',
  }),
  tier: LicenseTierSchema.openapi({
    example: 'enterprise',
    default: 'starter',
  }),
  packages: z.array(SdkPackageTypeSchema).optional().openapi({
    example: ['backend-sdk', 'frontend-sdk'],
  }),
  capabilities: z.record(CapabilityLimitsSchema).optional().openapi({
    example: {
      auth: { maxRealms: 100, sso: true, rbac: true },
    },
  }),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * Update license input schema
 */
export const UpdateLicenseSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  tier: LicenseTierSchema.optional(),
  status: LicenseStatusSchema.optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * Add package to license schema
 */
export const AddPackageSchema = z.object({
  package: SdkPackageTypeSchema.openapi({
    example: 'backend-sdk',
  }),
});

/**
 * Update capability limits schema
 */
export const UpdateCapabilitySchema = z.object({
  limits: CapabilityLimitsSchema.openapi({
    example: { maxRealms: 50, sso: true, rbac: true },
  }),
});

/**
 * API Key schema
 */
export const ApiKeySchema = z
  .object({
    id: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    organizationId: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    developerId: z.string().uuid().nullable().openapi({
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    licenseId: z.string().uuid().openapi({
      example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    name: z.string().min(1).max(255).openapi({
      example: 'Production Key',
    }),
    keyPrefix: z.string().openapi({
      example: 'oxl_',
    }),
    keyPreview: z.string().openapi({
      example: 'oxl_****',
    }),
    scopes: z.array(ApiKeyScopeSchema).openapi({
      example: ['read', 'write'],
    }),
    status: ApiKeyStatusSchema.openapi({
      example: 'active',
    }),
    expiresAt: z.string().datetime().nullable().openapi({
      example: '2026-01-01T00:00:00Z',
    }),
    lastUsedAt: z.string().datetime().nullable().openapi({
      example: '2025-01-01T12:00:00Z',
    }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .openapi('ApiKey');

/**
 * Create API key input schema
 */
export const CreateApiKeySchema = z.object({
  organizationId: z.string().uuid().openapi({
    example: '550e8400-e29b-41d4-a716-446655440000',
  }),
  developerId: z.string().uuid().optional(),
  licenseId: z.string().uuid().optional(),
  name: z.string().min(1).max(255).openapi({
    example: 'Production Key',
  }),
  scopes: z.array(ApiKeyScopeSchema).optional().openapi({
    example: ['read', 'write'],
    default: ['read'],
  }),
  expiresAt: z.string().datetime().nullable().optional(),
});

/**
 * Capability resolution request schema
 */
export const CapabilityResolutionRequestSchema = z.object({
  apiKey: z.string().openapi({
    example: 'oxl_kjhsd7832...',
    description: 'API key for authentication',
  }),
  projectId: z.string().optional().openapi({
    example: 'my-project-123',
    description: 'Optional project identifier',
  }),
  environment: EnvironmentSchema.openapi({
    example: 'development',
    default: 'development',
  }),
  requested: z.array(CapabilityNameSchema).openapi({
    example: ['auth', 'storage', 'vector'],
    description: 'List of capabilities being requested',
  }),
});

/**
 * Capability resolution response schema
 */
export const CapabilityResolutionResponseSchema = z.object({
  data: z.object({
    apiKey: z.string().optional(),
    projectId: z.string().optional(),
    environment: EnvironmentSchema,
    requested: z.array(CapabilityNameSchema),
    capabilities: z.record(CapabilityLimitsSchema).openapi({
      example: {
        auth: { maxRealms: 10, sso: true, rbac: true },
        storage: { encryption: true, maxStorageGb: 1000 },
      },
    }),
    restrictions: z.array(z.string()).openapi({
      example: ['trial-expiring-soon'],
    }),
    resolvedAt: z.string().datetime(),
  }),
});

/**
 * Package download request schema
 */
export const PackageDownloadRequestSchema = z.object({
  apiKey: z.string().openapi({
    example: 'oxl_kjhsd7832...',
  }),
  packageType: SdkPackageTypeSchema.openapi({
    example: 'backend-sdk',
  }),
  version: z.string().optional().openapi({
    example: '2025_02_08_001',
    description: 'Specific version or leave blank for latest',
  }),
});

/**
 * Package download response schema
 */
export const PackageDownloadResponseSchema = z.object({
  data: z.object({
    packageType: SdkPackageTypeSchema,
    version: z.string(),
    downloadUrl: z.string().url().openapi({
      example: 'https://storage.example.com/sdk.zip?signature=...',
    }),
    expiresAt: z.string().datetime(),
    sha256: z.string().openapi({
      example: 'a1b2c3d4...',
      description: 'SHA256 hash for integrity verification',
    }),
    size: z.number().int().openapi({
      example: 10485760,
    }),
  }),
});

/**
 * Paginated response schema generic
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    meta: PaginationMetaSchema.optional(),
  });
}

export const ErrorSchema = z.object({
  code: z.number().int(),
  message: z.string(),
});

export const HealthResponseSchema = z.object({
  status: z.string().openapi({
    example: 'ok',
  }),
  version: z.string().openapi({
    example: '0.0.1',
  }),
  timestamp: z.string().datetime(),
});
