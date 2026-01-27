/**
 * Add Exam Candidate Use Case
 *
 * Business logic for adding a candidate to an exam.
 * Auto-creates a candidate record if it doesn't exist.
 */

import type { IExamCandidateRepository } from '../../repositories/exam-candidates/exam-candidate.repository.interface.js';
import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';

export interface AddExamCandidateInput {
  examId: string;
  userId: string;
  workspaceId: string;
  userName?: string;
  userEmail?: string;
}

export interface AddExamCandidateOutput {
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
 * Add Exam Candidate Use Case
 */
export class AddExamCandidateUseCase {
  constructor(
    private examCandidateRepository: IExamCandidateRepository,
    private candidateRepository: ICandidateRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: AddExamCandidateInput): Promise<AddExamCandidateOutput> {
    // Validate input
    this.validate(input);

    // Find or create candidate record within the specific workspace
    let candidate = await this.candidateRepository.findByExternalIdAndWorkspace(
      input.userId,
      input.workspaceId
    );

    if (!candidate) {
      // Auto-create candidate with user info in this workspace
      candidate = await this.candidateRepository.create({
        workspaceId: input.workspaceId,
        name: input.userName || 'Unknown',
        email: input.userEmail,
        externalId: input.userId,
      });
    }

    // Check if exam assignment already exists
    const existing = await this.examCandidateRepository.findByExamAndUser(
      input.examId,
      input.userId
    );
    if (existing) {
      throw new Error('Candidate is already assigned to this exam');
    }

    // Create exam candidate assignment with the resolved candidate ID
    const examCandidate = await this.examCandidateRepository.create({
      examId: input.examId,
      candidateId: candidate.id, // Use the actual candidate ID from candidates table
      userId: input.userId, // Keep userId for reference
    });

    return examCandidate.toJSON();
  }

  /**
   * Validate input
   */
  private validate(input: AddExamCandidateInput): void {
    if (!input.examId) {
      throw new Error('Exam ID is required');
    }

    if (!input.userId) {
      throw new Error('User ID is required');
    }

    if (!input.workspaceId) {
      throw new Error('Workspace ID is required');
    }
  }
}
