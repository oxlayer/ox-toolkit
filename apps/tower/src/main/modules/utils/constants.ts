/**
 * Constants for OxLayer Tower
 */

export const POLLING_FREQUENCY_DEFAULT = 15000; // 15 seconds

export const OXLAYER_VERSION = '1.0.0';

export const WINDOW_DEFAULTS = {
  width: 1400,
  height: 900,
  minWidth: 1000,
  minHeight: 700,
};

export const CONTENT_BOUNDS = {
  SIDEBAR_WIDTH: 256,
  HEADER_HEIGHT: 64,
  TAB_BAR_HEIGHT: 48,
  // Total offset: 256 (sidebar) + 112 (header + tabs)
  X_OFFSET: 256,
  Y_OFFSET: 112,
};

export const BROWSERVIEW_SECURITY = {
  ALLOWED_HOSTS: ['localhost', '127.0.0.1', '0.0.0.0'],
};

export const CONTAINER_NAME_FALLBACK = {
  'ox-postgres': 'Postgres',
  'ox-redis': 'Redis',
  'ox-rabbitmq': 'RabbitMQ',
  'ox-keycloak': 'Keycloak',
  'ox-prometheus': 'Prometheus',
  'ox-grafana': 'Grafana',
  'ox-traefik': 'Traefik',
};

export const IDE_COMMANDS = {
  VSCODE: 'code',
  CURSOR: 'cursor',
  ANTIGRAVITY: 'antigravity',
} as const;
