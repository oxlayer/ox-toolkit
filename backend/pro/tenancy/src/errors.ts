/**
 * Tenancy Capability - Domain Errors
 *
 * Domain-specific errors for tenant resolution and resource access.
 * These errors are part of the tenancy capability contract.
 */

/**
 * Base tenancy error
 */
export class TenancyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly tenantId?: string
  ) {
    super(message);
    this.name = "TenancyError";
  }
}

/**
 * Tenant not found error
 *
 * Thrown when attempting to resolve a non-existent tenant.
 */
export class TenantNotFoundError extends TenancyError {
  constructor(tenantId: string) {
    super(
      `Tenant not found: ${tenantId}`,
      "TENANT_NOT_FOUND",
      tenantId
    );
    this.name = "TenantNotFoundError";
  }
}

/**
 * Tenant not ready error
 *
 * Thrown when tenant exists but is not in operational state.
 * This can happen during provisioning or migration.
 */
export class TenantNotReadyError extends TenancyError {
  constructor(
    tenantId: string,
    public readonly currentState: string
  ) {
    super(
      `Tenant ${tenantId} is not ready (current state: ${currentState})`,
      "TENANT_NOT_READY",
      tenantId
    );
    this.name = "TenantNotReadyError";
  }
}

/**
 * Tenant disabled error
 *
 * Thrown when attempting to access a disabled/suspended tenant.
 */
export class TenantDisabledError extends TenancyError {
  constructor(tenantId: string) {
    super(
      `Tenant ${tenantId} is disabled`,
      "TENANT_DISABLED",
      tenantId
    );
    this.name = "TenantDisabledError";
  }
}

/**
 * Unsupported isolation mode error
 *
 * Thrown when a tenant's isolation mode is not supported by the resolver.
 */
export class UnsupportedIsolationModeError extends TenancyError {
  constructor(
    tenantId: string,
    public readonly resource: string,
    public readonly mode: string
  ) {
    super(
      `Unsupported isolation mode for ${resource}: ${mode} (tenant: ${tenantId})`,
      "UNSUPPORTED_ISOLATION_MODE",
      tenantId
    );
    this.name = "UnsupportedIsolationModeError";
  }
}

/**
 * Secret resolution error
 *
 * Thrown when unable to resolve credentials from secret store.
 */
export class SecretResolutionError extends TenancyError {
  constructor(
    tenantId: string,
    public readonly secretRef: string,
    public readonly reason: string
  ) {
    super(
      `Failed to resolve secret ${secretRef} for tenant ${tenantId}: ${reason}`,
      "SECRET_RESOLUTION_ERROR",
      tenantId
    );
    this.name = "SecretResolutionError";
  }
}

/**
 * Database connection error
 *
 * Thrown when unable to establish database connection for tenant.
 */
export class DatabaseConnectionError extends TenancyError {
  constructor(
    tenantId: string,
    public readonly reason: string
  ) {
    super(
      `Failed to connect to database for tenant ${tenantId}: ${reason}`,
      "DATABASE_CONNECTION_ERROR",
      tenantId
    );
    this.name = "DatabaseConnectionError";
  }
}

/**
 * Storage connection error
 *
 * Thrown when unable to access storage for tenant.
 */
export class StorageConnectionError extends TenancyError {
  constructor(
    tenantId: string,
    public readonly reason: string
  ) {
    super(
      `Failed to access storage for tenant ${tenantId}: ${reason}`,
      "STORAGE_CONNECTION_ERROR",
      tenantId
    );
    this.name = "StorageConnectionError";
  }
}

/**
 * Tenant configuration invalid error
 *
 * Thrown when tenant configuration is missing required fields or invalid.
 */
export class TenantConfigInvalidError extends TenancyError {
  constructor(
    tenantId: string,
    public readonly field: string,
    public readonly reason: string
  ) {
    super(
      `Invalid tenant configuration for ${tenantId}: ${field} - ${reason}`,
      "TENANT_CONFIG_INVALID",
      tenantId
    );
    this.name = "TenantConfigInvalidError";
  }
}

/**
 * Cache expired error (internal use)
 *
 * Used internally when cached entry has expired.
 */
export class CacheExpiredError extends Error {
  constructor(key: string) {
    super(`Cache entry expired: ${key}`);
    this.name = "CacheExpiredError";
  }
}
