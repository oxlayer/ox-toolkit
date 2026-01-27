/**
 * List Evaluation Results Use Case
 *
 * Business logic for listing evaluation results with optional filters.
 */

import type { IEvaluationResultRepository } from '../../repositories/evaluation-results/evaluation-result.repository.interface.js';

export interface ListEvaluationResultsInput {
  examId?: string;
  candidateId?: string;
  assignmentId?: string;
}

/**
 * List Evaluation Results Use Case
 */
export class ListEvaluationResultsUseCase {
  constructor(
    private evaluationResultRepository: IEvaluationResultRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: ListEvaluationResultsInput = {}) {
    let results: any[] = [];

    if (input.examId) {
      results = await this.evaluationResultRepository.findByExamId(input.examId);
    } else if (input.candidateId) {
      results = await this.evaluationResultRepository.findByCandidateId(input.candidateId);
    } else if (input.assignmentId) {
      const result = await this.evaluationResultRepository.findByAssignmentId(input.assignmentId);
      results = result ? [result] : [];
    } else {
      throw new Error('At least one filter (examId, candidateId, or assignmentId) is required');
    }

    // Map to persistence format for JSON serialization
    return {
      results: results.map(r => ({
        id: r.id,
        assignmentId: r.assignmentId,
        candidateId: r.candidateId,
        examId: r.examId,
        transcriptions: r.transcriptions,
        analysisResults: r.analysisResults,
        overallScore: r.overallScore,
        completionStatus: r.completionStatus,
        failureReason: r.failureReason,
        totalAnswers: r.totalAnswers,
        transcribedAnswers: r.transcribedAnswers,
        analyzedAnswers: r.analyzedAnswers,
        processingTimeMs: r.processingTimeMs,
        processedAt: r.processedAt,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      total: results.length,
    };
  }
}
