/**
 * Capability Resolution Service
 *
 * This service is called by SDKs to resolve their capabilities and limits.
 * It implements the capability-based authorization model as described in the architecture brief.
 *
 * Key Principles:
 * - We return capability CONFIGURATION, not boolean "licensed" flags
 * - Limits are enforced server-side through capability resolution
 * - Client-side code can be copied but requires valid credentials to get useful config
 */

import type { IApiKeyRepository } from '../repositories/index.js';
import type { ILicenseRepository } from '../repositories/index.js';
import type { ApiKey, License } from '../domain/index.js';
import type { CapabilityName, Environment, CapabilityLimits } from '../domain/index.js';
import { UnauthorizedError, BusinessRuleViolationError } from '@oxlayer/foundation-domain-kit';

/**
 * Capability resolution request
 */
export interface ResolveCapabilitiesRequest {
  apiKey: string;
  projectId?: string;
  environment: Environment;
  requested: CapabilityName[];
}

/**
 * Capability resolution response
 *
 * Returns actual capability limits, NOT boolean flags
 */
export interface ResolveCapabilitiesResponse {
  organizationId: string;
  licenseId: string;
  environment: Environment;
  capabilities: Record<string, CapabilityLimits>;
  resolvedAt: string;
}

/**
 * Package download request
 */
export interface RequestPackageDownloadRequest {
  apiKey: string;
  packageType: string;
  version?: string;
}

/**
 * Package download response
 *
 * Returns a signed URL for downloading the package
 */
export interface RequestPackageDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
  packageType: string;
  version: string;
}

/**
 * Capability Resolution Service
 */
export class CapabilityResolutionService {
  constructor(
    private readonly apiKeyRepo: IApiKeyRepository,
    private readonly licenseRepo: ILicenseRepository
  ) {}

  /**
   * Resolve capabilities for a SDK request
   *
   * This is the main method that SDKs call to get their configuration.
   * It returns the actual limits and features they can use.
   *
   * @param request - The capability resolution request
   * @returns Capability configuration with limits
   */
  async resolveCapabilities(request: ResolveCapabilitiesRequest): Promise<ResolveCapabilitiesResponse> {
    // 1. Validate API key and get associated license
    const { apiKey, license } = await this.validateApiKeyAndGetLicense(request.apiKey);

    // 2. Check if API key can be used in the requested environment
    if (!apiKey.canBeUsedIn(request.environment)) {
      throw new UnauthorizedError(
        `API key is not authorized for environment: ${request.environment}`
      );
    }

    // 3. Check if license is valid
    if (!license.isValid()) {
      throw new UnauthorizedError(
        `License is not valid (status: ${license.status}, expires: ${license.expiresAt})`
      );
    }

    // 4. Check if license includes the requested environment
    if (!license.environments.includes(request.environment)) {
      throw new UnauthorizedError(
        `License does not include environment: ${request.environment}`
      );
    }

    // 5. Resolve capabilities - returns limits, NOT booleans
    const capabilities = license.resolveCapabilities(request.requested);

    // 6. Mark API key as used
    apiKey.markAsUsed();
    await this.apiKeyRepo.save(apiKey);

    return {
      organizationId: license.organizationId,
      licenseId: license.id,
      environment: request.environment,
      capabilities,
      resolvedAt: new Date().toISOString(),
    };
  }

  /**
   * Request a package download
   *
   * Validates that the organization has access to the requested package
   * and returns a signed URL for download from R2/S3.
   *
   * @param request - The package download request
   * @returns Signed download URL
   */
  async requestPackageDownload(
    request: RequestPackageDownloadRequest
  ): Promise<RequestPackageDownloadResponse> {
    // 1. Validate API key and get associated license
    const { apiKey, license } = await this.validateApiKeyAndGetLicense(request.apiKey);

    // 2. Check if license has access to the requested package
    if (!license.hasPackage(request.packageType as any)) {
      throw new UnauthorizedError(
        `License does not include package: ${request.packageType}`
      );
    }

    // 3. Check if license is valid
    if (!license.isValid()) {
      throw new UnauthorizedError(
        `License is not valid (status: ${license.status})`
      );
    }

    // 4. Generate signed URL for package download
    // In a real implementation, this would use R2/S3 presigned URLs
    const version = request.version || await this.getLatestVersion(request.packageType);
    const downloadUrl = this.generateSignedUrl(request.packageType, version, license.organizationId);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 5. Mark API key as used
    apiKey.markAsUsed();
    await this.apiKeyRepo.save(apiKey);

    return {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      packageType: request.packageType,
      version,
    };
  }

  /**
   * Validate API key and get associated license
   *
   * @param rawApiKey - The raw API key from the request
   * @returns The API key and associated license
   * @throws UnauthorizedError if API key is invalid
   */
  private async validateApiKeyAndGetLicense(rawApiKey: string): Promise<{ apiKey: ApiKey; license: License }> {
    if (!rawApiKey || !rawApiKey.startsWith('oxl_')) {
      throw new UnauthorizedError('Invalid API key format');
    }

    // Hash the API key to lookup in database
    const { createHash } = await import('crypto');
    const keyHash = createHash('sha256').update(rawApiKey).digest('hex');

    const apiKey = await this.apiKeyRepo.findByKeyHash(keyHash);
    if (!apiKey) {
      throw new UnauthorizedError('Invalid API key');
    }

    if (!apiKey.isValid()) {
      throw new UnauthorizedError(
        `API key is not valid (status: ${apiKey.status})`
      );
    }

    const license = await this.licenseRepo.findById(apiKey.licenseId);
    if (!license) {
      throw new BusinessRuleViolationError('licenseId', 'Associated license not found');
    }

    return { apiKey, license };
  }

  /**
   * Generate a signed URL for package download
   *
   * In a real implementation, this would use R2/S3 presigned URLs.
   * For now, this is a placeholder.
   *
   * @param packageType - The type of package
   * @param version - The version of the package
   * @param organizationId - The organization ID
   * @returns Signed download URL
   */
  private generateSignedUrl(packageType: string, version: string, organizationId: string): string {
    // TODO: Implement R2/S3 presigned URL generation
    // This is a placeholder that returns a mock URL
    return `https://r2.example.com/capabilities-sdk/releases/${version}/${packageType}.zip?org=${organizationId}`;
  }

  /**
   * Get the latest version of a package
   *
   * In a real implementation, this would query the package storage.
   * For now, this is a placeholder.
   *
   * @param packageType - The type of package
   * @returns The latest version
   */
  private async getLatestVersion(packageType: string): Promise<string> {
    // TODO: Implement version lookup from package storage
    // For now, return a mock version
    return '2025_02_08_001';
  }
}

export type {
  ResolveCapabilitiesRequest,
  ResolveCapabilitiesResponse,
  RequestPackageDownloadRequest,
  RequestPackageDownloadResponse,
};
