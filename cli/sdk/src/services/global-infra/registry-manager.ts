/**
 * Registry Manager for Global OxLayer Infrastructure Service
 * Handles project registry operations (load, save, get, list, unregister)
 */

import { readFileSync, writeFileSync, existsSync, renameSync, chmodSync } from 'fs';
import { ProjectsRegistry, ProjectConfig, ProjectResources } from './types';
import { LockManager } from './lock-manager';

export class RegistryManager {
  constructor(
    private readonly projectsFile: string,
    private readonly projectsFileTmp: string,
    private readonly lockManager: LockManager
  ) { }

  /**
   * Load projects registry
   */
  loadRegistry(): ProjectsRegistry {
    if (!existsSync(this.projectsFile)) {
      return {
        version: 1,
        projects: {},
        redisDbAllocation: { nextDb: 1, used: [0] }, // DB 0 reserved
      };
    }

    const content = readFileSync(this.projectsFile, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save projects registry (atomic write + chmod 600)
   */
  saveRegistry(registry: ProjectsRegistry): void {
    // Write to temp file first (atomic)
    const content = JSON.stringify(registry, null, 2);
    writeFileSync(this.projectsFileTmp, content, { mode: 0o600 });

    // Atomic rename (guaranteed to be atomic on Linux)
    renameSync(this.projectsFileTmp, this.projectsFile);

    // Ensure permissions are set (in case rename didn't preserve them)
    chmodSync(this.projectsFile, 0o600);
  }

  /**
   * Get project configuration
   */
  getProject(projectName: string): ProjectConfig | null {
    const registry = this.loadRegistry();
    return registry.projects[projectName] || null;
  }

  /**
   * List all registered projects
   */
  listProjects(): ProjectConfig[] {
    const registry = this.loadRegistry();
    return Object.values(registry.projects);
  }

  /**
   * Unregister a project
   * THREAD-SAFE: Uses locking to prevent race conditions
   * NOTE: Does NOT delete resources (data is preserved)
   */
  async unregisterProject(projectName: string): Promise<void> {
    return this.lockManager.withLock(async () => {
      const registry = this.loadRegistry();

      if (!registry.projects[projectName]) {
        throw new Error(`Project '${projectName}' is not registered`);
      }

      const project = registry.projects[projectName];

      // Free Redis DB number
      const redisDb = project.resources.redis.db;
      registry.redisDbAllocation.used = registry.redisDbAllocation.used.filter(
        (db) => db !== redisDb
      );

      // Remove from registry
      delete registry.projects[projectName];
      this.saveRegistry(registry);

      console.log(`✓ Project '${projectName}' unregistered`);
      console.log(`  → Freed Redis DB ${redisDb}`);
      console.log(`ℹ  Resources (databases, vhosts) have been preserved`);
    });
  }

  /**
   * Get connection strings for a project
   */
  getConnectionStrings(projectName: string): Record<string, string> {
    const project = this.getProject(projectName);
    if (!project) {
      throw new Error(`Project '${projectName}' not found`);
    }

    const { postgres, redis, rabbitmq, keycloak } = project.resources;

    return {
      // PostgreSQL - Changed to match capabilities expectations
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: '5432',
      POSTGRES_DATABASE: postgres.database,
      POSTGRES_USER: postgres.user,
      POSTGRES_PASSWORD: postgres.password,

      // Redis - Added REDIS_PASSWORD, removed REDIS_URL
      REDIS_HOST: redis.host,
      REDIS_PORT: redis.port.toString(),
      REDIS_DB: redis.db.toString(),
      REDIS_PASSWORD: '', // Optional, no password by default

      // RabbitMQ - Changed to use individual components, renamed USER to USERNAME
      RABBITMQ_HOST: 'localhost',
      RABBITMQ_PORT: '5672',
      RABBITMQ_QUEUE: 'events',
      RABBITMQ_VHOST: rabbitmq.vhost,
      RABBITMQ_USERNAME: rabbitmq.user,
      RABBITMQ_PASSWORD: rabbitmq.password,

      // Keycloak - Renamed URL to SERVER_URL
      KEYCLOAK_SERVER_URL: `http://localhost:8080`,
      KEYCLOAK_REALM: keycloak.realm,
      KEYCLOAK_CLIENT_ID: keycloak.clientId,
      KEYCLOAK_CLIENT_SECRET: keycloak.clientSecret,
    };
  }

  /**
   * Generate .env file for a project
   */
  async generateEnvFile(projectName: string, outputPath: string): Promise<void> {
    const strings = this.getConnectionStrings(projectName);
    const project = this.getProject(projectName);

    if (!project) {
      throw new Error(`Project '${projectName}' not found`);
    }

    const envLines: string[] = [
      '# OxLayer Global Infrastructure',
      `# Project: ${projectName}`,
      `# Generated: ${new Date().toISOString()}`,
      '',
    ];

    for (const [key, value] of Object.entries(strings)) {
      envLines.push(`${key}="${value}"`);
    }

    writeFileSync(outputPath, envLines.join('\n') + '\n');
    console.log(`✓ Generated environment file: ${outputPath}`);
  }

  /**
   * Add project to registry
   */
  async addProject(projectName: string, projectConfig: ProjectConfig): Promise<void> {
    return this.lockManager.withLock(async () => {
      const registry = this.loadRegistry();
      registry.projects[projectName] = projectConfig;
      this.saveRegistry(registry);
    });
  }

  /**
   * Check if project exists
  */
  projectExists(projectName: string): boolean {
    const registry = this.loadRegistry();
    return !!registry.projects[projectName];
  }
}
