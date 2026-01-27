/**
 * Unit Tests for GetExam Use Case
 *
 * Tests the get exam use case with mocked dependencies.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { GetExamUseCase } from '../../use-cases/exams/get-exam.use-case.js';
import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';
import { MockExamRepository, MockQuestionRepository } from '../../test/mocks';
import { createExamBuilder, createQuestionBuilder } from '../../test/builders';

// Mock the repositories
class TestExamRepository extends MockExamRepository implements IExamRepository {
  async create(data: any): Promise<any> {
    const exam = {
      id: `exam-${Date.now()}`,
      programId: data.programId,
      workspaceId: data.workspaceId,
      examName: data.examName,
      durationMinutes: data.durationMinutes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.save(exam);
    return exam;
  }

  async find(filters: any): Promise<any[]> {
    return this.findAll(filters);
  }

  async update(id: string, data: any): Promise<any> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Not found');
    const updated = { ...existing, ...data, updatedAt: new Date() };
    await this.save(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await super.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return (await this.findById(id)) !== null;
  }
}

class TestQuestionRepository extends MockQuestionRepository implements IQuestionRepository {
  async create(data: any): Promise<any> {
    const question = {
      id: `question-${Date.now()}`,
      examId: data.examId,
      priority: data.priority,
      text: data.text,
      type: data.type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.save(question);
    return question;
  }

  async findByExamId(examId: string): Promise<any[]> {
    return this.findByExamOrdered(examId);
  }

  async deleteByExamId(examId: string): Promise<void> {
    await this.deleteByExam(examId);
  }
}

describe('GetExamUseCase', () => {
  let useCase: GetExamUseCase;
  let mockExamRepo: TestExamRepository;
  let mockQuestionRepo: TestQuestionRepository;

  beforeEach(() => {
    mockExamRepo = new TestExamRepository();
    mockQuestionRepo = new TestQuestionRepository();
    useCase = new GetExamUseCase(mockExamRepo, mockQuestionRepo);
  });

  describe('execute', () => {
    it('should return null when exam does not exist', async () => {
      const result = await useCase.execute({ id: 'non-existent' });

      expect(result).toBeNull();
    });

    it('should return exam without questions when no questions exist', async () => {
      const exam = createExamBuilder()
        .withId('exam-1')
        .withExamName('Test Exam')
        .withDuration(60)
        .build();

      await mockExamRepo.save(exam);

      const result = await useCase.execute({ id: 'exam-1' });

      expect(result).not.toBeNull();
      expect(result?.id).toBe('exam-1');
      expect(result?.examName).toBe('Test Exam');
      expect(result?.durationMinutes).toBe(60);
      expect(result?.questions).toEqual([]);
    });

    it('should return exam with questions ordered by priority', async () => {
      const exam = createExamBuilder()
        .withId('exam-1')
        .withExamName('Test Exam')
        .build();

      await mockExamRepo.save(exam);

      // Add questions in random order
      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId('q-3')
          .withExamId('exam-1')
          .withPriority(3)
          .withText('Question 3')
          .build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId('q-1')
          .withExamId('exam-1')
          .withPriority(1)
          .withText('Question 1')
          .build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId('q-2')
          .withExamId('exam-1')
          .withPriority(2)
          .withText('Question 2')
          .build()
      );

      const result = await useCase.execute({ id: 'exam-1' });

      expect(result?.questions).toHaveLength(3);
      expect(result?.questions[0].id).toBe('q-1');
      expect(result?.questions[1].id).toBe('q-2');
      expect(result?.questions[2].id).toBe('q-3');
    });

    it('should return exam with text and audio questions', async () => {
      const exam = createExamBuilder()
        .withId('exam-1')
        .withExamName('Mixed Exam')
        .build();

      await mockExamRepo.save(exam);

      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId('q-1')
          .withExamId('exam-1')
          .withPriority(1)
          .withText('Text question')
          .asText()
          .build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId('q-2')
          .withExamId('exam-1')
          .withPriority(2)
          .withText('Audio question')
          .asAudio()
          .build()
      );

      const result = await useCase.execute({ id: 'exam-1' });

      expect(result?.questions).toHaveLength(2);
      expect(result?.questions[0].type).toBe('text');
      expect(result?.questions[1].type).toBe('audio');
    });

    it('should return all exam fields', async () => {
      const exam = createExamBuilder()
        .withId('exam-1')
        .withProgramId('program-123')
        .withWorkspaceId('workspace-456')
        .withExamName('Complete Exam')
        .withDuration(90)
        .build();

      await mockExamRepo.save(exam);

      const result = await useCase.execute({ id: 'exam-1' });

      expect(result).toMatchObject({
        id: 'exam-1',
        programId: 'program-123',
        workspaceId: 'workspace-456',
        examName: 'Complete Exam',
        durationMinutes: 90,
      });
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return only questions for the requested exam', async () => {
      const exam1 = createExamBuilder().withId('exam-1').build();
      const exam2 = createExamBuilder().withId('exam-2').build();

      await mockExamRepo.save(exam1);
      await mockExamRepo.save(exam2);

      // Add questions to both exams
      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId('q-1')
          .withExamId('exam-1')
          .withPriority(1)
          .withText('Exam 1 Question')
          .build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId('q-2')
          .withExamId('exam-2')
          .withPriority(1)
          .withText('Exam 2 Question')
          .build()
      );

      const result = await useCase.execute({ id: 'exam-1' });

      expect(result?.questions).toHaveLength(1);
      expect(result?.questions[0].id).toBe('q-1');
      expect(result?.questions[0].text).toBe('Exam 1 Question');
    });

    it('should handle exam with many questions', async () => {
      const exam = createExamBuilder().withId('exam-1').build();
      await mockExamRepo.save(exam);

      // Add 50 questions
      const questionPromises = Array.from({ length: 50 }, (_, i) =>
        mockQuestionRepo.save(
          createQuestionBuilder()
            .withId(`q-${i}`)
            .withExamId('exam-1')
            .withPriority(i + 1)
            .withText(`Question ${i + 1}`)
            .build()
        )
      );

      await Promise.all(questionPromises);

      const result = await useCase.execute({ id: 'exam-1' });

      expect(result?.questions).toHaveLength(50);
      expect(result?.questions[0].priority).toBe(1);
      expect(result?.questions[49].priority).toBe(50);
    });

    it('should preserve question metadata', async () => {
      const exam = createExamBuilder().withId('exam-1').build();
      await mockExamRepo.save(exam);

      const question = createQuestionBuilder()
        .withId('q-1')
        .withExamId('exam-1')
        .withPriority(1)
        .withText('What is the capital of Brazil?')
        .asAudio()
        .build();

      await mockQuestionRepo.save(question);

      const result = await useCase.execute({ id: 'exam-1' });

      expect(result?.questions[0]).toMatchObject({
        id: 'q-1',
        priority: 1,
        text: 'What is the capital of Brazil?',
        type: 'audio',
      });
    });
  });
});
