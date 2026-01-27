/**
 * Delete Section Use Case
 */

import type { SectionRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { DeleteUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface DeleteSectionInput {
  id: string;
}

/**
 * Delete Section Use Case
 */
export class DeleteSectionUseCase extends DeleteUseCaseTemplate<
  DeleteSectionInput,
  AppResult<void>
> {
  constructor(
    sectionRepository: SectionRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      findById: (id) => sectionRepository.findById(id),
      deleteEntity: async (id) => sectionRepository.delete(id),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          console.error('[DeleteSectionUseCase] Event bus publish failed:', error);
        }
      },
      toOutput: () => undefined,
      tracer,
    });
  }

  protected override createEvent(_entity: unknown, id: string): unknown {
    return {
      eventType: 'section.deleted',
      aggregateId: id,
      timestamp: new Date().toISOString(),
    };
  }

  protected getUseCaseName(): string {
    return 'DeleteSection';
  }
}
