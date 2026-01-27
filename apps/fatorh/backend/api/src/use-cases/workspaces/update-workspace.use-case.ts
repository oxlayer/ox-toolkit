/**
 * Update Workspace Use Case
 *
 * Business logic for updating a workspace.
 */

import type { IWorkspaceRepository } from '../../repositories/workspaces/workspace.repository.interface.js';

export interface UpdateWorkspaceInput {
  id: string;
  name?: string;
  description?: string;
}

export interface UpdateWorkspaceOutput {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update Workspace Use Case
 */
export class UpdateWorkspaceUseCase {
  constructor(
    private workspaceRepository: IWorkspaceRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateWorkspaceInput): Promise<UpdateWorkspaceOutput> {
    // Validate input
    this.validate(input);

    // Check if workspace exists
    const existing = await this.workspaceRepository.findById(input.id);
    if (!existing) {
      throw new Error('Workspace not found');
    }

    // Update workspace
    const updates: Partial<{
      name: string;
      description: string | null;
    }> = {};

    if (input.name !== undefined) {
      updates.name = input.name;
    }
    if (input.description !== undefined) {
      updates.description = input.description;
    }

    const updated = await this.workspaceRepository.update(input.id, updates);

    // TODO: Publish domain event using proper DomainEvent class

    return updated;
  }

  /**
   * Validate input
   */
  private validate(input: UpdateWorkspaceInput): void {
    if (!input.id) {
      throw new Error('Workspace ID is required');
    }

    if (input.name !== undefined && input.name.length > 255) {
      throw new Error('Workspace name must be less than 255 characters');
    }
  }
}
