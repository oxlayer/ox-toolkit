/**
 * Get Delivery Man Use Case
 */

import { GetByIdUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { DeliveryManRepository } from '@/repositories/index.js';
import { DeliveryManEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

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

export class GetDeliveryManUseCase extends GetByIdUseCaseTemplate<
  { id: string },
  DeliveryManEntity,
  AppResult<GetDeliveryManOutput & Record<string, unknown>>
> {
  constructor(
    private deliveryManRepository: DeliveryManRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await deliveryManRepository.findById(Number(id));
      },
      checkAccess: (_entity, _input) => true, // TODO: implement access control
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

  protected getUseCaseName(): string {
    return 'GetDeliveryMan';
  }
}
