/**
 * Configuration file loader
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { load } from 'js-yaml';
import { substituteEnvInObject } from './env.js';
import { validateConfigWithBlueprint } from './schema.js';
import { applyBlueprint } from './blueprints.js';
import type { KeycloakBootstrapConfig, KeycloakBootstrapConfigWithBlueprint } from '../types/config.js';

/**
 * Parse environment variables from a .env file
 */
export async function loadEnvFile(filePath: string): Promise<Record<string, string>> {
  const resolvedPath = resolve(process.cwd(), filePath);
  const content = await readFile(resolvedPath, 'utf-8');

  const env: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE format
    const match = trimmed.match(/^([\w.-]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      // Remove quotes if present
      const cleanValue = value
        .replace(/^['"]|['"]$/g, '')
        .replace(/^["']|["']$/g, '');
      env[key] = cleanValue;
    }
  }

  return env;
}

/**
 * Load configuration from a file
 * Supports: .ts, .js, .json, .yaml, .yml
 */
export async function loadConfig(
  filePath: string,
  options: { env?: Record<string, string | undefined>; cwd?: string } = {}
): Promise<KeycloakBootstrapConfig> {
  const { env = process.env, cwd = process.cwd() } = options;
  const resolvedPath = resolve(cwd, filePath);
  const ext = resolvedPath.split('.').pop();

  let rawConfig: unknown;

  try {
    switch (ext) {
      case 'ts':
      case 'js':
        // Dynamic import for TS/JS files
        const imported = await import(resolvedPath);
        rawConfig = imported.default || imported;
        break;

      case 'json':
        const jsonContent = await readFile(resolvedPath, 'utf-8');
        rawConfig = JSON.parse(jsonContent);
        break;

      case 'yaml':
      case 'yml':
        const yamlContent = await readFile(resolvedPath, 'utf-8');
        rawConfig = load(yamlContent);
        break;

      default:
        throw new Error(`Unsupported config file type: .${ext}. Supported: .ts, .js, .json, .yaml, .yml`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load config from ${resolvedPath}: ${error.message}`);
    }
    throw error;
  }

  // Substitute environment variables
  const configWithEnv = substituteEnvInObject(rawConfig, env);

  // Validate configuration
  let validatedConfig: KeycloakBootstrapConfigWithBlueprint;
  try {
    validatedConfig = validateConfigWithBlueprint(configWithEnv);
  } catch (error) {
    throw new Error(`Configuration validation failed: ${error}`);
  }

  // Apply blueprint if specified
  const finalConfig = applyBlueprint(validatedConfig);

  return finalConfig;
}

/**
 * Load configuration without validation (for testing)
 */
export async function loadConfigUnsafe(
  filePath: string,
  options: { cwd?: string } = {}
): Promise<unknown> {
  const { cwd = process.cwd() } = options;
  const resolvedPath = resolve(cwd, filePath);
  const ext = resolvedPath.split('.').pop();

  switch (ext) {
    case 'ts':
    case 'js':
      const imported = await import(resolvedPath);
      return imported.default || imported;

    case 'json':
      const jsonContent = await readFile(resolvedPath, 'utf-8');
      return JSON.parse(jsonContent);

    case 'yaml':
    case 'yml':
      const yamlContent = await readFile(resolvedPath, 'utf-8');
      return load(yamlContent);

    default:
      throw new Error(`Unsupported config file type: .${ext}`);
  }
}
