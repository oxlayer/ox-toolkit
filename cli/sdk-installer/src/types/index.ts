/**
 * SDK Installer Types
 *
 * Shared types for the SDK installer
 */

/**
 * API key scopes
 */
export type ApiKeyScope = 'read' | 'write' | 'admin' | 'install';

/**
 * Environment types
 */
export type Environment = 'development' | 'staging' | 'production';

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
 * Package types
 */
export type SdkPackageType = 'backend-sdk' | 'frontend-sdk' | 'cli-tools' | 'channels';

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
 * Manifest from release
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
 * Capability resolution response
 */
export interface CapabilityResolutionResponse {
  organizationId: string;
  licenseId: string;
  environment: Environment;
  capabilities: Record<string, CapabilityLimits>;
  resolvedAt: string;
}

/**
 * Package download response
 */
export interface PackageDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
  packageType: SdkPackageType;
  version: string;
}

/**
 * Installer configuration
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
