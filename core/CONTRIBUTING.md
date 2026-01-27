# Contributing to OxLayer

Thank you for your interest in contributing to OxLayer! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

Please be respectful and constructive in all interactions. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- pnpm 8+
- Docker (for running databases in tests)

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/oxlayer.git
cd oxlayer

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development Workflow

### Branching

- `main` - Production branch
- `develop` - Development branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new PostgreSQL adapter
fix: resolve tenant context leak
docs: update installation guide
test: add integration tests for Redis
refactor: simplify connection pooling
```

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with tests

3. Ensure all tests pass:
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

4. Commit with conventional message:
   ```bash
   git commit -m "feat: your description here"
   ```

5. Push and create PR:
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### TypeScript

- Use strict mode
- Prefer explicit types over inference
- Avoid `any` - use `unknown` when type is truly unknown
- Use interfaces for public APIs, types for internal

```typescript
// Good
interface UserRepository {
  findById(id: string): Promise<User | null>;
}

// Bad
const findById = (id: any): Promise<any> => {...}
```

### Naming Conventions

- **Files**: kebab-case (`todo.repository.ts`)
- **Classes**: PascalCase (`TodoRepository`)
- **Functions/Variables**: camelCase (`findById`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces**: PascalCase with `I` prefix only for external contracts (`IUserProvider`)

### Error Handling

Use Result pattern for business logic:

```typescript
import { Result, Ok, Err } from '@oxlayer/foundation-app-kit';

async function createUser(input: CreateUserInput): Promise<Result<User, ValidationError>> {
  if (!input.email) {
    return Err(new ValidationError('Email is required'));
  }

  const user = await User.create(input);
  return Ok(user);
}
```

### Dependency Injection

Use constructor injection:

```typescript
export class CreateTodoUseCase {
  constructor(
    private readonly repository: TodoRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(input: CreateTodoInput): Promise<Result<Todo, Error>> {
    // ...
  }
}
```

## Testing Guidelines

### Test Structure

```
src/
├── __tests__/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── test/
│   ├── builders/          # Test data builders
│   ├── fixtures/          # Pre-defined test data
│   └── mocks/             # Mock implementations
```

### Writing Tests

```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { createTodoBuilder } from '../test/builders/todo.builder';

describe('CreateTodoUseCase', () => {
  it('should create todo and publish event', async () => {
    // Arrange
    const mockRepo = new MockTodoRepository();
    const mockEventBus = new MockEventBus();
    const useCase = new CreateTodoUseCase(mockRepo, mockEventBus);

    const input = { title: 'New Todo' };

    // Act
    const result = await useCase.execute(input);

    // Assert
    expect(result.isOk()).toBe(true);
    expect(result.data.title).toBe('New Todo');
    expect(mockEventBus.wasPublished('todo.created')).toBe(true);
  });
});
```

### Coverage

- **Foundation Kits**: 100% coverage (critical infrastructure)
- **Capabilities**: 90%+ coverage
- **Adapters**: 80%+ coverage
- **Examples**: 70%+ coverage

## Documentation

### Code Documentation

Use JSDoc for exported functions and classes:

```typescript
/**
 * Creates a new todo in the system.
 *
 * @param input - The todo creation input
 * @param input.title - The todo title (required)
 * @param input.description - Optional description
 * @returns Result containing the created todo or validation error
 *
 * @example
 * ```typescript
 * const result = await createTodo.execute({ title: 'Buy milk' });
 * if (result.isOk()) {
 *   console.log(result.data.id);
 * }
 * ```
 */
async execute(input: CreateTodoInput): Promise<Result<Todo, ValidationError>>
```

### README Updates

When adding a new adapter or capability:
1. Update the main [README.md](../README.md)
2. Add/update the category README
3. Add usage examples

## Pull Request Process

### Before Submitting

- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts with target branch

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass

## Checklist
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Conventional commits used
```

### Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. Address all review comments
4. Squash commits if requested
5. Maintainer merges

## Getting Help

- **Discord**: [https://discord.gg/oxlayer](https://discord.gg/oxlayer)
- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and ideas

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.

---

Thank you for contributing to OxLayer! 🚀
