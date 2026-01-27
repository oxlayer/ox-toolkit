/**
 * Exam Candidate Repository Interface
 */

import { ExamCandidate, ExamCandidateStatus } from '../../domain/exams/exam-candidate.entity.js';

export interface IExamCandidateRepository {
  /**
   * Create a new exam candidate (assignment)
   */
  create(data: {
    examId: string;
    candidateId: string;
    userId: string; // Kept for backward compatibility and record keeping
  }): Promise<ExamCandidate>;

  /**
   * Find exam candidate by ID
   */
  findById(id: string): Promise<ExamCandidate | null>;

  /**
   * Find exam candidates by exam ID
   */
  findByExamId(examId: string): Promise<ExamCandidate[]>;

  /**
   * Find exam candidates by user ID
   */
  findByUserId(userId: string): Promise<ExamCandidate[]>;

  /**
   * Find all exam candidates
   */
  findAll(): Promise<ExamCandidate[]>;

  /**
   * Find exam candidate by exam and user
   */
  findByExamAndUser(examId: string, userId: string): Promise<ExamCandidate | null>;

  /**
   * Update exam candidate status
   */
  updateStatus(id: string, status: ExamCandidateStatus): Promise<ExamCandidate>;

  /**
   * Delete exam candidate
   */
  delete(id: string): Promise<void>;

  /**
   * Check if exam candidate exists
   */
  exists(id: string): Promise<boolean>;
}
