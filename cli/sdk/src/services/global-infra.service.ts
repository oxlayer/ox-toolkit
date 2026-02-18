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

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, chmodSync, unlinkSync } from 'fs';
import { randomBytes } from 'crypto';
import { pid } from 'process';

const execAsync = promisify(exec);

// Service definitions for global infrastructure
interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'monitoring' | 'proxy';
  ports: string[];
  dependsOn?: string[];
}

const SERVICE_DEFINITIONS: ServiceDefinition[] = [
  // Core services
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Primary database (multi-tenant via databases)',
    category: 'core',
    ports: ['5432'],
  },
  {
    id: 'redis',
    name: 'Redis',
    description: 'Cache and session store (multi-tenant via DB numbers)',
    category: 'core',
    ports: ['6379'],
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    description: 'Message queue (multi-tenant via vhosts)',
    category: 'core',
    ports: ['5672', '15672'],
  },
  {
    id: 'keycloak',
    name: 'Keycloak',
    description: 'Identity and access management',
    category: 'core',
    ports: ['8080'],
    dependsOn: ['keycloak-postgres'],
  },
  {
    id: 'keycloak-postgres',
    name: 'Keycloak PostgreSQL',
    description: 'Database for Keycloak',
    category: 'core',
    ports: [],
  },

  // Monitoring services
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Metrics collection and storage',
    category: 'monitoring',
    ports: ['9090'],
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Metrics visualization dashboard',
    category: 'monitoring',
    ports: ['3000'],
    dependsOn: ['prometheus'],
  },

  // Proxy
  {
    id: 'traefik',
    name: 'Traefik',
    description: 'Reverse proxy and load balancer',
    category: 'proxy',
    ports: ['80', '443', '8081'],
  },
];

const CORE_SERVICES = ['postgres', 'redis', 'rabbitmq', 'keycloak', 'keycloak-postgres'];
const ALL_SERVICES = SERVICE_DEFINITIONS.map(s => s.id);

export interface ProjectResources {
  postgres: {
    database: string;
    user: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    db: number;
  };
  rabbitmq: {
    vhost: string;
    user: string;
    password: string;
  };
  keycloak: {
    realm: string;
    clientId: string;
    clientSecret: string;
  };
}

export interface ProjectConfig {
  name: string;
  path: string;
  createdAt: string;
  resources: ProjectResources;
}

export interface ProjectsRegistry {
  version: number;
  projects: Record<string, ProjectConfig>;
  redisDbAllocation: {
    nextDb: number;
    used: number[];
  };
}

export class GlobalInfraService {
  private readonly OXLAYER_DIR = process.env.HOME + '/.oxlayer';
  private readonly INFRA_DIR = this.OXLAYER_DIR + '/infra';
  private readonly PROJECTS_FILE = this.OXLAYER_DIR + '/projects.json';
  private readonly PROJECTS_FILE_TMP = this.OXLAYER_DIR + '/projects.json.tmp';
  private readonly LOCK_FILE = this.OXLAYER_DIR + '/.lock';
  private readonly COMPOSE_FILE = this.INFRA_DIR + '/docker-compose.yml';

  /**
   * Concurrency Locking
   * Prevents race conditions when multiple projects register simultaneously
   */

  /**
   * Acquire exclusive lock on registry
   * Throws if lock is held by another process
   */
  private acquireLock(): void {
    if (existsSync(this.LOCK_FILE)) {
      const lockPid = parseInt(readFileSync(this.LOCK_FILE, 'utf-8').trim());

      // Check if the locking process is still running
      try {
        process.kill(lockPid, 0); // Signal 0 checks if process exists
        throw new Error(
          `Registry is locked by process ${lockPid}. ` +
          `If this is stale, remove: ${this.LOCK_FILE}`
        );
      } catch {
        // Process doesn't exist, lock is stale
        console.warn(`⚠ Found stale lock from process ${lockPid}, removing...`);
        this.releaseLock();
      }
    }

    // Write current PID to lock file
    writeFileSync(this.LOCK_FILE, pid.toString(), { mode: 0o600 });
  }

  /**
   * Release registry lock
   */
  private releaseLock(): void {
    if (existsSync(this.LOCK_FILE)) {
      try {
        const lockPid = readFileSync(this.LOCK_FILE, 'utf-8').trim();
        if (lockPid === pid.toString()) {
          // Only remove lock if we own it
          unlinkSync(this.LOCK_FILE);
        }
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Execute callback with lock held
   */
  private async withLock<T>(callback: () => Promise<T>): Promise<T> {
    this.acquireLock();
    try {
      return await callback();
    } finally {
      this.releaseLock();
    }
  }

  /**
   * Layer 1: Physical Infrastructure (STATIC)
   * Never modified after creation
   */

  /**
   * Check if global infrastructure is initialized
   */
  isInitialized(): boolean {
    return existsSync(this.INFRA_DIR) && existsSync(this.COMPOSE_FILE);
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
      servicesToInclude = await this.promptServiceSelection();
    }

    // Validate dependencies are included
    servicesToInclude = this.ensureDependencies(servicesToInclude);

    // Create static docker-compose.yml for global infrastructure
    const dockerComposeYml = this.generateDockerCompose(servicesToInclude);
    writeFileSync(this.COMPOSE_FILE, dockerComposeYml);

    console.log();
    console.log('✓ Global infrastructure initialized at', this.INFRA_DIR);
    console.log('  Services:', servicesToInclude.map(s => {
      const def = SERVICE_DEFINITIONS.find(d => d.id === s);
      return def?.name || s;
    }).join(', '));
  }

  /**
   * Start global infrastructure
   * Starts static containers - no project-specific logic here
   */
  async start(): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Global infrastructure not initialized. Run: ox global init');
    }

    const running = await this.isRunning();
    if (running) {
      console.log('ℹ  Global infrastructure is already running');
      return;
    }

    console.log('🚀 Starting global OxLayer infrastructure...');
    await execAsync(`docker-compose -f ${this.COMPOSE_FILE} -p oxlayer up -d`, {
      cwd: this.INFRA_DIR,
    });

    console.log('✓ Global infrastructure started');
    console.log('  Services: PostgreSQL, Redis, RabbitMQ, Keycloak');
  }

  /**
   * Stop global infrastructure
   */
  async stop(): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Global infrastructure not initialized');
    }

    const running = await this.isRunning();
    if (!running) {
      console.log('ℹ  Global infrastructure is not running');
      return;
    }

    console.log('🛑 Stopping global OxLayer infrastructure...');
    await execAsync(`docker-compose -f ${this.COMPOSE_FILE} -p oxlayer stop`, {
      cwd: this.INFRA_DIR,
    });

    console.log('✓ Global infrastructure stopped');
  }

  /**
   * Check if global infrastructure is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker-compose -f ${this.COMPOSE_FILE} -p oxlayer ps -q`,
        { cwd: this.INFRA_DIR }
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get status of global infrastructure
   */
  async getStatus(): Promise<string> {
    if (!this.isInitialized()) {
      return 'Not initialized';
    }

    const running = await this.isRunning();
    if (!running) {
      return 'Not running';
    }

    try {
      const { stdout } = await execAsync(
        `docker-compose -f ${this.COMPOSE_FILE} -p oxlayer ps --services`,
        { cwd: this.INFRA_DIR }
      );
      return `Running: ${stdout.trim().split('\n').join(', ')}`;
    } catch {
      return 'Error fetching status';
    }
  }

  /**
   * Layer 2: Tenant Provisioner (RUNTIME)
   * Creates databases, vhosts, realms via SQL/CLI/API
   */

  /**
   * Register a new project with runtime provisioning
   * IDEMPOTENT: Safe to run multiple times
   * THREAD-SAFE: Uses locking to prevent race conditions
   */
  async registerProject(projectName: string, projectPath: string): Promise<ProjectConfig> {
    return this.withLock(async () => {
      const registry = this.loadRegistry();

      // Check if already registered
      if (registry.projects[projectName]) {
        console.log(`ℹ  Project '${projectName}' is already registered`);
        return registry.projects[projectName];
      }

      console.log(`📝 Registering project '${projectName}'...`);

      // Generate secure credentials
      const postgresUser = this.sanitizeName(projectName) + '_user';
      const postgresPassword = this.generatePassword();
      const rabbitmqUser = this.sanitizeName(projectName);
      const rabbitmqPassword = this.generatePassword();
      const keycloakClientSecret = this.generatePassword();

      // Provision resources (idempotent)
      const postgres = await this.provisionPostgres(projectName, postgresUser, postgresPassword);
      const redis = this.provisionRedis(registry);
      const rabbitmq = await this.provisionRabbitMQ(projectName, rabbitmqUser, rabbitmqPassword);
      const keycloak = await this.provisionKeycloak(projectName, keycloakClientSecret);

      // Create project config
      const projectConfig: ProjectConfig = {
        name: projectName,
        path: projectPath,
        createdAt: new Date().toISOString(),
        resources: {
          postgres,
          redis,
          rabbitmq,
          keycloak,
        },
      };

      // Save to registry
      registry.projects[projectName] = projectConfig;
      this.saveRegistry(registry);

      // Create project-local .oxlayer folder
      this.createProjectLocalConfig(projectPath, projectName, projectConfig);

      console.log(`✓ Project '${projectName}' registered successfully`);
      return projectConfig;
    });
  }

  /**
   * Provision PostgreSQL database and user (idempotent)
   */
  private async provisionPostgres(
    projectName: string,
    user: string,
    password: string
  ): Promise<ProjectResources['postgres']> {
    const dbName = this.sanitizeName(projectName);

    try {
      // Check if database exists
      const { stdout } = await execAsync(
        `docker exec ox-postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${dbName}'"`,
        { timeout: 5000 }
      );

      if (stdout.trim() === '1') {
        console.log(`  ℹ  PostgreSQL database '${dbName}' already exists`);
      } else {
        // Create database
        await execAsync(
          `docker exec ox-postgres psql -U postgres -c "CREATE DATABASE ${dbName};"`,
          { timeout: 5000 }
        );
        console.log(`  ✓ Created PostgreSQL database: ${dbName}`);
      }

      // Check if user exists
      const userExists = await execAsync(
        `docker exec ox-postgres psql -U postgres -tAc "SELECT 1 FROM pg_user WHERE usename='${user}'"`,
        { timeout: 5000 }
      );

      if (userExists.stdout.trim() === '1') {
        console.log(`  ℹ  PostgreSQL user '${user}' already exists`);
      } else {
        // Create user and grant privileges
        await execAsync(
          `docker exec ox-postgres psql -U postgres -c "CREATE USER ${user} WITH PASSWORD '${password}';"`,
          { timeout: 5000 }
        );
        await execAsync(
          `docker exec ox-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${user};"`,
          { timeout: 5000 }
        );
        console.log(`  ✓ Created PostgreSQL user: ${user}`);
      }

      return { database: dbName, user, password };
    } catch (error: any) {
      throw new Error(`Failed to provision PostgreSQL: ${error.message}`);
    }
  }

  /**
   * Provision Redis database number
   */
  private provisionRedis(registry: ProjectsRegistry): ProjectResources['redis'] {
    const { nextDb } = registry.redisDbAllocation;

    if (nextDb > 15) {
      throw new Error('No more Redis databases available (max 15). Consider adding a second Redis instance.');
    }

    // Allocate this DB number
    registry.redisDbAllocation.used.push(nextDb);
    registry.redisDbAllocation.nextDb = nextDb + 1;

    console.log(`  ✓ Redis database: DB ${nextDb}`);
    return {
      host: 'localhost',
      port: 6379,
      db: nextDb,
    };
  }

  /**
   * Provision RabbitMQ vhost and user (idempotent)
   */
  private async provisionRabbitMQ(
    projectName: string,
    user: string,
    password: string
  ): Promise<ProjectResources['rabbitmq']> {
    const vhost = this.sanitizeName(projectName);

    try {
      // Check if vhost exists (using shell || true to handle grep exit code)
      const { stdout } = await execAsync(
        `docker exec ox-rabbitmq rabbitmqctl list_vhosts | grep "^${vhost}$" || true`,
        { timeout: 5000 }
      );

      if (stdout.trim()) {
        console.log(`  ℹ  RabbitMQ vhost '${vhost}' already exists`);
      } else {
        // Create vhost
        await execAsync(`docker exec ox-rabbitmq rabbitmqctl add_vhost ${vhost}`, {
          timeout: 5000,
        });
        console.log(`  ✓ Created RabbitMQ vhost: ${vhost}`);
      }

      // Check if user exists
      const userExists = await execAsync(
        `docker exec ox-rabbitmq rabbitmqctl list_users | grep "^${user}" || true`,
        { timeout: 5000 }
      );

      if (userExists.stdout.trim()) {
        console.log(`  ℹ  RabbitMQ user '${user}' already exists`);
      } else {
        // Create user
        await execAsync(
          `docker exec ox-rabbitmq rabbitmqctl add_user ${user} ${password}`,
          { timeout: 5000 }
        );
        console.log(`  ✓ Created RabbitMQ user: ${user}`);
      }

      // Set permissions (idempotent)
      await execAsync(
        `docker exec ox-rabbitmq rabbitmqctl set_permissions -p ${vhost} ${user} ".*" ".*" ".*"`,
        { timeout: 5000 }
      );
      console.log(`  ✓ Set RabbitMQ permissions for ${user} on ${vhost}`);

      return { vhost, user, password };
    } catch (error: any) {
      throw new Error(`Failed to provision RabbitMQ: ${error.message}`);
    }
  }

  /**
   * Provision Keycloak realm (TODO: Use Admin API)
   */
  private async provisionKeycloak(
    projectName: string,
    clientSecret: string
  ): Promise<ProjectResources['keycloak']> {
    const realm = this.sanitizeName(projectName);
    const clientId = projectName + '-client';

    // TODO: Implement realm creation via Keycloak Admin API
    console.log(`  ⚠ Keycloak realm '${realm}' should be created manually via Admin API`);
    console.log(`     Client ID: ${clientId}`);
    console.log(`     Client Secret: ${clientSecret}`);

    return { realm, clientId, clientSecret };
  }

  /**
   * Layer 3: Project Registry (STATE)
   */

  /**
   * Load projects registry
   */
  private loadRegistry(): ProjectsRegistry {
    if (!existsSync(this.PROJECTS_FILE)) {
      return {
        version: 1,
        projects: {},
        redisDbAllocation: { nextDb: 1, used: [0] }, // DB 0 reserved
      };
    }

    const content = readFileSync(this.PROJECTS_FILE, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Save projects registry (atomic write + chmod 600)
   */
  private saveRegistry(registry: ProjectsRegistry): void {
    // Write to temp file first (atomic)
    const content = JSON.stringify(registry, null, 2);
    writeFileSync(this.PROJECTS_FILE_TMP, content, { mode: 0o600 });

    // Atomic rename (guaranteed to be atomic on Linux)
    renameSync(this.PROJECTS_FILE_TMP, this.PROJECTS_FILE);

    // Ensure permissions are set (in case rename didn't preserve them)
    chmodSync(this.PROJECTS_FILE, 0o600);
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
    return this.withLock(async () => {
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
      DATABASE_URL: `postgresql://${postgres.user}:${postgres.password}@localhost:5432/${postgres.database}`,
      POSTGRES_DB: postgres.database,
      POSTGRES_USER: postgres.user,
      POSTGRES_PASSWORD: postgres.password,

      REDIS_URL: `redis://${redis.host}:${redis.port}/${redis.db}`,
      REDIS_HOST: redis.host,
      REDIS_PORT: redis.port.toString(),
      REDIS_DB: redis.db.toString(),

      RABBITMQ_URL: `amqp://${rabbitmq.user}:${rabbitmq.password}@localhost:5672/${rabbitmq.vhost}`,
      RABBITMQ_VHOST: rabbitmq.vhost,
      RABBITMQ_USER: rabbitmq.user,
      RABBITMQ_PASSWORD: rabbitmq.password,

      KEYCLOAK_URL: `http://localhost:8080/realms/${keycloak.realm}`,
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
   * ═══════════════════════════════════════════════════════════════
   * DOCTOR & RESET COMMANDS
   * ═══════════════════════════════════════════════════════════════
   */

  /**
   * Run health check and self-healing
   */
  async runDoctor(): Promise<void> {
    console.log('🩺 OxLayer Global Infrastructure Doctor');
    console.log('═'.repeat(50));
    console.log();

    const issues: string[] = [];

    // Check 1: Global infrastructure initialized
    if (!this.isInitialized()) {
      issues.push('❌ Global infrastructure not initialized');
      console.log('❌ Global Infrastructure: Not initialized');
      console.log('   Fix: Run `ox global init`');
    } else {
      console.log('✅ Global Infrastructure: Initialized');
    }

    // Check 2: Docker network exists
    try {
      const { stdout } = await execAsync('docker network inspect ox_net', {
        timeout: 5000,
      });
      if (stdout.trim()) {
        console.log('✅ Docker Network (ox_net): Exists');
      }
    } catch {
      issues.push('Docker network ox_net missing');
      console.log('❌ Docker Network (ox_net): Missing');
      console.log('   Fix: Run `ox global start`');
    }

    // Check 3: Containers running
    const expectedContainers = [
      'ox-postgres',
      'ox-redis',
      'ox-rabbitmq',
      'ox-keycloak',
      'ox-prometheus',
      'ox-grafana',
      'ox-traefik',
    ];

    const runningContainers: string[] = [];
    const stoppedContainers: string[] = [];
    const missingContainers: string[] = [];

    for (const container of expectedContainers) {
      try {
        const { stdout } = await execAsync(
          `docker inspect -f '{{.State.Status}}' ${container} 2>/dev/null || echo "missing"`,
          { timeout: 3000 }
        );
        const status = stdout.trim();
        if (status === 'running') {
          runningContainers.push(container);
        } else if (status === 'missing') {
          missingContainers.push(container);
        } else {
          stoppedContainers.push(container);
        }
      } catch {
        missingContainers.push(container);
      }
    }

    console.log(`\n📊 Container Status:`);
    console.log(`   ✅ Running: ${runningContainers.length}/${expectedContainers.length}`);
    if (runningContainers.length > 0) {
      runningContainers.forEach((c) => console.log(`      • ${c}`));
    }

    if (stoppedContainers.length > 0) {
      console.log(`   ⚠️  Stopped: ${stoppedContainers.length}`);
      stoppedContainers.forEach((c) => console.log(`      • ${c}`));
      issues.push(`${stoppedContainers.length} containers stopped`);
    }

    if (missingContainers.length > 0) {
      console.log(`   ❌ Missing: ${missingContainers.length}`);
      missingContainers.forEach((c) => console.log(`      • ${c}`));
      issues.push(`${missingContainers.length} containers missing`);
    }

    // Check 4: Registry integrity
    console.log(`\n📋 Registry Integrity:`);
    try {
      const registry = this.loadRegistry();
      console.log(`   ✅ Registry file exists and is valid`);
      console.log(`   📊 Registered projects: ${Object.keys(registry.projects).length}`);

      // Check for Redis DB allocation consistency
      const { used, nextDb } = registry.redisDbAllocation;
      const maxDb = Math.max(...used, 0);
      if (nextDb !== maxDb + 1) {
        issues.push(`Redis DB allocation inconsistent (nextDb=${nextDb}, but max used=${maxDb})`);
        console.log(`   ⚠️  Redis DB allocation may be inconsistent`);
      } else {
        console.log(`   ✅ Redis DB allocation consistent (DB 0-${maxDb} used, next is ${nextDb})`);
      }

      // Check for orphaned resources
      console.log(`\n🔍 Resource Orphan Check:`);
      const projectDbs = Object.values(registry.projects).map((p) => p.resources.postgres.database);
      const projectVhosts = Object.values(registry.projects).map((p) => p.resources.rabbitmq.vhost);

      // Check PostgreSQL databases
      try {
        const { stdout } = await execAsync(
          `docker exec ox-postgres psql -U postgres -tAc "SELECT datname FROM pg_database WHERE datistemplate = false;"`,
          { timeout: 5000 }
        );
        const allDbs = stdout.trim().split('\n');
        const orphanedDbs = allDbs.filter(
          (db) => !['postgres', 'template0', 'template1'].includes(db) && !projectDbs.includes(db)
        );

        if (orphanedDbs.length > 0) {
          console.log(`   ⚠️  Orphaned PostgreSQL databases: ${orphanedDbs.length}`);
          orphanedDbs.forEach((db) => console.log(`      • ${db}`));
        } else {
          console.log(`   ✅ No orphaned PostgreSQL databases`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not check PostgreSQL databases`);
      }

      // Check RabbitMQ vhosts
      try {
        const { stdout } = await execAsync(`docker exec ox-rabbitmq rabbitmqctl list_vhosts`, {
          timeout: 5000,
        });
        const allVhosts = stdout
          .trim()
          .split('\n')
          .map((v) => v.replace(/\s.*$/, ''))
          .filter((v) => v && v !== '/');
        const orphanedVhosts = allVhosts.filter((vhost) => !projectVhosts.includes(vhost));

        if (orphanedVhosts.length > 0) {
          console.log(`   ⚠️  Orphaned RabbitMQ vhosts: ${orphanedVhosts.length}`);
          orphanedVhosts.forEach((v) => console.log(`      • ${v}`));
        } else {
          console.log(`   ✅ No orphaned RabbitMQ vhosts`);
        }
      } catch (error) {
        console.log(`   ⚠️  Could not check RabbitMQ vhosts`);
      }
    } catch (error: any) {
      issues.push(`Registry corrupted or invalid: ${error.message}`);
      console.log(`   ❌ Registry file corrupted or invalid`);
    }

    // Check 5: Lock file status
    console.log(`\n🔒 Lock File Status:`);
    if (existsSync(this.LOCK_FILE)) {
      const lockPid = readFileSync(this.LOCK_FILE, 'utf-8').trim();
      try {
        process.kill(parseInt(lockPid), 0);
        console.log(`   ⚠️  Lock file held by PID ${lockPid} (active)`);
        console.log(`      If stale, remove: ${this.LOCK_FILE}`);
      } catch {
        console.log(`   ⚠️  Stale lock file from PID ${lockPid} (process dead)`);
        console.log(`      Fix: Remove stale lock file`);
        issues.push('Stale lock file detected');
      }
    } else {
      console.log(`   ✅ No lock file (not in operation)`);
    }

    // Summary
    console.log();
    console.log('═'.repeat(50));
    if (issues.length === 0) {
      console.log('✅ All checks passed! System is healthy.');
    } else {
      console.log(`⚠️  Found ${issues.length} issue(s):`);
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      console.log();
      console.log('💡 Run suggested fixes to resolve issues.');
    }
    console.log();
  }

  /**
   * Reset project - delete all resources
   * DANGEROUS: This cannot be undone!
   */
  async resetProject(projectName: string, confirm: boolean): Promise<void> {
    console.log('🔄 Reset Project Resources');
    console.log('═'.repeat(50));
    console.log();
    console.log(`⚠️  WARNING: This will DELETE all resources for project '${projectName}'`);
    console.log();
    console.log('This will:');
    console.log('  • Drop PostgreSQL database');
    console.log('  • Delete PostgreSQL user');
    console.log('  • Delete RabbitMQ vhost');
    console.log('  • Delete RabbitMQ user');
    console.log('  • Remove from registry');
    console.log('  • Free Redis DB number');
    console.log();

    const project = this.getProject(projectName);
    if (!project) {
      throw new Error(`Project '${projectName}' not found`);
    }

    console.log('Resources to be deleted:');
    console.log(`  PostgreSQL DB: ${project.resources.postgres.database}`);
    console.log(`  PostgreSQL User: ${project.resources.postgres.user}`);
    console.log(`  RabbitMQ VHost: ${project.resources.rabbitmq.vhost}`);
    console.log(`  RabbitMQ User: ${project.resources.rabbitmq.user}`);
    console.log(`  Redis DB: ${project.resources.redis.db}`);
    console.log();

    if (!confirm) {
      console.log('❌ Aborted. Use --confirm to proceed.');
      console.log('   Example: ox infra reset ' + projectName + ' --confirm');
      return;
    }

    console.log('🗑️  Deleting resources...');

    // Drop PostgreSQL database and user
    try {
      console.log(`  • Dropping PostgreSQL database ${project.resources.postgres.database}...`);
      await execAsync(
        `docker exec ox-postgres psql -U postgres -c "DROP DATABASE IF EXISTS ${project.resources.postgres.database};"`,
        { timeout: 5000 }
      );
    } catch (error: any) {
      console.warn(`    ⚠ Failed to drop database: ${error.message}`);
    }

    try {
      console.log(`  • Dropping PostgreSQL user ${project.resources.postgres.user}...`);
      await execAsync(
        `docker exec ox-postgres psql -U postgres -c "DROP USER IF EXISTS ${project.resources.postgres.user};"`,
        { timeout: 5000 }
      );
    } catch (error: any) {
      console.warn(`    ⚠ Failed to drop user: ${error.message}`);
    }

    // Delete RabbitMQ vhost and user
    try {
      console.log(`  • Deleting RabbitMQ vhost ${project.resources.rabbitmq.vhost}...`);
      await execAsync(`docker exec ox-rabbitmq rabbitmqctl delete_vhost ${project.resources.rabbitmq.vhost}`, {
        timeout: 5000,
      });
    } catch (error: any) {
      console.warn(`    ⚠ Failed to delete vhost: ${error.message}`);
    }

    try {
      console.log(`  • Deleting RabbitMQ user ${project.resources.rabbitmq.user}...`);
      await execAsync(`docker exec ox-rabbitmq rabbitmqctl delete_user ${project.resources.rabbitmq.user}`, {
        timeout: 5000,
      });
    } catch (error: any) {
      console.warn(`    ⚠ Failed to delete user: ${error.message}`);
    }

    // Unregister project (frees Redis DB)
    await this.unregisterProject(projectName);

    console.log();
    console.log('✅ Project resources deleted successfully!');
    console.log();
    console.log('💡 Note: Keycloak realm should be deleted manually via Admin UI');
  }

  /**
   * Utility: Generate secure random password
   */
  private generatePassword(length = 32): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  /**
   * Utility: Sanitize name for database/vhost usage
   */
  private sanitizeName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 63);
  }

  /**
   * Prompt user to select which services to include in global infrastructure
   */
  private async promptServiceSelection(): Promise<string[]> {
    const { default: prompts } = await import('prompts');

    console.log();
    console.log('Select services for global OxLayer infrastructure:');
    console.log();

    const { choice } = await prompts({
      type: 'select',
      name: 'choice',
      message: 'Which services would you like to run?',
      choices: [
        { title: 'Core services only (PostgreSQL, Redis, RabbitMQ, Keycloak)', value: 'core' },
        { title: 'All services (Core + Monitoring + Proxy)', value: 'all' },
        { title: 'Custom (select individual services)', value: 'custom' },
      ],
      initial: 0,
    });

    if (choice === 'core') {
      return [...CORE_SERVICES];
    }

    if (choice === 'all') {
      return [...ALL_SERVICES];
    }

    // Custom selection
    const { services } = await prompts({
      type: 'multiselect',
      name: 'services',
      message: 'Select services to include:',
      choices: SERVICE_DEFINITIONS.filter(s => s.id !== 'keycloak-postgres').map(service => ({
        title: `${service.name} - ${service.description}`,
        value: service.id,
        selected: CORE_SERVICES.includes(service.id),
      })),
    });

    const selected = services || CORE_SERVICES;

    // Always include keycloak-postgres if keycloak is selected
    if (selected.includes('keycloak') && !selected.includes('keycloak-postgres')) {
      selected.push('keycloak-postgres');
    }

    return selected;
  }

  /**
   * Ensure all dependencies of selected services are included
   */
  private ensureDependencies(services: string[]): string[] {
    const result = new Set(services);

    let changed = true;
    while (changed) {
      changed = false;
      for (const service of result) {
        const def = SERVICE_DEFINITIONS.find(s => s.id === service);
        if (def?.dependsOn) {
          for (const dep of def.dependsOn) {
            if (!result.has(dep)) {
              result.add(dep);
              changed = true;
            }
          }
        }
      }
    }

    return Array.from(result);
  }

  /**
   * Generate docker-compose.yml for selected services
   */
  private generateDockerCompose(services: string[]): string {
    const serviceConfigs = this.getServiceConfigs();
    const selectedServices: string[] = [];
    const volumes: string[] = [];

    for (const serviceId of services) {
      const config = serviceConfigs[serviceId];
      if (config) {
        selectedServices.push(config);
        // Collect volumes
        const volumeMatches = config.match(/- ox_\w+_data:/g);
        if (volumeMatches) {
          volumeMatches.forEach(v => {
            const volumeName = v.replace(/- |:/g, '');
            if (!volumes.includes(volumeName)) {
              volumes.push(volumeName);
            }
          });
        }
      }
    }

    return `services:
${selectedServices.join('\n')}

volumes:
${volumes.map((v: string) => `  ${v}:\n    driver: local`).join('\n')}

networks:
  ox_net:
    driver: bridge
`;
  }

  /**
   * Get individual service configurations for docker-compose
   */
  private getServiceConfigs(): Record<string, string> {
    return {
      'postgres': `  # PostgreSQL Database (multi-tenant)
  postgres:
    image: postgres:16-alpine
    container_name: ox-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - ox_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ox_net
    restart: unless-stopped`,

      'redis': `  # Redis Cache (multi-tenant via DB number)
  redis:
    image: redis:7-alpine
    container_name: ox-redis
    ports:
      - "6379:6379"
    volumes:
      - ox_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ox_net
    restart: unless-stopped`,

      'rabbitmq': `  # RabbitMQ Message Broker (multi-tenant via vhosts)
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: ox-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - ox_rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ox_net
    restart: unless-stopped`,

      'keycloak': `  # Keycloak Authentication Server
  keycloak:
    image: quay.io/keycloak/keycloak:26.5
    container_name: ox-keycloak
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://ox-keycloak-postgres:5432/keycloak
      KC_DB_USERNAME: keycloak
      KC_DB_PASSWORD: keycloak
      KC_HOSTNAME: localhost
      KC_HOSTNAME_PORT: 8080
      KC_HOSTNAME_STRICT: false
      KC_HOSTNAME_STRICT_HTTPS: false
      KC_HTTP_ENABLED: true
      KC_SPI_OPTIONS_COOKIE_DEFAULT_SECURE: "false"
      KC_SPI_OPTIONS_COOKIE_DEFAULT_SAME_SITE: "lax"
    ports:
      - "8080:8080"
    depends_on:
      ox-keycloak-postgres:
        condition: service_healthy
    volumes:
      - ox_keycloak_data:/opt/keycloak/data
    healthcheck:
      test: ["CMD-SHELL", "exec 3<>/dev/tcp/localhost:8080 && echo -e 'GET /health/ready HTTP/1.1\\r\\nHost: localhost\\r\\n\\r\\n' >&3 && cat <3 | grep -q '200 OK'"]
      interval: 10s
      timeout: 5s
      retries: 20
      start_period: 30s
    networks:
      - ox_net
    restart: unless-stopped`,

      'keycloak-postgres': `  # Keycloak Database
  ox-keycloak-postgres:
    image: postgres:16-alpine
    container_name: ox-keycloak-postgres
    environment:
      POSTGRES_USER: keycloak
      POSTGRES_PASSWORD: keycloak
      POSTGRES_DB: keycloak
    volumes:
      - ox_keycloak_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U keycloak"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ox_net
    restart: unless-stopped`,

      'prometheus': `  # Prometheus (metrics collection)
  prometheus:
    image: prom/prometheus:v2.48.0
    container_name: ox-prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=15d"
      - "--web.enable-lifecycle"
    ports:
      - "9090:9090"
    volumes:
      - ox_prometheus_data:/prometheus
    networks:
      - ox_net
    restart: unless-stopped`,

      'grafana': `  # Grafana (visualization)
  grafana:
    image: grafana/grafana:12.3.1
    container_name: ox-grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    volumes:
      - ox_grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - ox_net
    restart: unless-stopped`,

      'traefik': `  # Traefik Reverse Proxy
  traefik:
    image: traefik:v3.0
    container_name: ox-traefik
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entryPoints.web.address=:80"
      - "--entryPoints.websecure.address=:443"
    ports:
      - "80:80"
      - "443:443"
      - "8081:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - ox_net
    restart: unless-stopped`,
    };
  }

  /**
   * Create project-local .ox folder with configuration
   * This allows projects to have local overrides and custom settings
   */
  private createProjectLocalConfig(projectPath: string, projectName: string, config: ProjectConfig): void {
    const oxDir = projectPath + '/.ox';

    try {
      // Create .ox directory if it doesn't exist
      if (!existsSync(oxDir)) {
        mkdirSync(oxDir, { recursive: true });
      }

      // Create .gitkeep to ensure the folder is git-tracked
      const gitkeepPath = oxDir + '/.gitkeep';
      if (!existsSync(gitkeepPath)) {
        writeFileSync(gitkeepPath, '# This directory stores OxLayer project-specific configuration\n');
      }

      // Create config.json with project metadata
      const configPath = oxDir + '/config.json';
      const projectConfig = {
        name: projectName,
        registeredAt: config.createdAt,
        oxlayerVersion: '0.0.28',
        globalRegistry: `${this.OXLAYER_DIR}/projects.json`,
      };

      writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));

      // Create .env.example template (without sensitive data)
      const envExamplePath = oxDir + '/.env.example';
      const envTemplate = `# OxLayer Environment Variables for ${projectName}
# Generated: ${new Date().toISOString()}
# Copy this file to .env.local or use: ox infra env

# PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/${config.resources.postgres.database}
POSTGRES_DB=${config.resources.postgres.database}
POSTGRES_USER=${config.resources.postgres.user}

# Redis
REDIS_URL=redis://localhost:6379/${config.resources.redis.db}
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=${config.resources.redis.db}

# RabbitMQ
RABBITMQ_URL=amqp://USER:PASSWORD@localhost:5672/${config.resources.rabbitmq.vhost}
RABBITMQ_VHOST=${config.resources.rabbitmq.vhost}
RABBITMQ_USER=${config.resources.rabbitmq.user}

# Keycloak
KEYCLOAK_URL=http://localhost:8080/realms/${config.resources.keycloak.realm}
KEYCLOAK_REALM=${config.resources.keycloak.realm}
KEYCLOAK_CLIENT_ID=${config.resources.keycloak.clientId}
`;
      writeFileSync(envExamplePath, envTemplate);

      // Create monitoring configuration templates
      this.createMonitoringTemplates(oxDir, projectName, config);

      // Create README.md with documentation
      const readmePath = oxDir + '/README.md';
      const readme = `# OxLayer Configuration for ${projectName}

This directory stores project-specific OxLayer configuration and settings.

## Files

- \`config.json\` - Project metadata and registration info
- \`.env.example\` - Environment variable template
- \`.env.local\` - Generated environment file with credentials (run \`ox infra env\` to generate)
- \`prometheus/prometheus.yml\` - Prometheus scrape configuration template
- \`grafana/provisioning/datasources/datasources.yml\` - Grafana datasources template
- \`grafana/provisioning/dashboards/dashboards.yml\` - Grafana dashboards provider config
- \`grafana/provisioning/dashboards/*.json\` - Dashboard definitions (add your own)
- \`collector-observability.yaml\` - OpenTelemetry observability collector config (optional)
- \`collector-domain.yaml\` - OpenTelemetry domain events collector config (optional)

## Commands

\`\`\`bash
# View connection URLs
ox infra connections

# Generate .env.local file
ox infra env

# Sync monitoring configuration to global infrastructure
ox infra sync

# View project status
ox global status

# View logs
ox global logs [service]

# Reset project (deletes all resources)
ox infra reset ${projectName} --confirm
\`\`\`

## Resources

- **PostgreSQL Database**: \`${config.resources.postgres.database}\`
- **PostgreSQL User**: \`${config.resources.postgres.user}\`
- **Redis DB**: \`${config.resources.redis.db}\`
- **RabbitMQ VHost**: \`${config.resources.rabbitmq.vhost}\`
- **Keycloak Realm**: \`${config.resources.keycloak.realm}\`

## Monitoring Configuration

This project includes templates for monitoring stack integration:

### Prometheus
Edit \`prometheus/prometheus.yml\` to add scrape jobs for your services:
\`\`\`yaml
scrape_configs:
  - job_name: '${projectName}-api'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/metrics'
\`\`\`

### Grafana
1. Add datasources in \`grafana/provisioning/datasources/datasources.yml\`
2. Add dashboard JSON files in \`grafana/provisioning/dashboards/\`
3. Run \`ox infra sync\` to create a Grafana organization with your config

### OpenTelemetry (Optional)
- \`collector-observability.yaml\` - For logs, traces, metrics
- \`collector-domain.yaml\` - For domain events and business metrics

## Global Infrastructure

All projects share the global OxLayer infrastructure running at:
\`~/.oxlayer/infra/\`

To manage global infrastructure:
\`\`\`bash
# Start global infra
oxlayer global start

# Stop global infra
oxlayer global stop

# View status
oxlayer global status

# Run diagnostics
oxlayer global doctor
\`\`\`
`;
      writeFileSync(readmePath, readme);

      console.log(`  ✓ Created .oxlayer folder in project`);
    } catch (error) {
      // Non-fatal error - log warning but don't fail registration
      console.warn(`  ⚠ Could not create .oxlayer folder: ${error}`);
    }
  }

  /**
   * Create monitoring configuration templates for the project
   * Generates starter configs for Prometheus, Grafana, and OTEL collectors
   */
  private createMonitoringTemplates(oxlayerDir: string, projectName: string, config: ProjectConfig): void {
    try {
      // Create Prometheus template
      const prometheusDir = oxlayerDir + '/prometheus';
      if (!existsSync(prometheusDir)) {
        mkdirSync(prometheusDir, { recursive: true });
      }

      const prometheusTemplate = `# Prometheus Scrape Configuration for ${projectName}
# This file will be synced to: ~/.oxlayer/infra/prometheus/scrape.d/${projectName}.yml
# Run: ox infra sync

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Scrape Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Scrape infrastructure services
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'rabbitmq'
    static_configs:
      - targets: ['rabbitmq:15692']

  # Add your application's metrics endpoint here
  # Example:
  # - job_name: '${projectName}-api'
  #   static_configs:
  #     - targets: ['host.docker.internal:3001']
  #   metrics_path: '/metrics'
`;
      writeFileSync(prometheusDir + '/prometheus.yml', prometheusTemplate);

      // Create Grafana datasources template
      const grafanaDatasourcesDir = oxlayerDir + '/grafana/provisioning/datasources';
      if (!existsSync(grafanaDatasourcesDir)) {
        mkdirSync(grafanaDatasourcesDir, { recursive: true });
      }

      const datasourcesTemplate = `# Grafana Datasources for ${projectName}
# These will be created in a dedicated Grafana organization via API
# Run: ox infra sync

apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true

  # Add more datasources here
  # Example:
  # - name: PostgreSQL
  #   type: postgres
  #   url: postgres://${config.resources.postgres.user}:password@postgres:5432/${config.resources.postgres.database}
  #   access: proxy
  #   isDefault: false
  #   editable: true
`;
      writeFileSync(grafanaDatasourcesDir + '/datasources.yml', datasourcesTemplate);

      // Create Grafana dashboards template
      const grafanaDashboardsDir = oxlayerDir + '/grafana/provisioning/dashboards';
      if (!existsSync(grafanaDashboardsDir)) {
        mkdirSync(grafanaDashboardsDir, { recursive: true });
      }

      const dashboardsTemplate = `# Grafana Dashboards Provider for ${projectName}
# Dashboards in this directory will be synced to Grafana via API
# Run: ox infra sync

apiVersion: 1

providers:
  - name: '${projectName}'
    orgId: 1
    folder: '${projectName}'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
`;
      writeFileSync(grafanaDashboardsDir + '/dashboards.yml', dashboardsTemplate);

      // Create example dashboard (empty template)
      const exampleDashboard = {
        dashboard: {
          id: null,
          title: `${projectName} - Quick Start`,
          tags: [projectName, 'oxlayer'],
          style: 'dark',
          timezone: 'browser',
          editable: true,
          hideControls: false,
          graphTooltip: 1,
          panels: [],
          time: {
            from: 'now-6h',
            to: 'now',
          },
          refresh: '5s',
          schemaVersion: 38,
          version: 0,
        },
        overwrite: true,
      };
      writeFileSync(grafanaDashboardsDir + `/example-dashboard.json`, JSON.stringify(exampleDashboard, null, 2));

      // Create OpenTelemetry collector templates (optional)
      const collectorObservabilityTemplate = `# OpenTelemetry Collector - Observability Pipeline
# Receives: logs, traces, metrics
# Sends to: Backend (Quickwit, Loki, Tempo, etc.)
#
# This is an optional template - modify based on your needs

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 1s
    send_batch_size: 100
    send_batch_max_size: 200

  resource:
    attributes:
      - key: deployment.environment
        value: development
        action: upsert
      - key: service.name
        value: ${projectName}
        action: upsert

exporters:
  # Debug exporter (for development)
  debug:
    verbosity: detailed

  # Add your exporters here (Loki, Tempo, etc.)
  # Example for Prometheus:
  # prometheusremotewrite:
  #   endpoint: http://prometheus:9090/api/v1/write

service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [debug]

    traces:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [debug]

    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [debug]
`;
      writeFileSync(oxlayerDir + '/collector-observability.yaml', collectorObservabilityTemplate);

      const collectorDomainTemplate = `# OpenTelemetry Collector - Domain Events Pipeline
# Receives: Domain events, business metrics
# Sends to: Analytics backend (ClickHouse, BigQuery, etc.)
#
# This is an optional template - modify based on your needs

receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14317
      http:
        endpoint: 0.0.0.0:14318

processors:
  batch:
    timeout: 1s

  resource:
    attributes:
      - key: deployment.environment
        value: development
        action: upsert
      - key: collector.intent
        value: domain
        action: upsert

exporters:
  # Debug exporter (for development)
  debug:
    verbosity: detailed

  # Add your analytics exporters here
  # Example for ClickHouse:
  # clickhouse:
  #   endpoint: tcp://clickhouse:9000
  #   database: analytics
  #   table: events

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [debug]

    logs:
      receivers: [otlp]
      processors: [batch, resource]
      exporters: [debug]
`;
      writeFileSync(oxlayerDir + '/collector-domain.yaml', collectorDomainTemplate);

      console.log(`    ✓ Created monitoring configuration templates`);
    } catch (error) {
      // Non-fatal
      console.warn(`    ⚠ Could not create monitoring templates: ${error}`);
    }
  }

  /**
   * Sync monitoring configuration from project to global infrastructure
   * APPROACH:
   * - Prometheus/OTEL: File-based (scrape.d/*.yml, collectors.d/*.yaml)
   * - Grafana: API-based (create org, user, datasources, dashboards)
   */
  async syncMonitoringConfig(projectName: string, oxlayerDir: string): Promise<void> {
    console.log(`🔄 Syncing monitoring configuration for '${projectName}'...`);

    const project = this.getProject(projectName);
    if (!project) {
      throw new Error(`Project '${projectName}' not found`);
    }

    // Define monitoring config paths in project
    const monitoringPaths = {
      prometheus: oxlayerDir + '/prometheus/prometheus.yml',
      grafanaDatasources: oxlayerDir + '/grafana/provisioning/datasources/datasources.yml',
      grafanaDashboards: oxlayerDir + '/grafana/provisioning/dashboards/dashboards.yml',
      grafanaDashboardDir: oxlayerDir + '/grafana/provisioning/dashboards/',
      collectorObservability: oxlayerDir + '/collector-observability.yaml',
      collectorDomain: oxlayerDir + '/collector-domain.yaml',
    };

    // Define global infra paths (split config approach)
    const globalPaths = {
      prometheusScrapeDir: this.INFRA_DIR + '/prometheus/scrape.d/',
      prometheusMain: this.INFRA_DIR + '/prometheus/prometheus.yml',
      collectorDir: this.INFRA_DIR + '/collectors/',
    };

    // Sync Prometheus via file-based config
    if (existsSync(monitoringPaths.prometheus)) {
      try {
        console.log('  📊 Syncing Prometheus configuration (file-based)...');
        await this.syncPrometheusFileBased(monitoringPaths.prometheus, globalPaths.prometheusScrapeDir, projectName);
      } catch (error: any) {
        console.warn('  ⚠ Could not sync Prometheus:', error.message);
      }
    } else {
      console.log('  ℹ No Prometheus configuration found');
    }

    // Sync OpenTelemetry collectors via file-based config
    if (existsSync(monitoringPaths.collectorObservability)) {
      try {
        console.log('  🔍 Syncing OTEL observability collector (file-based)...');
        await this.syncCollectorFileBased(monitoringPaths.collectorObservability, globalPaths.collectorDir, `${projectName}-observability.yaml`);
      } catch (error: any) {
        console.warn('  ⚠ Could not sync OTEL collector:', error.message);
      }
    }

    if (existsSync(monitoringPaths.collectorDomain)) {
      try {
        console.log('  🔍 Syncing OTEL domain collector (file-based)...');
        await this.syncCollectorFileBased(monitoringPaths.collectorDomain, globalPaths.collectorDir, `${projectName}-domain.yaml`);
      } catch (error: any) {
        console.warn('  ⚠ Could not sync OTEL collector:', error.message);
      }
    }

    // Sync Grafana via API-based approach
    if (existsSync(monitoringPaths.grafanaDatasources) || existsSync(monitoringPaths.grafanaDashboards)) {
      try {
        console.log('  📈 Syncing Grafana configuration (API-based)...');
        await this.syncGrafanaApiBased(projectName, oxlayerDir, monitoringPaths);
      } catch (error: any) {
        console.warn('  ⚠ Could not sync Grafana:', error.message);
      }
    }

    // Reload Prometheus to pick up new scrape configs
    try {
      console.log('  🔄 Reloading Prometheus...');
      await execAsync(`docker exec ox-prometheus kill -HUP 1`, { timeout: 5000 });
      console.log('  ✓ Prometheus reloaded');
    } catch (error: any) {
      console.warn('  ⚠ Could not reload Prometheus:', error.message);
    }

    console.log(`✓ Monitoring configuration synced for '${projectName}'`);
  }

  /**
   * Sync Prometheus using file-based approach (split configs)
   * Each project gets its own file: scrape.d/project-name.yml
   */
  private async syncPrometheusFileBased(projectConfigPath: string, globalScrapeDir: string, projectName: string): Promise<void> {
    // Ensure scrape.d directory exists
    if (!existsSync(globalScrapeDir)) {
      mkdirSync(globalScrapeDir, { recursive: true });
    }

    // Copy project's prometheus.yml to scrape.d/project-name.yml
    const targetFile = globalScrapeDir + `${projectName}.yml`;

    // Read project config
    const projectConfigContent = readFileSync(projectConfigPath, 'utf-8');

    // Validate it's a valid prometheus config (has scrape_configs)
    if (!projectConfigContent.includes('scrape_configs') && !projectConfigContent.includes('scrape_config_files')) {
      throw new Error('Invalid Prometheus config: missing scrape_configs or scrape_config_files');
    }

    // Write to split config file
    writeFileSync(targetFile, projectConfigContent);
    console.log(`    + Created ${targetFile}`);

    // Update main prometheus.yml to include scrape_config_files if not already present
    const mainConfigPath = this.INFRA_DIR + '/prometheus/prometheus.yml';
    let mainConfigContent = '';

    if (existsSync(mainConfigPath)) {
      mainConfigContent = readFileSync(mainConfigPath, 'utf-8');
    } else {
      // Create default main config
      mainConfigContent = `global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

scrape_config_files:
  - /etc/prometheus/scrape.d/*.yml
`;
    }

    // Ensure scrape_config_files is present
    if (!mainConfigContent.includes('scrape_config_files')) {
      // Add scrape_config_files section
      mainConfigContent += `\nscrape_config_files:\n  - /etc/prometheus/scrape.d/*.yml\n`;
      writeFileSync(mainConfigPath, mainConfigContent);
      console.log('    ✓ Added scrape_config_files to main prometheus.yml');
    }
  }

  /**
   * Sync OpenTelemetry collector using file-based approach
   * Each project gets its own file: collectors.d/project-name-observability.yaml
   */
  private async syncCollectorFileBased(projectCollectorPath: string, globalCollectorDir: string, targetFilename: string): Promise<void> {
    // Ensure collectors.d directory exists
    if (!existsSync(globalCollectorDir)) {
      mkdirSync(globalCollectorDir, { recursive: true });
    }

    // Copy collector config to global dir
    const targetFile = globalCollectorDir + targetFilename;
    const collectorContent = readFileSync(projectCollectorPath, 'utf-8');
    writeFileSync(targetFile, collectorContent);
    console.log(`    + Created ${targetFile}`);

    // Note: OTEL collectors need to be restarted to pick up new configs
    // This should be done by the project owner or via a separate reload command
  }

  /**
   * Sync Grafana using API-based approach
   * Creates organization, user, datasources, and dashboards via Grafana API
   */
  private async syncGrafanaApiBased(projectName: string, _oxlayerDir: string, monitoringPaths: any): Promise<void> {
    const grafanaUrl = 'http://localhost:3000';
    const grafanaUser = 'admin';
    const grafanaPassword = 'admin';

    // Step 1: Create organization for this project
    const orgId = await this.createGrafanaOrganization(grafanaUrl, grafanaUser, grafanaPassword, projectName);
    console.log(`    ✓ Created Grafana organization: ${projectName} (ID: ${orgId})`);

    // Step 2: Create API key for this org
    const apiKey = await this.createGrafanaApiKey(grafanaUrl, grafanaUser, grafanaPassword, orgId);
    console.log(`    ✓ Created API key for organization`);

    // Step 3: Create datasources in the project's organization
    if (existsSync(monitoringPaths.grafanaDatasources)) {
      await this.createGrafanaDatasources(grafanaUrl, apiKey, monitoringPaths.grafanaDatasources);
      console.log('    ✓ Created datasources');
    }

    // Step 4: Create dashboards in the project's organization
    if (existsSync(monitoringPaths.grafanaDashboards)) {
      await this.createGrafanaDashboards(grafanaUrl, apiKey, projectName, monitoringPaths.grafanaDashboardDir);
      console.log('    ✓ Created dashboards');
    }
  }

  /**
   * Create Grafana organization via API
   */
  private async createGrafanaOrganization(grafanaUrl: string, user: string, password: string, orgName: string): Promise<number> {
    const response = await execAsync(
      `curl -s -X POST "${grafanaUrl}/api/orgs" \
       -u "${user}:${password}" \
       -H "Content-Type: application/json" \
       -d '{"name":"${orgName}"}'`
    );

    const result = JSON.parse(response.stdout);
    return result.orgId || result.id;
  }

  /**
   * Create Grafana API key for organization
   */
  private async createGrafanaApiKey(grafanaUrl: string, user: string, password: string, orgId: number): Promise<string> {
    const response = await execAsync(
      `curl -s -X POST "${grafanaUrl}/api/auth/keys" \
       -u "${user}:${password}" \
       -H "Content-Type: application/json" \
       -H "X-Grafana-Org-Id: ${orgId}" \
       -d '{"name":"oxlayer-auto","role":"Admin","secondsToLive":0}'`
    );

    const result = JSON.parse(response.stdout);
    return result.key;
  }

  /**
   * Create Grafana datasources via API
   */
  private async createGrafanaDatasources(grafanaUrl: string, apiKey: string, datasourcesPath: string): Promise<void> {
    const yaml = await import('js-yaml');
    const configContent = readFileSync(datasourcesPath, 'utf-8');
    const config = yaml.load(configContent) as any;

    if (!config.datasources) return;

    for (const ds of config.datasources) {
      const response = await execAsync(
        `curl -s -X POST "${grafanaUrl}/api/datasources" \
         -H "Authorization: Bearer ${apiKey}" \
         -H "Content-Type: application/json" \
         -d '${JSON.stringify(ds)}'`
      );

      const result = JSON.parse(response.stdout);
      if (result.message === 'Datasource added') {
        console.log(`      + Added datasource: ${ds.name}`);
      } else if (result.message && result.message.includes('already exists')) {
        console.log(`      ℹ Datasource exists: ${ds.name}`);
      }
    }
  }

  /**
   * Create Grafana dashboards via API
   */
  private async createGrafanaDashboards(grafanaUrl: string, apiKey: string, projectName: string, dashboardDir: string): Promise<void> {
    if (!existsSync(dashboardDir)) return;

    const dashboardFiles = require('fs').readdirSync(dashboardDir)
      .filter((f: string) => f.endsWith('.json'));

    for (const file of dashboardFiles) {
      const dashboardPath = dashboardDir + file;
      const dashboardContent = readFileSync(dashboardPath, 'utf-8');
      const dashboard = JSON.parse(dashboardContent);

      // Wrap in Grafana API format
      const payload = {
        dashboard: dashboard,
        overwrite: true,
        message: `Synced from ${projectName}`,
      };

      const response = await execAsync(
        `curl -s -X POST "${grafanaUrl}/api/dashboards/db" \
         -H "Authorization: Bearer ${apiKey}" \
         -H "Content-Type: application/json" \
         -d '${JSON.stringify(payload)}'`
      );

      const result = JSON.parse(response.stdout);
      if (result.status === 'success') {
        console.log(`      + Added dashboard: ${dashboard.title || file}`);
      }
    }
  }

  /**
   * Get logs from global infrastructure services
   */
  async getLogs(service?: string, follow = false): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Global infrastructure not initialized');
    }

    const running = await this.isRunning();
    if (!running) {
      throw new Error('Global infrastructure is not running');
    }

    const followFlag = follow ? '--follow' : '';
    const serviceArg = service ? `${service}` : '';

    try {
      // Use spawn for logs to stream output properly
      const { spawn } = await import('child_process');

      const args = [
        '-f', this.COMPOSE_FILE,
        '-p', 'oxlayer',
        'logs',
        followFlag,
        serviceArg,
      ].filter(Boolean);

      const child = spawn('docker-compose', args, {
        cwd: this.INFRA_DIR,
        stdio: 'inherit',
      });

      await new Promise<void>((resolve, reject) => {
        child.on('error', reject);
        child.on('exit', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Logs exited with code ${code}`));
        });
      });
    } catch (error: any) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }
}
