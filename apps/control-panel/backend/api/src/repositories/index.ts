/**
 * Repository Interfaces
 *
 * Interfaces for data persistence in the control panel
 */

import type { Repository, ReadRepository, QueryOptions } from '@oxlayer/foundation-domain-kit';
import type { Organization, Developer, License, ApiKey } from '../domain/index.js';

/**
 * Organization repository interface
 */
export interface IOrganizationRepository extends Repository<Organization, string>, ReadRepository<Organization, string> {
  findBySlug(slug: string): Promise<Organization | null>;
  existsBySlug(slug: string): Promise<boolean>;
  listByTier(tier: string): Promise<Organization[]>;
}

/**
 * Developer repository interface
 */
export interface IDeveloperRepository extends Repository<Developer, string>, ReadRepository<Developer, string> {
  findByEmail(email: string): Promise<Developer | null>;
  existsByEmail(email: string): Promise<boolean>;
  findByOrganization(organizationId: string): Promise<Developer[]>;
  countByOrganization(organizationId: string): Promise<number>;
}

/**
 * License repository interface
 */
export interface ILicenseRepository extends Repository<License, string>, ReadRepository<License, string> {
  findByOrganization(organizationId: string): Promise<License[]>;
  findActiveByOrganization(organizationId: string): Promise<License[]>;
  findByApiKey(apiKeyId: string): Promise<License | null>;
  findValidForOrganizationAndCapability(
    organizationId: string,
    capabilityName: string
  ): Promise<License | null>;
}

/**
 * API Key repository interface
 */
export interface IApiKeyRepository extends Repository<ApiKey, string>, ReadRepository<ApiKey, string> {
  save(apiKey: ApiKey): Promise<void>;
  findByKeyHash(keyHash: string): Promise<ApiKey | null>;
  findByOrganization(organizationId: string): Promise<ApiKey[]>;
  findByDeveloper(developerId: string): Promise<ApiKey[]>;
  findByLicense(licenseId: string): Promise<ApiKey[]>;
  findActiveByOrganization(organizationId: string): Promise<ApiKey[]>;
}

export * from './device-session.js';


