/**
 * Get Exam Use Case
 *
 * Business logic for retrieving an exam with its questions.
 */

import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';
import { Exam } from '../../domain/exams/exam.entity.js';

export interface GetExamInput {
  id: string;
}

export interface GetExamWithQuestionsOutput {
  id: string;
  workspaceId: string;
  examName: string;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  questions: Array<{
    id: string;
    priority: number;
    text: string;
    type: 'text' | 'audio';
  }>;
}

/**
 * Get Exam Use Case
 */
export class GetExamUseCase {
  constructor(
    private examRepository: IExamRepository,
    private questionRepository: IQuestionRepository
  ) {}

  /**
   * Execute the use case - get exam with questions
   */
  async execute(input: GetExamInput): Promise<GetExamWithQuestionsOutput | null> {
    const exam = await this.examRepository.findById(input.id);

    if (!exam) {
      return null;
    }

    const questions = await this.questionRepository.findByExamId(exam.id);

    return {
      id: exam.id,
      workspaceId: exam.workspaceId,
      examName: exam.examName,
      durationMinutes: exam.durationMinutes,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      questions: questions.map((q) => ({
        id: q.id,
        priority: q.priority,
        text: q.text,
        type: q.type,
      })),
    };
  }
}
