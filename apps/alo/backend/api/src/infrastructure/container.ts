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
 */

import type {
  PostgresEstablishmentRepository,
  PostgresUserRepository,
  PostgresDeliveryManRepository,
  PostgresServiceProviderRepository,
  PostgresOnboardingLeadRepository,
} from '../repositories/index.js';
import { createPostgresConnection } from '../config/postgres.config.js';
import { createRedisConnection } from '../config/redis.config.js';
import { createEventBus, setupEventHandlers } from '../config/rabbitmq.config.js';
import { getTelemetryClient } from '../config/metrics.config.js';
import { domainEvents, businessMetrics } from '../config/clickhouse.config.js';
import { CompleteContainerTemplate } from '@oxlayer/snippets/config';

/**
 * DI Container for Alo Manager
 */
export class DIContainer extends CompleteContainerTemplate {
  // Infrastructure (private to avoid conflicts with base class getters)
  private _postgres!: Awaited<ReturnType<typeof createPostgresConnection>>;
  private _redis: ReturnType<typeof createRedisConnection>;
  private _eventBus!: Awaited<ReturnType<typeof createEventBus>>;

  // Repositories (lazy loaded)
  private _establishmentRepository?: PostgresEstablishmentRepository;
  private _userRepository?: PostgresUserRepository;
  private _deliveryManRepository?: PostgresDeliveryManRepository;
  private _serviceProviderRepository?: PostgresServiceProviderRepository;
  private _onboardingLeadRepository?: PostgresOnboardingLeadRepository;

  // Use cases (lazy loaded) - Establishments
  private _createEstablishmentUseCase?: any;
  private _listEstablishmentsUseCase?: any;
  private _getEstablishmentUseCase?: any;
  private _updateEstablishmentUseCase?: any;
  private _deleteEstablishmentUseCase?: any;

  // Use cases (lazy loaded) - Users
  private _createUserUseCase?: any;
  private _listUsersUseCase?: any;
  private _updateUserUseCase?: any;
  private _deleteUserUseCase?: any;

  // Use cases (lazy loaded) - Delivery Men
  private _createDeliveryManUseCase?: any;
  private _listDeliveryMenUseCase?: any;
  private _getDeliveryManUseCase?: any;
  private _updateDeliveryManUseCase?: any;
  private _deleteDeliveryManUseCase?: any;

  // Use cases (lazy loaded) - Service Providers
  private _createServiceProviderUseCase?: any;
  private _listServiceProvidersUseCase?: any;
  private _getServiceProviderUseCase?: any;
  private _updateServiceProviderUseCase?: any;
  private _deleteServiceProviderUseCase?: any;

  // Use cases (lazy loaded) - Onboarding Leads
  private _createOnboardingLeadUseCase?: any;
  private _listOnboardingLeadsUseCase?: any;
  private _getOnboardingLeadUseCase?: any;
  private _updateOnboardingLeadUseCase?: any;
  private _deleteOnboardingLeadUseCase?: any;

  public constructor() {
    super();
    // Initialize connections
    // Note: postgres is initialized in initialize() method because it's async
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

    // Initialize PostgreSQL (creates database if needed, runs migrations)
    this._postgres = await createPostgresConnection();
    console.log('✅ PostgreSQL initialized');

    // Connect to RabbitMQ
    this._eventBus = await createEventBus();
    await setupEventHandlers(this._eventBus);
    console.log('✅ Event bus connected');

    // Test Redis connection
    await this._redis.set('health', 'ok');
    await this._redis.del('health');
    console.log('✅ Redis connected');

    console.log('');
  }

  /**
   * Initialize telemetry
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

  // ============ ESTABLISHMENTS ============

  /**
   * Get establishment repository
   */
  get establishmentRepository() {
    if (!this._establishmentRepository) {
      const { PostgresEstablishmentRepository } = require('../repositories/index.js');
      this._establishmentRepository = new PostgresEstablishmentRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._establishmentRepository;
  }

  get createEstablishmentUseCase() {
    if (!this._createEstablishmentUseCase) {
      const { CreateEstablishmentUseCase } = require('../use-cases/index.js');
      this._createEstablishmentUseCase = new CreateEstablishmentUseCase(
        this.establishmentRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._createEstablishmentUseCase;
  }

  get listEstablishmentsUseCase() {
    if (!this._listEstablishmentsUseCase) {
      const { ListEstablishmentsUseCase } = require('../use-cases/index.js');
      this._listEstablishmentsUseCase = new ListEstablishmentsUseCase(
        this.establishmentRepository,
        this.tracer
      );
    }
    return this._listEstablishmentsUseCase;
  }

  get getEstablishmentUseCase() {
    if (!this._getEstablishmentUseCase) {
      const { GetEstablishmentUseCase } = require('../use-cases/index.js');
      this._getEstablishmentUseCase = new GetEstablishmentUseCase(
        this.establishmentRepository,
        this.tracer
      );
    }
    return this._getEstablishmentUseCase;
  }

  get updateEstablishmentUseCase() {
    if (!this._updateEstablishmentUseCase) {
      const { UpdateEstablishmentUseCase } = require('../use-cases/index.js');
      this._updateEstablishmentUseCase = new UpdateEstablishmentUseCase(
        this.establishmentRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateEstablishmentUseCase;
  }

  get deleteEstablishmentUseCase() {
    if (!this._deleteEstablishmentUseCase) {
      const { DeleteEstablishmentUseCase } = require('../use-cases/index.js');
      this._deleteEstablishmentUseCase = new DeleteEstablishmentUseCase(
        this.establishmentRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteEstablishmentUseCase;
  }

  // ============ USERS ============

  /**
   * Get user repository
   */
  get userRepository() {
    if (!this._userRepository) {
      const { PostgresUserRepository } = require('../repositories/index.js');
      this._userRepository = new PostgresUserRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._userRepository;
  }

  get createUserUseCase() {
    if (!this._createUserUseCase) {
      const { CreateUserUseCase } = require('../use-cases/index.js');
      this._createUserUseCase = new CreateUserUseCase(
        this.userRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._createUserUseCase;
  }

  get listUsersUseCase() {
    if (!this._listUsersUseCase) {
      const { ListUsersUseCase } = require('../use-cases/index.js');
      this._listUsersUseCase = new ListUsersUseCase(
        this.userRepository,
        this.tracer
      );
    }
    return this._listUsersUseCase;
  }

  get updateUserUseCase() {
    if (!this._updateUserUseCase) {
      const { UpdateUserUseCase } = require('../use-cases/index.js');
      this._updateUserUseCase = new UpdateUserUseCase(
        this.userRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateUserUseCase;
  }

  get deleteUserUseCase() {
    if (!this._deleteUserUseCase) {
      const { DeleteUserUseCase } = require('../use-cases/index.js');
      this._deleteUserUseCase = new DeleteUserUseCase(
        this.userRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteUserUseCase;
  }

  // ============ DELIVERY MEN ============

  /**
   * Get delivery man repository
   */
  get deliveryManRepository() {
    if (!this._deliveryManRepository) {
      const { PostgresDeliveryManRepository } = require('../repositories/index.js');
      this._deliveryManRepository = new PostgresDeliveryManRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._deliveryManRepository;
  }

  get createDeliveryManUseCase() {
    if (!this._createDeliveryManUseCase) {
      const { CreateDeliveryManUseCase } = require('../use-cases/index.js');
      this._createDeliveryManUseCase = new CreateDeliveryManUseCase(
        this.deliveryManRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._createDeliveryManUseCase;
  }

  get listDeliveryMenUseCase() {
    if (!this._listDeliveryMenUseCase) {
      const { ListDeliveryMenUseCase } = require('../use-cases/index.js');
      this._listDeliveryMenUseCase = new ListDeliveryMenUseCase(
        this.deliveryManRepository,
        this.tracer
      );
    }
    return this._listDeliveryMenUseCase;
  }

  get getDeliveryManUseCase() {
    if (!this._getDeliveryManUseCase) {
      const { GetDeliveryManUseCase } = require('../use-cases/index.js');
      this._getDeliveryManUseCase = new GetDeliveryManUseCase(
        this.deliveryManRepository,
        this.tracer
      );
    }
    return this._getDeliveryManUseCase;
  }

  get updateDeliveryManUseCase() {
    if (!this._updateDeliveryManUseCase) {
      const { UpdateDeliveryManUseCase } = require('../use-cases/index.js');
      this._updateDeliveryManUseCase = new UpdateDeliveryManUseCase(
        this.deliveryManRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateDeliveryManUseCase;
  }

  get deleteDeliveryManUseCase() {
    if (!this._deleteDeliveryManUseCase) {
      const { DeleteDeliveryManUseCase } = require('../use-cases/index.js');
      this._deleteDeliveryManUseCase = new DeleteDeliveryManUseCase(
        this.deliveryManRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteDeliveryManUseCase;
  }

  // ============ SERVICE PROVIDERS ============

  /**
   * Get service provider repository
   */
  get serviceProviderRepository() {
    if (!this._serviceProviderRepository) {
      const { PostgresServiceProviderRepository } = require('../repositories/index.js');
      this._serviceProviderRepository = new PostgresServiceProviderRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._serviceProviderRepository;
  }

  get createServiceProviderUseCase() {
    if (!this._createServiceProviderUseCase) {
      const { CreateServiceProviderUseCase } = require('../use-cases/index.js');
      this._createServiceProviderUseCase = new CreateServiceProviderUseCase(
        this.serviceProviderRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._createServiceProviderUseCase;
  }

  get listServiceProvidersUseCase() {
    if (!this._listServiceProvidersUseCase) {
      const { ListServiceProvidersUseCase } = require('../use-cases/index.js');
      this._listServiceProvidersUseCase = new ListServiceProvidersUseCase(
        this.serviceProviderRepository,
        this.tracer
      );
    }
    return this._listServiceProvidersUseCase;
  }

  get getServiceProviderUseCase() {
    if (!this._getServiceProviderUseCase) {
      const { GetServiceProviderUseCase } = require('../use-cases/index.js');
      this._getServiceProviderUseCase = new GetServiceProviderUseCase(
        this.serviceProviderRepository,
        this.tracer
      );
    }
    return this._getServiceProviderUseCase;
  }

  get updateServiceProviderUseCase() {
    if (!this._updateServiceProviderUseCase) {
      const { UpdateServiceProviderUseCase } = require('../use-cases/index.js');
      this._updateServiceProviderUseCase = new UpdateServiceProviderUseCase(
        this.serviceProviderRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateServiceProviderUseCase;
  }

  get deleteServiceProviderUseCase() {
    if (!this._deleteServiceProviderUseCase) {
      const { DeleteServiceProviderUseCase } = require('../use-cases/index.js');
      this._deleteServiceProviderUseCase = new DeleteServiceProviderUseCase(
        this.serviceProviderRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteServiceProviderUseCase;
  }

  // ============ ONBOARDING LEADS ============

  /**
   * Get onboarding lead repository
   */
  get onboardingLeadRepository() {
    if (!this._onboardingLeadRepository) {
      const { PostgresOnboardingLeadRepository } = require('../repositories/index.js');
      this._onboardingLeadRepository = new PostgresOnboardingLeadRepository(
        this._postgres.db,
        this.tracer
      );
    }
    return this._onboardingLeadRepository;
  }

  get createOnboardingLeadUseCase() {
    if (!this._createOnboardingLeadUseCase) {
      const { CreateOnboardingLeadUseCase } = require('../use-cases/index.js');
      this._createOnboardingLeadUseCase = new CreateOnboardingLeadUseCase(
        this.onboardingLeadRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._createOnboardingLeadUseCase;
  }

  get listOnboardingLeadsUseCase() {
    if (!this._listOnboardingLeadsUseCase) {
      const { ListOnboardingLeadsUseCase } = require('../use-cases/index.js');
      this._listOnboardingLeadsUseCase = new ListOnboardingLeadsUseCase(
        this.onboardingLeadRepository,
        this.tracer
      );
    }
    return this._listOnboardingLeadsUseCase;
  }

  get getOnboardingLeadUseCase() {
    if (!this._getOnboardingLeadUseCase) {
      const { GetOnboardingLeadUseCase } = require('../use-cases/index.js');
      this._getOnboardingLeadUseCase = new GetOnboardingLeadUseCase(
        this.onboardingLeadRepository,
        this.tracer
      );
    }
    return this._getOnboardingLeadUseCase;
  }

  get updateOnboardingLeadUseCase() {
    if (!this._updateOnboardingLeadUseCase) {
      const { UpdateOnboardingLeadUseCase } = require('../use-cases/index.js');
      this._updateOnboardingLeadUseCase = new UpdateOnboardingLeadUseCase(
        this.onboardingLeadRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._updateOnboardingLeadUseCase;
  }

  get deleteOnboardingLeadUseCase() {
    if (!this._deleteOnboardingLeadUseCase) {
      const { DeleteOnboardingLeadUseCase } = require('../use-cases/index.js');
      this._deleteOnboardingLeadUseCase = new DeleteOnboardingLeadUseCase(
        this.onboardingLeadRepository,
        this._eventBus,
        domainEvents,
        businessMetrics,
        this.tracer
      );
    }
    return this._deleteOnboardingLeadUseCase;
  }

  // ============ CONTROLLERS ============

  /**
   * Create establishments controller
   */
  createEstablishmentsController() {
    const { EstablishmentsController } = require('../controllers/index.js');
    return new EstablishmentsController(
      this.createEstablishmentUseCase,
      this.listEstablishmentsUseCase,
      this.getEstablishmentUseCase,
      this.updateEstablishmentUseCase,
      this.deleteEstablishmentUseCase
    );
  }

  /**
   * Create users controller
   */
  createUsersController() {
    const { UsersController } = require('../controllers/index.js');
    return new UsersController(
      this.createUserUseCase,
      this.listUsersUseCase,
      this.updateUserUseCase,
      this.deleteUserUseCase
    );
  }

  /**
   * Create delivery men controller
   */
  createDeliveryMenController() {
    const { DeliveryMenController } = require('../controllers/index.js');
    return new DeliveryMenController(
      this.createDeliveryManUseCase,
      this.listDeliveryMenUseCase,
      this.getDeliveryManUseCase,
      this.updateDeliveryManUseCase,
      this.deleteDeliveryManUseCase
    );
  }

  /**
   * Create service providers controller
   */
  createServiceProvidersController() {
    const { ServiceProvidersController } = require('../controllers/index.js');
    return new ServiceProvidersController(
      this.createServiceProviderUseCase,
      this.listServiceProvidersUseCase,
      this.getServiceProviderUseCase,
      this.updateServiceProviderUseCase,
      this.deleteServiceProviderUseCase
    );
  }

  /**
   * Create onboarding leads controller
   */
  createOnboardingLeadsController() {
    const { OnboardingLeadsController } = require('../controllers/index.js');
    return new OnboardingLeadsController(
      this.createOnboardingLeadUseCase,
      this.listOnboardingLeadsUseCase,
      this.getOnboardingLeadUseCase,
      this.updateOnboardingLeadUseCase,
      this.deleteOnboardingLeadUseCase
    );
  }
}

/**
 * Get container instance
 */
export function getContainer(): DIContainer {
  return DIContainer.getInstance();
}
