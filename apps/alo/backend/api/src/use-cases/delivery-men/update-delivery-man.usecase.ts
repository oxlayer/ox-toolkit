/**
 * Update Delivery Man Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
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
  { id: string; input: UpdateDeliveryManInput },
  DeliveryManEntity,
  AppResult<UpdateDeliveryManOutput & Record<string, unknown>>
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
      updateEntity: async (entity, { input }) => {
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
      },
      persistEntity: async (_entity) => {
        // Database update is handled separately
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
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected override createEvent(entity: DeliveryManEntity, changes: Record<string, unknown>): DeliveryManUpdatedEvent {
    return new DeliveryManUpdatedEvent(entity.id, {
      id: entity.id,
      name: entity.name,
    });
  }
}
