/**
 * Get Evaluation Use Case
 *
 * Business logic for retrieving an evaluation result.
 */

import type { IEvaluationResultRepository } from '../../repositories/evaluation-results/evaluation-result.repository.interface.js';
import { EvaluationResult } from '../../domain/evaluations/index.js';

export interface GetEvaluationInput {
  id: string;
}

export interface GetEvaluationOutput {
  id: string;
  assignmentId: string;
  candidateId: string;
  examId: string;
  transcriptions: Array<{
    questionId: string;
    questionText: string;
    transcription: string;
    confidence: number;
    duration: number;
  }>;
  analysisResults: Array<{
    questionId: string;
    questionText: string;
    transcription: string;
    score: number;
    feedback: string;
    criteria: Array<{
      name: string;
      score: number;
      maxScore: number;
      feedback: string;
    }>;
  }>;
  overallScore: number;
  completionStatus: string;
  failureReason?: string;
  totalAnswers: number;
  transcribedAnswers: number;
  analyzedAnswers: number;
  processingTimeMs: number;
  processedAt: Date;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get Evaluation Use Case
 */
export class GetEvaluationUseCase {
  constructor(
    private evaluationResultRepository: IEvaluationResultRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: GetEvaluationInput): Promise<GetEvaluationOutput | null> {
    const evaluation = await this.evaluationResultRepository.findById(input.id);

    if (!evaluation) {
      return null;
    }

    return {
      id: evaluation.id,
      assignmentId: evaluation.assignmentId,
      candidateId: evaluation.candidateId,
      examId: evaluation.examId,
      transcriptions: evaluation.transcriptions,
      analysisResults: evaluation.analysisResults,
      overallScore: evaluation.overallScore,
      completionStatus: evaluation.completionStatus,
      failureReason: evaluation.failureReason,
      totalAnswers: evaluation.totalAnswers,
      transcribedAnswers: evaluation.transcribedAnswers,
      analyzedAnswers: evaluation.analyzedAnswers,
      processingTimeMs: evaluation.processingTimeMs,
      processedAt: evaluation.processedAt,
      completionPercentage: evaluation.getCompletionPercentage(),
      createdAt: evaluation.createdAt,
      updatedAt: evaluation.updatedAt,
    };
  }
}
