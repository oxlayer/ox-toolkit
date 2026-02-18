/**
 * Global OxLayer Infrastructure Service
 *
 * Manages static global infrastructure and runtime tenant provisioning
 *
 * Architecture:
 * - Layer 1: Physical Infra (static Docker Compose - never modified)
 * - Layer 2: Tenant Provisioner (runtime SQL/CLI/API calls)
 * - Layer 3: Project Registry (JSON state tracking)
 *
 * Safety Features:
 * - Concurrency locking (PID file)
 * - Atomic registry writes (tmp + rename)
 * - Credential security (chmod 600)
 */

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { LockManager } from './lock-manager';
import { RegistryManager } from './registry-manager';
import { ContainerManager } from './container-manager';
import { ProvisionerService } from './provisioner.service';
import { DoctorService } from './doctor.service';
import { ProjectConfig, ProjectsRegistry } from './types';
import { generateDockerCompose, promptServiceSelection, ensureDependencies } from './utils';
import { CORE_SERVICES, ALL_SERVICES, getServiceConfigs } from './constants';

export class GlobalInfraService {
  private readonly OXLAYER_DIR = process.env.HOME + '/.oxlayer';
  private readonly INFRA_DIR = this.OXLAYER_DIR + '/infra';
  private readonly PROJECTS_FILE = this.OXLAYER_DIR + '/projects.json';
  private readonly PROJECTS_FILE_TMP = this.OXLAYER_DIR + '/projects.json.tmp';
  private readonly LOCK_FILE = this.OXLAYER_DIR + '/.lock';
  private readonly COMPOSE_FILE = this.INFRA_DIR + '/docker-compose.yml';

  private lockManager: LockManager;
  private registryManager: RegistryManager;
  private containerManager: ContainerManager;
  private provisionerService: ProvisionerService;
  private doctorService: DoctorService;

  constructor() {
    this.lockManager = new LockManager(this.LOCK_FILE);
    this.registryManager = new RegistryManager(
      this.PROJECTS_FILE,
      this.PROJECTS_FILE_TMP,
      this.lockManager
    );
    this.containerManager = new ContainerManager(this.INFRA_DIR, this.COMPOSE_FILE);
    this.provisionerService = new ProvisionerService(this.OXLAYER_DIR, this.INFRA_DIR);
    this.doctorService = new DoctorService(
      this.INFRA_DIR,
      this.COMPOSE_FILE,
      this.LOCK_FILE,
      () => this.registryManager.loadRegistry()
    );
  }

  /**
   * Layer 1: Physical Infrastructure (STATIC)
   * Never modified after creation
   */

  /**
   * Check if global infrastructure is initialized
   */
  isInitialized(): boolean {
    return this.containerManager.isInitialized();
  }

  /**
   * Initialize global infrastructure (one-time setup)
   * Creates static docker-compose.yml - NEVER modified after
   */
  async initialize(selectedServices?: string[]): Promise<void> {
    if (this.isInitialized()) {
      throw new Error('Global infrastructure already initialized');
    }

    // Create directory structure
    if (!existsSync(this.INFRA_DIR)) {
      mkdirSync(this.INFRA_DIR, { recursive: true });
    }

    if (!existsSync(this.OXLAYER_DIR + '/projects')) {
      mkdirSync(this.OXLAYER_DIR + '/projects', { recursive: true });
    }

    // Initialize empty registry
    if (!existsSync(this.PROJECTS_FILE)) {
      const emptyRegistry: ProjectsRegistry = {
        version: 1,
        projects: {},
        redisDbAllocation: { nextDb: 1, used: [0] }, // DB 0 reserved
      };
      writeFileSync(this.PROJECTS_FILE, JSON.stringify(emptyRegistry, null, 2));
    }

    // Prompt for service selection if not provided
    let servicesToInclude: string[];
    if (selectedServices && selectedServices.length > 0) {
      servicesToInclude = selectedServices;
    } else {
      const { SERVICE_DEFINITIONS } = await import('./constants');
      servicesToInclude = await promptServiceSelection(SERVICE_DEFINITIONS, CORE_SERVICES, ALL_SERVICES);
    }

    // Validate dependencies are included
    const { SERVICE_DEFINITIONS } = await import('./constants');
    servicesToInclude = ensureDependencies(servicesToInclude, SERVICE_DEFINITIONS);

    // Create static docker-compose.yml for global infrastructure
    const serviceConfigs = getServiceConfigs();
    const dockerComposeYml = generateDockerCompose(servicesToInclude, serviceConfigs);
    writeFileSync(this.COMPOSE_FILE, dockerComposeYml);

    console.log();
    console.log('✓ Global infrastructure initialized at', this.INFRA_DIR);
    console.log('  Services:', servicesToInclude.map(s => {
      const def = SERVICE_DEFINITIONS.find((d: any) => d.id === s);
      return def?.name || s;
    }).join(', '));
  }

  /**
   * Start global infrastructure
   */
  async start(): Promise<void> {
    return this.containerManager.start();
  }

  /**
   * Stop global infrastructure
   */
  async stop(): Promise<void> {
    return this.containerManager.stop();
  }

  /**
   * Check if global infrastructure is running
   */
  async isRunning(): Promise<boolean> {
    return this.containerManager.isRunning();
  }

  /**
   * Get status of global infrastructure
   */
  async getStatus(): Promise<string> {
    return this.containerManager.getStatus();
  }

  /**
   * Layer 2: Tenant Provisioner (RUNTIME)
   * Creates databases, vhosts, realms via SQL/CLI/API
   */

  /**
   * Register a new project with runtime provisioning
   */
  async registerProject(projectName: string, projectPath: string): Promise<ProjectConfig> {
    return this.provisionerService.registerProject(
      projectName,
      projectPath,
      <T>(callback: () => Promise<T>) => this.lockManager.withLock(callback),
      () => this.registryManager.loadRegistry(),
      (registry: ProjectsRegistry) => this.registryManager.saveRegistry(registry),
      (projectPath: string, projectName: string, config: ProjectConfig) =>
        this.provisionerService.createProjectLocalConfig(projectPath, projectName, config)
    );
  }

  /**
   * Layer 3: Project Registry (STATE)
   */

  /**
   * Get project configuration
   */
  getProject(projectName: string): ProjectConfig | null {
    return this.registryManager.getProject(projectName);
  }

  /**
   * List all registered projects
   */
  listProjects(): ProjectConfig[] {
    return this.registryManager.listProjects();
  }

  /**
   * Unregister a project
   */
  async unregisterProject(projectName: string): Promise<void> {
    return this.registryManager.unregisterProject(projectName);
  }

  /**
   * Get connection strings for a project
   */
  getConnectionStrings(projectName: string): Record<string, string> {
    return this.registryManager.getConnectionStrings(projectName);
  }

  /**
   * Generate .env file for a project
   */
  async generateEnvFile(projectName: string, outputPath: string): Promise<void> {
    return this.registryManager.generateEnvFile(projectName, outputPath);
  }

  /**
   * Sync monitoring configuration from project to global infrastructure
   */
  async syncMonitoringConfig(projectName: string, oxDir: string): Promise<void> {
    return this.provisionerService.syncMonitoringConfig(
      projectName,
      oxDir,
      (name: string) => this.registryManager.getProject(name)
    );
  }

  /**
   * Get logs from global infrastructure services
   */
  async getLogs(service?: string, follow = false): Promise<void> {
    return this.containerManager.getLogs(service, follow);
  }

  /**
   * DOCTOR & RESET COMMANDS
   */

  /**
   * Run health check and self-healing
   */
  async runDoctor(): Promise<void> {
    return this.doctorService.runDoctor();
  }

  /**
   * Reset project - delete all resources
   */
  async resetProject(projectName: string, confirm: boolean): Promise<void> {
    return this.doctorService.resetProject(
      projectName,
      confirm,
      (name: string) => this.registryManager.getProject(name),
      (name: string) => this.registryManager.unregisterProject(name)
    );
  }

  /**
   * Check if project exists
   */
  projectExists(projectName: string): boolean {
    return this.registryManager.projectExists(projectName);
  }
}

// // Export all types for backward compatibility
// export * from './types';
// export { LockManager } from './lock-manager';
// export { RegistryManager } from './registry-manager';
// export { ContainerManager } from './container-manager';
// export { ProvisionerService } from './provisioner.service';
// export { DoctorService } from './doctor.service';
// export { generatePassword, sanitizeName, ensureDependencies, promptServiceSelection, generateDockerCompose } from './utils';
// export { SERVICE_DEFINITIONS, CORE_SERVICES, ALL_SERVICES, getServiceConfigs } from './constants';
