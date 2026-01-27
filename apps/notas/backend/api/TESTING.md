# Testing Guide

This document describes the testing setup for the Todo API using the OxLayer Foundation Testing Kit.

## Test Structure

```
src/
├── __tests__/
│   ├── unit/                    # Unit tests
│   │   ├── todo.entity.unit.test.ts
│   │   ├── create-todo.usecase.unit.test.ts
│   │   ├── get-todos.usecase.unit.test.ts
│   │   ├── update-todo.usecase.unit.test.ts
│   │   └── delete-todo.usecase.unit.test.ts
│   └── integration/             # Integration tests
│       └── todos.controller.integration.test.ts
├── test/
│   ├── builders/                # Test data builders
│   │   └── todo.builder.ts
│   ├── fixtures/                # Pre-defined test data
│   │   └── todos.fixture.ts
│   ├── mocks/                   # Mock implementations
│   │   ├── mock-event-bus.ts
│   │   └── mock-todo-repository.ts
│   ├── setup.ts                 # Test configuration
│   └── index.ts
└── bunfig.toml                  # Bun test configuration
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Run with coverage
pnpm test:coverage
```

## Testing Kit Features

### 1. Test Data Builders

The Builder pattern provides fluent APIs for creating test data:

```typescript
import { createTodoBuilder } from '../test/builders';

// Create with defaults
const todo = createTodoBuilder().build();

// Fluent API
const todo = createTodoBuilder()
  .withTitle('My Todo')
  .completed()
  .withDueInDays(7)
  .build();
```

### 2. In-Memory Repository

Mock repository for testing without database:

```typescript
import { MockTodoRepository } from '../test/mocks';

const mockRepo = new MockTodoRepository();
mockRepo.seed([todo1, todo2]);

// Use with use cases
const useCase = new GetTodosUseCase(mockRepo);
```

### 3. Assertion Helpers

Special assertions for Result types:

```typescript
import { assertOk, assertErr } from '@oxlayer/foundation-testing-kit';

const result = await useCase.execute(input);
assertOk(result);
expect(result.data.id).toBeDefined();

// For errors
assertErr(result);
expect(result.error.code).toBe('NOT_FOUND');
```

### 4. Test Fixtures

Pre-defined test data:

```typescript
import { todoFixtures, createTodoFixtures } from '../test/fixtures';

// Use pre-defined fixtures
const todo = todoFixtures.completed;

// Create multiple todos
const todos = createTodoFixtures(10);
```

## Unit Tests

Unit tests focus on business logic in isolation:

### Entity Tests

```typescript
describe('Todo Entity', () => {
  it('should mark todo as completed', () => {
    const todo = Todo.create({ id: '1', title: 'Test', tenantId: 'main', userId: 'user' });
    todo.markAsCompleted();
    expect(todo.status).toBe('completed');
  });
});
```

### Use Case Tests

```typescript
describe('CreateTodoUseCase', () => {
  it('should create todo and publish event', async () => {
    const mockRepo = new MockTodoRepository();
    const mockEventBus = new MockEventBus();
    const useCase = new CreateTodoUseCase(mockRepo, mockEventBus);

    const result = await useCase.execute(input);

    assertOk(result);
    expect(mockEventBus.wasPublished('todo.created')).toBe(true);
  });
});
```

## Integration Tests

Integration tests test the full HTTP layer:

```typescript
describe('POST /api/todos', () => {
  it('should create a new todo', async () => {
    const response = await app.request('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'New Todo' }),
    });

    expect(response.status).toBe(201);
  });
});
```

## Best Practices

### 1. Arrange-Act-Assert

```typescript
it('should update todo title', async () => {
  // Arrange
  const existingTodo = createTodoBuilder().build();
  mockRepo.seed([existingTodo]);

  // Act
  const result = await useCase.execute({ id: existingTodo.id, ... });

  // Assert
  assertOk(result);
  expect(result.data.title).toBe('Updated');
});
```

### 2. Descriptive Test Names

```typescript
// Good
it('should mark todo as completed and set completedAt timestamp')

// Bad
it('should complete todo')
```

### 3. Test One Thing

```typescript
// Good - one assertion
it('should set status to completed', () => {
  expect(todo.status).toBe('completed');
});

// Bad - multiple assertions
it('should update todo', () => {
  expect(todo.status).toBe('completed');
  expect(todo.completedAt).toBeDefined();
  expect(todo.updatedAt).toBeInstanceOf(Date);
});
```

### 4. Use Builders for Complex Data

```typescript
// Instead of inline object creation
const todo = {
  id: 'todo-1',
  title: 'Test',
  status: 'pending',
  tenantId: 'main',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  // ... 10 more properties
};

// Use builder
const todo = createTodoBuilder()
  .withId('todo-1')
  .pending()
  .build();
```

## Coverage Goals

- **Entities**: 100% - Business logic is critical
- **Use Cases**: 90%+ - Core application logic
- **Controllers**: 80%+ - HTTP handling
- **Overall**: 80%+

## Continuous Integration

Tests run automatically on:
- Every push
- Pull requests
- Merge to main

Coverage reports are generated and must meet thresholds.
