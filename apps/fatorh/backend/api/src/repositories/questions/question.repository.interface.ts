/**
 * Question Repository Interface
 */

import { Question, QuestionType } from '../../../domain/exams/exam.entity.js';

export interface ListQuestionFilters {
  examId?: string;
  type?: QuestionType;
  limit?: number;
  offset?: number;
}

export interface IQuestionRepository {
  /**
   * Create a new question
   */
  create(data: {
    examId: string;
    priority: number;
    text: string;
    type: QuestionType;
    weight?: string;
  }): Promise<Question>;

  /**
   * Get the maximum priority for questions in an exam
   * Returns 0 if no questions exist for the exam
   */
  getMaxPriority(examId: string): Promise<number>;

  /**
   * Find question by ID
   */
  findById(id: string): Promise<Question | null>;

  /**
   * Find questions by exam ID
   */
  findByExamId(examId: string): Promise<Question[]>;

  /**
   * List questions with filters
   */
  list(filters: ListQuestionFilters): Promise<{ questions: Question[]; total: number }>;

  /**
   * Create multiple questions for an exam
   */
  createBulk(data: Array<{
    examId: string;
    priority: number;
    text: string;
    type: QuestionType;
    weight?: string;
  }>): Promise<Question[]>;

  /**
   * Update question
   */
  update(id: string, data: {
    priority?: number;
    text?: string;
    type?: QuestionType;
    weight?: string;
  }): Promise<Question>;

  /**
   * Delete question
   */
  delete(id: string): Promise<void>;

  /**
   * Delete questions by exam ID
   */
  deleteByExamId(examId: string): Promise<void>;
}
