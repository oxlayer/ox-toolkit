/**
 * Create Section Use Case
 */

import type { SectionRepository } from '../repositories/index.js';
import type { EventBus } from '@oxlayer/capabilities-events';
import { Section } from '../domain/section.js';
import { CreateUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface CreateSectionInputWithAuth {
  projectId: string;
  name: string;
}

export interface CreateSectionOutput extends Record<string, unknown> {
  id: string;
  projectId: string;
  name: string;
  order: number;
  createdAt: Date;
}

/**
 * Create Section Use Case
 */
export class CreateSectionUseCase extends CreateUseCaseTemplate<
  CreateSectionInputWithAuth,
  Section,
  AppResult<CreateSectionOutput>
> {
  constructor(
    sectionRepository: SectionRepository,
    eventBus: EventBus,
    tracer?: unknown | null
  ) {
    super({
      generateId: () => `sect_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      createEntity: (data) => Section.create(data),
      persistEntity: async (entity) => sectionRepository.create(entity),
      publishEvent: async (event) => {
        try {
          await eventBus.emit(event as any);
        } catch (error) {
          console.error('[CreateSectionUseCase] Event bus publish failed:', error);
        }
      },
      recordMetric: async () => {
        // Metrics recording can be added later
      },
      toOutput: (entity) => ({
        id: entity.id,
        projectId: entity.projectId,
        name: entity.name,
        order: entity.order,
        createdAt: entity.createdAt,
      }),
      tracer,
    });
  }

  protected override createEvent(entity: Section, _id: string): unknown {
    return {
      eventType: 'section.created',
      aggregateId: entity.id,
      projectId: entity.projectId,
      name: entity.name,
      timestamp: new Date().toISOString(),
    };
  }

  protected getUseCaseName(): string {
    return 'CreateSection';
  }
}
