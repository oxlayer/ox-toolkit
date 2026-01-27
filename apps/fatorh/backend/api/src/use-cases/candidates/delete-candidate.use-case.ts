/**
 * Delete Candidate Use Case
 *
 * Business logic for deleting a candidate.
 */

import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';

export interface DeleteCandidateUseCaseInput {
  id: string;
}

/**
 * Delete Candidate Use Case
 */
export class DeleteCandidateUseCase {
  constructor(
    private candidateRepository: ICandidateRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: DeleteCandidateUseCaseInput): Promise<void> {
    const existing = await this.candidateRepository.findById(input.id);
    if (!existing) {
      throw new Error('Candidate not found');
    }

    await this.candidateRepository.delete(input.id);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'candidate.deleted',
      {
        candidateId: input.id,
        workspaceId: existing.workspaceId,
        deletedAt: new Date().toISOString(),
      }
    );
  }
}
