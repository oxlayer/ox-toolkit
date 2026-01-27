/**
 * Exam Repository Interface
 */

import { Exam, CreateExamInput, ExamFilters } from '../../../domain/exams/exam.entity.js';

export interface IExamRepository {
  /**
   * Create a new exam
   */
  create(data: CreateExamInput): Promise<Exam>;

  /**
   * Find exam by ID
   */
  findById(id: string): Promise<Exam | null>;

  /**
   * Find exams by filters
   */
  find(filters: ExamFilters): Promise<Exam[]>;

  /**
   * Find exams by workspace ID
   */
  findByWorkspace(workspaceId: string): Promise<Exam[]>;

  /**
   * Update exam
   */
  update(id: string, data: Partial<CreateExamInput>): Promise<Exam>;

  /**
   * Delete exam
   */
  delete(id: string): Promise<void>;

  /**
   * Check if exam exists
   */
  exists(id: string): Promise<boolean>;
}
