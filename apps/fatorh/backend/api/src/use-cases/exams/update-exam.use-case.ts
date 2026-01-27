/**
 * Update Exam Use Case
 *
 * Business logic for updating an existing exam.
 */

import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import { Exam } from '../../domain/exams/exam.entity.js';

export interface UpdateExamInput {
  id: string;
  examName?: string;
  durationMinutes?: number;
}

export interface UpdateExamOutput {
  id: string;
  workspaceId: string;
  examName: string;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update Exam Use Case
 */
export class UpdateExamUseCase {
  constructor(
    private examRepository: IExamRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: UpdateExamInput): Promise<UpdateExamOutput> {
    // Validate input
    this.validate(input);

    // Check if exam exists
    const existingExam = await this.examRepository.findById(input.id);
    if (!existingExam) {
      throw new Error('Exam not found');
    }

    // Update exam details
    if (input.examName !== undefined) {
      existingExam.updateDetails({ examName: input.examName });
    }
    if (input.durationMinutes !== undefined) {
      existingExam.updateDetails({ durationMinutes: input.durationMinutes });
    }

    // Save to database
    const updatedExam = await this.examRepository.update(input.id, {
      examName: input.examName,
      durationMinutes: input.durationMinutes,
    });

    return updatedExam.toPersistence();
  }

  /**
   * Validate input
   */
  private validate(input: UpdateExamInput): void {
    if (!input.id) {
      throw new Error('Exam ID is required');
    }

    if (input.examName !== undefined && input.examName.trim().length === 0) {
      throw new Error('Exam name cannot be empty');
    }

    if (input.durationMinutes !== undefined) {
      if (input.durationMinutes < 1 || input.durationMinutes > 120) {
        throw new Error('Duration must be between 1 and 120 minutes');
      }
    }

    // At least one field should be provided for update
    if (input.examName === undefined && input.durationMinutes === undefined) {
      throw new Error('At least one field (examName or durationMinutes) must be provided for update');
    }
  }
}
