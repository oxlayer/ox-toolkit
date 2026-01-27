/**
 * Update Onboarding Lead Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import { OnboardingLeadRepository } from '@/repositories/index.js';
import { EventBus } from '@oxlayer/capabilities-events';
import { OnboardingLeadEntity, OnboardingLeadStatusChangedEvent } from '@/domain/index.js';

export interface UpdateOnboardingLeadInput {
  status?: 'new' | 'contacted' | 'converted' | 'rejected';
  notes?: string;
  contactedAt?: Date;
}

export interface UpdateOnboardingLeadOutput {
  id: number;
  userType: string;
  email: string;
  status: string;
  updatedAt: Date;
}

export class UpdateOnboardingLeadUseCase extends UpdateUseCaseTemplate<
  { id: number; input: UpdateOnboardingLeadInput },
  OnboardingLeadEntity,
  Promise<UpdateOnboardingLeadOutput>
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
      updateEntity: async (id, input) => {
        const entity = await onboardingLeadRepository.findById(id);
        if (!entity) {
          throw new Error('Onboarding lead not found');
        }

        const previousStatus = entity.status;

        // Apply updates using entity methods
        if (input.status !== undefined && input.status !== previousStatus) {
          switch (input.status) {
            case 'contacted':
              entity.markAsContacted();
              break;
            case 'converted':
              entity.markAsConverted();
              break;
            case 'rejected':
              entity.markAsRejected(input.notes);
              break;
            default:
              // For 'new' status or other cases, we need to handle it directly
              if (input.notes !== undefined) {
                entity.notes = input.notes;
              }
              if (input.contactedAt !== undefined) {
                entity.contactedAt = input.contactedAt;
              }
          }
        } else {
          if (input.notes !== undefined) {
            entity.notes = input.notes;
          }
          if (input.contactedAt !== undefined) {
            entity.contactedAt = input.contactedAt;
          }
        }

        return await onboardingLeadRepository.update(id, entity);
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
        userType: entity.userType,
        email: entity.email,
        status: entity.status,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected override createEvent(entity: OnboardingLeadEntity, params: { id: number; input: UpdateOnboardingLeadInput }): OnboardingLeadStatusChangedEvent | null {
    // Only emit status changed event if status actually changed
    if (params.input.status && params.input.status !== entity.status) {
      return new OnboardingLeadStatusChangedEvent(entity.id, {
        status: params.input.status,
        previousStatus: entity.status,
      });
    }
    return null;
  }
}
