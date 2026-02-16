/**
 * Infrastructure Configuration Service
 *
 * Manages project-specific infrastructure configurations
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Environment } from '../types/infra.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ProjectInfraConfig {
  projectName: string;
  environment: Environment;
  customVolumes: {
    serviceName: string;
    hostPath: string;
    containerPath: string;
  }[];
  customEnvVars: {
    serviceName: string;
    vars: Record<string, string>;
  }[];
}

export class InfraConfigService {
  private getProjectRoot(): string {
    // Start from current working directory and search for .ox folder
    let currentDir = process.cwd();

    while (currentDir !== dirname(currentDir)) {
      const oxPath = join(currentDir, '.ox');
      if (existsSync(oxPath)) {
        return currentDir;
      }
      currentDir = dirname(currentDir);
    }

    // If not found, create in current directory
    return process.cwd();
  }

  private getOxPath(): string {
    const projectRoot = this.getProjectRoot();
    return join(projectRoot, '.ox');
  }

  private getInfraPath(): string {
    return join(this.getOxPath(), 'infra');
  }

  /**
   * Initialize project infrastructure folders
   */
  initializeProjectInfra(): void {
    const infraPath = this.getInfraPath();

    // Create directory structure
    const folders = [
      'collectors',
      'nginx',
      'grafana/provisioning',
      'prometheus',
      'volumes',
    ];

    for (const folder of folders) {
      const folderPath = join(infraPath, folder);
      if (!existsSync(folderPath)) {
        mkdirSync(folderPath, { recursive: true });
      }
    }

    // Create service-specific volume folders
    this.createVolumeFolders(infraPath);

    // Create README files
    this.createReadmes();
  }

  /**
   * Create service-specific volume folders
   */
  private createVolumeFolders(infraPath: string): void {
    const { SERVICE_DEFINITIONS } = require('./infra.service.js');

    const volumeServices = [
      'postgres',
      'redis',
      'rabbitmq',
      'keycloak',
      'keycloak-postgres',
      'influxdb',
      'grafana',
      'prometheus',
      'clickhouse',
      'minio',
      'mongodb',
      'emqx',
    ];

    for (const serviceName of volumeServices) {
      const volumePath = join(infraPath, 'volumes', serviceName);
      if (!existsSync(volumePath)) {
        mkdirSync(volumePath, { recursive: true });
      }

      // Create README in each volume folder
      const readmePath = join(volumePath, 'README.md');
      if (!existsSync(readmePath)) {
        const serviceDef = SERVICE_DEFINITIONS[serviceName];
        const displayName = serviceDef ? serviceDef.displayName : serviceName;

        writeFileSync(
          readmePath,
          `# ${displayName} Data Volume

This folder contains persistent data for the ${displayName} service.

## Purpose

Data stored in this volume persists across container restarts.

## Data Location

- Host: \`.ox/infra/volumes/${serviceName}/\`
- Container: See service definition

## ⚠️  WARNING

**Do not delete this folder unless you want to lose all ${displayName} data!**

## Backup

To backup this data:
\`\`\`bash
# Create a backup
tar -czf ${serviceName}-backup-$(date +%Y%m%d).tar.gz .

# Restore from backup
tar -xzf ${serviceName}-backup-YYYYMMDD.tar.gz
\`\`\`

## Reset

To reset ${displayName} to a clean state:
\`\`\`bash
# Stop services first
ox infra stop

# Remove data
rm -rf .ox/infra/volumes/${serviceName}/*

# Restart
ox infra dev
\`\`\`
`
        );
      }
    }
  }

  /**
   * Create README files for each folder
   */
  private createReadmes(): void {
    const infraPath = this.getInfraPath();

    // Main README
    const mainReadme = join(infraPath, 'README.md');
    if (!existsSync(mainReadme)) {
      writeFileSync(mainReadme, `# Project Infrastructure Configuration

This folder contains project-specific overrides for OxLayer infrastructure.

## Directory Structure

- \`collectors/\` - Custom OpenTelemetry collector configurations
- \`nginx/\` - Custom nginx configuration files
- \`grafana/provisioning/\` - Grafana provisioning dashboards and datasources
- \`prometheus/\` - Custom Prometheus configuration
- \`volumes/\` - Project-specific volume mounts

## Usage

Files in these directories will be automatically mounted to the corresponding services when you run:
- \`ox infra dev\`
- \`ox infra stg\`
- \`ox infra prd\`

## Example

To add a custom collector configuration:
1. Create a file in \`collectors/my-collector.yaml\`
2. Restart infrastructure: \`ox infra restart\`
3. The configuration will be automatically mounted

`);
    }

    // Collectors README
    const collectorsReadme = join(infraPath, 'collectors', 'README.md');
    if (!existsSync(collectorsReadme)) {
      writeFileSync(
        collectorsReadme,
        `# Custom Collectors

Place your custom OpenTelemetry collector configurations here.

## Files placed here will be mounted to:
- \`otel-collector-observability\` service: \`/etc/collector-custom/\`
- \`otel-collector-domain\` service: \`/etc/collector-custom/\`

## Example Configuration

See the OxLayer documentation for collector configuration examples.
`
      );
    }

    // Nginx README
    const nginxReadme = join(infraPath, 'nginx', 'README.md');
    if (!existsSync(nginxReadme)) {
      writeFileSync(
        nginxReadme,
        `# Custom Nginx Configuration

Place your custom nginx configuration files here.

## Files placed here will be mounted to:
- \`keycloak-proxy\` service: \`/etc/nginx/conf.d/custom/\`

## Example

\`\`\`nginx
server {
    listen 8082;
    server_name localhost;

    location / {
        proxy_pass http://keycloak:8080;
    }
}
\`\`\`
`
      );
    }

    // Grafana README
    const grafanaReadme = join(infraPath, 'grafana', 'provisioning', 'README.md');
    if (!existsSync(grafanaReadme)) {
      writeFileSync(
        grafanaReadme,
        `# Grafana Provisioning

Place your Grafana provisioning files here.

## Structure
- \`datasources/\` - Datasource provisioning
- \`dashboards/\` - Dashboard provisioning

## Files placed here will be mounted to:
- \`grafana\` service: \`/etc/grafana/provisioning/\`

## Example

See [Grafana Provisioning Docs](https://grafana.com/docs/grafana/latest/administration/provisioning/)
`
      );
    }

    // Prometheus README
    const prometheusReadme = join(infraPath, 'prometheus', 'README.md');
    if (!existsSync(prometheusReadme)) {
      writeFileSync(
        prometheusReadme,
        `# Prometheus Configuration

Place your custom Prometheus configuration here.

## Files placed here will be mounted to:
- \`prometheus\` service: \`/etc/prometheus/\`

## Example

\`prometheus.yml\` - Main configuration (overrides default)
\`alerts.yml\` - Alert rules

See [Prometheus Docs](https://prometheus.io/docs/prometheus/latest/configuration/configuration/)
`
      );
    }

    // Volumes README
    const volumesReadme = join(infraPath, 'volumes', 'README.md');
    if (!existsSync(volumesReadme)) {
      writeFileSync(
        volumesReadme,
        `# Project Volumes

Place project-specific data volumes here.

## Usage

Each service can have project-specific persistent data.

## Structure

\`\`\`
volumes/
├── postgres/          # PostgreSQL data
├── redis/             # Redis data
├── rabbitmq/          # RabbitMQ data
├── keycloak/          # Keycloak data
├── influxdb/          # InfluxDB data
├── grafana/           # Grafana data
├── prometheus/        # Prometheus data
├── clickhouse/        # ClickHouse data
└── minio/             # MinIO data
\`\`\`

These volumes will be automatically mounted when services start.
`
      );
    }
  }

  /**
   * Get project-specific volume mounts
   */
  getProjectVolumes(serviceName: string): { hostPath: string; containerPath: string }[] {
    const infraPath = this.getInfraPath();
    const volumes: { hostPath: string; containerPath: string }[] = [];

    // Service-specific configurations
    const serviceMappings: Record<string, { hostPath: string; containerPath: string }[]> = {
      'otel-collector-observability': [
        {
          hostPath: join(infraPath, 'collectors'),
          containerPath: '/etc/collector-custom',
        },
      ],
      'otel-collector-domain': [
        {
          hostPath: join(infraPath, 'collectors'),
          containerPath: '/etc/collector-custom',
        },
      ],
      'keycloak-proxy': [
        {
          hostPath: join(infraPath, 'nginx'),
          containerPath: '/etc/nginx/conf.d/custom',
        },
      ],
      grafana: [
        {
          hostPath: join(infraPath, 'grafana', 'provisioning'),
          containerPath: '/etc/grafana/provisioning',
        },
      ],
      prometheus: [
        {
          hostPath: join(infraPath, 'prometheus'),
          containerPath: '/etc/prometheus',
        },
      ],
    };

    // Service-specific data volumes
    const dataVolumeMappings: Record<string, { containerPath: string }> = {
      postgres: '/var/lib/postgresql/data',
      redis: '/data',
      rabbitmq: '/var/lib/rabbitmq',
      keycloak: '/opt/keycloak/data',
      influxdb: '/var/lib/influxdb2',
      grafana: '/var/lib/grafana',
      prometheus: '/prometheus',
      clickhouse: '/var/lib/clickhouse',
      minio: '/data',
      mongodb: '/data/db',
    };

    // Add configuration volumes
    if (serviceMappings[serviceName]) {
      volumes.push(...serviceMappings[serviceName]);
    }

    // Add data volumes if they exist
    if (dataVolumeMappings[serviceName]) {
      const volumePath = join(infraPath, 'volumes', serviceName);
      if (existsSync(volumePath)) {
        volumes.push({
          hostPath: volumePath,
          containerPath: dataVolumeMappings[serviceName],
        });
      }
    }

    return volumes;
  }

  /**
   * Get project-specific environment variables
   */
  getProjectEnvVars(serviceName: string): Record<string, string> {
    const envPath = join(this.getInfraPath(), `${serviceName}.env`);

    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf-8');
      const vars: Record<string, string> = {};

      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            vars[key.trim()] = valueParts.join('=').trim();
          }
        }
      }

      return vars;
    }

    return {};
  }

  /**
   * Generate docker-compose override for project-specific configurations
   */
  generateOverrideFile(services: string[], environment: Environment): string {
    const infraPath = this.getInfraPath();
    const overrides: string[] = [];

    overrides.push('# Auto-generated by OxLayer CLI');
    overrides.push('# Project-specific infrastructure overrides');
    overrides.push(`# Environment: ${environment}`);
    overrides.push('');
    overrides.push('services:');

    for (const serviceName of services) {
      const volumes = this.getProjectVolumes(serviceName);
      const envVars = this.getProjectEnvVars(serviceName);

      if (volumes.length === 0 && Object.keys(envVars).length === 0) {
        continue;
      }

      overrides.push(`  ${serviceName}:`);

      if (volumes.length > 0) {
        overrides.push('    volumes:');
        for (const volume of volumes) {
          overrides.push(`      - ${volume.hostPath}:${volume.containerPath}:ro`);
        }
      }

      if (Object.keys(envVars).length > 0) {
        overrides.push('    environment:');
        for (const [key, value] of Object.entries(envVars)) {
          overrides.push(`      ${key}: "${value}"`);
        }
      }

      overrides.push('');
    }

    return overrides.join('\n');
  }

  /**
   * Save project configuration
   */
  saveProjectConfig(config: ProjectInfraConfig): void {
    const configPath = join(this.getInfraPath(), 'config.json');
    writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Load project configuration
   */
  loadProjectConfig(): ProjectInfraConfig | null {
    const configPath = join(this.getInfraPath(), 'config.json');

    if (existsSync(configPath)) {
      const content = readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }

    return null;
  }

  /**
   * Get project name
   */
  getProjectName(): string {
    const packageJsonPath = join(this.getProjectRoot(), 'package.json');

    if (existsSync(packageJsonPath)) {
      const content = readFileSync(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      return pkg.name || 'unknown';
    }

    return 'unknown';
  }

  /**
   * Check if project has infra folder
   */
  hasProjectInfra(): boolean {
    return existsSync(this.getInfraPath());
  }
}
