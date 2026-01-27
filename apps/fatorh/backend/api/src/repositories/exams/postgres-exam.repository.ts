/**
 * PostgreSQL Exam Repository Implementation
 */

import { eq, and, desc } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { exams as examsTable } from '../../db/schema.js';
import { Exam, CreateExamInput, ExamFilters } from '../../domain/exams/exam.entity.js';
import type { IExamRepository } from './exam.repository.interface.js';

export class PostgresExamRepository implements IExamRepository {
  constructor(private db: any) {}

  /**
   * Create a new exam
   */
  async create(data: CreateExamInput): Promise<Exam> {
    const id = data.id || generateId();

    const [examRow] = await this.db
      .insert(examsTable)
      .values({
        id,
        workspaceId: data.workspaceId,
        examName: data.examName,
        durationMinutes: data.durationMinutes || 30,
      })
      .returning();

    return Exam.fromPersistence({
      id: examRow.id,
      workspaceId: examRow.workspaceId,
      examName: examRow.examName,
      durationMinutes: examRow.durationMinutes,
      createdAt: examRow.createdAt,
      updatedAt: examRow.updatedAt,
    });
  }

  /**
   * Find exam by ID
   */
  async findById(id: string): Promise<Exam | null> {
    const [examRow] = await this.db
      .select()
      .from(examsTable)
      .where(eq(examsTable.id, id))
      .limit(1);

    if (!examRow) {
      return null;
    }

    return Exam.fromPersistence({
      id: examRow.id,
      workspaceId: examRow.workspaceId,
      examName: examRow.examName,
      durationMinutes: examRow.durationMinutes,
      createdAt: examRow.createdAt,
      updatedAt: examRow.updatedAt,
    });
  }

  /**
   * Find exams by filters
   */
  async find(filters: ExamFilters): Promise<Exam[]> {
    const conditions = [];

    if (filters.workspaceId) {
      conditions.push(eq(examsTable.workspaceId, filters.workspaceId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const examRows = await this.db
      .select()
      .from(examsTable)
      .where(whereClause)
      .orderBy(desc(examsTable.createdAt));

    return examRows.map((row: any) =>
      Exam.fromPersistence({
        id: row.id,
        workspaceId: row.workspaceId,
        examName: row.examName,
        durationMinutes: row.durationMinutes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Find exams by workspace ID
   */
  async findByWorkspace(workspaceId: string): Promise<Exam[]> {
    return this.find({ workspaceId });
  }

  /**
   * Update exam
   */
  async update(id: string, data: Partial<CreateExamInput>): Promise<Exam> {
    const [examRow] = await this.db
      .update(examsTable)
      .set({
        ...(data.examName && { examName: data.examName }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        updatedAt: new Date(),
      })
      .where(eq(examsTable.id, id))
      .returning();

    return Exam.fromPersistence({
      id: examRow.id,
      workspaceId: examRow.workspaceId,
      examName: examRow.examName,
      durationMinutes: examRow.durationMinutes,
      createdAt: examRow.createdAt,
      updatedAt: examRow.updatedAt,
    });
  }

  /**
   * Delete exam
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(examsTable).where(eq(examsTable.id, id));
  }

  /**
   * Check if exam exists
   */
  async exists(id: string): Promise<boolean> {
    const [exam] = await this.db
      .select({ id: examsTable.id })
      .from(examsTable)
      .where(eq(examsTable.id, id))
      .limit(1);

    return !!exam;
  }
}

// Export the class as default for dynamic import
export default PostgresExamRepository;
