/**
 * Evaluations Domain Entities
 *
 * Domain entities for the evaluation system including:
 * - Candidate: Person being evaluated
 * - ExamAssignment: Assignment of an exam to a candidate
 * - Answer: Candidate's answer to a question
 * - EvaluationResult: Result of evaluating a candidate's exam
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

// =============================================================================
// CANDIDATE ENTITY
// =============================================================================

export type CandidateStatus = 'active' | 'inactive' | 'blocked';

export interface CandidateProps {
  id: string;
  workspaceId: string;
  name: string;
  email?: string;
  cpf?: string;
  externalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCandidateInput {
  workspaceId: string;
  name: string;
  email?: string;
  cpf?: string;
  externalId?: string;
}

export interface CandidateFilters {
  workspaceId?: string;
  cpf?: string;
  externalId?: string;
}

/**
 * Candidate Domain Entity
 *
 * Represents a person being evaluated in the system.
 */
export class Candidate extends Entity<CandidateProps> {
  protected props: CandidateProps;

  constructor(props: CandidateProps) {
    super(props.id);
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get cpf(): string | undefined {
    return this.props.cpf;
  }

  get externalId(): string | undefined {
    return this.props.externalId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Update candidate details
   */
  updateDetails(data: Partial<Omit<CreateCandidateInput, 'workspaceId'>>): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
    }
    if (data.email !== undefined) {
      this.props.email = data.email;
    }
    if (data.cpf !== undefined) {
      this.props.cpf = data.cpf;
    }
    if (data.externalId !== undefined) {
      this.props.externalId = data.externalId;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Candidate
   */
  static create(data: CreateCandidateInput & { id: string }): Candidate {
    return new Candidate({
      id: data.id,
      workspaceId: data.workspaceId,
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      externalId: data.externalId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: CandidateProps): Candidate {
    return new Candidate(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): CandidateProps {
    return { ...this.props };
  }
}

// =============================================================================
// EXAM ASSIGNMENT ENTITY
// =============================================================================

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface ExamAssignmentProps {
  id: string;
  candidateId: string;
  examId: string;
  status: AssignmentStatus;
  assignedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExamAssignmentInput {
  candidateId: string;
  examId: string;
  expiresAt?: Date;
}

/**
 * Exam Assignment Domain Entity
 *
 * Represents an exam assigned to a candidate.
 */
export class ExamAssignment extends Entity<ExamAssignmentProps> {
  protected props: ExamAssignmentProps;

  constructor(props: ExamAssignmentProps) {
    super(props.id);
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get candidateId(): string {
    return this.props.candidateId;
  }

  get examId(): string {
    return this.props.examId;
  }

  get status(): AssignmentStatus {
    return this.props.status;
  }

  get assignedAt(): Date {
    return this.props.assignedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if assignment is expired
   */
  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  /**
   * Mark assignment as in progress
   */
  markAsInProgress(): void {
    if (this.props.status === 'in_progress') return;

    if (this.isExpired()) {
      throw new Error('Cannot start an expired assignment');
    }

    this.props.status = 'in_progress';
    this.props.updatedAt = new Date();
  }

  /**
   * Mark assignment as completed
   */
  markAsCompleted(): void {
    if (this.props.status === 'completed') return;

    this.props.status = 'completed';
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Mark assignment as expired
   */
  markAsExpired(): void {
    if (this.props.status === 'expired') return;

    this.props.status = 'expired';
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Exam Assignment
   */
  static create(data: CreateExamAssignmentInput & { id: string }): ExamAssignment {
    return new ExamAssignment({
      id: data.id,
      candidateId: data.candidateId,
      examId: data.examId,
      status: 'pending',
      assignedAt: new Date(),
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: ExamAssignmentProps): ExamAssignment {
    return new ExamAssignment(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): ExamAssignmentProps {
    return { ...this.props };
  }
}

// =============================================================================
// ANSWER ENTITY
// =============================================================================

export interface AnswerProps {
  id: string;
  assignmentId: string;
  candidateId: string;
  examId: string;
  questionId: string;
  s3Url: string;
  duration: number;
  contentType: string;
  fileSize: number;
  isValid: boolean;
  transcription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnswerInput {
  assignmentId: string;
  candidateId: string;
  examId: string;
  questionId: string;
  s3Url: string;
  duration: number;
  contentType: string;
  fileSize: number;
}

/**
 * Answer Domain Entity
 *
 * Represents a candidate's answer to a question.
 * Stores the audio file reference for audio questions.
 */
export class Answer extends Entity<AnswerProps> {
  protected props: AnswerProps;

  constructor(props: AnswerProps) {
    super(props.id);
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get assignmentId(): string {
    return this.props.assignmentId;
  }

  get candidateId(): string {
    return this.props.candidateId;
  }

  get examId(): string {
    return this.props.examId;
  }

  get questionId(): string {
    return this.props.questionId;
  }

  get s3Url(): string {
    return this.props.s3Url;
  }

  get duration(): number {
    return this.props.duration;
  }

  get contentType(): string {
    return this.props.contentType;
  }

  get fileSize(): number {
    return this.props.fileSize;
  }

  get isValid(): boolean {
    return this.props.isValid;
  }

  get transcription(): string | undefined {
    return this.props.transcription;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Mark answer as valid
   */
  markAsValid(): void {
    this.props.isValid = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark answer as invalid
   */
  markAsInvalid(): void {
    this.props.isValid = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Set transcription
   */
  setTranscription(transcription: string): void {
    this.props.transcription = transcription;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Answer
   */
  static create(data: CreateAnswerInput & { id: string }): Answer {
    return new Answer({
      id: data.id,
      assignmentId: data.assignmentId,
      candidateId: data.candidateId,
      examId: data.examId,
      questionId: data.questionId,
      s3Url: data.s3Url,
      duration: data.duration,
      contentType: data.contentType,
      fileSize: data.fileSize,
      isValid: false, // Validated asynchronously
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: AnswerProps): Answer {
    return new Answer(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): AnswerProps {
    return { ...this.props };
  }
}

// =============================================================================
// EVALUATION RESULT ENTITY
// =============================================================================

export type CompletionStatus = 'completed' | 'partial' | 'failed';

export interface TranscriptionResult {
  questionId: string;
  questionText: string;
  transcription: string;
  confidence: number;
  duration: number;
}

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
  protected props: EvaluationResultProps;

  constructor(props: EvaluationResultProps) {
    super(props.id);
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

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
}
