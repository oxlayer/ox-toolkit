/**
 * Mock Workspace Repository
 *
 * In-memory repository for testing without database.
 */

import { InMemoryRepository } from '@oxlayer/foundation-testing-kit';
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput, ListWorkspaceFilters } from '../../repositories/workspaces/workspace.repository.interface.js';

export class MockWorkspaceRepository extends InMemoryRepository<Workspace, string> implements Pick<import('../../repositories/workspaces/workspace.repository.interface.js').IWorkspaceRepository, keyof import('../../repositories/workspaces/workspace.repository.interface.js').IWorkspaceRepository> {
  protected getId(entity: Workspace): string {
    return entity.id;
  }

  /**
   * Create a new workspace
   */
  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const workspace: Workspace = {
      id: input.id,
      name: input.name,
      description: input.description,
      organizationId: input.organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    await this.save(workspace);
    return workspace;
  }

  /**
   * Find workspace by ID (excluding soft-deleted)
   */
  async findById(id: string): Promise<Workspace | null> {
    const entity = await super.findById(id);
    // Filter out soft-deleted workspaces
    if (entity && entity.deletedAt !== null) {
      return null;
    }
    return entity;
  }

  /**
   * List workspaces with filters
   */
  async list(filters: ListWorkspaceFilters): Promise<{ workspaces: Workspace[]; total: number }> {
    let workspaces = this.getAll().filter((w) => w.deletedAt === null);

    if (filters.organizationId) {
      workspaces = workspaces.filter((w) => w.organizationId === filters.organizationId);
    }

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;

    const total = workspaces.length;
    const paginatedWorkspaces = workspaces.slice(offset, offset + limit);

    return {
      workspaces: paginatedWorkspaces,
      total,
    };
  }

  /**
   * Update workspace
   */
  async update(id: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Workspace not found');
    }

    const updated: Workspace = {
      ...existing,
      name: input.name ?? existing.name,
      description: input.description ?? existing.description,
      updatedAt: new Date(),
    };

    await this.save(updated);
    return updated;
  }

  /**
   * Soft delete workspace
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Workspace not found');
    }

    const deleted: Workspace = {
      ...existing,
      deletedAt: new Date(),
      updatedAt: new Date(),
    };

    await this.save(deleted);
  }

  /**
   * Find all workspaces for an organization
   */
  async findByOrganization(organizationId: string): Promise<Workspace[]> {
    return this.findMany((w) => w.organizationId === organizationId && w.deletedAt === null);
  }
}
