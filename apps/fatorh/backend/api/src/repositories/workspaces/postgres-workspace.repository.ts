/**
 * Postgres Workspace Repository
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, isNull, desc, count } from 'drizzle-orm';
import * as schema from '../../db/schema.js';
import type {
  IWorkspaceRepository,
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  ListWorkspaceFilters,
} from './workspace.repository.interface.js';

export class PostgresWorkspaceRepository implements IWorkspaceRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const [workspace] = await this.db
      .insert(schema.workspaces)
      .values({
        id: input.id,
        name: input.name,
        description: input.description,
        organizationId: input.organizationId,
        // Provisioning fields
        realmId: input.realmId,
        domainAliases: input.domainAliases,
        rootManagerEmail: input.rootManagerEmail,
      })
      .returning();

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      organizationId: workspace.organizationId,
      realmId: workspace.realmId,
      databaseName: workspace.databaseName,
      domainAliases: workspace.domainAliases,
      rootManagerEmail: workspace.rootManagerEmail,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      deletedAt: workspace.deletedAt,
    };
  }

  async findById(id: string): Promise<Workspace | null> {
    const [workspace] = await this.db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, id));

    if (!workspace) {
      return null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      organizationId: workspace.organizationId,
      realmId: workspace.realmId,
      databaseName: workspace.databaseName,
      domainAliases: workspace.domainAliases,
      rootManagerEmail: workspace.rootManagerEmail,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      deletedAt: workspace.deletedAt,
    };
  }

  async list(filters: ListWorkspaceFilters): Promise<{ workspaces: Workspace[]; total: number }> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    // Build where conditions
    const conditions: any[] = [isNull(schema.workspaces.deletedAt)];

    if (filters.organizationId) {
      conditions.push(eq(schema.workspaces.organizationId, filters.organizationId));
    }

    // Get total count
    const [{ value: total }] = await this.db
      .select({ value: count() })
      .from(schema.workspaces)
      .where(conditions[0]);

    // Get workspaces
    const workspaces = await this.db
      .select()
      .from(schema.workspaces)
      .where(conditions.length === 1 ? conditions[0] : conditions)
      .orderBy(desc(schema.workspaces.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      workspaces: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        organizationId: w.organizationId,
        realmId: w.realmId,
        databaseName: w.databaseName,
        domainAliases: w.domainAliases,
        rootManagerEmail: w.rootManagerEmail,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        deletedAt: w.deletedAt,
      })),
      total: Number(total),
    };
  }

  async update(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const updates: any = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;

    const [workspace] = await this.db
      .update(schema.workspaces)
      .set(updates)
      .where(eq(schema.workspaces.id, id))
      .returning();

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      organizationId: workspace.organizationId,
      realmId: workspace.realmId,
      databaseName: workspace.databaseName,
      domainAliases: workspace.domainAliases,
      rootManagerEmail: workspace.rootManagerEmail,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      deletedAt: workspace.deletedAt,
    };
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(schema.workspaces)
      .set({ deletedAt: new Date() })
      .where(eq(schema.workspaces.id, id));
  }
}
