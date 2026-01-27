/**
 * List Questions Use Case
 *
 * Business logic for listing questions with optional filters.
 */

import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';

export interface ListQuestionsInput {
  examId?: string;
  type?: 'text' | 'audio';
  limit?: number;
  offset?: number;
}

/**
 * List Questions Use Case
 */
export class ListQuestionsUseCase {
  constructor(
    private questionRepository: IQuestionRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: ListQuestionsInput = {}) {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    const result = await this.questionRepository.list({
      examId: input.examId,
      type: input.type,
      limit,
      offset,
    });

    // Map Question entities to their persistence format for proper JSON serialization
    return {
      questions: result.questions.map(q => q.toPersistence()),
      total: result.total,
    };
  }
}
