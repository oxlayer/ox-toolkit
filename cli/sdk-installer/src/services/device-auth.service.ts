/**
 * Device Authorization Service
 *
 * Implements the Device Authorization Flow (RFC 8628) for CLI authentication.
 * This enables browser-based login without copying API keys.
 *
 * Flow:
 * 1. CLI requests a device code
 * 2. CLI opens browser with verification URL
 * 3. User logs in and approves the device
 * 4. CLI polls for token completion
 * 5. Token is saved locally
 */

import type {
  CliConfig,
  DeviceCodeResponse,
  TokenPollResponse,
  TokenScope,
  CapabilityManifest,
} from '../types/capabilities.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { randomBytes } from 'crypto';

// ============================================================================
// Constants
// ============================================================================

const CONFIG_DIR = join(homedir(), '.oxlayer');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const DEVICES_FILE = join(CONFIG_DIR, 'devices.json');

const DEFAULT_API_ENDPOINT = 'https://api.oxlayer.dev';
const DEFAULT_POLL_INTERVAL = 5; // seconds
const MAX_POLL_ATTEMPTS = 120; // 10 minutes total

// ============================================================================
// Types
// ============================================================================

interface DeviceRegistry {
  devices: Array<{
    deviceId: string;
    deviceName: string;
    createdAt: string;
    lastSeenAt: string;
  }>;
}

interface PollingOptions {
  interval?: number;
  maxAttempts?: number;
  onProgress?: (attempt: number, maxAttempts: number) => void;
}

// ============================================================================
// Device ID Management
// ============================================================================

/**
 * Get or create a persistent device ID for this machine
 */
export async function getDeviceId(): Promise<string> {
  try {
    const registry = await loadDeviceRegistry();
    const hostname = await getHostname();

    // Find existing device for this hostname
    let device = registry.devices.find(d => d.deviceName === hostname);

    if (!device) {
      // Create new device
      device = {
        deviceId: generateDeviceId(),
        deviceName: hostname,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
      registry.devices.push(device);
      await saveDeviceRegistry(registry);
    } else {
      // Update last seen
      device.lastSeenAt = new Date().toISOString();
      await saveDeviceRegistry(registry);
    }

    return device.deviceId;
  } catch {
    // Fallback to ephemeral device ID
    return generateDeviceId();
  }
}

/**
 * Get human-readable device name
 */
export async function getDeviceName(): Promise<string> {
  return getHostname();
}

function generateDeviceId(): string {
  return `oxl_dev_${randomBytes(16).toString('hex')}`;
}

async function getHostname(): Promise<string> {
  const os = await import('os');
  return os.hostname();
}

async function loadDeviceRegistry(): Promise<DeviceRegistry> {
  try {
    const content = await fs.readFile(DEVICES_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { devices: [] };
  }
}

async function saveDeviceRegistry(registry: DeviceRegistry): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(DEVICES_FILE, JSON.stringify(registry, null, 2));
}

// ============================================================================
// Device Authorization Flow
// ============================================================================

/**
 * Initiate device authorization flow
 *
 * Returns a device code and verification URL for the user to visit
 */
export async function initiateDeviceAuth(
  environment: 'development' | 'staging' | 'production' = 'development',
  apiEndpoint?: string
): Promise<DeviceCodeResponse> {
  const deviceId = await getDeviceId();
  const deviceName = await getDeviceName();
  const endpoint = apiEndpoint || DEFAULT_API_ENDPOINT;

  const response = await fetch(`${endpoint}/v1/cli/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      deviceName,
      environment,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initiate device auth: ${error}`);
  }

  return response.json();
}

/**
 * Poll for token completion
 *
 * Polls the endpoint until the user completes authorization or timeout
 */
export async function pollForToken(
  pollEndpoint: string,
  options: PollingOptions = {}
): Promise<TokenPollResponse & { success: true }> {
  const interval = options.interval || DEFAULT_POLL_INTERVAL;
  const maxAttempts = options.maxAttempts || MAX_POLL_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    options.onProgress?.(attempt, maxAttempts);

    const response = await fetch(pollEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Poll request failed: ${response.statusText}`);
    }

    const result: TokenPollResponse = await response.json();

    if (!result.pending) {
      if (result.error) {
        throw new Error(`Authorization failed: ${result.error}`);
      }

      return { ...result, success: true };
    }

    // Wait before next poll
    await sleep(interval * 1000);
  }

  throw new Error('Authorization timed out. Please try again.');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Save CLI configuration with scoped token
 */
export async function saveConfig(config: CliConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
    mode: 0o600, // Read/write for owner only
  });
}

/**
 * Load CLI configuration
 */
export async function loadConfig(): Promise<CliConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Remove CLI configuration (logout)
 */
export async function removeConfig(): Promise<void> {
  try {
    await fs.unlink(CONFIG_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Get scoped access token
 * Checks config file and falls back to environment variable
 */
export async function getAccessToken(): Promise<string | null> {
  // Check environment variable first
  const envToken = process.env.OXLAYER_TOKEN;
  if (envToken) {
    return envToken;
  }

  // Check config file
  const config = await loadConfig();
  return config?.token ?? null;
}

/**
 * Validate token format
 */
export function validateToken(token: string): boolean {
  // OxLayer scoped tokens start with 'oxl_cli_' and are at least 32 characters
  const MIN_TOKEN_LENGTH = 32;
  return (
    typeof token === 'string' &&
    token.startsWith('oxl_cli_') &&
    token.length >= MIN_TOKEN_LENGTH
  );
}

/**
 * Check if token is expired
 */
export function isTokenExpired(config: CliConfig): boolean {
  const expiresAt = new Date(config.tokenInfo.expiresAt);
  return expiresAt < new Date();
}

/**
 * Refresh capability manifest from API
 */
export async function refreshManifest(
  config: CliConfig,
  apiEndpoint?: string
): Promise<CliConfig> {
  const endpoint = apiEndpoint || config.apiEndpoint || DEFAULT_API_ENDPOINT;

  const response = await fetch(`${endpoint}/v1/cli/manifest`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh manifest: ${response.statusText}`);
  }

  const manifest: CapabilityManifest = await response.json();

  return {
    ...config,
    manifest,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get cached or fetch new capability manifest
 */
export async function getManifest(
  apiEndpoint?: string
): Promise<CapabilityManifest | null> {
  const config = await loadConfig();
  if (!config) {
    return null;
  }

  // Check if cached manifest is still valid
  if (config.manifest) {
    const expiresAt = new Date(config.manifest.expiresAt);
    if (expiresAt > new Date()) {
      return config.manifest;
    }
  }

  // Refresh manifest
  const updated = await refreshManifest(config, apiEndpoint);
  await saveConfig(updated);

  return updated.manifest || null;
}

// ============================================================================
// Auth State Helpers
// ============================================================================

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const config = await loadConfig();
  if (!config) {
    return false;
  }

  // Check token expiration
  if (isTokenExpired(config)) {
    return false;
  }

  return true;
}

/**
 * Get authentication info for display
 */
export async function getAuthInfo(): Promise<{
  authenticated: boolean;
  deviceId?: string;
  organizationId?: string;
  expiresAt?: string;
  scopes?: string[];
}> {
  const config = await loadConfig();

  if (!config) {
    return { authenticated: false };
  }

  return {
    authenticated: !isTokenExpired(config),
    deviceId: config.tokenInfo.deviceId,
    organizationId: config.organizationId,
    expiresAt: config.tokenInfo.expiresAt,
    scopes: config.tokenInfo.scopes,
  };
}

// ============================================================================
// URL Helpers
// ============================================================================

/**
 * Build verification URL with device code
 */
export function buildVerificationUrl(baseUrl: string, deviceCode: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('device_code', deviceCode);
  return url.toString();
}

/**
 * Open browser to verification URL
 */
export async function openBrowser(url: string): Promise<void> {
  const { exec } = await import('child_process');

  const platform = process.platform;

  let command: string;
  switch (platform) {
    case 'darwin':
      command = `open "${url}"`;
      break;
    case 'win32':
      command = `start "" "${url}"`;
      break;
    default:
      command = `xdg-open "${url}"`;
  }

  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) {
        reject(new Error(`Failed to open browser: ${error.message}`));
      } else {
        resolve();
      }
    });
  });
}

// ============================================================================
// Migration Helpers (for transitioning from API key to token)
// ============================================================================

/**
 * Migrate legacy API key config to new token-based config
 */
export async function migrateFromApiKey(apiKey: string): Promise<CliConfig> {
  const deviceId = await getDeviceId();
  const deviceName = await getDeviceName();

  // Exchange API key for scoped token
  const endpoint = process.env.OXLAYER_API_ENDPOINT || DEFAULT_API_ENDPOINT;
  const response = await fetch(`${endpoint}/v1/cli/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, deviceId, deviceName }),
  });

  if (!response.ok) {
    throw new Error(`Migration failed: ${response.statusText}`);
  }

  const result = await response.json();

  return {
    token: result.accessToken,
    tokenInfo: result.tokenInfo,
    organizationId: result.organizationId,
    environment: 'development',
    vendorDir: '.capabilities-vendor',
    updatedAt: new Date().toISOString(),
  };
}
