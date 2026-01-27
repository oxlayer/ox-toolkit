/**
 * Unit Tests for CreateExam Use Case
 *
 * Tests the create exam use case with mocked dependencies.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { CreateExamUseCase } from '../../use-cases/exams/create-exam.use-case.js';
import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';
import type { EventBus } from '../../config/rabbitmq.config.js';
import { MockExamRepository, MockQuestionRepository, MockEventBus } from '../../test/mocks';

// Mock the repositories
class TestExamRepository extends MockExamRepository implements IExamRepository {
  async create(data: any): Promise<any> {
    const exam = {
      id: data.id || crypto.randomUUID(),
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
      id: data.id || crypto.randomUUID(),
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
    return this.findByExam(examId);
  }

  async deleteByExamId(examId: string): Promise<void> {
    await this.deleteByExam(examId);
  }
}

describe('CreateExamUseCase', () => {
  let useCase: CreateExamUseCase;
  let mockExamRepo: TestExamRepository;
  let mockQuestionRepo: TestQuestionRepository;
  let mockEventBus: MockEventBus;

  beforeEach(() => {
    mockExamRepo = new TestExamRepository();
    mockQuestionRepo = new TestQuestionRepository();
    mockEventBus = new MockEventBus();
    useCase = new CreateExamUseCase(mockExamRepo, mockQuestionRepo, mockEventBus as unknown as EventBus);
  });

  describe('validation', () => {
    it('should throw error when exam name is empty', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: '',
        questions: [{ priority: 1, text: 'Question 1', type: 'text' as const }],
      };

      await expect(useCase.execute(input)).rejects.toThrow('Exam name is required');
    });

    it('should throw error when no questions provided', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [],
      };

      await expect(useCase.execute(input)).rejects.toThrow('At least one question is required');
    });

    it('should throw error when too many questions provided', async () => {
      const questions = Array.from({ length: 51 }, (_, i) => ({
        priority: i + 1,
        text: `Question ${i + 1}`,
        type: 'text' as const,
      }));

      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions,
      };

      await expect(useCase.execute(input)).rejects.toThrow('Maximum 50 questions allowed');
    });

    it('should throw error when question text is empty', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [{ priority: 1, text: '', type: 'text' as const }],
      };

      await expect(useCase.execute(input)).rejects.toThrow('Question text is required');
    });

    it('should throw error when question type is invalid', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [{ priority: 1, text: 'Question 1', type: 'invalid' as any }],
      };

      await expect(useCase.execute(input)).rejects.toThrow('Question type must be "text" or "audio"');
    });

    it('should throw error when question priorities are duplicated', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [
          { priority: 1, text: 'Question 1', type: 'text' as const },
          { priority: 1, text: 'Question 2', type: 'text' as const },
        ],
      };

      await expect(useCase.execute(input)).rejects.toThrow('Duplicate question priority: 1');
    });

    it('should throw error when duration is too short', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        durationMinutes: 0,
        questions: [{ priority: 1, text: 'Question 1', type: 'text' as const }],
      };

      await expect(useCase.execute(input)).rejects.toThrow('Duration must be between 1 and 120 minutes');
    });

    it('should throw error when duration is too long', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        durationMinutes: 121,
        questions: [{ priority: 1, text: 'Question 1', type: 'text' as const }],
      };

      await expect(useCase.execute(input)).rejects.toThrow('Duration must be between 1 and 120 minutes');
    });
  });

  describe('execute', () => {
    it('should create a new exam with questions', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        durationMinutes: 60,
        questions: [
          { priority: 1, text: 'Question 1', type: 'text' as const },
          { priority: 2, text: 'Question 2', type: 'audio' as const },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.examId).toBeDefined();
      expect(result.questionIds).toHaveLength(2);

      // Verify exam was saved
      const exam = await mockExamRepo.findById(result.examId);
      expect(exam).toBeDefined();
      expect(exam?.examName).toBe('Test Exam');
      expect(exam?.durationMinutes).toBe(60);
    });

    it('should create questions with correct priorities', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [
          { priority: 1, text: 'Question 1', type: 'text' as const },
          { priority: 2, text: 'Question 2', type: 'audio' as const },
          { priority: 3, text: 'Question 3', type: 'text' as const },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.questionIds).toHaveLength(3);

      const questions = await mockQuestionRepo.findByExam(result.examId);
      expect(questions).toHaveLength(3);
      expect(questions[0].priority).toBe(1);
      expect(questions[1].priority).toBe(2);
      expect(questions[2].priority).toBe(3);
    });

    it('should publish exam.created event', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [
          { priority: 1, text: 'Question 1', type: 'text' as const },
          { priority: 2, text: 'Question 2', type: 'text' as const },
        ],
      };

      await useCase.execute(input);

      expect(mockEventBus.wasPublished('exam.created')).toBe(true);
      expect(mockEventBus.count('exam.created')).toBe(1);
    });

    it('should use default duration when not provided', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [{ priority: 1, text: 'Question 1', type: 'text' as const }],
      };

      const result = await useCase.execute(input);

      const exam = await mockExamRepo.findById(result.examId);
      // Default duration is 30 minutes as per the validation logic
      expect(exam?.durationMinutes).toBe(30);
    });

    it('should create exam with text questions', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Text Exam',
        questions: [
          { priority: 1, text: 'What is 2+2?', type: 'text' as const },
          { priority: 2, text: 'What is the capital of France?', type: 'text' as const },
        ],
      };

      const result = await useCase.execute(input);

      const questions = await mockQuestionRepo.findByExam(result.examId);
      expect(questions).toHaveLength(2);
      expect(questions.every((q) => q.type === 'text')).toBe(true);
    });

    it('should create exam with audio questions', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Audio Exam',
        questions: [
          { priority: 1, text: 'Describe this image', type: 'audio' as const },
          { priority: 2, text: 'Tell me about yourself', type: 'audio' as const },
        ],
      };

      const result = await useCase.execute(input);

      const questions = await mockQuestionRepo.findByExam(result.examId);
      expect(questions).toHaveLength(2);
      expect(questions.every((q) => q.type === 'audio')).toBe(true);
    });

    it('should create exam with mixed question types', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Mixed Exam',
        questions: [
          { priority: 1, text: 'Text question', type: 'text' as const },
          { priority: 2, text: 'Audio question', type: 'audio' as const },
          { priority: 3, text: 'Another text question', type: 'text' as const },
        ],
      };

      const result = await useCase.execute(input);

      const questions = await mockQuestionRepo.findByExam(result.examId);
      expect(questions).toHaveLength(3);
      expect(questions[0].type).toBe('text');
      expect(questions[1].type).toBe('audio');
      expect(questions[2].type).toBe('text');
    });
  });

  describe('event publishing', () => {
    it('should publish event with correct data', async () => {
      const input = {
        programId: 'program-1',
        workspaceId: 'workspace-1',
        examName: 'Test Exam',
        questions: [
          { priority: 1, text: 'Question 1', type: 'text' as const },
          { priority: 2, text: 'Question 2', type: 'text' as const },
        ],
      };

      const result = await useCase.execute(input);

      const events = mockEventBus.getEvents('exam.created');
      expect(events).toHaveLength(1);

      const eventData = events[0].event as any;
      expect(eventData.examId).toBe(result.examId);
      expect(eventData.examName).toBe('Test Exam');
      expect(eventData.workspaceId).toBe('workspace-1');
      expect(eventData.questionCount).toBe(2);
      expect(eventData.createdAt).toBeDefined();
    });
  });
});
