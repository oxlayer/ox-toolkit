/**
 * List Delivery Men Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { DeliveryManRepository, DeliveryManFilters } from '@/repositories/index.js';
import { DeliveryManEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface ListDeliveryMenOutput {
  id: number;
  name: string;
  email: string;
  phone: string;
  establishmentId: number | null;
  isActive: boolean;
  createdAt: Date;
}

export class ListDeliveryMenUseCase extends ListUseCaseTemplate<
  DeliveryManFilters,
  DeliveryManEntity,
  AppResult<{ items: ListDeliveryMenOutput[]; total: number }>
> {
  constructor(
    private deliveryManRepository: DeliveryManRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (filters) => {
        return await deliveryManRepository.findAll(filters);
      },
      countEntities: async (filters) => {
        return await deliveryManRepository.count(filters);
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        establishmentId: entity.establishmentId,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'ListDeliveryMen';
  }
}
