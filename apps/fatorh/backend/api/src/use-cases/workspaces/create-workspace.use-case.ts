/**
 * Create Workspace Use Case
 *
 * Business logic for creating a new workspace.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { IWorkspaceRepository } from '../../repositories/workspaces/workspace.repository.interface.js';

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  organizationId?: string; // Optional - workspaces can be created at realm level
  // Provisioning fields (optional)
  realmId?: string;
  domainAliases?: string[];
  rootManagerEmail?: string;
}

export interface CreateWorkspaceOutput {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  realmId?: string;
  databaseName?: string;
  domainAliases?: string[];
  rootManagerEmail?: string;
}

/**
 * Create Workspace Use Case
 */
export class CreateWorkspaceUseCase {
  constructor(
    private workspaceRepository: IWorkspaceRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateWorkspaceInput): Promise<CreateWorkspaceOutput> {
    // Validate input
    this.validate(input);

    // Create workspace
    const id = generateId();
    const workspace = await this.workspaceRepository.create({
      id,
      name: input.name,
      description: input.description ?? null,
      organizationId: input.organizationId,
      // Store provisioning fields if provided
      realmId: input.realmId,
      domainAliases: input.domainAliases,
      rootManagerEmail: input.rootManagerEmail,
    });

    // TODO: If realmId is provided, trigger database provisioning
    // This could be done via a domain event or direct API call
    // For now, the frontend should call the admin API directly for provisioning

    // TODO: Publish domain event using proper DomainEvent class
    // await this.eventBus.emit(new WorkspaceCreatedEvent(...));

    return workspace;
  }

  /**
   * Validate input
   */
  private validate(input: CreateWorkspaceInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Workspace name is required');
    }

    if (input.name.length > 255) {
      throw new Error('Workspace name must be less than 255 characters');
    }

    // Workspace name should be lowercase with no special characters (except hyphens and spaces)
    const nameRegex = /^[a-z0-9][a-z0-9\s-]*[a-z0-9]$/;
    if (!nameRegex.test(input.name.trim())) {
      throw new Error('Workspace name must be lowercase with no special characters (hyphens and spaces allowed)');
    }

    // Validate root manager email if provided
    if (input.rootManagerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.rootManagerEmail)) {
        throw new Error('Invalid root manager email format');
      }
    }

    // Validate domain aliases if provided
    if (input.domainAliases && input.domainAliases.length > 0) {
      for (const alias of input.domainAliases) {
        if (!alias || alias.trim().length === 0) {
          throw new Error('Domain alias cannot be empty');
        }
      }
    }
  }
}
