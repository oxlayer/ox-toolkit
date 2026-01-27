/**
 * Get Answer Use Case
 *
 * Business logic for retrieving an answer by ID.
 */

import type { IAnswerRepository } from '../../repositories/answers/answer.repository.interface.js';

export interface GetAnswerInput {
  id: string;
}

export interface GetAnswerOutput {
  id: string;
  assignmentId: string;
  candidateId: string;
  examId: string;
  questionId: string;
  s3Url: string;
  duration: number;
  contentType: string;
  fileSize: number;
  isValid: boolean;
  transcription: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Answer Use Case
 */
export class GetAnswerUseCase {
  constructor(
    private answerRepository: IAnswerRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: GetAnswerInput): Promise<GetAnswerOutput | null> {
    if (!input.id) {
      throw new Error('Answer ID is required');
    }

    const answer = await this.answerRepository.findById(input.id);
    if (!answer) return null;
    return answer.toPersistence();
  }
}
