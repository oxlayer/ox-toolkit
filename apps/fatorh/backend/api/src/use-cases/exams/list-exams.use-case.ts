/**
 * List Exams Use Case
 *
 * Business logic for listing exams by filters.
 */

import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';

export interface ListExamsInput {
  workspaceId?: string;
}

export interface ExamOutput {
  id: string;
  workspaceId: string;
  examName: string;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * List Exams Use Case
 */
export class ListExamsUseCase {
  constructor(
    private examRepository: IExamRepository
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: ListExamsInput): Promise<ExamOutput[]> {
    const exams = await this.examRepository.find({
      workspaceId: input.workspaceId,
    });

    return exams.map((exam) => ({
      id: exam.id,
      workspaceId: exam.workspaceId,
      examName: exam.examName,
      durationMinutes: exam.durationMinutes,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
    }));
  }
}
