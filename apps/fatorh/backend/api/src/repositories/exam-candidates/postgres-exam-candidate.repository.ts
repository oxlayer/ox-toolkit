/**
 * PostgreSQL Exam Candidate Repository Implementation
 *
 * Maps between the frontend's ExamCandidate and the backend's exam_assignments table.
 */

import { eq, and, desc } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { examAssignments } from '../../db/schema.js';
import { ExamCandidate, ExamCandidateStatus } from '../../domain/exams/exam-candidate.entity.js';
import type { IExamCandidateRepository } from './exam-candidate.repository.interface.js';

export class PostgresExamCandidateRepository implements IExamCandidateRepository {
  constructor(private db: any) {}

  /**
   * Create a new exam candidate (assignment)
   */
  async create(data: {
    examId: string;
    candidateId: string;
    userId: string;
  }): Promise<ExamCandidate> {
    const now = new Date();

    const [assignmentRow] = await this.db
      .insert(examAssignments)
      .values({
        id: generateId(),
        candidateId: data.candidateId, // Use the actual candidate ID from candidates table
        examId: data.examId,
        status: 'pending', // Default status
        assignedAt: now,
      })
      .returning();

    return ExamCandidate.fromPersistence({
      id: assignmentRow.id,
      examId: assignmentRow.examId,
      candidateId: assignmentRow.candidateId,
      status: assignmentRow.status,
      assignedAt: assignmentRow.assignedAt,
      completedAt: assignmentRow.completedAt,
      createdAt: assignmentRow.createdAt,
      updatedAt: assignmentRow.updatedAt,
    });
  }
      updatedAt: assignmentRow.updatedAt,
    });
  }

  /**
   * Find exam candidate by ID
   */
  async findById(id: string): Promise<ExamCandidate | null> {
    const [assignmentRow] = await this.db
      .select()
      .from(examAssignments)
      .where(eq(examAssignments.id, id))
      .limit(1);

    if (!assignmentRow) {
      return null;
    }

    return ExamCandidate.fromPersistence({
      id: assignmentRow.id,
      examId: assignmentRow.examId,
      candidateId: assignmentRow.candidateId,
      status: assignmentRow.status,
      assignedAt: assignmentRow.assignedAt,
      completedAt: assignmentRow.completedAt,
      createdAt: assignmentRow.createdAt,
      updatedAt: assignmentRow.updatedAt,
    });
  }

  /**
   * Find exam candidates by exam ID
   */
  async findByExamId(examId: string): Promise<ExamCandidate[]> {
    const assignmentRows = await this.db
      .select()
      .from(examAssignments)
      .where(eq(examAssignments.examId, examId))
      .orderBy(desc(examAssignments.assignedAt));

    return assignmentRows.map((row: any) =>
      ExamCandidate.fromPersistence({
        id: row.id,
        examId: row.examId,
        candidateId: row.candidateId,
        status: row.status,
        assignedAt: row.assignedAt,
        completedAt: row.completedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Find exam candidates by user ID
   */
  async findByUserId(userId: string): Promise<ExamCandidate[]> {
    const assignmentRows = await this.db
      .select()
      .from(examAssignments)
      .where(eq(examAssignments.candidateId, userId))
      .orderBy(desc(examAssignments.assignedAt));

    return assignmentRows.map((row: any) =>
      ExamCandidate.fromPersistence({
        id: row.id,
        examId: row.examId,
        candidateId: row.candidateId,
        status: row.status,
        assignedAt: row.assignedAt,
        completedAt: row.completedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Find exam candidate by exam and user
   */
  async findByExamAndUser(examId: string, userId: string): Promise<ExamCandidate | null> {
    const [assignmentRow] = await this.db
      .select()
      .from(examAssignments)
      .where(and(
        eq(examAssignments.examId, examId),
        eq(examAssignments.candidateId, userId)
      ))
      .limit(1);

    if (!assignmentRow) {
      return null;
    }

    return ExamCandidate.fromPersistence({
      id: assignmentRow.id,
      examId: assignmentRow.examId,
      candidateId: assignmentRow.candidateId,
      status: assignmentRow.status,
      assignedAt: assignmentRow.assignedAt,
      completedAt: assignmentRow.completedAt,
      createdAt: assignmentRow.createdAt,
      updatedAt: assignmentRow.updatedAt,
    });
  }

  /**
   * Update exam candidate status
   */
  async updateStatus(id: string, status: ExamCandidateStatus): Promise<ExamCandidate> {
    const entity = ExamCandidate.create({ examId: '', userId: '' });
    entity.updateStatus(status);
    const persistenceData = entity.toPersistence();

    const [assignmentRow] = await this.db
      .update(examAssignments)
      .set({
        status: persistenceData.status,
        completedAt: persistenceData.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(examAssignments.id, id))
      .returning();

    return ExamCandidate.fromPersistence({
      id: assignmentRow.id,
      examId: assignmentRow.examId,
      candidateId: assignmentRow.candidateId,
      status: assignmentRow.status,
      assignedAt: assignmentRow.assignedAt,
      completedAt: assignmentRow.completedAt,
      createdAt: assignmentRow.createdAt,
      updatedAt: assignmentRow.updatedAt,
    });
  }

  /**
   * Delete exam candidate
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(examAssignments).where(eq(examAssignments.id, id));
  }

  /**
   * Check if exam candidate exists
   */
  async exists(id: string): Promise<boolean> {
    const [assignment] = await this.db
      .select({ id: examAssignments.id })
      .from(examAssignments)
      .where(eq(examAssignments.id, id))
      .limit(1);

    return !!assignment;
  }
}

// Export the class as default for dynamic import
export default PostgresExamCandidateRepository;
