/**
 * Create Answer Use Case
 *
 * Business logic for creating a new answer.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { IAnswerRepository } from '../../repositories/answers/answer.repository.interface.js';

export interface CreateAnswerInput {
  assignmentId: string;
  candidateId: string;
  examId: string;
  questionId: string;
  s3Url: string;
  duration: number;
  contentType: string;
  fileSize: number;
}

export interface CreateAnswerOutput {
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
 * Create Answer Use Case
 */
export class CreateAnswerUseCase {
  constructor(
    private answerRepository: IAnswerRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateAnswerInput): Promise<CreateAnswerOutput> {
    // Validate input
    this.validate(input);

    // Create answer
    const id = generateId();
    const answer = await this.answerRepository.create({
      ...input,
      id,
    });

    // TODO: Publish domain event using proper DomainEvent class

    // Return the persistence format for proper JSON serialization
    return answer.toPersistence();
  }

  /**
   * Validate input
   */
  private validate(input: CreateAnswerInput): void {
    if (!input.assignmentId) {
      throw new Error('Assignment ID is required');
    }

    if (!input.candidateId) {
      throw new Error('Candidate ID is required');
    }

    if (!input.examId) {
      throw new Error('Exam ID is required');
    }

    if (!input.questionId) {
      throw new Error('Question ID is required');
    }

    if (!input.s3Url || input.s3Url.trim().length === 0) {
      throw new Error('S3 URL is required');
    }

    if (input.duration <= 0) {
      throw new Error('Duration must be greater than 0');
    }

    if (input.fileSize <= 0) {
      throw new Error('File size must be greater than 0');
    }
  }
}
