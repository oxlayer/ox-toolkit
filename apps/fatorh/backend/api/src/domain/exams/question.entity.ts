/**
 * Question Domain Entity
 */

import { Entity } from '@oxlayer/foundation-domain-kit';

export type QuestionType = 'text' | 'audio';

/**
 * Question Value Object
 */
export interface QuestionProps {
  id: string;
  examId: string;
  priority: number;
  text: string;
  type: QuestionType;
  weight: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Question Domain Entity
 *
 * Represents a question within an exam.
 */
export class Question extends Entity<QuestionProps> {
  declare props: QuestionProps;

  get examId(): string {
    return this.props.examId;
  }

  get priority(): number {
    return this.props.priority;
  }

  get text(): string {
    return this.props.text;
  }

  get type(): QuestionType {
    return this.props.type;
  }

  get weight(): string {
    return this.props.weight;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  constructor(props: QuestionProps) {
    super(props.id);
    this.props = props;
  }

  /**
   * Update question priority
   */
  updatePriority(priority: number): void {
    this.props.priority = priority;
    this.props.updatedAt = new Date();
  }

  /**
   * Update question text
   */
  updateText(text: string): void {
    this.props.text = text;
    this.props.updatedAt = new Date();
  }

  /**
   * Create a new Question
   */
  static create(data: {
    id: string;
    examId: string;
    priority: number;
    text: string;
    type: QuestionType;
    weight?: string;
  }): Question {
    return new Question({
      id: data.id,
      examId: data.examId,
      priority: data.priority,
      text: data.text,
      type: data.type,
      weight: data.weight || 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(data: QuestionProps): Question {
    return new Question(data);
  }

  /**
   * Convert to persistence format
   */
  toPersistence(): QuestionProps {
    return { ...this.props };
  }

  /**
   * Convert to JSON for API responses
   * Called automatically by JSON.stringify()
   */
  toJSON(): QuestionProps {
    return this.toPersistence();
  }
}
