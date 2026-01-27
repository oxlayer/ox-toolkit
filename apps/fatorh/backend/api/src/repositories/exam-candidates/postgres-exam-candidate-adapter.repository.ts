/**
 * PostgreSQL Exam Candidate Repository Adapter
 *
 * Adapts the existing ExamAssignment repository to work as an ExamCandidate repository.
 * This maps between the frontend's ExamCandidate type and the backend's ExamAssignment type.
 */

import { ExamCandidate, ExamCandidateStatus } from '../../domain/exams/exam-candidate.entity.js';
import type { IExamCandidateRepository } from '../exam-candidates/exam-candidate.repository.interface.js';

// We'll adapt the IExamAssignmentRepository interface
interface ExamAssignmentRepo {
  create(data: { examId: string; candidateId: string; [key: string]: any }): Promise<any>;
  findById(id: string): Promise<any>;
  findByExamId(examId: string): Promise<any[]>;
  findByCandidateId(candidateId: string): Promise<any[]>;
  findAll(): Promise<any[]>;
  delete(id: string): Promise<void>;
}

export class PostgresExamCandidateRepositoryAdapter implements IExamCandidateRepository {
  constructor(private examAssignmentRepository: ExamAssignmentRepo) {}

  /**
   * Create a new exam candidate (assignment)
   */
  async create(data: {
    examId: string;
    userId: string;
  }): Promise<ExamCandidate> {
    // Map userId to candidateId for the existing repository
    const assignment = await this.examAssignmentRepository.create({
      examId: data.examId,
      candidateId: data.userId,
    });

    // Convert ExamAssignment to ExamCandidate
    return ExamCandidate.fromPersistence({
      id: assignment.id,
      examId: assignment.examId,
      candidateId: assignment.candidateId,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      completedAt: assignment.completedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    });
  }

  /**
   * Find exam candidate by ID
   */
  async findById(id: string): Promise<ExamCandidate | null> {
    const assignment = await this.examAssignmentRepository.findById(id);
    if (!assignment) return null;

    return ExamCandidate.fromPersistence({
      id: assignment.id,
      examId: assignment.examId,
      candidateId: assignment.candidateId,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      completedAt: assignment.completedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    });
  }

  /**
   * Find exam candidates by exam ID
   */
  async findByExamId(examId: string): Promise<ExamCandidate[]> {
    const assignments = await this.examAssignmentRepository.findByExamId(examId);

    return assignments.map((assignment: any) =>
      ExamCandidate.fromPersistence({
        id: assignment.id,
        examId: assignment.examId,
        candidateId: assignment.candidateId,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      })
    );
  }

  /**
   * Find exam candidates by user ID
   */
  async findByUserId(userId: string): Promise<ExamCandidate[]> {
    const assignments = await this.examAssignmentRepository.findByCandidateId(userId);

    return assignments.map((assignment: any) =>
      ExamCandidate.fromPersistence({
        id: assignment.id,
        examId: assignment.examId,
        candidateId: assignment.candidateId,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      })
    );
  }

  /**
   * Find all exam candidates
   */
  async findAll(): Promise<ExamCandidate[]> {
    const assignments = await this.examAssignmentRepository.findAll();

    return assignments.map((assignment: any) =>
      ExamCandidate.fromPersistence({
        id: assignment.id,
        examId: assignment.examId,
        candidateId: assignment.candidateId,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
      })
    );
  }

  /**
   * Find exam candidate by exam and user
   */
  async findByExamAndUser(examId: string, userId: string): Promise<ExamCandidate | null> {
    const assignments = await this.examAssignmentRepository.findByExamId(examId);
    const found = assignments.find((a: any) => a.candidateId === userId);

    if (!found) return null;

    return ExamCandidate.fromPersistence({
      id: found.id,
      examId: found.examId,
      candidateId: found.candidateId,
      status: found.status,
      assignedAt: found.assignedAt,
      completedAt: found.completedAt,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
    });
  }

  /**
   * Update exam candidate status
   */
  async updateStatus(id: string, status: ExamCandidateStatus): Promise<ExamCandidate> {
    // Map ExamCandidateStatus to backend status
    const statusMap: Record<ExamCandidateStatus, string> = {
      invited: 'pending',
      in_progress: 'in_progress',
      completed: 'completed',
      failed: 'failed',
    };

    // Get the assignment, update it, and convert back
    const assignment = await this.examAssignmentRepository.findById(id);
    if (!assignment) {
      throw new Error('Exam candidate not found');
    }

    // Use the repository's updateStatus if available
    if ('updateStatus' in this.examAssignmentRepository && typeof this.examAssignmentRepository.updateStatus === 'function') {
      const updated = await (this.examAssignmentRepository as any).updateStatus(id, statusMap[status] as any);
      return ExamCandidate.fromPersistence({
        id: updated.id,
        examId: updated.examId,
        candidateId: updated.candidateId,
        status: updated.status,
        assignedAt: updated.assignedAt,
        completedAt: updated.completedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
    }

    throw new Error('updateStatus not available on exam assignment repository');
  }

  /**
   * Delete exam candidate
   */
  async delete(id: string): Promise<void> {
    await this.examAssignmentRepository.delete(id);
  }

  /**
   * Check if exam candidate exists
   */
  async exists(id: string): Promise<boolean> {
    const candidate = await this.examAssignmentRepository.findById(id);
    return !!candidate;
  }
}

export default PostgresExamCandidateRepositoryAdapter;
