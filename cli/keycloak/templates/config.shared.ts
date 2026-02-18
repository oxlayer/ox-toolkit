/**
 * Example: Shared Realm (B2C SaaS) Configuration
 *
 * This demonstrates a shared realm setup for a B2C SaaS application
 * using Keycloak Organizations for multi-tenancy.
 *
 * Usage:
 *   npx @oxlayer/cli-keycloak --config config.shared.ts
 */

import { defineConfig } from '@oxlayer/cli-keycloak/templates';

export default defineConfig({
  keycloak: {
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    admin: {
      username: process.env.KEYCLOAK_ADMIN || 'admin',
      password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
    },
  },

  realm: {
    name: 'my-saas',
    displayName: 'My SaaS Platform',
    type: 'shared',
  },

  clients: [
    // API client
    {
      name: 'my-saas-api',
      template: 'api-client',
      overrides: {
        description: 'My SaaS Backend API',
      },
    },

    // Web client
    {
      name: 'my-saas-web',
      template: 'web-client',
      overrides: {
        description: 'My SaaS Web Application',
        redirectUris: [
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/*`,
        ],
        webOrigins: [
          process.env.FRONTEND_URL || 'http://localhost:3000',
        ],
        validPostLogoutRedirectUris: [
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`,
        ],
      },
    },
  ],

  roles: [
    {
      name: 'user',
      description: 'Standard SaaS user',
    },
    {
      name: 'premium',
      description: 'Premium subscriber with additional features',
    },
    {
      name: 'admin',
      description: 'SaaS application administrator',
    },
  ],

  protocolMappers: [
    // Organization ID mapper for Keycloak Organizations
    {
      name: 'organization-id-mapper',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      config: {
        'introspection.token.claim': 'true',
        'multivalued': 'true',
        'userinfo.token.claim': 'true',
        'addOrganizationId': 'true',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'organization',
        'jsonType.label': 'JSON',
      },
      clients: ['my-saas-api', 'my-saas-web'],
    },
  ],
});
