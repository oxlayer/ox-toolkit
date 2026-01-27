/**
 * Get Projects Use Case
 */

import type { ProjectRepository } from '../repositories/index.js';
import type { Project, ProjectFilters } from '../domain/project.js';
import { ListUseCaseTemplate, type AppResult } from '@oxlayer/snippets/use-cases';

export interface GetProjectsInput {
  userId?: string;
  filters?: ProjectFilters;
}

export interface GetProjectsOutput {
  items: Project[];
  total: number;
}

/**
 * Get Projects Use Case
 */
export class GetProjectsUseCase extends ListUseCaseTemplate<
  GetProjectsInput,
  Project,
  AppResult<GetProjectsOutput>
> {
  constructor(
    projectRepository: ProjectRepository,
    tracer?: unknown | null
  ) {
    super({
      findEntities: (input) => projectRepository.findAll(input?.filters),
      countEntities: (input) => projectRepository.count(input?.filters),
      toOutput: (entity) => entity,
      tracer,
    });
  }

  protected getUseCaseName(): string {
    return 'GetProjects';
  }
}
