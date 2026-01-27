/**
 * Update Delivery Man Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { DeliveryManRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { DeliveryManEntity, DeliveryManUpdatedEvent } from '@/domain/index.js';

export interface UpdateDeliveryManInput {
  name?: string;
  password?: string;
  phone?: string;
  establishmentId?: number;
  isActive?: boolean;
}

export interface UpdateDeliveryManOutput {
  id: number;
  name: string;
  email: string;
  updatedAt: Date;
}

export class UpdateDeliveryManUseCase extends UpdateUseCaseTemplate<
  { id: number; input: UpdateDeliveryManInput },
  DeliveryManEntity,
  Promise<UpdateDeliveryManOutput>
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
      updateEntity: async (id, input) => {
        const entity = await deliveryManRepository.findById(id);
        if (!entity) {
          throw new Error('Delivery man not found');
        }

        // Apply updates using entity methods
        if (input.name !== undefined) entity.name = input.name;
        if (input.password !== undefined) entity.passwordHash = input.password;
        if (input.phone !== undefined) entity.phone = input.phone;
        if (input.establishmentId !== undefined) {
          entity.assignToEstablishment(input.establishmentId);
        }
        if (input.isActive !== undefined) {
          if (input.isActive) {
            entity.activate();
          } else {
            entity.deactivate();
          }
        }

        return await deliveryManRepository.update(id, entity);
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
        name: entity.name,
        email: entity.email,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected override createEvent(entity: DeliveryManEntity, _params: { id: number; input: UpdateDeliveryManInput }): DeliveryManUpdatedEvent {
    return new DeliveryManUpdatedEvent(entity.id, {
      id: entity.id,
      name: entity.name,
    });
  }
}
