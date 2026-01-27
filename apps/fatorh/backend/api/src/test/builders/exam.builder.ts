/**
 * Exam Builder
 *
 * Test data builder for Exam entities using the Builder pattern.
 * Provides fluent API for creating test exams with sensible defaults.
 */

import { generateTestId } from '@oxlayer/foundation-testing-kit';
import { Exam, type ExamProps } from '../../domain/exams/exam.entity.js';
import type { Builder } from './builder.js';

/**
 * Exam data builder
 */
export class ExamBuilder implements Builder<Exam> {
  private _id: string = generateTestId('exam');
  private _workspaceId: string = generateTestId('workspace');
  private _examName: string = 'Test Exam';
  private _durationMinutes: number = 60;
  private _createdAt: Date = new Date();
  private _updatedAt: Date = new Date();

  /**
   * Set exam ID
   */
  withId(id: string): this {
    this._id = id;
    return this;
  }

  /**
   * Set exam name
   */
  withExamName(name: string): this {
    this._examName = name;
    return this;
  }

  /**
   * Set workspace ID
   */
  withWorkspaceId(workspaceId: string): this {
    this._workspaceId = workspaceId;
    return this;
  }

  /**
   * Set duration in minutes
   */
  withDuration(minutes: number): this {
    this._durationMinutes = minutes;
    return this;
  }

  /**
   * Build the exam
   */
  build(): Exam {
    return Exam.fromPersistence({
      id: this._id,
      workspaceId: this._workspaceId,
      examName: this._examName,
      durationMinutes: this._durationMinutes,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }
}

/**
 * Create an exam builder with defaults
 */
export function createExamBuilder(defaults?: Partial<ExamProps>): ExamBuilder {
  const builder = new ExamBuilder();
  if (defaults) {
    if (defaults.id) builder.withId(defaults.id);
    if (defaults.workspaceId) builder.withWorkspaceId(defaults.workspaceId);
    if (defaults.examName) builder.withExamName(defaults.examName);
    if (defaults.durationMinutes) builder.withDuration(defaults.durationMinutes);
  }
  return builder;
}
