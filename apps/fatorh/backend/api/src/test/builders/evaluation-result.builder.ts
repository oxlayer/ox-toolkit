/**
 * Evaluation Result Builder
 *
 * Test data builder for EvaluationResult entities using the Builder pattern.
 * Provides fluent API for creating test evaluation results with sensible defaults.
 */

import { generateTestId } from '@oxlayer/foundation-testing-kit';
import { EvaluationResult, type EvaluationResultProps, type CompletionStatus } from '../../domain/evaluations/evaluation-result.entity.js';
import type { Builder } from './builder.js';

/**
 * Evaluation Result data builder
 */
export class EvaluationResultBuilder implements Builder<EvaluationResult> {
  private _id: string = generateTestId('evaluation');
  private _assignmentId: string = generateTestId('assignment');
  private _candidateId: string = generateTestId('candidate');
  private _examId: string = generateTestId('exam');
  private _transcriptions: EvaluationResultProps['transcriptions'] = [];
  private _analysisResults: EvaluationResultProps['analysisResults'] = [];
  private _overallScore: number = 0;
  private _completionStatus: CompletionStatus = 'completed';
  private _failureReason: string | undefined = undefined;
  private _totalAnswers: number = 0;
  private _transcribedAnswers: number = 0;
  private _analyzedAnswers: number = 0;
  private _processingTimeMs: number = 0;
  private _processedAt: Date = new Date();
  private _createdAt: Date = new Date();
  private _updatedAt: Date = new Date();

  /**
   * Set evaluation ID
   */
  withId(id: string): this {
    this._id = id;
    return this;
  }

  /**
   * Set assignment ID
   */
  withAssignmentId(assignmentId: string): this {
    this._assignmentId = assignmentId;
    return this;
  }

  /**
   * Set candidate ID
   */
  withCandidateId(candidateId: string): this {
    this._candidateId = candidateId;
    return this;
  }

  /**
   * Set exam ID
   */
  withExamId(examId: string): this {
    this._examId = examId;
    return this;
  }

  /**
   * Set overall score
   */
  withScore(score: number): this {
    this._overallScore = score;
    return this;
  }

  /**
   * Set completion status
   */
  withStatus(status: CompletionStatus): this {
    this._completionStatus = status;
    return this;
  }

  /**
   * Mark as completed
   */
  completed(): this {
    return this.withStatus('completed');
  }

  /**
   * Mark as partial
   */
  partial(): this {
    return this.withStatus('partial');
  }

  /**
   * Mark as failed
   */
  failed(reason: string): this {
    this._completionStatus = 'failed';
    this._failureReason = reason;
    return this;
  }

  /**
   * Set total answers
   */
  withTotalAnswers(count: number): this {
    this._totalAnswers = count;
    return this;
  }

  /**
   * Set transcribed answers
   */
  withTranscribedAnswers(count: number): this {
    this._transcribedAnswers = count;
    return this;
  }

  /**
   * Set analyzed answers
   */
  withAnalyzedAnswers(count: number): this {
    this._analyzedAnswers = count;
    return this;
  }

  /**
   * Set processing time
   */
  withProcessingTime(ms: number): this {
    this._processingTimeMs = ms;
    return this;
  }

  /**
   * Build the evaluation result
   */
  build(): EvaluationResult {
    return EvaluationResult.fromPersistence({
      id: this._id,
      assignmentId: this._assignmentId,
      candidateId: this._candidateId,
      examId: this._examId,
      transcriptions: this._transcriptions,
      analysisResults: this._analysisResults,
      overallScore: this._overallScore,
      completionStatus: this._completionStatus,
      failureReason: this._failureReason,
      totalAnswers: this._totalAnswers,
      transcribedAnswers: this._transcribedAnswers,
      analyzedAnswers: this._analyzedAnswers,
      processingTimeMs: this._processingTimeMs,
      processedAt: this._processedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }
}

/**
 * Create an evaluation result builder with defaults
 */
export function createEvaluationResultBuilder(defaults?: Partial<EvaluationResultProps>): EvaluationResultBuilder {
  const builder = new EvaluationResultBuilder();
  if (defaults) {
    if (defaults.id) builder.withId(defaults.id);
    if (defaults.assignmentId) builder.withAssignmentId(defaults.assignmentId);
    if (defaults.candidateId) builder.withCandidateId(defaults.candidateId);
    if (defaults.examId) builder.withExamId(defaults.examId);
    if (defaults.overallScore !== undefined) builder.withScore(defaults.overallScore);
    if (defaults.completionStatus) builder.withStatus(defaults.completionStatus);
    if (defaults.totalAnswers !== undefined) builder.withTotalAnswers(defaults.totalAnswers);
    if (defaults.transcribedAnswers !== undefined) builder.withTranscribedAnswers(defaults.transcribedAnswers);
    if (defaults.analyzedAnswers !== undefined) builder.withAnalyzedAnswers(defaults.analyzedAnswers);
    if (defaults.processingTimeMs !== undefined) builder.withProcessingTime(defaults.processingTimeMs);
  }
  return builder;
}
