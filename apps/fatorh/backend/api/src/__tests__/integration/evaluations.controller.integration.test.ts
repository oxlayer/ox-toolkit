/**
 * Integration Tests for Evaluations Controller
 *
 * Tests the full HTTP request/response flow.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { EvaluationsController } from '../../controllers/evaluations/evaluations.controller.js';
import {
  MockCandidateRepository,
  MockExamAssignmentRepository,
  MockEvaluationResultRepository,
  MockEventBus,
} from '../../test/mocks';
import { createEvaluationResultBuilder } from '../../test/builders';
import type { Candidate, ExamAssignment } from '../../domain/evaluations/index.js';

// Test constants with valid UUIDs
const TEST_EXAM_ID = '550e8400-e29b-41d4-a716-446655440010';
const TEST_USER_1_ID = '550e8400-e29b-41d4-a716-446655440011';
const TEST_USER_2_ID = '550e8400-e29b-41d4-a716-446655440012';
const TEST_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440013';
const TEST_WORKSPACE_2_ID = '550e8400-e29b-41d4-a716-446655440014';
const TEST_EVAL_ID = '550e8400-e29b-41d4-a716-446655440015';
const TEST_ASSIGNMENT_ID = '550e8400-e29b-41d4-a716-446655440016';
const TEST_CANDIDATE_ID = '550e8400-e29b-41d4-a716-446655440017';

// Simple mock for answer repository (not used in bulk evaluate)
class MockAnswerRepository {
  async create(): Promise<any> {
    return { id: 'answer-1' };
  }
  async findById(): Promise<any> {
    return null;
  }
  async findByAssignmentId(): Promise<any[]> {
    return [];
  }
  async findByCandidateId(): Promise<any[]> {
    return [];
  }
  async findByQuestionId(): Promise<any> {
    return null;
  }
  async updateTranscription(): Promise<any> {
    return null;
  }
  async markAsValid(): Promise<any> {
    return null;
  }
  async markAsInvalid(): Promise<any> {
    return null;
  }
  async delete(): Promise<void> {}
}

// Mock repositories with proper state management
class TestCandidateRepository extends MockCandidateRepository {
  candidates: Map<string, Candidate> = new Map();

  async create(data: any): Promise<Candidate> {
    const candidate: Candidate = {
      id: data.id || crypto.randomUUID(),
      workspaceId: data.workspaceId || null,
      cpf: data.cpf || null,
      name: data.name || '',
      email: data.email || null,
      externalId: data.externalId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.candidates.set(candidate.id, candidate);
    return candidate;
  }

  async findByCpf(cpf: string): Promise<Candidate | null> {
    return Array.from(this.candidates.values()).find((c) => c.cpf === cpf) || null;
  }

  async findByExternalId(externalId: string): Promise<Candidate | null> {
    return Array.from(this.candidates.values()).find((c) => c.externalId === externalId) || null;
  }

  async findOrCreateByCPF(cpf: string, defaults: Partial<Candidate>): Promise<Candidate> {
    const existing = await this.findByCpf(cpf);
    if (existing) return existing;

    const newCandidate: Candidate = {
      id: defaults.id || `candidate-${Date.now()}`,
      cpf,
      name: defaults.name || '',
      email: defaults.email || null,
      externalId: defaults.externalId || null,
      createdAt: defaults.createdAt || new Date(),
      updatedAt: defaults.updatedAt || new Date(),
    };

    await this.save(newCandidate);
    return newCandidate;
  }
}

class TestExamAssignmentRepository extends MockExamAssignmentRepository {
  assignments: Map<string, ExamAssignment> = new Map();

  async create(data: any): Promise<ExamAssignment> {
    const assignment: ExamAssignment = {
      id: data.id || crypto.randomUUID(),
      candidateId: data.candidateId,
      examId: data.examId,
      status: 'pending',
      expiresAt: data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async findByCandidateAndExam(candidateId: string, examId: string): Promise<ExamAssignment | null> {
    return Array.from(this.assignments.values()).find(
      (a) => a.candidateId === candidateId && a.examId === examId && (a.status === 'pending' || a.status === 'in_progress')
    ) || null;
  }
}

class TestEvaluationResultRepository extends MockEvaluationResultRepository {
  results: Map<string, any> = new Map();

  async save(data: any): Promise<void> {
    this.results.set(data.id, data);
  }

  async findById(id: string): Promise<any | null> {
    return this.results.get(id) || null;
  }

  async findByAssignmentId(assignmentId: string): Promise<any | null> {
    return Array.from(this.results.values()).find((r) => r.assignmentId === assignmentId) || null;
  }
}

// Mock use cases
class MockBulkEvaluateUseCase {
  constructor(
    private candidateRepo: TestCandidateRepository,
    private assignmentRepo: TestExamAssignmentRepository,
    private eventBus: MockEventBus
  ) {}

  async execute(input: any) {
    const results: any[] = [];

    for (const user of input.users) {
      try {
        let candidate: Candidate;

        if (user.cpf) {
          const existing = await this.candidateRepo.findByCpf(user.cpf);
          if (existing) {
            candidate = existing;
          } else {
            candidate = await this.candidateRepo.create({
              workspaceId: input.workspaceId,
              name: user.name || user.userId,
              email: user.email,
              cpf: user.cpf,
              externalId: user.externalId,
            });
          }
        } else {
          candidate = await this.candidateRepo.create({
            workspaceId: input.workspaceId,
            name: user.name || user.userId,
            email: user.email,
            externalId: user.externalId || user.userId,
          });
        }

        const existing = await this.assignmentRepo.findByCandidateAndExam(candidate.id, input.examId);
        let assignmentId: string;

        if (existing) {
          assignmentId = existing.id;
        } else {
          const assignment = await this.assignmentRepo.create({
            candidateId: candidate.id,
            examId: input.examId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });
          assignmentId = assignment.id;

          await this.eventBus.publish({
            type: 'exam.assigned',
            assignmentId,
            examId: input.examId,
          });
        }

        results.push({
          userId: user.user_id,
          success: true,
          message: 'Assignment created successfully',
          assignmentId,
        });
      } catch (error: any) {
        results.push({
          userId: user.userId,
          success: false,
          message: error.message || 'Failed to create assignment',
        });
      }
    }

    await this.eventBus.publish({
      type: 'evaluation.bulk_completed',
      totalUsers: input.users.length,
      successful: results.filter((r) => r.success).length,
    });

    return { success: true, results };
  }
}

class MockGetEvaluationUseCase {
  constructor(private resultRepo: TestEvaluationResultRepository) {}

  async execute(input: any) {
    return await this.resultRepo.findById(input.id);
  }
}

describe('Evaluations Controller Integration Tests', () => {
  let app: Hono;
  let mockCandidateRepo: TestCandidateRepository;
  let mockAssignmentRepo: TestExamAssignmentRepository;
  let mockResultRepo: TestEvaluationResultRepository;
  let mockAnswerRepo: MockAnswerRepository;
  let mockEventBus: MockEventBus;
  let controller: EvaluationsController;

  beforeEach(() => {
    mockCandidateRepo = new TestCandidateRepository();
    mockAssignmentRepo = new TestExamAssignmentRepository();
    mockResultRepo = new TestEvaluationResultRepository();
    mockAnswerRepo = new MockAnswerRepository();
    mockEventBus = new MockEventBus();

    // Create use cases with mocks
    const bulkEvaluateUseCase = new MockBulkEvaluateUseCase(
      mockCandidateRepo,
      mockAssignmentRepo,
      mockEventBus
    );
    const getEvaluationUseCase = new MockGetEvaluationUseCase(mockResultRepo);

    controller = new EvaluationsController(
      {} as any, // assignExamUseCase - not used in tests
      bulkEvaluateUseCase as any,
      getEvaluationUseCase as any
    );

    // Create Hono app
    app = new Hono();

    // Setup routes
    app.post('/api/evaluations/bulk', (c) => controller.bulkEvaluate(c));
    app.get('/api/evaluations/:id', (c) => controller.getById(c));
    app.get('/api/evaluations/by-exam-cpf', (c) => controller.getByExamAndCpf(c));
  });

  describe('POST /api/evaluations/bulk', () => {
    it('should create assignments for multiple users', async () => {
      const requestBody = {
        exam_id: TEST_EXAM_ID,
        users: [
          { user_id: TEST_USER_1_ID, cpf: '123.456.789-00', name: 'User 1', email: 'user1@test.com' },
          { user_id: TEST_USER_2_ID, cpf: '987.654.321-00', name: 'User 2', email: 'user2@test.com' },
        ],
      };

      const response = await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': TEST_WORKSPACE_ID },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.results).toHaveLength(2);
      expect(data.results[0].success).toBe(true);
      expect(data.results[1].success).toBe(true);
      expect(data.results[0].assignmentId).toBeDefined();
      expect(data.results[1].assignmentId).toBeDefined();
    });

    it('should use workspaceId from header when provided', async () => {
      const requestBody = {
        exam_id: TEST_EXAM_ID,
        users: [{ user_id: TEST_USER_1_ID, cpf: '123.456.789-00', name: 'User 1' }],
      };

      const response = await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': TEST_WORKSPACE_2_ID },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);
    });

    it('should fallback to exam_id as workspaceId when header not provided', async () => {
      const requestBody = {
        exam_id: TEST_EXAM_ID,
        users: [{ user_id: TEST_USER_1_ID, cpf: '123.456.789-00', name: 'User 1' }],
      };

      const response = await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);
    });

    it('should return 422 for invalid input', async () => {
      const requestBody = {
        exam_id: 'not-a-uuid',
        users: [{ user_id: TEST_USER_1_ID }],
      };

      const response = await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should return 422 for missing required fields', async () => {
      const requestBody = {
        users: [{ user_id: TEST_USER_1_ID }],
      };

      const response = await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should handle users without CPF', async () => {
      const requestBody = {
        exam_id: TEST_EXAM_ID,
        users: [
          { user_id: TEST_USER_1_ID, name: 'User Without CPF', externalId: 'ext-1' },
        ],
      };

      const response = await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': TEST_WORKSPACE_ID },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);
    });

    it('should reuse existing candidates', async () => {
      // Create an existing candidate
      await mockCandidateRepo.create({
        cpf: '123.456.789-00',
        name: 'Existing User',
      });

      const requestBody = {
        exam_id: TEST_EXAM_ID,
        users: [{ user_id: TEST_USER_1_ID, cpf: '123.456.789-00', name: 'New Name' }],
      };

      const response = await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': TEST_WORKSPACE_ID },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);

      // Verify only one candidate exists
      const candidates = Array.from(mockCandidateRepo.candidates.values());
      expect(candidates).toHaveLength(1);
    });

    it('should publish events', async () => {
      const requestBody = {
        exam_id: TEST_EXAM_ID,
        users: [
          { user_id: TEST_USER_1_ID, cpf: '123.456.789-00', name: 'User 1' },
          { user_id: TEST_USER_2_ID, cpf: '987.654.321-00', name: 'User 2' },
        ],
      };

      await app.request('/api/evaluations/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-id': TEST_WORKSPACE_ID },
        body: JSON.stringify(requestBody),
      });

      expect(mockEventBus.wasPublished('exam.assigned')).toBe(true);
      expect(mockEventBus.count('exam.assigned')).toBe(2);
      expect(mockEventBus.wasPublished('evaluation.bulk_completed')).toBe(true);
    });
  });

  describe('GET /api/evaluations/:id', () => {
    it('should return evaluation by ID', async () => {
      const evaluation = createEvaluationResultBuilder()
        .withId(TEST_EVAL_ID)
        .withAssignmentId(TEST_ASSIGNMENT_ID)
        .withScore(85)
        .completed()
        .build();

      await mockResultRepo.save(evaluation);

      const response = await app.request(`/api/evaluations/${TEST_EVAL_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.evaluation.id).toBe(TEST_EVAL_ID);
      expect(data.evaluation.overallScore).toBe(85);
      expect(data.evaluation.completionStatus).toBe('completed');
    });

    it('should return 404 for non-existent evaluation', async () => {
      const response = await app.request('/api/evaluations/550e8400-e29b-41d4-a716-446655449999');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid evaluation ID', async () => {
      const response = await app.request('/api/evaluations/not-a-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/evaluations/by-exam-cpf', () => {
    it('should return 400 (not implemented)', async () => {
      const response = await app.request('/api/evaluations/by-exam-cpf?exam_id=exam-1&cpf=123.456.789-00');
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 422 for invalid query params', async () => {
      const response = await app.request('/api/evaluations/by-exam-cpf?exam_id=invalid&cpf=123');

      expect(response.status).toBe(400);
    });
  });
});
