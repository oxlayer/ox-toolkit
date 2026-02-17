export interface OxLayerAPI {
  getVersion: () => Promise<string>;
  getProjects: () => Promise<Project[]>;
  getInfraStatus: () => Promise<string>;
  getConnections: (projectName: string) => Promise<ConnectionStrings>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerProject: (projectName: string, projectPath: string) => Promise<{ success: boolean; error?: string }>;
  unregisterProject: (projectName: string) => Promise<{ success: boolean; error?: string }>;
  resetProject: (projectName: string, confirm: boolean) => Promise<{ success: boolean; error?: string }>;
  runDoctor: () => Promise<{ success: boolean; error?: string; output?: string }>;
  startInfra: () => Promise<{ success: boolean; error?: string }>;
  stopInfra: () => Promise<{ success: boolean; error?: string }>;
  openFolder: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  openVSCode: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  openCursor: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  openAntigravity: (folderPath: string) => Promise<{ success: boolean; error?: string }>;
  setPollingFrequency: (frequency: number) => Promise<{ success: boolean; error?: string }>;
  getPollingFrequency: () => Promise<number>;
  getServiceLogs: (serviceName: string) => Promise<{ success: boolean; logs?: string[]; error?: string }>;
  getServicesStatus: () => Promise<{ success: boolean; services?: Record<string, string>; error?: string }>;
  onInfraStatusUpdate: (callback: (status: string) => void) => void;
  onServicesStatusUpdate: (callback: (services: Record<string, string>) => void) => void;
  browserView: {
    open: (tabId: string, name: string, url: string) => Promise<{ success: boolean; tab?: { id: string; name: string; url: string }; error?: string }>;
    switch: (tabId: string) => Promise<{ success: boolean; error?: string }>;
    close: (tabId: string) => Promise<{ success: boolean; error?: string }>;
    list: () => Promise<{ success: boolean; tabs?: { id: string; name: string; url: string }[]; error?: string }>;
    reload: () => Promise<{ success: boolean; error?: string }>;
    back: () => Promise<{ success: boolean; error?: string }>;
    forward: () => Promise<{ success: boolean; error?: string }>;
    onActivated: (callback: (tab: { id: string; name: string; url: string }) => void) => void;
    onClosed: (callback: (tab: { id: string }) => void) => void;
  };
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
