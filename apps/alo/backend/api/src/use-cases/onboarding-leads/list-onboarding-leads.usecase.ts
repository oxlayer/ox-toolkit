/**
 * List Onboarding Leads Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { OnboardingLeadRepository, OnboardingLeadFilters } from '@/repositories/index.js';
import { OnboardingLeadEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface ListOnboardingLeadsFilters {
  userType?: 'provider' | 'company';
  categoryId?: number;
  establishmentTypeId?: number;
  status?: 'new' | 'contacted' | 'converted' | 'rejected';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ListOnboardingLeadsOutput {
  id: number;
  userType: string;
  categoryId: number | null;
  establishmentTypeId: number | null;
  document: string;
  email: string;
  name: string | null;
  phone: string;
  status: string;
  contactedAt: Date | null;
  createdAt: Date;
}

export class ListOnboardingLeadsUseCase extends ListUseCaseTemplate<
  OnboardingLeadFilters,
  OnboardingLeadEntity,
  AppResult<{ items: ListOnboardingLeadsOutput[]; total: number }>
> {
  constructor(
    private onboardingLeadRepository: OnboardingLeadRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: async (filters) => {
        return await onboardingLeadRepository.findAll(filters);
      },
      countEntities: async (filters) => {
        return await onboardingLeadRepository.count(filters);
      },
      toOutput: (entity) => ({
        id: entity.id,
        userType: entity.userType,
        categoryId: entity.categoryId,
        establishmentTypeId: entity.establishmentTypeId,
        document: entity.document,
        email: entity.email,
        name: entity.name,
        phone: entity.phone,
        status: entity.status,
        contactedAt: entity.contactedAt,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'ListOnboardingLeads';
  }
}
