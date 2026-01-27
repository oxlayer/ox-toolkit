/**
 * Update Answer Use Case
 *
 * Business logic for updating an answer.
 */

import type { IAnswerRepository } from '../../repositories/answers/answer.repository.interface.js';

export interface UpdateAnswerInput {
  id: string;
  transcription?: string;
  isValid?: boolean;
}

export interface UpdateAnswerOutput {
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
 * Update Answer Use Case
 */
export class UpdateAnswerUseCase {
  constructor(
    private answerRepository: IAnswerRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateAnswerInput): Promise<UpdateAnswerOutput> {
    // Validate input
    this.validate(input);

    // Check if answer exists
    const existing = await this.answerRepository.findById(input.id);
    if (!existing) {
      throw new Error('Answer not found');
    }

    // Update answer
    const updated = await this.answerRepository.update(input.id, {
      transcription: input.transcription,
      isValid: input.isValid,
    });

    // TODO: Publish domain event using proper DomainEvent class

    // Return the persistence format for proper JSON serialization
    return updated.toPersistence();
  }

  /**
   * Validate input
   */
  private validate(input: UpdateAnswerInput): void {
    if (!input.id) {
      throw new Error('Answer ID is required');
    }

    if (input.transcription !== undefined && input.transcription === '') {
      throw new Error('Transcription cannot be empty');
    }
  }
}
