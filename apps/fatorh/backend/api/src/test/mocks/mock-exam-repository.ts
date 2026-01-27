/**
 * Mock Exam Repository
 *
 * In-memory repository for testing without database.
 */

import { InMemoryRepository } from '@oxlayer/foundation-testing-kit';
import type { Exam } from '../../domain/exams/exam.entity.js';

export class MockExamRepository extends InMemoryRepository<Exam, string> {
  protected getId(entity: Exam): string {
    return entity.id;
  }

  /**
   * Find exam by ID
   */
  async findById(id: string): Promise<Exam | null> {
    return super.findById(id);
  }

  /**
   * Find all exams for a workspace
   */
  async findByWorkspace(workspaceId: string): Promise<Exam[]> {
    return this.findMany((exam) => exam.workspaceId === workspaceId);
  }

  /**
   * Find all exams with filters
   */
  async findAll(filters?: {
    workspaceId?: string;
  }): Promise<Exam[]> {
    let exams = this.getAll();

    if (filters?.workspaceId) {
      exams = exams.filter((e) => e.workspaceId === filters.workspaceId);
    }

    return exams;
  }

  /**
   * Find exam by name within a workspace
   */
  async findByName(workspaceId: string, examName: string): Promise<Exam | null> {
    return this.findOne(
      (exam) => exam.workspaceId === workspaceId && exam.examName === examName
    );
  }
}
