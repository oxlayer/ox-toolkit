/**
 * Client templates for convention-based configuration
 */

import type {
  ClientConfig,
  ClientOverrides,
  ClientTemplate,
  ResolvedClientConfig,
} from '../types/config.js';

/**
 * Default client templates
 */
export const CLIENT_TEMPLATES: Record<ClientTemplate, Partial<ResolvedClientConfig>> = {
  'api-client': {
    description: 'Backend API client (confidential)',
    enabled: true,
    publicClient: false,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: false,
    redirectUris: [],
    webOrigins: [],
    protocol: 'openid-connect',
    attributes: {
      'access.token.lifespan': '60',
    },
  },

  'web-client': {
    description: 'Web application client for people/ operations (public)',
    enabled: true,
    publicClient: true,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: true,
    redirectUris: [],
    webOrigins: [],
    protocol: 'openid-connect',
    attributes: {
      'pkce.code.challenge.method': 'S256',
    },
  },

  'app-client': {
    description: 'End-user app client (public)',
    enabled: true,
    publicClient: true,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: false,
    redirectUris: [],
    webOrigins: [],
    protocol: 'openid-connect',
    attributes: {
      'pkce.code.challenge.method': 'S256',
    },
  },

  'mobile-client': {
    description: 'Mobile application client (public)',
    enabled: true,
    publicClient: true,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: true,
    redirectUris: ['myapp://callback*', 'myapp://*'],
    webOrigins: [],
    protocol: 'openid-connect',
    attributes: {
      'pkce.code.challenge.method': 'S256',
    },
  },

  'admin-client': {
    description: 'Admin panel client (public)',
    enabled: true,
    publicClient: true,
    standardFlowEnabled: true,
    directAccessGrantsEnabled: true,
    redirectUris: [],
    webOrigins: [],
    protocol: 'openid-connect',
    attributes: {
      'pkce.code.challenge.method': 'S256',
    },
  },
};

/**
 * Deep merge objects
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>
          );
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Resolve client configuration from template and overrides
 */
export function resolveClientConfig(config: ClientConfig): ResolvedClientConfig {
  const base: Partial<ResolvedClientConfig> = config.template
    ? CLIENT_TEMPLATES[config.template]
    : {
        description: '',
        enabled: true,
        publicClient: false,
        standardFlowEnabled: true,
        directAccessGrantsEnabled: true,
        redirectUris: [],
        webOrigins: [],
        protocol: 'openid-connect',
      };

  const merged = deepMerge(base, (config.overrides || {}) as Record<string, unknown>);

  return {
    clientId: config.name,
    name: config.name,
    ...merged,
  } as ResolvedClientConfig;
}

/**
 * Get all available template names
 */
export function getClientTemplates(): ClientTemplate[] {
  return Object.keys(CLIENT_TEMPLATES) as ClientTemplate[];
}

/**
 * Check if a template exists
 */
export function hasClientTemplate(template: string): template is ClientTemplate {
  return template in CLIENT_TEMPLATES;
}
