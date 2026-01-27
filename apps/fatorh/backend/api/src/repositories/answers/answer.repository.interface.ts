/**
 * Answer Repository Interface
 */

import { Answer, CreateAnswerInput } from '../../../domain/evaluations/index.js';

export interface ListAnswerFilters {
  assignmentId?: string;
  candidateId?: string;
  examId?: string;
  questionId?: string;
  isValid?: boolean;
  limit?: number;
  offset?: number;
}

export interface IAnswerRepository {
  /**
   * Create a new answer
   */
  create(data: CreateAnswerInput & { id?: string }): Promise<Answer>;

  /**
   * Find answer by ID
   */
  findById(id: string): Promise<Answer | null>;

  /**
   * Find answers by assignment ID
   */
  findByAssignmentId(assignmentId: string): Promise<Answer[]>;

  /**
   * Find answers by candidate ID
   */
  findByCandidateId(candidateId: string): Promise<Answer[]>;

  /**
   * Find answer by question ID
   */
  findByQuestionId(questionId: string): Promise<Answer>;

  /**
   * List answers with filters
   */
  list(filters: ListAnswerFilters): Promise<{ answers: Answer[]; total: number }>;

  /**
   * Update answer transcription
   */
  updateTranscription(id: string, transcription: string): Promise<Answer>;

  /**
   * Update answer
   */
  update(id: string, data: {
    transcription?: string;
    isValid?: boolean;
  }): Promise<Answer>;

  /**
   * Mark answer as valid
   */
  markAsValid(id: string): Promise<Answer>;

  /**
   * Mark answer as invalid
   */
  markAsInvalid(id: string): Promise<Answer>;

  /**
   * Delete answer
   */
  delete(id: string): Promise<void>;
}

export default IAnswerRepository;
