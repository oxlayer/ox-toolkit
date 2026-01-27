/**
 * Example: Enterprise (Dedicated Realm) Configuration
 *
 * This demonstrates a dedicated realm setup for an enterprise customer
 * with isolated identity, custom security settings, and multiple client types.
 *
 * Usage:
 *   npx @oxlayer/cli-keycloak-bootstrap --config config.dedicated.ts
 */

import { defineConfig } from '@oxlayer/cli-keycloak-bootstrap/templates';

export default defineConfig({
  extends: 'enterprise', // Use enterprise blueprint

  keycloak: {
    url: process.env.KEYCLOAK_URL || 'https://auth.acme.com',
    admin: {
      username: process.env.KEYCLOAK_ADMIN,
      password: process.env.KEYCLOAK_ADMIN_PASSWORD,
    },
  },

  realm: {
    name: 'enterprise-acme',
    displayName: 'ACME Corporation',
    type: 'dedicated',
  },

  clients: [
    // API client with custom token lifespan
    {
      name: 'acme-api',
      template: 'api-client',
      overrides: {
        description: 'ACME Corporation API',
        attributes: {
          'access.token.lifespan': '300', // 5 minutes for enterprise
        },
      },
    },

    // Admin portal
    {
      name: 'acme-admin',
      template: 'admin-client',
      overrides: {
        description: 'ACME Administration Portal',
        redirectUris: [
          `${process.env.ADMIN_URL || 'https://admin.acme.com'}/*`,
        ],
        webOrigins: [process.env.ADMIN_URL || 'https://admin.acme.com'],
        validPostLogoutRedirectUris: [
          `${process.env.ADMIN_URL || 'https://admin.acme.com'}/`,
        ],
      },
    },

    // Employee portal
    {
      name: 'acme-employee',
      template: 'web-client',
      overrides: {
        description: 'ACME Employee Portal',
        redirectUris: [
          `${process.env.EMPLOYEE_URL || 'https://employees.acme.com'}/*`,
        ],
        webOrigins: [process.env.EMPLOYEE_URL || 'https://employees.acme.com'],
        validPostLogoutRedirectUris: [
          `${process.env.EMPLOYEE_URL || 'https://employees.acme.com'}/`,
        ],
      },
    },

    // Mobile app
    {
      name: 'acme-mobile',
      template: 'mobile-client',
      overrides: {
        description: 'ACME Mobile Application',
        redirectUris: [
          'acmeapp://callback*',
          'acmeapp://*',
        ],
      },
    },
  ],

  roles: [
    {
      name: 'super-admin',
      description: 'ACME Super Administrator - Full access',
    },
    {
      name: 'department-admin',
      description: 'Department Administrator',
    },
    {
      name: 'manager',
      description: 'Department Manager',
    },
    {
      name: 'employee',
      description: 'Standard Employee',
    },
  ],

  protocolMappers: [
    // Tenant ID mapper for multi-database isolation
    {
      name: 'tenant-id-mapper',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      config: {
        'introspection.token.claim': 'true',
        'userinfo.token.claim': 'true',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'tenant_id',
        'jsonType.label': 'String',
      },
      clients: ['acme-api', 'acme-admin', 'acme-employee', 'acme-mobile'],
    },

    // Department mapper for role-based access
    {
      name: 'department-mapper',
      protocol: 'openid-connect',
      protocolMapper: 'oidc-usermodel-attribute-mapper',
      config: {
        'introspection.token.claim': 'true',
        'userinfo.token.claim': 'true',
        'id.token.claim': 'true',
        'access.token.claim': 'true',
        'claim.name': 'department',
        'jsonType.label': 'String',
      },
      clients: ['acme-api', 'acme-admin', 'acme-employee'],
    },
  ],
});
