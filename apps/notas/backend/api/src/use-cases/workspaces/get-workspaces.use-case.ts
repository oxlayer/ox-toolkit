/**
 * Get Workspaces Use Case
 *
 * This use case extends ListUseCaseTemplate from @oxlayer/snippets
 * which provides the standard list pattern with tracing.
 *
 * @see @oxlayer/snippets/use-cases
 */

import type { WorkspaceRepository } from '../../repositories/index.js';
import type { WorkspaceFilters } from '../../domain/workspace.js';
import type { Workspace } from '../../domain/workspace.js';
import { ListUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface GetWorkspacesInput {
  ownerId?: string;
  filters?: WorkspaceFilters;
}

export interface WorkspaceOutput extends Record<string, unknown> {
  id: string;
  name: string;
  type: 'personal' | 'crm' | 'recruiting';
  ownerId: string;
  flags: {
    features: {
      contacts: boolean;
      companies: boolean;
      deals: boolean;
      candidates: boolean;
      positions: boolean;
      pipeline: boolean;
    };
  };
  settings: Record<string, unknown>;
  icon?: string;
  color?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Workspaces Use Case
 *
 * Extends ListUseCaseTemplate which provides:
 * - Finding entities with filters
 * - Counting entities
 * - Mapping to output
 * - Tracing spans
 */
export class GetWorkspacesUseCase extends ListUseCaseTemplate<
  GetWorkspacesInput,
  Workspace,
  AppResult<{ items: WorkspaceOutput[]; total: number }>
> {
  // Store repository for backward compatibility methods
  private repository: WorkspaceRepository;

  constructor(
    workspaceRepository: WorkspaceRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (input) => {
        // If ownerId is provided, add it to filters
        const filters = input.ownerId
          ? { ...input.filters, ownerId: input.ownerId }
          : input.filters;

        return workspaceRepository.findAll(filters);
      },
      countEntities: async (input) => {
        // If ownerId is provided, add it to filters
        const filters = input.ownerId
          ? { ...input.filters, ownerId: input.ownerId }
          : input.filters;

        return workspaceRepository.count(filters);
      },
      toOutput: (entity) => {
        const response = entity.toResponse();
        return {
          id: response.id,
          name: response.name,
          type: response.type,
          ownerId: response.ownerId,
          flags: response.flags,
          settings: response.settings,
          icon: response.icon,
          color: response.color,
          orderIndex: response.orderIndex,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt,
        };
      },
      tracer,
    });
    this.repository = workspaceRepository;
  }

  protected getUseCaseName(): string {
    return 'GetWorkspaces';
  }

  /**
   * Convert entity to output format
   * Helper for backward compatibility methods
   */
  private entityToOutput(entity: Workspace): WorkspaceOutput {
    const response = entity.toResponse();
    return {
      id: response.id,
      name: response.name,
      type: response.type,
      ownerId: response.ownerId,
      flags: response.flags,
      settings: response.settings,
      icon: response.icon,
      color: response.color,
      orderIndex: response.orderIndex,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  }

  /**
   * Get default workspace for a user
   * This is a convenience method that gets or creates a default workspace
   */
  async getDefaultWorkspace(ownerId: string): Promise<WorkspaceOutput> {
    const workspace = await this.repository.getDefaultWorkspace(ownerId);
    return this.entityToOutput(workspace);
  }

  /**
   * Execute method for backward compatibility
   * Returns workspaces directly (not in template format)
   */
  async execute(ownerId: string): Promise<{ success: boolean; data: WorkspaceOutput[]; error?: any }> {
    try {
      const workspaces = await this.repository.findByOwner(ownerId);
      return {
        success: true,
        data: workspaces.map(w => this.entityToOutput(w)),
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: { message: error.message },
      };
    }
  }

  /**
   * ExecuteGetDefault for backward compatibility
   */
  async executeGetDefault(ownerId: string): Promise<{ success: boolean; data: WorkspaceOutput; error?: any }> {
    try {
      const workspace = await this.repository.getDefaultWorkspace(ownerId);
      return {
        success: true,
        data: this.entityToOutput(workspace),
      };
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.message },
      };
    }
  }
}
