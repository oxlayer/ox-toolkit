/**
 * PostgreSQL Evaluation Result Repository Implementation
 */

import { eq } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { evaluationResults as evaluationResultsTable } from '../../db/schema.js';
import { EvaluationResult, CreateEvaluationResultInput } from '../../domain/evaluations/index.js';
import type { IEvaluationResultRepository } from './evaluation-result.repository.interface.js';

export class PostgresEvaluationResultRepository implements IEvaluationResultRepository {
  constructor(private db: any) {}

  /**
   * Create a new evaluation result
   */
  async create(data: CreateEvaluationResultInput & { id?: string }): Promise<EvaluationResult> {
    const id = data.id || generateId();

    const [row] = await this.db
      .insert(evaluationResultsTable)
      .values({
        id,
        assignmentId: data.assignmentId,
        candidateId: data.candidateId,
        examId: data.examId,
        transcriptions: data.transcriptions as any,
        analysisResults: data.analysisResults as any,
        overallScore: data.overallScore.toString(),
        completionStatus: data.completionStatus,
        failureReason: data.failureReason,
        totalAnswers: data.totalAnswers,
        transcribedAnswers: data.transcribedAnswers,
        analyzedAnswers: data.analyzedAnswers,
        processingTimeMs: data.processingTimeMs,
        processedAt: new Date(),
      })
      .returning();

    return EvaluationResult.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      transcriptions: row.transcriptions,
      analysisResults: row.analysisResults,
      overallScore: parseFloat(row.overallScore),
      completionStatus: row.completionStatus,
      failureReason: row.failureReason,
      totalAnswers: row.totalAnswers,
      transcribedAnswers: row.transcribedAnswers,
      analyzedAnswers: row.analyzedAnswers,
      processingTimeMs: row.processingTimeMs,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Find evaluation result by ID
   */
  async findById(id: string): Promise<EvaluationResult | null> {
    const [row] = await this.db
      .select()
      .from(evaluationResultsTable)
      .where(eq(evaluationResultsTable.id, id))
      .limit(1);

    if (!row) return null;

    return EvaluationResult.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      transcriptions: row.transcriptions,
      analysisResults: row.analysisResults,
      overallScore: parseFloat(row.overallScore),
      completionStatus: row.completionStatus,
      failureReason: row.failureReason,
      totalAnswers: row.totalAnswers,
      transcribedAnswers: row.transcribedAnswers,
      analyzedAnswers: row.analyzedAnswers,
      processingTimeMs: row.processingTimeMs,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Find evaluation results by candidate ID
   */
  async findByCandidateId(candidateId: string): Promise<EvaluationResult[]> {
    const rows = await this.db
      .select()
      .from(evaluationResultsTable)
      .where(eq(evaluationResultsTable.candidateId, candidateId));

    return rows.map((row: any) => EvaluationResult.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      transcriptions: row.transcriptions,
      analysisResults: row.analysisResults,
      overallScore: parseFloat(row.overallScore),
      completionStatus: row.completionStatus,
      failureReason: row.failureReason,
      totalAnswers: row.totalAnswers,
      transcribedAnswers: row.transcribedAnswers,
      analyzedAnswers: row.analyzedAnswers,
      processingTimeMs: row.processingTimeMs,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Find evaluation results by exam ID
   */
  async findByExamId(examId: string): Promise<EvaluationResult[]> {
    const rows = await this.db
      .select()
      .from(evaluationResultsTable)
      .where(eq(evaluationResultsTable.examId, examId));

    return rows.map((row: any) => EvaluationResult.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      transcriptions: row.transcriptions,
      analysisResults: row.analysisResults,
      overallScore: parseFloat(row.overallScore),
      completionStatus: row.completionStatus,
      failureReason: row.failureReason,
      totalAnswers: row.totalAnswers,
      transcribedAnswers: row.transcribedAnswers,
      analyzedAnswers: row.analyzedAnswers,
      processingTimeMs: row.processingTimeMs,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  /**
   * Find evaluation result by assignment ID
   */
  async findByAssignmentId(assignmentId: string): Promise<EvaluationResult | null> {
    const [row] = await this.db
      .select()
      .from(evaluationResultsTable)
      .where(eq(evaluationResultsTable.assignmentId, assignmentId))
      .limit(1);

    if (!row) return null;

    return EvaluationResult.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      transcriptions: row.transcriptions,
      analysisResults: row.analysisResults,
      overallScore: parseFloat(row.overallScore),
      completionStatus: row.completionStatus,
      failureReason: row.failureReason,
      totalAnswers: row.totalAnswers,
      transcribedAnswers: row.transcribedAnswers,
      analyzedAnswers: row.analyzedAnswers,
      processingTimeMs: row.processingTimeMs,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Update evaluation result
   */
  async update(id: string, data: Partial<CreateEvaluationResultInput>): Promise<EvaluationResult> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.analysisResults !== undefined) {
      updateData.analysisResults = data.analysisResults;
    }
    if (data.overallScore !== undefined) {
      updateData.overallScore = data.overallScore.toString();
    }
    if (data.completionStatus !== undefined) {
      updateData.completionStatus = data.completionStatus;
    }
    if (data.failureReason !== undefined) {
      updateData.failureReason = data.failureReason;
    }
    if (data.transcribedAnswers !== undefined) {
      updateData.transcribedAnswers = data.transcribedAnswers;
    }
    if (data.analyzedAnswers !== undefined) {
      updateData.analyzedAnswers = data.analyzedAnswers;
    }

    const [row] = await this.db
      .update(evaluationResultsTable)
      .set(updateData)
      .where(eq(evaluationResultsTable.id, id))
      .returning();

    return EvaluationResult.fromPersistence({
      id: row.id,
      assignmentId: row.assignmentId,
      candidateId: row.candidateId,
      examId: row.examId,
      transcriptions: row.transcriptions,
      analysisResults: row.analysisResults,
      overallScore: parseFloat(row.overallScore),
      completionStatus: row.completionStatus,
      failureReason: row.failureReason,
      totalAnswers: row.totalAnswers,
      transcribedAnswers: row.transcribedAnswers,
      analyzedAnswers: row.analyzedAnswers,
      processingTimeMs: row.processingTimeMs,
      processedAt: row.processedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /**
   * Delete evaluation result
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(evaluationResultsTable).where(eq(evaluationResultsTable.id, id));
  }
}

export default PostgresEvaluationResultRepository;
