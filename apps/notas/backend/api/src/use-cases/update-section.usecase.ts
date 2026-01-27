/**
 * Update Section Use Case
 */

import type { SectionRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { Section, type UpdateSectionInput, SectionValidationError } from '../domain/section.js';
import { UpdateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface UpdateSectionInputWithAuth extends UpdateSectionInput {
  id: string;
}

export interface UpdateSectionOutput extends Record<string, unknown> {
  id: string;
  projectId: string;
  name: string;
  order: number;
  updatedAt: Date;
}

/**
 * Update Section Use Case
 */
export class UpdateSectionUseCase extends UpdateUseCaseTemplate<
  UpdateSectionInputWithAuth,
  Section,
  AppResult<UpdateSectionOutput>
> {
  constructor(
    sectionRepository: SectionRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      findById: (id) => sectionRepository.findById(id),
      updateEntity: async (entity) => sectionRepository.update(entity),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          console.error('[UpdateSectionUseCase] Event bus publish failed:', error);
        }
      },
      toOutput: (entity) => ({
        id: entity.id,
        projectId: entity.projectId,
        name: entity.name,
        order: entity.order,
        updatedAt: entity.updatedAt,
      }),
      tracer,
    });
  }

  protected override updateEntity(entity: Section, input: UpdateSectionInputWithAuth): Section {
    entity.updateDetails({
      name: input.name,
      order: input.order,
    });
    return entity;
  }

  protected override createEvent(entity: Section, _id: string): unknown {
    return {
      eventType: 'section.updated',
      aggregateId: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      timestamp: new Date().toISOString(),
    };
  }

  protected getUseCaseName(): string {
    return 'UpdateSection';
  }

  protected override handleError(error: unknown): AppResult<UpdateSectionOutput> {
    if (error instanceof SectionValidationError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
        },
      };
    }

    return super.handleError(error);
  }
}
