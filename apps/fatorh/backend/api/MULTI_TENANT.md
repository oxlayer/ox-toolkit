# Multi-Tenant Architecture - Keycloak Integration

This guide demonstrates how to use the Keycloak-based multi-tenant architecture in the FatorH API.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Keycloak Multi-Tenant                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐    │
│  │   Keycloak  │────▶│    Auth      │────▶│   Tenant        │    │
│  │   JWT Token │     │   Middleware  │     │   Context       │    │
│  └─────────────┘     └──────────────┘     │  (AsyncLocal)   │    │
│                                             └─────────────────┘    │
│                                                     │              │
│                                                     ▼              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Tenant Context Claims                           │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │  • realm           = "realm-client"       (legal/security)  │  │
│  │  • workspace.id    = "acme-corp"           (data boundary)    │  │
│  │  • organization.id  = "acme-corp"           (business)        │  │
│  │  • roles           = ["manager", "admin"]   (permissions)    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                     │              │
│                                                     ▼              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Database Resolver                               │  │
│  ├─────────────────────────────────────────────────────────────┤  │
│  │  Database Name: workspace_{realm}_{workspaceId}             │  │
│  │  Example: workspace_realm-client_acme-corp                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Configuration

### 1. Keycloak Auth Middleware ([keycloak.config.ts](src/config/keycloak.config.ts))

```typescript
export const authOptions: AuthMiddlewareOptions = {
  enableKeycloak: ENV.KEYCLOAK_ENABLED,
  keycloak: ENV.KEYCLOAK_SERVER_URL ? {
    url: ENV.KEYCLOAK_SERVER_URL,
    realm: ENV.KEYCLOAK_REALM || 'globex',
    clientId: ENV.KEYCLOAK_CLIENT_ID || 'globex-api',
  } : undefined,
  // Enable tenant context extraction from Keycloak JWT
  enableTenancy: true,
  // ... other options
};
```

### 2. Tenant Context Propagation ([app.ts](src/app.ts))

```typescript
import { tenantContextPropagationMiddleware } from './config/keycloak.config.js';

// API routes with authentication
const api = new Hono();

api.use('*', getAuthMiddleware());           // Auth + JWT validation
api.use('*', extractUserIdMiddleware);      // Extract userId
api.use('*', tenantContextPropagationMiddleware()); // Propagate tenant context
```

## Usage Examples

### Example 1: Accessing Tenant Context

```typescript
import { getKeycloakContext } from '@oxlayer/pro-tenancy';

export async function myHandler(c: Context) {
  // Get tenant context from AsyncLocalStorage (set by auth middleware)
  const context = getKeycloakContext();

  if (!context) {
    return c.json({ error: 'No tenant context' }, 401);
  }

  console.log('Realm:', context.realm);
  console.log('Workspace:', context.workspaceId);
  console.log('Organization:', context.organizationId);
  console.log('User:', context.userId);
  console.log('Roles:', context.roles);

  return c.json({
    tenant: {
      realm: context.realm,
      workspace: context.workspaceId,
      organization: context.organizationId,
    },
    user: {
      id: context.userId,
      roles: context.roles,
    },
  });
}
```

### Example 2: Resolving Tenant-Specific Database

```typescript
import { getTenantDatabase } from './config/database-resolver.config.js';
import { db } from './db/schema.js';

export async function getUsersHandler(c: Context) {
  // Automatically resolves the correct database based on JWT claims
  const tenantDb = await getTenantDatabase();

  // Query runs in workspace_{realm}_{workspaceId}
  const users = await tenantDb.select().from(usersTable);

  return c.json({ users });
}
```

### Example 3: Using Role Guards

```typescript
import { clientGuard, platformGuard, candidateGuard } from '@oxlayer/capabilities-auth';

// Platform-only routes (platform-admin, platform-support, platform-ops)
app.use('/api/platform/*', platformGuard());

// Client realm routes (owner, supervisor, manager)
app.use('/api/people/*', clientGuard());

// Candidate routes (hard workspace lock)
app.use('/api/app/*', candidateGuard());
```

### Example 4: Workspace Isolation Enforcement

```typescript
import { workspaceGuard } from '@oxlayer/capabilities-auth';

// Ensure users can only access their assigned workspace
app.use('/api/workspace-data/*', workspaceGuard());

// For candidates: strict workspace isolation (cannot access other workspaces)
// For owners/supervisors: multi-workspace access allowed
// For managers: organization-scoped access
```

## Database Naming Convention

Each workspace gets its own PostgreSQL database:

```
workspace_{realm}_{workspaceId}
```

Examples:
- Platform realm: `workspace_platform_main`
- Client realm - Acme: `workspace_realm-acme_main`
- Client realm - AcmeCorp: `workspace_realm-acme-corp_acme-corp`

## JWT Token Structure

Keycloak JWT tokens include the following claims for tenant resolution:

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "realm": "realm-acme",
  "workspace": {
    "id": "acme-corp",
    "organizationId": "acme-corp"
  },
  "organization": {
    "id": "acme-corp"
  },
  "realm_access": {
    "roles": ["manager", "editor"]
  },
  "user_type": "internal"
}
```

## Testing with Anonymous Tokens

For development, you can generate anonymous tokens with tenant claims:

```bash
curl -X POST http://localhost:3000/auth/token/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "metadata": {
      "realm": "realm-test",
      "workspace": { "id": "test-workspace" },
      "organization": { "id": "test-org" },
      "roles": ["manager"]
    }
  }'
```

## Migration to Multi-Tenant

### Step 1: Enable Tenancy in Keycloak

1. Add protocol mappers to your Keycloak client:
   - `realm` - Realm name
   - `workspace` - Workspace object with `id` field
   - `organization` - Organization object with `id` field
   - `roles` - User roles array

2. Update client roles to include:
   - Platform: `platform-admin`, `platform-support`, `platform-ops`
   - Client: `owner`, `supervisor`, `manager`
   - Candidate: `candidate`

### Step 2: Update Environment Variables

```bash
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=https://keycloak.example.com
KEYCLOAK_REALM=realm-client
KEYCLOAK_CLIENT_ID=globex-api
```

### Step 3: Create Workspace Databases

```sql
-- Create database for each workspace
CREATE DATABASE workspace_realm_client_acme;
CREATE DATABASE workspace_realm_client_acme-corp;
```

### Step 4: Run Migrations per Workspace

```bash
# Run migrations for each workspace database
for db in workspace_realm_*; do
  psql $db -a -f migrations/0001_schema.sql
done
```

## Troubleshooting

### No Tenant Context Error

```
Error: Tenant context not set
```

**Cause**: JWT token is missing tenant claims (realm, workspace, organization)

**Solution**:
1. Ensure Keycloak protocol mappers are configured
2. Check that `enableTenancy: true` is set in auth options
3. Verify JWT token contains required claims

### Database Connection Failed

```
Error: database "workspace_realm_x_y" does not exist
```

**Cause**: Workspace database doesn't exist

**Solution**:
1. Create the database: `CREATE DATABASE workspace_realm_x_y;`
2. Run migrations for that database
3. Verify database credentials are correct

### Cross-Workspace Access Denied

```
Error: Workspace access denied
```

**Cause**: User trying to access different workspace

**Solution**:
1. Check user's roles (owner/supervisor have multi-workspace access)
2. Verify workspace ID in JWT matches requested workspace
3. For candidates, ensure workspace is correctly set in token
