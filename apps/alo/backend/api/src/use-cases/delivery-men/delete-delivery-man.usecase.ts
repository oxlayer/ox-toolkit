/**
 * Delete Delivery Man Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
import { DeliveryManRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { DeliveryManEntity, DeliveryManDeletedEvent } from '@/domain/index.js';

export class DeleteDeliveryManUseCase extends DeleteUseCaseTemplate<
  { id: string },
  DeliveryManEntity,
  AppResult<{ deleted: boolean }>
> {
  constructor(
    private deliveryManRepository: DeliveryManRepository,
    eventBus: EventBus,
    _domainEvents: any,
    businessMetrics: any,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await deliveryManRepository.findById(Number(id));
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
      tracer,
    });
  }

  protected override createEvent(entity: DeliveryManEntity): DeliveryManDeletedEvent {
    return new DeliveryManDeletedEvent(entity.id, {
      id: entity.id,
      email: entity.email,
    });
  }
}
