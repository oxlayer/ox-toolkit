/**
 * Mock Question Repository
 *
 * In-memory repository for testing without database.
 */

import { InMemoryRepository } from '@oxlayer/foundation-testing-kit';
import type { Question } from '../../domain/exams/question.entity.js';

export class MockQuestionRepository extends InMemoryRepository<Question, string> {
  protected getId(entity: Question): string {
    return entity.id;
  }

  /**
   * Find question by ID
   */
  async findById(id: string): Promise<Question | null> {
    return super.findById(id);
  }

  /**
   * Find all questions for an exam
   */
  async findByExam(examId: string): Promise<Question[]> {
    return this.findMany((q) => q.examId === examId);
  }

  /**
   * Find questions by exam ID (alias for findByExam, returns ordered by priority)
   */
  async findByExamId(examId: string): Promise<Question[]> {
    return this.findByExamOrdered(examId);
  }

  /**
   * Get the maximum priority for questions in an exam
   * Returns 0 if no questions exist for the exam
   */
  async getMaxPriority(examId: string): Promise<number> {
    const questions = await this.findByExam(examId);
    if (questions.length === 0) return 0;
    return Math.max(...questions.map(q => q.priority));
  }

  /**
   * Create a new question
   */
  async create(data: {
    examId: string;
    priority: number;
    text: string;
    type: 'text' | 'audio';
  }): Promise<Question> {
    const { Question } = await import('../../domain/exams/question.entity.js');
    return Question.fromPersistence({
      id: crypto.randomUUID(),
      examId: data.examId,
      priority: data.priority,
      text: data.text,
      type: data.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Create multiple questions for an exam
   */
  async createBulk(data: Array<{
    examId: string;
    priority: number;
    text: string;
    type: 'text' | 'audio';
  }>): Promise<Question[]> {
    const questions: Question[] = [];
    for (const item of data) {
      const question = await this.create(item);
      await this.save(question);
      questions.push(question);
    }
    return questions;
  }

  /**
   * Find questions by exam ordered by priority
   */
  async findByExamOrdered(examId: string): Promise<Question[]> {
    return this.findMany((q) => q.examId === examId).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Count questions for an exam
   */
  async countByExam(examId: string): Promise<number> {
    return this.findMany((q) => q.examId === examId).length;
  }

  /**
   * Delete all questions for an exam
   */
  async deleteByExam(examId: string): Promise<void> {
    const questions = await this.findByExam(examId);
    for (const question of questions) {
      await this.delete(question.id);
    }
  }

  /**
   * Delete questions by exam ID (alias for deleteByExam)
   */
  async deleteByExamId(examId: string): Promise<void> {
    return this.deleteByExam(examId);
  }
}
