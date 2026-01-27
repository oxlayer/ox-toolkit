/**
 * Exam Domain Entity
 */

import { Entity } from '@oxlayer/foundation-domain-kit';
import type { QuestionType, QuestionProps } from './question.entity.js';
export type { QuestionType, QuestionProps } from './question.entity.js';

/**
 * Exam Entity Props
 */
export interface ExamProps {
  id: string;
  workspaceId: string;
  examName: string;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input/Output Value Objects
 */
export interface CreateExamInput {
  id?: string;
  workspaceId: string;
  examName: string;
  durationMinutes?: number;
  questions: Array<{
    priority: number;
    text: string;
    type: QuestionType;
  }>;
}

export interface UpdateExamInput {
  examName?: string;
  durationMinutes?: number;
}

export interface ExamFilters {
  workspaceId?: string;
}

/**
 * Exam Domain Entity
 *
 * Represents an evaluation exam within a program.
 * An exam contains multiple questions that candidates must answer.
 */
export class Exam extends Entity<ExamProps> {
  declare props: ExamProps;

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get examName(): string {
    return this.props.examName;
  }

  get durationMinutes(): number {
    return this.props.durationMinutes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  constructor(props: ExamProps) {
    super(props.id);
    this.props = props;
  }

  /**
   * Update exam details
   */
  updateDetails(data: UpdateExamInput): void {
    if (data.examName !== undefined) {
      this.props.examName = data.examName;
    }
    if (data.durationMinutes !== undefined) {
      if (data.durationMinutes < 1 || data.durationMinutes > 120) {
        throw new Error('Duration must be between 1 and 120 minutes');
      }
      this.props.durationMinutes = data.durationMinutes;
    }
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Exam
   */
  static create(data: {
    id: string;
    workspaceId: string;
    examName: string;
    durationMinutes?: number;
  }): Exam {
    return new Exam({
      id: data.id,
      workspaceId: data.workspaceId,
      examName: data.examName,
      durationMinutes: data.durationMinutes || 30,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: ExamProps): Exam {
    return new Exam(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): ExamProps {
    return { ...this.props };
  }

  /**
   * Convert to JSON for API responses
   * Called automatically by JSON.stringify()
   */
  toJSON(): ExamProps {
    return this.toPersistence();
  }
}
