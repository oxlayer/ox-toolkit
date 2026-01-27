/**
 * Get Onboarding Lead Use Case
 */

import { GetUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { OnboardingLeadRepository } from '@/repositories/index.js';
import { OnboardingLeadEntity } from '@/domain/index.js';

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

export class GetOnboardingLeadUseCase extends GetUseCaseTemplate<
  number,
  OnboardingLeadEntity,
  Promise<GetOnboardingLeadOutput>
> {
  constructor(
    private onboardingLeadRepository: OnboardingLeadRepository,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await onboardingLeadRepository.findById(id);
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
}
