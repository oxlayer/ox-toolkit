/**
 * Get Sections Use Case
 */

import type { SectionRepository } from '../repositories/index.js';
import type { Section, SectionFilters } from '../domain/section.js';
import { ListUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface GetSectionsInput {
  filters?: SectionFilters;
}

export interface GetSectionsOutput {
  items: Section[];
  total: number;
}

/**
 * Get Sections Use Case
 */
export class GetSectionsUseCase extends ListUseCaseTemplate<
  GetSectionsInput,
  Section,
  AppResult<GetSectionsOutput>
> {
  constructor(
    sectionRepository: SectionRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: (input) => sectionRepository.findAll(input?.filters),
      countEntities: (input) => sectionRepository.count(input?.filters),
      toOutput: (entity) => entity,
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'GetSections';
  }
}
