/**
 * Get Exam Candidate Use Case
 *
 * Business logic for retrieving exam candidates.
 */

import type { IExamCandidateRepository } from '../../repositories/exam-candidates/exam-candidate.repository.interface.js';

export interface GetExamCandidateInput {
  id?: string;
  examId?: string;
  userId?: string;
}

export interface GetExamCandidateOutput {
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
 * Get Exam Candidate Use Case
 */
export class GetExamCandidateUseCase {
  constructor(
    private examCandidateRepository: IExamCandidateRepository
  ) {}

  /**
   * Execute the use case - get by ID, by exam, by user, or by exam+user
   */
  async execute(input: GetExamCandidateInput): Promise<GetExamCandidateOutput | GetExamCandidateOutput[]> {
    if (input.id) {
      const candidate = await this.examCandidateRepository.findById(input.id);
      if (!candidate) {
        throw new Error('Exam candidate not found');
      }
      return candidate.toJSON();
    }

    if (input.examId && input.userId) {
      const candidate = await this.examCandidateRepository.findByExamAndUser(
        input.examId,
        input.userId
      );
      if (!candidate) {
        throw new Error('Exam candidate not found');
      }
      return candidate.toJSON();
    }

    if (input.examId) {
      const candidates = await this.examCandidateRepository.findByExamId(input.examId);
      return candidates.map(c => c.toJSON());
    }

    if (input.userId) {
      const candidates = await this.examCandidateRepository.findByUserId(input.userId);
      return candidates.map(c => c.toJSON());
    }

    // No filter provided - return all exam candidates
    const candidates = await this.examCandidateRepository.findAll();
    return candidates.map(c => c.toJSON());
  }
}
