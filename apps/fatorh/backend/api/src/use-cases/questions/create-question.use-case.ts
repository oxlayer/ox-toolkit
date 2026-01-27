/**
 * Create Question Use Case
 *
 * Business logic for creating a new question.
 */

import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';

export interface CreateQuestionInput {
  examId: string;
  priority?: number; // Optional - if not provided, will be set to max + 1
  text: string;
  type: 'text' | 'audio';
  weight?: string;
}

export interface CreateQuestionOutput {
  id: string;
  examId: string;
  priority: number;
  text: string;
  type: 'text' | 'audio';
  weight: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Question Use Case
 */
export class CreateQuestionUseCase {
  constructor(
    private questionRepository: IQuestionRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateQuestionInput): Promise<CreateQuestionOutput> {
    // Validate input
    this.validate(input);

    // Calculate priority: use provided value or get max + 1 for the exam
    const priority = input.priority ?? (await this.questionRepository.getMaxPriority(input.examId)) + 1;

    // Create question
    const question = await this.questionRepository.create({
      examId: input.examId,
      priority,
      text: input.text,
      type: input.type,
      weight: input.weight,
    });

    // TODO: Publish domain event using proper DomainEvent class

    // Return the persistence format for proper JSON serialization
    return question.toPersistence();
  }

  /**
   * Validate input
   */
  private validate(input: CreateQuestionInput): void {
    if (!input.text || input.text.trim().length === 0) {
      throw new Error('Question text is required');
    }

    if (!['text', 'audio'].includes(input.type)) {
      throw new Error('Question type must be "text" or "audio"');
    }

    if (!input.examId) {
      throw new Error('Exam ID is required');
    }

    // Only validate priority if it's provided
    if (input.priority !== undefined && input.priority < 1) {
      throw new Error('Priority must be at least 1');
    }
  }
}
