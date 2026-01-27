/**
 * Switch Workspace Use Case
 *
 * Sets a workspace as the default (moves it to orderIndex 0).
 */

import type { WorkspaceRepository } from '../../repositories/workspace.repository.js';
import { withSpan } from '@oxlayer/capabilities-telemetry';

export class SwitchWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly tracer?: unknown | null
  ) {}

  async execute(workspaceId: string, ownerId: string) {
    return withSpan(
      this.tracer as any || null,
      'SwitchWorkspaceUseCase.execute',
      async (span) => {
        span?.setAttribute('workspace.id', workspaceId);
        span?.setAttribute('workspace.owner_id', ownerId);

        // Verify workspace exists and belongs to owner
        const workspace = await this.workspaceRepository.findById(workspaceId);
        if (!workspace) {
          return {
            success: false,
            error: 'Workspace not found',
          };
        }

        if (workspace.ownerId !== ownerId) {
          return {
            success: false,
            error: 'Access denied',
          };
        }

        // Set as default
        await this.workspaceRepository.setAsDefault(workspaceId, ownerId);

        span?.setAttribute('workspace.switched', true);

        return {
          success: true,
          data: workspace.toResponse(),
        };
      }
    );
  }
}
