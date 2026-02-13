/**
 * License Domain Entity
 *
 * Represents a license that grants access to specific SDK packages and capabilities.
 */

import { AggregateRoot } from '@oxlayer/foundation-domain-kit';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { BusinessRuleViolationError, ValidationError } from '@oxlayer/foundation-domain-kit';
import type {
  SdkPackageType,
  CapabilityName,
  CapabilityLimits,
  CapabilityConfig,
  LicenseStatus,
  LicenseTier,
  Environment,
} from './types.js';

/**
 * License properties
 */
export interface LicenseProps {
  id: string;
  organizationId: string;
  name: string;
  tier: LicenseTier;
  status: LicenseStatus;
  packages: SdkPackageType[];
  capabilities: Record<CapabilityName, CapabilityLimits>;
  environments: Environment[];
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Validation constants
 */
const MAX_NAME_LENGTH = 100;

/**
 * Domain events for license
 */
export interface LicenseActivatedEvent {
  type: 'LicenseActivated';
  licenseId: string;
  organizationId: string;
  activatedAt: Date;
}

export interface LicenseSuspendedEvent {
  type: 'LicenseSuspended';
  licenseId: string;
  organizationId: string;
  suspendedAt: Date;
}

export interface LicenseExpiredEvent {
  type: 'LicenseExpired';
  licenseId: string;
  organizationId: string;
  expiredAt: Date;
}

export interface CapabilityUpdatedEvent {
  type: 'CapabilityUpdated';
  licenseId: string;
  organizationId: string;
  capability: CapabilityName;
  updatedAt: Date;
}

/**
 * License aggregate root
 */
export class License extends AggregateRoot<string> {
  private props: LicenseProps;

  private constructor(props: LicenseProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get organizationId(): string {
    return this.props.organizationId;
  }

  get name(): string {
    return this.props.name;
  }

  get tier(): LicenseTier {
    return this.props.tier;
  }

  get status(): LicenseStatus {
    return this.props.status;
  }

  get packages(): SdkPackageType[] {
    return [...this.props.packages];
  }

  get capabilities(): Record<CapabilityName, CapabilityLimits> {
    return { ...this.props.capabilities };
  }

  get environments(): Environment[] {
    return [...this.props.environments];
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
   * Check if license is currently valid
   */
  isValid(): boolean {
    if (this.props.status !== 'active') return false;
    if (this.props.expiresAt && this.props.expiresAt < new Date()) return false;
    return true;
  }

  /**
   * Check if license has access to package
   */
  hasPackage(pkg: SdkPackageType): boolean {
    // Check if packages array exists and contains the package
    return Array.isArray(this.props.packages) && this.props.packages.includes(pkg);
  }

  /**
   * Check if license has capability enabled
   */
  hasCapability(capability: CapabilityName): boolean {
    return capability in this.props.capabilities;
  }

  /**
   * Get capability limits
   */
  getCapabilityLimits(capability: CapabilityName): CapabilityLimits | null {
    return this.props.capabilities[capability] ?? null;
  }

  /**
   * Resolve capabilities for a project
   * This is the key method that SDKs will call to get their configuration
   */
  resolveCapabilities(requested: CapabilityName[]): Record<string, CapabilityLimits> {
    const result: Record<string, CapabilityLimits> = {};

    if (!this.isValid()) {
      return result;
    }

    for (const capability of requested) {
      const limits = this.props.capabilities[capability];
      if (limits) {
        result[capability] = limits;
      }
    }

    return result;
  }

  /**
   * Activate license
   */
  activate(): void {
    if (this.props.status === 'active') return;

    this.props.status = 'active';
    this.touch();

    this.addEvent<LicenseActivatedEvent>({
      type: 'LicenseActivated',
      licenseId: this.props.id,
      organizationId: this.props.organizationId,
      activatedAt: new Date(),
    });
  }

  /**
   * Suspend license
   */
  suspend(): void {
    if (this.props.status === 'suspended') return;

    this.props.status = 'suspended';
    this.touch();

    this.addEvent<LicenseSuspendedEvent>({
      type: 'LicenseSuspended',
      licenseId: this.props.id,
      organizationId: this.props.organizationId,
      suspendedAt: new Date(),
    });
  }

  /**
   * Revoke license
   */
  revoke(): void {
    if (this.props.status === 'revoked') return;

    this.props.status = 'revoked';
    this.touch();
  }

  /**
   * Mark license as expired
   */
  markAsExpired(): void {
    if (this.props.status === 'expired') return;

    this.props.status = 'expired';
    this.touch();

    this.addEvent<LicenseExpiredEvent>({
      type: 'LicenseExpired',
      licenseId: this.props.id,
      organizationId: this.props.organizationId,
      expiredAt: new Date(),
    });
  }

  /**
   * Add package to license
   */
  addPackage(pkg: SdkPackageType): void {
    if (this.props.packages.includes(pkg)) return;

    this.props.packages.push(pkg);
    this.touch();
  }

  /**
   * Remove package from license
   */
  removePackage(pkg: SdkPackageType): void {
    this.props.packages = this.props.packages.filter(p => p !== pkg);
    this.touch();
  }

  /**
   * Add or update capability limits
   */
  setCapability(capability: CapabilityName, limits: CapabilityLimits): void {
    const existing = this.props.capabilities[capability];
    const changed = !existing || JSON.stringify(existing) !== JSON.stringify(limits);

    if (changed) {
      this.props.capabilities[capability] = limits;
      this.touch();

      this.addEvent<CapabilityUpdatedEvent>({
        type: 'CapabilityUpdated',
        licenseId: this.props.id,
        organizationId: this.props.organizationId,
        capability,
        updatedAt: new Date(),
      });
    }
  }

  /**
   * Remove capability from license
   */
  removeCapability(capability: CapabilityName): void {
    if (!(capability in this.props.capabilities)) return;

    delete this.props.capabilities[capability];
    this.touch();
  }

  /**
   * Update license details
   */
  updateDetails(data: {
    name?: string;
    expiresAt?: Date | null;
  }): void {
    if (data.name !== undefined) {
      this.props.name = validateName(data.name);
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
   * Create a new license
   */
  static create(data: {
    organizationId: string;
    name: string;
    tier: LicenseTier;
    packages?: SdkPackageType[];
    capabilities?: Record<CapabilityName, CapabilityLimits>;
    environments?: Environment[];
    expiresAt?: Date | null;
  }): License {
    const name = validateName(data.name);
    const tier = data.tier ?? 'starter';

    return new License({
      id: generateId('lic'),
      organizationId: data.organizationId,
      name,
      tier,
      status: 'active',
      packages: data.packages ?? [],
      capabilities: data.capabilities ?? getDefaultCapabilitiesForTier(tier),
      environments: data.environments ?? ['development'],
      expiresAt: data.expiresAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: LicenseProps): License {
    return new License(props);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): LicenseProps {
    return { ...this.props };
  }

  /**
   * Convert to response format
   */
  toResponse(): LicenseResponse {
    return {
      id: this.props.id,
      organizationId: this.props.organizationId,
      name: this.props.name,
      tier: this.props.tier,
      status: this.props.status,
      packages: this.props.packages,
      capabilities: this.props.capabilities,
      environments: this.props.environments,
      expiresAt: this.props.expiresAt?.toISOString() ?? null,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      isValid: this.isValid(),
    };
  }
}

/**
 * Response type for API
 */
export interface LicenseResponse {
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
 * Validate license name
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

/**
 * Get default capabilities for license tier
 */
function getDefaultCapabilitiesForTier(tier: LicenseTier): Record<CapabilityName, CapabilityLimits> {
  const baseLimits: CapabilityLimits = {
    maxRequestsPerMinute: tier === 'enterprise' ? 10000 : 1000,
  };

  const capabilities: Record<CapabilityName, CapabilityLimits> = {
    auth: { ...baseLimits, maxRealms: tier === 'enterprise' ? 10 : 1 },
    cache: { ...baseLimits },
    events: { ...baseLimits },
    metrics: { ...baseLimits },
    telemetry: { ...baseLimits },
  };

  if (tier === 'professional' || tier === 'enterprise') {
    capabilities.storage = {
      ...baseLimits,
      maxStorageGb: tier === 'enterprise' ? 1000 : 100,
      encryption: true,
    };
  }

  if (tier === 'enterprise') {
    capabilities.vector = {
      ...baseLimits,
      maxVectorCollections: 50,
      maxVectorDimensions: 1536,
      hybridSearch: true,
    };
    capabilities.search = {
      ...baseLimits,
    };
  }

  return capabilities;
}
