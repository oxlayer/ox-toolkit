/**
 * API Key Domain Entity
 *
 * Represents an API key used for authenticating SDK requests.
 */

import { Entity } from '@oxlayer/foundation-domain-kit';
import { BusinessRuleViolationError, ValidationError } from '@oxlayer/foundation-domain-kit';
import { createHash, randomBytes } from 'crypto';
import type { ApiKeyScope, ApiKeyStatus, Environment } from './types.js';

/**
 * API Key properties
 */
export interface ApiKeyProps {
  id: string;
  organizationId: string;
  developerId: string | null;
  licenseId: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  scopes: ApiKeyScope[];
  environments: Environment[];
  status: ApiKeyStatus;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation constants
 */
const MAX_NAME_LENGTH = 100;
const KEY_PREFIX_LENGTH = 8;
const API_KEY_LENGTH = 64;

/**
 * API Key entity
 */
export class ApiKey extends Entity<string> {
  private props: ApiKeyProps;

  private constructor(props: ApiKeyProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get organizationId(): string {
    return this.props.organizationId;
  }

  get developerId(): string | null {
    return this.props.developerId;
  }

  get licenseId(): string {
    return this.props.licenseId;
  }

  get keyPrefix(): string {
    return this.props.keyPrefix;
  }

  get name(): string {
    return this.props.name;
  }

  get scopes(): ApiKeyScope[] {
    return [...this.props.scopes];
  }

  get environments(): Environment[] {
    return [...this.props.environments];
  }

  get status(): ApiKeyStatus {
    return this.props.status;
  }

  get lastUsedAt(): Date | null {
    return this.props.lastUsedAt;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if API key is currently valid
   */
  isValid(): boolean {
    if (this.props.status !== 'active') return false;
    if (this.props.expiresAt && this.props.expiresAt < new Date()) return false;
    return true;
  }

  /**
   * Check if API key has scope
   */
  hasScope(scope: ApiKeyScope): boolean {
    return this.props.scopes.includes(scope);
  }

  /**
   * Check if API key can be used in environment
   */
  canBeUsedIn(environment: Environment): boolean {
    return this.props.environments.includes(environment);
  }

  /**
   * Verify if a raw key matches this API key
   */
  verifyKey(rawKey: string): boolean {
    const hash = hashApiKey(rawKey);
    return hash === this.props.keyHash;
  }

  /**
   * Mark API key as used
   */
  markAsUsed(): void {
    this.props.lastUsedAt = new Date();
    this.touch();
  }

  /**
   * Revoke API key
   */
  revoke(): void {
    if (this.props.status === 'revoked') return;

    this.props.status = 'revoked';
    this.touch();
  }

  /**
   * Update API key details
   */
  updateDetails(data: {
    name?: string;
    scopes?: ApiKeyScope[];
    environments?: Environment[];
    expiresAt?: Date | null;
  }): void {
    if (data.name !== undefined) {
      this.props.name = validateName(data.name);
    }
    if (data.scopes !== undefined) {
      if (data.scopes.length === 0) {
        throw new BusinessRuleViolationError('scopes', 'At least one scope is required');
      }
      this.props.scopes = data.scopes;
    }
    if (data.environments !== undefined) {
      if (data.environments.length === 0) {
        throw new BusinessRuleViolationError('environments', 'At least one environment is required');
      }
      this.props.environments = data.environments;
    }
    if (data.expiresAt !== undefined) {
      if (data.expiresAt && data.expiresAt < new Date()) {
        throw new BusinessRuleViolationError('expiresAt', 'Expiration date cannot be in the past');
      }
      this.props.expiresAt = data.expiresAt;
    }
    this.touch();
  }

  /**
   * Update timestamp
   */
  private touch(): void {
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new API key
   *
   * Returns the API key instance and the raw key (only shown once)
   */
  static create(data: {
    organizationId: string;
    developerId: string | null;
    licenseId: string;
    name: string;
    scopes?: ApiKeyScope[];
    environments?: Environment[];
    expiresIn?: number; // days
  }): { apiKey: ApiKey; rawKey: string } {
    const name = validateName(data.name);
    const rawKey = generateApiKey();
    const { keyHash, keyPrefix } = hashAndPrefixApiKey(rawKey);

    const expiresAt = data.expiresIn
      ? new Date(Date.now() + data.expiresIn * 24 * 60 * 60 * 1000)
      : null;

    const apiKey = new ApiKey({
      id: `key_${randomBytes(16).toString('hex')}`,
      organizationId: data.organizationId,
      developerId: data.developerId,
      licenseId: data.licenseId,
      keyHash,
      keyPrefix,
      name,
      scopes: data.scopes ?? ['read'],
      environments: data.environments ?? ['development'],
      status: 'active',
      lastUsedAt: null,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { apiKey, rawKey };
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: ApiKeyProps): ApiKey {
    return new ApiKey(props);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): ApiKeyProps {
    return { ...this.props };
  }

  /**
   * Convert to response format (never includes the raw key or hash)
   */
  toResponse(): ApiKeyResponse {
    return {
      id: this.props.id,
      organizationId: this.props.organizationId,
      developerId: this.props.developerId,
      licenseId: this.props.licenseId,
      keyPrefix: this.props.keyPrefix,
      name: this.props.name,
      scopes: this.props.scopes,
      environments: this.props.environments,
      status: this.props.status,
      lastUsedAt: this.props.lastUsedAt?.toISOString() ?? null,
      expiresAt: this.props.expiresAt?.toISOString() ?? null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      isValid: this.isValid(),
    };
  }
}

/**
 * Response type for API (never includes raw key or hash)
 */
export interface ApiKeyResponse {
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
 * Generate a cryptographically secure random API key
 */
function generateApiKey(): string {
  return `oxl_${randomBytes(API_KEY_LENGTH).toString('base64url')}`;
}

/**
 * Hash an API key for storage
 */
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Hash API key and extract prefix for display
 */
function hashAndPrefixApiKey(key: string): { keyHash: string; keyPrefix: string } {
  const keyHash = hashApiKey(key);
  const keyPrefix = key.substring(0, KEY_PREFIX_LENGTH);
  return { keyHash, keyPrefix };
}

/**
 * Validate API key name
 */
function validateName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('name', 'Name is required');
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new ValidationError('name', 'Name cannot be empty');
  }

  if (trimmed.length > MAX_NAME_LENGTH) {
    throw new ValidationError('name', `Name cannot exceed ${MAX_NAME_LENGTH} characters`);
  }

  return trimmed;
}
