/**
 * Question Builder
 *
 * Test data builder for Question entities using the Builder pattern.
 * Provides fluent API for creating test questions with sensible defaults.
 */

import { generateTestId } from '@oxlayer/foundation-testing-kit';
import { Question, type QuestionProps, type QuestionType } from '../../domain/exams/question.entity.js';
import type { Builder } from './builder.js';

/**
 * Question data builder
 */
export class QuestionBuilder implements Builder<Question> {
  private _id: string = generateTestId('question');
  private _examId: string = generateTestId('exam');
  private _priority: number = 1;
  private _text: string = 'Test question';
  private _type: QuestionType = 'text';
  private _createdAt: Date = new Date();
  private _updatedAt: Date = new Date();

  /**
   * Set question ID
   */
  withId(id: string): this {
    this._id = id;
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
   * Set priority
   */
  withPriority(priority: number): this {
    this._priority = priority;
    return this;
  }

  /**
   * Set question text
   */
  withText(text: string): this {
    this._text = text;
    return this;
  }

  /**
   * Set question type to text
   */
  asText(): this {
    this._type = 'text';
    return this;
  }

  /**
   * Set question type to audio
   */
  asAudio(): this {
    this._type = 'audio';
    return this;
  }

  /**
   * Set question type
   */
  withType(type: QuestionType): this {
    this._type = type;
    return this;
  }

  /**
   * Build the question
   */
  build(): Question {
    return Question.fromPersistence({
      id: this._id,
      examId: this._examId,
      priority: this._priority,
      text: this._text,
      type: this._type,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }
}

/**
 * Create a question builder with defaults
 */
export function createQuestionBuilder(defaults?: Partial<QuestionProps>): QuestionBuilder {
  const builder = new QuestionBuilder();
  if (defaults) {
    if (defaults.id) builder.withId(defaults.id);
    if (defaults.examId) builder.withExamId(defaults.examId);
    if (defaults.priority) builder.withPriority(defaults.priority);
    if (defaults.text) builder.withText(defaults.text);
    if (defaults.type) builder.withType(defaults.type);
  }
  return builder;
}
