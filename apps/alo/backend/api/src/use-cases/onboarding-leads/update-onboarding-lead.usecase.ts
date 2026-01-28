/**
 * Update Onboarding Lead Use Case
 */

import { UpdateUseCaseTemplate } from '@oxlayer/snippets/use-cases';
import type { AppResult } from '@oxlayer/snippets/use-cases';
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
  { id: string; input: UpdateOnboardingLeadInput },
  OnboardingLeadEntity,
  AppResult<UpdateOnboardingLeadOutput & Record<string, unknown>>
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
      updateEntity: async (entity, data) => {
        const input = data.input as UpdateOnboardingLeadInput;
        // Store the input for use in createEvent
        (this as any)._lastInput = input;

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
              // For 'new' status or same status, just update other fields
              break;
          }
        }

        // Handle independent field updates
        if (input.notes !== undefined && input.status !== 'rejected') {
          entity.updateNotes(input.notes);
        }
        if (input.contactedAt !== undefined) {
          entity.updateContactedAt(input.contactedAt);
        }
      },
      persistEntity: async (entity) => {
        // Persist the updated entity to database
        await onboardingLeadRepository.update(entity.id, entity);
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

  protected override createEvent(entity: OnboardingLeadEntity, _changes: Record<string, unknown>): OnboardingLeadStatusChangedEvent | null {
    // Only emit status changed event if status actually changed
    const input = (this as any)._lastInput as UpdateOnboardingLeadInput | undefined;
    if (input?.status && input.status !== entity.status) {
      return new OnboardingLeadStatusChangedEvent(entity.id, {
        status: input.status,
        previousStatus: entity.status,
      });
    }
    return null;
  }
}
