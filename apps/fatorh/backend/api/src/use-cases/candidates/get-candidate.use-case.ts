/**
 * Get Candidate Use Case
 *
 * Business logic for retrieving a candidate by ID.
 */

import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';

export interface GetCandidateUseCaseInput {
  id: string;
}

/**
 * Get Candidate Use Case
 */
export class GetCandidateUseCase {
  constructor(private candidateRepository: ICandidateRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: GetCandidateUseCaseInput) {
    const candidate = await this.candidateRepository.findById(input.id);

    if (!candidate) {
      throw new Error('Candidate not found');
    }

    return candidate.toPersistence();
  }
}
