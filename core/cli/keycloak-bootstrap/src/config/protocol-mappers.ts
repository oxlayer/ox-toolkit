/**
 * Built-in protocol mappers for multi-tenant architecture
 *
 * These mappers add required claims to JWT tokens for tenant resolution:
 * - realm: Legal/security boundary
 * - organization: Business boundary
 * - workspace: Data boundary
 * - roles: User roles
 */

import type { ProtocolMapperConfig } from '../types/config.js';

/**
 * Realm claim mapper
 * Adds the realm identifier to tokens
 *
 * Claim format:
 * { "realm": "realm-name" }
 */
export const REALM_MAPPER: ProtocolMapperConfig = {
  name: 'realm-mapper',
  protocol: 'openid-connect',
  protocolMapper: 'oidc-usermodel-attribute-mapper',
  config: {
    'access.token.claim': 'true',
    'claim.name': 'realm',
    'id.token.claim': 'true',
    'jsonType.label': 'String',
    'user.attribute': 'realm',
    'introspection.token.claim': 'true',
    'userinfo.token.claim': 'true',
  },
};

/**
 * Organization claim mapper
 * Adds organization information to tokens
 *
 * Claim format:
 * { "organization": { "id": "acme-corp" } }
 */
export const ORGANIZATION_MAPPER: ProtocolMapperConfig = {
  name: 'organization-id-mapper',
  protocol: 'openid-connect',
  protocolMapper: 'oidc-usermodel-attribute-mapper',
  config: {
    'access.token.claim': 'true',
    'claim.name': 'organization',
    'id.token.claim': 'true',
    'jsonType.label': 'JSON',
    'introspection.token.claim': 'true',
    'userinfo.token.claim': 'true',
    'multivalued': 'true',
  },
};

/**
 * Workspace claim mapper
 * Adds workspace information to tokens
 *
 * Claim format:
 * { "workspace": { "id": "acme-corp" } }
 */
export const WORKSPACE_MAPPER: ProtocolMapperConfig = {
  name: 'workspace-id-mapper',
  protocol: 'openid-connect',
  protocolMapper: 'oidc-usermodel-attribute-mapper',
  config: {
    'access.token.claim': 'true',
    'claim.name': 'workspace',
    'id.token.claim': 'true',
    'jsonType.label': 'JSON',
    'introspection.token.claim': 'true',
    'userinfo.token.claim': 'true',
  },
};

/**
 * Roles claim mapper
 * Adds user roles to tokens
 *
 * Claim format:
 * { "roles": ["manager", "supervisor"] }
 */
export const ROLES_MAPPER: ProtocolMapperConfig = {
  name: 'roles-mapper',
  protocol: 'openid-connect',
  protocolMapper: 'oidc-usermodel-realm-role-mapper',
  config: {
    'access.token.claim': 'true',
    'claim.name': 'roles',
    'id.token.claim': 'true',
    'jsonType.label': 'String',
    'introspection.token.claim': 'true',
    'userinfo.token.claim': 'true',
    'multivalued': 'true',
  },
};

/**
 * All multi-tenant protocol mappers
 * Used for client realms that need full tenant context
 */
export const MULTI_TENANT_MAPPERS: Record<string, ProtocolMapperConfig> = {
  realm: REALM_MAPPER,
  organization: ORGANIZATION_MAPPER,
  workspace: WORKSPACE_MAPPER,
  roles: ROLES_MAPPER,
};

/**
 * Platform realm protocol mappers
 * Platform realms only need realm and roles (no organizations/workspaces)
 */
export const PLATFORM_REALM_MAPPERS: ProtocolMapperConfig[] = [
  REALM_MAPPER,
  ROLES_MAPPER,
];

/**
 * Client realm protocol mappers
 * Client realms need full tenant context
 */
export const CLIENT_REALM_MAPPERS: ProtocolMapperConfig[] = [
  REALM_MAPPER,
  ORGANIZATION_MAPPER,
  WORKSPACE_MAPPER,
  ROLES_MAPPER,
];
