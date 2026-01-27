/**
 * Delete Delivery Man Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { DeliveryManRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { DeliveryManEntity, DeliveryManDeletedEvent } from '@/domain/index.js';

export interface DeleteDeliveryManOutput {
  id: number;
  email: string;
  deletedAt: Date;
}

export class DeleteDeliveryManUseCase extends DeleteUseCaseTemplate<
  number,
  DeliveryManEntity,
  Promise<DeleteDeliveryManOutput>
> {
  constructor(
    private deliveryManRepository: DeliveryManRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await deliveryManRepository.findById(id);
      },
      deleteEntity: async (id) => {
        await deliveryManRepository.delete(id);
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
        }
      },
      toOutput: (entity) => ({
        id: entity.id,
        email: entity.email,
        deletedAt: new Date(),
      }),
      tracer,
    });
  }

  protected override createEvent(entity: DeliveryManEntity, _id: number): DeliveryManDeletedEvent {
    return new DeliveryManDeletedEvent(entity.id, {
      id: entity.id,
      email: entity.email,
    });
  }
}
