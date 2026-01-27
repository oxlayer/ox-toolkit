/**
 * Evaluation Result Repository Interface
 */

import { EvaluationResult, CreateEvaluationResultInput, CompletionStatus } from '../../../domain/evaluations/index.js';

export interface IEvaluationResultRepository {
  /**
   * Create a new evaluation result
   */
  create(data: CreateEvaluationResultInput & { id?: string }): Promise<EvaluationResult>;

  /**
   * Find evaluation result by ID
   */
  findById(id: string): Promise<EvaluationResult | null>;

  /**
   * Find evaluation results by candidate ID
   */
  findByCandidateId(candidateId: string): Promise<EvaluationResult[]>;

  /**
   * Find evaluation results by exam ID
   */
  findByExamId(examId: string): Promise<EvaluationResult[]>;

  /**
   * Find evaluation result by assignment ID
   */
  findByAssignmentId(assignmentId: string): Promise<EvaluationResult | null>;

  /**
   * Update evaluation result
   */
  update(id: string, data: Partial<CreateEvaluationResultInput>): Promise<EvaluationResult>;

  /**
   * Delete evaluation result
   */
  delete(id: string): Promise<void>;
}

export default IEvaluationResultRepository;
