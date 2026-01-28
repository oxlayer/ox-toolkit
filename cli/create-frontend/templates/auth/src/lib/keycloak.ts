/**
 * Keycloak Configuration
 */

import type Keycloak from 'keycloak-js';

export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
}

export const keycloakConfig: KeycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || '{{PROJECT_SLUG}}',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || '{{PROJECT_SLUG}}-frontend',
};

export const keycloakInitOptions = {
  onLoad: 'login-required' as const,
  checkLoginIframe: false,
  pkceMethod: 'S256' as const,
  silentCheckSsoFallback: false,
};
