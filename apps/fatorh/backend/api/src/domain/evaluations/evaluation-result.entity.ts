/**
 * Evaluation Result Domain Entity
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

/**
 * Transcription Result Value Object
 */
export interface TranscriptionResult {
  questionId: string;
  questionText: string;
  transcription: string;
  confidence: number;
  duration: number;
}

/**
 * Analysis Result Value Object
 */
export interface AnalysisResult {
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
}

/**
 * Completion Status type
 */
export type CompletionStatus = 'completed' | 'partial' | 'failed';

/**
 * Evaluation Result Props
 */
export interface EvaluationResultProps {
  id: string;
  assignmentId: string;
  candidateId: string;
  examId: string;
  transcriptions: TranscriptionResult[];
  analysisResults: AnalysisResult[];
  overallScore: number;
  completionStatus: CompletionStatus;
  failureReason?: string;
  totalAnswers: number;
  transcribedAnswers: number;
  analyzedAnswers: number;
  processingTimeMs: number;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create Evaluation Result Input
 */
export interface CreateEvaluationResultInput {
  assignmentId: string;
  candidateId: string;
  examId: string;
  transcriptions: TranscriptionResult[];
  analysisResults: AnalysisResult[];
  overallScore: number;
  completionStatus: CompletionStatus;
  failureReason?: string;
  totalAnswers: number;
  transcribedAnswers: number;
  analyzedAnswers: number;
  processingTimeMs: number;
}

/**
 * Evaluation Result Domain Entity
 *
 * Represents the result of evaluating a candidate's exam.
 * Contains transcriptions, analysis results, and scores.
 */
export class EvaluationResult extends Entity<EvaluationResultProps> {
  declare props: EvaluationResultProps;

  get assignmentId(): string {
    return this.props.assignmentId;
  }

  get candidateId(): string {
    return this.props.candidateId;
  }

  get examId(): string {
    return this.props.examId;
  }

  get transcriptions(): TranscriptionResult[] {
    return this.props.transcriptions;
  }

  get analysisResults(): AnalysisResult[] {
    return this.props.analysisResults;
  }

  get overallScore(): number {
    return this.props.overallScore;
  }

  get completionStatus(): CompletionStatus {
    return this.props.completionStatus;
  }

  get failureReason(): string | undefined {
    return this.props.failureReason;
  }

  get totalAnswers(): number {
    return this.props.totalAnswers;
  }

  get transcribedAnswers(): number {
    return this.props.transcribedAnswers;
  }

  get analyzedAnswers(): number {
    return this.props.analyzedAnswers;
  }

  get processingTimeMs(): number {
    return this.props.processingTimeMs;
  }

  get processedAt(): Date {
    return this.props.processedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  constructor(props: EvaluationResultProps) {
    super(props.id);
    this.props = props;
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    if (this.props.totalAnswers === 0) return 0;
    return Math.round((this.props.analyzedAnswers / this.props.totalAnswers) * 100);
  }

  /**
   * Check if evaluation completed successfully
   */
  isSuccessful(): boolean {
    return this.props.completionStatus === 'completed';
  }

  /**
   * Check if evaluation partially completed
   */
  isPartial(): boolean {
    return this.props.completionStatus === 'partial';
  }

  /**
   * Check if evaluation failed
   */
  isFailed(): boolean {
    return this.props.completionStatus === 'failed';
  }

  /**
   * Update analysis results
   */
  updateAnalysis(data: Partial<CreateEvaluationResultInput>): void {
    if (data.analysisResults !== undefined) {
      this.props.analysisResults = data.analysisResults;
    }
    if (data.overallScore !== undefined) {
      this.props.overallScore = data.overallScore;
    }
    if (data.completionStatus !== undefined) {
      this.props.completionStatus = data.completionStatus;
    }
    if (data.failureReason !== undefined) {
      this.props.failureReason = data.failureReason;
    }
    if (data.transcribedAnswers !== undefined) {
      this.props.transcribedAnswers = data.transcribedAnswers;
    }
    if (data.analyzedAnswers !== undefined) {
      this.props.analyzedAnswers = data.analyzedAnswers;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Evaluation Result
   */
  static create(data: CreateEvaluationResultInput & { id: string }): EvaluationResult {
    return new EvaluationResult({
      id: data.id,
      assignmentId: data.assignmentId,
      candidateId: data.candidateId,
      examId: data.examId,
      transcriptions: data.transcriptions,
      analysisResults: data.analysisResults,
      overallScore: data.overallScore,
      completionStatus: data.completionStatus,
      failureReason: data.failureReason,
      totalAnswers: data.totalAnswers,
      transcribedAnswers: data.transcribedAnswers,
      analyzedAnswers: data.analyzedAnswers,
      processingTimeMs: data.processingTimeMs,
      processedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: EvaluationResultProps): EvaluationResult {
    return new EvaluationResult(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): EvaluationResultProps {
    return { ...this.props };
  }

  /**
   * Convert to JSON for API responses
   * Called automatically by JSON.stringify()
   */
  toJSON(): EvaluationResultProps {
    return this.toPersistence();
  }
}
