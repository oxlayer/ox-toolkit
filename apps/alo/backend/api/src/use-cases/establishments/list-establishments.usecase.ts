/**
 * List Establishments Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { EstablishmentRepository, EstablishmentFilters } from '@/repositories/index.js';
import { EstablishmentEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface ListEstablishmentsOutput {
  id: number;
  name: string;
  description: string;
  ownerId: number;
  establishmentTypeId: number | null;
  primaryColor: string;
  secondaryColor: string;
  image: string;
  createdAt: Date;
}

export class ListEstablishmentsUseCase extends ListUseCaseTemplate<
  EstablishmentFilters,
  EstablishmentEntity,
  AppResult<{ items: ListEstablishmentsOutput[]; total: number }>
> {
  constructor(
    private establishmentRepository: EstablishmentRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (filters) => {
        return await establishmentRepository.findAll(filters);
      },
      countEntities: async (filters) => {
        return await establishmentRepository.count(filters);
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
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'ListEstablishments';
  }
}
