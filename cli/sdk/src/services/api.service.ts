/**
 * API Service
 *
 * Handles communication with the OxLayer Control Panel API using scoped tokens.
 *
 * @deprecated This service will be refactored to use capability manifests.
 * New code should work with manifests directly via device-auth.service.ts.
 */

import type {
  CapabilityResolutionResponse,
  PackageDownloadResponse,
} from '../types/capabilities.js';
import type {
  CapabilityName,
  Environment,
  SdkPackageType,
} from '../types/index.js';
import { getAccessToken, validateToken } from './device-auth.service.js';

const DEFAULT_API_ENDPOINT = 'https://api.oxlayer.dev';

/**
 * Get API endpoint from config or default
 */
function getApiEndpoint(): string {
  return process.env.OXLAYER_API_ENDPOINT || DEFAULT_API_ENDPOINT;
}

/**
 * Make an authenticated API request using scoped token
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = process.env.OXLAYER_TOKEN || await getAccessToken();

  if (!token || !validateToken(token)) {
    throw new Error(
      'Invalid or missing access token. Please run: oxlayer login'
    );
  }

  const url = `${getApiEndpoint()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed (${response.status}): ${error}`);
  }

  return response.json();
}

/**
 * Resolve capabilities for the current project
 *
 * This is the main method that SDKs call to get their configuration.
 *
 * @deprecated Use getManifest from device-auth.service.ts instead
 */
export async function resolveCapabilities(
  requested: CapabilityName[],
  environment: Environment = 'development',
  projectId?: string
): Promise<CapabilityResolutionResponse> {
  const result = await apiRequest<{ data: CapabilityResolutionResponse }>(
    '/v1/capabilities/resolve',
    {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        environment,
        requested,
      }),
    }
  );

  return result.data;
}

/**
 * Request a package download URL
 *
 * Returns a signed URL for downloading a package from R2/S3
 *
 * @deprecated Use getManifest from device-auth.service.ts to get package URLs
 */
export async function requestPackageDownload(
  packageType: SdkPackageType,
  version?: string
): Promise<PackageDownloadResponse> {
  const result = await apiRequest<{ data: PackageDownloadResponse }>(
    '/v1/packages/download',
    {
      method: 'POST',
      body: JSON.stringify({
        packageType,
        version,
      }),
    }
  );

  return result.data;
}

/**
 * Get latest release version
 */
export async function getLatestVersion(): Promise<string> {
  const result = await apiRequest<{ data: { version: string } }>(
    '/v1/latest-version'
  );
  return result.data.version;
}

/**
 * Check API health
 */
export async function healthCheck(): Promise<boolean> {
  try {
    await apiRequest<{ status: string }>('/v1/health');
    return true;
  } catch {
    return false;
  }
}

export default {
  resolveCapabilities,
  requestPackageDownload,
  getLatestVersion,
  healthCheck,
};
