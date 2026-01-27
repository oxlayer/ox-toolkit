/**
 * Delete Establishment Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { EstablishmentRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { EstablishmentEntity, EstablishmentDeletedEvent } from '@/domain/index.js';

export class DeleteEstablishmentUseCase extends DeleteUseCaseTemplate<
  number,
  EstablishmentEntity,
  Promise<void>
> {
  constructor(
    private establishmentRepository: EstablishmentRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await establishmentRepository.findById(id);
      },
      deleteEntity: async (id) => {
        await establishmentRepository.delete(id);
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
        }
      },
      tracer,
    });
  }

  protected override createEvent(entity: EstablishmentEntity, _id: number): EstablishmentDeletedEvent {
    return new EstablishmentDeletedEvent(entity.id, {
      id: entity.id,
      name: entity.name,
    });
  }
}
