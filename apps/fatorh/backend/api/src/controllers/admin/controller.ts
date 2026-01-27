/**
 * Admin Controller for Tenant Provisioning
 *
 * Handles:
 * - B2B Realm provisioning in Keycloak (with globex_ prefix)
 * - Tenant database creation (globex_workspace_{realm}_{workspaceId})
 * - Schema migrations for tenant databases
 * - Realm registry in admin database
 *
 * Requires: platform-admin role in Keycloak
 */

import type { Context } from 'hono';
import { z } from 'zod';
import postgres from 'postgres';
import { and, eq, sql } from 'drizzle-orm';
import { getAdminDb } from '../../config/admin-db.config.js';
import { realms, databases, organizations } from '../../db/admin-schema.js';

// Request schemas
const ownerUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  temporaryPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const provisionRealmSchema = z.object({
  realmId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Realm ID must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(1),
  owner: ownerUserSchema,
  workspaces: z.array(z.object({
    id: z.string().min(1).optional().default(() => crypto.randomUUID()),
    name: z.string().min(1),
    alias: z.string().min(1).optional(),
    domainAliases: z.array(z.string()).optional().default([]),
  })).min(1, 'At least one workspace is required'),
});

const createDatabaseSchema = z.object({
  realm: z.string().min(1),
  workspaceId: z.string().min(1),
});

/**
 * Provision Workspace Schema
 * Used for provisioning a new workspace (organization) within an existing realm
 */
const provisionWorkspaceSchema = z.object({
  realmId: z.string().min(1).describe('Realm ID (without globex_ prefix)'),
  workspaceId: z.string().uuid().optional().describe('Workspace UUID (auto-generated if not provided)'),
  name: z.string().min(1).max(255).describe('Workspace name'),
  domainAliases: z.array(z.string().url()).optional().describe('Custom domain aliases'),
  rootManagerEmail: z.string().email().optional().describe('Root manager/owner email'),
});

/**
 * Provision Organization Schema
 * Used for provisioning a new organization within the user's realm
 * This creates a Keycloak organization and provisions a workspace database
 */
const provisionOrganizationSchema = z.object({
  name: z.string().min(1).max(255).describe('Organization normalized name (lowercase alphanumeric with hyphens)'),
  alias: z.string().min(1).max(255).describe('Organization display name'),
  domainAliases: z.array(z.string().url()).optional().describe('Custom domain aliases'),
  rootManagerEmail: z.string().email().describe('Root manager/owner email'),
  rootManagerFirstName: z.string().min(1).describe('Root manager first name'),
  rootManagerLastName: z.string().min(1).describe('Root manager last name'),
  rootManagerPassword: z.string().min(8).describe('Root manager password (min 8 chars)'),
});

const listUsersSchema = z.object({
  realm: z.string().min(1),
});

/**
 * Check admin authorization - requires platform-admin role
 */
function checkAdminAuth(c: Context): { authorized: boolean; error?: string } {
  const authPayload = c.get('authPayload');
  if (!authPayload) {
    return {
      authorized: false,
      error: 'No auth payload found',
    };
  }

  const realmRoles = authPayload.realm_access?.roles || [];
  if (realmRoles.includes('platform-admin')) {
    return { authorized: true };
  }

  // Check resource roles
  const resourceAccess = authPayload.resource_access || {};
  for (const resource of Object.values(resourceAccess)) {
    if ((resource as any).roles?.includes('platform-admin')) {
      return { authorized: true };
    }
  }

  return {
    authorized: false,
    error: 'platform-admin role required',
  };
}

/**
 * Get master postgres connection for admin operations
 * Connects to 'postgres' database to CREATE DATABASE
 * Uses admin credentials for database creation
 */
function getMasterConnection() {
  // Use admin credentials for database creation
  const host = process.env.POSTGRES_ADMIN_HOST || process.env.POSTGRES_HOST;
  const port = Number(process.env.POSTGRES_ADMIN_PORT || process.env.POSTGRES_PORT);
  const user = process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD;

  // Connect to 'postgres' database for admin operations
  return postgres({
    host,
    port,
    database: 'postgres',
    user,
    password,
    max: 1,
  });
}

/**
 * Admin Controller
 */
export class AdminController {
  /**
   * Provision a new B2B realm in Keycloak
   * POST /api/admin/realms/provision
   */
  async provisionRealm(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    try {
      const body = await c.req.json();
      const validated = provisionRealmSchema.parse(body);

      const result = await this.doProvisionRealm(validated);

      return c.json({
        success: true,
        message: `Realm "${validated.realmId}" provisioned successfully`,
        realm: result,
      });
    } catch (error: any) {
      console.error('Failed to provision realm:', error);
      return c.json({
        error: 'Failed to provision realm',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Create tenant database
   * POST /api/admin/databases/create
   */
  async createDatabase(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    try {
      const body = await c.req.json();
      const validated = createDatabaseSchema.parse(body);

      const result = await this.doCreateDatabase(validated.realm, validated.workspaceId);

      // If database was newly created, register it with credentials in admin database
      if (!result.existed && result.dbUser && result.dbPassword) {
        const adminDb = await getAdminDb();
        try {
          await adminDb.insert(databases).values({
            databaseName: result.database,
            realmId: validated.realm,
            workspaceId: validated.workspaceId,
            workspaceName: validated.workspaceId, // Use workspaceId as fallback for name
            domainAliases: [],
            dbUser: result.dbUser,
            dbPassword: result.dbPassword,
            enabled: true,
            status: 'active',
          }).onConflictDoNothing();
        } catch (dbRegError: any) {
          console.warn('Failed to register database in admin database:', dbRegError?.message);
        }
      }

      return c.json({
        success: true,
        message: `Database "${result.database}" ${result.existed ? 'already exists' : 'created successfully'}`,
        database: result.database,
      });
    } catch (error: any) {
      console.error('Failed to create database:', error);
      return c.json({
        error: 'Failed to create database',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Run migrations on tenant database
   * POST /api/admin/databases/migrate
   */
  async migrateDatabase(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    try {
      const body = await c.req.json();
      const validated = createDatabaseSchema.parse(body);

      await this.doMigrateDatabase(validated.realm, validated.workspaceId);

      const dbName = `globex_workspace_${validated.realm}_${validated.workspaceId}`;
      return c.json({
        success: true,
        message: `Migrations run successfully on "${dbName}"`,
        database: dbName,
      });
    } catch (error: any) {
      console.error('Failed to run migrations:', error);
      return c.json({
        error: 'Failed to run migrations',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Full tenant provisioning (realm + database + migrations)
   * POST /api/admin/tenants/provision
   */
  async provisionTenant(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-provision');

    try {
      const body = await c.req.json();
      const validated = provisionRealmSchema.parse(body);

      log.info('Starting tenant provisioning', { realmId: validated.realmId, workspacesCount: validated.workspaces.length });

      // Generate UUIDs for workspaces that don't have them
      const workspacesWithIds = validated.workspaces.map(w => ({
        ...w,
        id: w.id || crypto.randomUUID(),
      }));

      // Update validated config with generated IDs
      const configWithIds = { ...validated, workspaces: workspacesWithIds };

      const results: any = {
        realm: null,
        databases: [],
      };

      // Step 1: Provision realm in Keycloak
      try {
        results.realm = await this.doProvisionRealm(configWithIds);
      } catch (realmError: any) {
        log.error('Failed to provision realm', { error: realmError?.message || realmError });
        return c.json({
          success: false,
          error: 'Failed to provision realm',
          details: realmError.message || String(realmError),
          results,
        }, 500);
      }

      // Step 2: Create databases and run migrations for each workspace
      for (const workspace of workspacesWithIds) {
        const dbResult: any = {
          workspaceId: workspace.id,
          workspaceName: workspace.name,
        };

        log.debug('Processing workspace', { workspaceId: workspace.id, workspaceName: workspace.name });

        try {
          // Create database with tenant-specific credentials
          const createResult = await this.doCreateDatabase(validated.realmId, workspace.id);
          dbResult.database = createResult.database;
          dbResult.databaseStatus = createResult.existed ? 'existed' : 'created';
          log.debug('Database created', { database: dbResult.database, status: dbResult.databaseStatus });

          // Register database in admin database (only if newly created)
          if (!createResult.existed) {
            const adminDb = await getAdminDb();
            try {
              await adminDb.insert(databases).values({
                databaseName: createResult.database,
                realmId: validated.realmId,
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                domainAliases: workspace.domainAliases || [],
                dbUser: createResult.dbUser,
                dbPassword: createResult.dbPassword,
                enabled: true,
                status: 'active',
              }).onConflictDoNothing();
              dbResult.adminDbRegistration = 'completed';
              log.debug('Database registered in admin database', { database: createResult.database });
            } catch (dbRegError: any) {
              dbResult.adminDbRegistration = 'failed';
              dbResult.adminDbError = dbRegError.message;
              log.warn('Failed to register database in admin database', { error: dbRegError?.message });
              // Don't fail provisioning if admin DB registration fails
            }
          } else {
            dbResult.adminDbRegistration = 'skipped';
          }

          // Run migrations
          try {
            await this.doMigrateDatabase(validated.realmId, workspace.id);
            dbResult.migrations = 'completed';
            log.debug('Migrations completed', { database: dbResult.database });
          } catch (migrationError: any) {
            dbResult.migrations = 'failed';
            dbResult.migrationError = migrationError.message;
            log.error('Migrations failed', { database: dbResult.database, error: migrationError?.message });
          }
        } catch (dbError: any) {
          dbResult.databaseStatus = 'failed';
          dbResult.error = dbError.message;
          log.error('Database creation failed', { workspaceId: workspace.id, error: dbError?.message });
        }

        results.databases.push(dbResult);
      }

      log.info('Tenant provisioning completed', { realmId: validated.realmId, databasesCount: results.databases.length });

      return c.json({
        success: true,
        message: `Tenant "${validated.realmId}" provisioned successfully`,
        results,
      });
    } catch (error: any) {
      log.error('Failed to provision tenant', { error: error?.message || error });
      return c.json({
        success: false,
        error: 'Failed to provision tenant',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Provision workspace (organization) within existing realm
   * POST /api/admin/workspaces/provision
   *
   * Creates a new database for a workspace within an existing realm.
   * This is used when creating a new organization in the people app.
   */
  async provisionWorkspace(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-workspace-provision');

    try {
      const body = await c.req.json();
      const validated = provisionWorkspaceSchema.parse(body);

      log.info('Starting workspace provisioning', { realmId: validated.realmId, name: validated.name });

      // Generate workspace ID if not provided
      const workspaceId = validated.workspaceId || crypto.randomUUID();

      // Step 1: Create database with tenant-specific credentials
      const createResult = await this.doCreateDatabase(validated.realmId, workspaceId);

      // Step 2: Register database in admin database with credentials
      const adminDb = await getAdminDb();
      try {
        await adminDb.insert(databases).values({
          databaseName: createResult.database,
          realmId: validated.realmId,
          workspaceId: workspaceId,
          workspaceName: validated.name,
          domainAliases: validated.domainAliases || [],
          dbUser: createResult.dbUser,
          dbPassword: createResult.dbPassword,
          enabled: true,
          status: 'active',
        }).onConflictDoNothing();
        log.debug('Database registered in admin database', { database: createResult.database });
      } catch (dbRegError: any) {
        log.warn('Failed to register database in admin database', { error: dbRegError?.message });
        // Don't fail provisioning if admin DB registration fails
      }

      // Step 3: Run migrations
      try {
        await this.doMigrateDatabase(validated.realmId, workspaceId);
      } catch (migrationError: any) {
        log.error('Migrations failed', { database: createResult.database, error: migrationError?.message });
        return c.json({
          error: 'Failed to run migrations',
          details: migrationError.message || String(migrationError),
        }, 500);
      }

      log.info('Workspace provisioning completed', { realmId: validated.realmId, workspaceId, database: createResult.database });

      return c.json({
        success: true,
        message: `Workspace "${validated.name}" provisioned successfully`,
        workspace: {
          id: workspaceId,
          name: validated.name,
          realmId: validated.realmId,
          databaseName: createResult.database,
          domainAliases: validated.domainAliases || [],
          rootManagerEmail: validated.rootManagerEmail,
        },
      });
    } catch (error: any) {
      log.error('Failed to provision workspace', { error: error?.message || error });
      return c.json({
        error: 'Failed to provision workspace',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Provision organization (for People app)
   * POST /api/organizations/provision
   *
   * Creates a new organization within the user's realm with:
   * - Keycloak organization
   * - Workspace with database provisioning
   * - Root manager user setup
   *
   * Note: This endpoint uses regular auth (not platform-admin)
   * Users can only create organizations in their own realm
   */
  async provisionOrganization(c: Context): Promise<Response> {
    const authPayload = c.get('authPayload');
    if (!authPayload) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('org-provision');

    try {
      const body = await c.req.json();
      const validated = provisionOrganizationSchema.parse(body);

      // Get realm from auth payload (user can only create in their own realm)
      const realmName = authPayload.realm_name || authPayload.realmAccess?.realm || 'globex';
      // Extract realmId from realmName (remove globex_ prefix if present)
      const realmId = realmName.replace('globex_', '');
      const userId = authPayload.sub || authPayload.preferred_username;

      log.info('Starting organization provisioning', { realmId, realmName, userId, orgName: validated.name });

      // Generate workspace/organization ID
      const organizationId = crypto.randomUUID();

      // Step 1: Create Keycloak organization
      let keycloakOrganizationId: string | undefined;
      try {
        const { KeycloakAdminClient } = await import('@oxlayer/cli-keycloak-bootstrap');
        const keycloakConfig = {
          url: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
          admin: {
            username: process.env.KEYCLOAK_ADMIN || 'admin',
            password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
          },
        };
        const adminClient = new KeycloakAdminClient(keycloakConfig);
        await adminClient.authenticate();

        // Create organization in Keycloak
        const org = await adminClient.createOrganization(realmName, {
          name: validated.name,
          domainAliases: validated.domainAliases || [],
        });
        keycloakOrganizationId = org.id;
        log.info('Keycloak organization created', { organizationId: keycloakOrganizationId, name: validated.name });

        // Create root manager user in Keycloak
        const username = validated.rootManagerEmail.toLowerCase().replace(/[@.]/g, '_');
        const rootManagerUserId = await adminClient.createUser(realmName, {
          username,
          email: validated.rootManagerEmail,
          firstName: validated.rootManagerFirstName,
          lastName: validated.rootManagerLastName,
          enabled: true,
          emailVerified: false,
          credentials: [{
            type: 'password',
            value: validated.rootManagerPassword,
            temporary: true,
          }],
          attributes: {
            organizationId: [keycloakOrganizationId],
          },
        });
        log.info('Root manager user created', { username, userId: rootManagerUserId, email: validated.rootManagerEmail });

        // Assign root manager to organization
        await adminClient.inviteUserToOrganization(realmName, keycloakOrganizationId, rootManagerUserId);
        log.info('Root manager invited to organization', { username, userId: rootManagerUserId, organizationId: keycloakOrganizationId });

        // Assign owner role to root manager
        const ownerRole = await adminClient.getRealmRole(realmName, 'owner');
        if (ownerRole) {
          await adminClient.assignRealmRoles(realmName, username, [ownerRole]);
          log.info('Owner role assigned to root manager', { username });
        }

      } catch (keycloakError: any) {
        log.error('Failed to create Keycloak organization', { error: keycloakError?.message || keycloakError });
        return c.json({
          error: 'Failed to create organization in Keycloak',
          details: keycloakError.message || String(keycloakError),
        }, 500);
      }

      // Step 2: Create database for the workspace with tenant-specific credentials
      const createResult = await this.doCreateDatabase(realmId, organizationId);

      // Step 3: Register database in admin database with credentials
      const adminDb = await getAdminDb();
      try {
        await adminDb.insert(databases).values({
          databaseName: createResult.database,
          realmId: realmId,
          workspaceId: organizationId,
          workspaceName: validated.name,
          domainAliases: validated.domainAliases || [],
          dbUser: createResult.dbUser,
          dbPassword: createResult.dbPassword,
          enabled: true,
          status: 'active',
        }).onConflictDoNothing();
        log.debug('Database registered in admin database', { database: createResult.database });
      } catch (dbRegError: any) {
        log.warn('Failed to register database in admin database', { error: dbRegError?.message });
      }

      // Step 4: Run migrations
      try {
        await this.doMigrateDatabase(realmId, organizationId);
      } catch (migrationError: any) {
        log.error('Migrations failed', { database: createResult.database, error: migrationError?.message });
        return c.json({
          error: 'Failed to run migrations',
          details: migrationError.message || String(migrationError),
        }, 500);
      }

      log.info('Organization provisioning completed', {
        realmId,
        realmName,
        organizationId,
        keycloakOrganizationId,
        database: createResult.database,
      });

      return c.json({
        success: true,
        message: `Organization "${validated.name}" provisioned successfully`,
        organization: {
          id: organizationId,
          keycloakId: keycloakOrganizationId,
          name: validated.name,
          realmId: realmId,
          realmName: realmName,
          databaseName: createResult.database,
          domainAliases: validated.domainAliases || [],
          rootManagerEmail: validated.rootManagerEmail,
        },
      });
    } catch (error: any) {
      log.error('Failed to provision organization', { error: error?.message || error });
      return c.json({
        error: 'Failed to provision organization',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Retry organization creation for a workspace
   * POST /api/admin/tenants/:realmId/organizations/retry
   *
   * Retries creating a Keycloak organization for a workspace that previously failed.
   * This is useful after enabling the Organizations extension in Keycloak.
   */
  async retryOrganization(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-org-retry');

    try {
      const realmId = c.req.param('realmId');
      const body = await c.req.json();
      const workspaceId = body.workspaceId;

      if (!workspaceId) {
        return c.json({
          error: 'Bad request',
          details: 'workspaceId is required',
        }, 400);
      }

      log.info('Retrying organization creation', { realmId, workspaceId });

      const adminDb = await getAdminDb();

      // Get the organization record from database
      const orgRecords = await adminDb
        .select()
        .from(organizations)
        .where(eq(organizations.realmId, realmId))
        .where(eq(organizations.workspaceId, workspaceId));

      if (orgRecords.length === 0) {
        return c.json({
          error: 'Not found',
          details: `No organization record found for realm "${realmId}" and workspace "${workspaceId}"`,
        }, 404);
      }

      const orgRecord = orgRecords[0];

      // If already created, return success
      if (orgRecord.status === 'created') {
        return c.json({
          success: true,
          message: 'Organization already created',
          organization: {
            id: orgRecord.keycloakOrganizationId,
            name: orgRecord.name,
            workspaceId: orgRecord.workspaceId,
            status: orgRecord.status,
          },
        });
      }

      // Get realm name for Keycloak API
      const realmRecords = await adminDb
        .select()
        .from(realms)
        .where(eq(realms.realmId, realmId));

      if (realmRecords.length === 0) {
        return c.json({
          error: 'Not found',
          details: `Realm "${realmId}" not found`,
        }, 404);
      }

      const realmName = realmRecords[0].realmName;

      // Import and setup Keycloak admin client
      const { KeycloakAdminClient } = await import('@oxlayer/cli-keycloak-bootstrap');
      const keycloakConfig = {
        url: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
        admin: {
          username: process.env.KEYCLOAK_ADMIN || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        },
      };

      const adminClient = new KeycloakAdminClient(keycloakConfig);
      await adminClient.authenticate();

      // First, enable organizations for the realm
      try {
        await adminClient.enableRealmOrganizations(realmName);
        log.info('Organizations enabled for realm during retry', { realmName });
      } catch (orgEnableError: any) {
        log.warn('Failed to enable organizations for realm during retry', {
          realmName,
          error: orgEnableError?.message || String(orgEnableError),
          errorName: orgEnableError?.name,
        });
        // Continue anyway - organizations might already be enabled
      }

      // Try to create the organization
      try {
        const keycloakOrganization = await adminClient.createOrganization(realmName, {
          name: orgRecord.name,
          domainAliases: [],
        });

        // Assign owner to the organization if not already assigned
        if (!orgRecord.ownerAssigned && orgRecord.ownerUsername) {
          try {
            // Get the user ID from username
            const user = await adminClient.getUserByUsername(realmName, orgRecord.ownerUsername);
            if (user && user.id) {
              await adminClient.inviteUserToOrganization(realmName, keycloakOrganization.id, user.id);
              log.info('Owner invited to organization during retry', {
                username: orgRecord.ownerUsername,
                userId: user.id,
                organizationId: keycloakOrganization.id,
              });
            } else {
              log.warn('User not found during organization retry', {
                username: orgRecord.ownerUsername,
                organizationId: keycloakOrganization.id,
              });
            }
          } catch (assignError: any) {
            log.warn('Failed to assign owner to organization during retry', {
              username: orgRecord.ownerUsername,
              organizationId: keycloakOrganization.id,
              error: assignError?.message || String(assignError),
            });
            // Continue anyway - organization is created, owner assignment can be done manually
          }
        }

        // Update database record
        await adminDb
          .update(organizations)
          .set({
            keycloakOrganizationId: keycloakOrganization.id,
            status: 'created',
            ownerAssigned: orgRecord.ownerAssigned || false,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, orgRecord.id));

        log.info('Organization retry succeeded', {
          realmId,
          workspaceId,
          keycloakOrganizationId: keycloakOrganization.id,
        });

        return c.json({
          success: true,
          message: 'Organization created successfully',
          organization: {
            id: keycloakOrganization.id,
            name: orgRecord.name,
            workspaceId: orgRecord.workspaceId,
            status: 'created',
          },
        });
      } catch (retryError: any) {
        // Update database record with error
        await adminDb
          .update(organizations)
          .set({
            lastError: retryError?.name || 'Unknown',
            errorMessage: retryError?.message || String(retryError),
            retryCount: sql`${organizations.retryCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, orgRecord.id));

        log.error('Organization retry failed', {
          realmId,
          workspaceId,
          error: retryError?.message,
        });

        return c.json({
          success: false,
          error: 'Failed to create organization',
          details: retryError.message || String(retryError),
          organization: {
            id: orgRecord.id,
            name: orgRecord.name,
            workspaceId: orgRecord.workspaceId,
            status: 'failed',
            retryCount: (orgRecord.retryCount || 0) + 1,
          },
        }, 500);
      }
    } catch (error: any) {
      log.error('Failed to retry organization', { error: error?.message || error });
      return c.json({
        error: 'Failed to retry organization',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * List all tenants
   * GET /api/admin/tenants
   * Returns list of tenants from admin database
   */
  async listTenants(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    try {
      const adminDb = await getAdminDb();

      // Get all realms from admin database
      const allRealms = await adminDb.select().from(realms).orderBy(realms.provisionedAt);

      // Get all databases from admin database
      const allDatabases = await adminDb.select().from(databases);

      // Get all organizations from admin database
      const allOrganizations = await adminDb.select().from(organizations);

      // Group databases by realm
      const databasesByRealm: Record<string, any[]> = {};
      for (const db of allDatabases) {
        if (!databasesByRealm[db.realmId]) {
          databasesByRealm[db.realmId] = [];
        }
        databasesByRealm[db.realmId].push({
          database: db.databaseName,
          workspaceId: db.workspaceId,
          workspaceName: db.workspaceName,
          dbUser: db.dbUser, // Include dbUser (without password for security)
          enabled: db.enabled,
          status: db.status,
        });
      }

      // Group organizations by realm
      const organizationsByRealm: Record<string, any[]> = {};
      for (const org of allOrganizations) {
        if (!organizationsByRealm[org.realmId]) {
          organizationsByRealm[org.realmId] = [];
        }
        organizationsByRealm[org.realmId].push({
          id: org.id,
          keycloakOrganizationId: org.keycloakOrganizationId,
          name: org.name,
          alias: org.alias,
          workspaceId: org.workspaceId,
          workspaceName: org.workspaceName,
          status: org.status,
          ownerAssigned: org.ownerAssigned,
          ownerUsername: org.ownerUsername,
          errorMessage: org.errorMessage,
          retryCount: org.retryCount,
          createdAt: org.createdAt,
        });
      }

      // Combine realm, database, and organization information
      const tenants = allRealms.map((realm: any) => ({
        realmId: realm.realmId,
        realmName: realm.realmName,
        displayName: realm.displayName,
        enabled: realm.enabled,
        ownerId: realm.ownerId,
        ownerEmail: realm.ownerEmail,
        ownerFirstName: realm.ownerFirstName,
        ownerLastName: realm.ownerLastName,
        databases: databasesByRealm[realm.realmId] || [],
        organizations: organizationsByRealm[realm.realmId] || [],
        provisionedAt: realm.provisionedAt,
        settings: realm.settings,
      }));

      return c.json({
        success: true,
        tenants,
      });
    } catch (error: any) {
      console.error('Failed to list tenants:', error);
      return c.json({
        error: 'Failed to list tenants',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Get a single tenant by realm ID
   * GET /api/admin/tenants/:realmId
   * Returns detailed information about a specific tenant
   */
  async getTenant(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-get-tenant');

    try {
      const realmId = c.req.param('realmId');

      if (!realmId) {
        return c.json({
          error: 'Bad request',
          details: 'realmId is required',
        }, 400);
      }

      log.debug('Fetching tenant', { realmId });

      const adminDb = await getAdminDb();

      // Get the specific realm from admin database
      const realmRecords = await adminDb.select().from(realms).where(eq(realms.realmId, realmId));

      if (realmRecords.length === 0) {
        return c.json({
          error: 'Not found',
          details: `Tenant "${realmId}" not found`,
        }, 404);
      }

      const realm = realmRecords[0];

      // Get databases for this realm
      const realmDatabases = await adminDb.select().from(databases).where(eq(databases.realmId, realmId));

      // Get organizations for this realm
      const realmOrganizations = await adminDb.select().from(organizations).where(eq(organizations.realmId, realmId));

      // Format databases
      const formattedDatabases = realmDatabases.map((db: any) => ({
        database: db.databaseName,
        workspaceId: db.workspaceId,
        workspaceName: db.workspaceName,
        dbUser: db.dbUser, // Include dbUser (without password for security)
        enabled: db.enabled,
        status: db.status,
      }));

      // Format organizations
      const formattedOrganizations = realmOrganizations.map((org: any) => ({
        id: org.id,
        keycloakOrganizationId: org.keycloakOrganizationId,
        name: org.name,
        alias: org.alias,
        workspaceId: org.workspaceId,
        workspaceName: org.workspaceName,
        status: org.status,
        ownerAssigned: org.ownerAssigned,
        ownerUsername: org.ownerUsername,
        errorMessage: org.errorMessage,
        retryCount: org.retryCount,
        createdAt: org.createdAt,
      }));

      const tenant = {
        realmId: realm.realmId,
        realmName: realm.realmName,
        displayName: realm.displayName,
        enabled: realm.enabled,
        ownerId: realm.ownerId,
        ownerEmail: realm.ownerEmail,
        ownerFirstName: realm.ownerFirstName,
        ownerLastName: realm.ownerLastName,
        databases: formattedDatabases,
        organizations: formattedOrganizations,
        provisionedAt: realm.provisionedAt,
        settings: realm.settings,
      };

      return c.json({
        success: true,
        tenant,
      });
    } catch (error: any) {
      log.error('Failed to get tenant', { error: error?.message || error });
      return c.json({
        error: 'Failed to get tenant',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * List users in a realm
   * GET /api/admin/users
   */
  async listUsers(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    try {
      const { realm } = listUsersSchema.parse({
        realm: c.req.query('realm'),
      });

      const { Logger } = await import('@oxlayer/capabilities-internal');
      const log = new Logger('admin-users');

      const users = await this.doListUsers(realm);

      return c.json({
        success: true,
        realm,
        realmExists: true,
        users,
      });
    } catch (error: any) {
      const { Logger } = await import('@oxlayer/capabilities-internal');
      const log = new Logger('admin-users');
      log.error('Failed to list users', { error: error?.message || error });

      // Check if it's a realm not found error - return empty array instead of 404
      if (error?.code === 'USER_LIST_FAILED' || error?.message?.includes('404') || error?.message?.includes('Realm not found') || error?.message?.includes('Could not find realm')) {
        log.info('Realm not found, returning empty users list with realmExists flag');
        return c.json({
          success: true,
          realm: c.req.query('realm'),
          realmExists: false,
          users: [],
        });
      }

      return c.json({
        error: 'Failed to list users',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * List all realms
   * GET /api/admin/realms
   */
  async listRealms(c: Context): Promise<Response> {
    // Check authorization
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-realms');

    try {
      const realms = await this.doListRealms();
      return c.json({
        success: true,
        realms,
      });
    } catch (error: any) {
      log.error('Failed to list realms', { error: error?.message || error });
      return c.json({
        error: 'Failed to list realms',
        details: error.message || String(error),
      }, 500);
    }
  }

  // =========================================================================
  // PRIVATE METHODS - Core provisioning logic
  // =========================================================================

  /**
   * Internal: Provision realm in Keycloak
   */
  private async doProvisionRealm(config: z.infer<typeof provisionRealmSchema>): Promise<any> {
    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-provision');

    log.info('Starting realm provisioning', { realmId: config.realmId, displayName: config.displayName, workspaces: config.workspaces });

    try {
      log.debug('Importing KeycloakAdminClient');
      const { KeycloakAdminClient } = await import('@oxlayer/cli-keycloak-bootstrap');
      log.debug('KeycloakAdminClient imported successfully');

      const keycloakConfig = {
        url: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
        admin: {
          username: process.env.KEYCLOAK_ADMIN || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        },
      };

      log.debug('Keycloak config', { url: keycloakConfig.url, username: keycloakConfig.admin.username });

      const adminClient = new KeycloakAdminClient(keycloakConfig);

      // Authenticate
      log.debug('Authenticating with Keycloak admin API');
      await adminClient.authenticate();
      log.debug('Authentication successful');

      // Create realm with globex_ prefix
      const realmName = `globex_${config.realmId}`;
      log.debug('Creating realm', { realmId: config.realmId, realmName });
      await adminClient.createRealm({
        name: realmName,
        displayName: config.displayName,
        type: 'client',
        sslRequired: 'external',
        organizationsEnabled: true,
        security: {
          loginWithEmailAllowed: true,
          registrationEmailAsUsername: true,
          duplicateEmailsAllowed: false,
          resetPasswordAllowed: true,
          bruteForceProtected: true,
        },
      });
      log.info('Realm created successfully', { realmId: config.realmId, realmName });

      // Enable organizations for the realm
      let organizationsEnabled = false;
      try {
        await adminClient.enableRealmOrganizations(realmName);
        organizationsEnabled = true;
        log.info('Organizations enabled for realm', { realmName });
      } catch (orgEnableError: any) {
        log.warn('Failed to enable organizations for realm', {
          realmName,
          error: orgEnableError?.message || String(orgEnableError),
          errorName: orgEnableError?.name,
        });
        // Don't fail provisioning if enabling organizations fails
        // Organizations can be enabled manually via UI
        // Organizations will be marked as failed and can be retried
      }

      // Create roles
      const roles = [
        { name: 'owner', description: `B2B client owner for ${config.displayName}` },
        { name: 'supervisor', description: `B2B operations supervisor for ${config.displayName}` },
        { name: 'manager', description: `Company manager for ${config.displayName}` },
        { name: 'candidate', description: `End user for ${config.displayName}` },
      ];

      log.debug('Creating roles', { roles: roles.map(r => r.name) });
      for (const role of roles) {
        await adminClient.createRole(realmName, role);
        log.debug('Role created', { role: role.name });
      }

      // Create clients with redirect URIs and web origins
      const baseUrl = 'http://localhost';
      const clients = [
        {
          clientId: `globex_people`,
          name: `globex_people`,
          description: 'People operations web app',
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          directAccessGrantsEnabled: true,
          redirectUris: [
            `${baseUrl}:5176/*`,
          ],
          postLogoutRedirectUris: [
            `${baseUrl}:5176`,
          ],
          webOrigins: [
            `${baseUrl}:5176`,
          ],
          protocol: 'openid-connect' as const,
          attributes: {
            'pkce.code.challenge.method': 'S256',
          } as Record<string, string>,
        },
        {
          clientId: `globex_manager`,
          name: `globex_manager`,
          description: 'Manager web app',
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          directAccessGrantsEnabled: true,
          redirectUris: [
            `${baseUrl}:5177/*`,
          ],
          postLogoutRedirectUris: [
            `${baseUrl}:5177`,
          ],
          webOrigins: [
            `${baseUrl}:5177`,
          ],
          protocol: 'openid-connect' as const,
          attributes: {
            'pkce.code.challenge.method': 'S256',
          } as Record<string, string>,
        },
        {
          clientId: `globex_app`,
          name: `globex_app`,
          description: 'Candidate portal app',
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          directAccessGrantsEnabled: false,
          redirectUris: [
            `${baseUrl}:5178/*`,
          ],
          postLogoutRedirectUris: [
            `${baseUrl}:5178`,
          ],
          webOrigins: [
            `${baseUrl}:5178`,
          ],
          protocol: 'openid-connect' as const,
          attributes: {
            'pkce.code.challenge.method': 'S256',
          } as Record<string, string>,
        },
      ];

      log.debug('Creating clients', { clients: clients.map(c => c.clientId) });
      for (const client of clients) {
        try {
          await adminClient.createClient(realmName, client);
          log.debug('Client created', { clientId: client.clientId });
        } catch (clientError: any) {
          // Client might already exist, log and continue
          log.warn('Client creation skipped (may already exist)', {
            clientId: client.clientId,
            error: clientError?.message,
          });
        }
      }

      // Add protocol mappers to the web client for JWT claims
      // These mappers add organization, workspace, and roles to JWT tokens
      const protocolMappers = [
        {
          name: 'realm-mapper',
          protocol: 'openid-connect' as const,
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          config: {
            'access.token.claim': 'true',
            'claim.name': 'realm',
            'id.token.claim': 'true',
            'jsonType.label': 'String',
            'user.attribute': 'realm',
            'introspection.token.claim': 'true',
            'userinfo.token.claim': 'true',
          } as Record<string, string>,
        },
        {
          name: 'organization-mapper',
          protocol: 'openid-connect' as const,
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          config: {
            'access.token.claim': 'true',
            'claim.name': 'organization',
            'id.token.claim': 'true',
            'jsonType.label': 'JSON',
            'introspection.token.claim': 'true',
            'userinfo.token.claim': 'true',
            'multivalued': 'true',
          } as Record<string, string>,
        },
        {
          name: 'workspace-mapper',
          protocol: 'openid-connect' as const,
          protocolMapper: 'oidc-usermodel-attribute-mapper',
          config: {
            'access.token.claim': 'true',
            'claim.name': 'workspace',
            'id.token.claim': 'true',
            'jsonType.label': 'JSON',
            'introspection.token.claim': 'true',
            'userinfo.token.claim': 'true',
          } as Record<string, string>,
        },
        {
          name: 'roles-mapper',
          protocol: 'openid-connect' as const,
          protocolMapper: 'oidc-usermodel-realm-role-mapper',
          config: {
            'access.token.claim': 'true',
            'claim.name': 'roles',
            'id.token.claim': 'true',
            'jsonType.label': 'String',
            'introspection.token.claim': 'true',
            'userinfo.token.claim': 'true',
            'multivalued': 'true',
          } as Record<string, string>,
        },
      ];

      log.debug('Adding protocol mappers to web client');
      const webClientId = `globex-web`;
      for (const mapper of protocolMappers) {
        try {
          await adminClient.createProtocolMapper(realmName, webClientId, mapper);
          log.debug('Protocol mapper created', { mapper: mapper.name });
        } catch (mapperError: any) {
          // Mapper might already exist, log and continue
          log.warn('Protocol mapper creation skipped (may already exist)', {
            mapper: mapper.name,
            error: mapperError?.message,
          });
        }
      }

      // Register realm in admin database FIRST (before organizations and user)
      // This ensures the tenant appears in UI even if organization creation fails
      const adminDb = await getAdminDb();
      const ownerUsername = config.owner.email; // Use email as username (we have this before user creation)
      try {
        await adminDb.insert(realms).values({
          realmId: config.realmId,
          realmName: realmName,
          displayName: config.displayName,
          enabled: true,
          ownerId: ownerUsername,
          ownerEmail: config.owner.email,
          ownerFirstName: config.owner.firstName,
          ownerLastName: config.owner.lastName,
          settings: {
            organizationsEnabled: organizationsEnabled,
          },
        }).onConflictDoNothing();
        log.info('Realm registered in admin database', { realmId: config.realmId });
      } catch (dbError: any) {
        log.warn('Failed to register realm in admin database', { error: dbError?.message });
        // Don't fail provisioning if admin DB registration fails
      }

      // Create organizations for each workspace FIRST (before owner user)
      // The owner user will be created next and then explicitly added to each organization
      // Note: Organizations feature requires Keycloak 22+ with Organizations extension enabled
      // If organizations fail to create, they will be saved as 'failed' and can be retried from UI
      const createdOrganizations: Array<{ id: string; name: string; workspaceId: string; status: string; error?: string }> = [];
      let hasOrganizationFailures = false;

      for (const workspace of config.workspaces) {
        log.debug('Creating organization for workspace', { workspaceId: workspace.id, workspaceName: workspace.name });

        try {
          const keycloakOrganization = await adminClient.createOrganization(realmName, {
            name: workspace.name,
            domainAliases: workspace.domainAliases || [],
          });

          // Save organization to database as 'created' (ownerAssigned will be set to true after user creation)
          try {
            log.debug('Attempting to save organization to database', {
              workspaceId: workspace.id,
              keycloakOrganizationId: keycloakOrganization.id,
            });
            await adminDb.insert(organizations).values({
              realmId: config.realmId,
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              keycloakOrganizationId: keycloakOrganization.id,
              name: workspace.name,
              alias: workspace.alias,
              ownerAssigned: false, // Will be assigned after user creation
              ownerUsername: ownerUsername,
              status: 'created',
            }).onConflictDoNothing();
            log.debug('Organization saved to admin database', { workspaceId: workspace.id, keycloakOrganizationId: keycloakOrganization.id });
          } catch (dbSaveError: any) {
            log.warn('Failed to save organization to admin database', {
              workspaceId: workspace.id,
              errorMessage: dbSaveError?.message,
              errorName: dbSaveError?.name,
              errorCode: dbSaveError?.code,
              errorConstraint: dbSaveError?.constraint,
              errorDetail: dbSaveError?.detail,
              errorTable: dbSaveError?.table,
              fullError: JSON.stringify(dbSaveError),
            });
            // Don't fail provisioning if admin DB save fails
          }

          createdOrganizations.push({
            id: keycloakOrganization.id,
            name: workspace.name,
            workspaceId: workspace.id,
            status: 'created',
          });
          log.info('Keycloak organization created', { organizationId: keycloakOrganization.id, name: workspace.name });

          // Note: Owner will be explicitly assigned to this organization after user creation
        } catch (orgError: any) {
          // Save failed organization to database so it can be retried from UI
          const errorMsg = orgError?.message || String(orgError);
          log.error('Failed to create organization for workspace', {
            workspaceId: workspace.id,
            errorMessage: errorMsg,
            errorName: orgError?.name,
            errorCode: orgError?.code,
          });

          try {
            await adminDb.insert(organizations).values({
              realmId: config.realmId,
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              name: workspace.name,
              alias: workspace.alias,
              ownerAssigned: false,
              status: 'failed',
              lastError: errorMsg,
              errorMessage: errorMsg,
              retryCount: 0,
            }).onConflictDoNothing();
            log.info('Failed organization saved to admin database for retry', { workspaceId: workspace.id });
          } catch (dbSaveError: any) {
            log.warn('Failed to save failed organization to admin database', { workspaceId: workspace.id, error: dbSaveError?.message });
          }

          createdOrganizations.push({
            id: '',
            name: workspace.name,
            workspaceId: workspace.id,
            status: 'failed',
            error: errorMsg,
          });
          hasOrganizationFailures = true;
        }
      }

      // Create owner user AFTER organizations are created
      // The owner will be explicitly assigned to organizations below
      log.debug('Creating owner user', { email: config.owner.email });
      const ownerUserId = await adminClient.createUser(realmName, {
        username: ownerUsername,
        email: config.owner.email,
        firstName: config.owner.firstName,
        lastName: config.owner.lastName,
        enabled: true,
        emailVerified: false,
        credentials: [{
          type: 'password',
          value: config.owner.temporaryPassword,
          temporary: true,
        }],
        requiredActions: ['UPDATE_PASSWORD'],
      });
      log.info('Owner user created', { username: ownerUsername, userId: ownerUserId });

      // Assign owner role to the owner user
      log.debug('Assigning owner role to user', { username: ownerUsername });
      const ownerRole = roles.find(r => r.name === 'owner');
      if (ownerRole) {
        await adminClient.assignRealmRoles(realmName, ownerUsername, [ownerRole]);
        log.info('Owner role assigned', { username: ownerUsername, role: 'owner' });
      }

      // Assign owner to each successfully created organization
      for (const org of createdOrganizations) {
        if (org.status === 'created' && org.id) {
          try {
            await adminClient.inviteUserToOrganization(realmName, org.id, ownerUserId);
            log.info('Owner invited to organization', { username: ownerUsername, userId: ownerUserId, organizationId: org.id, organizationName: org.name });

            // Update database record to mark owner as assigned
            try {
              await adminDb
                .update(organizations)
                .set({ ownerAssigned: true, updatedAt: new Date() })
                .where(eq(organizations.keycloakOrganizationId, org.id));
            } catch (dbUpdateError: any) {
              log.warn('Failed to update organization ownerAssigned status', { organizationId: org.id, error: dbUpdateError?.message });
            }
          } catch (assignError: any) {
            log.error(assignError)
            log.warn('Failed to invite owner to organization', {
              username: ownerUsername,
              organizationId: org.id,
              organizationName: org.name,
              error: assignError?.message,
            });
            // Don't fail provisioning if organization assignment fails
          }
        }
      }

      const workspaceIds = config.workspaces.map(w => w.id || crypto.randomUUID());
      const orgStatus = hasOrganizationFailures ? 'partial' : 'completed';
      log.info('Realm provisioning completed', {
        realmId: config.realmId,
        realmName,
        workspaceIds,
        organizationsCount: createdOrganizations.length,
        organizationsStatus: orgStatus,
        hasOrganizationFailures,
      });

      return {
        id: config.realmId,
        name: realmName,
        displayName: config.displayName,
        status: 'created',
        roles: {
          status: 'created',
          roles: roles.map(r => r.name),
        },
        clients: {
          status: 'created',
          clients: ['globex-api', 'globex-web', 'example-app'],
        },
        owner: {
          status: 'created',
          username: ownerUsername,
          email: config.owner.email,
          firstName: config.owner.firstName,
          lastName: config.owner.lastName,
        },
        organizations: {
          created: createdOrganizations,
          status: orgStatus,
        },
        // Return workspace IDs for database creation reference
        workspaces: workspaceIds,
      };
    } catch (err: any) {
      log.error('Realm provisioning failed', {
        error: err?.message || err,
        code: err?.code,
        name: err?.name,
        stack: err?.stack,
      });
      throw err;
    }
  }

  /**
   * Internal: Create tenant database with tenant-specific user
   */
  private async doCreateDatabase(realm: string, workspaceId: string): Promise<{
    database: string;
    existed: boolean;
    dbUser?: string;
    dbPassword?: string;
  }> {
    const dbName = `globex_workspace_${realm}_${workspaceId}`;
    // Generate tenant-specific username: workspace + 6 random digits
    const dbUser = `workspace_${this.generateRandomDigits(6)}`;
    const sql = getMasterConnection();

    try {
      // Check if database already exists
      const existingCheck = await sql.unsafe(`
        SELECT 1 FROM pg_database WHERE datname = $1
      `, [dbName]);

      if (existingCheck.length > 0) {
        // Database exists, fetch existing credentials from admin DB
        const adminDb = await getAdminDb();
        const dbRecords = await adminDb
          .select({ dbUser: databases.dbUser, dbPassword: databases.dbPassword })
          .from(databases)
          .where(eq(databases.workspaceId, workspaceId))
          .limit(1);

        if (dbRecords.length > 0 && dbRecords[0].dbUser && dbRecords[0].dbPassword) {
          return { database: dbName, existed: true, dbUser: dbRecords[0].dbUser, dbPassword: dbRecords[0].dbPassword };
        }
        return { database: dbName, existed: true };
      }

      // Generate secure random password (32 characters)
      const dbPassword = this.generateSecurePassword();

      // Create database
      await sql.unsafe(`CREATE DATABASE "${dbName}" ENCODING 'UTF8'`);

      // Create tenant user
      await sql.unsafe(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);

      // Grant all privileges on the database to the tenant user
      // Note: We need to connect to the database to grant schema privileges
      const dbSql = postgres({
        host: process.env.POSTGRES_ADMIN_HOST || process.env.POSTGRES_HOST,
        port: Number(process.env.POSTGRES_ADMIN_PORT || process.env.POSTGRES_PORT) || 5432,
        database: 'postgres',
        user: process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER,
        password: process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD,
        max: 1,
      });

      try {
        // Grant CONNECT on the database
        await dbSql.unsafe(`GRANT CONNECT ON DATABASE "${dbName}" TO "${dbUser}"`);

        // Grant ALL on schema public (requires connecting to the database)
        await dbSql.unsafe(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);

        // Grant ALL on all existing and future tables in the database
        await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}"`);
        await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}"`);

        // Grant ALL on all existing tables and sequences
        await dbSql.unsafe(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${dbUser}"`);
        await dbSql.unsafe(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`);
      } finally {
        await dbSql.end();
      }

      return { database: dbName, existed: false, dbUser, dbPassword };
    } finally {
      await sql.end();
    }
  }

  /**
   * Generate a secure random password for tenant database users
   * Returns a 32-character alphanumeric string
   */
  private generateSecurePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => chars[byte % chars.length]).join('');
  }

  /**
   * Generate random digits for username
   * Returns a string of random digits with the specified length
   */
  private generateRandomDigits(length: number): string {
    const digits = '0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => digits[byte % digits.length]).join('');
  }

  /**
   * Internal: Run migrations on tenant database
   *
   * Note: This method connects directly to the database without using
   * getTenantDatabase() because there's no AsyncLocalStorage context
   * during admin operations.
   */
  private async doMigrateDatabase(realm: string, workspaceId: string): Promise<void> {
    const dbName = `globex_workspace_${realm}_${workspaceId}`;

    // Create a direct connection to the tenant database
    const host = process.env.POSTGRES_HOST || 'localhost';
    const port = Number(process.env.POSTGRES_PORT) || 5432;
    const user = process.env.POSTGRES_USER || 'postgres';
    const password = process.env.POSTGRES_PASSWORD || 'postgres';

    const sql = postgres({
      host,
      port,
      database: dbName,
      user,
      password,
      max: 1,
    });

    try {
      // Import the schema SQL string and execute it directly
      const { createTableSQLString } = await import('../../db/schema.js');

      // Execute the entire schema SQL as a single statement
      // PostgreSQL supports multiple statements in a single query
      await sql.unsafe(createTableSQLString);
    } finally {
      await sql.end();
    }
  }

  /**
   * Internal: List users in a realm
   */
  private async doListUsers(realm: string): Promise<any[]> {
    const { KeycloakAdminClient } = await import('@oxlayer/cli-keycloak-bootstrap');

    const keycloakConfig = {
      url: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
      admin: {
        username: process.env.KEYCLOAK_ADMIN || 'admin',
        password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
      },
    };

    const adminClient = new KeycloakAdminClient(keycloakConfig);
    await adminClient.authenticate();

    // Use prefixed realm name, but don't double-prefix if already prefixed
    const realmName = realm.startsWith('globex_') ? realm : `globex_${realm}`;

    const users = await adminClient.listUsers(realmName, 100);

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (user: any) => {
        const roles = await adminClient.getUserRoles(realmName, user.id);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          enabled: user.enabled,
          emailVerified: user.emailVerified,
          roles: roles.map((r: any) => r.name),
        };
      })
    );

    return usersWithRoles;
  }

  /**
   * Internal: List all realms from admin database
   * The admin database is the source of truth for the control panel
   */
  private async doListRealms(): Promise<any[]> {
    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-realms');

    const adminDb = await getAdminDb();

    try {
      // Query realms from admin database
      const allRealmRecords = await adminDb.select().from(realms).orderBy(realms.provisionedAt);

      // Get databases for each realm from admin database
      const allDatabases = await adminDb.select().from(databases);

      // Group databases by realmId
      const databasesByRealm: Record<string, any[]> = {};
      for (const db of allDatabases) {
        if (!databasesByRealm[db.realmId]) {
          databasesByRealm[db.realmId] = [];
        }
        databasesByRealm[db.realmId].push({
          database: db.databaseName,
          workspaceId: db.workspaceId,
          workspaceName: db.workspaceName,
          dbUser: db.dbUser, // Include dbUser (without password for security)
          enabled: db.enabled,
          status: db.status,
        });
      }

      // Combine realm and database information
      const realmsList = allRealmRecords.map((realm: any) => ({
        id: realm.realmName,
        displayName: realm.displayName,
        realmId: realm.realmId,
        enabled: realm.enabled,
        ownerId: realm.ownerId,
        ownerEmail: realm.ownerEmail,
        databases: databasesByRealm[realm.realmId] || [],
        provisionedAt: realm.provisionedAt,
        syncStatus: realm.syncStatus,
      }));

      return realmsList;
    } catch (err: any) {
      log.error('Failed to list realms from admin database', { error: err?.message || err });
      throw err;
    }
  }

  /**
   * Internal: Get all realms from Keycloak
   */
  private async doGetAllRealms(adminClient: any): Promise<any[]> {
    try {
      // Keycloak Admin API to get all realms
      const response = await fetch(
        `${process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080'}/admin/realms`,
        {
          headers: {
            Authorization: `Bearer ${adminClient.token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to list realms: ${response.status} ${error}`);
      }

      const realms = await response.json() as any[];
      return realms || [];
    } catch (err: any) {
      const { Logger } = await import('@oxlayer/capabilities-internal');
      const log = new Logger('admin-realms');
      log.error('Failed to get realms from Keycloak', { error: err?.message || err });
      throw err;
    }
  }

  /**
   * Delete entire tenant (cascade delete everything)
   * DELETE /api/admin/tenants/:realmId
   */
  async deleteTenant(c: Context): Promise<Response> {
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-delete-tenant');

    try {
      const realmId = c.req.param('realmId');

      log.info('Starting tenant deletion', { realmId });

      // Get all databases for this realm
      const adminDb = await getAdminDb();
      const realmDatabases = await adminDb.select().from(databases).where(eq(databases.realmId, realmId));

      // Drop each PostgreSQL database
      const sql = getMasterConnection();
      try {
        for (const db of realmDatabases) {
          log.debug('Dropping database', { database: db.databaseName });
          await sql.unsafe(`DROP DATABASE IF EXISTS "${db.databaseName}"`);
          log.info('Database dropped', { database: db.databaseName });
        }
      } finally {
        await sql.end();
      }

      // Delete Keycloak realm (also deletes organizations)
      const { KeycloakAdminClient } = await import('@oxlayer/cli-keycloak-bootstrap');
      const keycloakConfig = {
        url: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
        admin: {
          username: process.env.KEYCLOAK_ADMIN || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        },
      };
      const adminClient = new KeycloakAdminClient(keycloakConfig);
      await adminClient.authenticate();
      const realmName = `globex_${realmId}`;
      await adminClient.deleteRealm(realmName);
      log.info('Keycloak realm deleted', { realmName });

      // Delete from admin database (all tables)
      await adminDb.delete(organizations).where(eq(organizations.realmId, realmId));
      await adminDb.delete(databases).where(eq(databases.realmId, realmId));
      await adminDb.delete(realms).where(eq(realms.realmId, realmId));
      log.info('Admin database entries deleted', { realmId });

      log.info('Tenant deletion completed', { realmId });

      return c.json({
        success: true,
        message: `Tenant "${realmId}" and all resources deleted successfully`,
      });
    } catch (error: any) {
      log.error('Failed to delete tenant', { error: error?.message || error });
      return c.json({
        error: 'Failed to delete tenant',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Delete only the Keycloak realm
   * DELETE /api/admin/tenants/:realmId/realm
   */
  async deleteRealm(c: Context): Promise<Response> {
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-delete-realm');

    try {
      const realmId = c.req.param('realmId');

      log.info('Starting realm deletion', { realmId });

      // Delete Keycloak realm
      const { KeycloakAdminClient } = await import('@oxlayer/cli-keycloak-bootstrap');
      const keycloakConfig = {
        url: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
        admin: {
          username: process.env.KEYCLOAK_ADMIN || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        },
      };
      const adminClient = new KeycloakAdminClient(keycloakConfig);
      await adminClient.authenticate();
      const realmName = `globex_${realmId}`;
      await adminClient.deleteRealm(realmName);
      log.info('Keycloak realm deleted', { realmName });

      log.info('Realm deletion completed', { realmId });

      return c.json({
        success: true,
        message: `Realm "${realmId}" deleted successfully`,
      });
    } catch (error: any) {
      log.error('Failed to delete realm', { error: error?.message || error });
      return c.json({
        error: 'Failed to delete realm',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Delete database(s)
   * DELETE /api/admin/databases
   */
  async deleteDatabase(c: Context): Promise<Response> {
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-delete-database');

    try {
      const body = await c.req.json();
      const { realmId, workspaceId } = body;

      if (!realmId) {
        return c.json({ error: 'Bad request', details: 'realmId is required' }, 400);
      }

      log.info('Starting database deletion', { realmId, workspaceId });

      const adminDb = await getAdminDb();

      // Get databases to delete
      let databasesToDelete = await adminDb.select().from(databases).where(eq(databases.realmId, realmId));
      if (workspaceId) {
        databasesToDelete = databasesToDelete.filter((db: any) => db.workspaceId === workspaceId);
      }

      if (databasesToDelete.length === 0) {
        return c.json({
          success: true,
          deleted: [],
        });
      }

      // Drop PostgreSQL databases
      const sql = getMasterConnection();
      const deleted: Array<{ workspaceId: string; database: string }> = [];
      try {
        for (const db of databasesToDelete) {
          log.debug('Dropping database', { database: db.databaseName });
          await sql.unsafe(`DROP DATABASE IF EXISTS "${db.databaseName}"`);
          deleted.push({ workspaceId: db.workspaceId, database: db.databaseName });
          log.info('Database dropped', { database: db.databaseName });

          // Remove from admin database
          await adminDb.delete(databases).where(eq(databases.databaseName, db.databaseName));
        }
      } finally {
        await sql.end();
      }

      log.info('Database deletion completed', { realmId, workspaceId, count: deleted.length });

      return c.json({
        success: true,
        deleted,
      });
    } catch (error: any) {
      log.error('Failed to delete database', { error: error?.message || error });
      return c.json({
        error: 'Failed to delete database',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Recreate realm
   * POST /api/admin/tenants/:realmId/realm/recreate
   */
  async recreateRealm(c: Context): Promise<Response> {
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-recreate-realm');

    try {
      const realmId = c.req.param('realmId');

      log.info('Starting realm recreation', { realmId });

      // Get existing realm info from database
      const adminDb = await getAdminDb();
      const realmRecords = await adminDb.select().from(realms).where(eq(realms.realmId, realmId));

      if (realmRecords.length === 0) {
        return c.json({
          error: 'Not found',
          details: `Realm "${realmId}" not found in database`,
        }, 404);
      }

      const realmRecord = realmRecords[0];

      // Get organizations to recreate
      const orgRecords = await adminDb.select().from(organizations).where(eq(organizations.realmId, realmId));

      // Create new Keycloak realm with existing config
      const { KeycloakAdminClient } = await import('@oxlayer/cli-keycloak-bootstrap');
      const keycloakConfig = {
        url: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080',
        admin: {
          username: process.env.KEYCLOAK_ADMIN || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        },
      };
      const adminClient = new KeycloakAdminClient(keycloakConfig);
      await adminClient.authenticate();

      const realmName = `globex_${realmId}`;

      // Create realm
      await adminClient.createRealm({
        name: realmName,
        displayName: realmRecord.displayName,
        type: 'client',
        sslRequired: 'external',
        organizationsEnabled: true,
        security: {
          loginWithEmailAllowed: true,
          registrationEmailAsUsername: true,
          duplicateEmailsAllowed: false,
          resetPasswordAllowed: true,
          bruteForceProtected: true,
        },
      });
      log.info('Realm created', { realmName });

      // Enable organizations
      try {
        await adminClient.enableRealmOrganizations(realmName);
        log.info('Organizations enabled', { realmName });
      } catch (err: any) {
        log.warn('Failed to enable organizations', { error: err?.message });
      }

      // Create roles
      const roles = [
        { name: 'owner', description: `B2B client owner for ${realmRecord.displayName}` },
        { name: 'supervisor', description: `B2B operations supervisor for ${realmRecord.displayName}` },
        { name: 'manager', description: `Company manager for ${realmRecord.displayName}` },
        { name: 'candidate', description: `End user for ${realmRecord.displayName}` },
      ];
      for (const role of roles) {
        await adminClient.createRole(realmName, role);
      }
      log.info('Roles created', { roles: roles.map(r => r.name) });

      // Create clients
      const baseUrl = 'http://localhost';
      const clients = [
        {
          clientId: `globex_people`,
          name: `globex_people`,
          description: 'People operations web app',
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          directAccessGrantsEnabled: true,
          redirectUris: [`${baseUrl}:5176/*`],
          postLogoutRedirectUris: [`${baseUrl}:5176`],
          webOrigins: [`${baseUrl}:5176`],
          protocol: 'openid-connect' as const,
          attributes: {
            'pkce.code.challenge.method': 'S256',
          } as Record<string, string>,
        },
        {
          clientId: `globex_manager`,
          name: `globex_manager`,
          description: 'Manager web app',
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          directAccessGrantsEnabled: true,
          redirectUris: [`${baseUrl}:5177/*`],
          postLogoutRedirectUris: [`${baseUrl}:5177`],
          webOrigins: [`${baseUrl}:5177`],
          protocol: 'openid-connect' as const,
          attributes: {
            'pkce.code.challenge.method': 'S256',
          } as Record<string, string>,
        },
        {
          clientId: `globex_app`,
          name: `globex_app`,
          description: 'Candidate portal app',
          enabled: true,
          publicClient: true,
          standardFlowEnabled: true,
          directAccessGrantsEnabled: false,
          redirectUris: [`${baseUrl}:5178/*`],
          postLogoutRedirectUris: [`${baseUrl}:5178`],
          webOrigins: [`${baseUrl}:5178`],
          protocol: 'openid-connect' as const,
          attributes: {
            'pkce.code.challenge.method': 'S256',
          } as Record<string, string>,
        },
      ];
      for (const client of clients) {
        try {
          await adminClient.createClient(realmName, client);
        } catch (clientError: any) {
          log.warn('Client creation skipped', { clientId: client.clientId, error: clientError?.message });
        }
      }
      log.info('Clients created', { clients: clients.map(c => c.clientId) });

      // Recreate organizations
      for (const org of orgRecords) {
        try {
          const keycloakOrg = await adminClient.createOrganization(realmName, {
            name: org.name,
            domainAliases: [],
          });
          // Update database with new Keycloak org ID
          await adminDb.update(organizations)
            .set({ keycloakOrganizationId: keycloakOrg.id, status: 'created' })
            .where(eq(organizations.id, org.id));
          log.info('Organization recreated', { name: org.name });
        } catch (orgError: any) {
          log.warn('Organization recreation failed', { name: org.name, error: orgError?.message });
        }
      }

      log.info('Realm recreation completed', { realmId });

      return c.json({
        success: true,
        message: `Realm "${realmId}" recreated successfully`,
        realm: {
          id: realmId,
          name: realmName,
          displayName: realmRecord.displayName,
        },
      });
    } catch (error: any) {
      log.error('Failed to recreate realm', { error: error?.message || error });
      return c.json({
        error: 'Failed to recreate realm',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Recreate database
   * POST /api/admin/databases/recreate
   */
  async recreateDatabase(c: Context): Promise<Response> {
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-recreate-database');

    try {
      const body = await c.req.json();
      const { realmId, workspaceId } = body;

      if (!realmId || !workspaceId) {
        return c.json({
          error: 'Bad request',
          details: 'realmId and workspaceId are required',
        }, 400);
      }

      log.info('Starting database recreation', { realmId, workspaceId });

      const adminDb = await getAdminDb();

      // Try to get existing database record
      const dbRecords = await adminDb.select().from(databases).where(
        and(eq(databases.realmId, realmId), eq(databases.workspaceId, workspaceId))
      );

      // Construct database name from pattern (same as doCreateDatabase)
      const databaseName = `globex_workspace_${realmId}_${workspaceId}`;

      // If no admin record exists, try to get workspace name from organizations
      let workspaceName = workspaceId;
      let needsAdminRecord = false;

      if (dbRecords.length === 0) {
        needsAdminRecord = true;

        // Try to get workspace name from organizations table
        const orgRecords = await adminDb.select().from(organizations).where(
          and(eq(organizations.realmId, realmId), eq(organizations.workspaceId, workspaceId))
        );

        if (orgRecords.length > 0) {
          workspaceName = orgRecords[0].workspaceName;
          log.info('Workspace name found from organizations', { workspaceId, workspaceName });
        } else {
          log.warn('Workspace name not found, using workspaceId as name', { workspaceId });
        }
      } else {
        workspaceName = dbRecords[0].workspaceName;
      }

      // Drop existing database
      const sql = getMasterConnection();
      try {
        log.debug('Terminating existing connections', { database: databaseName });
        // Terminate all connections to the database before dropping
        await sql.unsafe(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = $1
          AND pid <> pg_backend_pid();
        `, [databaseName]);

        log.debug('Dropping existing database', { database: databaseName });
        await sql.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
        log.info('Existing database dropped', { database: databaseName });

        // Create new database
        log.debug('Creating new database', { database: databaseName });
        await sql.unsafe(`CREATE DATABASE "${databaseName}" ENCODING 'UTF8'`);
        log.info('New database created', { database: databaseName });

        // Generate tenant-specific username: workspace + 6 random digits
        const dbUser = `workspace_${this.generateRandomDigits(6)}`;
        const dbPassword = this.generateSecurePassword();

        // Drop existing user if it exists
        await sql.unsafe(`DROP USER IF EXISTS "${dbUser}"`);
        log.debug('Dropped existing user if present', { dbUser });

        // Create fresh tenant user with new password
        await sql.unsafe(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
        log.info('Tenant user created with fresh credentials', { dbUser });

        // Grant all privileges on the database to the tenant user
        const dbSql = postgres({
          host: process.env.POSTGRES_ADMIN_HOST || process.env.POSTGRES_HOST,
          port: Number(process.env.POSTGRES_ADMIN_PORT || process.env.POSTGRES_PORT) || 5432,
          database: 'postgres',
          user: process.env.POSTGRES_ADMIN_USER || process.env.POSTGRES_USER,
          password: process.env.POSTGRES_ADMIN_PASSWORD || process.env.POSTGRES_PASSWORD,
          max: 1,
        });

        try {
          // Grant CONNECT on the database
          await dbSql.unsafe(`GRANT CONNECT ON DATABASE "${databaseName}" TO "${dbUser}"`);

          // Grant ALL on schema public (requires connecting to the database)
          await dbSql.unsafe(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);

          // Grant ALL on all existing and future tables in the database
          await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}"`);
          await dbSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}"`);

          // Grant ALL on all existing tables and sequences
          await dbSql.unsafe(`GRANT ALL ON ALL TABLES IN SCHEMA public TO "${dbUser}"`);
          await dbSql.unsafe(`GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`);

          log.info('Privileges granted to tenant user', { dbUser, database: databaseName });
        } finally {
          await dbSql.end();
        }

        // Store the credentials for updating admin database
        (c as any)._tenantCredentials = { dbUser, dbPassword };
      } catch (dbError: any) {
        log.error('Database operation failed', {
          error: dbError?.message || String(dbError),
          code: dbError?.code,
          name: dbError?.name,
          detail: dbError?.detail,
          database: databaseName,
        });
        throw dbError;
      } finally {
        await sql.end();
      }

      // Run migrations
      await this.doMigrateDatabase(realmId, workspaceId);
      log.info('Migrations completed', { database: databaseName });

      // Get credentials stored in context
      const credentials = (c as any)._tenantCredentials;

      // Create or update database record in admin database with credentials
      if (needsAdminRecord) {
        // Create new record (was deleted)
        await adminDb.insert(databases).values({
          databaseName: databaseName,
          realmId: realmId,
          workspaceId: workspaceId,
          workspaceName: workspaceName,
          domainAliases: [],
          dbUser: credentials?.dbUser,
          dbPassword: credentials?.dbPassword,
          enabled: true,
          status: 'active',
        });
        log.info('Database record created in admin database', { database: databaseName });
      } else {
        // Update existing record with fresh credentials
        await adminDb.update(databases)
          .set({
            enabled: true,
            status: 'active',
            dbUser: credentials?.dbUser,
            dbPassword: credentials?.dbPassword,
          })
          .where(eq(databases.databaseName, databaseName));
        log.info('Database record updated with fresh credentials', { database: databaseName });
      }

      log.info('Database recreation completed', { realmId, workspaceId, database: databaseName });

      return c.json({
        success: true,
        message: `Database recreated successfully`,
        database: databaseName,
        status: 'active',
      });
    } catch (error: any) {
      log.error('Failed to recreate database', { error: error?.message || error });
      return c.json({
        error: 'Failed to recreate database',
        details: error.message || String(error),
      }, 500);
    }
  }

  /**
   * Rotate tenant database credentials
   * POST /api/admin/databases/rotate-credentials
   *
   * Updates the database user password for a tenant.
   * Allows UI to change the password or auto-generate a new one.
   */
  async rotateCredentials(c: Context): Promise<Response> {
    const auth = checkAdminAuth(c);
    if (!auth.authorized) {
      return c.json({ error: 'Unauthorized', details: auth.error }, 403);
    }

    const { Logger } = await import('@oxlayer/capabilities-internal');
    const log = new Logger('admin-rotate-credentials');

    try {
      const body = await c.req.json();
      const { workspaceId, newPassword } = body;

      if (!workspaceId) {
        return c.json({
          error: 'Bad request',
          details: 'workspaceId is required',
        }, 400);
      }

      log.info('Starting credential rotation', { workspaceId });

      const adminDb = await getAdminDb();

      // Get the database record
      const dbRecords = await adminDb.select().from(databases).where(eq(databases.workspaceId, workspaceId));

      if (dbRecords.length === 0) {
        return c.json({
          error: 'Not found',
          details: `Database record not found for workspace "${workspaceId}"`,
        }, 404);
      }

      const dbRecord = dbRecords[0];

      if (!dbRecord.dbUser) {
        return c.json({
          error: 'Bad request',
          details: 'Database has no tenant user configured',
        }, 400);
      }

      const dbUser = dbRecord.dbUser;
      const dbName = dbRecord.databaseName;
      const dbPassword = newPassword || this.generateSecurePassword();

      log.info('Rotating credentials for user', { dbUser, database: dbName });

      // Update the PostgreSQL user password
      const sql = getMasterConnection();
      try {
        await sql.unsafe(`ALTER USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
        log.info('PostgreSQL user password updated', { dbUser });
      } finally {
        await sql.end();
      }

      // Update the admin database record
      await adminDb.update(databases)
        .set({ dbPassword })
        .where(eq(databases.workspaceId, workspaceId));

      log.info('Admin database record updated', { workspaceId });

      // Clear the credentials cache for this workspace
      const { clearCredentialsCache } = await import('../../config/database-resolver.config.js');
      clearCredentialsCache(workspaceId);
      log.info('Credentials cache cleared', { workspaceId });

      log.info('Credential rotation completed', { workspaceId, dbUser });

      return c.json({
        success: true,
        message: `Credentials rotated successfully for workspace "${workspaceId}"`,
        workspaceId,
        dbUser,
        passwordGenerated: !newPassword, // true if auto-generated, false if provided by user
      });
    } catch (error: any) {
      log.error('Failed to rotate credentials', { error: error?.message || error });
      return c.json({
        error: 'Failed to rotate credentials',
        details: error.message || String(error),
      }, 500);
    }
  }
}

/**
 * Create admin controller instance
 */
export function createAdminController(): AdminController {
  return new AdminController();
}
