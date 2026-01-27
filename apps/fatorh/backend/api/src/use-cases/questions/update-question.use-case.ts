/**
 * Update Question Use Case
 *
 * Business logic for updating a question.
 */

import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';

export interface UpdateQuestionInput {
  id: string;
  priority?: number;
  text?: string;
  type?: 'text' | 'audio';
  weight?: string;
}

export interface UpdateQuestionOutput {
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
 * Update Question Use Case
 */
export class UpdateQuestionUseCase {
  constructor(
    private questionRepository: IQuestionRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateQuestionInput): Promise<UpdateQuestionOutput> {
    // Validate input
    this.validate(input);

    // Check if question exists
    const existing = await this.questionRepository.findById(input.id);
    if (!existing) {
      throw new Error('Question not found');
    }

    // Update question
    const updates: Partial<{
      priority: number;
      text: string;
      type: 'text' | 'audio';
      weight: string;
    }> = {};

    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.text !== undefined) updates.text = input.text;
    if (input.type !== undefined) updates.type = input.type;
    if (input.weight !== undefined) updates.weight = input.weight;

    const updated = await this.questionRepository.update(input.id, updates);

    // TODO: Publish domain event using proper DomainEvent class

    // Return the persistence format for proper JSON serialization
    return updated.toPersistence();
  }

  /**
   * Validate input
   */
  private validate(input: UpdateQuestionInput): void {
    if (!input.id) {
      throw new Error('Question ID is required');
    }

    if (input.priority !== undefined && input.priority < 1) {
      throw new Error('Priority must be at least 1');
    }

    if (input.type !== undefined && !['text', 'audio'].includes(input.type)) {
      throw new Error('Question type must be "text" or "audio"');
    }
  }
}
