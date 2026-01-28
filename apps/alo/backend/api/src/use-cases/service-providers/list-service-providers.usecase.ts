/**
 * List Service Providers Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { ServiceProviderRepository, ServiceProviderFilters } from '@/repositories/index.js';
import { ServiceProviderEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface ListServiceProvidersOutput {
  id: number;
  name: string;
  email: string;
  phone: string;
  categoryId: number | null;
  document: string;
  city: string;
  state: string;
  available: boolean;
  rating: number | null;
  isActive: boolean;
  createdAt: Date;
}

export class ListServiceProvidersUseCase extends ListUseCaseTemplate<
  ServiceProviderFilters,
  ServiceProviderEntity,
  AppResult<{ items: ListServiceProvidersOutput[]; total: number }>
> {
  constructor(
    private serviceProviderRepository: ServiceProviderRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (filters) => {
        return await serviceProviderRepository.findAll(filters);
      },
      countEntities: async (filters) => {
        return await serviceProviderRepository.count(filters);
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        categoryId: entity.categoryId,
        document: entity.document,
        city: entity.city,
        state: entity.state,
        available: entity.available,
        rating: entity.rating,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'ListServiceProviders';
  }
}
