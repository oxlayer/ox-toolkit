/**
 * Capability Resolution Service
 *
 * This service is called by SDKs to resolve their capabilities and limits.
 * It implements capability-based authorization model as described in architecture brief.
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
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { packageReleases } from '../db/schema.js';
import { S3Client } from '@aws-sdk/client-s3';

// R2/S3 for presigned URLs
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('Missing R2 configuration. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.');
    }

    s3Client = new S3Client({
      endpoint,
      region: 'auto',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

async function importS3Client(): Promise<void> {
  if (!s3Client) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    s3Client = new S3Client({
      endpoint: process.env.R2_ENDPOINT,
      region: 'auto',
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    }) as any;
  }
}

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
 * Package download request (using API key)
 */
export interface RequestPackageDownloadRequest {
  apiKey: string;
  packageType: string;
  version?: string;
}

/**
 * Package download request (using JWT)
 */
export interface RequestPackageDownloadWithJwtRequest {
  organizationId: string;
  packageType: string;
  version?: string;
}

/**
 * Package download response
 *
 * Returns a signed URL for downloading a package
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
    private readonly licenseRepo: ILicenseRepository,
    private readonly db: PostgresJsDatabase<typeof schema>
  ) { }

  /**
   * Resolve capabilities for a SDK request
   *
   * This is the main method that SDKs call to get their configuration.
   * It returns actual limits and features they can use.
   *
   * @param request - The capability resolution request
   * @returns Capability configuration with limits
   */
  async resolveCapabilities(request: ResolveCapabilitiesRequest): Promise<ResolveCapabilitiesResponse> {
    // 1. Validate API key and get associated license
    const { apiKey, license } = await this.validateApiKeyAndGetLicense(request.apiKey);

    // 2. Check if API key can be used in requested environment
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

    // 4. Check if license includes requested environment
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
   * Request a package download (API key auth)
   *
   * Validates that organization has access to requested package
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
    // Resolve "latest" to actual version number
    const version = (!request.version || request.version === 'latest')
      ? await this.getLatestVersion(request.packageType)
      : request.version;
    const downloadUrl = await this.generateSignedUrl(request.packageType, version);
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
   * Request a package download (JWT auth - for CLI)
   *
   * Validates that organization has access to requested package
   * and returns a signed URL for download from R2/S3.
   *
   * @param request - The package download request
   * @returns Signed download URL
   */
  async requestPackageDownloadWithJwt(
    request: RequestPackageDownloadWithJwtRequest
  ): Promise<RequestPackageDownloadResponse> {
    console.log('[DEBUG] requestPackageDownloadWithJwt called with:', JSON.stringify(request, null, 2));

    // 1. Validate organization and get license
    const licenses = await this.licenseRepo.findActiveByOrganization(request.organizationId);
    console.log('[DEBUG] Found licenses:', licenses?.length || 0);

    if (!licenses || licenses.length === 0) {
      throw new UnauthorizedError(
        `No valid license found for organization: ${request.organizationId}`
      );
    }

    const license = licenses[0];
    console.log('[DEBUG] License:', { id: license.id, tier: license.tier, packages: license.packages });

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
    // Resolve "latest" to actual version number
    const version = (!request.version || request.version === 'latest')
      ? await this.getLatestVersion(request.packageType)
      : request.version;
    console.log('[DEBUG] Resolved version:', version);
    console.log('[DEBUG] Generating signed URL for packageType:', request.packageType, 'version:', version);

    const downloadUrl = await this.generateSignedUrl(request.packageType, version);
    console.log('[DEBUG] Generated download URL:', downloadUrl);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const response = {
      downloadUrl,
      expiresAt: expiresAt.toISOString(),
      packageType: request.packageType,
      version,
    };

    console.log('[DEBUG] Returning response:', JSON.stringify(response, null, 2));
    return response;
  }

  /**
   * Validate API key and get associated license
   *
   * @param rawApiKey - The raw API key from request
   * @returns The API key and associated license
   * @throws UnauthorizedError if API key is invalid
   */
  private async validateApiKeyAndGetLicense(rawApiKey: string): Promise<{ apiKey: ApiKey; license: License }> {
    if (!rawApiKey || !rawApiKey.startsWith('oxl_')) {
      throw new UnauthorizedError('Invalid API key format');
    }

    // Hash API key to lookup in database
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
   * Generate a signed URL for package download from R2/S3
   *
   * Uses AWS SDK v3 presigned URLs for secure, time-limited access.
   * Retrieves the actual R2 key from the database to ensure the file exists.
   *
   * @param packageType - The type of package
   * @param version - The version of the package
   * @returns Signed download URL (valid for 5 minutes)
   */
  private async generateSignedUrl(packageType: string, version: string): Promise<string> {
    // Import S3 client dynamically
    await importS3Client();

    const bucketName = process.env.R2_BUCKET_NAME!;

    // Get the actual R2 key from the database instead of hardcoding it
    const result = await this.db
      .select({ r2Key: packageReleases.r2Key })
      .from(packageReleases)
      .where(and(
        eq(packageReleases.packageType, packageType as any),
        eq(packageReleases.version, version)
      ))
      .limit(1);

    if (!result[0]) {
      throw new Error(`Package release not found: ${packageType} ${version}`);
    }

    const key = result[0].r2Key;

    console.log('[DEBUG] generateSignedUrl:', { bucketName, key, packageType, version });

    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key.replace("oxlayer-sdk/", "/"),
    });

    // Generate URL that expires in 5 minutes
    const url = await getSignedUrl(s3Client!, command, { expiresIn: 300 });
    console.log('[DEBUG] Signed URL generated (first 200 chars):', url.substring(0, 200) + '...');
    return url;
  }

  /**
   * Get latest version of a package
   *
   * Queries the package_releases table for the latest version of the given package type.
   *
   * @param packageType - The type of package
   * @returns The latest version
   */
  private async getLatestVersion(packageType: string): Promise<string> {
    const result = await this.db
      .select({ version: packageReleases.version })
      .from(packageReleases)
      .where(eq(packageReleases.packageType, packageType as any))
      .orderBy(desc(packageReleases.releasedAt))
      .limit(1);

    if (!result[0]) {
      return 'Failed to retrieve, version unknown';
    }

    return result[0].version;
  }
}
