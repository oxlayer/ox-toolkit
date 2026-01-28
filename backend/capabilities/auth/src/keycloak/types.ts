export interface TokenValidationResult {
  valid: boolean;
  payload?: any;
  error?: string;
  /** Realm extracted from token (multi-realm support) */
  realm?: string;
}

/**
 * Single realm configuration
 */
export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId?: string;
  /**
   * Skip client validation (aud/azp checks).
   * When true, validates by realm only - accepts tokens from any client in the same realm.
   * Recommended for resource servers that serve multiple frontend clients.
   *
   * @default false
   */
  skipClientValidation?: boolean;
}

/**
 * Multi-realm configuration
 * Maps realm name to its configuration
 */
export interface MultiRealmConfig {
  realms: Record<string, KeycloakConfig>;
  defaultRealm?: string;
}

/**
 * Union type for single or multi-realm configuration
 */
export type KeycloakConfigUnion = KeycloakConfig | MultiRealmConfig;

export interface KeycloakAuthenticatedUser {
  user_id: string;
  user_email: string;
  organization_id: string | null;
  roles: string[];
  is_admin: boolean;
}

/**
 * Enhanced tenant context with multi-realm and workspace support
 */
export interface TenantContext {
  /** Realm identifier (legal/security boundary) */
  realm: string;

  /** Workspace identifier (data boundary) */
  workspaceId: string;

  /** Organization identifier (business boundary) */
  organizationId?: string;

  /** User identifier */
  userId: string;

  /** User roles */
  roles: string[];

  /** User email */
  email?: string;

  /** User type (member/staff) */
  userType?: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    keycloakUser: KeycloakAuthenticatedUser;
    keycloakPayload: any;
    organizationId: string | null;
    authType: 'keycloak';
    userId: string;
    userEmail: string;
    userRoles: string[];
    userType: 'member' | 'staff' | null;
    /** Enhanced tenant context (multi-realm) */
    tenantContext?: TenantContext;
    /** Convenient access to tenant ID */
    tenantId?: string;
    /** Realm identifier */
    realm?: string;
    /** Workspace identifier */
    workspaceId?: string;
  }
}
