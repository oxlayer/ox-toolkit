/**
 * Delete Answer Use Case
 *
 * Business logic for deleting an answer.
 */

import type { IAnswerRepository } from '../../repositories/answers/answer.repository.interface.js';

export interface DeleteAnswerInput {
  id: string;
}

/**
 * Delete Answer Use Case
 */
export class DeleteAnswerUseCase {
  constructor(
    private answerRepository: IAnswerRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: DeleteAnswerInput): Promise<void> {
    if (!input.id) {
      throw new Error('Answer ID is required');
    }

    // Check if answer exists
    const existing = await this.answerRepository.findById(input.id);
    if (!existing) {
      throw new Error('Answer not found');
    }

    // Delete answer
    await this.answerRepository.delete(input.id);

    // TODO: Publish domain event using proper DomainEvent class
  }
}
