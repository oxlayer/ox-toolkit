/**
 * Authentication Service
 *
 * Handles CLI authentication with scoped tokens.
 *
 * @deprecated Most methods are now thin wrappers around device-auth.service.ts.
 * New code should import from device-auth.service.ts directly.
 */

import type { InstallerConfig } from '../types/index.js';

// Re-export everything from the new device-auth service
export * from './device-auth.service.js';

// ============================================================================
// Legacy API (deprecated)
// ============================================================================

/**
 * @deprecated Use loadConfig from device-auth.service.ts instead
 * Returns CliConfig instead of InstallerConfig
 */
export async function loadConfig(): Promise<InstallerConfig | null> {
  const { loadConfig: loadNewConfig } = await import('./device-auth.service.js');
  const config = await loadNewConfig();

  if (!config) {
    return null;
  }

  // Convert new config to legacy format for backward compatibility
  return {
    apiKey: config.token, // Map token to apiKey for legacy consumers
    environment: config.environment,
    vendorDir: config.vendorDir,
    apiEndpoint: config.apiEndpoint,
  };
}

/**
 * @deprecated Use saveConfig from device-auth.service.ts instead
 * Accepts InstallerConfig but converts to CliConfig internally
 */
export async function saveConfig(config: InstallerConfig): Promise<void> {
  const { saveConfig: saveNewConfig } = await import('./device-auth.service.js');

  // For legacy API key config, we need to migrate
  if (config.apiKey && !config.apiKey.startsWith('oxl_cli_')) {
    // This is an old API key format - would need migration
    // For now, save as-is to avoid breaking existing flows
    const { promises: fs } = await import('fs');
    const { join } = await import('path');
    const { homedir } = await import('os');

    const CONFIG_DIR = join(homedir(), '.oxlayer');
    const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), {
      mode: 0o600,
    });
    return;
  }

  // Convert legacy config to new format
  await saveNewConfig({
    token: config.apiKey,
    tokenInfo: {
      token: config.apiKey,
      tokenType: 'Bearer',
      scopes: ['sdk:read', 'capabilities:read', 'downloads:read'],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      deviceId: 'legacy',
    },
    organizationId: '',
    environment: config.environment,
    vendorDir: config.vendorDir,
    apiEndpoint: config.apiEndpoint,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * @deprecated Use removeConfig from device-auth.service.ts instead
 */
export async function removeConfig(): Promise<void> {
  const { removeConfig: removeNewConfig } = await import('./device-auth.service.js');
  await removeNewConfig();
}

/**
 * @deprecated Use getAccessToken from device-auth.service.ts instead
 */
export async function getApiKey(): Promise<string | null> {
  const { getAccessToken } = await import('./device-auth.service.js');
  return getAccessToken();
}

/**
 * @deprecated Use validateToken from device-auth.service.ts instead
 */
export function validateApiKey(apiKey: string): boolean {
  const { validateToken } = require('./device-auth.service.js');
  return validateToken(apiKey);
}

/**
 * Get the configuration directory path
 */
export function getConfigDir(): string {
  const { join } = require('path');
  const { homedir } = require('os');
  return join(homedir(), '.oxlayer');
}

/**
 * Get the configuration file path
 */
export function getConfigFile(): string {
  return require('path').join(getConfigDir(), 'config.json');
}
