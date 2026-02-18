/**
 * Provisioner Service for Global OxLayer Infrastructure Service
 * Handles runtime tenant provisioning (PostgreSQL, Redis, RabbitMQ, Keycloak)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { ProjectResources, ProjectConfig, ProjectsRegistry } from './types';
import { generatePassword, sanitizeName } from './utils';

const execAsync = promisify(exec);

export class ProvisionerService {
  constructor(
    private readonly oxlayerDir: string,
    private readonly infraDir: string
  ) { }

  /**
   * Register a new project with runtime provisioning
   * IDEMPOTENT: Safe to run multiple times
   * THREAD-SAFE: Uses locking to prevent race conditions
   */
  async registerProject(
    projectName: string,
    projectPath: string,
    withLock: <T>(callback: () => Promise<T>) => Promise<T>,
    loadRegistry: () => ProjectsRegistry,
    saveRegistry: (registry: ProjectsRegistry) => void,
    createProjectLocalConfig: (projectPath: string, projectName: string, config: ProjectConfig) => void
  ): Promise<ProjectConfig> {
    return withLock(async () => {
      const registry = loadRegistry();

      // Check if already registered
      if (registry.projects[projectName]) {
        console.log(`ℹ  Project '${projectName}' is already registered`);
        return registry.projects[projectName];
      }

      console.log(`📝 Registering project '${projectName}'...`);

      // Generate secure credentials
      const postgresUser = sanitizeName(projectName) + '_user';
      const postgresPassword = generatePassword();
      const rabbitmqUser = sanitizeName(projectName);
      const rabbitmqPassword = generatePassword();
      const keycloakClientSecret = generatePassword();

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
      saveRegistry(registry);

      // Create project-local .oxlayer folder
      createProjectLocalConfig(projectPath, projectName, projectConfig);

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
    const dbName = sanitizeName(projectName);

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
        // Ensure schema permissions are set (in case user was created without them)
        await execAsync(
          `docker exec ox-postgres psql -U postgres -d ${dbName} -c "GRANT ALL ON SCHEMA public TO ${user};"`,
          { timeout: 5000 }
        );
        await execAsync(
          `docker exec ox-postgres psql -U postgres -d ${dbName} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${user};"`,
          { timeout: 5000 }
        );
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
        // Grant schema privileges (required for creating tables, running migrations)
        await execAsync(
          `docker exec ox-postgres psql -U postgres -d ${dbName} -c "GRANT ALL ON SCHEMA public TO ${user};"`,
          { timeout: 5000 }
        );
        await execAsync(
          `docker exec ox-postgres psql -U postgres -d ${dbName} -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${user};"`,
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
    const vhost = sanitizeName(projectName);

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
      // Permissions for both project-prefixed resources and generic names
      // Allows: alolabs.*, alo.*, events, etc.
      await execAsync(
        `docker exec ox-rabbitmq rabbitmqctl set_permissions -p ${vhost} ${user} ".*" ".*" ".*"`,
        { timeout: 5000 }
      );
      console.log(`  ✓ Set RabbitMQ permissions for ${user} on ${vhost}`);

      // Create default exchange and queue using rabbitmqadmin
      const defaultQueue = `${projectName}.manager.events`;
      const defaultExchange = `${projectName}.events`;

      try {
        // Ensure rabbitmqadmin is installed
        try {
          await execAsync(`docker exec ox-rabbitmq which rabbitmqadmin`, { timeout: 2000 });
        } catch {
          // Install rabbitmqadmin if not present
          await execAsync(`docker exec ox-rabbitmq wget -O /usr/local/bin/rabbitmqadmin http://localhost:15672/cli/rabbitmqadmin`, { timeout: 10000 });
          await execAsync(`docker exec ox-rabbitmq chmod +x /usr/local/bin/rabbitmqadmin`, { timeout: 2000 });
        }
        // Check if queue exists
        const queueExists = await execAsync(
          `docker exec ox-rabbitmq rabbitmqctl list_queues -p ${vhost} | grep "^${defaultQueue}" || true`,
          { timeout: 5000 }
        );

        if (queueExists.stdout.trim()) {
          console.log(`  ℹ  RabbitMQ queue '${defaultQueue}' already exists`);
        } else {
          // Create queue, exchange, and binding using rabbitmqadmin with authentication
          await execAsync(
            `docker exec ox-rabbitmq rabbitmqadmin --username=guest --password=guest --vhost=${vhost} declare queue name=${defaultQueue} durable=true`,
            { timeout: 5000 }
          );
          await execAsync(
            `docker exec ox-rabbitmq rabbitmqadmin --username=guest --password=guest --vhost=${vhost} declare exchange name=${defaultExchange} type=topic durable=true`,
            { timeout: 5000 }
          );
          await execAsync(
            `docker exec ox-rabbitmq rabbitmqadmin --username=guest --password=guest --vhost=${vhost} declare binding source=${defaultExchange} destination=${defaultQueue} destination_type=queue routing_key="#"`,
            { timeout: 5000 }
          );
          console.log(`  ✓ Created RabbitMQ queue: ${defaultQueue}`);
          console.log(`    - Exchange: ${defaultExchange} (topic)`);
          console.log(`    - Binding: ${defaultExchange} -> ${defaultQueue} (#)`);
        }
      } catch (error: any) {
        // Non-fatal - queue/exchange creation is nice-to-have but not critical
        console.warn(`  ⚠ Could not create queue/exchange: ${error.message}`);
      }

      return { vhost, user, password, queue: defaultQueue, exchange: defaultExchange };
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
    const realm = sanitizeName(projectName);
    const clientId = projectName + '-client';

    // TODO: Implement realm creation via Keycloak Admin API
    console.log(`  ⚠ Keycloak realm '${realm}' should be created manually via Admin API`);
    console.log(`     Client ID: ${clientId}`);
    console.log(`     Client Secret: ${clientSecret}`);

    return { realm, clientId, clientSecret };
  }

  /**
   * Create project-local .ox folder with configuration
   * This allows projects to have local overrides and custom settings
   */
  createProjectLocalConfig(projectPath: string, projectName: string, config: ProjectConfig): void {
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
        globalRegistry: `${this.oxlayerDir}/projects.json`,
      };

      writeFileSync(configPath, JSON.stringify(projectConfig, null, 2));

      // Create .env.example template (without sensitive data)
      const envExamplePath = oxDir + '/.env.example';
      const envTemplate = `# OxLayer Environment Variables for ${projectName}
# Generated: ${new Date().toISOString()}
# Copy this file to .env.local or use: ox infra env

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=${config.resources.postgres.database}
POSTGRES_USER=${config.resources.postgres.user}
POSTGRES_PASSWORD=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=${config.resources.redis.db}
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_QUEUE=${config.resources.rabbitmq.queue}
RABBITMQ_EXCHANGE=${config.resources.rabbitmq.exchange}
RABBITMQ_VHOST=${config.resources.rabbitmq.vhost}
RABBITMQ_USERNAME=${config.resources.rabbitmq.user}
RABBITMQ_PASSWORD=

# Keycloak
KEYCLOAK_SERVER_URL=http://localhost:8080
KEYCLOAK_REALM=${config.resources.keycloak.realm}
KEYCLOAK_CLIENT_ID=${config.resources.keycloak.clientId}
KEYCLOAK_CLIENT_SECRET=
`;
      writeFileSync(envExamplePath, envTemplate);

      // Create monitoring configuration templates
      this.createMonitoringTemplates(oxDir, projectName, config);

      // Create README.md with documentation
      const readmePath = oxDir + '/README.md';
      const readme = this.generateReadme(projectName, config);
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
  private createMonitoringTemplates(oxlayerDir: string, projectName: string, _config: ProjectConfig): void {
    try {
      // Create Prometheus template
      const prometheusDir = oxlayerDir + '/prometheus';
      if (!existsSync(prometheusDir)) {
        mkdirSync(prometheusDir, { recursive: true });
      }

      const prometheusTemplate = this.generatePrometheusTemplate(projectName);
      writeFileSync(prometheusDir + '/prometheus.yml', prometheusTemplate);

      // Create Grafana datasources template
      const grafanaDatasourcesDir = oxlayerDir + '/grafana/provisioning/datasources';
      if (!existsSync(grafanaDatasourcesDir)) {
        mkdirSync(grafanaDatasourcesDir, { recursive: true });
      }

      const datasourcesTemplate = this.generateGrafanaDatasourcesTemplate(projectName);
      writeFileSync(grafanaDatasourcesDir + '/datasources.yml', datasourcesTemplate);

      // Create Grafana dashboards template
      const grafanaDashboardsDir = oxlayerDir + '/grafana/provisioning/dashboards';
      if (!existsSync(grafanaDashboardsDir)) {
        mkdirSync(grafanaDashboardsDir, { recursive: true });
      }

      const dashboardsTemplate = this.generateGrafanaDashboardsTemplate(projectName);
      writeFileSync(grafanaDashboardsDir + '/dashboards.yml', dashboardsTemplate);

      // Create example dashboard (empty template)
      const exampleDashboard = this.generateExampleDashboard(projectName);
      writeFileSync(grafanaDashboardsDir + `/example-dashboard.json`, JSON.stringify(exampleDashboard, null, 2));

      // Create OpenTelemetry collector templates (optional)
      const collectorObservabilityTemplate = this.generateCollectorObservabilityTemplate(projectName);
      writeFileSync(oxlayerDir + '/collector-observability.yaml', collectorObservabilityTemplate);

      const collectorDomainTemplate = this.generateCollectorDomainTemplate(projectName);
      writeFileSync(oxlayerDir + '/collector-domain.yaml', collectorDomainTemplate);

      console.log(`    ✓ Created monitoring configuration templates`);
    } catch (error) {
      // Non-fatal
      console.warn(`    ⚠ Could not create monitoring templates: ${error}`);
    }
  }

  private generatePrometheusTemplate(projectName: string): string {
    return `# Prometheus Scrape Configuration for ${projectName}
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
  }

  private generateGrafanaDatasourcesTemplate(projectName: string): string {
    return `# Grafana Datasources for ${projectName}
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
`;
  }

  private generateGrafanaDashboardsTemplate(projectName: string): string {
    return `# Grafana Dashboards Provider for ${projectName}
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
  }

  private generateExampleDashboard(projectName: string): any {
    return {
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
  }

  private generateCollectorObservabilityTemplate(projectName: string): string {
    return `# OpenTelemetry Collector - Observability Pipeline
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
  }

  private generateCollectorDomainTemplate(_projectName: string): string {
    return `# OpenTelemetry Collector - Domain Events Pipeline
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
  }

  private generateReadme(projectName: string, config: ProjectConfig): string {
    return `# OxLayer Configuration for ${projectName}

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
  }

  /**
   * Sync monitoring configuration from project to global infrastructure
   */
  async syncMonitoringConfig(projectName: string, oxDir: string, getProject: (name: string) => ProjectConfig | null): Promise<void> {
    console.log(`🔄 Syncing monitoring configuration for '${projectName}'...`);

    const project = getProject(projectName);
    if (!project) {
      throw new Error(`Project '${projectName}' not found`);
    }

    // Define monitoring config paths in project
    const monitoringPaths = {
      prometheus: oxDir + '/prometheus/prometheus.yml',
      grafanaDatasources: oxDir + '/grafana/provisioning/datasources/datasources.yml',
      grafanaDashboards: oxDir + '/grafana/provisioning/dashboards/dashboards.yml',
      grafanaDashboardDir: oxDir + '/grafana/provisioning/dashboards/',
      collectorObservability: oxDir + '/collector-observability.yaml',
      collectorDomain: oxDir + '/collector-domain.yaml',
    };

    // Define global infra paths (split config approach)
    const globalPaths = {
      prometheusScrapeDir: this.infraDir + '/prometheus/scrape.d/',
      prometheusMain: this.infraDir + '/prometheus/prometheus.yml',
      collectorDir: this.infraDir + '/collectors/',
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
        await this.syncGrafanaApiBased(projectName, oxDir, monitoringPaths);
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
    const mainConfigPath = this.infraDir + '/prometheus/prometheus.yml';
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
   */
  private async syncGrafanaApiBased(projectName: string, _oxlayerDir: string, monitoringPaths: any): Promise<void> {
    const grafanaUrl = 'http://localhost:3000';
    const grafanaUser = 'admin';
    const grafanaPassword = 'admin';

    // Step 1: Create organization for this project
    const orgId = await this.createGrafanaOrganization(grafanaUrl, grafanaUser, grafanaPassword, projectName);
    console.log(`    ✓ Created Grafana organization: ${projectName} (ID: ${orgId})`);

    // Step 2: Create user for this project
    const projectUser = await this.createGrafanaUser(grafanaUrl, grafanaUser, grafanaPassword, projectName, orgId);
    console.log(`    ✓ Created Grafana user: ${projectUser}`);

    // Step 3: Create datasources using admin credentials (simpler than API keys in Grafana 12.x)
    if (existsSync(monitoringPaths.grafanaDatasources)) {
      await this.createGrafanaDatasourcesWithCreds(grafanaUrl, grafanaUser, grafanaPassword, orgId, monitoringPaths.grafanaDatasources);
      console.log('    ✓ Created datasources');
    }

    // Step 4: Create dashboards using admin credentials
    if (existsSync(monitoringPaths.grafanaDashboards)) {
      await this.createGrafanaDashboardsWithCreds(grafanaUrl, grafanaUser, grafanaPassword, orgId, projectName, monitoringPaths.grafanaDashboardDir);
      console.log('    ✓ Created dashboards');
    }
  }

  /**
   * Create Grafana organization via API
   */
  private async createGrafanaOrganization(grafanaUrl: string, user: string, password: string, orgName: string): Promise<number> {
    // First, try to create the organization
    const response = await execAsync(
      `curl -s -X POST "${grafanaUrl}/api/orgs" \
       -u "${user}:${password}" \
       -H "Content-Type: application/json" \
       -d '{"name":"${orgName}"}'`
    );

    const result = JSON.parse(response.stdout);

    // If organization was created successfully
    if (result.orgId) {
      return result.orgId;
    }

    // If organization already exists, look up its ID
    if (result.message && result.message.includes('name taken')) {
      const listResponse = await execAsync(
        `curl -s -X GET "${grafanaUrl}/api/orgs" \
         -u "${user}:${password}"`
      );

      const orgs = JSON.parse(listResponse.stdout);
      const existingOrg = orgs.find((o: any) => o.name === orgName);

      if (existingOrg && existingOrg.id) {
        return existingOrg.id;
      }
    }

    throw new Error(`Failed to create or find organization: ${JSON.stringify(result)}`);
  }

  /**
   * Create Grafana user for project organization
   */
  private async createGrafanaUser(grafanaUrl: string, adminUser: string, adminPassword: string, projectName: string, _orgId: number): Promise<string> {
    // Generate a secure password for the project user
    const password = generatePassword(16);
    const username = `${projectName}-user`;

    // Step 1: Create user in global context using admin API
    const createResponse = await execAsync(
      `curl -s -X POST "${grafanaUrl}/api/admin/users" \
       -u "${adminUser}:${adminPassword}" \
       -H "Content-Type: application/json" \
       -d '{
         "name":"${projectName}",
         "email":"${projectName}@oxlayer.local",
         "login":"${username}",
         "password":"${password}"
       }'`
    );

    let createResult = JSON.parse(createResponse.stdout);

    // Check if user was created or already exists
    if (createResult.id) {
      console.log(`      → Created user: ${username} (ID: ${createResult.id})`);
    } else if (createResult.message && createResult.message.includes('already exists')) {
      console.log(`      ℹ User ${username} already exists`);
    } else {
      throw new Error(`Failed to create user: ${JSON.stringify(createResult)}`);
    }

    console.log(`      ℹ User created globally (org membership requires manual setup or will use API key)`);

    return username;
  }

  /**
   * Create Grafana datasources via API using admin credentials
   */
  private async createGrafanaDatasourcesWithCreds(grafanaUrl: string, user: string, password: string, orgId: number, datasourcesPath: string): Promise<void> {
    const yaml = await import('js-yaml');
    const configContent = readFileSync(datasourcesPath, 'utf-8');
    const config = yaml.load(configContent) as any;

    if (!config.datasources) return;

    for (const ds of config.datasources) {
      try {
        const response = await execAsync(
          `curl -s -X POST "${grafanaUrl}/api/datasources" \
           -u "${user}:${password}" \
           -H "Content-Type: application/json" \
           -H "X-Grafana-Org-Id: ${orgId}" \
           -d '${JSON.stringify(ds)}'`
        );

        const result = JSON.parse(response.stdout);
        if (result.message === 'Datasource added') {
          console.log(`      + Added datasource: ${ds.name}`);
        } else if (result.message && result.message.includes('already exists')) {
          console.log(`      ℹ Datasource exists: ${ds.name}`);
        } else {
          console.log(`      ⚠ Datasource ${ds.name}: ${JSON.stringify(result)}`);
        }
      } catch (error: any) {
        console.log(`      ✗ Failed to add datasource ${ds.name}: ${error.message}`);
      }
    }
  }

  /**
   * Create Grafana dashboards via API using admin credentials
   */
  private async createGrafanaDashboardsWithCreds(grafanaUrl: string, user: string, password: string, orgId: number, projectName: string, dashboardDir: string): Promise<void> {
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
        folderId: 0,
        message: `Added by OxLayer for ${projectName}`,
        overwrite: true
      };

      try {
        const response = await execAsync(
          `curl -s -X POST "${grafanaUrl}/api/dashboards/db" \
           -u "${user}:${password}" \
           -H "Content-Type: application/json" \
           -H "X-Grafana-Org-Id: ${orgId}" \
           -d '${JSON.stringify(payload)}'`
        );

        const result = JSON.parse(response.stdout);
        if (result.status === 'success') {
          console.log(`      + Added dashboard: ${dashboard.title || file}`);
        } else if (result.message && result.message.includes('already exists')) {
          console.log(`      ℹ Dashboard exists: ${dashboard.title || file}`);
        } else {
          console.log(`      ⚠ Dashboard ${dashboard.title || file}: ${JSON.stringify(result)}`);
        }
      } catch (error: any) {
        console.log(`      ✗ Failed to add dashboard ${dashboard.title || file}: ${error.message}`);
      }
    }
  }
}
