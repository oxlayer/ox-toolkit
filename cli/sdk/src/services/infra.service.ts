/**
 * Infrastructure Service
 *
 * Manages Docker Compose infrastructure for OxLayer
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import type {
  ServiceDefinition,
  Environment,
  ServiceStatus,
  EnvironmentConfig,
} from '../types/infra.js';
import { InfraConfigService } from './infra-config.service.js';
import { DockerComposeGenerator } from './docker-compose-generator.service.js';

const execAsync = promisify(exec);

/**
 * Service definitions from docker-compose.yml
 */
export const SERVICE_DEFINITIONS: Record<string, ServiceDefinition> = {
  postgres: {
    name: 'postgres',
    displayName: 'PostgreSQL',
    description: 'Primary database for application data',
    category: 'database',
    ports: ['5432:5432'],
    volumes: ['postgres_data'],
    dependsOn: [],
    enabledByDefault: true,
    requiresAuth: false,
    healthCheck: {
      command: 'pg_isready -U postgres',
      interval: '10s',
      timeout: '5s',
      retries: 5,
    },
  },
  redis: {
    name: 'redis',
    displayName: 'Redis',
    description: 'In-memory cache and session store',
    category: 'cache',
    ports: ['6379:6379'],
    volumes: ['redis_data'],
    dependsOn: [],
    enabledByDefault: true,
    requiresAuth: false,
    healthCheck: {
      command: 'redis-cli ping',
      interval: '10s',
      timeout: '5s',
      retries: 5,
    },
  },
  rabbitmq: {
    name: 'rabbitmq',
    displayName: 'RabbitMQ',
    description: 'Message queue for event-driven architecture',
    category: 'messaging',
    ports: ['5672:5672', '15672:15672'],
    volumes: ['rabbitmq_data'],
    dependsOn: [],
    enabledByDefault: true,
    requiresAuth: false,
    healthCheck: {
      command: 'rabbitmq-diagnostics ping',
      interval: '10s',
      timeout: '5s',
      retries: 5,
    },
  },
  keycloak: {
    name: 'keycloak',
    displayName: 'Keycloak',
    description: 'Identity and access management server',
    category: 'auth',
    ports: ['8180:8080', '8181:8081'],
    volumes: ['keycloak_data', 'keycloak_postgres_data'],
    dependsOn: ['keycloak-postgres'],
    enabledByDefault: true,
    requiresAuth: true,
    healthCheck: {
      command: 'wget --quiet --tries=1 --spider http://localhost:8080/health/ready',
      interval: '10s',
      timeout: '5s',
      retries: 20,
    },
  },
  'keycloak-postgres': {
    name: 'keycloak-postgres',
    displayName: 'Keycloak PostgreSQL',
    description: 'Database for Keycloak',
    category: 'database',
    ports: [],
    volumes: ['keycloak_postgres_data'],
    dependsOn: [],
    enabledByDefault: true,
    requiresAuth: false,
  },
  'keycloak-proxy': {
    name: 'keycloak-proxy',
    displayName: 'Keycloak Proxy',
    description: 'Nginx reverse proxy for Keycloak',
    category: 'auth',
    ports: ['8080:8080', '8081:8081'],
    volumes: [],
    dependsOn: ['keycloak'],
    enabledByDefault: true,
    requiresAuth: false,
  },
  influxdb: {
    name: 'influxdb',
    displayName: 'InfluxDB',
    description: 'Time-series database for metrics',
    category: 'analytics',
    ports: ['8086:8086'],
    volumes: ['influxdb_data', 'influxdb_config'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: true,
  },
  grafana: {
    name: 'grafana',
    displayName: 'Grafana',
    description: 'Metrics and logs visualization dashboard',
    category: 'monitoring',
    ports: ['3000:3000'],
    volumes: ['grafana_data'],
    dependsOn: ['prometheus'],
    enabledByDefault: false,
    requiresAuth: true,
  },
  prometheus: {
    name: 'prometheus',
    displayName: 'Prometheus',
    description: 'Metrics collection and storage',
    category: 'monitoring',
    ports: ['9090:9090'],
    volumes: ['prometheus_data'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: false,
  },
  'otel-collector-observability': {
    name: 'otel-collector-observability',
    displayName: 'OTel Collector (Observability)',
    description: 'OpenTelemetry collector for logs and traces',
    category: 'monitoring',
    ports: ['14317:4317', '14318:4318', '8888:8888', '8889:8889'],
    volumes: [],
    dependsOn: ['quickwit'],
    enabledByDefault: false,
    requiresAuth: false,
  },
  'otel-collector-domain': {
    name: 'otel-collector-domain',
    displayName: 'OTel Collector (Domain)',
    description: 'OpenTelemetry collector for domain events',
    category: 'analytics',
    ports: ['24317:4317', '24318:4318', '18888:8888', '18889:8889'],
    volumes: [],
    dependsOn: ['clickhouse'],
    enabledByDefault: false,
    requiresAuth: false,
  },
  quickwit: {
    name: 'quickwit',
    displayName: 'Quickwit',
    description: 'Log search and analytics engine',
    category: 'search',
    ports: ['7280:7280', '7281:7281'],
    volumes: ['quickwit_data'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: false,
  },
  'jaeger-query': {
    name: 'jaeger-query',
    displayName: 'Jaeger',
    description: 'Distributed tracing UI',
    category: 'monitoring',
    ports: ['16686:16686', '16687:16687'],
    volumes: [],
    dependsOn: ['quickwit'],
    enabledByDefault: false,
    requiresAuth: false,
  },
  clickhouse: {
    name: 'clickhouse',
    displayName: 'ClickHouse',
    description: 'Analytical database for business analytics',
    category: 'analytics',
    ports: ['8123:8123', '9000:9000'],
    volumes: ['clickhouse_data', 'clickhouse_logs'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: true,
  },
  minio: {
    name: 'minio',
    displayName: 'MinIO',
    description: 'S3-compatible object storage',
    category: 'storage',
    ports: ['9000:9000', '9001:9001'],
    volumes: ['minio_data'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: true,
  },
  qdrant: {
    name: 'qdrant',
    displayName: 'Qdrant',
    description: 'Vector similarity search engine',
    category: 'search',
    ports: ['6333:6333', '6334:6334'],
    volumes: ['qdrant_data'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: false,
  },
  mongodb: {
    name: 'mongodb',
    displayName: 'MongoDB',
    description: 'NoSQL document database',
    category: 'database',
    ports: ['27017:27017'],
    volumes: ['mongodb_data', 'mongodb_config'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: true,
  },
  emqx: {
    name: 'emqx',
    displayName: 'EMQX',
    description: 'MQTT broker for IoT/IIoT messaging',
    category: 'messaging',
    ports: ['1883:1883', '8883:8883', '8083:8083', '8084:8084', '18083:18083'],
    volumes: ['emqx_data', 'emqx_log'],
    dependsOn: [],
    enabledByDefault: false,
    requiresAuth: true,
  },
};

/**
 * Environment configurations
 */
export const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    displayName: 'Development',
    description: 'Local development environment with default credentials',
    dockerComposeFile: 'docker-compose.yml',
    envFile: '.env.dev',
    defaultServices: ['postgres', 'redis', 'rabbitmq', 'keycloak', 'keycloak-postgres', 'keycloak-proxy'],
  },
  stg: {
    name: 'stg',
    displayName: 'Staging',
    description: 'Staging environment with production-like configuration',
    dockerComposeFile: 'docker-compose.stg.yml',
    envFile: '.env.stg',
    defaultServices: ['postgres', 'redis', 'rabbitmq', 'keycloak', 'keycloak-postgres', 'keycloak-proxy'],
  },
  prd: {
    name: 'prd',
    displayName: 'Production',
    description: 'Production environment with security hardening',
    dockerComposeFile: 'docker-compose.prd.yml',
    envFile: '.env.prd',
    defaultServices: ['postgres', 'redis', 'rabbitmq', 'keycloak', 'keycloak-postgres', 'keycloak-proxy'],
  },
};

export class InfraService {
  private configService: InfraConfigService;
  private composeGenerator: DockerComposeGenerator;

  constructor() {
    this.configService = new InfraConfigService();
    this.composeGenerator = new DockerComposeGenerator();

    // Initialize project infrastructure folder if it doesn't exist
    if (!this.configService.hasProjectInfra()) {
      this.configService.initializeProjectInfra();
    }
  }

  /**
   * Get the project infrastructure path
   */
  private getInfraPath(): string {
    return this.configService['getInfraPath']();
  }

  /**
   * Get the path to the docker-compose file for an environment
   */
  getDockerComposePath(environment: Environment): string {
    const infraPath = this.getInfraPath();
    const config = ENVIRONMENT_CONFIGS[environment];
    const composeFilePath = join(infraPath, config.dockerComposeFile);

    // Generate docker-compose file if it doesn't exist
    if (!existsSync(composeFilePath)) {
      this.composeGenerator.writeComposeFile(environment, composeFilePath);
    }

    return composeFilePath;
  }

  /**
   * Get the path to the environment file
   */
  getEnvPath(environment: Environment): string {
    const infraPath = this.getInfraPath();
    const config = ENVIRONMENT_CONFIGS[environment];
    return join(infraPath, config.envFile);
  }

  /**
   * Check if infrastructure files exist
   */
  checkInfraExists(environment: Environment): boolean {
    const dockerComposePath = this.getDockerComposePath(environment);
    return existsSync(dockerComposePath);
  }

  /**
   * Get service status
   */
  async getServiceStatus(serviceName?: string): Promise<ServiceStatus[]> {
    try {
      const infraPath = this.getInfraPath();
      const { stdout } = await execAsync('docker-compose ps --format json', {
        cwd: infraPath,
      });

      const services = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line));

      const mapService = (s: any) => {
        // Strip container prefix (oxlayer-) if present to match service name
        const name = s.Name.replace(/^oxlayer-/, '');
        return {
          name,
          status: s.State === 'running' ? 'running' : s.State === 'exited' ? 'stopped' : 'unknown',
          ports: s.Ports ? s.Ports.split(',').map((p: string) => p.trim().split('->')[0]) : [],
          health: s.Health,
        };
      };

      if (serviceName) {
        return services
          .map(mapService)
          .filter((s: any) => s.name === serviceName);
      }

      return services.map(mapService);
    } catch (error) {
      return [];
    }
  }

  /**
   * Start services
   */
  async startServices(services: string[], environment: Environment): Promise<void> {
    const composeFile = this.getDockerComposePath(environment);
    const envFile = this.getEnvPath(environment);
    const infraPath = this.getInfraPath();

    // Generate project-specific override file
    const overrideContent = this.configService.generateOverrideFile(services, environment);
    const overrideFile = join(infraPath, `docker-compose.${environment}.override.yml`);

    // Only write override file if there are actual custom configurations
    // Check if there's more than just the header and "services:"
    const hasCustomConfigs = overrideContent.includes('volumes:') || overrideContent.includes('environment:');

    if (hasCustomConfigs) {
      writeFileSync(overrideFile, overrideContent);
    } else if (existsSync(overrideFile)) {
      // Remove old override file if no custom configs exist
      unlinkSync(overrideFile);
    }

    let command = `docker-compose -f ${composeFile}`;

    // Add override file if it exists and has content
    if (hasCustomConfigs && existsSync(overrideFile)) {
      command += ` -f ${overrideFile}`;
    }

    if (existsSync(envFile)) {
      command += ` --env-file ${envFile}`;
    }

    command += ' up -d';

    if (services.length > 0 && services.length < Object.keys(SERVICE_DEFINITIONS).length) {
      command += ' ' + services.join(' ');
    }

    await execAsync(command, { cwd: infraPath });
  }

  /**
   * Stop services
   */
  async stopServices(services: string[] | undefined, environment: Environment): Promise<void> {
    const composeFile = this.getDockerComposePath(environment);
    const infraPath = this.getInfraPath();

    let command = `docker-compose -f ${composeFile} stop`;

    if (services && services.length > 0) {
      command += ' ' + services.join(' ');
    }

    await execAsync(command, { cwd: infraPath });
  }

  /**
   * Restart services
   */
  async restartServices(services: string[], environment: Environment): Promise<void> {
    const composeFile = this.getDockerComposePath(environment);
    const infraPath = this.getInfraPath();

    let command = `docker-compose -f ${composeFile} restart`;

    if (services.length > 0) {
      command += ' ' + services.join(' ');
    }

    await execAsync(command, { cwd: infraPath });
  }

  /**
   * Get logs from services
   */
  async getServiceLogs(serviceName: string, lines = 100, follow = false): Promise<void> {
    const infraPath = this.getInfraPath();
    const command = follow
      ? `docker-compose logs -f --tail=${lines} ${serviceName}`
      : `docker-compose logs --tail=${lines} ${serviceName}`;

    const child = spawn('sh', ['-c', command], {
      cwd: infraPath,
      stdio: 'inherit',
    });

    await new Promise((resolve, reject) => {
      child.on('close', resolve);
      child.on('error', reject);
    });
  }

  /**
   * Generate docker-compose override file
   */
  generateComposeOverride(services: string[], environment: Environment): void {
    const composeFile = this.getDockerComposePath(environment);
    const content = readFileSync(composeFile, 'utf-8');

    // Parse services to enable/disable
    const lines = content.split('\n');
    const result: string[] = [];
    let inServicesBlock = false;
    let currentService: string | null = null;
    let serviceIndent = 0;

    for (const line of lines) {
      if (line.match(/^\s*services:/)) {
        inServicesBlock = true;
        result.push(line);
        continue;
      }

      if (inServicesBlock) {
        const serviceMatch = line.match(/^(\s*)([a-zA-Z0-9-]+):/);
        if (serviceMatch) {
          currentService = serviceMatch[2];
          serviceIndent = serviceMatch[1].length;

          const isEnabled = services.includes(currentService);
          if (isEnabled) {
            result.push(line);
          } else {
            // Comment out disabled services
            result.push(`${serviceIndent}# ${currentService}: (disabled)`);
          }
          continue;
        }

        if (currentService && line.match(/^\S+/)) {
          // New service or end of services block
          currentService = null;
        }

        if (currentService) {
          const isEnabled = services.includes(currentService);
          if (isEnabled) {
            result.push(line);
          } else {
            // Comment out disabled service content
            result.push(`# ${line}`);
          }
          continue;
        }
      }

      result.push(line);
    }

    // Write override file
    const infraPath = this.getInfraPath();
    const overrideFile = join(infraPath, `docker-compose.${environment}.override.yml`);
    writeFileSync(overrideFile, result.join('\n'));
  }
}
