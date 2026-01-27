/**
 * Keycloak Organization Management
 *
 * Handles creation and management of organizations and workspaces within a realm.
 * Workspaces are stored as organization attributes (1:1 mapping).
 */

import type {
  KeycloakConnectionConfig,
  OrganizationConfig,
  WorkspaceConfig,
} from '../types/config.js';
import { BootstrapError, ErrorCode } from '../types/keycloak.js';

/**
 * Keycloak Organization Management Client
 */
export class KeycloakOrganizationClient {
  private token: string | null = null;

  constructor(private config: KeycloakConnectionConfig) {}

  /**
   * Authenticate with Keycloak and get admin token
   */
  async authenticate(): Promise<void> {
    const response = await fetch(
      `${this.config.url}/realms/master/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: this.config.admin.username,
          password: this.config.admin.password,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to authenticate with Keycloak: ${response.status} ${error}`,
        ErrorCode.AUTH_FAILED
      );
    }

    const data = await response.json();
    this.token = data.access_token;
  }

  /**
   * Check if organization exists
   */
  async organizationExists(realm: string, organizationId: string): Promise<boolean> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations/${encodeURIComponent(organizationId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );
    return response.ok;
  }

  /**
   * Create organization in a realm
   */
  async createOrganization(realm: string, config: OrganizationConfig): Promise<void> {
    if (await this.organizationExists(realm, config.id)) {
      console.log(`✓ Organization "${config.id}" already exists, skipping`);
      return;
    }

    const orgConfig = {
      name: config.id,
      enabled: config.enabled ?? true,
      attributes: config.attributes || {},
      ...(config.description && { description: config.description }),
    };

    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgConfig),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      // If Organizations extension is not installed (404), skip gracefully
      if (response.status === 404) {
        console.warn(`⚠️  Organizations extension not available, skipping organization "${config.id}"`);
        return;
      }
      throw new BootstrapError(
        `Failed to create organization "${config.id}": ${response.status} ${error}`,
        ErrorCode.ROLE_CREATE_FAILED // Reusing error code, should add ORG_CREATE_FAILED
      );
    }

    console.log(`✅ Created organization "${config.id}"`);
  }

  /**
   * Create workspace within an organization
   * Workspaces are stored as organization attributes (1:1 mapping)
   */
  async createWorkspace(realm: string, config: WorkspaceConfig): Promise<void> {
    // Check if workspace already exists by fetching organization
    const orgResponse = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations/${encodeURIComponent(config.organizationId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!orgResponse.ok) {
      // If Organizations extension is not installed (404), skip gracefully
      if (orgResponse.status === 404) {
        console.warn(`⚠️  Organizations extension not available, skipping workspace "${config.id}"`);
        return;
      }
      throw new Error(`Organization "${config.organizationId}" not found`);
    }

    const organization = await orgResponse.json();
    const workspaceKey = `workspace_${config.id}`;

    // Check if workspace already exists
    if (organization.attributes?.[workspaceKey]) {
      console.log(`✓ Workspace "${config.id}" already exists in organization "${config.organizationId}", skipping`);
      return;
    }

    // Add workspace as attribute
    const workspaceData = JSON.stringify({
      name: config.name,
      enabled: config.enabled ?? true,
      ...(config.description && { description: config.description }),
      ...(config.attributes && { attributes: config.attributes }),
    });

    const updateResponse = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations/${encodeURIComponent(config.organizationId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...organization,
          attributes: {
            ...organization.attributes,
            [workspaceKey]: workspaceData,
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to create workspace "${config.id}": ${updateResponse.status} ${error}`);
    }

    console.log(`✅ Created workspace "${config.id}" in organization "${config.organizationId}"`);
  }

  /**
   * Create multiple organizations
   */
  async createOrganizations(realm: string, organizations: OrganizationConfig[]): Promise<void> {
    for (const org of organizations) {
      await this.createOrganization(realm, org);
    }
  }

  /**
   * Create multiple workspaces
   */
  async createWorkspaces(realm: string, workspaces: WorkspaceConfig[]): Promise<void> {
    for (const workspace of workspaces) {
      await this.createWorkspace(realm, workspace);
    }
  }

  /**
   * Get all organizations in a realm
   */
  async getOrganizations(realm: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    return response.json();
  }

  /**
   * Get workspaces for an organization
   */
  async getOrganizationWorkspaces(realm: string, organizationId: string): Promise<WorkspaceConfig[]> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations/${encodeURIComponent(organizationId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const organization = await response.json();
    const workspaces: WorkspaceConfig[] = [];

    // Extract workspace attributes
    for (const [key, value] of Object.entries(organization.attributes || {})) {
      if (key.startsWith('workspace_')) {
        const workspaceId = key.substring('workspace_'.length);
        try {
          const workspaceData = JSON.parse(value as string);
          workspaces.push({
            id: workspaceId,
            name: workspaceData.name,
            organizationId,
            description: workspaceData.description,
            enabled: workspaceData.enabled,
            attributes: workspaceData.attributes,
          });
        } catch {
          // Skip invalid workspace data
        }
      }
    }

    return workspaces;
  }
}
