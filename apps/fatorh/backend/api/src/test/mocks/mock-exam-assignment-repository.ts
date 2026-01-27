/**
 * Mock Exam Assignment Repository
 *
 * In-memory repository for testing without database.
 */

import { InMemoryRepository } from '@oxlayer/foundation-testing-kit';
import type { ExamAssignment } from '../../domain/evaluations/exam-assignment.entity.js';

export class MockExamAssignmentRepository extends InMemoryRepository<ExamAssignment, string> {
  protected getId(entity: ExamAssignment): string {
    return entity.id;
  }

  /**
   * Find exam assignment by ID
   */
  async findById(id: string): Promise<ExamAssignment | null> {
    return super.findById(id);
  }

  /**
   * Find all assignments for a candidate
   */
  async findByCandidate(candidateId: string): Promise<ExamAssignment[]> {
    return this.findMany((assignment) => assignment.candidateId === candidateId);
  }

  /**
   * Find all assignments for an exam
   */
  async findByExam(examId: string): Promise<ExamAssignment[]> {
    return this.findMany((assignment) => assignment.examId === examId);
  }

  /**
   * Find assignment by candidate and exam
   */
  async findByCandidateAndExam(candidateId: string, examId: string): Promise<ExamAssignment | null> {
    return this.findOne(
      (assignment) => assignment.candidateId === candidateId && assignment.examId === examId
    );
  }

  /**
   * Find active (non-expired) assignments for a candidate
   */
  async findActiveByCandidate(candidateId: string): Promise<ExamAssignment[]> {
    const now = new Date();
    return this.findMany(
      (assignment) =>
        assignment.candidateId === candidateId &&
        (!assignment.expiresAt || assignment.expiresAt > now)
    );
  }

  /**
   * Find expired assignments
   */
  async findExpired(): Promise<ExamAssignment[]> {
    const now = new Date();
    return this.findMany(
      (assignment) => assignment.expiresAt !== undefined && assignment.expiresAt < now
    );
  }

  /**
   * Count assignments by status
   */
  async countByStatus(status: 'pending' | 'in_progress' | 'completed' | 'expired'): Promise<number> {
    return this.findMany((assignment) => assignment.status === status).length;
  }
}
