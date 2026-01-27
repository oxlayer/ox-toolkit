/**
 * Delete Exam Use Case
 *
 * Business logic for deleting an exam.
 */

import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';
import type { EventBus } from '../../config/rabbitmq.config.js';

export interface DeleteExamInput {
  id: string;
}

export interface DeleteExamOutput {
  id: string;
  deleted: boolean;
}

/**
 * Delete Exam Use Case
 */
export class DeleteExamUseCase {
  constructor(
    private examRepository: IExamRepository,
    private questionRepository: IQuestionRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: DeleteExamInput): Promise<DeleteExamOutput> {
    // Validate input
    this.validate(input);

    // Check if exam exists
    const exam = await this.examRepository.findById(input.id);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Delete questions associated with the exam
    await this.questionRepository.deleteByExamId(input.id);

    // Delete exam
    await this.examRepository.delete(input.id);

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'exam.deleted',
      {
        examId: input.id,
        deletedAt: new Date().toISOString(),
      }
    );

    return {
      id: input.id,
      deleted: true,
    };
  }

  /**
   * Validate input
   */
  private validate(input: DeleteExamInput): void {
    if (!input.id || input.id.trim().length === 0) {
      throw new Error('Exam ID is required');
    }
  }
}
