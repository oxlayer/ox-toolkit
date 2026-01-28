/**
 * Delete Service Provider Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
import { ServiceProviderRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { ServiceProviderEntity, ServiceProviderDeletedEvent } from '@/domain/index.js';

export class DeleteServiceProviderUseCase extends DeleteUseCaseTemplate<
  { id: string },
  ServiceProviderEntity,
  AppResult<{ deleted: boolean }>
> {
  constructor(
    private serviceProviderRepository: ServiceProviderRepository,
    eventBus: EventBus,
    _domainEvents: any,
    businessMetrics: any,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await serviceProviderRepository.findById(Number(id));
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

  protected override createEvent(entity: ServiceProviderEntity): ServiceProviderDeletedEvent {
    return new ServiceProviderDeletedEvent(entity.id, {
      id: entity.id,
      email: entity.email,
    });
  }
}
