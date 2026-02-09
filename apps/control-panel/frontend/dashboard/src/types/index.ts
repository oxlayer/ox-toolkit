/**
 * Control Panel Types
 *
 * Shared types for the control panel frontend
 */

/**
 * License tiers
 */
export type LicenseTier = 'starter' | 'professional' | 'enterprise' | 'custom';

/**
 * License status
 */
export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'revoked';

/**
 * SDK package types
 */
export type SdkPackageType = 'backend-sdk' | 'frontend-sdk' | 'cli-tools' | 'channels';

/**
 * Capability names
 */
export type CapabilityName =
  | 'auth'
  | 'storage'
  | 'search'
  | 'vector'
  | 'cache'
  | 'events'
  | 'metrics'
  | 'telemetry'
  | 'queues'
  | 'scheduler';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * API key scopes
 */
export type ApiKeyScope = 'read' | 'write' | 'admin' | 'install';

/**
 * API key status
 */
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

/**
 * Organization
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: LicenseTier;
  maxDevelopers: number;
  maxProjects: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Developer
 */
export interface Developer {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  environments: Environment[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Capability limits
 */
export interface CapabilityLimits {
  maxRealms?: number;
  maxUsers?: number;
  maxProjects?: number;
  maxRequestsPerMinute?: number;
  maxStorageGb?: number;
  maxVectorCollections?: number;
  maxVectorDimensions?: number;
  hybridSearch?: boolean;
  sso?: boolean;
  rbac?: boolean;
  encryption?: boolean;
  regions?: string[];
  features?: string[];
}

/**
 * License
 */
export interface License {
  id: string;
  organizationId: string;
  name: string;
  tier: LicenseTier;
  status: LicenseStatus;
  packages: SdkPackageType[];
  capabilities: Record<CapabilityName, CapabilityLimits>;
  environments: Environment[];
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isValid: boolean;
}

/**
 * API Key
 */
export interface ApiKey {
  id: string;
  organizationId: string;
  developerId: string | null;
  licenseId: string;
  keyPrefix: string;
  name: string;
  scopes: ApiKeyScope[];
  environments: Environment[];
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  isValid: boolean;
}

/**
 * Create organization input
 */
export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  tier?: LicenseTier;
  maxDevelopers?: number;
  maxProjects?: number;
}

/**
 * Update organization input
 */
export interface UpdateOrganizationInput {
  name?: string;
  tier?: LicenseTier;
  maxDevelopers?: number;
  maxProjects?: number;
}

/**
 * Create developer input
 */
export interface CreateDeveloperInput {
  organizationId: string;
  name: string;
  email: string;
  environments?: Environment[];
}

/**
 * Create license input
 */
export interface CreateLicenseInput {
  organizationId: string;
  name: string;
  tier?: LicenseTier;
  packages?: SdkPackageType[];
  capabilities?: Record<string, CapabilityLimits>;
  environments?: Environment[];
  expiresAt?: string | null;
}

/**
 * Create API key input
 */
export interface CreateApiKeyInput {
  organizationId: string;
  developerId: string | null;
  licenseId: string;
  name: string;
  scopes?: ApiKeyScope[];
  environments?: Environment[];
  expiresIn?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    count: number;
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  field?: string;
  code?: string;
}
