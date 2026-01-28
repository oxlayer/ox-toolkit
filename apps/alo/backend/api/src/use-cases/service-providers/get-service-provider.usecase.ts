/**
 * Get Service Provider Use Case
 */

import { GetByIdUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { ServiceProviderRepository } from '@/repositories/index.js';
import { ServiceProviderEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface GetServiceProviderOutput {
  id: number;
  name: string;
  email: string;
  phone: string;
  categoryId: number | null;
  document: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  available: boolean;
  rating: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class GetServiceProviderUseCase extends GetByIdUseCaseTemplate<
  { id: string },
  ServiceProviderEntity,
  AppResult<GetServiceProviderOutput & Record<string, unknown>>
> {
  constructor(
    private serviceProviderRepository: ServiceProviderRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await serviceProviderRepository.findById(Number(id));
      },
      checkAccess: (_entity, _input) => true, // TODO: implement access control
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        email: entity.email,
        phone: entity.phone,
        categoryId: entity.categoryId,
        document: entity.document,
        address: entity.address,
        city: entity.city,
        state: entity.state,
        zipCode: entity.zipCode,
        available: entity.available,
        rating: entity.rating,
        isActive: entity.isActive,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'GetServiceProvider';
  }
}
