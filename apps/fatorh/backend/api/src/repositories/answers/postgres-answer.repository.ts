/**
 * PostgreSQL Answer Repository Implementation
 */

import { eq, and, count } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { answers as answersTable } from '../../db/schema.js';
import { Answer, CreateAnswerInput } from '../../domain/evaluations/index.js';
import type { IAnswerRepository, ListAnswerFilters } from './answer.repository.interface.js';

export class PostgresAnswerRepository implements IAnswerRepository {
  constructor(private db: any) {}

  /**
   * Create a new answer
   */
  async create(data: CreateAnswerInput & { id?: string }): Promise<Answer> {
    const id = data.id || generateId();

    const [row] = await this.db
      .insert(answersTable)
      .values({
        id,
        assignmentId: data.assignmentId,
        candidateId: data.candidateId,
        examId: data.examId,
        questionId: data.questionId,
        s3Url: data.s3Url,
        duration: data.duration.toString(),
        contentType: data.contentType,
        fileSize: data.fileSize.toString(),
        isValid: false,
      })
      .returning();

    return Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Find answer by ID
   */
  async findById(id: string): Promise<Answer | null> {
    const [row] = await this.db
      .select()
      .from(answersTable)
      .where(eq(answersTable.id, id))
      .limit(1);

    if (!row) return null;

    return Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Find answers by assignment ID
   */
  async findByAssignmentId(assignmentId: string): Promise<Answer[]> {
    const rows = await this.db
      .select()
      .from(answersTable)
      .where(eq(answersTable.assignmentId, assignmentId));

    return rows.map((row: any) => Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Find answers by candidate ID
   */
  async findByCandidateId(candidateId: string): Promise<Answer[]> {
    const rows = await this.db
      .select()
      .from(answersTable)
      .where(eq(answersTable.candidateId, candidateId));

    return rows.map((row: any) => Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Find answer by question ID
   */
  async findByQuestionId(questionId: string): Promise<Answer> {
    const [row] = await this.db
      .select()
      .from(answersTable)
      .where(eq(answersTable.questionId, questionId))
      .limit(1);

    if (!row) throw new Error('Answer not found');

    return Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * List answers with filters
   */
  async list(filters: ListAnswerFilters): Promise<{ answers: Answer[]; total: number }> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    // Build where conditions
    const conditions: any[] = [];
    if (filters.assignmentId) {
      conditions.push(eq(answersTable.assignmentId, filters.assignmentId));
    }
    if (filters.candidateId) {
      conditions.push(eq(answersTable.candidateId, filters.candidateId));
    }
    if (filters.examId) {
      conditions.push(eq(answersTable.examId, filters.examId));
    }
    if (filters.questionId) {
      conditions.push(eq(answersTable.questionId, filters.questionId));
    }
    if (filters.isValid !== undefined) {
      conditions.push(eq(answersTable.isValid, filters.isValid));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ value: total }] = await this.db
      .select({ value: count() })
      .from(answersTable)
      .where(whereClause);

    // Get answers
    const rows = await this.db
      .select()
      .from(answersTable)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    return {
      answers: rows.map((row: any) => Answer.fromPersistence({
        id: row.id,
        assignmentId: row.assignmentId,
        candidateId: row.candidateId,
        examId: row.examId,
        questionId: row.questionId,
        s3Url: row.s3Url,
        duration: parseFloat(row.duration),
        contentType: row.contentType,
        fileSize: parseFloat(row.fileSize),
        isValid: row.isValid,
        transcription: row.transcription,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      total: Number(total),
    };
  }

  /**
   * Update answer transcription
   */
  async updateTranscription(id: string, transcription: string): Promise<Answer> {
    const [row] = await this.db
      .update(answersTable)
      .set({
        transcription,
        updatedAt: new Date(),
      })
      .where(eq(answersTable.id, id))
      .returning();

    return Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Update answer
   */
  async update(id: string, data: {
    transcription?: string;
    isValid?: boolean;
  }): Promise<Answer> {
    const updates: any = {};
    if (data.transcription !== undefined) updates.transcription = data.transcription;
    if (data.isValid !== undefined) updates.isValid = data.isValid;

    const [row] = await this.db
      .update(answersTable)
      .set(updates)
      .where(eq(answersTable.id, id))
      .returning();

    return Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Mark answer as valid
   */
  async markAsValid(id: string): Promise<Answer> {
    const [row] = await this.db
      .update(answersTable)
      .set({
        isValid: true,
        updatedAt: new Date(),
      })
      .where(eq(answersTable.id, id))
      .returning();

    return Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Mark answer as invalid
   */
  async markAsInvalid(id: string): Promise<Answer> {
    const [row] = await this.db
      .update(answersTable)
      .set({
        isValid: false,
        updatedAt: new Date(),
      })
      .where(eq(answersTable.id, id))
      .returning();

    return Answer.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      questionId: row.questionId,
      s3Url: row.s3Url,
      duration: parseFloat(row.duration),
      contentType: row.contentType,
      fileSize: parseFloat(row.fileSize),
      isValid: row.isValid,
      transcription: row.transcription,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Delete answer
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(answersTable).where(eq(answersTable.id, id));
  }
}

export default PostgresAnswerRepository;
