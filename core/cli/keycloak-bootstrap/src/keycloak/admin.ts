/**
 * Keycloak Admin API client
 */

import type {
  KeycloakConnectionConfig,
  RealmConfig,
  RoleConfig,
  ProtocolMapperConfig,
  ResolvedClientConfig,
} from '../types/config.js';
import { BootstrapError, ErrorCode } from '../types/keycloak.js';

/**
 * Keycloak Admin API client
 */
export class KeycloakAdminClient {
  private token: string | null = null;

  constructor(private config: KeycloakConnectionConfig) { }

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
   * Check if realm exists
   */
  async realmExists(name: string): Promise<boolean> {
    const response = await fetch(`${this.config.url}/admin/realms/${name}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    return response.ok;
  }

  /**
   * Create realm
   */
  async createRealm(config: RealmConfig): Promise<void> {
    if (await this.realmExists(config.name)) {
      console.log(`✓ Realm "${config.name}" already exists, skipping`);
      return;
    }

    const realmConfig = {
      realm: config.name,
      enabled: true,
      displayName: config.displayName || config.name,
      sslRequired: config.sslRequired ?? 'external',
      loginWithEmailAllowed: config.security?.loginWithEmailAllowed ?? true,
      registrationEmailAsUsername: config.security?.registrationEmailAsUsername ?? true,
      duplicateEmailsAllowed: config.security?.duplicateEmailsAllowed ?? false,
      resetPasswordAllowed: config.security?.resetPasswordAllowed ?? true,
      editUsernameAllowed: config.security?.editUsernameAllowed ?? false,
      bruteForceProtected: config.security?.bruteForceProtected ?? true,
      permanentLockout: config.security?.permanentLockout ?? false,
      maxFailureWaitSeconds: config.security?.maxFailureWaitSeconds ?? 900,
      minimumQuickLoginWaitSeconds: config.security?.minimumQuickLoginWaitSeconds ?? 60,
      waitIncrementSeconds: config.security?.waitIncrementSeconds ?? 60,
      quickLoginCheckMilliSeconds: config.security?.quickLoginCheckMilliSeconds ?? 1000,
      maxDeltaTimeSeconds: config.security?.maxDeltaTimeSeconds ?? 43200,
      failureFactor: config.security?.failureFactor ?? 30,
      organizationsEnabled: config.organizationsEnabled ?? true,
    };

    const response = await fetch(`${this.config.url}/admin/realms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realmConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to create realm "${config.name}": ${response.status} ${error}`,
        ErrorCode.REALM_CREATE_FAILED
      );
    }

    console.log(`✅ Created realm "${config.name}"`);
  }

  /**
   * Check if client exists
   */
  async clientExists(realm: string, clientId: string): Promise<boolean> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const clients = await response.json();
    return Array.isArray(clients) && clients.length > 0;
  }

  /**
   * Get client UUID
   */
  async getClientUuid(realm: string, clientId: string): Promise<string | null> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/clients?clientId=${encodeURIComponent(clientId)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const clients = await response.json();
    if (!Array.isArray(clients) || clients.length === 0) {
      return null;
    }

    return clients[0].id;
  }

  /**
   * Create client
   */
  async createClient(realm: string, config: ResolvedClientConfig): Promise<void> {
    if (await this.clientExists(realm, config.clientId)) {
      console.log(`✓ Client "${config.clientId}" already exists, skipping`);
      return;
    }

    const clientConfig = {
      clientId: config.clientId,
      name: config.name,
      description: config.description,
      enabled: config.enabled,
      publicClient: config.publicClient,
      standardFlowEnabled: config.standardFlowEnabled,
      directAccessGrantsEnabled: config.directAccessGrantsEnabled,
      redirectUris: config.redirectUris,
      webOrigins: config.webOrigins,
      protocol: config.protocol,
      attributes: config.attributes || {},
    };

    const response = await fetch(`${this.config.url}/admin/realms/${realm}/clients`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to create client "${config.clientId}": ${response.status} ${error}`,
        ErrorCode.CLIENT_CREATE_FAILED
      );
    }

    console.log(`✅ Created client "${config.clientId}"`);
  }

  /**
   * Check if role exists
   */
  async roleExists(realm: string, roleName: string): Promise<boolean> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/roles/${encodeURIComponent(roleName)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );
    return response.ok;
  }

  /**
   * Create role
   */
  async createRole(realm: string, config: RoleConfig): Promise<void> {
    if (await this.roleExists(realm, config.name)) {
      console.log(`✓ Role "${config.name}" already exists, skipping`);
      return;
    }

    // Keycloak Admin API for creating realm roles
    // POST /admin/realms/{realm}/roles
    const roleConfig = {
      name: config.name,
      description: config.description || `Role: ${config.name}`,
      composite: false,
      clientRole: false,
    };

    const response = await fetch(`${this.config.url}/admin/realms/${realm}/roles`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleConfig),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to create role "${config.name}": ${response.status} ${error}`,
        ErrorCode.ROLE_CREATE_FAILED
      );
    }

    console.log(`✅ Created role "${config.name}"`);
  }

  /**
   * Create user
   */
  async createUser(realm: string, userConfig: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    enabled: boolean;
    emailVerified: boolean;
    credentials?: Array<{ type: string; value: string; temporary: boolean }>;
    requiredActions?: string[];
  }): Promise<string> {
    const userPayload = {
      username: userConfig.username,
      email: userConfig.email,
      firstName: userConfig.firstName,
      lastName: userConfig.lastName,
      enabled: userConfig.enabled,
      emailVerified: userConfig.emailVerified,
      credentials: userConfig.credentials,
      requiredActions: userConfig.requiredActions || [],
    };

    const response = await fetch(`${this.config.url}/admin/realms/${realm}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to create user "${userConfig.username}": ${response.status} ${error}`,
        ErrorCode.USER_CREATE_FAILED
      );
    }

    // Get the user ID from the Location header
    const location = response.headers.get('Location');
    if (!location) {
      throw new BootstrapError(
        `User created but no Location header returned`,
        ErrorCode.USER_CREATE_FAILED
      );
    }

    const userId = location.split('/').pop() || '';
    console.log(`✅ Created user "${userConfig.username}"`);

    // Automatically add user to organizations matching their email domain
    await this.addUserToMatchingOrganizations(realm, userId, userConfig.email);

    return userId;
  }

  /**
   * Get all organizations in a realm
   */
  async getOrganizations(realm: string): Promise<Array<{ id: string; name: string; domains?: string[] }>> {
    const response = await fetch(`${this.config.url}/admin/realms/${realm}/organizations`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      // Organizations extension might not be available
      return [];
    }

    const organizations = await response.json();
    return Array.isArray(organizations) ? organizations : [];
  }

  /**
   * Invite an existing user to an organization
   * Uses the invite-existing-user endpoint with form parameters
   */
  async inviteUserToOrganization(realm: string, organizationId: string, userId: string): Promise<void> {
    // Use the invite-existing-user endpoint with form parameter
    // POST /admin/realms/{realm}/organizations/{org-id}/members/invite-existing-user
    // Form parameter: id (string) - the user ID
    const formData = new URLSearchParams();
    formData.append('id', userId);

    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/organizations/${organizationId}/members/invite-existing-user`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    if (!response.ok && response.status !== 409) { // 409 means already a member
      const error = await response.text();
      console.error(`Failed to invite user "${userId}" to organization "${organizationId}": ${response.status} ${error}`);
      throw new BootstrapError(
        `Failed to invite user "${userId}" to organization "${organizationId}": ${response.status} ${error}`,
        ErrorCode.ROLE_ASSIGN_FAILED
      );
    }

    console.log(`✅ Invited user to organization "${organizationId}"`);
  }

  /**
   * Add user to organizations matching their email domain
   * This is called automatically after user creation
   */
  private async addUserToMatchingOrganizations(realm: string, userId: string, email: string): Promise<void> {
    // Extract domain from email
    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      return;
    }

    // Get all organizations in the realm
    const organizations = await this.getOrganizations(realm);
    if (organizations.length === 0) {
      return;
    }

    // Find organizations with matching domain aliases
    for (const org of organizations) {
      const domains = org.domains || [];
      if (domains.includes(emailDomain)) {
        try {
          await this.inviteUserToOrganization(realm, org.id, userId);
          console.log(`✅ Added user to organization "${org.name}" based on domain "${emailDomain}"`);
        } catch (error: any) {
          console.warn(`⚠️  Failed to add user to organization "${org.name}": ${error?.message}`);
        }
      }
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(realm: string, username: string): Promise<any | null> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/users?username=${encodeURIComponent(username)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const users = await response.json();
    if (!Array.isArray(users) || users.length === 0) {
      return null;
    }

    return users[0];
  }

  /**
   * Get role by name
   */
  async getRoleByName(realm: string, roleName: string): Promise<any | null> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/roles/${encodeURIComponent(roleName)}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  /**
   * Get realm role (alias for getRoleByName)
   */
  async getRealmRole(realm: string, roleName: string): Promise<any | null> {
    return this.getRoleByName(realm, roleName);
  }

  /**
   * Create organization in Keycloak
   * Organizations are available from Keycloak 22+
   */
  async createOrganization(realm: string, config: {
    name: string;
    domainAliases?: string[];
    attributes?: Record<string, string[]>;
  }): Promise<{ id: string; name: string }> {
    const orgPayload = {
      name: config.name,
      domains: config.domainAliases || [],
      attributes: config.attributes || {},
    };

    const response = await fetch(`${this.config.url}/admin/realms/${realm}/organizations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orgPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      // If Organizations extension is not installed (404), throw a clear error
      if (response.status === 404) {
        throw new BootstrapError(
          `Organizations extension not available in Keycloak. Please enable the Organizations extension to use this feature.`,
          ErrorCode.ROLE_CREATE_FAILED
        );
      }
      // If organization already exists (409), fetch and return it
      if (response.status === 409) {
        console.log(`Organization "${config.name}" already exists, fetching it...`);
        // Try to get the existing organization by listing
        const listResponse = await fetch(`${this.config.url}/admin/realms/${realm}/organizations`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (listResponse.ok) {
          const organizations = await listResponse.json();
          if (Array.isArray(organizations)) {
            const found = organizations.find((o: any) => o.name === config.name);
            if (found) {
              console.log(`✅ Found existing organization "${config.name}"`);
              return { id: found.id, name: found.name };
            }
          }
        }
        throw new BootstrapError(
          `Organization "${config.name}" already exists but could not be fetched`,
          ErrorCode.ROLE_CREATE_FAILED
        );
      }
      throw new BootstrapError(
        `Failed to create organization "${config.name}": ${response.status} ${error}`,
        ErrorCode.ROLE_CREATE_FAILED
      );
    }

    // Keycloak Organizations API may return the created organization or an empty response
    // Try to parse the response body first
    const contentType = response.headers.get('content-type');
    let org: { id: string; name: string } | null = null;

    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          org = JSON.parse(text);
        } catch (parseError) {
          console.warn(`Failed to parse organization response as JSON:`, parseError);
          console.warn(`Response text was:`, text);
          // If parsing fails, org remains null
        }
      }
    }

    // If no organization in response, get it by listing organizations
    if (!org || !org.id) {
      console.log(`Organization not in response body, trying to list organizations...`);
      // Get the organization by listing all organizations and finding the matching one
      const listResponse = await fetch(`${this.config.url}/admin/realms/${realm}/organizations`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      console.log(`List organizations response status: ${listResponse.status}`);

      if (listResponse.ok) {
        const organizations = await listResponse.json();
        console.log(`Found ${organizations.length} organizations in realm ${realm}`);
        if (Array.isArray(organizations)) {
          const found = organizations.find((o: any) => o.name === config.name);
          if (found) {
            console.log(`Found organization "${config.name}" in list:`, found);
            org = { id: found.id, name: found.name };
          } else {
            console.log(`Organization "${config.name}" not found in list. Available: ${organizations.map((o: any) => o.name).join(', ')}`);
          }
        }
      } else {
        console.log(`Failed to list organizations: ${listResponse.status}`);
      }
    }

    if (!org || !org.id) {
      throw new BootstrapError(
        `Failed to get created organization "${config.name}" from Keycloak response`,
        ErrorCode.ROLE_CREATE_FAILED
      );
    }

    console.log(`✅ Created organization "${config.name}"`);
    return org;
  }


  /**
   * Assign realm roles to user
   */
  async assignRealmRoles(realm: string, username: string, roles: RoleConfig[]): Promise<void> {
    // Get user ID
    const user = await this.getUserByUsername(realm, username);
    if (!user) {
      throw new BootstrapError(
        `User "${username}" not found in realm "${realm}"`,
        ErrorCode.USER_NOT_FOUND
      );
    }

    // Get role representations
    const roleRepresentations = await Promise.all(
      roles.map(async (role) => {
        const roleData = await this.getRoleByName(realm, role.name);
        if (!roleData) {
          throw new BootstrapError(
            `Role "${role.name}" not found in realm "${realm}"`,
            ErrorCode.ROLE_NOT_FOUND
          );
        }
        return { id: roleData.id, name: roleData.name };
      })
    );

    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/users/${user.id}/role-mappings/realm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleRepresentations),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to assign roles to user "${username}": ${response.status} ${error}`,
        ErrorCode.ROLE_ASSIGN_FAILED
      );
    }

    const roleNames = roles.map(r => r.name).join(', ');
    console.log(`✅ Assigned roles [${roleNames}] to user "${username}"`);
  }

  /**
   * List users in realm
   */
  async listUsers(realm: string, max?: number): Promise<any[]> {
    const maxResults = max || 100;
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/users?max=${maxResults}`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to list users in realm "${realm}": ${response.status} ${error}`,
        ErrorCode.USER_LIST_FAILED
      );
    }

    return response.json();
  }

  /**
   * Get user roles
   */
  async getUserRoles(realm: string, userId: string): Promise<any[]> {
    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/users/${userId}/role-mappings/realm`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to get roles for user "${userId}": ${response.status} ${error}`,
        ErrorCode.ROLE_GET_FAILED
      );
    }

    return response.json();
  }

  /**
   * Create protocol mapper
   */
  async createProtocolMapper(
    realm: string,
    clientId: string,
    config: ProtocolMapperConfig
  ): Promise<void> {
    const clientUuid = await this.getClientUuid(realm, clientId);
    if (!clientUuid) {
      console.warn(`⚠️  Client "${clientId}" not found, skipping protocol mapper "${config.name}"`);
      return;
    }

    // Check if mapper already exists
    const mappersResponse = await fetch(
      `${this.config.url}/admin/realms/${realm}/clients/${clientUuid}/protocol-mappers/models`,
      {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      }
    );

    if (mappersResponse.ok) {
      const mappers = await mappersResponse.json();
      const mapperExists = Array.isArray(mappers) && mappers.some((m: any) => m.name === config.name);

      if (mapperExists) {
        console.log(`✓ Protocol mapper "${config.name}" already exists for "${clientId}", skipping`);
        return;
      }
    }

    const mapperConfig = {
      name: config.name,
      protocol: config.protocol,
      protocolMapper: config.protocolMapper,
      config: config.config,
    };

    const response = await fetch(
      `${this.config.url}/admin/realms/${realm}/clients/${clientUuid}/protocol-mappers/models`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapperConfig),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new BootstrapError(
        `Failed to create protocol mapper "${config.name}": ${response.status} ${error}`,
        ErrorCode.MAPPER_CREATE_FAILED
      );
    }

    console.log(`✅ Created protocol mapper "${config.name}" for "${clientId}"`);
  }

  /**
   * Enable organizations for a realm
   * Updates the realm to set organizationsEnabled to true
   */
  async enableRealmOrganizations(realm: string): Promise<void> {
    // Get current realm configuration
    const getResponse = await fetch(`${this.config.url}/admin/realms/${realm}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!getResponse.ok) {
      const error = await getResponse.text();
      throw new BootstrapError(
        `Failed to get realm "${realm}": ${getResponse.status} ${error}`,
        ErrorCode.ROLE_CREATE_FAILED
      );
    }

    const realmConfig = await getResponse.json();

    // Update organizationsEnabled to true
    realmConfig.organizationsEnabled = true;

    // Update the realm
    const updateResponse = await fetch(`${this.config.url}/admin/realms/${realm}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(realmConfig),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new BootstrapError(
        `Failed to enable organizations for realm "${realm}": ${updateResponse.status} ${error}`,
        ErrorCode.ROLE_CREATE_FAILED
      );
    }

    console.log(`✅ Enabled organizations for realm "${realm}"`);
  }

  /**
   * Delete a realm from Keycloak
   */
  async deleteRealm(realm: string): Promise<void> {
    const response = await fetch(`${this.config.url}/admin/realms/${realm}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok && response.status !== 404) { // 404 means realm doesn't exist, which is fine
      const error = await response.text();
      throw new BootstrapError(
        `Failed to delete realm "${realm}": ${response.status} ${error}`,
        ErrorCode.ROLE_CREATE_FAILED
      );
    }

    console.log(`✅ Deleted realm "${realm}"`);
  }
}
