/**
 * Dependency Injection Container Template
 *
 * A template for creating a DI container that manages application dependencies.
 * The container uses lazy initialization to avoid circular dependencies.
 *
 * @example
 * ```typescript
 * import { getTelemetryClient } from './metrics.config.js';
 * import { createPostgresConnection } from './postgres.config.js';
 * import { createEventBus } from './events.config.js';
 *
 * export class DIContainer {
 *   private static instance: DIContainer;
 *
 *   // Infrastructure
 *   public postgres: ReturnType<typeof createPostgresConnection>;
 *   public eventBus: Awaited<ReturnType<typeof createEventBus>>;
 *   private tracer?: unknown | null;
 *
 *   // Repositories (lazy loaded)
 *   private _todoRepository?: TodoRepository;
 *
 *   // Use cases (lazy loaded)
 *   private _createTodoUseCase?: CreateTodoUseCase;
 *   private _getTodoUseCase?: GetTodoUseCase;
 *   private _updateTodoUseCase?: UpdateTodoUseCase;
 *   private _deleteTodoUseCase?: DeleteTodoUseCase;
 *   private _listTodosUseCase?: ListTodosUseCase;
 *
 *   private constructor() {
 *     this.postgres = createPostgresConnection();
 *   }
 *
 *   static getInstance(): DIContainer {
 *     if (!DIContainer.instance) {
 *       DIContainer.instance = new DIContainer();
 *     }
 *     return DIContainer.instance;
 *   }
 *
 *   async initialize() {
 *     console.log('🔧 Initializing infrastructure...');
 *
 *     // Get tracer from telemetry client
 *     const telemetryClient = getTelemetryClient();
 *     this.tracer = telemetryClient?.getTracer() || null;
 *
 *     if (this.tracer) {
 *       console.log('✅ Tracer initialized');
 *     } else {
 *       console.log('⚠️ Tracer not available');
 *     }
 *
 *     // Connect to event bus
 *     this.eventBus = await createEventBus();
 *     console.log('✅ Event bus connected');
 *
 *     // Test database connection
 *     await this.postgres.sql`SELECT 1`;
 *     console.log('✅ Database connected');
 *   }
 *
 *   // Repository getters with lazy initialization
 *   get todoRepository() {
 *     if (!this._todoRepository) {
 *       const { PostgresTodoRepository } = require('../repositories/index.js');
 *       this._todoRepository = new PostgresTodoRepository(
 *         this.postgres.db,
 *         this.tracer
 *       );
 *     }
 *     return this._todoRepository;
 *   }
 *
 *   // Use case getters with lazy initialization
 *   get createTodoUseCase() {
 *     if (!this._createTodoUseCase) {
 *       const { CreateTodoUseCase } = require('../use-cases/index.js');
 *       this._createTodoUseCase = new CreateTodoUseCase(
 *         this.todoRepository,
 *         this.eventBus,
 *         this.tracer
 *       );
 *     }
 *     return this._createTodoUseCase;
 *   }
 *
 *   // ... other use case getters
 *
 *   // Controller factory
 *   createTodosController() {
 *     const { TodosController } = require('../controllers/todos.controller.js');
 *     return new TodosController(
 *       this.createTodoUseCase,
 *       this.getTodoUseCase,
 *       this.updateTodoUseCase,
 *       this.deleteTodoUseCase,
 *       this.listTodosUseCase
 *     );
 *   }
 *
 *   async shutdown() {
 *     console.log('🔧 Shutting down infrastructure...');
 *     await this.eventBus.disconnect();
 *     await this.postgres.close();
 *     console.log('✅ Shutdown complete');
 *   }
 * }
 *
 * export function getContainer(): DIContainer {
 *   return DIContainer.getInstance();
 * }
 * ```
 */

/**
 * Base class for DI containers with common patterns
 *
 * Features:
 * - Singleton pattern
 * - Lazy initialization of dependencies
 * - Proper shutdown handling
 * - Support for multiple services
 */
export abstract class ContainerTemplate {
  protected static instance: ContainerTemplate;
  protected initialized = false;
  protected readonly dependencies = new Map<string, unknown>();

  /**
   * Get singleton instance
   */
  static getInstance<T extends ContainerTemplate>(this: new () => T): T {
    if (!ContainerTemplate.instance) {
      ContainerTemplate.instance = new this();
    }
    return ContainerTemplate.instance as T;
  }

  /**
   * Initialize all infrastructure
   * Override to implement custom initialization
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[Container] Already initialized');
      return;
    }

    console.log('[Container] Initializing...');
    await this.initializeInfrastructure();
    this.initialized = true;
    console.log('[Container] Initialized');
  }

  /**
   * Initialize infrastructure components
   * Override to implement custom initialization logic
   */
  protected abstract initializeInfrastructure(): Promise<void>;

  /**
   * Get or create a dependency
   * Use this for lazy initialization
   */
  protected getOrCreate<T>(key: string, factory: () => T): T {
    if (!this.dependencies.has(key)) {
      const instance = factory();
      this.dependencies.set(key, instance);
    }
    return this.dependencies.get(key) as T;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Reset the container (useful for testing)
   */
  reset(): void {
    this.dependencies.clear();
    this.initialized = false;
  }

  /**
   * Shutdown all resources
   * Override to implement custom shutdown logic
   */
  async shutdown(): Promise<void> {
    console.log('[Container] Shutting down...');
    await this.shutdownInfrastructure();
    this.reset();
    console.log('[Container] Shutdown complete');
  }

  /**
   * Shutdown infrastructure components
   * Override to implement custom shutdown logic
   */
  protected abstract shutdownInfrastructure(): Promise<void>;
}

/**
 * Template for containers with telemetry support
 */
export abstract class TelemetryContainerTemplate extends ContainerTemplate {
  protected tracer?: unknown | null;

  /**
   * Initialize OpenTelemetry tracer
   * Override to implement custom telemetry initialization
   */
  protected abstract initializeTelemetry(): Promise<void>;

  /**
   * Get the tracer for use cases and repositories
   */
  getTracer(): unknown | null {
    return this.tracer || null;
  }
}

/**
 * Template for containers with database support
 */
export abstract class DatabaseContainerTemplate extends ContainerTemplate {
  protected abstract get postgres(): { close(): Promise<void> };

  protected async shutdownInfrastructure(): Promise<void> {
    await this.postgres.close();
  }
}

/**
 * Template for containers with event bus support
 */
export abstract class EventContainerTemplate extends ContainerTemplate {
  protected abstract get eventBus(): { disconnect(): Promise<void> };

  protected async shutdownInfrastructure(): Promise<void> {
    await this.eventBus.disconnect();
  }
}

/**
 * Template for containers with cache support
 */
export abstract class CacheContainerTemplate extends ContainerTemplate {
  protected abstract get cache(): { quit(): Promise<void> };

  protected async shutdownInfrastructure(): Promise<void> {
    await this.cache.quit();
  }
}

/**
 * Complete container template with all common features
 *
 * Combines:
 * - Telemetry support
 * - Database support
 * - Event bus support
 * - Cache support
 *
 * Note: This combines methods from all template classes since TypeScript
 * doesn't support multiple inheritance.
 */
export abstract class CompleteContainerTemplate extends ContainerTemplate {
  // Telemetry support
  protected tracer?: unknown | null;

  // Infrastructure
  protected abstract get postgres(): { close(): Promise<void> };
  protected abstract get eventBus(): { disconnect(): Promise<void> };
  protected abstract get cache(): { quit(): Promise<void> };

  protected async initializeTelemetry(): Promise<void> {
    // Override to implement telemetry initialization
    this.tracer = null;
  }

  protected async initializeInfrastructure(): Promise<void> {
    // Override to implement infrastructure initialization
  }

  protected async shutdownInfrastructure(): Promise<void> {
    // Shutdown in reverse order of initialization
    try {
      await this.cache.quit();
    } catch (error) {
      console.error('[Container] Error shutting down cache:', error);
    }

    try {
      await this.eventBus.disconnect();
    } catch (error) {
      console.error('[Container] Error shutting down event bus:', error);
    }

    try {
      await this.postgres.close();
    } catch (error) {
      console.error('[Container] Error shutting down database:', error);
    }
  }

  getTracer(): unknown | null {
    return this.tracer || null;
  }
}

/**
 * Factory function for creating use case instances
 * Handles dependency injection automatically
 */
export class UseCaseFactory {
  constructor(
    private readonly container: {
      getTracer(): unknown | null;
      eventBus: { emit(event: unknown): Promise<void> };
      postgres: { db: any };
      cache?: { get(key: string): Promise<any>; set(key: string, value: any): Promise<void> };
    }
  ) {}

  /**
   * Create a use case instance with dependencies
   */
  create<T extends new (...args: any[]) => any>(
    UseCaseClass: T,
    ...extraDeps: any[]
  ): InstanceType<T> {
    const dependencies = [
      this.container.postgres.db,
      this.container.eventBus,
      this.container.getTracer(),
      ...extraDeps,
    ];

    return new UseCaseClass(...dependencies);
  }
}

/**
 * Factory function for creating repository instances
 */
export class RepositoryFactory {
  constructor(
    private readonly container: {
      getTracer(): unknown | null;
      postgres: { db: any };
    }
  ) {}

  /**
   * Create a repository instance with dependencies
   */
  create<T extends new (...args: any[]) => any>(
    RepositoryClass: T
  ): InstanceType<T> {
    return new RepositoryClass(
      this.container.postgres.db,
      this.container.getTracer()
    );
  }
}
