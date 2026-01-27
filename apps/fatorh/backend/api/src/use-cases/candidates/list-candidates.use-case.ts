/**
 * List Candidates Use Case
 *
 * Business logic for listing candidates with optional filters.
 */

import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';

export interface ListCandidatesUseCaseInput {
  workspaceId?: string;
  examId?: string; // For filtering by exam (would require join with exam_assignments)
}

export interface ListCandidatesUseCaseOutput {
  candidates: Array<{
    id: string;
    workspaceId: string;
    name: string;
    email: string | null;
    cpf: string | null;
    externalId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * List Candidates Use Case
 */
export class ListCandidatesUseCase {
  constructor(private candidateRepository: ICandidateRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: ListCandidatesUseCaseInput = {}): Promise<ListCandidatesUseCaseOutput> {
    const candidates = await this.candidateRepository.find({
      workspaceId: input.workspaceId,
    });

    return {
      candidates: candidates.map((c) => c.toPersistence()),
    };
  }
}
