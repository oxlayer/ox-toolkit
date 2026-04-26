/**
 * Bootstrap engine - orchestrates the Keycloak bootstrap process
 */

import type { KeycloakBootstrapConfig } from './types/config.js';
import type { ApplyOptions, BootstrapResult, DryRunResult } from './types/keycloak.js';
import { KeycloakAdminClient } from './keycloak/admin.js';
import { KeycloakOrganizationClient } from './keycloak/organizations.js';
import type { KeycloakConnectionConfig } from './types/config.js';
import { resolveClientConfig } from './templates/clients.js';

/**
 * Bootstrap engine
 */
export class BootstrapEngine {
  private organizationClient: KeycloakOrganizationClient;

  constructor(
    private keycloak: KeycloakAdminClient,
    private config: KeycloakBootstrapConfig
  ) {
    // Initialize organization client with same connection config
    const kcConfig: KeycloakConnectionConfig = {
      url: config.keycloak.url,
      admin: config.keycloak.admin,
    };
    this.organizationClient = new KeycloakOrganizationClient(kcConfig);
  }

  /**
   * Apply the bootstrap configuration
   */
  async apply(options: ApplyOptions): Promise<BootstrapResult> {
    const result: BootstrapResult = {
      success: true,
      created: [],
      updated: [],
      skipped: [],
      errors: [],
    };

    try {
      // Authenticate
      await this.keycloak.authenticate();
      await this.organizationClient.authenticate();

      // Apply realm
      await this.applyRealm(options, result);

      // Apply organizations (client realms only)
      if (this.config.realm.organizations && this.config.realm.organizations.length > 0) {
        await this.applyOrganizations(options, result);
      }

      // Apply workspaces (client realms only)
      if (this.config.realm.workspaces && this.config.realm.workspaces.length > 0) {
        await this.applyWorkspaces(options, result);
      }

      // Apply clients
      await this.applyClients(options, result);

      // Apply roles
      await this.applyRoles(options, result);

      // Apply protocol mappers
      await this.applyProtocolMappers(options, result);

      return result;
    } catch (error) {
      result.success = false;
      result.errors = error instanceof Error ? [error] : [new Error(String(error))];
      return result;
    }
  }

  /**
   * Dry run - show what would be done
   */
  async dryRun(): Promise<DryRunResult> {
    const result: DryRunResult = {
      wouldCreate: [],
      wouldUpdate: [],
      wouldSkip: [],
    };

    // Check realm
    const realmExists = await this.keycloak.realmExists?.(this.config.realm.name) ?? false;
    if (!realmExists) {
      result.wouldCreate.push({
        type: 'realm',
        name: this.config.realm.name,
        data: this.config.realm,
      });
    } else {
      result.wouldSkip.push({
        type: 'realm',
        name: this.config.realm.name,
      });
    }

    // Check clients
    for (const client of this.config.clients) {
      const resolved = resolveClientConfig(client);
      const exists = await this.keycloak.clientExists?.(this.config.realm.name, resolved.clientId) ?? false;
      if (!exists) {
        result.wouldCreate.push({
          type: 'client',
          name: resolved.clientId,
          data: resolved,
        });
      } else {
        result.wouldSkip.push({
          type: 'client',
          name: resolved.clientId,
        });
      }
    }

    // Check roles
    for (const role of this.config.roles || []) {
      const exists = await this.keycloak.roleExists?.(this.config.realm.name, role.name) ?? false;
      if (!exists) {
        result.wouldCreate.push({
          type: 'role',
          name: role.name,
          data: role,
        });
      } else {
        result.wouldSkip.push({
          type: 'role',
          name: role.name,
        });
      }
    }

    return result;
  }

  /**
   * Apply realm
   */
  private async applyRealm(options: ApplyOptions, result: BootstrapResult): Promise<void> {
    const exists = await this.keycloak.realmExists(this.config.realm.name);

    if (exists && options.idempotent) {
      console.log(`✓ Realm "${this.config.realm.name}" already exists, skipping`);
      result.skipped?.push('realm');
      return;
    }

    if (options.dryRun) {
      console.log(`[DRY RUN] Would create realm "${this.config.realm.name}"`);
      result.created?.push('realm (dry-run)');
      return;
    }

    await this.keycloak.createRealm(this.config.realm);
    result.created?.push('realm');
  }

  /**
   * Apply clients
   */
  private async applyClients(options: ApplyOptions, result: BootstrapResult): Promise<void> {
    for (const client of this.config.clients) {
      const resolved = resolveClientConfig(client);
      const exists = await this.keycloak.clientExists(this.config.realm.name, resolved.clientId);

      if (exists && options.idempotent) {
        console.log(`✓ Client "${resolved.clientId}" already exists, skipping`);
        result.skipped?.push(`client:${resolved.clientId}`);
        continue;
      }

      if (options.dryRun) {
        console.log(`[DRY RUN] Would create client "${resolved.clientId}"`);
        result.created?.push(`client:${resolved.clientId} (dry-run)`);
        continue;
      }

      await this.keycloak.createClient(this.config.realm.name, resolved);
      result.created?.push(`client:${resolved.clientId}`);
    }
  }

  /**
   * Apply roles
   */
  private async applyRoles(options: ApplyOptions, result: BootstrapResult): Promise<void> {
    for (const role of this.config.roles || []) {
      const exists = await this.keycloak.roleExists(this.config.realm.name, role.name);

      if (exists && options.idempotent) {
        console.log(`✓ Role "${role.name}" already exists, skipping`);
        result.skipped?.push(`role:${role.name}`);
        continue;
      }

      if (options.dryRun) {
        console.log(`[DRY RUN] Would create role "${role.name}"`);
        result.created?.push(`role:${role.name} (dry-run)`);
        continue;
      }

      await this.keycloak.createRole(this.config.realm.name, role);
      result.created?.push(`role:${role.name}`);
    }
  }

  /**
   * Apply protocol mappers
   */
  private async applyProtocolMappers(options: ApplyOptions, result: BootstrapResult): Promise<void> {
    for (const mapper of this.config.protocolMappers || []) {
      const targetClients = mapper.clients || this.config.clients.map((c) => c.name);

      for (const clientId of targetClients) {
        if (options.dryRun) {
          console.log(`[DRY RUN] Would create protocol mapper "${mapper.name}" for "${clientId}"`);
          continue;
        }

        await this.keycloak.createProtocolMapper(this.config.realm.name, clientId, mapper);
        result.created?.push(`mapper:${mapper.name}@${clientId}`);
      }
    }
  }

  /**
   * Apply organizations
   */
  private async applyOrganizations(options: ApplyOptions, result: BootstrapResult): Promise<void> {
    for (const org of this.config.realm.organizations || []) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would create organization "${org.id}"`);
        continue;
      }

      await this.organizationClient.createOrganization(this.config.realm.name, org);
      result.created?.push(`organization:${org.id}`);
    }
  }

  /**
   * Apply workspaces
   */
  private async applyWorkspaces(options: ApplyOptions, result: BootstrapResult): Promise<void> {
    for (const workspace of this.config.realm.workspaces || []) {
      if (options.dryRun) {
        console.log(`[DRY RUN] Would create workspace "${workspace.id}" in organization "${workspace.organizationId}"`);
        continue;
      }

      await this.organizationClient.createWorkspace(this.config.realm.name, workspace);
      result.created?.push(`workspace:${workspace.id}`);
    }
  }
}
