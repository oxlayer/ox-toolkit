/**
 * Mock Answer Repository
 *
 * In-memory repository for testing without database.
 */

import { InMemoryRepository } from '@oxlayer/foundation-testing-kit';
import { Answer } from '../../domain/evaluations/index.js';
import type { IAnswerRepository, ListAnswerFilters } from '../../repositories/answers/answer.repository.interface.js';

export class MockAnswerRepository extends InMemoryRepository<Answer, string> implements IAnswerRepository {
  protected getId(entity: Answer): string {
    return entity.id;
  }

  /**
   * Create a new answer
   */
  async create(data: any): Promise<Answer> {
    const answer = Answer.fromPersistence({
      id: data.id || crypto.randomUUID(),
      assignmentId: data.assignmentId,
      candidateId: data.candidateId,
      examId: data.examId,
      questionId: data.questionId,
      s3Url: data.s3Url,
      duration: data.duration,
      contentType: data.contentType,
      fileSize: data.fileSize,
      isValid: false,
      transcription: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.save(answer);
    return answer;
  }

  /**
   * Find answer by ID
   */
  async findById(id: string): Promise<Answer | null> {
    return super.findById(id);
  }

  /**
   * Find answers by assignment ID
   */
  async findByAssignmentId(assignmentId: string): Promise<Answer[]> {
    return this.findMany((a) => a.assignmentId === assignmentId);
  }

  /**
   * Find answers by candidate ID
   */
  async findByCandidateId(candidateId: string): Promise<Answer[]> {
    return this.findMany((a) => a.candidateId === candidateId);
  }

  /**
   * Find answer by question ID
   */
  async findByQuestionId(questionId: string): Promise<Answer> {
    const answer = this.findOne((a) => a.questionId === questionId);
    if (!answer) {
      throw new Error('Answer not found');
    }
    return answer;
  }

  /**
   * List answers with filters
   */
  async list(filters: ListAnswerFilters): Promise<{ answers: Answer[]; total: number }> {
    let answers = this.getAll();

    if (filters.assignmentId) {
      answers = answers.filter((a) => a.assignmentId === filters.assignmentId);
    }
    if (filters.candidateId) {
      answers = answers.filter((a) => a.candidateId === filters.candidateId);
    }
    if (filters.examId) {
      answers = answers.filter((a) => a.examId === filters.examId);
    }
    if (filters.questionId) {
      answers = answers.filter((a) => a.questionId === filters.questionId);
    }
    if (filters.isValid !== undefined) {
      answers = answers.filter((a) => a.isValid === filters.isValid);
    }

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 50;

    const total = answers.length;
    const paginatedAnswers = answers.slice(offset, offset + limit);

    return {
      answers: paginatedAnswers,
      total,
    };
  }

  /**
   * Update answer transcription
   */
  async updateTranscription(id: string, transcription: string): Promise<Answer> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Answer not found');
    }

    const updated = Answer.fromPersistence({
      ...existing.toPersistence(),
      transcription,
      updatedAt: new Date(),
    });

    await this.save(updated);
    return updated;
  }

  /**
   * Update answer
   */
  async update(id: string, data: { transcription?: string; isValid?: boolean }): Promise<Answer> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Answer not found');
    }

    const updated = Answer.fromPersistence({
      ...existing.toPersistence(),
      transcription: data.transcription ?? existing.transcription,
      isValid: data.isValid ?? existing.isValid,
      updatedAt: new Date(),
    });

    await this.save(updated);
    return updated;
  }

  /**
   * Mark answer as valid
   */
  async markAsValid(id: string): Promise<Answer> {
    return this.update(id, { isValid: true });
  }

  /**
   * Mark answer as invalid
   */
  async markAsInvalid(id: string): Promise<Answer> {
    return this.update(id, { isValid: false });
  }

  /**
   * Delete answer
   */
  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Answer not found');
    }
    await super.delete(id);
  }
}
