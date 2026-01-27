/**
 * Delete Onboarding Lead Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { OnboardingLeadRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { OnboardingLeadEntity, OnboardingLeadDeletedEvent } from '@/domain/index.js';

export interface DeleteOnboardingLeadOutput {
  id: number;
  email: string;
  deletedAt: Date;
}

export class DeleteOnboardingLeadUseCase extends DeleteUseCaseTemplate<
  number,
  OnboardingLeadEntity,
  Promise<DeleteOnboardingLeadOutput>
> {
  constructor(
    private onboardingLeadRepository: OnboardingLeadRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      fetchEntity: async (id) => {
        return await onboardingLeadRepository.findById(id);
      },
      deleteEntity: async (id) => {
        await onboardingLeadRepository.delete(id);
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
        }
      },
      toOutput: (entity) => ({
        id: entity.id,
        email: entity.email,
        deletedAt: new Date(),
      }),
      tracer,
    });
  }

  protected override createEvent(entity: OnboardingLeadEntity, _id: number): OnboardingLeadDeletedEvent {
    return new OnboardingLeadDeletedEvent(entity.id, {
      id: entity.id,
      email: entity.email,
    });
  }
}
