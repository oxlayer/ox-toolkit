/**
 * List Service Provider Categories Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { ServiceProviderCategoryRepository, ServiceProviderCategoryFilters } from '@/repositories/index.js';
import { ServiceProviderCategoryEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface ListServiceProviderCategoriesOutput {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

export class ListServiceProviderCategoriesUseCase extends ListUseCaseTemplate<
  ServiceProviderCategoryFilters,
  ServiceProviderCategoryEntity,
  AppResult<{ items: ListServiceProviderCategoriesOutput[]; total: number }>
> {
  constructor(
    private serviceProviderCategoryRepository: ServiceProviderCategoryRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (filters) => {
        return await serviceProviderCategoryRepository.findAll(filters);
      },
      countEntities: async (filters) => {
        return await serviceProviderCategoryRepository.count(filters);
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'ListServiceProviderCategories';
  }
}
