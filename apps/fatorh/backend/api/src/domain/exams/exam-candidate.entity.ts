/**
 * Exam Candidate Domain Entity
 *
 * Maps to the exam_assignments table but represents the frontend's ExamCandidate concept.
 * The frontend uses "userId" but our backend uses "candidateId" (references candidates table).
 * The frontend uses "invitedAt" but our backend uses "assignedAt".
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

export type ExamCandidateStatus = 'invited' | 'in_progress' | 'completed' | 'failed';

// Backend status (evaluation_status): pending, in_progress, completed, partial, failed
// Frontend status (ExamCandidateStatus): invited, in_progress, completed, failed
function mapBackendStatusToFrontend(backendStatus: string): ExamCandidateStatus {
  switch (backendStatus) {
    case 'pending':
      return 'invited';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'partial':
      return 'in_progress';
    default:
      return 'invited';
  }
}

function mapFrontendStatusToBackend(frontendStatus: ExamCandidateStatus): string {
  switch (frontendStatus) {
    case 'invited':
      return 'pending';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
  }
}

/**
 * Exam Candidate Value Object
 */
export interface ExamCandidateProps {
  id: string;
  examId: string;
  userId: string; // Maps to candidateId in the database
  status: ExamCandidateStatus;
  invitedAt: Date; // Maps to assignedAt in the database
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Exam Candidate Domain Entity
 *
 * Represents a candidate assigned to an exam.
 * Maps between the frontend's ExamCandidate and backend's examAssignments table.
 */
export class ExamCandidate extends Entity<ExamCandidateProps> {
  declare props: ExamCandidateProps;

  get examId(): string {
    return this.props.examId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get status(): ExamCandidateStatus {
    return this.props.status;
  }

  get invitedAt(): Date {
    return this.props.invitedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  constructor(props: ExamCandidateProps) {
    super(props.id);
    this.props = props;
  }

  /**
   * Update candidate status
   */
  updateStatus(status: ExamCandidateStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
    if (status === 'completed') {
      this.props.completedAt = new Date();
    }
  }

  /**
   * Create a new Exam Candidate
   */
  static create(data: {
    examId: string;
    userId: string;
  }): ExamCandidate {
    return new ExamCandidate({
      id: '', // Will be set by repository
      examId: data.examId,
      userId: data.userId,
      status: 'invited',
      invitedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence (exam_assignments table)
   * Maps database fields to frontend-expected fields
   */
  static fromPersistence(data: {
    id: string;
    examId: string;
    candidateId: string;
    status: string;
    assignedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ExamCandidate {
    return new ExamCandidate({
      id: data.id,
      examId: data.examId,
      userId: data.candidateId, // Map candidateId → userId
      status: mapBackendStatusToFrontend(data.status), // Map status
      invitedAt: data.assignedAt, // Map assignedAt → invitedAt
      completedAt: data.completedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Convert to persistence format (exam_assignments table)
   * Maps frontend fields to database fields
   */
  toPersistence(): {
    id: string;
    examId: string;
    candidateId: string;
    status: string;
    assignedAt: Date;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.props.id,
      examId: this.props.examId,
      candidateId: this.props.userId, // Map userId → candidateId
      status: mapFrontendStatusToBackend(this.props.status), // Map status
      assignedAt: this.props.invitedAt, // Map invitedAt → assignedAt
      completedAt: this.props.completedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  /**
   * Convert to JSON for API responses
   * Called automatically by JSON.stringify()
   */
  toJSON(): ExamCandidateProps {
    return {
      id: this.props.id,
      examId: this.props.examId,
      userId: this.props.userId,
      status: this.props.status,
      invitedAt: this.props.invitedAt,
      completedAt: this.props.completedAt,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
