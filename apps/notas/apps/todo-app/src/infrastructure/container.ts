/**
 * Dependency Injection Container
 *
 * This container extends CompleteContainerTemplate from @oxlayer/snippets
 * which provides common patterns for DI containers with:
 * - Telemetry support
 * - Database support
 * - Event bus support
 * - Cache support
 * - Shutdown handling
 *
 * @see @oxlayer/snippets/config
 */

import type {
  PostgresWorkspaceRepository,
  PostgresTodoRepository,
  PostgresProjectRepository,
  PostgresSectionRepository,
} from '../repositories/index.js';
import {
  createPostgresConnection,
} from '../config/postgres.config.js';
import { createRedisConnection } from '../config/redis.config.js';
import { createEventBus, setupEventHandlers } from '../config/rabbitmq.config.js';
import { getTelemetryClient } from '../config/metrics.config.js';
import { domainEvents, businessMetrics } from '../config/clickhouse.config.js';
import { CompleteContainerTemplate } from '@oxlayer/snippets/config';

/**
 * DI Container for Todo App
 *
 * Extends CompleteContainerTemplate which provides:
 * - Telemetry initialization
 * - Infrastructure shutdown (postgres, eventBus, cache)
 * - Common DI patterns
 */
export class DIContainer extends CompleteContainerTemplate {


  // Infrastructure (private to avoid conflicts with base class getters)
  private _postgres: ReturnType<typeof createPostgresConnection>;
  private _redis: ReturnType<typeof createRedisConnection>;
  private _eventBus!: Awaited<ReturnType<typeof createEventBus>>;

  // Repositories (lazy loaded)
  private _workspaceRepository?: PostgresWorkspaceRepository;
  private _todoRepository?: PostgresTodoRepository;
  private _projectRepository?: PostgresProjectRepository;
  private _sectionRepository?: PostgresSectionRepository;

  // Use cases (lazy loaded)
  private _createTodoUseCase?: any;
  private _getTodosUseCase?: any;
  private _updateTodoUseCase?: any;
  private _deleteTodoUseCase?: any;
  private _createProjectUseCase?: any;
  private _getProjectsUseCase?: any;
  private _updateProjectUseCase?: any;
  private _deleteProjectUseCase?: any;
  private _createSectionUseCase?: any;
  private _getSectionsUseCase?: any;
  private _updateSectionUseCase?: any;
  private _deleteSectionUseCase?: any;
  private _getWorkspacesUseCase?: any;
  private _createWorkspaceUseCase?: any;
  private _updateWorkspaceUseCase?: any;
  private _deleteWorkspaceUseCase?: any;
  private _switchWorkspaceUseCase?: any;

  public constructor() {
    super();
    // Initialize connections
    // Auto-migration runs automatically via the adapter
    this._postgres = createPostgresConnection();
    this._redis = createRedisConnection();
  }



  /**
   * Get the postgres connection for shutdown
   */
  protected override get postgres() {
    return this._postgres;
  }

  /**
   * Get the event bus for shutdown
   */
  protected override get eventBus() {
    return this._eventBus;
  }

  /**
   * Get the cache (redis) for shutdown
   */
  protected override get cache() {
    return this._redis;
  }

  /**
   * Expose postgres publicly for use in repository
   */
  get db() {
    return this._postgres.db;
  }

  /**
   * Expose redis publicly for health checks
   */
  get redis() {
    return this._redis;
  }

  /**
   * Expose event bus publicly for health checks
   */
  get eventBusPublic() {
    return this._eventBus;
  }

  /**
   * Initialize all async resources
   */
  async initialize() {
    console.log('🔧 Initializing infrastructure...');

    // Initialize telemetry from base template
    await this.initializeTelemetry();

    // Connect to RabbitMQ
    this._eventBus = await createEventBus();
    await setupEventHandlers(this._eventBus);
    console.log('✅ Event bus connected');

    // Test database connection (migration already ran via adapter)
    await this._postgres.sql`SELECT 1`;
    console.log('✅ Database connected');

    // Test Redis connection
    await this._redis.set('health', 'ok');
    await this._redis.del('health');
    console.log('✅ Redis connected');

    console.log('');
  }

  /**
   * Initialize telemetry
   * Override to get tracer from the metrics config
   */
  protected override async initializeTelemetry(): Promise<void> {
    const telemetryClient = getTelemetryClient();
    this.tracer = telemetryClient?.getTracer() || null;
    if (this.tracer) {
      console.log('✅ Tracer initialized from telemetry client');
    } else {
      console.log('⚠️ Tracer not available (telemetry may be disabled)');
    }
  }

  /**
   * Get todo repository
   */
  get todoRepository() {
    if (!this._todoRepository) {
      const { PostgresTodoRepository } = require('../repositories/index.js');
      this._todoRepository = new PostgresTodoRepository(
        this._postgres.db,
        this.tracer  // Inject tracer
      );
    }
    return this._todoRepository;
  }

  /**
   * Get create todo use case
   */
  get createTodoUseCase() {
    if (!this._createTodoUseCase) {
      const { CreateTodoUseCase } = require('../use-cases/index.js');
      this._createTodoUseCase = new CreateTodoUseCase(
        this.todoRepository,
        this._eventBus,
        domainEvents,      // ClickHouse domain events
        businessMetrics,   // ClickHouse business metrics
        this.tracer
      );
    }
    return this._createTodoUseCase;
  }

  /**
   * Get get todos use case
   */
  get getTodosUseCase() {
    if (!this._getTodosUseCase) {
      const { GetTodosUseCase } = require('../use-cases/index.js');
      this._getTodosUseCase = new GetTodosUseCase(
        this.todoRepository,
        this.tracer
      );
    }
    return this._getTodosUseCase;
  }

  /**
   * Get update todo use case
   */
  get updateTodoUseCase() {
    if (!this._updateTodoUseCase) {
      const { UpdateTodoUseCase } = require('../use-cases/index.js');
      this._updateTodoUseCase = new UpdateTodoUseCase(
        this.todoRepository,
        this._eventBus,
        domainEvents,      // ClickHouse domain events
        businessMetrics,   // ClickHouse business metrics
        this.tracer
      );
    }
    return this._updateTodoUseCase;
  }

  /**
   * Get delete todo use case
   */
  get deleteTodoUseCase() {
    if (!this._deleteTodoUseCase) {
      const { DeleteTodoUseCase } = require('../use-cases/index.js');
      this._deleteTodoUseCase = new DeleteTodoUseCase(
        this.todoRepository,
        this._eventBus,
        domainEvents,      // ClickHouse domain events
        businessMetrics,   // ClickHouse business metrics
        this.tracer
      );
    }
    return this._deleteTodoUseCase;
  }

  /**
   * Get project repository
   */
  get projectRepository() {
    if (!this._projectRepository) {
      const { PostgresProjectRepository } = require('../repositories/index.js');
      this._projectRepository = new PostgresProjectRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._projectRepository;
  }

  /**
   * Get section repository
   */
  get sectionRepository() {
    if (!this._sectionRepository) {
      const { PostgresSectionRepository } = require('../repositories/index.js');
      this._sectionRepository = new PostgresSectionRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._sectionRepository;
  }

  /**
   * Get workspace repository
   */
  get workspaceRepository() {
    if (!this._workspaceRepository) {
      const { PostgresWorkspaceRepository } = require('../repositories/index.js');
      this._workspaceRepository = new PostgresWorkspaceRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._workspaceRepository;
  }

  /**
   * Get create project use case
   */
  get createProjectUseCase() {
    if (!this._createProjectUseCase) {
      const { CreateProjectUseCase } = require('../use-cases/index.js');
      this._createProjectUseCase = new CreateProjectUseCase(
        this.projectRepository,
        this._eventBus,
        this.tracer
      );
    }
    return this._createProjectUseCase;
  }

  /**
   * Get get projects use case
   */
  get getProjectsUseCase() {
    if (!this._getProjectsUseCase) {
      const { GetProjectsUseCase } = require('../use-cases/index.js');
      this._getProjectsUseCase = new GetProjectsUseCase(
        this.projectRepository,
        this.tracer
      );
    }
    return this._getProjectsUseCase;
  }

  /**
   * Get update project use case
   */
  get updateProjectUseCase() {
    if (!this._updateProjectUseCase) {
      const { UpdateProjectUseCase } = require('../use-cases/index.js');
      this._updateProjectUseCase = new UpdateProjectUseCase(
        this.projectRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateProjectUseCase;
  }

  /**
   * Get delete project use case
   */
  get deleteProjectUseCase() {
    if (!this._deleteProjectUseCase) {
      const { DeleteProjectUseCase } = require('../use-cases/index.js');
      this._deleteProjectUseCase = new DeleteProjectUseCase(
        this.projectRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteProjectUseCase;
  }

  /**
   * Get create section use case
   */
  get createSectionUseCase() {
    if (!this._createSectionUseCase) {
      const { CreateSectionUseCase } = require('../use-cases/index.js');
      this._createSectionUseCase = new CreateSectionUseCase(
        this.sectionRepository,
        this._eventBus,
        this.tracer
      );
    }
    return this._createSectionUseCase;
  }

  /**
   * Get get sections use case
   */
  get getSectionsUseCase() {
    if (!this._getSectionsUseCase) {
      const { GetSectionsUseCase } = require('../use-cases/index.js');
      this._getSectionsUseCase = new GetSectionsUseCase(
        this.sectionRepository,
        this.tracer
      );
    }
    return this._getSectionsUseCase;
  }

  /**
   * Get update section use case
   */
  get updateSectionUseCase() {
    if (!this._updateSectionUseCase) {
      const { UpdateSectionUseCase } = require('../use-cases/index.js');
      this._updateSectionUseCase = new UpdateSectionUseCase(
        this.sectionRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateSectionUseCase;
  }

  /**
   * Get delete section use case
   */
  get deleteSectionUseCase() {
    if (!this._deleteSectionUseCase) {
      const { DeleteSectionUseCase } = require('../use-cases/index.js');
      this._deleteSectionUseCase = new DeleteSectionUseCase(
        this.sectionRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteSectionUseCase;
  }

  /**
   * Get get workspaces use case
   */
  get getWorkspacesUseCase() {
    if (!this._getWorkspacesUseCase) {
      const { GetWorkspacesUseCase } = require('../use-cases/workspaces/index.js');
      this._getWorkspacesUseCase = new GetWorkspacesUseCase(
        this.workspaceRepository,
        this.tracer
      );
    }
    return this._getWorkspacesUseCase;
  }

  /**
   * Get create workspace use case
   */
  get createWorkspaceUseCase() {
    if (!this._createWorkspaceUseCase) {
      const { CreateWorkspaceUseCase } = require('../use-cases/workspaces/index.js');
      this._createWorkspaceUseCase = new CreateWorkspaceUseCase(
        this.workspaceRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._createWorkspaceUseCase;
  }

  /**
   * Get update workspace use case
   */
  get updateWorkspaceUseCase() {
    if (!this._updateWorkspaceUseCase) {
      const { UpdateWorkspaceUseCase } = require('../use-cases/workspaces/index.js');
      this._updateWorkspaceUseCase = new UpdateWorkspaceUseCase(
        this.workspaceRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateWorkspaceUseCase;
  }

  /**
   * Get delete workspace use case
   */
  get deleteWorkspaceUseCase() {
    if (!this._deleteWorkspaceUseCase) {
      const { DeleteWorkspaceUseCase } = require('../use-cases/workspaces/index.js');
      this._deleteWorkspaceUseCase = new DeleteWorkspaceUseCase(
        this.workspaceRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteWorkspaceUseCase;
  }

  /**
   * Get switch workspace use case
   */
  get switchWorkspaceUseCase() {
    if (!this._switchWorkspaceUseCase) {
      const { SwitchWorkspaceUseCase } = require('../use-cases/workspaces/index.js');
      this._switchWorkspaceUseCase = new SwitchWorkspaceUseCase(
        this.workspaceRepository,
        this.tracer
      );
    }
    return this._switchWorkspaceUseCase;
  }

  /**
   * Create todos controller
   */
  createTodosController() {
    const { TodosController } = require('../controllers/todos.controller.js');
    return new TodosController(
      this.createTodoUseCase,
      this.getTodosUseCase,
      this.updateTodoUseCase,
      this.deleteTodoUseCase
    );
  }

  /**
   * Create projects controller
   */
  createProjectsController() {
    const { ProjectsController } = require('../controllers/projects.controller.js');
    return new ProjectsController(
      this.createProjectUseCase,
      this.getProjectsUseCase,
      this.updateProjectUseCase,
      this.deleteProjectUseCase
    );
  }

  /**
   * Create sections controller
   */
  createSectionsController() {
    const { SectionsController } = require('../controllers/sections.controller.js');
    return new SectionsController(
      this.createSectionUseCase,
      this.getSectionsUseCase,
      this.updateSectionUseCase,
      this.deleteSectionUseCase
    );
  }

  /**
   * Create voice controller
   */
  createVoiceController() {
    const { VoiceController } = require('../controllers/voice.controller.js');
    return new VoiceController();
  }

  /**
   * Create workspaces controller
   */
  createWorkspacesController() {
    const { WorkspacesController } = require('../controllers/workspaces.controller.js');
    return new WorkspacesController(
      this.getWorkspacesUseCase,
      this.createWorkspaceUseCase,
      this.updateWorkspaceUseCase,
      this.deleteWorkspaceUseCase,
      this.switchWorkspaceUseCase
    );
  }
}

/**
 * Get container instance
 */
export function getContainer(): DIContainer {
  return DIContainer.getInstance();
}
