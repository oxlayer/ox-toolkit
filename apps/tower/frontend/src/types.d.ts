export interface OxLayerAPI {
  getVersion: () => Promise<string>;
  getProjects: () => Promise<Project[]>;
  getInfraStatus: () => Promise<string>;
  getConnections: (projectName: string) => Promise<ConnectionStrings>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerProject: (projectName: string, projectPath: string) => Promise<{ success: boolean; error?: string }>;
  unregisterProject: (projectName: string) => Promise<{ success: boolean; error?: string }>;
  resetProject: (projectName: string, confirm: boolean) => Promise<{ success: boolean; error?: string }>;
  runDoctor: () => Promise<{ success: boolean; error?: string }>;
  startInfra: () => Promise<{ success: boolean; error?: string }>;
  stopInfra: () => Promise<{ success: boolean; error?: string }>;
}

export interface Project {
  name: string;
  path: string;
  createdAt: string;
  resources: {
    postgres: { database: string; user: string; password: string };
    redis: { host: string; port: number; db: number };
    rabbitmq: { vhost: string; user: string; password: string };
    keycloak: { realm: string; clientId: string; clientSecret: string };
  };
}

export interface ConnectionStrings {
  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_DB: string;
  RABBITMQ_URL: string;
  KEYCLOAK_URL: string;
}

declare global {
  interface Window {
    oxlayer: OxLayerAPI;
  }
}

export {};
