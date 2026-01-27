/**
 * Get Workspace Use Case
 *
 * Business logic for retrieving a workspace by ID.
 */

import type { IWorkspaceRepository } from '../../repositories/workspaces/workspace.repository.interface.js';

export interface GetWorkspaceInput {
  id: string;
}

export interface GetWorkspaceOutput {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Workspace Use Case
 */
export class GetWorkspaceUseCase {
  constructor(
    private workspaceRepository: IWorkspaceRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: GetWorkspaceInput): Promise<GetWorkspaceOutput | null> {
    if (!input.id) {
      throw new Error('Workspace ID is required');
    }

    const workspace = await this.workspaceRepository.findById(input.id);

    if (!workspace) {
      return null;
    }

    return workspace;
  }
}
