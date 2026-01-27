/**
 * List Delivery Men Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { DeliveryManRepository, DeliveryManFilters } from '@/repositories/index.js';
import { DeliveryManEntity } from '@/domain/index.js';

export interface ListDeliveryMenFilters {
  establishmentId?: number;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListDeliveryMenOutput {
  items: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    establishmentId: number | null;
    isActive: boolean;
    createdAt: Date;
  }>;
  total: number;
}

export class ListDeliveryMenUseCase extends ListUseCaseTemplate<
  ListDeliveryMenFilters,
  DeliveryManEntity,
  Promise<ListDeliveryMenOutput>
> {
  constructor(
    private deliveryManRepository: DeliveryManRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntities: async (filters) => {
        return await deliveryManRepository.findAll(filters);
      },
      toOutput: (entities) => ({
        items: entities.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          phone: e.phone,
          establishmentId: e.establishmentId,
          isActive: e.isActive,
          createdAt: e.createdAt,
        })),
        total: entities.length,
      }),
      tracer,
    });
  }

  async execute(filters?: ListDeliveryMenFilters): Promise<ListDeliveryMenOutput> {
    const parsedFilters: DeliveryManFilters = {
      establishmentId: filters?.establishmentId,
      isActive: filters?.isActive,
      search: filters?.search,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
    return super.execute(parsedFilters);
  }
}
