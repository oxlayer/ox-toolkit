/**
 * Integration Tests for Exams Controller
 *
 * Tests the full HTTP request/response flow.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { ExamsController } from '../../controllers/exams/exams.controller.js';
import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import type { IQuestionRepository } from '../../repositories/questions/question.repository.interface.js';
import type { EventBus } from '../../config/rabbitmq.config.js';
import { MockExamRepository, MockQuestionRepository, MockEventBus } from '../../test/mocks';
import { createExamBuilder, createQuestionBuilder } from '../../test/builders';

// Test constants with valid UUIDs
const TEST_PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEST_EXAM_ID = '550e8400-e29b-41d4-a716-446655440003';
const TEST_QUESTION_1_ID = '550e8400-e29b-41d4-a716-446655440004';
const TEST_QUESTION_2_ID = '550e8400-e29b-41d4-a716-446655440005';
const TEST_PROGRAM_2_ID = '550e8400-e29b-41d4-a716-446655440006';
const TEST_WORKSPACE_2_ID = '550e8400-e29b-41d4-a716-446655440007';

// Mock the repositories
class TestExamRepository extends MockExamRepository implements IExamRepository {
  async create(data: any): Promise<any> {
    const exam = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

// Mock use cases
class MockCreateExamUseCase {
  constructor(
    private examRepo: TestExamRepository,
    private questionRepo: TestQuestionRepository,
    private eventBus: MockEventBus
  ) { }

  async execute(input: any) {
    const exam = createExamBuilder()
      .withProgramId(input.programId)
      .withWorkspaceId(input.workspaceId)
      .withExamName(input.examName)
      .withDuration(input.durationMinutes)
      .build();

    await this.examRepo.save(exam);

    const questionIds: string[] = [];
    for (const q of input.questions) {
      const question = createQuestionBuilder()
        .withExamId(exam.id)
        .withPriority(q.priority)
        .withText(q.text)
        .withType(q.type)
        .build();
      await this.questionRepo.save(question);
      questionIds.push(question.id);
    }

    await this.eventBus.publish({
      type: 'exam.created',
      examId: exam.id,
      examName: exam.examName,
    });

    return { examId: exam.id, questionIds };
  }
}

class MockGetExamUseCase {
  constructor(private examRepo: TestExamRepository, private questionRepo: TestQuestionRepository) { }

  async execute(input: any) {
    const exam = await this.examRepo.findById(input.id);
    if (!exam) return null;

    const questions = await this.questionRepo.findByExam(exam.id);

    return {
      id: exam.id,
      programId: exam.programId,
      workspaceId: exam.workspaceId,
      examName: exam.examName,
      durationMinutes: exam.durationMinutes,
      createdAt: exam.createdAt,
      updatedAt: exam.updatedAt,
      questions,
    };
  }
}

class MockListExamsUseCase {
  constructor(private examRepo: TestExamRepository) { }

  async execute(input: any) {
    return this.examRepo.findAll(input);
  }
}

describe('Exams Controller Integration Tests', () => {
  let app: Hono;
  let mockExamRepo: TestExamRepository;
  let mockQuestionRepo: TestQuestionRepository;
  let mockEventBus: MockEventBus;
  let controller: ExamsController;

  beforeEach(() => {
    mockExamRepo = new TestExamRepository();
    mockQuestionRepo = new TestQuestionRepository();
    mockEventBus = new MockEventBus();

    // Create use cases with mocks
    const createExamUseCase = new MockCreateExamUseCase(mockExamRepo, mockQuestionRepo, mockEventBus);
    const getExamUseCase = new MockGetExamUseCase(mockExamRepo, mockQuestionRepo);
    const listExamsUseCase = new MockListExamsUseCase(mockExamRepo);

    controller = new ExamsController(
      createExamUseCase as any,
      getExamUseCase as any,
      listExamsUseCase as any
    );

    // Create Hono app
    app = new Hono();

    // Setup routes
    app.post('/api/exams', (c) => controller.create(c));
    app.get('/api/exams', (c) => controller.list(c));
    app.get('/api/exams/:id', (c) => controller.getById(c));
    app.get('/api/exams/:id/questions', (c) => controller.getWithQuestions(c));
  });

  describe('POST /api/exams', () => {
    it('should create a new exam', async () => {
      const requestBody = {
        programId: TEST_PROGRAM_ID,
        workspaceId: TEST_WORKSPACE_ID,
        examName: 'Math Test',
        durationMinutes: 60,
        questions: [
          { priority: 1, text: 'What is 2+2?', type: 'text' },
          { priority: 2, text: 'Describe a circle', type: 'audio' },
        ],
      };

      const response = await app.request('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Exam created successfully');
      expect(data.examId).toBeDefined();
      expect(data.questionIds).toHaveLength(2);
    });

    it('should return 400 for invalid exam name', async () => {
      const requestBody = {
        programId: TEST_PROGRAM_ID,
        workspaceId: TEST_WORKSPACE_ID,
        examName: '',
        questions: [{ priority: 1, text: 'Question?', type: 'text' }],
      };

      const response = await app.request('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should return 400 for invalid question type', async () => {
      const requestBody = {
        programId: TEST_PROGRAM_ID,
        workspaceId: TEST_WORKSPACE_ID,
        examName: 'Test Exam',
        questions: [{ priority: 1, text: 'Question?', type: 'invalid' }],
      };

      const response = await app.request('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should create exam with default duration', async () => {
      const requestBody = {
        programId: TEST_PROGRAM_ID,
        workspaceId: TEST_WORKSPACE_ID,
        examName: 'Quick Quiz',
        questions: [{ priority: 1, text: 'Question?', type: 'text' }],
      };

      const response = await app.request('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.examId).toBeDefined();
    });
  });

  describe('GET /api/exams/:id', () => {
    it('should return exam by ID', async () => {
      const exam = createExamBuilder()
        .withId(TEST_EXAM_ID)
        .withProgramId(TEST_PROGRAM_ID)
        .withWorkspaceId(TEST_WORKSPACE_ID)
        .withExamName('Math Test')
        .withDuration(60)
        .build();

      await mockExamRepo.save(exam);

      const response = await app.request(`/api/exams/${TEST_EXAM_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Exam retrieved successfully');
      expect(data.exam.id).toBe(TEST_EXAM_ID);
      expect(data.exam.examName).toBe('Math Test');
    });

    it('should return 404 for non-existent exam', async () => {
      const response = await app.request('/api/exams/550e8400-e29b-41d4-a716-446655449999');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid exam ID', async () => {
      const response = await app.request('/api/exams/not-a-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/exams/:id/questions', () => {
    it('should return exam with questions', async () => {
      const exam = createExamBuilder()
        .withId(TEST_EXAM_ID)
        .withExamName('Test with Questions')
        .withDuration(45)
        .build();

      await mockExamRepo.save(exam);

      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId(TEST_QUESTION_1_ID)
          .withExamId(TEST_EXAM_ID)
          .withPriority(1)
          .withText('Question 1')
          .asText()
          .build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder()
          .withId(TEST_QUESTION_2_ID)
          .withExamId(TEST_EXAM_ID)
          .withPriority(2)
          .withText('Question 2')
          .asAudio()
          .build()
      );

      const response = await app.request(`/api/exams/${TEST_EXAM_ID}/questions`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.examId).toBe(TEST_EXAM_ID);
      expect(data.examName).toBe('Test with Questions');
      expect(data.durationMinutes).toBe(45);
      expect(data.questions).toHaveLength(2);
      expect(data.questions[0].priority).toBe(1);
      expect(data.questions[1].priority).toBe(2);
    });

    it('should return empty questions array for exam without questions', async () => {
      const exam = createExamBuilder().withId(TEST_EXAM_ID).withExamName('Empty Exam').build();
      await mockExamRepo.save(exam);

      const response = await app.request(`/api/exams/${TEST_EXAM_ID}/questions`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toEqual([]);
    });
  });

  describe('GET /api/exams', () => {
    it('should return empty array when no exams exist', async () => {
      const response = await app.request('/api/exams');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exams).toEqual([]);
    });

    it('should return all exams', async () => {
      await mockExamRepo.save(
        createExamBuilder().withId(TEST_EXAM_ID).withExamName('Exam 1').withWorkspaceId(TEST_WORKSPACE_ID).build()
      );
      await mockExamRepo.save(
        createExamBuilder().withId(TEST_QUESTION_1_ID).withExamName('Exam 2').withWorkspaceId(TEST_WORKSPACE_ID).build()
      );

      const response = await app.request('/api/exams');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exams).toHaveLength(2);
    });

    it('should filter by program ID', async () => {
      await mockExamRepo.save(
        createExamBuilder().withId(TEST_EXAM_ID).withExamName('Exam 1').withProgramId(TEST_PROGRAM_ID).build()
      );
      await mockExamRepo.save(
        createExamBuilder().withId(TEST_QUESTION_1_ID).withExamName('Exam 2').withProgramId(TEST_PROGRAM_2_ID).build()
      );

      const response = await app.request(`/api/exams?programId=${TEST_PROGRAM_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exams).toHaveLength(1);
      expect(data.exams[0].programId).toBe(TEST_PROGRAM_ID);
    });

    it('should filter by workspace ID', async () => {
      await mockExamRepo.save(
        createExamBuilder().withId(TEST_EXAM_ID).withExamName('Exam 1').withWorkspaceId(TEST_WORKSPACE_ID).build()
      );
      await mockExamRepo.save(
        createExamBuilder().withId(TEST_QUESTION_1_ID).withExamName('Exam 2').withWorkspaceId(TEST_WORKSPACE_2_ID).build()
      );

      const response = await app.request(`/api/exams?workspaceId=${TEST_WORKSPACE_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.exams).toHaveLength(1);
      expect(data.exams[0].workspaceId).toBe(TEST_WORKSPACE_ID);
    });
  });
});
