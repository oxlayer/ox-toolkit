/**
 * Zod validation schemas for configuration
 */

import { z } from 'zod';
import type { KeycloakBootstrapConfig, KeycloakBootstrapConfigWithBlueprint } from '../types/config.js';

/**
 * Realm type enum
 * - platform: Dedicated realm for platform operations (admin/, support)
 * - client: Dedicated realm for B2B clients (people/, app/)
 */
export const RealmTypeSchema = z.enum(['platform', 'client']);

/**
 * Keycloak connection schema
 */
const KeycloakConnectionSchema = z.object({
  url: z.string().url('KEYCLOAK_URL must be a valid URL'),
  admin: z.object({
    username: z.string().min(1, 'KEYCLOAK_ADMIN username is required'),
    password: z.string().min(1, 'KEYCLOAK_ADMIN_PASSWORD is required'),
  }),
});

/**
 * Realm security schema
 */
const RealmSecuritySchema = z.object({
  loginWithEmailAllowed: z.boolean().optional(),
  registrationEmailAsUsername: z.boolean().optional(),
  duplicateEmailsAllowed: z.boolean().optional(),
  resetPasswordAllowed: z.boolean().optional(),
  editUsernameAllowed: z.boolean().optional(),
  bruteForceProtected: z.boolean().optional(),
  permanentLockout: z.boolean().optional(),
  maxFailureWaitSeconds: z.number().int().positive().optional(),
  minimumQuickLoginWaitSeconds: z.number().int().positive().optional(),
  waitIncrementSeconds: z.number().int().positive().optional(),
  quickLoginCheckMilliSeconds: z.number().int().positive().optional(),
  maxDeltaTimeSeconds: z.number().int().positive().optional(),
  failureFactor: z.number().int().positive().optional(),
});

/**
 * Organization configuration schema
 * Organizations represent business units within a realm
 */
export const OrganizationConfigSchema = z.object({
  id: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Organization name is required'),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  attributes: z.record(z.string()).optional(),
});

/**
 * Workspace configuration schema
 * Workspaces represent data boundaries (1:1 with Organization)
 */
export const WorkspaceConfigSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Workspace name is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  attributes: z.record(z.string()).optional(),
});

/**
 * Realm schema
 */
const RealmSchema = z.object({
  name: z.string().min(1, 'Realm name is required'),
  displayName: z.string().optional(),
  type: RealmTypeSchema,
  sslRequired: z.enum(['all', 'external', 'none']).optional(),
  security: RealmSecuritySchema.optional(),
  organizations: z.array(OrganizationConfigSchema).optional(),
  workspaces: z.array(WorkspaceConfigSchema).optional(),
});

/**
 * Client template schema
 */
const ClientTemplateSchema = z.enum(['api-client', 'web-client', 'mobile-client', 'admin-client', 'app-client']);

/**
 * Client overrides schema
 */
const ClientOverridesSchema = z.object({
  description: z.string().optional(),
  publicClient: z.boolean().optional(),
  standardFlowEnabled: z.boolean().optional(),
  directAccessGrantsEnabled: z.boolean().optional(),
  redirectUris: z.array(z.string()).optional(),
  webOrigins: z.array(z.string()).optional(),
  validPostLogoutRedirectUris: z.array(z.string()).optional(),
  clientSecret: z.string().optional(),
  attributes: z.record(z.string()).optional(),
});

/**
 * Client schema
 */
const ClientSchema = z.object({
  name: z.string().min(1, 'Client name is required'),
  template: ClientTemplateSchema.optional(),
  overrides: ClientOverridesSchema.optional(),
});

/**
 * Role schema
 */
const RoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  description: z.string().optional(),
  clients: z.array(z.string()).optional(),
});

/**
 * Protocol mapper schema
 */
const ProtocolMapperSchema = z.object({
  name: z.string().min(1, 'Protocol mapper name is required'),
  protocol: z.literal('openid-connect'),
  protocolMapper: z.string().min(1, 'Protocol mapper is required'),
  config: z.record(z.string()),
  clients: z.array(z.string()).optional(),
});

/**
 * Main configuration schema
 */
export const KeycloakBootstrapConfigSchema = z.object({
  keycloak: KeycloakConnectionSchema,
  realm: RealmSchema,
  clients: z.array(ClientSchema).min(1, 'At least one client is required'),
  roles: z.array(RoleSchema).optional(),
  protocolMappers: z.array(ProtocolMapperSchema).optional(),
});

/**
 * Configuration with blueprint extension schema
 */
export const KeycloakBootstrapConfigWithBlueprintSchema = KeycloakBootstrapConfigSchema.extend({
  extends: z.string().optional(),
});

/**
 * Validate configuration
 */
export function validateConfig(config: unknown): KeycloakBootstrapConfig {
  return KeycloakBootstrapConfigSchema.parse(config);
}

/**
 * Validate configuration with blueprint
 */
export function validateConfigWithBlueprint(config: unknown): KeycloakBootstrapConfigWithBlueprint {
  return KeycloakBootstrapConfigWithBlueprintSchema.parse(config);
}

/**
 * Safe validation (returns result instead of throwing)
 */
export function safeValidateConfig(config: unknown) {
  return KeycloakBootstrapConfigSchema.safeParse(config);
}

/**
 * Safe validation with blueprint
 */
export function safeValidateConfigWithBlueprint(config: unknown) {
  return KeycloakBootstrapConfigWithBlueprintSchema.safeParse(config);
}
