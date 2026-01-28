/**
 * Update Service Provider Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
import { ServiceProviderRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { ServiceProviderEntity, ServiceProviderUpdatedEvent } from '@/domain/index.js';

export interface UpdateServiceProviderInput {
  name?: string;
  password?: string;
  phone?: string;
  categoryId?: number;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  available?: boolean;
  rating?: number;
  isActive?: boolean;
}

export interface UpdateServiceProviderOutput {
  id: number;
  name: string;
  email: string;
  updatedAt: Date;
}

export class UpdateServiceProviderUseCase extends UpdateUseCaseTemplate<
  { id: string; input: UpdateServiceProviderInput },
  ServiceProviderEntity,
  AppResult<UpdateServiceProviderOutput & Record<string, unknown>>
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
      updateEntity: async (entity, { input }) => {
        // Apply updates using entity methods
        if (input.name !== undefined) entity.name = input.name;
        if (input.password !== undefined) entity.passwordHash = input.password;
        if (input.phone !== undefined) entity.phone = input.phone;
        if (input.categoryId !== undefined) entity.categoryId = input.categoryId;
        if (input.document !== undefined) entity.document = input.document;
        if (input.address !== undefined) entity.address = input.address;
        if (input.city !== undefined) entity.city = input.city;
        if (input.state !== undefined) entity.state = input.state;
        if (input.zipCode !== undefined) entity.zipCode = input.zipCode;
        if (input.available !== undefined) entity.setAvailability(input.available);
        if (input.rating !== undefined) entity.updateRating(input.rating);
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

  protected override createEvent(entity: ServiceProviderEntity, _changes: Record<string, unknown>): ServiceProviderUpdatedEvent {
    return new ServiceProviderUpdatedEvent(entity.id, {
      id: entity.id,
      name: entity.name,
    });
  }
}
