/**
 * Update Establishment Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { EstablishmentRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { EstablishmentEntity, EstablishmentUpdatedEvent } from '@/domain/index.js';

export interface UpdateEstablishmentInput {
  name?: string;
  horarioFuncionamento?: string;
  description?: string;
  image?: string;
  primaryColor?: string;
  secondaryColor?: string;
  lat?: number;
  long?: number;
  locationString?: string;
  maxDistanceDelivery?: number;
  establishmentTypeId?: number;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  googleBusinessUrl?: string;
  openData?: Record<string, unknown>;
}

export interface UpdateEstablishmentOutput {
  id: number;
  name: string;
  updatedAt: Date;
}

export class UpdateEstablishmentUseCase extends UpdateUseCaseTemplate<
  { id: number; input: UpdateEstablishmentInput },
  EstablishmentEntity,
  Promise<UpdateEstablishmentOutput>
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
      updateEntity: async (id, input) => {
        const entity = await establishmentRepository.findById(id);
        if (!entity) {
          throw new Error('Establishment not found');
        }

        // Apply updates
        if (input.name !== undefined) entity.name = input.name;
        if (input.horarioFuncionamento !== undefined) entity.horarioFuncionamento = input.horarioFuncionamento;
        if (input.description !== undefined) entity.description = input.description;
        if (input.image !== undefined) entity.image = input.image;
        if (input.primaryColor !== undefined) entity.primaryColor = input.primaryColor;
        if (input.secondaryColor !== undefined) entity.secondaryColor = input.secondaryColor;
        if (input.lat !== undefined) entity.lat = input.lat;
        if (input.long !== undefined) entity.long = input.long;
        if (input.locationString !== undefined) entity.locationString = input.locationString;
        if (input.maxDistanceDelivery !== undefined) entity.maxDistanceDelivery = input.maxDistanceDelivery;
        if (input.establishmentTypeId !== undefined) entity.establishmentTypeId = input.establishmentTypeId;
        if (input.website !== undefined) entity.website = input.website;
        if (input.whatsapp !== undefined) entity.whatsapp = input.whatsapp;
        if (input.instagram !== undefined) entity.instagram = input.instagram;
        if (input.googleBusinessUrl !== undefined) entity.googleBusinessUrl = input.googleBusinessUrl;
        if (input.openData !== undefined) entity.openData = input.openData;

        return await establishmentRepository.update(id, entity);
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
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected override createEvent(entity: EstablishmentEntity, _params: { id: number; input: UpdateEstablishmentInput }): EstablishmentUpdatedEvent {
    return new EstablishmentUpdatedEvent(entity.id, {
      id: entity.id,
      name: entity.name,
    });
  }
}
