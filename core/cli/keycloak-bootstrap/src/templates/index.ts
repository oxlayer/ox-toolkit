/**
 * Template helper exports
 */

import type { KeycloakBootstrapConfig } from '../types/config.js';
import { applyBlueprint } from '../config/blueprints.js';
import { validateConfigWithBlueprint } from '../config/schema.js';

/**
 * Define configuration helper for type-safe configs
 */
export function defineConfig(config: KeycloakBootstrapConfig & { extends?: string }): KeycloakBootstrapConfig {
  // Validate the configuration (function call, not schema.parse)
  const validated = validateConfigWithBlueprint(config);

  // Apply blueprint if specified
  const final = applyBlueprint(validated);

  return final;
}

/**
 * Re-export client templates
 */
export { resolveClientConfig, CLIENT_TEMPLATES } from './clients.js';
export type { ClientTemplate, ResolvedClientConfig } from '../types/config.js';

/**
 * Re-export blueprints
 */
export { BLUEPRINTS, getBlueprints, hasBlueprint } from '../config/blueprints.js';
export type { BlueprintConfig } from '../types/config.js';

/**
 * Re-export validation
 */
export { validateConfig, safeValidateConfig } from '../config/schema.js';
export type { KeycloakBootstrapConfig } from '../types/config.js';
