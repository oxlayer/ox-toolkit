/**
 * Keycloak Auth Service
 */

import Keycloak from 'keycloak-js';
import { keycloakConfig, keycloakInitOptions } from '../keycloak';

let keycloakInstance: Keycloak | null = null;

export function getKeycloak() {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: keycloakConfig.url,
      realm: keycloakConfig.realm,
      clientId: keycloakConfig.clientId,
    });
  }
  return keycloakInstance;
}

export async function initKeycloak() {
  const keycloak = getKeycloak();

  try {
    const authenticated = await keycloak.init(keycloakInitOptions);
    return authenticated;
  } catch (error) {
    console.error('Keycloak initialization failed:', error);
    throw error;
  }
}

export async function logout() {
  const keycloak = getKeycloak();
  await keycloak.logout();
}

export async function updateToken() {
  const keycloak = getKeycloak();
  try {
    const refreshed = await keycloak.updateToken(30);
    return refreshed;
  } catch (error) {
    console.error('Token update failed:', error);
    await keycloak.logout();
    throw error;
  }
}

export function getToken() {
  const keycloak = getKeycloak();
  return keycloak.token;
}

export function isAuthenticated() {
  const keycloak = getKeycloak();
  return !!keycloak.authenticated && !!keycloak.token;
}

export function hasRole(role: string): boolean {
  const keycloak = getKeycloak();
  return keycloak.hasRealmRole(role);
}

export function hasResourceRole(role: string, resource?: string): boolean {
  const keycloak = getKeycloak();
  return keycloak.hasResourceRole(role, resource);
}

export function getUserInfo() {
  const keycloak = getKeycloak();
  return {
    id: keycloak.subject,
    username: keycloak.tokenParsed?.preferred_username,
    email: keycloak.tokenParsed?.email,
    firstName: keycloak.tokenParsed?.given_name,
    lastName: keycloak.tokenParsed?.family_name,
    name: keycloak.tokenParsed?.name,
  };
}
