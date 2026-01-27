/**
 * Integration Tests for Questions Controller
 *
 * Tests the full HTTP request/response flow for Question CRUD operations.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { QuestionsController } from '../../controllers/questions/questions.controller.js';
import { MockQuestionRepository } from '../../test/mocks';
import { createQuestionBuilder, createExamBuilder } from '../../test/builders';

// Test constants with valid UUIDs
const TEST_EXAM_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_EXAM_2_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEST_QUESTION_ID = '550e8400-e29b-41d4-a716-446655440003';
const TEST_QUESTION_2_ID = '550e8400-e29b-41d4-a716-446655440004';

// Mock use cases
class MockCreateQuestionUseCase {
  constructor(private questionRepo: MockQuestionRepository) {}

  async execute(input: any) {
    return this.questionRepo.create({
      examId: input.examId,
      priority: input.priority,
      text: input.text,
      type: input.type,
    });
  }
}

class MockGetQuestionUseCase {
  constructor(private questionRepo: MockQuestionRepository) {}

  async execute(input: any) {
    return this.questionRepo.findById(input.id);
  }
}

class MockListQuestionsUseCase {
  constructor(private questionRepo: MockQuestionRepository) {}

  async execute(input: any) {
    return this.questionRepo.list(input);
  }
}

class MockUpdateQuestionUseCase {
  constructor(private questionRepo: MockQuestionRepository) {}

  async execute(input: any) {
    return this.questionRepo.update(input.id, {
      priority: input.priority,
      text: input.text,
      type: input.type,
    });
  }
}

class MockDeleteQuestionUseCase {
  constructor(private questionRepo: MockQuestionRepository) {}

  async execute(input: any) {
    await this.questionRepo.delete(input.id);
  }
}

describe('Questions Controller Integration Tests', () => {
  let app: Hono;
  let mockQuestionRepo: MockQuestionRepository;
  let controller: QuestionsController;

  beforeEach(() => {
    mockQuestionRepo = new MockQuestionRepository();

    // Create use cases with mocks
    const createQuestionUseCase = new MockCreateQuestionUseCase(mockQuestionRepo);
    const getQuestionUseCase = new MockGetQuestionUseCase(mockQuestionRepo);
    const listQuestionsUseCase = new MockListQuestionsUseCase(mockQuestionRepo);
    const updateQuestionUseCase = new MockUpdateQuestionUseCase(mockQuestionRepo);
    const deleteQuestionUseCase = new MockDeleteQuestionUseCase(mockQuestionRepo);

    controller = new QuestionsController(
      createQuestionUseCase as any,
      getQuestionUseCase as any,
      listQuestionsUseCase as any,
      updateQuestionUseCase as any,
      deleteQuestionUseCase as any
    );

    // Create Hono app
    app = new Hono();

    // Setup routes
    app.post('/api/questions', (c) => controller.create(c));
    app.get('/api/questions', (c) => controller.list(c));
    app.get('/api/questions/:id', (c) => controller.getById(c));
    app.patch('/api/questions/:id', (c) => controller.update(c));
    app.delete('/api/questions/:id', (c) => controller.delete(c));
  });

  describe('POST /api/questions', () => {
    it('should create a new text question', async () => {
      const requestBody = {
        examId: TEST_EXAM_ID,
        priority: 1,
        text: 'What is 2 + 2?',
        type: 'text',
      };

      const response = await app.request('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Question created successfully');
      expect(data.question.id).toBeDefined();
      expect(data.question.text).toBe('What is 2 + 2?');
      expect(data.question.type).toBe('text');
      expect(data.question.priority).toBe(1);
    });

    it('should create a new audio question', async () => {
      const requestBody = {
        examId: TEST_EXAM_ID,
        priority: 1,
        text: 'Describe your experience with TypeScript',
        type: 'audio',
      };

      const response = await app.request('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.question.type).toBe('audio');
    });

    it('should return 422 for invalid question type', async () => {
      const requestBody = {
        examId: TEST_EXAM_ID,
        priority: 1,
        text: 'Test question',
        type: 'invalid_type',
      };

      const response = await app.request('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should return 400 for invalid priority', async () => {
      const requestBody = {
        examId: TEST_EXAM_ID,
        priority: 0,
        text: 'Test question',
        type: 'text',
      };

      const response = await app.request('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/questions/:id', () => {
    it('should return question by ID', async () => {
      const question = createQuestionBuilder()
        .withId(TEST_QUESTION_ID)
        .withExamId(TEST_EXAM_ID)
        .withPriority(1)
        .withText('Test question?')
        .asText()
        .build();

      await mockQuestionRepo.save(question);

      const response = await app.request(`/api/questions/${TEST_QUESTION_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Question retrieved successfully');
      expect(data.question.id).toBe(TEST_QUESTION_ID);
      expect(data.question.text).toBe('Test question?');
    });

    it('should return 404 for non-existent question', async () => {
      const response = await app.request('/api/questions/550e8400-e29b-41d4-a716-446655449999');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid question ID', async () => {
      const response = await app.request('/api/questions/not-a-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/questions', () => {
    it('should return empty array when no questions exist', async () => {
      const response = await app.request('/api/questions');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.questions).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return all questions ordered by priority', async () => {
      await mockQuestionRepo.save(
        createQuestionBuilder().withId(TEST_QUESTION_ID).withExamId(TEST_EXAM_ID).withPriority(2).withText('Question 2').asText().build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder().withId(TEST_QUESTION_2_ID).withExamId(TEST_EXAM_ID).withPriority(1).withText('Question 1').asText().build()
      );

      const response = await app.request('/api/questions');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(2);
      expect(data.questions[0].priority).toBe(1);
      expect(data.questions[1].priority).toBe(2);
    });

    it('should filter by exam ID', async () => {
      await mockQuestionRepo.save(
        createQuestionBuilder().withId(TEST_QUESTION_ID).withExamId(TEST_EXAM_ID).withPriority(1).withText('Question 1').asText().build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder().withId(TEST_QUESTION_2_ID).withExamId(TEST_EXAM_2_ID).withPriority(1).withText('Question 2').asText().build()
      );

      const response = await app.request(`/api/questions?examId=${TEST_EXAM_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(1);
      expect(data.questions[0].examId).toBe(TEST_EXAM_ID);
    });

    it('should filter by question type', async () => {
      await mockQuestionRepo.save(
        createQuestionBuilder().withId(TEST_QUESTION_ID).withExamId(TEST_EXAM_ID).withPriority(1).withText('Text Question').asText().build()
      );
      await mockQuestionRepo.save(
        createQuestionBuilder().withId(TEST_QUESTION_2_ID).withExamId(TEST_EXAM_ID).withPriority(2).withText('Audio Question').asAudio().build()
      );

      const response = await app.request('/api/questions?type=text');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(1);
      expect(data.questions[0].type).toBe('text');
    });

    it('should paginate results', async () => {
      // Create 5 questions
      for (let i = 1; i <= 5; i++) {
        await mockQuestionRepo.save(
          createQuestionBuilder()
            .withId(crypto.randomUUID())
            .withExamId(TEST_EXAM_ID)
            .withPriority(i)
            .withText(`Question ${i}`)
            .asText()
            .build()
        );
      }

      const response = await app.request('/api/questions?limit=2&offset=1');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(2);
      expect(data.total).toBe(5);
      expect(data.limit).toBe(2);
      expect(data.offset).toBe(1);
    });
  });

  describe('PATCH /api/questions/:id', () => {
    it('should update question priority', async () => {
      const question = createQuestionBuilder()
        .withId(TEST_QUESTION_ID)
        .withExamId(TEST_EXAM_ID)
        .withPriority(1)
        .withText('Original text')
        .asText()
        .build();

      await mockQuestionRepo.save(question);

      const requestBody = {
        priority: 5,
      };

      const response = await app.request(`/api/questions/${TEST_QUESTION_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Question updated successfully');
      expect(data.question.priority).toBe(5);
      expect(data.question.text).toBe('Original text');
    });

    it('should update question text', async () => {
      const question = createQuestionBuilder()
        .withId(TEST_QUESTION_ID)
        .withExamId(TEST_EXAM_ID)
        .withPriority(1)
        .withText('Original text')
        .asText()
        .build();

      await mockQuestionRepo.save(question);

      const requestBody = {
        text: 'Updated text',
      };

      const response = await app.request(`/api/questions/${TEST_QUESTION_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question.text).toBe('Updated text');
    });

    it('should update question type', async () => {
      const question = createQuestionBuilder()
        .withId(TEST_QUESTION_ID)
        .withExamId(TEST_EXAM_ID)
        .withPriority(1)
        .withText('Test question')
        .asText()
        .build();

      await mockQuestionRepo.save(question);

      const requestBody = {
        type: 'audio',
      };

      const response = await app.request(`/api/questions/${TEST_QUESTION_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question.type).toBe('audio');
    });

    it('should return 422 for invalid question type', async () => {
      const question = createQuestionBuilder()
        .withId(TEST_QUESTION_ID)
        .withExamId(TEST_EXAM_ID)
        .withPriority(1)
        .withText('Test question')
        .asText()
        .build();

      await mockQuestionRepo.save(question);

      const requestBody = {
        type: 'invalid',
      };

      const response = await app.request(`/api/questions/${TEST_QUESTION_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should return 404 for non-existent question', async () => {
      const requestBody = {
        text: 'Updated text',
      };

      const response = await app.request('/api/questions/550e8400-e29b-41d4-a716-446655449999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    it('should delete question', async () => {
      const question = createQuestionBuilder()
        .withId(TEST_QUESTION_ID)
        .withExamId(TEST_EXAM_ID)
        .withPriority(1)
        .withText('Test question')
        .asText()
        .build();

      await mockQuestionRepo.save(question);

      const response = await app.request(`/api/questions/${TEST_QUESTION_ID}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Question deleted successfully');

      // Verify question is deleted
      const deleted = await mockQuestionRepo.findById(TEST_QUESTION_ID);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent question', async () => {
      const response = await app.request('/api/questions/550e8400-e29b-41d4-a716-446655449999', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
