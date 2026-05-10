/**
 * Configuration types for Keycloak bootstrap
 */

/**
 * Realm type enum
 * - platform: Dedicated realm for platform operations (admin/, support)
 * - client: Dedicated realm for B2B clients (people/, app/)
 */
export type RealmType = 'platform' | 'client';

/**
 * Keycloak connection configuration
 */
export interface KeycloakConnectionConfig {
  url: string;
  admin: {
    username: string;
    password: string;
  };
}

/**
 * Realm security configuration
 */
export interface RealmSecurityConfig {
  loginWithEmailAllowed?: boolean;
  registrationEmailAsUsername?: boolean;
  duplicateEmailsAllowed?: boolean;
  resetPasswordAllowed?: boolean;
  editUsernameAllowed?: boolean;
  bruteForceProtected?: boolean;
  permanentLockout?: boolean;
  maxFailureWaitSeconds?: number;
  minimumQuickLoginWaitSeconds?: number;
  waitIncrementSeconds?: number;
  quickLoginCheckMilliSeconds?: number;
  maxDeltaTimeSeconds?: number;
  failureFactor?: number;
}

/**
 * Organization configuration
 * Organizations represent business units within a realm
 */
export interface OrganizationConfig {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  attributes?: Record<string, string>;
}

/**
 * Workspace configuration
 * Workspaces represent data boundaries (1:1 with Organization)
 */
export interface WorkspaceConfig {
  id: string;
  name: string;
  organizationId: string;
  description?: string;
  enabled?: boolean;
  attributes?: Record<string, string>;
}

/**
 * Realm configuration
 */
export interface RealmConfig {
  name: string;
  displayName?: string;
  type: RealmType;
  sslRequired?: 'all' | 'external' | 'none';
  security?: RealmSecurityConfig;
  organizationsEnabled?: boolean;
  organizations?: OrganizationConfig[];
  workspaces?: WorkspaceConfig[];
  /**
   * Token + session lifespan settings (all in seconds). When omitted,
   * Keycloak's defaults apply (5min/30min/10h) — defaults are
   * aggressive for SPA UX (operator gets logged out / redirected to
   * Keycloak every 30min idle). Production realms should set these
   * explicitly to a workday-friendly cadence (e.g. 900/28800/43200 =
   * 15min token / 8h idle / 12h max).
   */
  tokens?: RealmTokenConfig;
}

/**
 * Token + session lifespans (all seconds). Maps directly to Keycloak's
 * realm-level fields of the same name. Fields are optional — omitting
 * leaves the corresponding Keycloak default in place.
 */
export interface RealmTokenConfig {
  /** Access token TTL. Default 300 (5min). */
  accessTokenLifespan?: number;
  /** SSO session idle timeout — refresh-token lifetime under inactivity. Default 1800 (30min). */
  ssoSessionIdleTimeout?: number;
  /** SSO session max lifespan — absolute cap before forced re-login. Default 36000 (10h). */
  ssoSessionMaxLifespan?: number;
}

/**
 * Client override configuration
 */
export interface ClientOverrides {
  description?: string;
  publicClient?: boolean;
  standardFlowEnabled?: boolean;
  directAccessGrantsEnabled?: boolean;
  redirectUris?: string[];
  webOrigins?: string[];
  validPostLogoutRedirectUris?: string[];
  clientSecret?: string;
  attributes?: Record<string, string>;
}

/**
 * Client configuration
 */
export interface ClientConfig {
  name: string;
  template?: ClientTemplate;
  overrides?: ClientOverrides;
}

/**
 * Client template types
 */
export type ClientTemplate = 'api-client' | 'web-client' | 'mobile-client' | 'admin-client' | 'app-client';

/**
 * Resolved client configuration (after template application)
 */
export interface ResolvedClientConfig {
  clientId: string;
  name: string;
  description?: string;
  enabled: boolean;
  publicClient: boolean;
  standardFlowEnabled: boolean;
  directAccessGrantsEnabled: boolean;
  redirectUris: string[];
  webOrigins: string[];
  validPostLogoutRedirectUris?: string[];
  protocol: string;
  attributes?: Record<string, string>;
}

/**
 * Role configuration
 */
export interface RoleConfig {
  name: string;
  description?: string;
  clients?: string[];
}

/**
 * Protocol mapper configuration
 */
export interface ProtocolMapperConfig {
  name: string;
  protocol: 'openid-connect';
  protocolMapper: string;
  config: Record<string, string>;
  clients?: string[];
}

/**
 * Main bootstrap configuration
 */
export interface KeycloakBootstrapConfig {
  keycloak: KeycloakConnectionConfig;
  realm: RealmConfig;
  clients: ClientConfig[];
  roles?: RoleConfig[];
  protocolMappers?: ProtocolMapperConfig[];
}

/**
 * Blueprint configuration
 */
export interface BlueprintConfig {
  name: string;
  description?: string;
  realm: Partial<RealmConfig>;
  defaultClients: ClientTemplate[];
  defaultRoles?: RoleConfig[];
  defaultMappers?: ProtocolMapperConfig[];
}

/**
 * Configuration with blueprint extension
 */
export interface KeycloakBootstrapConfigWithBlueprint extends KeycloakBootstrapConfig {
  extends?: string;
}
