/**
 * Get Establishment By ID Use Case
 */

import { GetByIdUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { EstablishmentRepository } from '@/repositories/index.js';
import { EstablishmentEntity } from '@/domain/index.js';

export interface GetEstablishmentOutput {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  establishmentTypeId: number | null;
  primaryColor: string;
  secondaryColor: string;
  image: string;
  lat: number | null;
  long: number | null;
  locationString: string | null;
  maxDistanceDelivery: number | null;
  website: string | null;
  whatsapp: string | null;
  instagram: string | null;
  googleBusinessUrl: string | null;
  openData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class GetEstablishmentUseCase extends GetByIdUseCaseTemplate<
  number,
  EstablishmentEntity,
  Promise<GetEstablishmentOutput | null>
> {
  constructor(
    private establishmentRepository: EstablishmentRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await establishmentRepository.findById(id);
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        ownerId: entity.ownerId,
        establishmentTypeId: entity.establishmentTypeId,
        primaryColor: entity.primaryColor,
        secondaryColor: entity.secondaryColor,
        image: entity.image,
        lat: entity.lat,
        long: entity.long,
        locationString: entity.locationString,
        maxDistanceDelivery: entity.maxDistanceDelivery,
        website: entity.website,
        whatsapp: entity.whatsapp,
        instagram: entity.instagram,
        googleBusinessUrl: entity.googleBusinessUrl,
        openData: entity.openData,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  async execute(id: number): Promise<GetEstablishmentOutput | null> {
    return super.execute(id);
  }
}
