/**
 * API Service
 *
 * Handles communication with the OxLayer Control Panel API
 */

import type {
  CapabilityName,
  CapabilityResolutionResponse,
  Environment,
  PackageDownloadResponse,
  SdkPackageType,
} from '../types/index.js';
import { validateApiKey } from './auth.service.js';

const DEFAULT_API_ENDPOINT = 'https://api.oxlayer.dev';

/**
 * Get API endpoint from config or default
 */
function getApiEndpoint(): string {
  return process.env.OXLAYER_API_ENDPOINT || DEFAULT_API_ENDPOINT;
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = process.env.OXLAYER_API_KEY;
  if (!apiKey || !validateApiKey(apiKey)) {
    throw new Error('Invalid or missing API key. Set OXLAYER_API_KEY environment variable or run: oxlayer login');
  }

  const url = `${getApiEndpoint()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
 */
export async function resolveCapabilities(
  requested: CapabilityName[],
  environment: Environment = 'development',
  projectId?: string
): Promise<CapabilityResolutionResponse> {
  const result = await apiRequest<{ data: CapabilityResolutionResponse }>('/v1/capabilities/resolve', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: process.env.OXLAYER_API_KEY,
      projectId,
      environment,
      requested,
    }),
  });

  return result.data;
}

/**
 * Request a package download URL
 *
 * Returns a signed URL for downloading a package from R2/S3
 */
export async function requestPackageDownload(
  packageType: SdkPackageType,
  version?: string
): Promise<PackageDownloadResponse> {
  const result = await apiRequest<{ data: PackageDownloadResponse }>('/v1/packages/download', {
    method: 'POST',
    body: JSON.stringify({
      apiKey: process.env.OXLAYER_API_KEY,
      packageType,
      version,
    }),
  });

  return result.data;
}

/**
 * Get latest release version
 */
export async function getLatestVersion(): Promise<string> {
  const result = await apiRequest<{ data: { version: string } }>('/v1/latest-version');
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
