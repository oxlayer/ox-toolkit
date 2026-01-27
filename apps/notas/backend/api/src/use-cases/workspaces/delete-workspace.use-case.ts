/**
 * Delete Workspace Use Case
 *
 * Deletes a workspace (cascades to todos, projects, sections).
 */

import type { WorkspaceRepository } from '../../repositories/workspace.repository.js';
import { withSpan } from '@oxlayer/capabilities-telemetry';

export class DeleteWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly eventBus: any,
    private readonly domainEvents: any,
    private readonly businessMetrics: any,
    private readonly tracer?: unknown | null
  ) {}

  async execute(id: string) {
    return withSpan(
      this.tracer as any || null,
      'DeleteWorkspaceUseCase.execute',
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

        // Delete workspace (cascade will handle related records)
        await this.workspaceRepository.delete(id);

        // Emit domain event
        try {
          await this.eventBus.publish({
            type: 'workspace.deleted',
            data: {
              id: workspace.id,
              name: workspace.name,
              ownerId: workspace.ownerId,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to publish workspace.deleted event:', error);
        }

        span?.setAttribute('workspace.deleted', true);

        return {
          success: true,
          data: { id },
        };
      }
    );
  }
}
