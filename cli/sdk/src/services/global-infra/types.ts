/**
 * Type definitions for Global OxLayer Infrastructure Service
 */

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
    queue: string;
    exchange: string;
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

export interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'monitoring' | 'proxy';
  ports: string[];
  dependsOn?: string[];
}
