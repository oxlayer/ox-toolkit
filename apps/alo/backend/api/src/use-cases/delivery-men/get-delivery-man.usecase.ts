/**
 * Get Delivery Man Use Case
 */

import { GetUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { DeliveryManRepository } from '@/repositories/index.js';
import { DeliveryManEntity } from '@/domain/index.js';

export interface GetDeliveryManOutput {
  id: number;
  name: string;
  email: string;
  phone: string;
  establishmentId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetDeliveryManUseCase extends GetUseCaseTemplate<
  number,
  DeliveryManEntity,
  Promise<GetDeliveryManOutput>
> {
  constructor(
    private deliveryManRepository: DeliveryManRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await deliveryManRepository.findById(id);
      },
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        establishmentId: entity.establishmentId,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }
}
