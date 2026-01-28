/**
 * Get Onboarding Lead Use Case
 */

import { GetByIdUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { OnboardingLeadRepository } from '@/repositories/index.js';
import { OnboardingLeadEntity } from '@/domain/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

export interface GetOnboardingLeadOutput {
  id: number;
  userType: string;
  categoryId: number | null;
  establishmentTypeId: number | null;
  document: string;
  email: string;
  name: string | null;
  phone: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  status: string;
  contactedAt: Date | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class GetOnboardingLeadUseCase extends GetByIdUseCaseTemplate<
  { id: string },
  OnboardingLeadEntity,
  AppResult<GetOnboardingLeadOutput & Record<string, unknown>>
> {
  constructor(
    private onboardingLeadRepository: OnboardingLeadRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await onboardingLeadRepository.findById(Number(id));
      },
      checkAccess: (_entity, _input) => true, // TODO: implement access control
      toOutput: (entity) => ({
        id: entity.id,
        userType: entity.userType,
        categoryId: entity.categoryId,
        establishmentTypeId: entity.establishmentTypeId,
        document: entity.document,
        email: entity.email,
        name: entity.name,
        phone: entity.phone,
        termsAccepted: entity.termsAccepted,
        privacyAccepted: entity.privacyAccepted,
        status: entity.status,
        contactedAt: entity.contactedAt,
        notes: entity.notes,
        metadata: entity.metadata,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'GetOnboardingLead';
  }
}
