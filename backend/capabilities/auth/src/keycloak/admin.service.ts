/**
 * Keycloak Admin Service
 *
 * Provides administrative functions for managing Keycloak users
 * using the Keycloak Admin REST API
 */

import type {
  KeycloakConfig,
  CreateKeycloakUserOptions,
  KeycloakUser,
} from './types.js';

/**
 * Keycloak Admin Service
 */
export class KeycloakAdminService {
  private config: KeycloakConfig;
  private adminToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor(config: KeycloakConfig) {
    this.config = config;
  }

  /**
   * Get admin access token using client credentials flow
   */
  private async getAdminToken(): Promise<string> {
    // Check if token is still valid (with 5 minute buffer)
    if (this.adminToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 300000) {
      return this.adminToken;
    }

    const tokenUrl = `${this.config.url}/realms/master/protocol/openid-connect/token`;

    // Use client credentials if available (preferred)
    if (this.config.adminClientId && this.config.adminClientSecret) {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.adminClientId,
        client_secret: this.config.adminClientSecret,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get admin token: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as { access_token: string; expires_in: number };
      this.adminToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
      return this.adminToken;
    }

    // Fall back to admin username/password if client credentials not available
    if (this.config.adminUsername && this.config.adminPassword) {
      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: this.config.adminUsername,
        password: this.config.adminPassword,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get admin token: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json() as { access_token: string; expires_in: number };
      this.adminToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);
      return this.adminToken;
    }

    throw new Error('Keycloak admin credentials not configured. Please provide either adminClientId/adminClientSecret or adminUsername/adminPassword.');
  }

  /**
   * Create a new user in Keycloak
   */
  async createUser(options: CreateKeycloakUserOptions): Promise<string> {
    const token = await this.getAdminToken();
    const usersUrl = `${this.config.url}/admin/realms/${this.config.realm}/users`;

    const userData = {
      username: options.username,
      email: options.email,
      firstName: options.firstName || '',
      lastName: options.lastName || '',
      enabled: options.enabled ?? true,
      emailVerified: options.emailVerified ?? false,
      credentials: [
        {
          type: 'password',
          value: options.password,
          temporary: false,
        },
      ],
      attributes: options.attributes,
    };

    const response = await fetch(usersUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create Keycloak user: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Keycloak returns 201 Created with Location header containing the user ID
    const locationHeader = response.headers.get('Location');
    if (!locationHeader) {
      throw new Error('Keycloak did not return user location header');
    }

    // Extract user ID from Location header
    // Format: .../users/{id}
    const userId = locationHeader.split('/').pop();
    if (!userId) {
      throw new Error('Could not extract user ID from location header');
    }

    return userId;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<KeycloakUser | null> {
    const token = await this.getAdminToken();
    const usersUrl = `${this.config.url}/admin/realms/${this.config.realm}/users?username=${encodeURIComponent(username)}`;

    const response = await fetch(usersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Keycloak user: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const users = await response.json() as KeycloakUser[];

    // Keycloak returns partial matches, so we need to find exact match
    const exactMatch = users.find(u => u.username === username);
    return exactMatch || null;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<KeycloakUser | null> {
    const token = await this.getAdminToken();
    const userUrl = `${this.config.url}/admin/realms/${this.config.realm}/users/${userId}`;

    const response = await fetch(userUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Keycloak user: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json() as KeycloakUser;
  }

  /**
   * Update user password
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const token = await this.getAdminToken();
    const passwordUrl = `${this.config.url}/admin/realms/${this.config.realm}/users/${userId}/reset-password`;

    const response = await fetch(passwordUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'password',
        value: newPassword,
        temporary: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update user password: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  /**
   * Enable/disable user
   */
  async setUserEnabled(userId: string, enabled: boolean): Promise<void> {
    const token = await this.getAdminToken();
    const userUrl = `${this.config.url}/admin/realms/${this.config.realm}/users/${userId}`;

    // First get the current user data
    const getUserResponse = await fetch(userUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!getUserResponse.ok) {
      const errorText = await getUserResponse.text();
      throw new Error(`Failed to get user: ${getUserResponse.status} ${getUserResponse.statusText} - ${errorText}`);
    }

    const user = await getUserResponse.json() as KeycloakUser;

    // Update with enabled status
    const updateResponse = await fetch(userUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...user,
        enabled,
      }),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Failed to update user: ${updateResponse.status} ${updateResponse.statusText} - ${errorText}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    const token = await this.getAdminToken();
    const userUrl = `${this.config.url}/admin/realms/${this.config.realm}/users/${userId}`;

    const response = await fetch(userUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete user: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  /**
   * Assign realm role to user
   */
  async assignRealmRole(userId: string, roleName: string): Promise<void> {
    const token = await this.getAdminToken();

    // First get the role by name
    const rolesUrl = `${this.config.url}/admin/realms/${this.config.realm}/roles/${roleName}`;
    const roleResponse = await fetch(rolesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!roleResponse.ok) {
      const errorText = await roleResponse.text();
      throw new Error(`Failed to get role: ${roleResponse.status} ${roleResponse.statusText} - ${errorText}`);
    }

    const role = await roleResponse.json();

    // Assign role to user
    const userRolesUrl = `${this.config.url}/admin/realms/${this.config.realm}/users/${userId}/role-mappings/realm`;
    const assignResponse = await fetch(userRolesUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([role]),
    });

    if (!assignResponse.ok) {
      const errorText = await assignResponse.text();
      throw new Error(`Failed to assign role: ${assignResponse.status} ${assignResponse.statusText} - ${errorText}`);
    }
  }
}
