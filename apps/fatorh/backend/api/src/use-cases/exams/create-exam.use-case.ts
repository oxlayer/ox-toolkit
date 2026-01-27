/**
 * Create Exam Use Case
 *
 * Business logic for creating a new exam with questions.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { EventBus } from '../../config/rabbitmq.config.js';
import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';
import { Exam, Question, CreateExamInput, CreateExamResult } from '../../domain/exams/exam.entity.js';

export interface CreateExamInput {
  workspaceId: string;
  examName: string;
  durationMinutes?: number;
  questions: Array<{
    priority: number;
    text: string;
    type: 'text' | 'audio';
  }>;
}

export interface CreateExamOutput {
  examId: string;
  questionIds: string[];
}

/**
 * Create Exam Use Case
 */
export class CreateExamUseCase {
  constructor(
    private examRepository: IExamRepository,
    private questionRepository: IQuestionRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateExamInput): Promise<CreateExamOutput> {
    // Validate input
    this.validate(input);

    // Create exam
    const exam = Exam.create({
      id: generateId(),
      workspaceId: input.workspaceId,
      examName: input.examName,
      durationMinutes: input.durationMinutes,
    });

    // Save exam to database
    await this.examRepository.create({
      id: exam.id,
      workspaceId: exam.workspaceId,
      examName: exam.examName,
      durationMinutes: exam.durationMinutes,
      questions: input.questions,
    });

    // Create questions
    const questionIds: string[] = [];
    if (input.questions.length > 0) {
      const questions = await this.questionRepository.createBulk(
        input.questions.map((q) => ({
          examId: exam.id,
          priority: q.priority,
          text: q.text,
          type: q.type,
        }))
      );
      questionIds.push(...questions.map((q) => q.id));
    }

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'exam.created',
      {
        examId: exam.id,
        examName: exam.examName,
        workspaceId: exam.workspaceId,
        questionCount: questionIds.length,
        createdAt: new Date().toISOString(),
      }
    );

    return {
      examId: exam.id,
      questionIds,
    };
  }

  /**
   * Validate input
   */
  private validate(input: CreateExamInput): void {
    if (!input.examName || input.examName.trim().length === 0) {
      throw new Error('Exam name is required');
    }

    if (input.questions.length === 0) {
      throw new Error('At least one question is required');
    }

    if (input.questions.length > 50) {
      throw new Error('Maximum 50 questions allowed');
    }

    // Validate questions
    const priorities = new Set<number>();
    for (const question of input.questions) {
      if (!question.text || question.text.trim().length === 0) {
        throw new Error('Question text is required');
      }

      if (!['text', 'audio'].includes(question.type)) {
        throw new Error('Question type must be "text" or "audio"');
      }

      if (priorities.has(question.priority)) {
        throw new Error(`Duplicate question priority: ${question.priority}`);
      }
      priorities.add(question.priority);
    }

    // Validate duration
    const duration = input.durationMinutes ?? 30;
    if (duration < 1 || duration > 120) {
      throw new Error('Duration must be between 1 and 120 minutes');
    }
  }
}
