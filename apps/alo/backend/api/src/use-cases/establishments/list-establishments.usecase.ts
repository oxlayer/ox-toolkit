/**
 * List Establishments Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { EstablishmentRepository, EstablishmentFilters } from '@/repositories/index.js';
import { EstablishmentEntity } from '@/domain/index.js';

export interface ListEstablishmentsFilters {
  ownerId?: number;
  establishmentTypeId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListEstablishmentsOutput {
  items: Array<{
    id: number;
    name: string;
    description: string;
    ownerId: number;
    establishmentTypeId: number | null;
    primaryColor: string;
    secondaryColor: string;
    image: string;
    createdAt: Date;
  }>;
  total: number;
}

export class ListEstablishmentsUseCase extends ListUseCaseTemplate<
  ListEstablishmentsFilters,
  EstablishmentEntity,
  Promise<ListEstablishmentsOutput>
> {
  constructor(
    private establishmentRepository: EstablishmentRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntities: async (filters) => {
        return await establishmentRepository.findAll(filters);
      },
      toOutput: (entities) => ({
        items: entities.map((e) => ({
          id: e.id,
          name: e.name,
          description: e.description,
          ownerId: e.ownerId,
          establishmentTypeId: e.establishmentTypeId,
          primaryColor: e.primaryColor,
          secondaryColor: e.secondaryColor,
          image: e.image,
          createdAt: e.createdAt,
        })),
        total: entities.length,
      }),
      tracer,
    });
  }

  async execute(filters?: ListEstablishmentsFilters): Promise<ListEstablishmentsOutput> {
    const parsedFilters: EstablishmentFilters = {
      ownerId: filters?.ownerId,
      establishmentTypeId: filters?.establishmentTypeId,
      search: filters?.search,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
    return super.execute(parsedFilters);
  }
}
