/**
 * List Onboarding Leads Use Case
 */

import { ListUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { OnboardingLeadRepository, OnboardingLeadFilters } from '@/repositories/index.js';
import { OnboardingLeadEntity } from '@/domain/index.js';

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
  items: Array<{
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
  }>;
  total: number;
}

export class ListOnboardingLeadsUseCase extends ListUseCaseTemplate<
  ListOnboardingLeadsFilters,
  OnboardingLeadEntity,
  Promise<ListOnboardingLeadsOutput>
> {
  constructor(
    private onboardingLeadRepository: OnboardingLeadRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntities: async (filters) => {
        return await onboardingLeadRepository.findAll(filters);
      },
      toOutput: (entities) => ({
        items: entities.map((e) => ({
          id: e.id,
          userType: e.userType,
          categoryId: e.categoryId,
          establishmentTypeId: e.establishmentTypeId,
          document: e.document,
          email: e.email,
          name: e.name,
          phone: e.phone,
          status: e.status,
          contactedAt: e.contactedAt,
          createdAt: e.createdAt,
        })),
        total: entities.length,
      }),
      tracer,
    });
  }

  async execute(filters?: ListOnboardingLeadsFilters): Promise<ListOnboardingLeadsOutput> {
    const parsedFilters: OnboardingLeadFilters = {
      userType: filters?.userType,
      categoryId: filters?.categoryId,
      establishmentTypeId: filters?.establishmentTypeId,
      status: filters?.status,
      search: filters?.search,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
    return super.execute(parsedFilters);
  }
}
