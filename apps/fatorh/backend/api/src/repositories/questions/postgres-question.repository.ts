/**
 * PostgreSQL Question Repository Implementation
 */

import { eq, asc, count, and, max } from 'drizzle-orm';
import { generateId } from '@oxlayer/foundation-domain-kit';
import { questions as questionsTable } from '../../db/schema.js';
import { Question, QuestionType } from '../../domain/exams/question.entity.js';
import type { IQuestionRepository, ListQuestionFilters } from './question.repository.interface.js';

export class PostgresQuestionRepository implements IQuestionRepository {
  constructor(private db: any) {}

  /**
   * Create a new question
   */
  async create(data: {
    examId: string;
    priority: number;
    text: string;
    type: QuestionType;
    weight?: string;
  }): Promise<Question> {
    const id = generateId();

    const [questionRow] = await this.db
      .insert(questionsTable)
      .values({
        id,
        examId: data.examId,
        priority: data.priority,
        text: data.text,
        type: data.type,
        weight: data.weight || 'medium',
      })
      .returning();

    return Question.fromPersistence({
      id: questionRow.id,
      examId: questionRow.examId,
      priority: questionRow.priority,
      text: questionRow.text,
      type: questionRow.type,
      weight: questionRow.weight,
      createdAt: questionRow.createdAt,
      updatedAt: questionRow.updatedAt,
    });
  }

  /**
   * Get the maximum priority for questions in an exam
   * Returns 0 if no questions exist for the exam
   */
  async getMaxPriority(examId: string): Promise<number> {
    const [result] = await this.db
      .select({ value: max(questionsTable.priority) })
      .from(questionsTable)
      .where(eq(questionsTable.examId, examId));

    // If no questions exist, return 0 so the first question will have priority 1
    return result?.value ? Number(result.value) : 0;
  }

  /**
   * Find question by ID
   */
  async findById(id: string): Promise<Question | null> {
    const [questionRow] = await this.db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, id))
      .limit(1);

    if (!questionRow) {
      return null;
    }

    return Question.fromPersistence({
      id: questionRow.id,
      examId: questionRow.examId,
      priority: questionRow.priority,
      text: questionRow.text,
      type: questionRow.type,
      weight: questionRow.weight || 'medium',
      createdAt: questionRow.createdAt,
      updatedAt: questionRow.updatedAt,
    });
  }

  /**
   * Find questions by exam ID
   */
  async findByExamId(examId: string): Promise<Question[]> {
    const questionRows = await this.db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.examId, examId))
      .orderBy(questionsTable.priority);

    return questionRows.map((row: any) =>
      Question.fromPersistence({
        id: row.id,
        examId: row.examId,
        priority: row.priority,
        text: row.text,
        type: row.type,
        weight: row.weight || 'medium',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * List questions with filters
   */
  async list(filters: ListQuestionFilters): Promise<{ questions: Question[]; total: number }> {
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    // Build where conditions
    const conditions: any[] = [];
    if (filters.examId) {
      conditions.push(eq(questionsTable.examId, filters.examId));
    }
    if (filters.type) {
      conditions.push(eq(questionsTable.type, filters.type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ value: total }] = await this.db
      .select({ value: count() })
      .from(questionsTable)
      .where(whereClause);

    // Get questions
    const questionRows = await this.db
      .select()
      .from(questionsTable)
      .where(whereClause)
      .orderBy(asc(questionsTable.priority))
      .limit(limit)
      .offset(offset);

    return {
      questions: questionRows.map((row: any) =>
        Question.fromPersistence({
          id: row.id,
          examId: row.examId,
          priority: row.priority,
          text: row.text,
          type: row.type,
          weight: row.weight || 'medium',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })
      ),
      total: Number(total),
    };
  }

  /**
   * Create multiple questions for an exam
   */
  async createBulk(data: Array<{
    examId: string;
    priority: number;
    text: string;
    type: QuestionType;
    weight?: string;
  }>): Promise<Question[]> {
    const questions = data.map((d) => ({
      id: generateId(),
      examId: d.examId,
      priority: d.priority,
      text: d.text,
      type: d.type,
      weight: d.weight || 'medium',
    }));

    const questionRows = await this.db
      .insert(questionsTable)
      .values(questions)
      .returning();

    return questionRows.map((row: any) =>
      Question.fromPersistence({
        id: row.id,
        examId: row.examId,
        priority: row.priority,
        text: row.text,
        type: row.type,
        weight: row.weight || 'medium',
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
    );
  }

  /**
   * Update question
   */
  async update(id: string, data: {
    priority?: number;
    text?: string;
    type?: QuestionType;
    weight?: string;
  }): Promise<Question> {
    const updates: any = {};
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.text !== undefined) updates.text = data.text;
    if (data.type !== undefined) updates.type = data.type;
    if (data.weight !== undefined) updates.weight = data.weight;

    const [questionRow] = await this.db
      .update(questionsTable)
      .set(updates)
      .where(eq(questionsTable.id, id))
      .returning();

    return Question.fromPersistence({
      id: questionRow.id,
      examId: questionRow.examId,
      priority: questionRow.priority,
      text: questionRow.text,
      type: questionRow.type,
      weight: questionRow.weight || 'medium',
      createdAt: questionRow.createdAt,
      updatedAt: questionRow.updatedAt,
    });
  }

  /**
   * Delete question
   */
  async delete(id: string): Promise<void> {
    await this.db.delete(questionsTable).where(eq(questionsTable.id, id));
  }

  /**
   * Delete questions by exam ID
   */
  async deleteByExamId(examId: string): Promise<void> {
    await this.db.delete(questionsTable).where(eq(questionsTable.examId, examId));
  }
}

// Export the class as default for dynamic import
export default PostgresQuestionRepository;
