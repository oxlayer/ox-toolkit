/**
 * Get Question Use Case
 *
 * Business logic for retrieving a question by ID.
 */

import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';

export interface GetQuestionInput {
  id: string;
}

export interface GetQuestionOutput {
  id: string;
  examId: string;
  priority: number;
  text: string;
  type: 'text' | 'audio';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Question Use Case
 */
export class GetQuestionUseCase {
  constructor(
    private questionRepository: IQuestionRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: GetQuestionInput): Promise<GetQuestionOutput | null> {
    if (!input.id) {
      throw new Error('Question ID is required');
    }

    const question = await this.questionRepository.findById(input.id);
    if (!question) return null;
    return question.toPersistence();
  }
}
