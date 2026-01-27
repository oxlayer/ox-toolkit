/**
 * PostgreSQL Workspace Repository Implementation
 *
 * Handles workspace persistence with proper CRUD operations.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import type { WorkspaceRepository } from './workspace.repository.js';
import type { Workspace, WorkspaceFilters, WorkspaceProps } from '../domain/workspace.js';
import { Workspace as WorkspaceTable } from '../db/schema.js';
import { Workspace as WorkspaceEntity } from '../domain/workspace.js';
import { PostgresRepositoryTemplate } from '@oxlayer/snippets/repositories';

/**
 * PostgreSQL Workspace Repository
 */
export class PostgresWorkspaceRepository
  extends PostgresRepositoryTemplate<Workspace, WorkspaceFilters, WorkspaceProps>
  implements WorkspaceRepository
{
  constructor(
    db: any,
    tracer?: unknown | null
  ) {
    super(db, tracer, { tableName: 'workspaces', dbSystem: 'postgresql', dbName: 'todo_app' });
  }

  protected override get tableSchema() {
    return WorkspaceTable;
  }

  protected override mapRowToEntity(row: WorkspaceProps): Workspace {
    return WorkspaceEntity.fromPersistence(row);
  }

  protected override mapEntityToProps(entity: Workspace): WorkspaceProps {
    return entity.toPersistence();
  }

  /**
   * Build query for finding all workspaces with filters
   */
  protected override buildFindAllQuery(filters: WorkspaceFilters): any {
    const query = this.db
      .select()
      .from(WorkspaceTable)
      .orderBy(WorkspaceTable.orderIndex);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Build query for counting workspaces with filters
   */
  protected override buildCountQuery(filters: WorkspaceFilters): any {
    const query = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(WorkspaceTable);

    return this.applyFilters(query, filters || {});
  }

  /**
   * Apply filters to a query
   */
  protected override applyFilters(query: any, _filters: WorkspaceFilters): any {
    let conditions: any[] = [];

    if (_filters?.ownerId) {
      conditions.push(eq(WorkspaceTable.ownerId, _filters.ownerId));
    }

    if (_filters?.type) {
      conditions.push(eq(WorkspaceTable.type, _filters.type));
    }

    return conditions.length > 0
      ? query.where(and(...conditions))
      : query;
  }

  /**
   * Additional method: Find workspaces by owner
   */
  async findByOwner(ownerId: string): Promise<Workspace[]> {
    return this.findAll({ ownerId });
  }

  /**
   * Override findById to use explicit eq() for proper Drizzle compatibility
   */
  override async findById(id: string): Promise<Workspace | null> {
    const [row] = await this.db
      .select()
      .from(WorkspaceTable)
      .where(eq(WorkspaceTable.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    return this.mapRowToEntity(row);
  }

  /**
   * Check if user has any workspaces
   */
  async hasAny(ownerId: string): Promise<boolean> {
    const [result] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(WorkspaceTable)
      .where(eq(WorkspaceTable.ownerId, ownerId))
      .limit(1);

    return (result?.count ?? 0) > 0;
  }

  /**
   * Get user's default workspace (first one)
   * Creates a personal workspace if none exists
   */
  async getDefaultWorkspace(ownerId: string): Promise<Workspace> {
    // Try to get first workspace
    const workspaces = await this.findByOwner(ownerId);
    if (workspaces.length > 0) {
      return workspaces[0];
    }

    // Create default personal workspace if none exists
    const defaultWorkspace = WorkspaceEntity.create({
      name: 'Personal',
      type: 'personal',
      ownerId,
      icon: 'home',
      color: '#6366f1',
      orderIndex: 0,
    });

    await this.create(defaultWorkspace);

    // Return the created workspace by fetching it back
    const created = await this.findByOwner(ownerId);
    return created[0];
  }

  /**
   * Set workspace as default by moving it to orderIndex 0
   * and shifting others down
   */
  async setAsDefault(workspaceId: string, ownerId: string): Promise<void> {
    // Get all workspaces for this user
    const workspaces = await this.findByOwner(ownerId);
    const targetWorkspace = workspaces.find(w => w.id === workspaceId);

    if (!targetWorkspace) {
      return;
    }

    const targetIndex = targetWorkspace.orderIndex;

    // Decrement orderIndex for workspaces that were before this one
    for (const ws of workspaces) {
      if (ws.orderIndex < targetIndex) {
        ws.updateOrder(ws.orderIndex + 1);
        await this.update(ws);
      }
    }

    // Set target workspace to orderIndex 0
    targetWorkspace.updateOrder(0);
    await this.update(targetWorkspace);
  }

  /**
   * Update workspace order indices
   */
  async reorder(ownerId: string, workspaceIds: string[]): Promise<void> {
    // Update each workspace with its new order
    for (let i = 0; i < workspaceIds.length; i++) {
      const workspace = await this.findById(workspaceIds[i]);
      if (workspace && workspace.ownerId === ownerId) {
        workspace.updateOrder(i);
        await this.update(workspace);
      }
    }
  }
}
