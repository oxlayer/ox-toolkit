# OxLayer DDD Architecture Pattern

A comprehensive guide to implementing Domain-Driven Design using the OxLayer framework packages with template-based development.

## Overview

This pattern implements clean, layered DDD architecture with modular capability packages from OxLayer. The recommended approach uses **@oxlayer/snippets** which provides pre-built templates for entities, repositories, use cases, and controllers - significantly reducing boilerplate code while maintaining consistency.

## OxLayer Packages

### Snippets Package (Recommended - Template-Based)

| Package | Purpose |
|---------|---------|
| `@oxlayer/snippets` | **Primary package** - Pre-built templates for entities, repositories, use cases, controllers, and domain events. Use this first! |

### Foundation Packages (Core DDD Building Blocks)

| Package | Purpose |
|---------|---------|
| `@oxlayer/foundation-domain-kit` | Core DDD primitives: Entities, Value Objects, Aggregates, Repositories |
| `@oxlayer/foundation-http-kit` | HTTP layer utilities: BaseController, validation, error handling |
| `@oxlayer/foundation-app-kit` | Application framework utilities |
| `@oxlayer/foundation-persistence-kit` | Persistence abstractions and base classes |
| `@oxlayer/foundation-testing-kit` | Testing utilities and helpers |

### Capability Packages (Infrastructure Services)

| Package | Purpose |
|---------|---------|
| `@oxlayer/capabilities-auth` | Authentication (Keycloak integration) |
| `@oxlayer/capabilities-events` | Event publishing (RabbitMQ) |
| `@oxlayer/capabilities-cache` | Caching (Redis) |
| `@oxlayer/capabilities-telemetry` | Observability (OpenTelemetry) |
| `@oxlayer/capabilities-openapi` | API documentation (Swagger/OpenAPI) |
| `@oxlayer/capabilities-internal` | Internal logging utilities |
| `@oxlayer/capabilities-testing` | Test helpers: CombinedBuilder, MockRepository |

### Infrastructure Adapters

| Package | Purpose |
|---------|---------|
| `@oxlayer/capabilities-adapters-postgres` | PostgreSQL adapter with **auto-migration** support |
| `@oxlayer/capabilities-adapters-redis` | Redis adapter |
| `@oxlayer/capabilities-adapters-rabbitmq` | RabbitMQ event bus adapter with tracing |

### Tenancy Support

| Package | Purpose |
|---------|---------|
| `@oxlayer/pro-tenancy` | Multi-tenancy management |
| `@oxlayer/pro-adapters-postgres-tenancy` | Tenancy-aware PostgreSQL adapter |

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                   (Controllers / Routes)                     │
│  - HTTP handling                                            │
│  - Request validation                                       │
│  - Response formatting                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                     (Use Cases)                              │
│  - Business logic coordination                              │
│  - Orchestration of domain operations                       │
│  - Transaction boundaries                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
│         (Entities, Value Objects, Aggregates)               │
│  - Core business logic                                      │
│  - Business rules                                           │
│  - Domain model                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│              (Repositories, Adapters, Services)              │
│  - Data access                                              │
│  - External services                                        │
│  - Technical implementations                                │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
api/
├── src/
│   ├── domain/                  # Domain Layer
│   │   └── {aggregate}/
│   │       ├── {entity}.entity.ts           # Domain entity
│   │       ├── {entity}.types.ts            # Domain types/interfaces
│   │       ├── {entity}.events.ts           # Domain events
│   │       └── {entity}.validation.ts       # Domain validation
│   │
│   ├── repositories/             # Infrastructure Layer
│   │   └── {aggregate}/
│   │       ├── {entity}.repository.interface.ts
│   │       └── postgres-{entity}.repository.ts
│   │
│   ├── use-cases/               # Application Layer
│   │   └── {aggregate}/
│   │       ├── create-{entity}.usecase.ts
│   │       ├── update-{entity}.usecase.ts
│   │       ├── list-{entity}.usecase.ts
│   │       └── {entity}.types.ts
│   │
│   ├── controllers/             # Presentation Layer
│   │   └── {aggregate}/
│   │       └── {entities}.controller.ts
│   │
│   ├── infrastructure/
│   │   ├── container.ts                    # DI container (extends CompleteContainerTemplate)
│   │   ├── dependencies.ts                 # Dependency wiring
│   │   └── events.ts                       # Event handlers setup
│   │
│   ├── config/                  # Configuration (env, constants)
│   ├── db/                      # Database schema (Drizzle)
│   │   └── schema/
│   │       └── {table}.schema.ts
│   │
│   └── test/                    # Test utilities
│       ├── builders/            # Test data builders (CombinedBuilder)
│       └── mocks/              # Repository mocks (MockRepository)
│
├── package.json
└── tsconfig.json
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Domain Entity | PascalCase | `Todo`, `Exam`, `User` |
| Value Object | PascalCase + "VO" | `EmailVO`, `MoneyVO` |
| Repository Interface | PascalCase + "Repository" | `TodoRepository`, `ExamRepository` |
| Repository Implementation | Adapter + PascalCase + "Repository" | `PostgresTodoRepository` |
| Use Case | Action + Entity + "UseCase" | `CreateTodoUseCase`, `GetTodoUseCase` |
| Controller | Entity + "Controller" (plural) | `TodosController`, `ExamsController` |
| Files | kebab-case | `todo.entity.ts`, `create-todo.usecase.ts` |

## Code Patterns (Template-Based - Recommended)

### 1. Domain Entity with Template

```typescript
// src/domain/todo/todo.entity.ts
import { CrudEntityTemplate } from '@oxlayer/snippets/domain';

interface TodoProps {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  userId: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Todo extends CrudEntityTemplate<string> {
  private props: TodoProps;

  private constructor(props: TodoProps) {
    super(props.id);
    this.props = props;
  }

  // Getters
  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get status(): string { return this.props.status; }
  get userId(): string { return this.props.userId; }
  get dueDate(): Date | undefined { return this.props.dueDate; }

  // Built-in methods from CrudEntityTemplate:
  // - isStatus(status): check if entity has a specific status
  // - updateStatus(status): update status and touch updatedAt
  // - touch(): update updatedAt timestamp
  // - createdAfter(date): check if created after date
  // - updatedAfter(date): check if updated after date

  // Business methods
  markAsCompleted(): void {
    if (this.isStatus('completed')) return; // Built-in method
    this.updateStatus('completed'); // Built-in method
    this.props.completedAt = new Date();
    this.touch(); // Built-in method
  }

  // Factory method
  static create(data: CreateTodoInput): Todo {
    return new Todo({
      id: data.id || generateTodoId(),
      title: validateAndSanitizeTitle(data.title),
      description: validateAndSanitizeDescription(data.description),
      status: 'pending',
      userId: data.userId,
      dueDate: data.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Persistence conversion
  static fromPersistence(data: TodoProps): Todo {
    return new Todo(data);
  }

  toPersistence(): TodoProps {
    return { ...this.props };
  }
}
```

**Built-in Methods from `CrudEntityTemplate`:**
- `isStatus(status)` - Check if entity has a specific status
- `updateStatus(status)` - Update status and call `touch()`
- `touch()` - Update `updatedAt` timestamp
- `createdAfter(date)` - Check if entity was created after a date
- `updatedAfter(date)` - Check if entity was updated after a date

### 2. Repository with Template

```typescript
// src/repositories/postgres-todo.repository.ts
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';

export class PostgresTodoRepository
  extends PostgresRepositoryTemplate<Todo, TodoFilters, TodoProps>
  implements TodoRepository
{
  constructor(
    db: any, // Drizzle database instance
    tracer?: unknown | null  // OpenTelemetry tracer (optional)
  ) {
    super(db, tracer, {
      tableName: 'todos',
      dbSystem: 'postgresql',
      dbName: 'app_name',
    });
  }

  // Required: Define the table schema
  protected override get tableSchema() {
    return TodoTable; // Drizzle table definition
  }

  // Required: Map database row to domain entity
  protected override mapRowToEntity(row: TodoProps): Todo {
    return Todo.fromPersistence(row);
  }

  // Required: Map domain entity to database props
  protected override mapEntityToProps(entity: Todo): TodoProps {
    return entity.toPersistence();
  }

  // Optional: Override filter application
  protected override applyFilters(
    query: any,
    filters: TodoFilters
  ): any {
    let q = super.applyFilters(query, filters);

    if (filters.status) {
      q = q.where(eq(TodoTable.status, filters.status));
    }

    if (filters.userId) {
      q = q.where(eq(TodoTable.userId, filters.userId));
    }

    return q;
  }
}
```

**Built-in Features from `PostgresRepositoryTemplate`:**
- Automatic span creation for all database operations (OpenTelemetry)
- Built-in CRUD operations: `create`, `findById`, `findAll`, `update`, `delete`
- Automatic filter application
- Query building helpers
- Error handling with tracing

### 3. Use Case with Template (Create)

```typescript
// src/use-cases/create-todo.usecase.ts
import { CreateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { TodoCreatedEvent } from '@/domain/todo/todo.events';

type CreateTodoInputWithAuth = CreateTodoInput & { userId: string };

export class CreateTodoUseCase extends CreateUseCaseTemplate<
  CreateTodoInputWithAuth,
  Todo,
  AppResult<CreateTodoOutput>
> {
  constructor(
    todoRepository: TodoRepository,
    eventBus: EventBus,
    private clickhouseDomainEvents: Pick<typeof domainEvents, 'emit'>,
    private businessMetrics?: Pick<BusinessMetricsType, 'increment'>,
    tracer?: unknown | null
  ) {
    super({
      // ID generation function
      generateId: () => `todo_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,

      // Entity factory
      createEntity: (data) => Todo.create(data),

      // Persistence function
      persistEntity: async (entity) => await todoRepository.create(entity),

      // Event publishing with error handling (non-critical failures)
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          logger.warn('Event bus publish failed', { error });
          // Event failures don't break the operation
        }
      },

      // Optional: Business metrics recording
      recordMetric: async (name: string, value: number) => {
        if (businessMetrics) {
          await businessMetrics.increment(name, {
            tenant: 'default',
            plan: 'free',
            value,
          });
        }
      },

      // Output mapping
      toOutput: (entity) => ({
        id: entity.id,
        title: entity.title,
        status: entity.status,
        createdAt: entity.props.createdAt,
      }),

      tracer,
    });
  }

  // Override to create custom domain event
  protected override createEvent(entity: Todo, id: string): DomainEvent {
    return new TodoCreatedEvent({
      aggregateId: entity.id,
      userId: entity.userId,
      title: entity.title,
      description: entity.props.description,
      dueDate: entity.dueDate,
    });
  }
}
```

### 4. Use Case with Template (List)

```typescript
// src/use-cases/list-todos.usecase.ts
import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';

export class ListTodosUseCase extends ListUseCaseTemplate<
  ListTodosFilters,
  Todo,
  AppResult<ListTodosOutput>
> {
  constructor(
    private todoRepository: TodoRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntities: async (filters) => {
        const { data, total } = await todoRepository.findAll(filters);
        return { entities: data, total };
      },
      toOutput: (entities) => ({
        items: entities.map((e) => ({
          id: e.id,
          title: e.title,
          status: e.status,
        })),
        total: entities.length,
      }),
      tracer,
    });
  }
}
```

**Available Use Case Templates:**
- `CreateUseCaseTemplate<Input, Entity, Output>` - For creating entities
- `UpdateUseCaseTemplate<Input, Entity, Output>` - For updating entities
- `DeleteUseCaseTemplate<Input, Entity, Output>` - For deleting entities
- `ListUseCaseTemplate<Filters, Entity, Output>` - For listing entities
- `GetByIdUseCaseTemplate<Input, Entity, Output>` - For getting single entity

### 5. Domain Event with Template

```typescript
// src/domain/todo/todo.events.ts
import { DomainEventTemplate } from '@oxlayer/snippets/domain';

export abstract class TodoEvent<TPayload> extends DomainEventTemplate<TPayload> {
  abstract readonly name: string;
  readonly aggregateType = 'Todo';

  get eventType(): string {
    return this.name;
  }
}

export class TodoCreatedEvent extends TodoEvent<TodoCreatedPayload> {
  readonly name = 'TodoCreated';
  readonly version = 1;

  constructor(
    public readonly aggregateId: string,
    public readonly payload: TodoCreatedPayload
  ) {
    super(aggregateId, payload);
  }
}
```

### 6. Controller with BaseController

```typescript
// src/controllers/todos.controller.ts
import { BaseController, buildPageInfo, buildPaginatedPayload } from '@oxlayer/foundation-http-kit';
import { Context } from 'hono';
import { z } from 'zod';

export class TodosController extends BaseController {
  constructor(
    private createTodoUseCase: CreateTodoUseCase,
    private listTodosUseCase: ListTodosUseCase,
    private updateTodoUseCase: UpdateTodoUseCase,
    private deleteTodoUseCase: DeleteTodoUseCase,
    private todoRepository: TodoRepository
  ) {
    super();
  }

  async createTodo(c: Context): Promise<Response> {
    // Extract userId from auth middleware context
    const userId = c.get('userId') as string;
    const body = await c.req.json();

    // Zod validation
    const input = createTodoSchema.safeParse(body);
    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    // Execute use case
    const result = await this.createTodoUseCase.execute({
      ...input.data,
      userId,
    });

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to create todo');
    }

    return this.created({ todo: result.data });
  }

  async listTodos(c: Context): Promise<Response> {
    const { include, ...filters } = parseQuery(c.req.query());

    // Only fetch total if explicitly requested via include=count
    // Backend rule of thumb: avoid expensive count queries unless needed
    let total: number | undefined;
    if (include?.includes('count')) {
      total = await this.todoRepository.count(filters);
    }

    const result = await this.listTodosUseCase.execute(filters);

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to list todos');
    }

    const items = result.data?.items || [];
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const pageInfo = buildPageInfo({
      itemsLength: items.length,
      limit,
      nextCursorPayload: { offset: offset + limit, limit },
    });

    return this.ok(
      buildPaginatedPayload({
        data: items,
        pageInfo,
        total,
      })
    );
  }
}
```

**BaseController Response Methods:**
- `ok(data)` - 200 OK
- `created(data)` - 201 Created
- `accepted(data)` - 202 Accepted
- `noContent()` - 204 No Content
- `badRequest(message)` - 400 Bad Request
- `unauthorized(message)` - 401 Unauthorized
- `forbidden(message)` - 403 Forbidden
- `notFound(message)` - 404 Not Found
- `conflict(message)` - 409 Conflict
- `validationError(errors)` - 422 Validation Error
- `serverError(message)` - 500 Internal Server Error

### 7. DI Container with Template

```typescript
// src/infrastructure/container.ts
import { CompleteContainerTemplate } from '@oxlayer/snippets/config';
import { createPostgres } from '@oxlayer/capabilities-adapters-postgres';
import { createRedis } from '@oxlayer/capabilities-adapters-redis';
import { createRabbitMQEventBus } from '@oxlayer/capabilities-adapters-rabbitmq';
import { initializeTelemetry } from '@oxlayer/capabilities-telemetry';

export class DIContainer extends CompleteContainerTemplate {
  // Private infrastructure instances
  private _postgres: ReturnType<typeof createPostgres>;
  private _redis: ReturnType<typeof createRedis>;
  private _eventBus!: Awaited<ReturnType<typeof createRabbitMQEventBus>>;

  // Lazy-loaded service instances
  private _todoRepository?: TodoRepository;
  private _createTodoUseCase?: CreateTodoUseCase;
  // ... other services

  constructor() {
    super();
    this._postgres = createPostgres({
      host: ENV.POSTGRES_HOST,
      port: ENV.POSTGRES_PORT,
      database: ENV.POSTGRES_DATABASE,
      user: ENV.POSTGRES_USER,
      password: ENV.POSTGRES_PASSWORD,
      migrationSQL: createTableSQLString, // Auto-migration!
    });

    this._redis = createRedis({
      host: ENV.REDIS_HOST,
      port: ENV.REDIS_PORT,
    });
  }

  async initialize() {
    await this.initializeTelemetry();
    this._eventBus = await createRabbitMQEventBus(
      {
        url: ENV.RABBITMQ_URL,
        exchange: 'app.events',
        exchangeType: 'topic',
      },
      {
        serviceName: 'app-name',
        tracer: this.tracer,
      }
    );
    await setupEventHandlers(this._eventBus);
  }

  protected override async initializeTelemetry() {
    const metrics = await initializeTelemetry({
      serviceName: 'app-name',
      exporter: 'prometheus',
    });
    this.tracer = metrics.tracer;
  }

  protected override async shutdown() {
    await this._eventBus.stop();
    await this._postgres.disconnect();
    await this._redis.disconnect();
    await super.shutdown();
  }

  // Repository getter with lazy loading
  get todoRepository(): TodoRepository {
    if (!this._todoRepository) {
      const { PostgresTodoRepository } = require('../repositories/index.js');
      this._todoRepository = new PostgresTodoRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._todoRepository;
  }

  // Use case getter with dependency injection
  get createTodoUseCase(): CreateTodoUseCase {
    if (!this._createTodoUseCase) {
      const { CreateTodoUseCase } = require('../use-cases/index.js');
      this._createTodoUseCase = new CreateTodoUseCase(
        this.todoRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._createTodoUseCase;
  }
}

// Singleton instance
let container: DIContainer | null = null;

export function getContainer(): DIContainer {
  if (!container) {
    container = new DIContainer();
  }
  return container;
}
```

**Features from `CompleteContainerTemplate`:**
- Automatic infrastructure shutdown handling
- Telemetry initialization hooks
- Graceful shutdown support
- Lazy loading pattern for services

### 8. Testing with Templates

```typescript
// src/test/builders/todo.builder.ts
import { CombinedBuilder } from '@oxlayer/capabilities-testing';

export class TodoBuilder {
  private builder: CombinedBuilder<TodoProps, TodoStatus>;

  constructor() {
    this.builder = new CombinedBuilder<TodoProps, TodoStatus>({
      id: () => generateTestId('todo'),
      title: 'Test Todo',
      description: 'Test Description',
      status: 'pending',
      userId: 'test-user-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  withTitle(title: string): this {
    this.builder.with('title', title);
    return this;
  }

  withStatus(status: TodoStatus): this {
    this.builder.with('status', status);
    return this;
  }

  withDueDate(date: Date): this {
    this.builder.with('dueDate', date);
    return this;
  }

  build(): Todo {
    const props = this.builder.build();
    return Todo.fromPersistence(props);
  }
}

// Usage in tests
const todo = new TodoBuilder()
  .withTitle('Important Task')
  .withStatus('pending')
  .build();
```

```typescript
// src/test/mocks/todo.repository.mock.ts
import { MockRepository } from '@oxlayer/capabilities-testing';

export class MockTodoRepository extends MockRepository<Todo, string, TodoFilters> {
  constructor() {
    super({
      getId: (todo) => todo.id,
      filter: (todo, filters) => {
        if (filters.status && todo.status !== filters.status) return false;
        if (filters.userId && todo.userId !== filters.userId) return false;
        return true;
      },
      search: (todo, query) => {
        return todo.title.toLowerCase().includes(query.toLowerCase());
      },
    });
  }
}

// Usage in tests
const mockRepo = new MockTodoRepository();
const todo = new TodoBuilder().build();
await mockRepo.create(todo);

const found = await mockRepo.findById(todo.id);
expect(found).toBeDefined();
```

### 9. Infrastructure Setup with Auto-Migration

```typescript
// src/infrastructure/postgres.ts
import { createPostgres } from '@oxlayer/capabilities-adapters-postgres';
import { migrations } from '@/db/migrations';

export function createPostgresConnection() {
  return createPostgres({
    host: ENV.POSTGRES_HOST,
    port: ENV.POSTGRES_PORT,
    database: ENV.POSTGRES_DATABASE,
    user: ENV.POSTGRES_USER,
    password: ENV.POSTGRES_PASSWORD,
    // Auto-migration on connection!
    migrationSQL: migrations.getSQL(),
    ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
}
```

### 10. Event Bus with Tracing

```typescript
// src/infrastructure/events.ts
import { createRabbitMQEventBus } from '@oxlayer/capabilities-adapters-rabbitmq';

export async function createEventBus() {
  const eventBus = await createRabbitMQEventBus(
    {
      url: ENV.RABBITMQ_URL,
      exchange: 'app.events',
      exchangeType: 'topic',
      queues: [
        {
          name: 'app.events.todos',
          routingKeys: ['todo.*'],
          handlers: todoEventHandlers,
        },
      ],
    },
    {
      serviceName: 'app-name',
      tracer, // OpenTelemetry tracing for all events!
    }
  );
  return eventBus;
}
```

## Security Patterns

### Input Validation & XSS Protection

```typescript
// src/domain/todo/todo.validation.ts
export class TodoValidationError extends Error {
  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'TodoValidationError';
  }
}

export function validateAndSanitizeTitle(title: string): string {
  if (!title || title.trim().length === 0) {
    throw new TodoValidationError('title', 'Title is required');
  }
  if (title.length > 200) {
    throw new TodoValidationError('title', 'Title must be less than 200 characters');
  }
  return sanitizeString(title);
}

function sanitizeString(input: string): string {
  let sanitized = input.trim();

  // Remove dangerous protocols
  sanitized = sanitized.replace(/\b(javascript|data|vbscript):/gi, '');

  // Remove event handler attributes
  sanitized = sanitized.replace(/\bon[a-z]+/gi, '');

  // HTML entity encoding
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };

  return sanitized.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

function decodeHtmlEntities(input: string): string {
  const htmlUnescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#39;': "'",
    '&apos;': "'",
  };

  return input.replace(/&[a-z#]+;/gi, (entity) => htmlUnescapeMap[entity] || entity);
}
```

## Key Concepts

### Template-Based Development

The OxLayer framework provides pre-built templates that handle common patterns:

| Template | Provides |
|----------|----------|
| `CrudEntityTemplate` | Entity base with status, timestamp methods |
| `PostgresRepositoryTemplate` | Repository with CRUD, spans, filtering |
| `CreateUseCaseTemplate` | Use case with ID generation, persistence, events |
| `UpdateUseCaseTemplate` | Use case for updates with optimistic locking |
| `ListUseCaseTemplate` | Use case for listing with pagination |
| `DomainEventTemplate` | Domain event base with metadata |
| `CompleteContainerTemplate` | DI container with shutdown handling |
| `CombinedBuilder` | Test data builder |
| `MockRepository` | In-memory repository for testing |

### Automatic Observability

All templates include OpenTelemetry tracing out of the box:
- Database operations are automatically traced
- Use case execution is tracked
- Event publishing is monitored
- Custom spans can be added using the tracer

### Event Publishing with Fault Tolerance

The use case templates handle event publishing failures gracefully:
- Events are published after persistence
- Publishing failures don't break the main operation
- Failures are logged for monitoring
- Events can be retried by the message broker

### Auto-Migration

The PostgreSQL adapter supports automatic schema migration on connection:
```typescript
migrationSQL: createTableSQLString  // Runs on connection
```

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend Framework | Hono |
| Database | PostgreSQL |
| ORM | Drizzle |
| Cache | Redis |
| Message Broker | RabbitMQ |
| Authentication | Keycloak |
| Observability | OpenTelemetry (Prometheus + Jaeger) |
| API Documentation | OpenAPI/Swagger |
| Runtime | Bun (Node.js compatible) |
| Monorepo | NX + Lerna |

## Best Practices

1. **Use templates first** - Always use `@oxlayer/snippets` templates before custom implementations
2. **Keep domain layer pure** - No dependencies on infrastructure packages in domain
3. **Use dependency injection** - All dependencies through constructor
4. **Validate at boundaries** - Validate in controllers with Zod before use cases
5. **Sanitize user input** - Apply XSS protection to all user-provided strings
6. **Handle events gracefully** - Event publishing failures shouldn't break operations
7. **Test with builders** - Use `CombinedBuilder` for test data generation
8. **Mock repositories** - Use `MockRepository` for isolated unit tests
9. **Enable tracing** - Pass tracer to all templates for observability
10. **Use auto-migration** - Let the Postgres adapter handle schema creation

## Getting Started Checklist

- [ ] Install OxLayer packages: `bun add @oxlayer/snippets @oxlayer/foundation-http-kit @oxlayer/capabilities-adapters-postgres @oxlayer/capabilities-adapters-rabbitmq @oxlayer/capabilities-testing`
- [ ] Set up project structure with domain/, repositories/, use-cases/, controllers/
- [ ] Create entities extending `CrudEntityTemplate` from `@oxlayer/snippets/domain`
- [ ] Create repositories extending `PostgresRepositoryTemplate` from `@oxlayer/snippets/repositories`
- [ ] Create use cases extending templates from `@oxlayer/snippets/use-cases`
- [ ] Create controllers extending `BaseController` from `@oxlayer/foundation-http-kit`
- [ ] Set up DI container extending `CompleteContainerTemplate` from `@oxlayer/snippets/config`
- [ ] Configure PostgreSQL with auto-migration
- [ ] Set up event bus with tracing
- [ ] Create test builders with `CombinedBuilder`
- [ ] Create mock repositories with `MockRepository`
