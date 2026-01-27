/**
 * Update Workspace Use Case
 *
 * Updates an existing workspace.
 */

import type { WorkspaceRepository } from '../../repositories/workspace.repository.js';
import { withSpan } from '@oxlayer/capabilities-telemetry';

export interface UpdateWorkspaceInput {
  name?: string;
  icon?: string;
  color?: string;
  flags?: Partial<{ contacts: boolean; companies: boolean; deals: boolean; candidates: boolean; positions: boolean; pipeline: boolean }>;
}

export class UpdateWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly eventBus: any,
    private readonly domainEvents: any,
    private readonly businessMetrics: any,
    private readonly tracer?: unknown | null
  ) {}

  async execute(id: string, input: UpdateWorkspaceInput) {
    return withSpan(
      this.tracer as any || null,
      'UpdateWorkspaceUseCase.execute',
      async (span) => {
        span?.setAttribute('workspace.id', id);

        // Find existing workspace
        const workspace = await this.workspaceRepository.findById(id);
        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          };
        }

        // Update workspace details (name, icon, color, settings)
        workspace.updateDetails(input);

        // Update flags if provided
        if (input.flags) {
          workspace.updateFlags(input.flags);
        }

        // Persist changes
        await this.workspaceRepository.update(workspace);

        // Emit domain event
        try {
          await this.eventBus.publish({
            type: 'workspace.updated',
            data: {
              id: workspace.id,
              name: workspace.name,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to publish workspace.updated event:', error);
        }

        span?.setAttribute('workspace.updated', true);

        return {
          success: true,
          data: workspace.toResponse(),
        };
      }
    );
  }
}
