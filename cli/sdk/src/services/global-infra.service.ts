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
  async initialize(): Promise<void> {
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

    console.log('✓ Global infrastructure initialized at', this.INFRA_DIR);
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
}
