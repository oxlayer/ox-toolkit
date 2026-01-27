/**
 * List Service Providers Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { ServiceProviderRepository, ServiceProviderFilters } from '@/repositories/index.js';
import { ServiceProviderEntity } from '@/domain/index.js';

export interface ListServiceProvidersFilters {
  categoryId?: number;
  city?: string;
  state?: string;
  isActive?: boolean;
  available?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListServiceProvidersOutput {
  items: Array<{
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
  }>;
  total: number;
}

export class ListServiceProvidersUseCase extends ListUseCaseTemplate<
  ListServiceProvidersFilters,
  ServiceProviderEntity,
  Promise<ListServiceProvidersOutput>
> {
  constructor(
    private serviceProviderRepository: ServiceProviderRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntities: async (filters) => {
        return await serviceProviderRepository.findAll(filters);
      },
      toOutput: (entities) => ({
        items: entities.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          phone: e.phone,
          categoryId: e.categoryId,
          document: e.document,
          city: e.city,
          state: e.state,
          available: e.available,
          rating: e.rating,
          isActive: e.isActive,
          createdAt: e.createdAt,
        })),
        total: entities.length,
      }),
      tracer,
    });
  }

  async execute(filters?: ListServiceProvidersFilters): Promise<ListServiceProvidersOutput> {
    const parsedFilters: ServiceProviderFilters = {
      categoryId: filters?.categoryId,
      city: filters?.city,
      state: filters?.state,
      isActive: filters?.isActive,
      available: filters?.available,
      search: filters?.search,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
    return super.execute(parsedFilters);
  }
}
