/**
 * Delete Establishment Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
import { EstablishmentRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { EstablishmentEntity, EstablishmentDeletedEvent } from '@/domain/index.js';

export class DeleteEstablishmentUseCase extends DeleteUseCaseTemplate<
  { id: string },
  EstablishmentEntity,
  AppResult<{ deleted: boolean }>
> {
  constructor(
    private establishmentRepository: EstablishmentRepository,
    eventBus: EventBus,
    domainEvents: any,
    businessMetrics: any,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await establishmentRepository.findById(Number(id));
      },
      deleteEntity: async (_id) => {
        // Database delete is handled separately
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
        }
      },
      recordMetric: async (name, value) => {
        try {
          await businessMetrics?.recordMetric(name, value);
        } catch (error) {
          console.warn('Failed to record metric:', error);
        }
      },
      toOutput: () => ({
        deleted: true,
      }),
      tracer,
    });
  }

  protected override createEvent(entity: EstablishmentEntity, _id: string): EstablishmentDeletedEvent {
    return new EstablishmentDeletedEvent(entity.id, {
      id: entity.id,
      name: entity.name,
    });
  }
}
