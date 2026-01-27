/**
 * Delete Project Use Case
 */

import type { ProjectRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { DeleteUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface DeleteProjectInput {
  id: string;
  userId: string;
}

/**
 * Delete Project Use Case
 */
export class DeleteProjectUseCase extends DeleteUseCaseTemplate<
  DeleteProjectInput,
  AppResult<void>
> {
  constructor(
    projectRepository: ProjectRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      findById: (id) => projectRepository.findById(id),
      deleteEntity: async (id) => projectRepository.delete(id),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          console.error('[DeleteProjectUseCase] Event bus publish failed:', error);
        }
      },
      toOutput: () => undefined,
      tracer,
    });
  }

  protected override createEvent(_entity: unknown, id: string): unknown {
    return {
      eventType: 'project.deleted',
      aggregateId: id,
      timestamp: new Date().toISOString(),
    };
  }

  protected getUseCaseName(): string {
    return 'DeleteProject';
  }
}
