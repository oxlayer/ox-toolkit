/**
 * Capability Manifest Schema
 *
 * Defines the contract for capability-based SDK delivery and licensing.
 * This schema is the backbone of the OxLayer platform's gated runtime surface.
 */

/**
 * Token scopes for CLI access
 * Each scope grants specific, limited permissions
 */
export type TokenScope =
  | 'sdk:read'          // Read available SDK versions and manifests
  | 'capabilities:read' // Read capability definitions and limits
  | 'downloads:read'    // Generate signed download URLs
  | 'devices:manage'    // Manage device registrations
  | 'org:read';         // Read organization info

/**
 * Capability categories for organization
 */
export type CapabilityCategory =
  | 'auth'        // Authentication & authorization
  | 'storage'     // File/object storage
  | 'search'      // Full-text search
  | 'vector'      // Vector embeddings and similarity search
  | 'cache'       // Caching layer
  | 'events'      // Event streaming
  | 'metrics'     // Observability and metrics
  | 'telemetry'   // Application telemetry
  | 'queues'      // Message queues
  | 'scheduler';  // Scheduled jobs/cron

/**
 * Value types for capability limits
 */
export type LimitValue =
  | number         // Numeric limits (count, size, etc.)
  | boolean        // Feature flags
  | string         // String values (regions, tiers, etc.)
  | string[];      // Array values (allowed features, etc.)

/**
 * Individual capability definition
 * Each capability has a name, category, limits, and optional expiration
 */
export interface Capability {
  /** Unique capability identifier */
  name: CapabilityCategory;

  /** Human-readable display name */
  displayName: string;

  /** Capability limits configuration */
  limits: Record<string, LimitValue>;

  /** Optional expiration timestamp (ISO 8601) */
  expiresAt?: string;

  /** Whether this capability requires additional setup */
  requiresSetup?: boolean;

  /** Dependencies on other capabilities */
  dependsOn?: CapabilityCategory[];
}

/**
 * Capability manifest - the complete set of capabilities
 * This is what gets delivered to authenticated CLI instances
 */
export interface CapabilityManifest {
  /** Manifest version for schema evolution */
  schemaVersion: string;

  /** Organization ID */
  organizationId: string;

  /** License/Plan ID */
  licenseId: string;

  /** Environment this manifest applies to */
  environment: 'development' | 'staging' | 'production';

  /** All available capabilities */
  capabilities: Record<CapabilityCategory, Capability>;

  /** When this manifest was generated */
  issuedAt: string;

  /** When this manifest expires */
  expiresAt: string;

  /** Manifest signature for verification */
  signature: string;
}

/**
 * Device session - represents an authenticated CLI instance
 */
export interface DeviceSession {
  /** Unique device identifier */
  deviceId: string;

  /** Human-readable device name */
  deviceName: string;

  /** When this session was created */
  createdAt: string;

  /** Last activity timestamp */
  lastSeenAt: string;

  /** Whether this session is active */
  isActive: boolean;
}

/**
 * Token information stored locally
 */
export interface TokenInfo {
  /** Device this token belongs to */
  deviceId: string;

  /** Granted scopes */
  scopes: string[];

  /** Token expiration */
  expiresAt: string;
}

/**
 * Full CLI configuration with scoped tokens
 */
export interface CliConfig {
  /** Scoped access token */
  token: string;

  /** Token metadata */
  tokenInfo: TokenInfo;

  /** Organization ID */
  organizationId: string;

  /** Environment */
  environment: 'development' | 'staging' | 'production';

  /** Vendor directory for SDK installation */
  vendorDir: string;

  /** API endpoint (optional, for testing) */
  apiEndpoint?: string;

  /** Cached capability manifest (if available) */
  manifest?: CapabilityManifest;

  /** When this config was last updated */
  updatedAt: string;
}

/**
 * API response for device code authorization initiation
 */
export interface DeviceCodeResponse {
  /** Device code for polling */
  deviceCode: string;

  /** User code for manual entry (fallback) */
  userCode: string;

  /** Verification URL to open in browser */
  verificationUrl: string;

  /** Interval in seconds between poll attempts */
  interval: number;

  /** Expiration time for device code (ISO 8601 timestamp) */
  expiresAt: string;

  /** Polling endpoint */
  pollEndpoint: string;
}

/**
 * API response for token polling
 */
export interface TokenPollResponse {
  /** Pending status */
  pending?: boolean;

  /** Access token (if complete) */
  accessToken?: string;

  /** Token info (if complete) */
  tokenInfo?: TokenInfo;

  /** Organization ID (if complete) */
  organizationId?: string;

  /** Error if authorization failed */
  error?: string;
}

/**
 * Capability resolution request
 */
export interface CapabilityResolutionRequest {
  /** Requested capabilities */
  requested: CapabilityCategory[];

  /** Project ID (optional) */
  projectId?: string;

  /** Environment */
  environment: 'development' | 'staging' | 'production';
}

/**
 * Capability resolution response
 */
export interface CapabilityResolutionResponse {
  /** Resolved capabilities with limits */
  capabilities: Record<string, Omit<Capability, 'name' | 'displayName'>>;

  /** Resolution timestamp */
  resolvedAt: string;

  /** Any warnings or deprecations */
  warnings?: string[];
}

/**
 * Package download request
 */
export interface PackageDownloadRequest {
  /** Package type */
  packageType: string;

  /** Version (optional, defaults to latest) */
  version?: string;
}

/**
 * Package download response with signed URL
 */
export interface PackageDownloadResponse {
  /** Signed download URL */
  downloadUrl: string;

  /** URL expiration */
  expiresAt: string;

  /** Resolved version (e.g., '2026_02_14_001') */
  version: string;

  /** Package type */
  packageType: string;

  /** Package checksum */
  checksum?: string;

  /** Package size in bytes */
  size?: number;
}
