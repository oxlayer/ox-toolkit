/**
 * SDK Installer Types
 *
 * Shared types for the SDK installer
 *
 * @deprecated Use {@link ./capabilities.ts} for the new capability-based schema.
 * This file is maintained for backward compatibility during the migration.
 */

// ============================================================================
// NEW CAPABILITY-BASED TYPES (preferred)
// ============================================================================

export * from './capabilities.js';

// ============================================================================
// LEGACY TYPES (deprecated, will be removed)
// ============================================================================

/**
 * @deprecated Use TokenScope from './capabilities.ts' instead
 */
export type ApiKeyScope = 'read' | 'write' | 'admin' | 'install';

/**
 * @deprecated Use Environment from './capabilities.ts' instead
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * @deprecated Use CapabilityCategory from './capabilities.ts' instead
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
 * @deprecated Use CapabilityCategory from './capabilities.ts' instead
 */
export type SdkPackageType = 'backend-sdk' | 'frontend-sdk' | 'cli-tools' | 'channels';

/**
 * @deprecated Use Capability from './capabilities.ts' instead
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
 * Manifest from release
 * @deprecated This will be replaced by CapabilityManifest
 */
export interface ReleaseManifest {
  version: string;
  generatedAt: string;
  sha256: string;
  packages: Record<string, {
    path: string;
    main: string;
    capability?: string;
    type: string;
  }>;
}

/**
 * @deprecated Use CapabilityResolutionResponse from './capabilities.ts' instead
 */
export interface CapabilityResolutionResponse {
  organizationId: string;
  licenseId: string;
  environment: Environment;
  capabilities: Record<string, CapabilityLimits>;
  resolvedAt: string;
}

/**
 * @deprecated Use PackageDownloadResponse from './capabilities.ts' instead
 */
export interface PackageDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
  packageType: SdkPackageType;
  version: string;
}

/**
 * @deprecated Use CliConfig from './capabilities.ts' instead
 */
export interface InstallerConfig {
  apiKey: string;
  environment: Environment;
  vendorDir: string;
  apiEndpoint?: string;
}

/**
 * Install options
 */
export interface InstallOptions {
  version?: string;
  packages?: SdkPackageType[];
  dryRun?: boolean;
  force?: boolean;
  save?: boolean;
  saveDev?: boolean;
}

/**
 * Status check options
 */
export interface StatusOptions {
  verbose?: boolean;
}
