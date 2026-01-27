/**
 * Delete Workspace Use Case
 *
 * Business logic for deleting (soft delete) a workspace.
 */

import type { IWorkspaceRepository } from '../../repositories/workspaces/workspace.repository.interface.js';

export interface DeleteWorkspaceInput {
  id: string;
}

/**
 * Delete Workspace Use Case
 */
export class DeleteWorkspaceUseCase {
  constructor(
    private workspaceRepository: IWorkspaceRepository
  ) {}

  /**
   * Execute the use case (soft delete)
   */
  async execute(input: DeleteWorkspaceInput): Promise<void> {
    if (!input.id) {
      throw new Error('Workspace ID is required');
    }

    // Check if workspace exists
    const existing = await this.workspaceRepository.findById(input.id);
    if (!existing) {
      throw new Error('Workspace not found');
    }

    // Soft delete
    await this.workspaceRepository.softDelete(input.id);

    // TODO: Publish domain event using proper DomainEvent class
  }
}
