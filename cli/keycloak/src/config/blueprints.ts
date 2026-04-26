/**
 * Blueprint system for reusable realm configurations
 */

import type { BlueprintConfig, _ClientConfig, KeycloakBootstrapConfig } from '../types/config.js';
import type { ClientTemplate } from '../types/config.js';
import { PLATFORM_REALM_MAPPERS, CLIENT_REALM_MAPPERS } from './protocol-mappers.js';

/**
 * Built-in blueprints
 */
export const BLUEPRINTS: Record<string, BlueprintConfig> = {
  /**
   * Platform realm blueprint
   * Used for platform operations (admin/, support)
   * Contains platform-specific roles and minimal protocol mappers
   */
  'platform': {
    name: 'Platform Realm',
    description: 'Dedicated realm for platform operations and internal staff',
    realm: {
      type: 'platform',
      security: {
        loginWithEmailAllowed: true,
        registrationEmailAsUsername: false,
        duplicateEmailsAllowed: false,
        resetPasswordAllowed: true,
        bruteForceProtected: true,
      },
    },
    defaultClients: ['admin-client'],
    defaultRoles: [
      { name: 'platform-admin', description: 'Platform administrator with full access' },
      { name: 'platform-support', description: 'Platform support staff' },
      { name: 'platform-ops', description: 'Platform operations team' },
    ],
    defaultMappers: PLATFORM_REALM_MAPPERS,
  },

  /**
   * Client realm blueprint
   * Used for B2B clients (people/, app/)
   * Contains full tenant context protocol mappers
   */
  'client': {
    name: 'Client Realm',
    description: 'Dedicated realm for B2B clients with organizations and workspaces',
    realm: {
      type: 'client',
      security: {
        loginWithEmailAllowed: true,
        registrationEmailAsUsername: true,
        duplicateEmailsAllowed: false,
        resetPasswordAllowed: true,
        bruteForceProtected: true,
      },
    },
    defaultClients: ['api-client', 'web-client', 'app-client'],
    defaultRoles: [
      { name: 'owner', description: 'B2B client owner (contract owner)' },
      { name: 'supervisor', description: 'B2B operations team with multi-workspace access' },
      { name: 'manager', description: 'Company manager with organization-scoped access' },
      { name: 'member', description: 'End user with workspace-scoped access' },
    ],
    defaultMappers: CLIENT_REALM_MAPPERS,
  },

  /**
   * Legacy blueprints (kept for backward compatibility)
   * @deprecated Use 'platform' or 'client' instead
   */
  'b2c-saas': {
    name: 'B2C SaaS Application',
    description: 'Shared realm for B2C SaaS with multi-tenancy via Organizations (LEGACY - use client blueprint)',
    realm: {
      type: 'client',
      security: {
        loginWithEmailAllowed: true,
        registrationEmailAsUsername: true,
        duplicateEmailsAllowed: false,
        resetPasswordAllowed: true,
        bruteForceProtected: true,
      },
    },
    defaultClients: ['api-client', 'web-client'],
    defaultRoles: [
      { name: 'user', description: 'Standard user' },
      { name: 'premium', description: 'Premium subscriber' },
      { name: 'admin', description: 'Application administrator' },
    ],
    defaultMappers: CLIENT_REALM_MAPPERS,
  },

  'enterprise': {
    name: 'Enterprise Deployment',
    description: 'Dedicated realm for enterprise customers (LEGACY - use client blueprint)',
    realm: {
      type: 'client',
      security: {
        loginWithEmailAllowed: true,
        bruteForceProtected: true,
        permanentLockout: false,
        resetPasswordAllowed: true,
      },
    },
    defaultClients: ['api-client', 'admin-client', 'web-client', 'mobile-client'],
    defaultRoles: [
      { name: 'super-admin', description: 'Super administrator' },
      { name: 'admin', description: 'System administrator' },
      { name: 'manager', description: 'Department manager' },
      { name: 'user', description: 'Standard user' },
    ],
    defaultMappers: CLIENT_REALM_MAPPERS,
  },
};

/**
 * Apply blueprint to configuration
 */
export function applyBlueprint(
  config: KeycloakBootstrapConfig & { extends?: string },
  blueprintName?: string
): KeycloakBootstrapConfig {
  const blueprintId = blueprintName || config.extends;

  if (!blueprintId) {
    return config;
  }

  const blueprint = BLUEPRINTS[blueprintId];
  if (!blueprint) {
    throw new Error(`Unknown blueprint: ${blueprintId}. Available: ${Object.keys(BLUEPRINTS).join(', ')}`);
  }

  // Start with base config
  const result: KeycloakBootstrapConfig = {
    keycloak: config.keycloak,
    realm: {
      ...blueprint.realm,
      ...config.realm,
    },
    clients: [...config.clients],
    roles: [...(config.roles || [])],
    protocolMappers: [...(config.protocolMappers || [])],
  };

  // Add blueprint default clients if not already present
  for (const clientTemplate of blueprint.defaultClients) {
    const clientName = `${config.realm.name}-${clientTemplate.replace('-client', '')}`;
    const hasClient = result.clients.some((c) => c.name === clientName);

    if (!hasClient) {
      result.clients.push({
        name: clientName,
        template: clientTemplate as ClientTemplate,
      });
    }
  }

  // Add blueprint default roles if not already present
  if (blueprint.defaultRoles) {
    for (const role of blueprint.defaultRoles) {
      const hasRole = result.roles?.some((r) => r.name === role.name);
      if (!hasRole) {
        result.roles = result.roles || [];
        result.roles.push(role);
      }
    }
  }

  // Add blueprint default mappers if not already present
  if (blueprint.defaultMappers) {
    for (const mapper of blueprint.defaultMappers) {
      const hasMapper = result.protocolMappers?.some((m) => m.name === mapper.name);
      if (!hasMapper) {
        result.protocolMappers = result.protocolMappers || [];
        result.protocolMappers.push(mapper);
      }
    }
  }

  return result;
}

/**
 * Get all available blueprint names
 */
export function getBlueprints(): string[] {
  return Object.keys(BLUEPRINTS);
}

/**
 * Check if a blueprint exists
 */
export function hasBlueprint(name: string): boolean {
  return name in BLUEPRINTS;
}

/**
 * Get blueprint configuration
 */
export function getBlueprint(name: string): BlueprintConfig | undefined {
  return BLUEPRINTS[name];
}
