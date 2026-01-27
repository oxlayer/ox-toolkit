# Todo CRUD API - OxLayer Example

A complete CRUD application demonstrating the OxLayer framework with:
- **Keycloak Authentication** - JWT-based auth with automatic tenant context extraction
- **PostgreSQL with RLS** - Row-Level Security for multi-tenant data isolation
- **Redis Caching** - Performance optimization with cache stores
- **RabbitMQ Events** - Domain event-driven architecture
- **Multi-Tenancy** - Automatic tenant_id injection and filtering
- **Full Test Coverage** - Unit and integration tests with Foundation Testing Kit

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTTP Layer (Hono)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Auth Middleware (Keycloak)                    │ │
│  │  - JWT validation                                          │ │
│  │  - Tenant context extraction                               │ │
│  │  - User context injection                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │               Controllers (Validation)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                           │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ CreateTodo     │  │ GetTodos       │  │ UpdateTodo     │  │
│  │ UseCase        │  │ UseCase        │  │ UseCase        │  │
│  └────────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Todo Entity                              │ │
│  │  - Business logic (state transitions)                      │ │
│  │  - Invariants                                               │ │
│  │  - Domain Events                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ PostgreSQL  │  │    Redis    │  │  RabbitMQ   │            │
│  │ Repository  │  │   Cache     │  │  Event Bus  │            │
│  │             │  │             │  │             │            │
│  │  - CRUD     │  │  - TTL      │  │  - Pub/Sub  │            │
│  │  - RLS      │  │  - Stats    │  │  - Routing  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Authentication (Keycloak)

- **JWT Token Validation** - Automatic verification of Keycloak tokens
- **Tenant Context** - Extracts `tenant_id` from custom claim or organization
- **User Context** - Injects `userId`, `userEmail`, `userType` into request context
- **Public Routes** - Configurable public paths without authentication

### PostgreSQL with Row-Level Security

- **Automatic tenant_id Column** - Added to all tables if missing
- **RLS Policies** - Automatic tenant filtering at database level
- **Connection Pooling** - Efficient resource management
- **Transaction Support** - ACID guarantees for multi-step operations

### Redis Caching

- **Cache Store** - Automatic caching with TTL management
- **Repository Decorator** - Transparent caching of repository methods
- **Key Prefixing** - Namespace isolation for different environments
- **Statistics** - Cache hit/miss tracking

### RabbitMQ Events

- **Domain Events** - `todo.created`, `todo.updated`, `todo.completed`, `todo.deleted`
- **Event Bus** - Transport-agnostic pub/sub interface
- **Exchange/Queue Setup** - Automatic infrastructure creation
- **Event Handlers** - Subscribe and react to domain events

### Multi-Tenancy

- **Tenant Resolver** - Load tenant configuration from control database
- **Tenant Isolation** - RLS for shared database mode
- **Credential Management** - Bitwarden integration for per-tenant credentials
- **Cache Configuration** - Per-tenant Redis instances

## Quick Start

### Prerequisites

**Option 1: Using Docker (Recommended)**
- Docker 20.10+
- Docker Compose 2.0+

All services (PostgreSQL, Redis, RabbitMQ, Keycloak) are provided via Docker Compose.

**Option 2: Local Development**
- Node.js 20+ / Bun 1+
- PostgreSQL 14+
- Redis 7+
- RabbitMQ 3+
- Keycloak (optional, can use JWT fallback)

### Installation

```bash
cd examples/todo-app
pnpm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Database Setup

```bash
# Run migration to create tables and enable RLS
pnpm run db:migrate

# Seed sample data (optional)
pnpm run db:seed
```

### Run Development Server

**Option 1: Using Docker Compose (Recommended)**

```bash
# Start all services (PostgreSQL, Redis, RabbitMQ, Keycloak, and the app)
make dev

# Or using docker-compose directly
docker-compose up --build

# Start in detached mode
make dev-detached

# View logs
make logs

# Stop services
make down
```

**Option 2: Local Development**

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Server starts at `http://localhost:3001`

#### Docker Services

The Docker Compose setup includes:

- **PostgreSQL** (`localhost:5432`) - Application database
- **Redis** (`localhost:6379`) - Cache layer
- **RabbitMQ** (`localhost:5672`) - Event bus
- **RabbitMQ Management** (`localhost:15672`) - Management UI
- **Keycloak** (`localhost:8080`) - Authentication server

#### Docker Commands

```bash
# Show all available commands
make help

# Check health of all services
make health

# Run database migrations
make db-migrate

# Seed database with sample data
make db-seed

# Open PostgreSQL shell
make db-shell

# Open Redis CLI
make redis-shell

# Run tests
make test
make test-unit
make test-integration
make test-coverage

# Rebuild containers
make rebuild

# Show running containers
make ps

# Show resource usage
make stats
```

#### Production Deployment

```bash
# Build and start production environment
make prod

# Or using docker-compose directly
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production services
make down-prod
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns health status of all services.

### List Todos

```bash
GET /api/todos
Authorization: Bearer <token>
```

Response:
```json
{
  "todos": [
    {
      "id": "todo_001",
      "title": "Learn OxLayer",
      "description": "Explore the framework",
      "status": "in_progress",
      "userId": "user_001",
      "dueDate": "2024-01-15T00:00:00.000Z",
      "createdAt": "2024-01-10T10:00:00.000Z",
      "updatedAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

### Create Todo

```bash
POST /api/todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Build something awesome",
  "description": "With OxLayer framework",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

### Update Todo

```bash
PATCH /api/todos/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "status": "in_progress"
}
```

### Complete Todo

```bash
PATCH /api/todos/:id/complete
Authorization: Bearer <token>
```

### Delete Todo

```bash
DELETE /api/todos/:id
Authorization: Bearer <token>
```

## Testing with Keycloak

### 1. Get Token from Keycloak

```bash
export TOKEN=$(curl -X POST "http://localhost:8080/realms/oxlayer/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=todo-app" \
  -d "grant_type=password" \
  -d "username=admin" \
  -d "password=admin" \
  | jq -r '.access_token')
```

### 2. Make Authenticated Requests

```bash
# List todos
curl -X GET "http://localhost:3001/api/todos" \
  -H "Authorization: Bearer $TOKEN"

# Create todo
curl -X POST "http://localhost:3001/api/todos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test todo","description":"Testing"}'
```

## Domain Events

All todo operations publish domain events to RabbitMQ:

### todo.created

```json
{
  "type": "todo.created",
  "aggregateId": "todo_001",
  "tenantId": "main",
  "userId": "user_001",
  "occurredAt": "2024-01-10T10:00:00.000Z",
  "title": "New Todo",
  "description": "Description",
  "dueDate": "2024-01-15T00:00:00.000Z"
}
```

### todo.updated

```json
{
  "type": "todo.updated",
  "aggregateId": "todo_001",
  "tenantId": "main",
  "userId": "user_001",
  "occurredAt": "2024-01-10T10:05:00.000Z",
  "changes": {
    "status": "completed"
  }
}
```

### todo.completed

```json
{
  "type": "todo.completed",
  "aggregateId": "todo_001",
  "tenantId": "main",
  "userId": "user_001",
  "occurredAt": "2024-01-10T10:10:00.000Z"
}
```

### todo.deleted

```json
{
  "type": "todo.deleted",
  "aggregateId": "todo_001",
  "tenantId": "main",
  "userId": "user_001",
  "occurredAt": "2024-01-10T10:15:00.000Z"
}
```

## Row-Level Security

The `todos` table has RLS enabled:

```sql
-- All queries automatically filter by tenant_id
SELECT * FROM todos;
-- Automatically becomes:
-- SELECT * FROM todos WHERE tenant_id = current_setting('app.current_tenant');
```

This happens at the **database level** - even if someone bypasses the application, they cannot access other tenants' data.

## Development

```bash
# Type check
pnpm run typecheck

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Build
pnpm run build

# Production start
pnpm start
```

## Testing

The project includes comprehensive unit and integration tests using the Foundation Testing Kit.

See [TESTING.md](./TESTING.md) for detailed testing documentation.

```bash
# Run all tests
pnpm test

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Run with coverage report
pnpm test:coverage
```

### Test Structure

- **Unit Tests** (`src/__tests__/unit/`) - Test entities and use cases in isolation
- **Integration Tests** (`src/__tests__/integration/`) - Test HTTP endpoints end-to-end
- **Test Builders** (`src/test/builders/`) - Fluent API for test data creation
- **Test Fixtures** (`src/test/fixtures/`) - Pre-defined test data
- **Test Mocks** (`src/test/mocks/`) - In-memory implementations for testing

## License

MIT
