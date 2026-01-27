/**
 * List Answers Use Case
 *
 * Business logic for listing answers with optional filters.
 */

import type { IAnswerRepository } from '../../repositories/answers/answer.repository.interface.js';

export interface ListAnswersInput {
  assignmentId?: string;
  candidateId?: string;
  examId?: string;
  questionId?: string;
  isValid?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List Answers Use Case
 */
export class ListAnswersUseCase {
  constructor(
    private answerRepository: IAnswerRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: ListAnswersInput = {}) {
    const limit = input.limit ?? 50;
    const offset = input.offset ?? 0;

    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    const result = await this.answerRepository.list({
      assignmentId: input.assignmentId,
      candidateId: input.candidateId,
      examId: input.examId,
      questionId: input.questionId,
      isValid: input.isValid,
      limit,
      offset,
    });

    // Map Answer entities to their persistence format for proper JSON serialization
    return {
      answers: result.answers.map(a => a.toPersistence()),
      total: result.total,
    };
  }
}
