# 🔐 Multi-Realm + Multi-Tenant Architecture Implementation Plan

## 📋 Executive Summary

This document outlines the implementation of a **platform-grade, multi-realm, multi-tenant SaaS architecture** using Keycloak with:
- **Realm** = Legal/Security boundary
- **Organization** = Business boundary
- **Workspace** = Data boundary
- **Token Claims** = Single source of truth

## 🎯 Architecture Principles

```
┌─────────────────────────────────────────────────────────────────┐
│                         Platform Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   admin/     │  │   people/    │  │    app/      │         │
│  │ (realm-admin)│  │ (client-realms)│ │ (client-realms)│        │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Keycloak Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │realm-admin   │  │realm-acme  │  │realm-globex│         │
│  │platform roles│  │owner/super/  │  │owner/super/  │         │
│  │              │  │manager/cand. │  │manager/cand. │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Each Realm:                                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ Organizations (Business Units)                         │     │
│  │  ├── org-1 (Workspaces: ws-1, ws-2, ws-3)            │     │
│  │  └── org-2 (Workspaces: ws-4, ws-5)                  │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services Layer                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Tenant Context (Token Claims)               │   │
│  │  { realm, organization: {id}, workspace: {id}, roles }  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Database per Workspace (Hard Isolation)          │   │
│  │  workspace_{realm}_{workspaceId}                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Phase 1: Keycloak Bootstrap CLI Enhancement

### 1.1 Add Multi-Realm Support

**File: `core/cli/keycloak-bootstrap/src/config/schema.ts`**

```typescript
// Add realm type enum
export const RealmTypeSchema = z.enum(['platform', 'client']);

// Add organization config
export const OrganizationConfigSchema = z.object({
  id: z.string().min(1, 'Organization ID is required'),
  name: z.string().min(1, 'Organization name is required'),
  enabled: z.boolean().optional(),
  attributes: z.record(z.string()).optional(),
});

// Add workspace config (organization child)
export const WorkspaceConfigSchema = z.object({
  id: z.string().min(1, 'Workspace ID is required'),
  name: z.string().min(1, 'Workspace name is required'),
  organizationId: z.string().min(1, 'Organization ID is required'),
  enabled: z.boolean().optional(),
});

// Update RealmSchema
export const RealmSchema = z.object({
  name: z.string().min(1, 'Realm name is required'),
  displayName: z.string().optional(),
  type: RealmTypeSchema,
  sslRequired: z.enum(['all', 'external', 'none']).optional(),
  security: RealmSecuritySchema.optional(),
  organizations: z.array(OrganizationConfigSchema).optional(),
  workspaces: z.array(WorkspaceConfigSchema).optional(),
});
```

### 1.2 Add Protocol Mappers Configuration

**File: `core/cli/keycloak-bootstrap/src/config/schema.ts`**

```typescript
export const ProtocolMapperConfigSchema = z.object({
  name: z.string().min(1, 'Protocol mapper name is required'),
  protocol: z.literal('openid-connect'),
  protocolMapper: z.string().min(1, 'Protocol mapper is required'),
  config: z.record(z.string()),
  clients: z.array(z.string()).optional(),
});

// Built-in protocol mappers for multi-tenant architecture
export const MULTI_TENANT_MAPPERS = {
  realm: {
    name: 'realm-mapper',
    protocol: 'openid-connect' as const,
    protocolMapper: 'oidc-usermodel-attribute-mapper',
    config: {
      'access.token.claim': 'true',
      'claim.name': 'realm',
      'id.token.claim': 'true',
      'jsonType.label': 'String',
      'user.attribute': 'realm',
      'introspection.token.claim': 'true',
      'userinfo.token.claim': 'true',
      'add.to.id.token': 'true',
    },
  },
  organization: {
    name: 'organization-id-mapper',
    protocol: 'openid-connect' as const,
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
  },
  workspace: {
    name: 'workspace-id-mapper',
    protocol: 'openid-connect' as const,
    protocolMapper: 'oidc-usermodel-attribute-mapper',
    config: {
      'access.token.claim': 'true',
      'claim.name': 'workspace',
      'id.token.claim': 'true',
      'jsonType.label': 'JSON',
      'introspection.token.claim': 'true',
      'userinfo.token.claim': 'true',
    },
  },
  roles: {
    name: 'roles-mapper',
    protocol: 'openid-connect' as const,
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
  },
};
```

### 1.3 Update Blueprints for Platform and Client Realms

**File: `core/cli/keycloak-bootstrap/src/config/blueprints.ts`**

```typescript
export const BLUEPRINTS: Record<string, BlueprintConfig> = {
  'platform': {
    name: 'Platform Realm',
    description: 'Dedicated realm for platform operations',
    realm: {
      type: 'platform',
      sslRequired: 'none',
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
      { name: 'platform-admin', description: 'Platform administrator' },
      { name: 'platform-support', description: 'Platform support staff' },
      { name: 'platform-ops', description: 'Platform operations' },
    ],
    defaultMappers: [MULTI_TENANT_MAPPERS.realm, MULTI_TENANT_MAPPERS.roles],
  },

  'client': {
    name: 'Client Realm',
    description: 'Dedicated realm for B2B clients',
    realm: {
      type: 'client',
      sslRequired: 'none',
      security: {
        loginWithEmailAllowed: true,
        registrationEmailAsUsername: true,
        duplicateEmailsAllowed: false,
        resetPasswordAllowed: true,
        bruteForceProtected: true,
      },
    },
    defaultClients: ['people-client', 'app-client'],
    defaultRoles: [
      { name: 'owner', description: 'B2B client owner' },
      { name: 'supervisor', description: 'B2B operations team' },
      { name: 'manager', description: 'Company manager (org-scoped)' },
      { name: 'member', description: 'End user' },
    ],
    defaultMappers: [
      MULTI_TENANT_MAPPERS.realm,
      MULTI_TENANT_MAPPERS.organization,
      MULTI_TENANT_MAPPERS.workspace,
      MULTI_TENANT_MAPPERS.roles,
    ],
  },
};
```

### 1.4 Add Organization and Workspace Management

**File: `core/cli/keycloak-bootstrap/src/keycloak/organizations.ts`** (NEW)

```typescript
import type { KeycloakConnectionConfig, OrganizationConfig, WorkspaceConfig } from '../types/config.js';

export class KeycloakOrganizationClient {
  private token: string | null = null;

  constructor(private config: KeycloakConnectionConfig) {}

  async authenticate(): Promise<void> {
    const response = await fetch(
      `${this.config.url}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.config.admin.username,
          password: this.config.admin.password,
        }),
      }
    );
    const data = await response.json();
    this.token = data.access_token;
  }

  async createOrganization(realm: string, config: OrganizationConfig): Promise<void> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.id,
          enabled: config.enabled ?? true,
          attributes: config.attributes || {},
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create organization ${config.id}: ${response.status}`);
    }
    console.log(`✅ Created organization "${config.id}"`);
  }

  async createWorkspace(realm: string, config: WorkspaceConfig): Promise<void> {
    // Workspaces are stored as organization attributes
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations/${config.organizationId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributes: {
            [`workspace_${config.id}`]: JSON.stringify({
              name: config.name,
              enabled: config.enabled ?? true,
            }),
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create workspace ${config.id}: ${response.status}`);
    }
    console.log(`✅ Created workspace "${config.id}" in organization "${config.organizationId}"`);
  }
}
```

## 📦 Phase 2: Auth Package Enhancement

### 2.1 Multi-Realm Support

**File: `core/capabilities/auth/src/keycloak/service.ts`**

```typescript
// Add multi-realm configuration support
export interface MultiRealmConfig {
  realms: Record<string, KeycloakConfig>; // realm name -> config
  defaultRealm?: string;
}

export class KeycloakService {
  private config: KeycloakConfig | MultiRealmConfig;
  private realm: string;

  constructor(config?: KeycloakConfig | MultiRealmConfig, realm?: string) {
    if (config && 'realms' in config) {
      // Multi-realm mode
      this.config = config;
      this.realm = realm || config.defaultRealm || '';
      const realmConfig = config.realms[this.realm];
      if (!realmConfig) {
        throw new Error(`Realm "${this.realm}" not found in configuration`);
      }
    } else {
      // Single realm mode (backward compatible)
      this.config = config || {
        url: process.env.KEYCLOAK_URL || '',
        realm: realm || process.env.KEYCLOAK_REALM || '',
      };
      this.realm = realm || process.env.KEYCLOAK_REALM || '';
    }
    // ... rest of constructor
  }

  /**
   * Validate token with realm extraction
   */
  async validateTokenWithRealm(authHeader: string): Promise<TokenValidationResult & { realm?: string }> {
    const result = await this.validateToken(authHeader);
    if (result.valid && result.payload) {
      // Extract realm from token if present
      const realm = result.payload.realm || result.payload.iss?.split('/').pop();
      return { ...result, realm };
    }
    return result;
  }
}
```

### 2.2 Enhanced Tenant Context

**File: `core/capabilities/auth/src/strategies/keycloak.ts`**

```typescript
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

/**
 * Extract full tenant context from JWT payload
 */
export function extractTenantContext(payload: any): TenantContext {
  // Extract realm (from claim or issuer)
  const realm = payload.realm || payload.iss?.split('/').pop();
  if (!realm) {
    throw new Error('No realm found in token');
  }

  // Extract workspace
  const workspace = payload.workspace;
  const workspaceId = workspace?.id || workspace;
  if (!workspaceId) {
    throw new Error('No workspace found in token');
  }

  // Extract organization (optional for members)
  const organization = payload.organization;
  const organizationId = organization?.id || organization;

  // Extract user info
  const userId = payload.sub;
  if (!userId) {
    throw new Error('No user ID found in token');
  }

  const roles = payload.realm_access?.roles || payload.roles || [];

  return {
    realm,
    workspaceId,
    organizationId,
    userId,
    roles,
    email: payload.email,
    userType: payload.user_type,
  };
}

/**
 * Validate tenant context claims
 * Throws if required claims are missing or malformed
 */
export function validateTenantContext(payload: any): TenantContext {
  const context = extractTenantContext(payload);

  // Validate realm format
  if (!context.realm || typeof context.realm !== 'string') {
    throw new Error('Invalid realm claim');
  }

  // Validate workspace format
  if (!context.workspaceId || typeof context.workspaceId !== 'string') {
    throw new Error('Invalid workspace claim');
  }

  // Validate roles
  if (!Array.isArray(context.roles)) {
    throw new Error('Invalid roles claim');
  }

  return context;
}
```

### 2.3 Role Guards

**File: `core/capabilities/auth/src/guards/roles.ts`** (NEW)

```typescript
import type { Context } from 'hono';
import type { TenantContext } from '../strategies/keycloak.js';

export interface RoleGuardOptions {
  /** Allowed roles for this route */
  roles: string[];

  /** Allow cross-workspace access for specific roles */
  multiWorkspaceAccess?: string[];

  /** Require specific organization access */
  requireOrganization?: boolean;
}

/**
 * Role-based access control middleware
 */
export function roleGuard(options: RoleGuardOptions) {
  return async (c: Context, next: () => Promise<void>) => {
    const tenantContext = c.get('tenantContext') as TenantContext | undefined;

    if (!tenantContext) {
      return c.json({ error: 'No tenant context found' }, 401);
    }

    // Check if user has required role
    const hasRole = options.roles.some(role => tenantContext.roles.includes(role));

    if (!hasRole) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Set workspace locked flag
    const canAccessMultipleWorkspaces = options.multiWorkspaceAccess?.some(role =>
      tenantContext.roles.includes(role)
    );

    c.set('multiWorkspaceAccess', canAccessMultipleWorkspaces);

    await next();
  };
}

/**
 * Platform-only guard (realm-admin only)
 */
export function platformGuard(requiredRoles: string[] = ['platform-admin']) {
  return roleGuard({
    roles: requiredRoles,
  });
}

/**
 * Client realm guard
 */
export function clientGuard(requiredRoles: string[] = ['owner', 'supervisor', 'manager']) {
  return roleGuard({
    roles: requiredRoles,
    requireOrganization: true,
    multiWorkspaceAccess: ['owner', 'supervisor'],
  });
}

/**
 * Member guard (hard workspace lock)
 */
export function memberGuard() {
  return roleGuard({
    roles: ['member'],
  });
}
```

## 📦 Phase 3: Tenant Database Isolation

### 3.1 Tenant Database Manager

**File: `core/capabilities/database/src/tenant-manager.ts`** (NEW)

```typescript
import type { TenantContext } from '@oxlayer/capabilities-auth';

export interface TenantDatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  sslMode?: 'disable' | 'require' | 'verify-ca' | 'verify-full';
}

/**
 * Tenant-aware database connection manager
 * Enforces hard isolation per workspace
 */
export class TenantDatabaseManager {
  private config: TenantDatabaseConfig;
  private connectionCache: Map<string, any> = new Map();

  constructor(config: TenantDatabaseConfig) {
    this.config = config;
  }

  /**
   * Get database name for tenant
   * Format: workspace_{realm}_{workspaceId}
   */
  getDatabaseName(tenant: TenantContext): string {
    return `workspace_${tenant.realm}_${tenant.workspaceId}`;
  }

  /**
   * Connect to tenant database
   * Throws if tenant context is invalid
   */
  async connectTenantDatabase(tenant: TenantContext): Promise<any> {
    // Validate tenant context
    if (!tenant.realm || !tenant.workspaceId) {
      throw new Error('Invalid tenant context: missing realm or workspace');
    }

    const dbName = this.getDatabaseName(tenant);

    // Check cache
    if (this.connectionCache.has(dbName)) {
      return this.connectionCache.get(dbName);
    }

    // Create new connection
    const connection = this.createConnection({
      ...this.config,
      database: dbName,
    });

    this.connectionCache.set(dbName, connection);
    return connection;
  }

  /**
   * Create tenant database (for provisioning)
   */
  async provisionTenantDatabase(tenant: TenantContext): Promise<void> {
    const dbName = this.getDatabaseName(tenant);

    // Create database if not exists
    await this.createDatabase(dbName);

    // Run migrations
    await this.runMigrations(dbName);
  }

  /**
   * Drop tenant database (for deprovisioning)
   */
  async deprovisionTenantDatabase(tenant: TenantContext): Promise<void> {
    const dbName = this.getDatabaseName(tenant);

    // Drop database
    await this.dropDatabase(dbName);

    // Clear cache
    this.connectionCache.delete(dbName);
  }
}
```

### 3.2 Middleware Integration

**File: `core/capabilities/database/src/middleware/tenant.ts`** (NEW)

```typescript
import type { Context } from 'hono';
import { TenantDatabaseManager } from '../tenant-manager.js';
import type { TenantContext } from '@oxlayer/capabilities-auth';

/**
 * Tenant database middleware
 * Injects tenant database connection into context
 */
export function tenantDatabaseMiddleware(dbManager: TenantDatabaseManager) {
  return async (c: Context, next: () => Promise<void>) => {
    const tenantContext = c.get('tenantContext') as TenantContext | undefined;

    if (!tenantContext) {
      return c.json({ error: 'No tenant context found' }, 401);
    }

    // Connect to tenant database
    const db = await dbManager.connectTenantDatabase(tenantContext);

    // Set database in context
    c.set('tenantDb', db);
    c.set('database', db);

    await next();
  };
}

/**
 * Repository factory that uses tenant database
 */
export function createTenantRepository<T>(
  tableName: string,
  schema: any
) {
  return (c: Context) => {
    const db = c.get('tenantDb') as any;

    if (!db) {
      throw new Error('No tenant database connection found');
    }

    return {
      find: (where: any) => db(tableName).where(where),
      findOne: (where: any) => db(tableName).where(where).first(),
      create: (data: any) => db(tableName).insert(data),
      update: (where: any, data: any) => db(tableName).where(where).update(data),
      delete: (where: any) => db(tableName).where(where).delete(),
    };
  };
}
```

## 📦 Phase 4: Implementation Roadmap

### Week 1-2: Keycloak Bootstrap Enhancement
- [ ] Update schema for platform/client realm types
- [ ] Add organization and workspace config schemas
- [ ] Add multi-tenant protocol mappers
- [ ] Update blueprints (platform, client)
- [ ] Add organization/workspace management CLI
- [ ] Build and test bootstrap with sample config

### Week 3-4: Auth Package Enhancement
- [ ] Add multi-realm support to KeycloakService
- [ ] Enhance TenantContext with realm/workspace
- [ ] Add tenant context validation
- [ ] Create role guards (platform, client, member)
- [ ] Update middleware for multi-realm
- [ ] Write tests for auth flows

### Week 5-6: Database Isolation
- [ ] Create TenantDatabaseManager
- [ ] Implement database naming: `workspace_{realm}_{workspaceId}`
- [ ] Create tenant database middleware
- [ ] Create repository factory pattern
- [ ] Implement provisioning/deprovisioning
- [ ] Write tests for tenant isolation

### Week 7-8: App Integration
- [ ] Update admin/ app for platform realm
- [ ] Update people/ app for client realms
- [ ] Update app/ for member portal
- [ ] Add role-based routing
- [ ] Add workspace locking
- [ ] End-to-end testing

## 🔒 Security Checklist

- [ ] No cross-realm authentication
- [ ] No cross-workspace queries
- [ ] Hard database isolation per workspace
- [ ] All tenant context from token claims
- [ ] No tenant resolution by email/subdomain/headers
- [ ] Role guards on all endpoints
- [ ] Audit logging for all tenant operations

## 📊 Testing Strategy

### Unit Tests
- [ ] Protocol mapper configuration
- [ ] Tenant context extraction
- [ ] Role guard logic
- [ ] Database naming

### Integration Tests
- [ ] Multi-realm authentication
- [ ] Organization/workspace provisioning
- [ ] Tenant database connection
- [ ] Role-based access control

### E2E Tests
- [ ] Platform admin provisioning client realm
- [ ] Owner creating organization/workspace
- [ ] Manager accessing workspace data
- [ ] Member accessing own workspace only
