/**
 * Keycloak Sync Service
 *
 * Synchronizes organizations and developers from Keycloak realm to local database.
 * Handles cases where entities exist in Keycloak but not locally.
 */

import type { IOrganizationRepository, IDeveloperRepository } from '../repositories/index.js';
import { Organization, Developer } from '../domain/index.js';

/**
 * Keycloak organization representation
 */
interface KeycloakOrganization {
  id: string;
  name: string;
  attributes?: Record<string, string[] | undefined>;
}

/**
 * Keycloak user representation with organization info
 */
interface KeycloakUser {
  id: string;
  username?: string;
  attributes?: Record<string, string[] | undefined>;
}

/**
 * Keycloak API error response
 */
interface KeycloakError {
  error?: string;
  error_description?: string;
}

/**
 * Result of sync operation
 */
export interface SyncResult {
  synced: boolean;
  organizationId?: string;
  developerId?: string;
  error?: string;
}

/**
 * Keycloak Sync Service
 */
export class KeycloakSyncService {
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly adminUsername?: string;
  private readonly adminPassword?: string;

  constructor(
    private readonly organizationRepository: IOrganizationRepository,
    private readonly developerRepository: IDeveloperRepository
  ) {
    this.baseUrl = process.env.KEYCLOAK_URL || '';
    this.realm = process.env.KEYCLOAK_REALM || 'oxlayer';
    this.adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME;
    this.adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD;
  }

  /**
   * Sync an organization from Keycloak to local database
   *
   * @param organizationId - The organization ID from Keycloak
   * @returns Sync result indicating success/failure
   */
  async syncOrganization(organizationId: string): Promise<SyncResult> {
    // Check if organization already exists locally
    const existing = await this.organizationRepository.findById(organizationId);
    if (existing) {
      return { synced: false, organizationId };
    }

    // Try to get admin token for Keycloak API access
    let adminToken: string | null = null;

    if (this.adminUsername && this.adminPassword) {
      adminToken = await this.getAdminToken();
    }

    // Fetch organization details from Keycloak
    const orgDetails = await this.fetchOrganizationFromKeycloak(organizationId, adminToken);

    if (!orgDetails) {
      // If we can't fetch details, create with defaults based on ID
      // This allows the device approval to proceed even if Keycloak API is unavailable
      return this.createDefaultOrganization(organizationId);
    }

    // Create organization locally with Keycloak data
    return this.createOrganizationFromKeycloak(orgDetails);
  }

  /**
   * Sync a developer from Keycloak to local database
   *
   * @param developerId - The developer ID from Keycloak
   * @param organizationId - The organization ID the developer belongs to
   * @param email - Optional email from JWT token (preferred over Keycloak API)
   * @returns Sync result indicating success/failure
   */
  async syncDeveloper(developerId: string, organizationId: string, email?: string): Promise<SyncResult> {
    // Check if developer already exists locally
    const existing = await this.developerRepository.findById(developerId);
    if (existing) {
      return { synced: false, developerId };
    }

    // Ensure organization exists first (sync if needed)
    const orgExists = await this.organizationRepository.exists(organizationId);
    if (!orgExists) {
      const orgSyncResult = await this.syncOrganization(organizationId);
      // Check for actual error, not just !synced (synced: false means org already existed)
      if (orgSyncResult.error) {
        return {
          synced: false,
          error: `Cannot sync developer: organization ${organizationId} sync failed - ${orgSyncResult.error}`,
        };
      }
    }

    // If email is provided from JWT token, use it directly (preferred approach)
    if (email) {
      return this.createDeveloperWithEmail(developerId, organizationId, email);
    }

    // Fallback: Try to get admin token for Keycloak API access
    let adminToken: string | null = null;

    if (this.adminUsername && this.adminPassword) {
      adminToken = await this.getAdminToken();
    }

    // Fetch developer details from Keycloak
    const userDetails = await this.fetchDeveloperFromKeycloak(developerId, adminToken);

    if (!userDetails) {
      // If we can't fetch details, create with defaults based on ID
      // This allows the device approval to proceed even if Keycloak API is unavailable
      return this.createDefaultDeveloper(developerId, organizationId);
    }

    // Create developer locally with Keycloak data
    return this.createDeveloperFromKeycloak(userDetails, organizationId);
  }

  /**
   * Get Keycloak admin token for API access
   */
  private async getAdminToken(): Promise<string | null> {
    if (!this.adminUsername || !this.adminPassword) {
      return null;
    }

    try {
      const tokenUrl = `${this.baseUrl}/realms/master/protocol/openid-connect/token`;
      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: this.adminUsername,
        password: this.adminPassword,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        console.warn('Failed to get Keycloak admin token:', response.status);
        return null;
      }

      const data = await response.json() as { access_token?: string };
      return data.access_token || null;
    } catch (error) {
      console.warn('Error fetching Keycloak admin token:', error);
      return null;
    }
  }

  /**
   * Fetch organization details from Keycloak
   */
  private async fetchOrganizationFromKeycloak(
    organizationId: string,
    adminToken: string | null
  ): Promise<KeycloakOrganization | null> {
    try {
      // Try to fetch as a user/organization first
      if (adminToken) {
        const userUrl = `${this.baseUrl}/admin/realms/${this.realm}/users/${organizationId}`;
        const response = await fetch(userUrl, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (response.ok) {
          const user = await response.json() as KeycloakUser;
          return this.userToOrganization(user, organizationId);
        }
      }

      // If admin API fails or no token, try public realm info
      // In Keycloak, organizations are often represented as groups or users
      // For now, we'll create a default organization
      return null;
    } catch (error) {
      console.warn('Error fetching organization from Keycloak:', error);
      return null;
    }
  }

  /**
   * Convert Keycloak user to organization format
   */
  private userToOrganization(user: KeycloakUser, organizationId: string): KeycloakOrganization {
    // Extract organization name from user attributes or use a default
    const orgNameAttr = user.attributes?.org_name || user.attributes?.name;
    const name = orgNameAttr?.[0] || user.username || `Organization ${organizationId.slice(0, 8)}`;

    return {
      id: organizationId,
      name,
      attributes: user.attributes,
    };
  }

  /**
   * Create a default organization when Keycloak data is unavailable
   */
  private async createDefaultOrganization(organizationId: string): Promise<SyncResult> {
    try {
      const org = Organization.create({
        name: `Organization ${organizationId.slice(0, 8)}`,
        slug: `org-${organizationId.slice(0, 8)}`,
        tier: 'starter',
      });

      // Override the ID to match Keycloak's organization ID
      const orgWithKeycloakId = Organization.fromPersistence({
        ...org.toPersistence(),
        id: organizationId,
      });

      await this.organizationRepository.save(orgWithKeycloakId);

      return {
        synced: true,
        organizationId,
      };
    } catch (error) {
      return {
        synced: false,
        error: error instanceof Error ? error.message : 'Failed to create default organization',
      };
    }
  }

  /**
   * Create organization from Keycloak data
   */
  private async createOrganizationFromKeycloak(keycloakOrg: KeycloakOrganization): Promise<SyncResult> {
    try {
      // Extract tier from attributes, default to starter
      const tierAttr = keycloakOrg.attributes?.tier || keycloakOrg.attributes?.org_tier;
      const tier = this.parseTier(tierAttr?.[0]);

      // Extract slug or generate from name
      const slugAttr = keycloakOrg.attributes?.slug;
      const slug = slugAttr?.[0] || this.generateSlugFromName(keycloakOrg.name);

      const org = Organization.create({
        name: keycloakOrg.name,
        slug,
        tier,
      });

      // Override the ID to match Keycloak's organization ID
      const orgWithKeycloakId = Organization.fromPersistence({
        ...org.toPersistence(),
        id: keycloakOrg.id,
      });

      await this.organizationRepository.save(orgWithKeycloakId);

      return {
        synced: true,
        organizationId: keycloakOrg.id,
      };
    } catch (error) {
      return {
        synced: false,
        error: error instanceof Error ? error.message : 'Failed to create organization from Keycloak data',
      };
    }
  }

  /**
   * Parse tier from string value
   */
  private parseTier(value?: string): 'starter' | 'professional' | 'enterprise' | 'custom' {
    if (!value) return 'starter';

    const validTiers = ['starter', 'professional', 'enterprise', 'custom'];
    const normalized = value.toLowerCase();

    if (validTiers.includes(normalized)) {
      return normalized as 'starter' | 'professional' | 'enterprise' | 'custom';
    }

    return 'starter';
  }

  /**
   * Generate slug from organization name
   */
  private generateSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);
  }

  /**
   * Fetch developer details from Keycloak
   */
  private async fetchDeveloperFromKeycloak(
    developerId: string,
    adminToken: string | null
  ): Promise<KeycloakUser | null> {
    try {
      if (adminToken) {
        const userUrl = `${this.baseUrl}/admin/realms/${this.realm}/users/${developerId}`;
        const response = await fetch(userUrl, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        });

        if (response.ok) {
          return await response.json() as KeycloakUser;
        }
      }
      return null;
    } catch (error) {
      console.warn('Error fetching developer from Keycloak:', error);
      return null;
    }
  }

  /**
   * Create a default developer when Keycloak data is unavailable
   */
  private async createDefaultDeveloper(developerId: string, organizationId: string): Promise<SyncResult> {
    try {
      const dev = Developer.create({
        organizationId,
        name: `Developer ${developerId.slice(0, 8)}`,
        email: `dev-${developerId.slice(0, 8)}@placeholder.local`,
        environments: ['development'],
      });

      // Override the ID to match Keycloak's developer ID
      const devWithKeycloakId = Developer.fromPersistence({
        ...dev.toPersistence(),
        id: developerId,
      });

      await this.developerRepository.save(devWithKeycloakId);

      return {
        synced: true,
        developerId,
      };
    } catch (error) {
      return {
        synced: false,
        error: error instanceof Error ? error.message : 'Failed to create default developer',
      };
    }
  }

  /**
   * Create developer from Keycloak data
   */
  private async createDeveloperFromKeycloak(user: KeycloakUser, organizationId: string): Promise<SyncResult> {
    try {
      // Extract email from Keycloak user - if invalid, fall back to placeholder
      let email = user.attributes?.email?.[0];
      try {
        // Try to validate email by creating a Developer with it
        if (!email) throw new Error('No email');
        Developer.create({
          organizationId,
          name: 'temp',
          email,
          environments: ['development'],
        });
      } catch {
        // Email validation failed, use placeholder
        email = `${user.username || user.id}@placeholder.local`;
      }

      const name = user.attributes?.name?.[0] || user.username || `Developer ${user.id.slice(0, 8)}`;

      const dev = Developer.create({
        organizationId,
        name,
        email,
        environments: ['development'],
      });

      // Override the ID to match Keycloak's developer ID
      const devWithKeycloakId = Developer.fromPersistence({
        ...dev.toPersistence(),
        id: user.id,
      });

      await this.developerRepository.save(devWithKeycloakId);

      return {
        synced: true,
        developerId: user.id,
      };
    } catch (error) {
      return {
        synced: false,
        error: error instanceof Error ? error.message : 'Failed to create developer from Keycloak data',
      };
    }
  }

  /**
   * Create a developer using email from the JWT token
   * This is the preferred method as it uses validated data from Keycloak's token
   */
  private async createDeveloperWithEmail(developerId: string, organizationId: string, email: string): Promise<SyncResult> {
    console.log('[SYNC] Creating developer with email:', { developerId, organizationId, email });
    try {
      // Extract name from email (before @) as fallback
      const emailName = email.split('@')[0];
      const name = emailName
        .split(/[._-]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || `Developer ${developerId.slice(0, 8)}`;

      const dev = Developer.create({
        organizationId,
        name,
        email,
        environments: ['development'],
      });

      // Override the ID to match Keycloak's developer ID
      const devWithKeycloakId = Developer.fromPersistence({
        ...dev.toPersistence(),
        id: developerId,
      });

      await this.developerRepository.save(devWithKeycloakId);

      return {
        synced: true,
        developerId,
      };
    } catch (error) {
      return {
        synced: false,
        error: error instanceof Error ? error.message : 'Failed to create developer from email',
      };
    }
  }
}
