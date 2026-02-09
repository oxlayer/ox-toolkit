/**
 * Authentication Service
 *
 * Handles API key storage and retrieval
 */

import type { InstallerConfig } from '../types/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.oxlayer');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Get the configuration directory path
 */
export function getConfigDir(): string {
  return CONFIG_DIR;
}

/**
 * Get the configuration file path
 */
export function getConfigFile(): string {
  return CONFIG_FILE;
}

/**
 * Load installer configuration from disk
 */
export async function loadConfig(): Promise<InstallerConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as InstallerConfig;
  } catch {
    return null;
  }
}

/**
 * Save installer configuration to disk
 */
export async function saveConfig(config: InstallerConfig): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Remove stored configuration
 */
export async function removeConfig(): Promise<void> {
  try {
    await fs.unlink(CONFIG_FILE);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Get API key from config or environment
 */
export async function getApiKey(): Promise<string | null> {
  // Check environment variable first
  const envKey = process.env.OXLAYER_API_KEY;
  if (envKey) {
    return envKey;
  }

  // Check config file
  const config = await loadConfig();
  return config?.apiKey ?? null;
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): boolean {
  // OxLayer API keys start with 'oxl_' and are at least 20 characters
  const MIN_KEY_LENGTH = 20;
  return (
    typeof apiKey === 'string' &&
    apiKey.startsWith('oxl_') &&
    apiKey.length >= MIN_KEY_LENGTH
  );
}
