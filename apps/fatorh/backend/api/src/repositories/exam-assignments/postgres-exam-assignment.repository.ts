/**
 * PostgreSQL Exam Assignment Repository Implementation
 */

import { eq, and } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { examAssignments as examAssignmentsTable } from '../../db/schema.js';
import { ExamAssignment, CreateExamAssignmentInput, AssignmentStatus } from '../../domain/evaluations/index.js';
import type { IExamAssignmentRepository } from './exam-assignment.repository.interface.js';

export class PostgresExamAssignmentRepository implements IExamAssignmentRepository {
  constructor(private db: any) {}

  /**
   * Create a new exam assignment
   */
  async create(data: CreateExamAssignmentInput & { id?: string }): Promise<ExamAssignment> {
    const id = data.id || generateId();

    const [assignmentRow] = await this.db
      .insert(examAssignmentsTable)
      .values({
        id,
        candidateId: data.candidateId,
        examId: data.examId,
        status: 'pending',
        assignedAt: new Date(),
        expiresAt: data.expiresAt,
      })
      .returning();

    return ExamAssignment.fromPersistence({
      id: assignmentRow.id,
      candidateId: assignmentRow.candidateId,
      examId: assignmentRow.examId,
      status: assignmentRow.status,
      assignedAt: assignmentRow.assignedAt,
      completedAt: assignmentRow.completedAt,
      expiresAt: assignmentRow.expiresAt,
      createdAt: assignmentRow.createdAt,
      updatedAt: assignmentRow.updatedAt,
    });
  }

  /**
   * Find assignment by ID
   */
  async findById(id: string): Promise<ExamAssignment | null> {
    const [row] = await this.db
      .select()
      .from(examAssignmentsTable)
      .where(eq(examAssignmentsTable.id, id))
      .limit(1);

    if (!row) return null;

    return ExamAssignment.fromPersistence({
      id: row.id,
      candidateId: row.candidateId,
      examId: row.examId,
      status: row.status,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Find assignments by candidate ID
   */
  async findByCandidateId(candidateId: string): Promise<ExamAssignment[]> {
    const rows = await this.db
      .select()
      .from(examAssignmentsTable)
      .where(eq(examAssignmentsTable.candidateId, candidateId));

    return rows.map((row: any) => ExamAssignment.fromPersistence({
      id: row.id,
      candidateId: row.candidateId,
      examId: row.examId,
      status: row.status,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Find assignments by exam ID
   */
  async findByExamId(examId: string): Promise<ExamAssignment[]> {
    const rows = await this.db
      .select()
      .from(examAssignmentsTable)
      .where(eq(examAssignmentsTable.examId, examId));

    return rows.map((row: any) => ExamAssignment.fromPersistence({
      id: row.id,
      candidateId: row.candidateId,
      examId: row.examId,
      status: row.status,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Find all assignments
   */
  async findAll(): Promise<ExamAssignment[]> {
    const rows = await this.db
      .select()
      .from(examAssignmentsTable);

    return rows.map((row: any) => ExamAssignment.fromPersistence({
      id: row.id,
      candidateId: row.candidateId,
      examId: row.examId,
      status: row.status,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Find pending or in-progress assignments
   */
  async findPendingByCandidate(candidateId: string): Promise<ExamAssignment[]> {
    const rows = await this.db
      .select()
      .from(examAssignmentsTable)
      .where(
        and(
          eq(examAssignmentsTable.candidateId, candidateId),
          eq(examAssignmentsTable.status, 'pending' as any)
        )
      );

    return rows.map((row: any) => ExamAssignment.fromPersistence({
      id: row.id,
      candidateId: row.candidateId,
      examId: row.examId,
      status: row.status,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Update assignment status
   */
  async updateStatus(id: string, status: AssignmentStatus): Promise<ExamAssignment> {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [row] = await this.db
      .update(examAssignmentsTable)
      .set(updateData)
      .where(eq(examAssignmentsTable.id, id))
      .returning();

    return ExamAssignment.fromPersistence({
      id: row.id,
      candidateId: row.candidateId,
      examId: row.examId,
      status: row.status,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Delete assignment
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(examAssignmentsTable).where(eq(examAssignmentsTable.id, id));
  }
}

export default PostgresExamAssignmentRepository;
