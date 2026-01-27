/**
 * OxLayer Code Snippets
 *
 * Reusable code templates for building domain-driven microservices
 * with OxLayer foundation and capabilities packages.
 *
 * @example
 * ```typescript
 * // Domain layer
 * import { CrudEntityTemplate } from '@oxlayer/snippets/domain';
 *
 * export class Todo extends CrudEntityTemplate {
 *   // ... implementation
 * }
 *
 * // Use case layer
 * import { CreateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
 *
 * export class CreateTodoUseCase extends CreateUseCaseTemplate<CreateTodoInput, Todo, TodoOutput> {
 *   // ... implementation
 * }
 *
 * // Repository layer
 * import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';
 *
 * export class PostgresTodoRepository extends PostgresRepositoryTemplate<Todo, TodoFilters, TodoProps> {
 *   // ... implementation
 * }
 *
 * // Controller layer
 * import { CrudControllerTemplate } from '@oxlayer/snippets/controllers';
 *
 * export class TodosController extends CrudControllerTemplate<...> {
 *   // ... implementation
 * }
 *
 * // Configuration
 * import { createEnvSchema, ContainerTemplate } from '@oxlayer/snippets/config';
 *
 * const envSchema = createEnvSchema({ server: true, postgres: true, observability: true });
 * export const ENV = loadEnv(envSchema);
 * ```
 */

// Domain layer snippets
export * from './domain/index.js';

// Use case layer snippets
export * from './use-cases/index.js';

// Repository layer snippets
export * from './repositories/index.js';

// Controller layer snippets
export * from './controllers/index.js';

// Configuration layer snippets
export * from './config/index.js';
