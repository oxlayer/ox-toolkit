/**
 * Delete Onboarding Lead Use Case
 */

import { DeleteUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
import { OnboardingLeadRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { OnboardingLeadEntity, OnboardingLeadDeletedEvent } from '@/domain/index.js';

export class DeleteOnboardingLeadUseCase extends DeleteUseCaseTemplate<
  { id: string },
  OnboardingLeadEntity,
  AppResult<{ deleted: boolean }>
> {
  constructor(
    private onboardingLeadRepository: OnboardingLeadRepository,
    eventBus: EventBus,
    _domainEvents: any,
    businessMetrics: any,
    tracer?: unknown | null
  ) {
    super({
      findEntity: async (id) => {
        return await onboardingLeadRepository.findById(Number(id));
      },
      deleteEntity: async (_id) => {
        // Database delete is handled separately
      },
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event);
        } catch (error) {
          console.warn('Failed to publish event:', error);
        }
      },
      recordMetric: async (name, value) => {
        try {
          await businessMetrics?.recordMetric(name, value);
        } catch (error) {
          console.warn('Failed to record metric:', error);
        }
      },
      tracer,
    });
  }

  protected override createEvent(entity: OnboardingLeadEntity): OnboardingLeadDeletedEvent {
    return new OnboardingLeadDeletedEvent(entity.id, {
      id: entity.id,
      email: entity.email,
    });
  }
}
