/**
 * Create Project Use Case
 */

import type { ProjectRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { Project } from '../domain/project.js';
import { CreateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface CreateProjectInputWithAuth {
  name: string;
  color?: string;
  icon?: string;
  userId: string;
}

export interface CreateProjectOutput extends Record<string, unknown> {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order: number;
  createdAt: Date;
}

/**
 * Create Project Use Case
 */
export class CreateProjectUseCase extends CreateUseCaseTemplate<
  CreateProjectInputWithAuth,
  Project,
  AppResult<CreateProjectOutput>
> {
  constructor(
    projectRepository: ProjectRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      generateId: () => `proj_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      createEntity: (data) => Project.create(data),
      persistEntity: async (entity) => projectRepository.create(entity),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          console.error('[CreateProjectUseCase] Event bus publish failed:', error);
        }
      },
      recordMetric: async () => {
        // Metrics recording can be added later
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        color: entity.color,
        icon: entity.icon,
        order: entity.order,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected override createEvent(entity: Project, _id: string): unknown {
    return {
      eventType: 'project.created',
      aggregateId: entity.id,
      userId: entity.userId,
      name: entity.name,
      timestamp: new Date().toISOString(),
    };
  }

  protected getUseCaseName(): string {
    return 'CreateProject';
  }
}
