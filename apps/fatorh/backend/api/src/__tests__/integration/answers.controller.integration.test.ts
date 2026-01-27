/**
 * Integration Tests for Answers Controller
 *
 * Tests the full HTTP request/response flow for Answer CRUD operations.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { AnswersController } from '../../controllers/answers/answers.controller.js';
import { MockAnswerRepository } from '../../test/mocks';
import { createAnswerBuilder } from '../../test/builders';

// Test constants with valid UUIDs
const TEST_ASSIGNMENT_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_ASSIGNMENT_2_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEST_CANDIDATE_ID = '550e8400-e29b-41d4-a716-446655440003';
const TEST_CANDIDATE_2_ID = '550e8400-e29b-41d4-a716-446655440004';
const TEST_EXAM_ID = '550e8400-e29b-41d4-a716-446655440005';
const TEST_QUESTION_ID = '550e8400-e29b-41d4-a716-446655440006';
const TEST_ANSWER_ID = '550e8400-e29b-41d4-a716-446655440007';
const TEST_ANSWER_2_ID = '550e8400-e29b-41d4-a716-446655440008';

// Mock use cases
class MockCreateAnswerUseCase {
  constructor(private answerRepo: MockAnswerRepository) {}

  async execute(input: any) {
    return this.answerRepo.create({
      ...input,
      id: crypto.randomUUID(),
    });
  }
}

class MockGetAnswerUseCase {
  constructor(private answerRepo: MockAnswerRepository) {}

  async execute(input: any) {
    return this.answerRepo.findById(input.id);
  }
}

class MockListAnswersUseCase {
  constructor(private answerRepo: MockAnswerRepository) {}

  async execute(input: any) {
    return this.answerRepo.list(input);
  }
}

class MockUpdateAnswerUseCase {
  constructor(private answerRepo: MockAnswerRepository) {}

  async execute(input: any) {
    return this.answerRepo.update(input.id, {
      transcription: input.transcription,
      isValid: input.isValid,
    });
  }
}

class MockDeleteAnswerUseCase {
  constructor(private answerRepo: MockAnswerRepository) {}

  async execute(input: any) {
    await this.answerRepo.delete(input.id);
  }
}

describe('Answers Controller Integration Tests', () => {
  let app: Hono;
  let mockAnswerRepo: MockAnswerRepository;
  let controller: AnswersController;

  beforeEach(() => {
    mockAnswerRepo = new MockAnswerRepository();

    // Create use cases with mocks
    const createAnswerUseCase = new MockCreateAnswerUseCase(mockAnswerRepo);
    const getAnswerUseCase = new MockGetAnswerUseCase(mockAnswerRepo);
    const listAnswersUseCase = new MockListAnswersUseCase(mockAnswerRepo);
    const updateAnswerUseCase = new MockUpdateAnswerUseCase(mockAnswerRepo);
    const deleteAnswerUseCase = new MockDeleteAnswerUseCase(mockAnswerRepo);

    controller = new AnswersController(
      createAnswerUseCase as any,
      getAnswerUseCase as any,
      listAnswersUseCase as any,
      updateAnswerUseCase as any,
      deleteAnswerUseCase as any
    );

    // Create Hono app
    app = new Hono();

    // Setup routes
    app.post('/api/answers', (c) => controller.create(c));
    app.get('/api/answers', (c) => controller.list(c));
    app.get('/api/answers/:id', (c) => controller.getById(c));
    app.patch('/api/answers/:id', (c) => controller.update(c));
    app.delete('/api/answers/:id', (c) => controller.delete(c));
  });

  describe('POST /api/answers', () => {
    it('should create a new answer', async () => {
      const requestBody = {
        assignmentId: TEST_ASSIGNMENT_ID,
        candidateId: TEST_CANDIDATE_ID,
        examId: TEST_EXAM_ID,
        questionId: TEST_QUESTION_ID,
        s3Url: 'https://s3.amazonaws.com/bucket/answer.mp3',
        duration: 30,
        contentType: 'audio/mp3',
        fileSize: 102400,
      };

      const response = await app.request('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Answer created successfully');
      expect(data.answer.id).toBeDefined();
      expect(data.answer.assignmentId).toBe(TEST_ASSIGNMENT_ID);
      expect(data.answer.candidateId).toBe(TEST_CANDIDATE_ID);
      expect(data.answer.s3Url).toBe('https://s3.amazonaws.com/bucket/answer.mp3');
      expect(data.answer.isValid).toBe(false);
    });

    it('should return 422 for missing assignmentId', async () => {
      const requestBody = {
        candidateId: TEST_CANDIDATE_ID,
        examId: TEST_EXAM_ID,
        questionId: TEST_QUESTION_ID,
        s3Url: 'https://s3.amazonaws.com/bucket/answer.mp3',
        duration: 30,
        contentType: 'audio/mp3',
        fileSize: 102400,
      };

      const response = await app.request('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should return 422 for invalid duration', async () => {
      const requestBody = {
        assignmentId: TEST_ASSIGNMENT_ID,
        candidateId: TEST_CANDIDATE_ID,
        examId: TEST_EXAM_ID,
        questionId: TEST_QUESTION_ID,
        s3Url: 'https://s3.amazonaws.com/bucket/answer.mp3',
        duration: 0,
        contentType: 'audio/mp3',
        fileSize: 102400,
      };

      const response = await app.request('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should return 422 for invalid file size', async () => {
      const requestBody = {
        assignmentId: TEST_ASSIGNMENT_ID,
        candidateId: TEST_CANDIDATE_ID,
        examId: TEST_EXAM_ID,
        questionId: TEST_QUESTION_ID,
        s3Url: 'https://s3.amazonaws.com/bucket/answer.mp3',
        duration: 30,
        contentType: 'audio/mp3',
        fileSize: -1,
      };

      const response = await app.request('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/answers/:id', () => {
    it('should return answer by ID', async () => {
      const answer = createAnswerBuilder()
        .withId(TEST_ANSWER_ID)
        .withAssignmentId(TEST_ASSIGNMENT_ID)
        .withCandidateId(TEST_CANDIDATE_ID)
        .withExamId(TEST_EXAM_ID)
        .withQuestionId(TEST_QUESTION_ID)
        .withS3Url('https://s3.amazonaws.com/bucket/answer.mp3')
        .withDuration(30)
        .build();

      await mockAnswerRepo.save(answer);

      const response = await app.request(`/api/answers/${TEST_ANSWER_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Answer retrieved successfully');
      expect(data.answer.id).toBe(TEST_ANSWER_ID);
      expect(data.answer.s3Url).toBe('https://s3.amazonaws.com/bucket/answer.mp3');
    });

    it('should return 404 for non-existent answer', async () => {
      const response = await app.request('/api/answers/550e8400-e29b-41d4-a716-446655449999');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid answer ID', async () => {
      const response = await app.request('/api/answers/not-a-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/answers', () => {
    it('should return empty array when no answers exist', async () => {
      const response = await app.request('/api/answers');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.answers).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return all answers', async () => {
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_ID)
          .withAssignmentId(TEST_ASSIGNMENT_ID)
          .withCandidateId(TEST_CANDIDATE_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .build()
      );
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_2_ID)
          .withAssignmentId(TEST_ASSIGNMENT_2_ID)
          .withCandidateId(TEST_CANDIDATE_2_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .build()
      );

      const response = await app.request('/api/answers');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answers).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter by assignment ID', async () => {
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_ID)
          .withAssignmentId(TEST_ASSIGNMENT_ID)
          .withCandidateId(TEST_CANDIDATE_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .build()
      );
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_2_ID)
          .withAssignmentId(TEST_ASSIGNMENT_2_ID)
          .withCandidateId(TEST_CANDIDATE_2_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .build()
      );

      const response = await app.request(`/api/answers?assignmentId=${TEST_ASSIGNMENT_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answers).toHaveLength(1);
      expect(data.answers[0].assignmentId).toBe(TEST_ASSIGNMENT_ID);
    });

    it('should filter by candidate ID', async () => {
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_ID)
          .withAssignmentId(TEST_ASSIGNMENT_ID)
          .withCandidateId(TEST_CANDIDATE_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .build()
      );
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_2_ID)
          .withAssignmentId(TEST_ASSIGNMENT_2_ID)
          .withCandidateId(TEST_CANDIDATE_2_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .build()
      );

      const response = await app.request(`/api/answers?candidateId=${TEST_CANDIDATE_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answers).toHaveLength(1);
      expect(data.answers[0].candidateId).toBe(TEST_CANDIDATE_ID);
    });

    it('should filter by exam ID', async () => {
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_ID)
          .withAssignmentId(TEST_ASSIGNMENT_ID)
          .withCandidateId(TEST_CANDIDATE_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .build()
      );

      const response = await app.request(`/api/answers?examId=${TEST_EXAM_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answers).toHaveLength(1);
      expect(data.answers[0].examId).toBe(TEST_EXAM_ID);
    });

    it('should filter by validity', async () => {
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_ID)
          .withAssignmentId(TEST_ASSIGNMENT_ID)
          .withCandidateId(TEST_CANDIDATE_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .withValid()
          .build()
      );
      await mockAnswerRepo.save(
        createAnswerBuilder()
          .withId(TEST_ANSWER_2_ID)
          .withAssignmentId(TEST_ASSIGNMENT_2_ID)
          .withCandidateId(TEST_CANDIDATE_2_ID)
          .withExamId(TEST_EXAM_ID)
          .withQuestionId(TEST_QUESTION_ID)
          .withInvalid()
          .build()
      );

      const response = await app.request('/api/answers?isValid=true');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answers).toHaveLength(1);
      expect(data.answers[0].isValid).toBe(true);
    });

    it('should paginate results', async () => {
      // Create 5 answers
      for (let i = 1; i <= 5; i++) {
        await mockAnswerRepo.save(
          createAnswerBuilder()
            .withId(crypto.randomUUID())
            .withAssignmentId(TEST_ASSIGNMENT_ID)
            .withCandidateId(TEST_CANDIDATE_ID)
            .withExamId(TEST_EXAM_ID)
            .withQuestionId(TEST_QUESTION_ID)
            .build()
        );
      }

      const response = await app.request('/api/answers?limit=2&offset=1');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answers).toHaveLength(2);
      expect(data.total).toBe(5);
      expect(data.limit).toBe(2);
      expect(data.offset).toBe(1);
    });
  });

  describe('PATCH /api/answers/:id', () => {
    it('should update answer transcription', async () => {
      const answer = createAnswerBuilder()
        .withId(TEST_ANSWER_ID)
        .withAssignmentId(TEST_ASSIGNMENT_ID)
        .withCandidateId(TEST_CANDIDATE_ID)
        .withExamId(TEST_EXAM_ID)
        .withQuestionId(TEST_QUESTION_ID)
        .build();

      await mockAnswerRepo.save(answer);

      const requestBody = {
        transcription: 'This is the transcribed text',
      };

      const response = await app.request(`/api/answers/${TEST_ANSWER_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Answer updated successfully');
      expect(data.answer.transcription).toBe('This is the transcribed text');
    });

    it('should mark answer as valid', async () => {
      const answer = createAnswerBuilder()
        .withId(TEST_ANSWER_ID)
        .withAssignmentId(TEST_ASSIGNMENT_ID)
        .withCandidateId(TEST_CANDIDATE_ID)
        .withExamId(TEST_EXAM_ID)
        .withQuestionId(TEST_QUESTION_ID)
        .withInvalid()
        .build();

      await mockAnswerRepo.save(answer);

      const requestBody = {
        isValid: true,
      };

      const response = await app.request(`/api/answers/${TEST_ANSWER_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answer.isValid).toBe(true);
    });

    it('should update both transcription and validity', async () => {
      const answer = createAnswerBuilder()
        .withId(TEST_ANSWER_ID)
        .withAssignmentId(TEST_ASSIGNMENT_ID)
        .withCandidateId(TEST_CANDIDATE_ID)
        .withExamId(TEST_EXAM_ID)
        .withQuestionId(TEST_QUESTION_ID)
        .withInvalid()
        .build();

      await mockAnswerRepo.save(answer);

      const requestBody = {
        transcription: 'Transcribed text',
        isValid: true,
      };

      const response = await app.request(`/api/answers/${TEST_ANSWER_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.answer.transcription).toBe('Transcribed text');
      expect(data.answer.isValid).toBe(true);
    });

    it('should return 404 for non-existent answer', async () => {
      const requestBody = {
        transcription: 'Updated text',
      };

      const response = await app.request('/api/answers/550e8400-e29b-41d4-a716-446655449999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/answers/:id', () => {
    it('should delete answer', async () => {
      const answer = createAnswerBuilder()
        .withId(TEST_ANSWER_ID)
        .withAssignmentId(TEST_ASSIGNMENT_ID)
        .withCandidateId(TEST_CANDIDATE_ID)
        .withExamId(TEST_EXAM_ID)
        .withQuestionId(TEST_QUESTION_ID)
        .build();

      await mockAnswerRepo.save(answer);

      const response = await app.request(`/api/answers/${TEST_ANSWER_ID}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Answer deleted successfully');

      // Verify answer is deleted
      const deleted = await mockAnswerRepo.findById(TEST_ANSWER_ID);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent answer', async () => {
      const response = await app.request('/api/answers/550e8400-e29b-41d4-a716-446655449999', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
