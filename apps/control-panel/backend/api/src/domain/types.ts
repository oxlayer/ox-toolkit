/**
 * Control Panel Domain Types
 *
 * Shared types for the SDK distribution system
 */

/**
 * Available SDK packages
 */
export type SdkPackageType =
  | 'backend-sdk'
  | 'frontend-sdk'
  | 'cli-tools'
  | 'channels';

/**
 * Available capabilities
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
 * Package types for capabilities
 */
export type PackageType = 'capability' | 'foundation' | 'proprietary' | 'cli' | 'channel';

/**
 * Environment types where SDK can be used
 */
export type Environment = 'development' | 'staging' | 'production';

/**
 * License tier types
 */
export type LicenseTier = 'starter' | 'professional' | 'enterprise' | 'custom';

/**
 * License status
 */
export type LicenseStatus = 'active' | 'suspended' | 'expired' | 'revoked';

/**
 * Capability limits configuration
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
 * Capability configuration with limits
 */
export interface CapabilityConfig {
  name: CapabilityName;
  enabled: boolean;
  limits: CapabilityLimits;
}

/**
 * API key scopes
 */
export type ApiKeyScope = 'read' | 'write' | 'admin' | 'install';

/**
 * API key status
 */
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';
