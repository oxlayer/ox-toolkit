/**
 * Mock Evaluation Result Repository
 *
 * In-memory repository for testing without database.
 */

import { InMemoryRepository } from '@oxlayer/foundation-testing-kit';
import type { EvaluationResult } from '../../domain/evaluations/evaluation-result.entity.js';

export class MockEvaluationResultRepository extends InMemoryRepository<EvaluationResult, string> {
  protected getId(entity: EvaluationResult): string {
    return entity.id;
  }

  /**
   * Find evaluation result by ID
   */
  async findById(id: string): Promise<EvaluationResult | null> {
    return super.findById(id);
  }

  /**
   * Find evaluation result by assignment ID
   */
  async findByAssignment(assignmentId: string): Promise<EvaluationResult | null> {
    return this.findOne((evalResult) => evalResult.assignmentId === assignmentId);
  }

  /**
   * Find all evaluations for a candidate
   */
  async findByCandidate(candidateId: string): Promise<EvaluationResult[]> {
    return this.findMany((evalResult) => evalResult.candidateId === candidateId);
  }

  /**
   * Find all evaluations for an exam
   */
  async findByExam(examId: string): Promise<EvaluationResult[]> {
    return this.findMany((evalResult) => evalResult.examId === examId);
  }

  /**
   * Find latest evaluation for a candidate and exam
   */
  async findLatest(candidateId: string, examId: string): Promise<EvaluationResult | null> {
    const evaluations = this.findMany(
      (evalResult) => evalResult.candidateId === candidateId && evalResult.examId === examId
    );
    return evaluations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null;
  }

  /**
   * Find all evaluations by completion status
   */
  async findByStatus(status: 'completed' | 'partial' | 'failed'): Promise<EvaluationResult[]> {
    return this.findMany((evalResult) => evalResult.completionStatus === status);
  }
}
