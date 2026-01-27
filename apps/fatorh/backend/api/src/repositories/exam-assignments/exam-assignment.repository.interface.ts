/**
 * Exam Assignment Repository Interface
 */

import { ExamAssignment, CreateExamAssignmentInput, AssignmentStatus } from '../../../domain/evaluations/index.js';

export interface IExamAssignmentRepository {
  /**
   * Create a new exam assignment
   */
  create(data: CreateExamAssignmentInput & { id?: string }): Promise<ExamAssignment>;

  /**
   * Find assignment by ID
   */
  findById(id: string): Promise<ExamAssignment | null>;

  /**
   * Find assignments by candidate ID
   */
  findByCandidateId(candidateId: string): Promise<ExamAssignment[]>;

  /**
   * Find assignments by exam ID
   */
  findByExamId(examId: string): Promise<ExamAssignment[]>;

  /**
   * Find all assignments
   */
  findAll(): Promise<ExamAssignment[]>;

  /**
   * Find pending or in-progress assignments
   */
  findPendingByCandidate(candidateId: string): Promise<ExamAssignment[]>;

  /**
   * Update assignment status
   */
  updateStatus(id: string, status: AssignmentStatus): Promise<ExamAssignment>;

  /**
   * Delete assignment
   */
  delete(id: string): Promise<void>;
}

export default IExamAssignmentRepository;
