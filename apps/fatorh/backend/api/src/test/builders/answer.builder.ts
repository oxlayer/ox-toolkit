/**
 * Answer Builder
 *
 * Test data builder for Answer entities using the Builder pattern.
 * Provides fluent API for creating test answers with sensible defaults.
 */

import { generateTestId } from '@oxlayer/foundation-testing-kit';
import { Answer, type AnswerProps, type CreateAnswerInput } from '../../domain/evaluations/index.js';
import type { Builder } from './builder.js';

/**
 * Answer data builder
 */
export class AnswerBuilder implements Builder<Answer> {
  private _id: string = generateTestId('answer');
  private _assignmentId: string = generateTestId('assignment');
  private _candidateId: string = generateTestId('candidate');
  private _examId: string = generateTestId('exam');
  private _questionId: string = generateTestId('question');
  private _s3Url: string = 'https://s3.amazonaws.com/bucket/answer.mp3';
  private _duration: number = 30;
  private _contentType: string = 'audio/mp3';
  private _fileSize: number = 102400;
  private _isValid: boolean = false;
  private _transcription: string | undefined = undefined;
  private _createdAt: Date = new Date();
  private _updatedAt: Date = new Date();

  /**
   * Set answer ID
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
   * Set question ID
   */
  withQuestionId(questionId: string): this {
    this._questionId = questionId;
    return this;
  }

  /**
   * Set S3 URL
   */
  withS3Url(s3Url: string): this {
    this._s3Url = s3Url;
    return this;
  }

  /**
   * Set duration in seconds
   */
  withDuration(duration: number): this {
    this._duration = duration;
    return this;
  }

  /**
   * Set content type
   */
  withContentType(contentType: string): this {
    this._contentType = contentType;
    return this;
  }

  /**
   * Set file size in bytes
   */
  withFileSize(fileSize: number): this {
    this._fileSize = fileSize;
    return this;
  }

  /**
   * Mark answer as valid
   */
  withValid(): this {
    this._isValid = true;
    return this;
  }

  /**
   * Mark answer as invalid
   */
  withInvalid(): this {
    this._isValid = false;
    return this;
  }

  /**
   * Set transcription
   */
  withTranscription(transcription: string): this {
    this._transcription = transcription;
    return this;
  }

  /**
   * Build the answer
   */
  build(): Answer {
    return Answer.fromPersistence({
      id: this._id,
      assignmentId: this._assignmentId,
      candidateId: this._candidateId,
      examId: this._examId,
      questionId: this._questionId,
      s3Url: this._s3Url,
      duration: this._duration,
      contentType: this._contentType,
      fileSize: this._fileSize,
      isValid: this._isValid,
      transcription: this._transcription,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }
}

/**
 * Create an answer builder with defaults
 */
export function createAnswerBuilder(defaults?: Partial<AnswerProps>): AnswerBuilder {
  const builder = new AnswerBuilder();
  if (defaults) {
    if (defaults.id) builder.withId(defaults.id);
    if (defaults.assignmentId) builder.withAssignmentId(defaults.assignmentId);
    if (defaults.candidateId) builder.withCandidateId(defaults.candidateId);
    if (defaults.examId) builder.withExamId(defaults.examId);
    if (defaults.questionId) builder.withQuestionId(defaults.questionId);
    if (defaults.s3Url) builder.withS3Url(defaults.s3Url);
    if (defaults.duration) builder.withDuration(defaults.duration);
    if (defaults.contentType) builder.withContentType(defaults.contentType);
    if (defaults.fileSize) builder.withFileSize(defaults.fileSize);
    if (defaults.isValid !== undefined) {
      if (defaults.isValid) {
        builder.withValid();
      } else {
        builder.withInvalid();
      }
    }
    if (defaults.transcription) builder.withTranscription(defaults.transcription);
  }
  return builder;
}
