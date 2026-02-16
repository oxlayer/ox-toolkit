/**
 * Dependency Injection Container
 *
 * Wire up all dependencies for the control panel application
 * following the DDD pattern: Controllers -> Use Cases -> Repositories
 */

import type {
  IOrganizationRepository,
  IDeveloperRepository,
  ILicenseRepository,
  IApiKeyRepository,
  IDeviceSessionRepository,
} from '../../repositories/index.js';

import {
  PostgresOrganizationRepository,
  PostgresDeveloperRepository,
  PostgresLicenseRepository,
  PostgresApiKeyRepository,
  PostgresDeviceSessionRepository,
} from '../../repositories/index-impl.js';

// Use Cases
import {
  CreateOrganizationUseCase,
  UpdateOrganizationUseCase,
  DeleteOrganizationUseCase,
  GetOrganizationUseCase,
  ListOrganizationsUseCase,
  GetOrganizationBySlugUseCase,
} from '../../use-cases/organizations/index.js';

import {
  CreateDeveloperUseCase,
  UpdateDeveloperUseCase,
  DeleteDeveloperUseCase,
  GetDeveloperUseCase,
  ListDevelopersByOrganizationUseCase,
} from '../../use-cases/developers/index.js';

import {
  CreateLicenseUseCase,
  UpdateLicenseUseCase,
  DeleteLicenseUseCase,
  GetLicenseUseCase,
  ListLicensesByOrganizationUseCase,
  ActivateLicenseUseCase,
  SuspendLicenseUseCase,
  RevokeLicenseUseCase,
  AddPackageToLicenseUseCase,
  RemovePackageFromLicenseUseCase,
  UpdateCapabilityLimitsUseCase,
  RemoveCapabilityFromLicenseUseCase,
} from '../../use-cases/licenses/index.js';

import {
  CreateApiKeyUseCase,
  UpdateApiKeyUseCase,
  DeleteApiKeyUseCase,
  GetApiKeyUseCase,
  ListApiKeysByOrganizationUseCase,
  ListApiKeysByDeveloperUseCase,
  ListApiKeysByLicenseUseCase,
  RevokeApiKeyUseCase,
} from '../../use-cases/api-keys/index.js';

// Controllers
import {
  OrganizationsController,
  DevelopersController,
  LicensesController,
  ApiKeysController,
} from '../../controllers/index.js';

// Device Auth
import { DeviceAuthService } from '../../services/device-auth.service.js';
import { KeycloakSyncService } from '../../services/keycloak-sync.service.js';
import { DeviceAuthController } from '../../controllers/device-auth.controller.js';

// Capability Resolution
import { CapabilityResolutionService } from '../../services/capability-resolution.js';
import { CapabilityResolutionController } from '../../controllers/capability-resolution.controller.js';

// Database
import { db } from '../../db/index.js';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from '../../db/schema.js';

/**
 * Application Container
 *
 * Holds all the dependencies for the application
 */
export class AppContainer {
  private static instance: AppContainer | null = null;

  // Repositories
  public readonly organizationRepository: IOrganizationRepository;
  public readonly developerRepository: IDeveloperRepository;
  public readonly licenseRepository: ILicenseRepository;
  public readonly apiKeyRepository: IApiKeyRepository;
  public readonly deviceSessionRepository: IDeviceSessionRepository;

  // Use Cases - Organizations
  public readonly createOrganizationUseCase: CreateOrganizationUseCase;
  public readonly updateOrganizationUseCase: UpdateOrganizationUseCase;
  public readonly deleteOrganizationUseCase: DeleteOrganizationUseCase;
  public readonly getOrganizationUseCase: GetOrganizationUseCase;
  public readonly listOrganizationsUseCase: ListOrganizationsUseCase;
  public readonly getOrganizationBySlugUseCase: GetOrganizationBySlugUseCase;

  // Use Cases - Developers
  public readonly createDeveloperUseCase: CreateDeveloperUseCase;
  public readonly updateDeveloperUseCase: UpdateDeveloperUseCase;
  public readonly deleteDeveloperUseCase: DeleteDeveloperUseCase;
  public readonly getDeveloperUseCase: GetDeveloperUseCase;
  public readonly listDevelopersByOrganizationUseCase: ListDevelopersByOrganizationUseCase;

  // Use Cases - Licenses
  public readonly createLicenseUseCase: CreateLicenseUseCase;
  public readonly updateLicenseUseCase: UpdateLicenseUseCase;
  public readonly deleteLicenseUseCase: DeleteLicenseUseCase;
  public readonly getLicenseUseCase: GetLicenseUseCase;
  public readonly listLicensesByOrganizationUseCase: ListLicensesByOrganizationUseCase;
  public readonly activateLicenseUseCase: ActivateLicenseUseCase;
  public readonly suspendLicenseUseCase: SuspendLicenseUseCase;
  public readonly revokeLicenseUseCase: RevokeLicenseUseCase;
  public readonly addPackageToLicenseUseCase: AddPackageToLicenseUseCase;
  public readonly removePackageFromLicenseUseCase: RemovePackageFromLicenseUseCase;
  public readonly updateCapabilityLimitsUseCase: UpdateCapabilityLimitsUseCase;
  public readonly removeCapabilityFromLicenseUseCase: RemoveCapabilityFromLicenseUseCase;

  // Use Cases - API Keys
  public readonly createApiKeyUseCase: CreateApiKeyUseCase;
  public readonly updateApiKeyUseCase: UpdateApiKeyUseCase;
  public readonly deleteApiKeyUseCase: DeleteApiKeyUseCase;
  public readonly getApiKeyUseCase: GetApiKeyUseCase;
  public readonly listApiKeysByOrganizationUseCase: ListApiKeysByOrganizationUseCase;
  public readonly listApiKeysByDeveloperUseCase: ListApiKeysByDeveloperUseCase;
  public readonly listApiKeysByLicenseUseCase: ListApiKeysByLicenseUseCase;
  public readonly revokeApiKeyUseCase: RevokeApiKeyUseCase;

  // Controllers
  public readonly organizationsController: OrganizationsController;
  public readonly developersController: DevelopersController;
  public readonly licensesController: LicensesController;
  public readonly apiKeysController: ApiKeysController;
  public readonly keycloakSyncService: KeycloakSyncService;
  public readonly deviceAuthService: DeviceAuthService;
  public readonly deviceAuthController: DeviceAuthController;
  public readonly capabilityResolutionService: CapabilityResolutionService;
  public readonly capabilityResolutionController: CapabilityResolutionController;

  /**
   * Get authenticated developer ID from request
   * For device approval endpoint, extracts developer ID from authenticated session
   */
  getDeveloperId(request: Request): string {
    // TODO: Implement proper authentication middleware
    // For now, use hardcoded dev ID in development mode
    if (process.env.MIDDLEWARE_DEV_MODE === 'true') {
      return 'dev-developer-id';
    }
    throw new Error('Authentication required');
  }

  /**
   * Get authenticated organization ID from request
   * For device approval endpoint, extracts organization ID from authenticated session
   */
  getOrganizationId(request: Request): string {
    // TODO: Implement proper authentication middleware
    // For now, use hardcoded dev org in development mode
    if (process.env.MIDDLEWARE_DEV_MODE === 'true') {
      return 'dev-org-id';
    }
    throw new Error('Authentication required');
  }

  private constructor(db: PostgresJsDatabase<typeof schema>) {
    // Initialize Repositories (use Drizzle ORM)
    this.organizationRepository = new PostgresOrganizationRepository(db);
    this.developerRepository = new PostgresDeveloperRepository(db);
    this.licenseRepository = new PostgresLicenseRepository(db);
    this.apiKeyRepository = new PostgresApiKeyRepository(db);
    this.deviceSessionRepository = new PostgresDeviceSessionRepository(db);

    // Keycloak Sync Service
    this.keycloakSyncService = new KeycloakSyncService(this.organizationRepository, this.developerRepository);

    // Device Auth
    this.deviceAuthService = new DeviceAuthService(this.deviceSessionRepository, this.keycloakSyncService);
    this.deviceAuthController = new DeviceAuthController(
      this.deviceAuthService,
      (request: Request) => this.getDeveloperId(request),
      (request: Request) => this.getOrganizationId(request)
    );

    // Capability Resolution
    this.capabilityResolutionService = new CapabilityResolutionService(
      this.apiKeyRepository,
      this.licenseRepository,
      db
    );
    this.capabilityResolutionController = new CapabilityResolutionController(
      this.capabilityResolutionService
    );

    // Initialize Use Cases - Organizations
    this.createOrganizationUseCase = new CreateOrganizationUseCase(
      this.organizationRepository
    );
    this.updateOrganizationUseCase = new UpdateOrganizationUseCase(
      this.organizationRepository
    );
    this.deleteOrganizationUseCase = new DeleteOrganizationUseCase(
      this.organizationRepository,
      this.developerRepository
    );
    this.getOrganizationUseCase = new GetOrganizationUseCase(
      this.organizationRepository
    );
    this.listOrganizationsUseCase = new ListOrganizationsUseCase(
      this.organizationRepository
    );
    this.getOrganizationBySlugUseCase = new GetOrganizationBySlugUseCase(
      this.organizationRepository
    );

    // Initialize Use Cases - Developers
    this.createDeveloperUseCase = new CreateDeveloperUseCase(
      this.developerRepository,
      this.organizationRepository
    );
    this.updateDeveloperUseCase = new UpdateDeveloperUseCase(
      this.developerRepository
    );
    this.deleteDeveloperUseCase = new DeleteDeveloperUseCase(
      this.developerRepository
    );
    this.getDeveloperUseCase = new GetDeveloperUseCase(
      this.developerRepository
    );
    this.listDevelopersByOrganizationUseCase = new ListDevelopersByOrganizationUseCase(
      this.developerRepository
    );

    // Initialize Use Cases - Licenses
    this.createLicenseUseCase = new CreateLicenseUseCase(
      this.licenseRepository,
      this.organizationRepository
    );
    this.updateLicenseUseCase = new UpdateLicenseUseCase(
      this.licenseRepository
    );
    this.deleteLicenseUseCase = new DeleteLicenseUseCase(
      this.licenseRepository
    );
    this.getLicenseUseCase = new GetLicenseUseCase(
      this.licenseRepository
    );
    this.listLicensesByOrganizationUseCase = new ListLicensesByOrganizationUseCase(
      this.licenseRepository
    );
    this.activateLicenseUseCase = new ActivateLicenseUseCase(
      this.licenseRepository
    );
    this.suspendLicenseUseCase = new SuspendLicenseUseCase(
      this.licenseRepository
    );
    this.revokeLicenseUseCase = new RevokeLicenseUseCase(
      this.licenseRepository
    );
    this.addPackageToLicenseUseCase = new AddPackageToLicenseUseCase(
      this.licenseRepository
    );
    this.removePackageFromLicenseUseCase = new RemovePackageFromLicenseUseCase(
      this.licenseRepository
    );
    this.updateCapabilityLimitsUseCase = new UpdateCapabilityLimitsUseCase(
      this.licenseRepository
    );
    this.removeCapabilityFromLicenseUseCase = new RemoveCapabilityFromLicenseUseCase(
      this.licenseRepository
    );

    // Initialize Use Cases - API Keys
    this.createApiKeyUseCase = new CreateApiKeyUseCase(
      this.apiKeyRepository,
      this.licenseRepository
    );
    this.updateApiKeyUseCase = new UpdateApiKeyUseCase(
      this.apiKeyRepository
    );
    this.deleteApiKeyUseCase = new DeleteApiKeyUseCase(
      this.apiKeyRepository
    );
    this.getApiKeyUseCase = new GetApiKeyUseCase(
      this.apiKeyRepository
    );
    this.listApiKeysByOrganizationUseCase = new ListApiKeysByOrganizationUseCase(
      this.apiKeyRepository
    );
    this.listApiKeysByDeveloperUseCase = new ListApiKeysByDeveloperUseCase(
      this.apiKeyRepository
    );
    this.listApiKeysByLicenseUseCase = new ListApiKeysByLicenseUseCase(
      this.apiKeyRepository
    );
    this.revokeApiKeyUseCase = new RevokeApiKeyUseCase(
      this.apiKeyRepository
    );

    // Initialize Controllers
    this.organizationsController = new OrganizationsController(
      this.createOrganizationUseCase,
      this.updateOrganizationUseCase,
      this.deleteOrganizationUseCase,
      this.getOrganizationUseCase,
      this.listOrganizationsUseCase,
      this.getOrganizationBySlugUseCase
    );

    this.developersController = new DevelopersController(
      this.createDeveloperUseCase,
      this.updateDeveloperUseCase,
      this.deleteDeveloperUseCase,
      this.getDeveloperUseCase,
      this.listDevelopersByOrganizationUseCase
    );

    this.licensesController = new LicensesController(
      this.createLicenseUseCase,
      this.updateLicenseUseCase,
      this.deleteLicenseUseCase,
      this.getLicenseUseCase,
      this.listLicensesByOrganizationUseCase,
      this.activateLicenseUseCase,
      this.suspendLicenseUseCase,
      this.revokeLicenseUseCase,
      this.addPackageToLicenseUseCase,
      this.removePackageFromLicenseUseCase,
      this.updateCapabilityLimitsUseCase,
      this.removeCapabilityFromLicenseUseCase
    );

    this.apiKeysController = new ApiKeysController(
      this.createApiKeyUseCase,
      this.updateApiKeyUseCase,
      this.deleteApiKeyUseCase,
      this.getApiKeyUseCase,
      this.listApiKeysByOrganizationUseCase,
      this.listApiKeysByDeveloperUseCase,
      this.listApiKeysByLicenseUseCase,
      this.revokeApiKeyUseCase
    );
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AppContainer {
    if (!AppContainer.instance) {
      AppContainer.instance = new AppContainer(db);
    }
    return AppContainer.instance;
  }

  /**
   * Reset the container (useful for testing)
   */
  public static reset(): void {
    AppContainer.instance = null;
  }
}

/**
 * Get the app container instance
 */
export function getContainer(): AppContainer {
  return AppContainer.getInstance();
}
