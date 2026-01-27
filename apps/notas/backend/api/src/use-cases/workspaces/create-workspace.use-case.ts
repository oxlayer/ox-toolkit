/**
 * Create Workspace Use Case
 *
 * Creates a new workspace for a user.
 */

import type { WorkspaceRepository } from '../../repositories/workspace.repository.js';
import { Workspace } from '../../domain/workspace.js';
import { withSpan } from '@oxlayer/capabilities-telemetry';

export interface CreateWorkspaceInput {
  name: string;
  type: 'personal' | 'crm' | 'recruiting';
  ownerId: string;
  icon?: string;
  color?: string;
}

export class CreateWorkspaceUseCase {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly eventBus: any,
    private readonly domainEvents: any,
    private readonly businessMetrics: any,
    private readonly tracer?: unknown | null
  ) {}

  async execute(input: CreateWorkspaceInput) {
    return withSpan(
      this.tracer as any || null,
      'CreateWorkspaceUseCase.execute',
      async (span) => {
        span?.setAttribute('workspace.name', input.name);
        span?.setAttribute('workspace.type', input.type);
        span?.setAttribute('workspace.owner_id', input.ownerId);

        // Check if owner has any existing workspaces
        const hasAny = await this.workspaceRepository.hasAny(input.ownerId);
        const orderIndex = hasAny
          ? (await this.workspaceRepository.count({ ownerId: input.ownerId }))
          : 0;

        // Create workspace entity
        const workspace = Workspace.create({
          name: input.name,
          type: input.type,
          ownerId: input.ownerId,
          icon: input.icon,
          color: input.color,
          orderIndex,
        });

        // Persist to database
        await this.workspaceRepository.create(workspace);

        // Emit domain event
        try {
          await this.eventBus.publish({
            type: 'workspace.created',
            data: {
              id: workspace.id,
              name: workspace.name,
              type: workspace.type,
              ownerId: workspace.ownerId,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to publish workspace.created event:', error);
        }

        // Track business metric
        try {
          await this.businessMetrics.track({
            metric: 'workspace_created',
            workspaceId: workspace.id,
            workspaceType: workspace.type,
            ownerId: workspace.ownerId,
          });
        } catch (error) {
          console.error('Failed to track workspace_created metric:', error);
        }

        span?.setAttribute('workspace.id', workspace.id);
        span?.setAttribute('workspace.created', true);

        return {
          success: true,
          data: workspace.toResponse(),
        };
      }
    );
  }
}
