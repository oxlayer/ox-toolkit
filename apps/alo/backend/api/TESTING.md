# Testing Guide

This document describes the testing structure and patterns used in the Alo Manager API.

## Test Structure

```
src/
├── __tests__/
│   ├── unit/           # Unit tests for individual components
│   │   ├── *.unit.test.ts
│   └── integration/    # Integration tests for API endpoints
│       ├── *.integration.test.ts
└── test/              # Test utilities and helpers
    ├── builders/       # Test data builders
    ├── fixtures/       # Test data fixtures
    ├── mocks/          # Mock implementations
    └── setup.ts        # Test setup configuration
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

## Unit Tests

Unit tests test individual components in isolation:

- **Use Cases**: Test business logic with mocked repositories
- **Entities**: Test domain logic and validation
- **Controllers**: Test HTTP handlers with mocked use cases

### Example Unit Test

```typescript
import { describe, it, expect } from 'bun:test';
import { CreateEstablishmentUseCase } from '../use-cases/create-establishment.usecase';
import { MockEstablishmentRepository } from '../test/mocks/mock-establishment.repository';

describe('CreateEstablishmentUseCase', () => {
  it('should create an establishment with valid data', async () => {
    const mockRepo = new MockEstablishmentRepository();
    const useCase = new CreateEstablishmentUseCase(mockRepo);

    const result = await useCase.execute({
      name: 'Test Restaurant',
      horarioFuncionamento: '9AM-10PM',
      description: 'A test restaurant',
      ownerId: 1,
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Test Restaurant');
  });

  it('should fail with invalid data', async () => {
    const mockRepo = new MockEstablishmentRepository();
    const useCase = new CreateEstablishmentUseCase(mockRepo);

    const result = await useCase.execute({
      name: '', // Invalid: empty name
      horarioFuncionamento: '9AM-10PM',
      description: 'A test restaurant',
      ownerId: 1,
    });

    expect(result.success).toBe(false);
  });
});
```

## Integration Tests

Integration tests test the API endpoints with real HTTP requests:

- Test complete request/response cycles
- Test authentication and authorization
- Test error handling
- Test concurrent operations

### Example Integration Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { createApp } from '../index';

describe('Establishments API', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    app = await createApp();
    // Setup test database
  });

  afterAll(async () => {
    // Cleanup test database
  });

  it('should create an establishment', async () => {
    const response = await app.request('/api/establishments', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Restaurant',
        horarioFuncionamento: '9AM-10PM',
        description: 'A test restaurant',
        ownerId: 1,
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.establishment.name).toBe('Test Restaurant');
  });

  it('should list establishments', async () => {
    const response = await app.request('/api/establishments?limit=10', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.establishments).toBeInstanceOf(Array);
  });
});
```

## Test Builders

Test builders provide a fluent interface for creating test data:

```typescript
import { EstablishmentBuilder } from '../test/builders/establishment.builder';

const establishment = new EstablishmentBuilder()
  .withName('Test Restaurant')
  .withOwnerId(1)
  .withDescription('A test restaurant')
  .build();
```

## Test Fixtures

Test fixtures provide pre-defined test data:

```typescript
import { testEstablishments } from '../test/fixtures/establishments.fixture';

const establishment = testEstablishments.valid;
```

## Mocks

Mock implementations allow testing without real dependencies:

```typescript
import { MockEstablishmentRepository } from '../test/mocks/mock-establishment.repository';

const mockRepo = new MockEstablishmentRepository();
mockRepo.create.mockResolvedValue({ id: 1, name: 'Test' });
```

## Test Setup

The test setup file configures the test environment:

```typescript
// test/setup.ts
import { beforeAll, afterAll } from 'bun:test';

beforeAll(async () => {
  // Setup test database
  // Setup mock services
});

afterAll(async () => {
  // Cleanup test database
  // Shutdown services
});
```

## Security Testing

Test for common vulnerabilities:

- **XSS**: Ensure user input is sanitized
- **SQL Injection**: Use parameterized queries
- **Authentication**: Verify protected endpoints require auth
- **Authorization**: Verify users can only access their data
- **Rate Limiting**: Verify rate limiting works
- **Input Validation**: Verify all input is validated

## Performance Testing

Use k6 for load testing:

```bash
# Install k6
# https://k6.io/

# Run performance tests
k6 run perf-tests/load-test.js
k6 run perf-tests/stress-test.js
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after each test
3. **Mocking**: Mock external dependencies
4. **Coverage**: Aim for >80% code coverage
5. **Speed**: Unit tests should run in milliseconds
6. **Clarity**: Test names should describe what they test
7. **AAA Pattern**: Arrange, Act, Assert

## Test Naming

Use descriptive test names:

```typescript
// Good
it('should return 404 when establishment does not exist', async () => { });

it('should create establishment with valid data', async () => { });

// Bad
it('works', async () => { });
it('test establishment', async () => { });
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Main branch commits
- Release branches

Required checks must pass before merging.
