/**
 * Delete Service Provider Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { ServiceProviderRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { ServiceProviderEntity, ServiceProviderDeletedEvent } from '@/domain/index.js';

export interface DeleteServiceProviderOutput {
  id: number;
  email: string;
  deletedAt: Date;
}

export class DeleteServiceProviderUseCase extends DeleteUseCaseTemplate<
  number,
  ServiceProviderEntity,
  Promise<DeleteServiceProviderOutput>
> {
  constructor(
    private serviceProviderRepository: ServiceProviderRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await serviceProviderRepository.findById(id);
      },
      deleteEntity: async (id) => {
        await serviceProviderRepository.delete(id);
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

  protected override createEvent(entity: ServiceProviderEntity, _id: number): ServiceProviderDeletedEvent {
    return new ServiceProviderDeletedEvent(entity.id, {
      id: entity.id,
      email: entity.email,
    });
  }
}
