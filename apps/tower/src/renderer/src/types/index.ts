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

export type Environment = 'dev' | 'stg' | 'prd';

export type Organization = {
  id: string;
  name: string;
  avatar?: string;
};
