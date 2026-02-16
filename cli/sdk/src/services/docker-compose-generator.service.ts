/**
 * Docker Compose Generator Service
 *
 * Dynamically generates docker-compose.yml files from service definitions
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { SERVICE_DEFINITIONS } from './infra.service.js';
import type { Environment } from '../types/infra.js';

export class DockerComposeGenerator {
  /**
   * Generate docker-compose.yml content for an environment
   */
  generateComposeFile(environment: Environment): string {
    const lines: string[] = [];

    // Header
    lines.push('services:');
    lines.push('');

    // Generate each service
    for (const [serviceName, serviceDef] of Object.entries(SERVICE_DEFINITIONS)) {
      lines.push(`  ${serviceName}:`);
      lines.push(`    image: ${this.getImageForService(serviceName)}`);
      lines.push(`    container_name: oxlayer-${serviceName}`);

      // Add command if needed
      const command = this.getCommandForService(serviceName);
      if (command) {
        lines.push(`    command: ${command}`);
      }

      // Add environment variables
      const envVars = this.getEnvVarsForService(serviceName, environment);
      if (envVars.length > 0) {
        lines.push('    environment:');
        for (const [key, value] of envVars) {
          lines.push(`      ${key}: ${value}`);
        }
      }

      // Add ports
      if (serviceDef.ports.length > 0) {
        lines.push('    ports:');
        for (const port of serviceDef.ports) {
          lines.push(`      - "${port}"`);
        }
      }

      // Add volumes
      if (serviceDef.volumes.length > 0) {
        lines.push('    volumes:');
        for (const volume of serviceDef.volumes) {
          lines.push(`      - ${volume}:${this.getVolumeMountPath(serviceName)}`);
        }
      }

      // Add depends_on
      if (serviceDef.dependsOn.length > 0) {
        lines.push('    depends_on:');
        for (const dep of serviceDef.dependsOn) {
          lines.push(`      ${dep}:`);
          lines.push(`        condition: service_started`);
        }
      }

      // Add health check
      if (serviceDef.healthCheck) {
        lines.push('    healthcheck:');
        lines.push(`      test: ${JSON.stringify(serviceDef.healthCheck.command.split(' '))}`);
        lines.push(`      interval: ${serviceDef.healthCheck.interval}`);
        lines.push(`      timeout: ${serviceDef.healthCheck.timeout}`);
        lines.push(`      retries: ${serviceDef.healthCheck.retries}`);
      }

      // Add networks
      lines.push('    networks:');
      lines.push('      - oxlayer-network');

      lines.push('');
    }

    // Add volumes section (deduplicated)
    lines.push('volumes:');
    const allVolumes = new Set<string>();
    for (const [serviceName, serviceDef] of Object.entries(SERVICE_DEFINITIONS)) {
      for (const volume of serviceDef.volumes) {
        allVolumes.add(volume);
      }
    }

    for (const volume of Array.from(allVolumes).sort()) {
      lines.push(`  ${volume}:`);
      lines.push('    driver: local');
    }

    lines.push('');

    // Add networks section
    lines.push('networks:');
    lines.push('  oxlayer-network:');
    lines.push('    driver: bridge');

    return lines.join('\n');
  }

  /**
   * Get Docker image for a service
   */
  private getImageForService(serviceName: string): string {
    const images: Record<string, string> = {
      'postgres': 'postgres:16-alpine',
      'redis': 'redis:7-alpine',
      'rabbitmq': 'rabbitmq:3-management-alpine',
      'keycloak': 'quay.io/keycloak/keycloak:26.5',
      'keycloak-postgres': 'postgres:16-alpine',
      'keycloak-proxy': 'nginx:alpine',
      'influxdb': 'influxdb:2.7-alpine',
      'grafana': 'grafana/grafana:12.3.1',
      'prometheus': 'prom/prometheus:v2.48.0',
      'otel-collector-observability': 'otel/opentelemetry-collector-contrib:0.143.0',
      'otel-collector-domain': 'otel/opentelemetry-collector-contrib:0.143.0',
      'quickwit': 'quickwit/quickwit:0.8.2',
      'jaeger-query': 'jaegertracing/jaeger-query:1.52',
      'clickhouse': 'clickhouse/clickhouse-server:24.3',
      'minio': 'minio/minio:RELEASE.2024-03-30T09-41-56Z',
      'qdrant': 'qdrant/qdrant:v1.9.0',
      'mongodb': 'mongo:7.0',
      'emqx': 'emqx/emqx:5.6.0',
    };

    return images[serviceName] || `${serviceName}:latest`;
  }

  /**
   * Get command for a service
   */
  private getCommandForService(serviceName: string): string | null {
    const commands: Record<string, string> = {
      'keycloak': 'start-dev',
      'minio': 'server /data --console-address ":9001"',
      'quickwit': '["run"]',
    };

    return commands[serviceName] || null;
  }

  /**
   * Get environment variables for a service
   */
  private getEnvVarsForService(serviceName: string, environment: Environment): [string, string][] {
    const envVars: Record<string, Record<string, string>> = {
      'postgres': {
        'POSTGRES_USER': 'postgres',
        'POSTGRES_PASSWORD': 'postgres',
        'POSTGRES_DB': 'todo_app',
      },
      'redis': {},
      'rabbitmq': {
        'RABBITMQ_DEFAULT_USER': 'guest',
        'RABBITMQ_DEFAULT_PASS': 'guest',
        'RABBITMQ_DEFAULT_VHOST': '/',
      },
      'keycloak': {
        'KEYCLOAK_ADMIN': 'admin',
        'KEYCLOAK_ADMIN_PASSWORD': 'admin',
        'KC_DB': 'postgres',
        'KC_DB_URL': 'jdbc:postgresql://keycloak-postgres:5432/keycloak',
        'KC_DB_USERNAME': 'keycloak',
        'KC_DB_PASSWORD': 'keycloak',
        'KC_HOSTNAME': 'localhost',
        'KC_HOSTNAME_PORT': '8080',
        'KC_HOSTNAME_STRICT': 'false',
        'KC_HOSTNAME_STRICT_HTTPS': 'false',
        'KC_HTTP_ENABLED': 'true',
        'KC_SPI_OPTIONS_COOKIE_DEFAULT_SECURE': 'false',
        'KC_SPI_OPTIONS_COOKIE_DEFAULT_SAME_SITE': 'lax',
      },
      'keycloak-postgres': {
        'POSTGRES_USER': 'keycloak',
        'POSTGRES_PASSWORD': 'keycloak',
        'POSTGRES_DB': 'keycloak',
      },
      'keycloak-proxy': {},
      'influxdb': {
        'DOCKER_INFLUXDB_INIT_MODE': 'setup',
        'DOCKER_INFLUXDB_INIT_USERNAME': 'admin',
        'DOCKER_INFLUXDB_INIT_PASSWORD': 'admin123',
        'DOCKER_INFLUXDB_INIT_ORG': 'oxlayer',
        'DOCKER_INFLUXDB_INIT_BUCKET': 'metrics',
        'DOCKER_INFLUXDB_INIT_ADMIN_TOKEN': 'my-super-secret-auth-token',
      },
      'grafana': {
        'GF_SECURITY_ADMIN_USER': 'admin',
        'GF_SECURITY_ADMIN_PASSWORD': 'admin123',
        'GF_INSTALL_PLUGINS': 'https://github.com/quickwit-oss/quickwit-datasource/releases/download/v0.5.0/quickwit-quickwit-datasource-0.5.0.zip;quickwit',
        'GF_USERS_ALLOW_SIGN_UP': 'false',
      },
      'prometheus': {},
      'otel-collector-observability': {},
      'otel-collector-domain': {},
      'quickwit': {
        'QW_ENABLE_OPENTELEMETRY_OTLP_EXPORTER': 'true',
        'QW_METASTORE_URI': 'file:///quickwit/data/qw.metastore',
        'QW_DATA_DIR': '/quickwit/data',
        'QW_JAEGER_STORAGE_ENABLED': 'true',
      },
      'jaeger-query': {
        'SPAN_STORAGE_TYPE': 'grpc-plugin',
        'GRPC_STORAGE_SERVER': 'quickwit:7281',
        'GRPC_STORAGE_TLS': 'false',
      },
      'clickhouse': {
        'CLICKHOUSE_DB': 'analytics',
        'CLICKHOUSE_USER': 'default',
        'CLICKHOUSE_PASSWORD': 'default',
        'CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT': '1',
      },
      'minio': {
        'MINIO_ROOT_USER': 'admin',
        'MINIO_ROOT_PASSWORD': 'admin123456',
      },
      'qdrant': {},
      'mongodb': {
        'MONGO_INITDB_ROOT_USERNAME': 'admin',
        'MONGO_INITDB_ROOT_PASSWORD': 'admin123',
        'MONGO_INITDB_DATABASE': 'todo_app',
      },
      'emqx': {
        'EMQX_NAME': 'emqx',
        'EMQX_HOST': '127.0.0.1',
        'EMQX_DASHBOARD__DEFAULT_USERNAME': 'admin',
        'EMQX_DASHBOARD__DEFAULT_PASSWORD': 'admin123',
      },
    };

    const serviceEnv = envVars[serviceName] || {};
    return Object.entries(serviceEnv);
  }

  /**
   * Get volume mount path for a service
   */
  private getVolumeMountPath(serviceName: string): string {
    const paths: Record<string, string> = {
      'postgres': '/var/lib/postgresql/data',
      'redis': '/data',
      'rabbitmq': '/var/lib/rabbitmq',
      'keycloak': '/opt/keycloak/data',
      'keycloak-postgres': '/var/lib/postgresql/data',
      'keycloak-proxy': '/etc/nginx/conf.d',
      'influxdb': '/var/lib/influxdb2',
      'grafana': '/var/lib/grafana',
      'prometheus': '/prometheus',
      'quickwit': '/quickwit/data',
      'clickhouse': '/var/lib/clickhouse',
      'minio': '/data',
      'qdrant': '/qdrant/storage',
      'mongodb': '/data/db',
      'emqx': '/opt/emqx/data',
    };

    return paths[serviceName] || '/data';
  }

  /**
   * Write docker-compose file to disk
   */
  writeComposeFile(environment: Environment, outputPath: string): void {
    const content = this.generateComposeFile(environment);
    writeFileSync(outputPath, content);
  }
}
