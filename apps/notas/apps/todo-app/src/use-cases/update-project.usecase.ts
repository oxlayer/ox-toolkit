/**
 * Update Project Use Case
 */

import type { ProjectRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { Project, type UpdateProjectInput, ProjectValidationError } from '../domain/project.js';
import { UpdateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface UpdateProjectInputWithAuth extends UpdateProjectInput {
  id: string;
  userId: string;
}

export interface UpdateProjectOutput extends Record<string, unknown> {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
  updatedAt: Date;
}

/**
 * Update Project Use Case
 */
export class UpdateProjectUseCase extends UpdateUseCaseTemplate<
  UpdateProjectInputWithAuth,
  Project,
  AppResult<UpdateProjectOutput>
> {
  constructor(
    projectRepository: ProjectRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      findById: (id) => projectRepository.findById(id),
      updateEntity: async (entity) => projectRepository.update(entity),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          console.error('[UpdateProjectUseCase] Event bus publish failed:', error);
        }
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        color: entity.color,
        icon: entity.icon,
        order: entity.order,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected override updateEntity(entity: Project, input: UpdateProjectInputWithAuth): Project {
    entity.updateDetails({
      name: input.name,
      color: input.color,
      icon: input.icon,
      order: input.order,
    });
    return entity;
  }

  protected override createEvent(entity: Project, _id: string): unknown {
    return {
      eventType: 'project.updated',
      aggregateId: entity.id,
      userId: entity.userId,
      name: entity.name,
      timestamp: new Date().toISOString(),
    };
  }

  protected getUseCaseName(): string {
    return 'UpdateProject';
  }

  protected override handleError(error: unknown): AppResult<UpdateProjectOutput> {
    if (error instanceof ProjectValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      };
    }

    return super.handleError(error);
  }
}
