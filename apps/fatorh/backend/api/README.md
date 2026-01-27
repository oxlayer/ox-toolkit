# FatorH API

> Multi-tenant HR assessment API using OxLayer DDD architecture with Keycloak authentication and workspace-based database isolation.

## Overview

FatorH API is a B2B SaaS platform for HR assessments, featuring:

- **Multi-tenant architecture** with Keycloak-based authentication
- **Realm-based isolation** (legal/security boundary)
- **Workspace-based data isolation** (database-per-workspace)
- **Organization-based business boundary**
- **Role-based access control** (owner, supervisor, manager, candidate)

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Keycloak Multi-Tenant                        │
├─────────────────────────────────────────────────────────────────────┤
│  Realm (Security)      Workspace (Data)      Organization (Business)  │
│  ├─ realm-platform     ├─ workspace_main      ├─ org-acme-corp       │
│  ├─ realm-acme       ├─ workspace_acme-corp  └─ org-itau           │
│  └─ realm-globex    └─ workspace_itau                             │
│                                                                     │
│  Database Naming: workspace_{realm}_{workspaceId}                   │
│  Example: workspace_realm-acme_acme-corp                            │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### Authentication & Authorization
- ✅ Keycloak OAuth2/OIDC integration
- ✅ JWT token validation
- ✅ Multi-realm support (platform + client realms)
- ✅ Role-based guards (platform, client, candidate)
- ✅ Tenant context propagation via AsyncLocalStorage

### Multi-Tenancy
- ✅ **Realm isolation**: Separate Keycloak realms per B2B client
- ✅ **Workspace isolation**: Database-per-workspace
- ✅ **Organization scoping**: Business boundary within realm
- ✅ **Cross-workspace access**: Owner/Supervisor roles
- ✅ **Hard workspace lock**: Candidate role

### Capabilities
- ✅ PostgreSQL with Drizzle ORM
- ✅ Redis caching
- ✅ RabbitMQ event bus
- ✅ Prometheus metrics
- ✅ OpenTelemetry tracing
- ✅ OpenAPI documentation

## Workspace Dependencies

### Core Capabilities
- `@oxlayer/capabilities-adapters-postgres` - PostgreSQL adapter
- `@oxlayer/capabilities-adapters-redis` - Redis adapter
- `@oxlayer/capabilities-auth` - Authentication & multi-tenancy
- `@oxlayer/capabilities-cache` - Cache abstraction
- `@oxlayer/capabilities-events` - Event bus
- `@oxlayer/capabilities-internal` - Internal utilities
- `@oxlayer/capabilities-openapi` - OpenAPI/Swagger

### Proprietary (Tenancy)
- `@oxlayer/pro-tenancy` - Multi-tenant core abstractions
- `@oxlayer/pro-adapters-postgres-tenancy` - PostgreSQL tenancy adapter

## Installation

```bash
pnpm install
```

## Development

### Prerequisites

1. **Keycloak** running on `http://localhost:8080`
2. **PostgreSQL** with workspace databases
3. **Redis** for caching
4. **RabbitMQ** for events (optional)

### Start Keycloak (Docker)

```bash
docker run -d \
  --name keycloak \
  -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

### Bootstrap Keycloak Realms

```bash
# Build bootstrap CLI
cd core/cli/keycloak-bootstrap
pnpm build
pnpm link --global

# Bootstrap platform realm
keycloak-bootstrap bootstrap \
  --config apps/globex/apps/api/keycloak.realm-platform.config.json

# Bootstrap client realm (Acme)
keycloak-bootstrap bootstrap \
  --config apps/globex/apps/api/keycloak.realm-client.config.json
```

### Create Workspace Databases

```bash
psql -U postgres -c "CREATE DATABASE workspace_platform_main;"
psql -U postgres -c "CREATE DATABASE workspace_realm-acme_acme-corp;"
psql -U postgres -c "CREATE DATABASE workspace_realm-acme_itau;"
```

### Environment Variables

Create `.env` file:

```bash
# Server
HOST=0.0.0.0
PORT=3000
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=globex
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Keycloak
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=realm-acme
KEYCLOAK_CLIENT_ID=acme-api

# JWT (development fallback)
JWT_SECRET=dev-secret-change-in-production
```

### Run Development Server

```bash
pnpm dev
```

Server will start at `http://localhost:3000`

## API Documentation

- **Scalar UI**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/openapi.json
- **Metrics**: http://localhost:3000/metrics

## Authentication

### Generate Anonymous Token (Development)

```bash
curl -X POST http://localhost:3000/auth/token/anonymous \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "metadata": {
      "realm": "realm-acme",
      "workspace": { "id": "acme-corp" },
      "organization": { "id": "acme-corp" },
      "roles": ["manager"]
    }
  }'
```

### Keycloak Login

```bash
curl -X POST http://localhost:3000/auth/token/keycloak \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password"
  }'
```

## Multi-Tenant Usage

### Accessing Tenant Context

```typescript
import { getKeycloakContext } from '@oxlayer/pro-tenancy';

export async function myHandler(c: Context) {
  const context = getKeycloakContext();

  // Access tenant information
  console.log('Realm:', context.realm);           // "realm-acme"
  console.log('Workspace:', context.workspaceId);   // "acme-corp"
  console.log('Organization:', context.organizationId); // "acme-corp"
  console.log('User:', context.userId);
  console.log('Roles:', context.roles); // ["manager"]
}
```

### Tenant-Specific Database

```typescript
import { getTenantDatabase } from './config/database-resolver.config.js';

export async function getUsersHandler(c: Context) {
  // Automatically resolves to workspace_{realm}_{workspaceId}
  const tenantDb = await getTenantDatabase();

  const users = await tenantDb.select().from(usersTable);
  return c.json({ users });
}
```

### Role Guards

```typescript
import { clientGuard, platformGuard, candidateGuard } from '@oxlayer/capabilities-auth';

// Platform-only routes
app.use('/api/platform/*', platformGuard());

// Client realm routes (owner/supervisor/manager)
app.use('/api/people/*', clientGuard());

// Candidate routes (hard workspace lock)
app.use('/api/app/*', candidateGuard());
```

## Database Schema

### Workspace Databases

Each workspace has its own PostgreSQL database:

```
workspace_platform_main        -- Platform realm
workspace_realm-acme_acme-corp -- Acme/AcmeCorp workspace
workspace_realm-acme_itau     -- Acme/Itau workspace
```

### Tables (per workspace)

- `exams` - Assessment exams
- `questions` - Exam questions
- `answers` - Question answers
- `exam_assignments` - Exam to candidate assignments
- `candidates` - Candidate information
- `evaluation_results` - Evaluation results
- `workspaces` - Workspace metadata

## Routes

### Public Routes
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics
- `GET /docs` - API documentation
- `POST /auth/token/anonymous` - Generate anonymous token
- `POST /auth/token/keycloak` - Keycloak login

### Protected Routes (Authentication Required)

#### Exams
- `POST /api/exams` - Create exam
- `GET /api/exams` - List exams
- `GET /api/exams/:id` - Get exam
- `GET /api/exams/:id/questions` - Get exam with questions

#### Evaluations
- `POST /api/evaluations/bulk` - Bulk evaluate candidates
- `GET /api/evaluations/:id` - Get evaluation result
- `GET /api/evaluations/by-exam-cpf` - Get evaluation by exam and CPF

#### Workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces` - List workspaces
- `GET /api/workspaces/:id` - Get workspace
- `PATCH /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

#### Questions
- `POST /api/questions` - Create question
- `GET /api/questions` - List questions
- `GET /api/questions/:id` - Get question
- `PATCH /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

#### Answers
- `POST /api/answers` - Create answer
- `GET /api/answers` - List answers
- `GET /api/answers/:id` - Get answer
- `PATCH /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer

## Role Permissions

### Platform Realm (`realm-platform`)
| Role | Access |
|------|--------|
| `platform-admin` | Full platform access, all realms |
| `platform-support` | Support operations across realms |
| `platform-ops` | Platform operations and monitoring |

### Client Realms (`realm-*`)
| Role | Workspace Access | Organization Access |
|------|-----------------|-------------------|
| `owner` | All workspaces | All organizations |
| `supervisor` | All workspaces | All organizations |
| `manager` | All workspaces | Organization-scoped |
| `candidate` | Assigned workspace only | None |

## Building

```bash
pnpm build
```

## Testing

```bash
# Run tests
pnpm test

# Run specific test file
pnpm test src/__tests__/integration/exams.controller.integration.test.ts
```

## Deployment

### Production Environment Variables

```bash
NODE_ENV=production
KEYCLOAK_ENABLED=true
KEYCLOAK_SERVER_URL=https://keycloak.example.com
KEYCLOAK_REALM=realm-production
POSTGRES_HOST=postgres.example.com
# ... other production variables
```

### Production Build

```bash
pnpm build
pnpm start
```

## Troubleshooting

### No Tenant Context Error

**Cause**: JWT token missing tenant claims

**Solution**:
1. Ensure Keycloak protocol mappers are configured
2. Verify `enableTenancy: true` in auth options
3. Check JWT token contains `realm`, `workspace`, `organization` claims

### Database Connection Failed

**Cause**: Workspace database doesn't exist

**Solution**:
```bash
psql -U postgres -c "CREATE DATABASE workspace_realm_x_y;"
```

### Cross-Workspace Access Denied

**Cause**: User role doesn't have multi-workspace access

**Solution**: Check user's roles:
- `owner`/`supervisor`: Multi-workspace access
- `manager`: Organization-scoped
- `candidate`: Single workspace only

## See Also

- [Multi-Tenant Architecture Guide](./MULTI_TENANT.md)
- [Keycloak Bootstrap CLI](../../core/cli/keycloak-bootstrap/README.md)
- [Auth Package Documentation](../../core/capabilities/auth/README.md)

## License

MIT
