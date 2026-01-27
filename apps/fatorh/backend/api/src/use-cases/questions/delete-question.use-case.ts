/**
 * Delete Question Use Case
 *
 * Business logic for deleting a question.
 */

import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';

export interface DeleteQuestionInput {
  id: string;
}

/**
 * Delete Question Use Case
 */
export class DeleteQuestionUseCase {
  constructor(
    private questionRepository: IQuestionRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: DeleteQuestionInput): Promise<void> {
    if (!input.id) {
      throw new Error('Question ID is required');
    }

    // Check if question exists
    const existing = await this.questionRepository.findById(input.id);
    if (!existing) {
      throw new Error('Question not found');
    }

    // Delete question
    await this.questionRepository.delete(input.id);

    // TODO: Publish domain event using proper DomainEvent class
  }
}
