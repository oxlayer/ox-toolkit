/**
 * Infrastructure Types
 *
 * Types for infrastructure management
 */

export type Environment = 'dev' | 'stg' | 'prd';
export type ServiceAction = 'start' | 'stop' | 'restart' | 'status';

export interface ServiceDefinition {
  name: string;
  displayName: string;
  description: string;
  category: ServiceCategory;
  ports: string[];
  volumes: string[];
  dependsOn: string[];
  enabledByDefault: boolean;
  requiresAuth: boolean;
  healthCheck?: {
    command: string;
    interval: string;
    timeout: string;
    retries: number;
  };
}

export type ServiceCategory =
  | 'database'
  | 'cache'
  | 'messaging'
  | 'auth'
  | 'monitoring'
  | 'analytics'
  | 'storage'
  | 'search';

export interface InfraConfig {
  environment: Environment;
  services: string[];
  dockerComposePath: string;
  envVars: Record<string, string>;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'unhealthy' | 'unknown';
  ports: string[];
  health?: string;
}

export interface EnvironmentConfig {
  name: Environment;
  displayName: string;
  description: string;
  dockerComposeFile: string;
  envFile: string;
  defaultServices: string[];
}
