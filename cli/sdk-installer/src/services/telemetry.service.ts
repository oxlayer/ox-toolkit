/**
 * Telemetry Service
 *
 * Light, privacy-focused usage tracking
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Telemetry event types
 */
export type TelemetryEvent =
  | 'install'
  | 'resolve'
  | 'login'
  | 'doctor'
  | 'diff'
  | 'error';

/**
 * Telemetry data (minimal and privacy-focused)
 */
export interface TelemetryData {
  event: TelemetryEvent;
  sdkVersion?: string;
  cliVersion: string;
  nodeVersion: string;
  platform: string;
  projectType?: string;
  environment?: string;
  command?: string;
  errorCode?: string;
}

/**
 * Telemetry configuration
 */
interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  userId?: string; // Anonymous user ID
}

const TELEMETRY_FILE = join(process.env.HOME || process.env.USERPROFILE || '', '.oxlayer', 'telemetry.json');
const TELEMETRY_ENABLED = process.env.OXLAYER_TELEMETRY !== '0';

/**
 * Get or create telemetry config
 */
async function getTelemetryConfig(): Promise<TelemetryConfig> {
  try {
    if (existsSync(TELEMETRY_FILE)) {
      const content = await fs.readFile(TELEMETRY_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // File doesn't exist or is invalid
  }

  // Create new config with anonymous user ID
  const config: TelemetryConfig = {
    enabled: TELEMETRY_ENABLED,
    userId: generateAnonymousId(),
  };

  await saveTelemetryConfig(config);
  return config;
}

/**
 * Save telemetry config
 */
async function saveTelemetryConfig(config: TelemetryConfig): Promise<void> {
  const dir = join(process.env.HOME || process.env.USERPROFILE || '', '.oxlayer');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(TELEMETRY_FILE, JSON.stringify(config, null, 2));
}

/**
 * Generate anonymous user ID
 */
function generateAnonymousId(): string {
  // Generate a random ID that persists across sessions
  const { randomBytes } = require('crypto');
  return randomBytes(8).toString('hex');
}

/**
 * Send telemetry event (fire-and-forget)
 */
export async function trackEvent(data: TelemetryData): Promise<void> {
  const config = await getTelemetryConfig();

  if (!config.enabled) {
    return; // Telemetry disabled
  }

  // Add metadata
  const enrichedData: TelemetryData = {
    ...data,
    userId: config.userId,
    timestamp: new Date().toISOString(),
  } as TelemetryData;

  // Send in background, don't await
  sendTelemetry(enrichedData).catch(() => {
    // Silently fail - telemetry should never break the CLI
  });
}

/**
 * Send telemetry to server (non-blocking)
 */
async function sendTelemetry(data: Record<string, unknown>): Promise<void> {
  const endpoint = process.env.OXLAYER_TELEMETRY_ENDPOINT || 'https://telemetry.oxlayer.dev/v1/event';

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      // Keep request light - don't wait for response
      keepalive: true,
    }).catch(() => {
      // Network error - ignore
    });
  } catch {
    // Ignore all errors - telemetry is fire-and-forget
  }
}

/**
 * Track CLI command execution
 */
export function trackCommand(
  command: string,
  options: {
    sdkVersion?: string;
    projectType?: string;
    environment?: string;
  } = {}
): void {
  trackEvent({
    event: command,
    command,
    ...options,
    cliVersion: '0.0.1',
    nodeVersion: process.version,
    platform: process.platform,
  });
}

/**
 * Track error
 */
export function trackError(
  command: string,
  errorCode: string,
  options: {
    sdkVersion?: string;
    projectType?: string;
  } = {}
): void {
  trackEvent({
    event: 'error',
    command,
    errorCode,
    ...options,
    cliVersion: '0.0.1',
    nodeVersion: process.version,
    platform: process.platform,
  });
}

/**
 * Enable telemetry
 */
export async function enableTelemetry(): Promise<void> {
  const config = await getTelemetryConfig();
  config.enabled = true;
  await saveTelemetryConfig(config);
}

/**
 * Disable telemetry
 */
export async function disableTelemetry(): Promise<void> {
  const config = await getTelemetryConfig();
  config.enabled = false;
  await saveTelemetryConfig(config);
}

/**
 * Get telemetry status
 */
export async function getTelemetryStatus(): Promise<{ enabled: boolean; userId: string }> {
  const config = await getTelemetryConfig();
  return {
    enabled: config.enabled,
    userId: config.userId || '',
  };
}

export default {
  trackEvent,
  trackCommand,
  trackError,
  enableTelemetry,
  disableTelemetry,
  getTelemetryStatus,
};
