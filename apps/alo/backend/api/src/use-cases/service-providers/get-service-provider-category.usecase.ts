/**
 * Get Service Provider Category Use Case
 */

import { GetByIdUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { ServiceProviderCategoryRepository } from '@/repositories/index.js';
import { ServiceProviderCategoryEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface GetServiceProviderCategoryOutput {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GetServiceProviderCategoryUseCase extends GetByIdUseCaseTemplate<
  { id: string },
  ServiceProviderCategoryEntity,
  AppResult<GetServiceProviderCategoryOutput & Record<string, unknown>>
> {
  constructor(
    private serviceProviderCategoryRepository: ServiceProviderCategoryRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await serviceProviderCategoryRepository.findById(Number(id));
      },
      checkAccess: (_entity, _input) => true, // Public access for onboarding
      toOutput: (entity) => ({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'GetServiceProviderCategory';
  }
}
