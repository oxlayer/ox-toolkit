/**
 * Keycloak API types
 */

/**
 * Bootstrap result
 */
export interface BootstrapResult {
  success: boolean;
  created?: string[];
  updated?: string[];
  skipped?: string[];
  errors?: Error[];
}

/**
 * Bootstrap apply options
 */
export interface ApplyOptions {
  dryRun: boolean;
  idempotent: boolean;
  force: boolean;
  verbose?: boolean;
}

/**
 * Dry run result
 */
export interface DryRunResult {
  wouldCreate: Resource[];
  wouldUpdate: Resource[];
  wouldSkip: Resource[];
}

/**
 * Resource representation
 */
export interface Resource {
  type: 'realm' | 'client' | 'role' | 'protocol-mapper';
  name: string;
  data?: unknown;
}

/**
 * Diff result
 */
export interface DiffResult {
  toCreate: Resource[];
  toUpdate: Resource[];
  unchanged: Resource[];
}

/**
 * Bootstrap error
 */
export class BootstrapError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BootstrapError';
  }
}

/**
 * Error codes
 */
export enum ErrorCode {
  AUTH_FAILED = 'AUTH_FAILED',
  REALM_EXISTS = 'REALM_EXISTS',
  CLIENT_EXISTS = 'CLIENT_EXISTS',
  INVALID_CONFIG = 'INVALID_CONFIG',
  NETWORK_ERROR = 'NETWORK_ERROR',
  REALM_CREATE_FAILED = 'REALM_CREATE_FAILED',
  CLIENT_CREATE_FAILED = 'CLIENT_CREATE_FAILED',
  ROLE_CREATE_FAILED = 'ROLE_CREATE_FAILED',
  ROLE_NOT_FOUND = 'ROLE_NOT_FOUND',
  ROLE_ASSIGN_FAILED = 'ROLE_ASSIGN_FAILED',
  ROLE_GET_FAILED = 'ROLE_GET_FAILED',
  MAPPER_CREATE_FAILED = 'MAPPER_CREATE_FAILED',
  USER_CREATE_FAILED = 'USER_CREATE_FAILED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_LIST_FAILED = 'USER_LIST_FAILED',
}
