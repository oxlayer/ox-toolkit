# @oxlayer/snippets

Reusable code templates for building domain-driven microservices with OxLayer foundation and capabilities packages.

## Overview

This package provides templates and base classes for common patterns in OxLayer applications, helping you maintain architectural consistency while accelerating development.

## Installation

```bash
pnpm add @oxlayer/snippets
```

## Usage

### Domain Layer

Create entities using the template base classes:

```typescript
import { CrudEntityTemplate, StatusEntityTemplate, TimestampedEntityTemplate } from '@oxlayer/snippets/domain';

export type TodoStatus = 'pending' | 'in_progress' | 'completed';

export interface TodoProps {
  id: string;
  title: string;
  status: TodoStatus;
  userId: string;
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
  get title(): string { return this.props.title; }
  get status(): TodoStatus { return this.props.status; }
  get userId(): string { return this.props.userId; }

  // Business methods
  markAsCompleted(): void {
    this.updateStatus('completed');
  }

  // Factory methods
  static create(data: CreateTodoInput): Todo {
    return new Todo({
      id: this.generateId(),
      title: data.title,
      status: 'pending',
      userId: data.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(data: TodoProps): Todo {
    return new Todo(data);
  }

  toPersistence(): TodoProps {
    return { ...this.props };
  }
}
```

### Use Case Layer

Create use cases using the template base classes:

```typescript
import { CreateUseCaseTemplate } from '@oxlayer/snippets/use-cases';

export class CreateTodoUseCase extends CreateUseCaseTemplate<
  CreateTodoInput,
  Todo,
  Result<TodoOutput>
> {
  constructor(
    todoRepository: TodoRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      generateId: () => `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createEntity: (data) => Todo.create(data),
      persistEntity: (entity) => todoRepository.create(entity),
      publishEvent: (event) => eventBus.emit(event),
      recordMetric: (name, value) => businessMetrics.increment(name, { value }),
      toOutput: (entity) => ({
        id: entity.id,
        title: entity.title,
        status: entity.status,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'CreateTodo';
  }
}
```

### Repository Layer

Create repositories using the template base classes:

```typescript
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';

export class PostgresTodoRepository extends PostgresRepositoryTemplate<
  Todo,
  TodoFilters,
  TodoProps
> {
  constructor(db: Database, tracer?: unknown | null) {
    super(db, tracer, { tableName: 'todos' });
  }

  protected mapRowToEntity(row: TodoProps): Todo {
    return Todo.fromPersistence(row);
  }

  protected mapEntityToProps(entity: Todo): TodoProps {
    return entity.toPersistence();
  }

  protected applyFilters(query: any, filters: TodoFilters): any {
    if (filters.status) {
      query = query.where({ status: filters.status });
    }
    if (filters.userId) {
      query = query.where({ user_id: filters.userId });
    }
    if (filters.search) {
      query = query.where('title', 'like', `%${filters.search}%`);
    }
    return query;
  }
}
```

### Controller Layer

Create controllers using the template base classes:

```typescript
import { CrudControllerTemplate } from '@oxlayer/snippets/controllers';

export class TodosController extends CrudControllerTemplate<
  CreateTodoInput,
  UpdateTodoInput,
  TodoOutput,
  TodoOutput,
  TodoOutput,
  { items: TodoOutput[]; total: number }
> {
  constructor(
    createTodoUseCase: CreateTodoUseCase,
    getTodoUseCase: GetTodoUseCase,
    updateTodoUseCase: UpdateTodoUseCase,
    deleteTodoUseCase: DeleteTodoUseCase,
    listTodosUseCase: ListTodosUseCase
  ) {
    super({
      create: createTodoUseCase,
      getById: getTodoUseCase,
      update: updateTodoUseCase,
      delete: deleteTodoUseCase,
      list: listTodosUseCase,
    });
  }

  protected getResourcePath(): string {
    return '/api/todos';
  }
}
```

### Configuration Layer

Create configuration using the template helpers:

```typescript
import { createEnvSchema, loadEnv } from '@oxlayer/snippets/config';

const envSchema = createEnvSchema({
  server: true,
  postgres: true,
  observability: true,
});

export const ENV = loadEnv(envSchema);
```

Create a DI container using the template base classes:

```typescript
import { CompleteContainerTemplate } from '@oxlayer/snippets/config';

export class DIContainer extends CompleteContainerTemplate {
  private static instance: DIContainer;

  // Infrastructure
  public postgres: ReturnType<typeof createPostgresConnection>;
  public eventBus: Awaited<ReturnType<typeof createEventBus>>;
  public cache: ReturnType<typeof createRedisConnection>;

  // Lazy-loaded dependencies
  private _todoRepository?: TodoRepository;
  private _createTodoUseCase?: CreateTodoUseCase;

  private constructor() {
    super();
    this.postgres = createPostgresConnection();
    this.cache = createRedisConnection();
  }

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  protected async initializeTelemetry(): Promise<void> {
    const telemetryClient = getTelemetryClient();
    this.tracer = telemetryClient?.getTracer() || null;
  }

  protected async initializeInfrastructure(): Promise<void> {
    this.eventBus = await createEventBus();
  }

  get todoRepository() {
    if (!this._todoRepository) {
      this._todoRepository = new PostgresTodoRepository(
        this.postgres.db,
        this.tracer
      );
    }
    return this._todoRepository;
  }

  get createTodoUseCase() {
    if (!this._createTodoUseCase) {
      this._createTodoUseCase = new CreateTodoUseCase(
        this.todoRepository,
        this.eventBus,
        this.tracer
      );
    }
    return this._createTodoUseCase;
  }
}
```

## Available Templates

### Domain (`@oxlayer/snippets/domain`)

- `EntityTemplate` - Base class for all entities
- `StatusEntityTemplate` - For entities with status transitions
- `TimestampedEntityTemplate` - For entities with timestamps
- `OwnedEntityTemplate` - For multi-tenant entities
- `CrudEntityTemplate` - Combined template with all common features
- `DomainEventTemplate` - Base class for domain events
- `ValueObject` - Base class for value objects
- `PrimitiveValueObject<T>` - For single-value VOs
- `CompositeValueObject` - For multi-field VOs
- Built-in VOs: `Email`, `PhoneNumber`, `Money`, `DateRange`, `Pagination`

### Use Cases (`@oxlayer/snippets/use-cases`)

- `BaseUseCase` - Base class for all use cases
- `CreateUseCase` - Base class for create operations
- `UpdateUseCase` - Base class for update operations
- `DeleteUseCase` - Base class for delete operations
- `GetByIdUseCase` - Base class for get by ID operations
- `ListUseCase` - Base class for list operations
- `CreateUseCaseTemplate` - Template implementation for creates
- `UpdateUseCaseTemplate` - Template implementation for updates
- `DeleteUseCaseTemplate` - Template implementation for deletes
- `GetByIdUseCaseTemplate` - Template implementation for get by ID
- `ListUseCaseTemplate` - Template implementation for lists

### Repositories (`@oxlayer/snippets/repositories`)

- `PostgresRepositoryTemplate` - Base class for PostgreSQL repos
- `SoftDeleteRepositoryTemplate` - For soft-delete entities
- `OwnedRepositoryTemplate` - For multi-tenant repos

### Controllers (`@oxlayer/snippets/controllers`)

- `ControllerTemplate` - Base class for all controllers
- `CrudControllerTemplate` - Full CRUD controller template
- `ReadOnlyControllerTemplate` - Read-only controller template

### Configuration (`@oxlayer/snippets/config`)

- `CommonEnvSchemas` - Pre-built environment schemas
- `createEnvSchema()` - Helper to build env schemas
- `loadEnv()` - Load and validate env vars
- `generateEnvExample()` - Generate .env.example file
- `ContainerTemplate` - Base class for DI containers
- `TelemetryContainerTemplate` - Container with telemetry support
- `CompleteContainerTemplate` - Full-featured container

## Patterns

The snippets enforce these OxLayer architectural patterns:

1. **Domain-Driven Design** - Clear separation of domain, application, and infrastructure layers
2. **Dependency Injection** - All dependencies injected through constructors
3. **Tracing** - Automatic span creation for observability
4. **Error Handling** - Consistent Result type for explicit error handling
5. **Event-Driven** - Domain events for loose coupling
6. **Clean Architecture** - Business logic independent of frameworks

## License

MIT
