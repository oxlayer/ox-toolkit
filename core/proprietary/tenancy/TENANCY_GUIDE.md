# Multi-Tenancy Platform Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tenancy-Aware Postgres](#tenancy-aware-postgres)
3. [Tenancy-Aware Cache](#tenancy-aware-cache)
4. [Application Integration](#application-integration)
5. [Request Flow](#request-flow)
6. [Complete Examples](#complete-examples)

---

## Architecture Overview

The multi-tenancy platform follows these core principles:

1. **Tenancy is a semantic capability** - Like `events` and `queues`, it defines behavior, not infrastructure
2. **Applications consume resolved resources** - Never credentials or env vars
3. **Per-resource isolation** - Each resource (database, cache, bucket) can have different isolation strategies
4. **Environment is immutable** - Runtime never changes `process.env`

### The Three Planes

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Business logic, use cases, repositories)                  │
│  Consumes tenant-scoped resources via tenancy capability     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Tenancy Capability                         │
│  - Resolves tenant configuration                            │
│  - Routes to appropriate infrastructure                     │
│  - Manages isolation strategies                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Plane                                 │
│  - B2C: Shared resources with RLS/key prefixing            │
│  - B2B: Dedicated resources per tenant                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Tenancy-Aware Postgres

### How It Works

The `TenancyAwarePostgres` class resolves tenant-specific database connections based on the tenant's isolation strategy.

### Isolation Strategies

| Strategy | Description | Use Case | Connection Pool |
|----------|-------------|----------|-----------------|
| `shared` | Single database with Row-Level Security | B2C tenants | Shared pool |
| `schema` | Same database, separate Postgres schemas | Mixed B2C/B2B | Shared pool |
| `database` | Separate database instance | B2B enterprise | Per-tenant pool |

### Code Flow

```typescript
// 1. Setup (application initialization)
import { TenancyAwarePostgres } from '@oxlayer/capabilities-adapters-postgres-tenancy';
import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';
import { getDatabase, tenantPool } from '@auroraid/auth-api-database';

const tenancyPostgres = new TenancyAwarePostgres({
  tenantResolver,
  bitwardenClient: createBitwardenSecretsClient(),
  sharedDb: getDatabase(),           // For B2C tenants
  tenantPool,                         // For B2B tenants
});

// 2. Resolution (per request)
const db = await tenancyPostgres.resolve('acme-corp');

// Internally:
// a) Loads tenant config from control plane
// b) Checks isolation mode (shared/schema/database)
// c) For B2B:
//    - Fetches credentials from Bitwarden
//    - Gets/creates connection pool from tenantPool
// d) For B2C:
//    - Returns shared database
//    - RLS context set via SET LOCAL (in transaction)
```

### For B2C with RLS

```typescript
// B2C tenants share a database, but RLS isolates data

// In your repository (before queries):
await db.transaction(async (tx) => {
  // Set RLS context for this transaction
  await tx.execute(`SET LOCAL app.current_tenant = '${tenantId}'`);

  // All queries now automatically filter by tenant_id
  const users = await tx.select().from(usersTable);
  // Postgres RLS automatically adds: WHERE tenant_id = 'acme-corp'
});

// Or use the helper:
await tenancyPostgres.setRlsContext('acme-corp');
```

### For B2B with Dedicated Database

```typescript
// B2B tenants get their own connection pool

const db = await tenancyPostgres.resolve('acme-corp');
// Returns connection to: postgres-acme-corp.internal:5432/tenant_acme

// The connection is cached and reused
// Subsequent calls return the same pool

// Pool is isolated per tenant
// acme-corp → pool for postgres-acme-corp.internal
// another-corp → pool for postgres-another-corp.internal
```

---

## Tenancy-Aware Cache

### How It Works

The `TenancyAwareCache` class resolves tenant-specific cache instances based on isolation strategy.

### Isolation Strategies

| Strategy | Description | Implementation | Use Case |
|----------|-------------|----------------|----------|
| `shared` | Single Redis with tenant-prefixed keys | Key prefixing | B2C tenants |
| `dedicated` | Separate Redis instance or DB number | Separate connection | B2B enterprise |

### Code Flow

```typescript
// 1. Setup (application initialization)
import { createTenancyAwareCache } from '@oxlayer/capabilities-adapters-redis-tenancy';

const tenantCache = createTenancyAwareCache({
  baseCache: redisCache,              // Shared Redis client
  tenantResolver,
});

// 2. Resolution (per request)
const cache = await tenantCache.resolve('acme-corp');

// Internally:
// a) Loads tenant config
// b) Checks isolation mode (shared/dedicated)
// c) For shared: Returns wrapped cache with key prefixing
// d) For dedicated: Returns dedicated Redis instance
```

### For Shared Cache (Key Prefixing)

```typescript
// B2C tenants share Redis, but keys are prefixed

const cache = await tenantCache.resolve('acme-corp');
await cache.set('user:123', userData);

// Actual Redis key: "acme-corp:user:123"
// Another tenant: "another-corp:user:123"

// The prefix is automatic - application code doesn't change
```

### Under the Hood

```typescript
class TenantScopedCache implements Cache {
  constructor(private baseCache: Cache, private tenantId: string) {}

  private prefixKey(key: string): string {
    return `${this.tenantId}:${key}`;
  }

  async get<T>(key: string): Promise<CacheResult<T>> {
    // Automatically prefixes: "acme-corp:user:123"
    return this.baseCache.get(this.prefixKey(key));
  }

  async set<T>(key: string, value: T): Promise<void> {
    return this.baseCache.set(this.prefixKey(key), value);
  }

  // All Cache methods automatically prefix keys
}
```

---

## Application Integration

### Middleware Setup

Create middleware that injects tenant-scoped resources into the request context:

```typescript
// middleware/tenancy.ts
import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { TenancyAwarePostgres } from '@oxlayer/capabilities-adapters-postgres-tenancy';
import { createTenancyAwareCache } from '@oxlayer/capabilities-adapters-redis-tenancy';

export function tenancyMiddleware(options: {
  tenancyPostgres: TenancyAwarePostgres;
  tenantCache: ReturnType<typeof createTenancyAwareCache>;
}) {
  return async (c: Context, next: Next) => {
    // Extract tenant from JWT (set by auth middleware)
    const tenantId = c.get('tenantId') || 'main';

    // Resolve tenant-scoped resources
    const db = await options.tenancyPostgres.resolve(tenantId);
    const cache = await options.tenantCache.resolve(tenantId);

    // Inject into request context
    c.set('db', db);
    c.set('cache', cache);
    c.set('tenantId', tenantId);

    await next();
  };
}
```

### Module Composition Update

Update your module initialization to accept tenant-scoped database:

```typescript
// modules/users/src/users.module.ts
import { DrizzleUserRepository } from './infrastructure/repositories/drizzle-user-repository.js';

// Before: Singleton database
// const userRepository = new DrizzleUserRepository();

// After: Database passed in (tenant-scoped)
export async function initUsersModule(db: Database) {
  const userRepository = new DrizzleUserRepository(db);
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const userController = new UserController(createUserUseCase, ...);

  return userRoutes(userController);
}
```

### Application Initialization

```typescript
// app.ts
import { Hono } from 'hono';
import { authMiddleware } from '@oxlayer/capabilities-auth';
import { tenancyMiddleware } from './middleware/tenancy.js';
import { initUsersModule } from './modules/users/users.module.js';

const app = new Hono();

// 1. Auth middleware (extracts tenant from JWT)
app.use('*', authMiddleware({
  keycloak: { url, realm, clientId },
}));

// 2. Tenancy middleware (resolves tenant resources)
app.use('*', tenancyMiddleware({
  tenancyPostgres,
  tenantCache,
}));

// 3. Route handlers with tenant-scoped modules
app.get('/users/:id', async (c) => {
  const db = c.get('db');           // Tenant-scoped database
  const cache = c.get('cache');     // Tenant-scoped cache
  const tenantId = c.get('tenantId');

  // Initialize module with tenant-scoped db
  const userController = await initUsersModule(db);

  // Business logic is tenant-agnostic
  return userController.getUser(c.req.param('id'));
});
```

---

## Tenant Guards

Tenant guards provide route-level protection by validating tenant context after authentication. They answer the question "which tenant are you in?" after auth answers "who are you?".

### Architecture Boundary

**Important**: Tenant guards live in `@oxlayer/pro-tenancy`, NOT in `@oxlayer/capabilities-auth`. This maintains the separation of concerns:

- **Auth** (`@oxlayer/capabilities-auth`): "Who are you?" - Identity only
- **Tenancy** (`@oxlayer/pro-tenancy`): "Which tenant?" - Tenant validation

### Basic Usage

```typescript
import { requireTenant } from '@oxlayer/pro-tenancy';
import { authMiddleware } from '@oxlayer/capabilities-auth';
import { TenantResolver } from '@oxlayer/pro-tenancy';

// 1. Auth extracts tenant from JWT (with tenancy enabled)
app.use('*', authMiddleware({
  enableTenancy: true,  // Enable tenant context extraction
  keycloak: { url, realm, clientId },
}));

// 2. Guard validates tenant exists and is ready
app.use('/api/*', requireTenant({
  resolver: tenantResolver,  // Validates tenant exists in control plane
}));

// Now all /api/* routes require a valid, ready tenant
```

### Guard Options

```typescript
interface TenantGuardOptions {
  // Allowed tenant states (default: ["ready"])
  allowStates?: TenantState[];

  // Required tenant tier (optional)
  requireTier?: TenantTier;

  // Whether to throw if tenant is disabled (default: true)
  throwIfDisabled?: boolean;

  // Tenant resolver for validation
  resolver?: TenantResolver;
}
```

### Common Patterns

#### 1. Require Ready Tenant

```typescript
import { requireTenant } from '@oxlayer/pro-tenancy';

// Only allow tenants in "ready" state
app.use('/api/*', requireTenant({
  resolver: tenantResolver,
}));
```

#### 2. Allow Provisioning State

```typescript
// Admin routes can access tenants during provisioning
app.use('/admin/*', requireTenant({
  resolver: tenantResolver,
  allowStates: ['ready', 'provisioning'],
}));
```

#### 3. Require Enterprise Tier

```typescript
import { requireTenantTier } from '@oxlayer/pro-tenancy';

// Only allow enterprise tier tenants
app.use('/enterprise/*', requireTenantTier('b2b-enterprise', {
  resolver: tenantResolver,
}));
```

#### 4. Require Specific Tenant

```typescript
import { requireTenantId } from '@oxlayer/pro-tenancy';

// Only allow a specific tenant (for tenant-specific admin routes)
app.use('/admin/acme/*', requireTenantId('acme-corp'));
```

#### 5. Handle Disabled Tenants

```typescript
// Allow disabled tenants through for specific routes
app.use('/admin/billing*', requireTenant({
  resolver: tenantResolver,
  throwIfDisabled: false,  // Don't block disabled tenants
}));
```

### Helper Functions

#### Get Tenant ID

```typescript
import { getTenantId } from '@oxlayer/pro-tenancy';

app.get('/api/check', (c) => {
  const tenantId = getTenantId(c);

  if (!tenantId) {
    return c.json({ error: 'No tenant context' }, 401);
  }

  return c.json({ tenantId });
});
```

#### Get Full Tenant Context

```typescript
import { getTenantContext } from '@oxlayer/pro-tenancy';

app.get('/api/user-info', (c) => {
  const ctx = getTenantContext(c);

  if (!ctx) {
    return c.json({ error: 'No tenant context' }, 401);
  }

  return c.json({
    userId: ctx.userId,
    tenantId: ctx.tenantId,
    email: ctx.email,
    roles: ctx.roles,
  });
});
```

### Error Responses

Guards return appropriate HTTP status codes:

| Error | Status | Code | Description |
|-------|--------|------|-------------|
| No tenant context | 401 | `TENANT_REQUIRED` | Auth middleware didn't set tenantId |
| Tenant not found | 404 | `TENANT_NOT_FOUND` | Tenant doesn't exist in control plane |
| Tenant disabled | 403 | `TENANT_DISABLED` | Tenant is suspended/disabled |
| Tenant not ready | 503 | `TENANT_NOT_READY` | Tenant is provisioning/migrating |
| Tier mismatch | 403 | `TENANT_TIER_MISMATCH` | Tenant tier doesn't meet requirements |
| Wrong tenant | 403 | `TENANT_FORBIDDEN` | Tenant doesn't match required tenantId |

### Complete Example

```typescript
// main.ts
import { Hono } from 'hono';
import { authMiddleware } from '@oxlayer/capabilities-auth';
import {
  requireTenant,
  requireTenantTier,
  getTenantId,
  getTenantContext,
} from '@oxlayer/pro-tenancy';
import { InMemoryTenantResolver } from '@oxlayer/pro-tenancy';

// Initialize tenant resolver
const tenantResolver = new InMemoryTenantResolver(tenantsMap);

const app = new Hono();

// 1. Auth with tenancy enabled
app.use('*', authMiddleware({
  enableTenancy: true,
  keycloak: { url, realm, clientId },
}));

// 2. Public routes (no tenant required)
app.get('/health', (c) => c.json({ status: 'ok' }));

// 3. Protected routes (require valid tenant)
const api = new Hono();
api.use('*', requireTenant({ resolver: tenantResolver }));

api.get('/todos', (c) => {
  const tenantId = getTenantId(c);
  const ctx = getTenantContext(c);

  // Tenant is guaranteed to exist and be ready here
  return c.json({
    tenantId,
    userId: ctx.userId,
    todos: [],
  });
});

// 4. Enterprise-only routes
const enterprise = new Hono();
enterprise.use('*', requireTenantTier('b2b-enterprise', {
  resolver: tenantResolver,
}));

enterprise.get('/premium-features', (c) => {
  // Guaranteed to be enterprise tier tenant
  return c.json({ features: ['advanced-analytics', 'dedicated-support'] });
});

// Mount routers
app.route('/api', api);
app.route('/enterprise', enterprise);
```

### Tenancy Without Auth

For public endpoints that still need tenant context (e.g., anonymous access):

```typescript
// Host-based tenant resolution (no auth)
app.use('*', async (c, next) => {
  const host = c.req.header('host');
  const tenantId = resolveTenantFromHost(host);

  if (tenantId) {
    c.set('tenantId', tenantId);
  }

  return next();
});

// Validate tenant exists (even without auth)
app.use('/api/*', requireTenant({ resolver: tenantResolver }));
```

### Testing

```typescript
import { requireTenant } from '@oxlayer/pro-tenancy';

// Mock tenant resolver
const mockResolver = {
  async resolve(tenantId: string) {
    if (tenantId === 'disabled-tenant') {
      throw new TenantDisabledError(tenantId);
    }
    return {
      tenantId,
      state: 'ready',
      tier: 'b2c',
      // ... other config
    };
  },
};

const guard = requireTenant({ resolver: mockResolver });

// Test with valid tenant
const c = new Context();
c.set('tenantId', 'acme-corp');
await guard(c, mockNext); // Passes

// Test with disabled tenant
c.set('tenantId', 'disabled-tenant');
const response = await guard(c, mockNext);
// Returns 403 with TENANT_DISABLED code
```

---

## Request Flow

### Complete Request Lifecycle

```
1. HTTP Request Arrives
   Headers: Authorization: Bearer <JWT>

2. Auth Middleware
   └─> Validates JWT
   └─> Extracts tenant_id from JWT claim
   └─> Sets c.set('tenantId', 'acme-corp')
   └─> Sets c.set('tenantContext', {...})

3. Tenancy Middleware
   └─> Reads c.get('tenantId')
   └─> Resolves tenant config
   └─> Routes to appropriate database
   └─> Routes to appropriate cache
   └─> Sets c.set('db', tenantDb)
   └─> Sets c.set('cache', tenantCache)

4. Route Handler
   └─> Gets db = c.get('db')        // Already tenant-scoped
   └─> Gets cache = c.get('cache')  // Already tenant-scoped
   └─> Passes to repository/use case
   └─> Business logic runs without knowing about tenancy

5. Repository
   └─> Receives tenant-scoped database
   └─> Executes queries
   └─> For B2C: RLS automatically filters rows
   └─> For B2B: Already isolated database
```

### B2C Request Flow (RLS)

```
Request → JWT: tenant_id="acme-corp"
         ↓
Auth Middleware → c.set('tenantId', 'acme-corp')
         ↓
Tenancy Middleware → resolve('acme-corp')
                    ↓
                    isolation="shared"
                    ↓
                    Returns sharedDb
         ↓
Controller → Gets sharedDb
         ↓
Repository → db.select().from(users)
            ↓
            Postgres sees: SET LOCAL app.current_tenant = 'acme-corp'
            ↓
            RLS Policy: WHERE tenant_id = current_setting('app.current_tenant')
            ↓
            Result: Only acme-corp users returned
```

### B2B Request Flow (Dedicated Database)

```
Request → JWT: tenant_id="acme-corp"
         ↓
Auth Middleware → c.set('tenantId', 'acme-corp')
         ↓
Tenancy Middleware → resolve('acme-corp')
                    ↓
                    isolation="database"
                    ↓
                    Fetches credentials from Bitwarden
                    ↓
                    Gets/creates pool for postgres-acme-corp.internal
                    ↓
                    Returns tenant-specific db
         ↓
Controller → Gets tenantDb (isolated)
         ↓
Repository → db.select().from(users)
            ↓
            Queries postgres-acme-corp.internal
            ↓
            Result: Only acme-corp users (database is isolated)
```

---

## Complete Examples

### Example 1: B2C Application

```typescript
// main.ts
import { Hono } from 'hono';
import { DatabaseTenantResolver } from '@oxlayer/capabilities-tenancy';
import { TenancyAwarePostgres } from '@oxlayer/capabilities-adapters-postgres-tenancy';
import { createTenancyAwareCache } from '@oxlayer/capabilities-adapters-redis-tenancy';
import { getDatabase } from '@auroraid/auth-api-database';
import { createBitwardenSecretsClient } from '@oxlayer/capabilities-adapters-bitwarden-secrets';

// Initialize tenant resolver
const tenantResolver = new DatabaseTenantResolver(controlPlaneDb);

// Initialize tenancy-aware resources
const tenancyPostgres = new TenancyAwarePostgres({
  tenantResolver,
  bitwardenClient: createBitwardenSecretsClient(),
  sharedDb: getDatabase(),  // Single database for all B2C tenants
  tenantPool,
});

const tenantCache = createTenancyAwareCache({
  baseCache: redisClient,  // Single Redis for all B2C tenants
  tenantResolver,
});

// Create app
const app = new Hono();

app.use('*', authMiddleware({ keycloak: {...} }));
app.use('*', tenancyMiddleware({ tenancyPostgres, tenantCache }));

app.get('/users/:id', async (c) => {
  const db = c.get('db');

  // For B2C with RLS, set context in transaction
  await db.transaction(async (tx) => {
    await tenancyPostgres.setRlsContext(c.get('tenantId'));

    const [user] = await tx.select().from(users)
      .where(eq(users.id, c.req.param('id')));

    return c.json({ user });
  });
});

// All queries automatically filtered by tenant_id via RLS
```

### Example 2: B2B Application

```typescript
// main.ts
import { TenancyAwarePostgres } from '@oxlayer/capabilities-adapters-postgres-tenancy';
import { createTenancyAwareCache } from '@oxlayer/capabilities-adapters-redis-tenancy';

const tenancyPostgres = new TenancyAwarePostgres({
  tenantResolver,
  bitwardenClient: createBitwardenSecretsClient(),
  sharedDb: getDatabase(),
  tenantPool,  // Each B2B tenant gets their own pool
});

const tenantCache = createTenancyAwareCache({
  baseCache: redisClient,
  tenantResolver,
  // For dedicated cache, provide resolver
  dedicatedCacheResolver: async (tenantId) => {
    // Return dedicated Redis instance for tenant
    return createRedisClientForTenant(tenantId);
  },
});

const app = new Hono();
app.use('*', authMiddleware({ keycloak: {...} }));
app.use('*', tenancyMiddleware({ tenancyPostgres, tenantCache }));

app.get('/users/:id', async (c) => {
  const db = c.get('db');
  // db is already connected to tenant's dedicated database
  // No RLS needed - database is physically isolated

  const [user] = await db.select().from(users)
    .where(eq(users.id, c.req.param('id')));

  return c.json({ user });
});
```

### Example 3: Hybrid (B2C + B2B)

```typescript
// The same code works for both B2C and B2B!
// Tenancy is resolved at runtime based on tenant config.

app.get('/users/:id', async (c) => {
  const db = c.get('db');

  // This works for:
  // - B2C: Shared DB with RLS
  // - B2B: Dedicated DB
  // No code changes needed!

  const [user] = await db.select().from(users)
    .where(eq(users.id, c.req.param('id')));

  return c.json({ user });
});
```

### Example 4: Cache Usage

```typescript
// Cache usage is identical for B2C and B2B

app.get('/users/:id', async (c) => {
  const cache = c.get('cache');
  const db = c.get('db');
  const userId = c.req.param('id');

  // Try cache first
  const cached = await cache.get(`user:${userId}`);
  if (cached.hit) {
    return c.json(cached.value);
  }

  // Cache miss - fetch from DB
  const [user] = await db.select().from(users)
    .where(eq(users.id, userId));

  // Store in cache
  await cache.set(`user:${userId}`, user, { ttl: 300 });

  // B2C: Stored as "acme-corp:user:123"
  // B2B: Stored as "user:123" in dedicated Redis

  return c.json({ user });
});
```

---

## Key Takeaways

1. **Business logic is tenant-agnostic** - Repositories and use cases don't need to know about tenancy
2. **Resources are resolved once per request** - Middleware handles all tenant routing
3. **Isolation is transparent** - Same code works for B2C and B2B
4. **Credentials never leak** - Bitwarden manages secrets, apps only see resolved resources
5. **Environment is immutable** - No runtime `process.env` mutations
6. **RLS provides automatic filtering** - B2C tenants share database with automatic tenant isolation
7. **Dedicated pools for B2B** - Each B2B tenant gets their own connection pool

---

## Testing

### Test with B2C Tenant

```typescript
const testTenantId = 'b2c-test';

// Mock tenant resolver
const mockResolver = {
  async resolve: () => ({
    tenantId: testTenantId,
    state: 'ready',
    tier: 'b2c',
    region: 'us-east-1',
    isolation: {
      database: 'shared',
      cache: 'shared',
    },
    // ... other config
  }),
};

const tenancyPostgres = new TenancyAwarePostgres({
  tenantResolver: mockResolver,
  // ...
});

const db = await tenancyPostgres.resolve(testTenantId);
// Returns shared database
// Queries will be filtered by RLS when tenant context is set
```

### Test with B2B Tenant

```typescript
const testTenantId = 'acme-corp';

const mockResolver = {
  async resolve: () => ({
    tenantId: testTenantId,
    state: 'ready',
    tier: 'b2b-enterprise',
    region: 'us-east-1',
    isolation: {
      database: 'database',
      cache: 'dedicated',
    },
    // ... other config
  }),
};

const db = await tenancyPostgres.resolve(testTenantId);
// Returns dedicated database connection
// Physically isolated from other tenants
```
