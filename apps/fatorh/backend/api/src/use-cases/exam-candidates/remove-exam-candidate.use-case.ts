/**
 * Remove Exam Candidate Use Case
 *
 * Business logic for removing a candidate from an exam.
 */

import type { IExamCandidateRepository } from '../../repositories/exam-candidates/exam-candidate.repository.interface.js';

export interface RemoveExamCandidateInput {
  id: string;
}

export interface RemoveExamCandidateOutput {
  id: string;
  examId: string;
  userId: string;
  status: string;
  invitedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Remove Exam Candidate Use Case
 */
export class RemoveExamCandidateUseCase {
  constructor(
    private examCandidateRepository: IExamCandidateRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: RemoveExamCandidateInput): Promise<RemoveExamCandidateOutput> {
    // Validate input
    this.validate(input);

    // Check if candidate exists
    const existing = await this.examCandidateRepository.findById(input.id);
    if (!existing) {
      throw new Error('Exam candidate not found');
    }

    // Only allow removal if status is 'invited'
    if (existing.status !== 'invited') {
      throw new Error('Cannot remove candidate that has already started or completed the exam');
    }

    // Get the data before deletion
    const candidateData = existing.toJSON();

    // Delete the exam candidate
    await this.examCandidateRepository.delete(input.id);

    return candidateData;
  }

  /**
   * Validate input
   */
  private validate(input: RemoveExamCandidateInput): void {
    if (!input.id) {
      throw new Error('Exam candidate ID is required');
    }
  }
}
