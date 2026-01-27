/**
 * List Workspaces Use Case
 *
 * Business logic for listing workspaces with optional filters.
 */

import type { IWorkspaceRepository } from '../../repositories/workspaces/workspace.repository.interface.js';

export interface ListWorkspacesInput {
  organizationId?: string;
  limit?: number;
  offset?: number;
}

/**
 * List Workspaces Use Case
 */
export class ListWorkspacesUseCase {
  constructor(
    private workspaceRepository: IWorkspaceRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: ListWorkspacesInput = {}) {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    return this.workspaceRepository.list({
      organizationId: input.organizationId,
      limit,
      offset,
    });
  }
}
