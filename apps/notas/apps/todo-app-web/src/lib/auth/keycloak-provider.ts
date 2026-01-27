import Keycloak from 'keycloak-js';
import type { UserAuthProvider } from './types';

// Keycloak configuration
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL;
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;

/**
 * Keycloak auth provider
 *
 * Handles authentication via Keycloak OpenID Connect.
 * Used when users explicitly log in.
 */
export class KeycloakAuthImplementation implements UserAuthProvider {
  readonly type = 'keycloak' as const;

  private keycloakInstance: Keycloak | null = null;
  private token: string | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // Reuse existing init promise if already initializing
    if (this.initPromise) {
      return this.initPromise;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (this.keycloakInstance) {
      return;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    this.keycloakInstance = new Keycloak({
      url: KEYCLOAK_URL,
      realm: KEYCLOAK_REALM,
      clientId: KEYCLOAK_CLIENT_ID,
    });

    try {
      const authenticated = await this.keycloakInstance.init({
        onLoad: 'check-sso',
        // Silent SSO doesn't work with COEP/COOP headers - disabled
        // Keycloak will check for existing session using cookies instead
        pkceMethod: 'S256',
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: undefined,
      });

      if (authenticated) {
        this.token = this.keycloakInstance.token || null;
      }
    } catch (error) {
      console.error('Keycloak initialization failed:', error);
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  async login(): Promise<void> {
    if (!this.keycloakInstance) {
      await this.initialize();
    }

    if (!this.keycloakInstance) {
      throw new Error('Keycloak instance not initialized');
    }

    await this.keycloakInstance.login({
      redirectUri: window.location.origin,
      scope: 'openid profile email',
    });
  }

  async logout(): Promise<void> {
    if (!this.keycloakInstance) {
      return;
    }

    try {
      await this.keycloakInstance.logout({
        redirectUri: window.location.origin,
      });
    } catch (error) {
      console.error('Keycloak logout error:', error);
    } finally {
      this.token = null;
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.keycloakInstance) {
      await this.initialize();
    }

    if (!this.keycloakInstance) {
      return null;
    }

    // Check if token needs refresh
    if (this.keycloakInstance.isTokenExpired()) {
      try {
        const refreshed = await this.keycloakInstance.updateToken(30);
        if (refreshed) {
          this.token = this.keycloakInstance.token || null;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.token = null;
        return null;
      }
    }

    this.token = this.keycloakInstance.token || null;
    return this.token;
  }

  async refreshToken(): Promise<string> {
    if (!this.keycloakInstance) {
      await this.initialize();
    }

    if (!this.keycloakInstance) {
      throw new Error('Keycloak instance not initialized');
    }

    try {
      const refreshed = await this.keycloakInstance.updateToken(30);
      if (refreshed) {
        this.token = this.keycloakInstance.token || '';
        return this.token;
      }

      // Token was still valid
      this.token = this.keycloakInstance.token || '';
      return this.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await this.logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  isAuthenticated(): boolean {
    return this.keycloakInstance?.authenticated ?? false;
  }

  getUserInfo() {
    if (!this.keycloakInstance?.authenticated) {
      return null;
    }

    const parsed = this.keycloakInstance.tokenParsed;

    return {
      id: this.keycloakInstance.subject || '',
      email: parsed?.email,
      name: parsed?.name || parsed?.preferred_username,
      preferredUsername: parsed?.preferred_username,
      givenName: parsed?.given_name,
      familyName: parsed?.family_name,
    };
  }
}
