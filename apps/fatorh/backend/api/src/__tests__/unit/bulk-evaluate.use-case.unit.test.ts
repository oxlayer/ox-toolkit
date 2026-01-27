/**
 * Unit Tests for BulkEvaluate Use Case
 *
 * Tests the bulk evaluate use case with mocked dependencies.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { BulkEvaluateUseCase } from '../../use-cases/evaluations/bulk-evaluate.use-case.js';
import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';
import type { IExamAssignmentRepository } from '../../repositories/exam-assignments/exam-assignment.repository.interface.js';
import type { IAnswerRepository } from '../../repositories/answers/answer.repository.interface.js';
import type { IEvaluationResultRepository } from '../../repositories/evaluation-results/evaluation-result.repository.interface.js';
import type { EventBus } from '../../config/rabbitmq.config.js';
import {
  MockCandidateRepository,
  MockExamAssignmentRepository,
  MockEventBus,
} from '../../test/mocks';
import type { Candidate, ExamAssignment } from '../../domain/evaluations/index.js';

// Simple mocks for Answer and Evaluation repositories (not used in bulk evaluate)
class MockAnswerRepository implements IAnswerRepository {
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

class MockEvaluationResultRepository implements IEvaluationResultRepository {
  async create(): Promise<any> {
    return { id: 'eval-1' };
  }
  async findById(): Promise<any> {
    return null;
  }
  async findByCandidateId(): Promise<any[]> {
    return [];
  }
  async findByExamId(): Promise<any[]> {
    return [];
  }
  async findByAssignmentId(): Promise<any> {
    return null;
  }
  async update(): Promise<any> {
    return null;
  }
  async delete(): Promise<void> {}
}

// Mock the candidate repository
class TestCandidateRepository extends MockCandidateRepository implements ICandidateRepository {
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

  async find(filters: any): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async findByWorkspace(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async update(): Promise<Candidate> {
    return { id: '1', cpf: null, name: '', email: null, externalId: null, createdAt: new Date(), updatedAt: new Date() };
  }

  async delete(): Promise<void> {}
  async exists(): Promise<boolean> {
    return true;
  }
}

// Mock the exam assignment repository
class TestExamAssignmentRepository extends MockExamAssignmentRepository implements IExamAssignmentRepository {
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

  async findByExamId(examId: string): Promise<ExamAssignment[]> {
    return Array.from(this.assignments.values()).filter((a) => a.examId === examId);
  }

  async findByCandidateId(candidateId: string): Promise<ExamAssignment[]> {
    return Array.from(this.assignments.values()).filter((a) => a.candidateId === candidateId);
  }

  async findPendingByCandidate(candidateId: string): Promise<ExamAssignment[]> {
    return Array.from(this.assignments.values()).filter(
      (a) => a.candidateId === candidateId && (a.status === 'pending' || a.status === 'in_progress')
    );
  }

  async updateStatus(): Promise<ExamAssignment> {
    return { id: '1', candidateId: '1', examId: '1', status: 'pending', expiresAt: new Date(), createdAt: new Date(), updatedAt: new Date() };
  }

  async delete(): Promise<void> {}
}

describe('BulkEvaluateUseCase', () => {
  let useCase: BulkEvaluateUseCase;
  let mockCandidateRepo: TestCandidateRepository;
  let mockAssignmentRepo: TestExamAssignmentRepository;
  let mockAnswerRepo: MockAnswerRepository;
  let mockEvalResultRepo: MockEvaluationResultRepository;
  let mockEventBus: MockEventBus;

  beforeEach(() => {
    mockCandidateRepo = new TestCandidateRepository();
    mockAssignmentRepo = new TestExamAssignmentRepository();
    mockAnswerRepo = new MockAnswerRepository();
    mockEvalResultRepo = new MockEvaluationResultRepository();
    mockEventBus = new MockEventBus();
    useCase = new BulkEvaluateUseCase(
      mockCandidateRepo,
      mockAssignmentRepo,
      mockAnswerRepo,
      mockEvalResultRepo,
      mockEventBus as unknown as EventBus
    );
  });

  describe('execute', () => {
    it('should create assignments for multiple users with CPF', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [
          { userId: 'user-1', cpf: '123.456.789-00', name: 'User 1', email: 'user1@test.com' },
          { userId: 'user-2', cpf: '987.654.321-00', name: 'User 2', email: 'user2@test.com' },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(true);
      expect(result.results[0].assignmentId).toBeDefined();
      expect(result.results[1].assignmentId).toBeDefined();
    });

    it('should create assignments for users with external ID', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [
          { userId: 'ext-1', externalId: 'ext-1', name: 'External User 1' },
          { userId: 'ext-2', externalId: 'ext-2', name: 'External User 2' },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(true);
    });

    it('should reuse existing candidates when found by CPF', async () => {
      // Create an existing candidate
      const existingCandidate = await mockCandidateRepo.create({
        id: 'candidate-1',
        workspaceId: 'workspace-1',
        cpf: '123.456.789-00',
        name: 'Existing User',
      });

      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [{ userId: 'user-1', cpf: '123.456.789-00', name: 'New Name' }],
      };

      const result = await useCase.execute(input);

      expect(result.results[0].success).toBe(true);
      // The existing candidate should be reused
      const allCandidates = Array.from(mockCandidateRepo.candidates.values());
      expect(allCandidates).toHaveLength(1);
    });

    it('should reuse existing candidates when found by external ID', async () => {
      // Create an existing candidate
      await mockCandidateRepo.create({
        id: 'candidate-1',
        workspaceId: 'workspace-1',
        externalId: 'ext-123',
        name: 'Existing User',
      });

      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [{ userId: 'user-1', externalId: 'ext-123', name: 'New Name' }],
      };

      const result = await useCase.execute(input);

      expect(result.results[0].success).toBe(true);
      const allCandidates = Array.from(mockCandidateRepo.candidates.values());
      expect(allCandidates).toHaveLength(1);
    });

    it('should reuse existing active assignments', async () => {
      // Create a candidate and an existing assignment
      const candidate = await mockCandidateRepo.create({
        id: 'candidate-1',
        workspaceId: 'workspace-1',
        cpf: '123.456.789-00',
        name: 'User 1',
      });

      const existingAssignment = await mockAssignmentRepo.create({
        candidateId: candidate.id,
        examId: 'exam-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [{ userId: 'user-1', cpf: '123.456.789-00', name: 'User 1' }],
      };

      const result = await useCase.execute(input);

      expect(result.results[0].success).toBe(true);
      expect(result.results[0].assignmentId).toBe(existingAssignment.id);
    });

    it('should publish exam.assigned event for new assignments', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [{ userId: 'user-1', cpf: '123.456.789-00', name: 'User 1' }],
      };

      await useCase.execute(input);

      expect(mockEventBus.wasPublished('exam.assigned')).toBe(true);
      expect(mockEventBus.count('exam.assigned')).toBe(1);

      const events = mockEventBus.getEvents('exam.assigned');
      const eventData = events[0].event as any;
      expect(eventData.examId).toBe('exam-1');
      expect(eventData.workspaceId).toBe('workspace-1');
      expect(eventData.candidateName).toBe('User 1');
    });

    it('should not publish exam.assigned event for existing assignments', async () => {
      // Create a candidate and an existing assignment
      const candidate = await mockCandidateRepo.create({
        id: 'candidate-1',
        workspaceId: 'workspace-1',
        cpf: '123.456.789-00',
        name: 'User 1',
      });

      await mockAssignmentRepo.create({
        candidateId: candidate.id,
        examId: 'exam-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [{ userId: 'user-1', cpf: '123.456.789-00', name: 'User 1' }],
      };

      await useCase.execute(input);

      expect(mockEventBus.wasPublished('exam.assigned')).toBe(false);
    });

    it('should publish evaluation.bulk_completed event', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [
          { userId: 'user-1', cpf: '123.456.789-00', name: 'User 1' },
          { userId: 'user-2', cpf: '987.654.321-00', name: 'User 2' },
        ],
      };

      await useCase.execute(input);

      expect(mockEventBus.wasPublished('evaluation.bulk_completed')).toBe(true);

      const events = mockEventBus.getEvents('evaluation.bulk_completed');
      const eventData = events[0].event as any;
      expect(eventData.examId).toBe('exam-1');
      expect(eventData.workspaceId).toBe('workspace-1');
      expect(eventData.totalUsers).toBe(2);
      expect(eventData.successful).toBe(2);
      expect(eventData.failed).toBe(0);
    });

    it('should handle errors gracefully and continue processing', async () => {
      // Make the candidate repository throw an error for CPF matching a specific pattern
      const originalCreate = mockCandidateRepo.create.bind(mockCandidateRepo);
      mockCandidateRepo.create = async (data: any) => {
        if (data.cpf === 'error.cpf') {
          throw new Error('Invalid CPF');
        }
        return originalCreate(data);
      };

      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [
          { userId: 'user-1', cpf: 'error.cpf', name: 'Error User' },
          { userId: 'user-2', cpf: '123.456.789-00', name: 'Good User' },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].message).toBe('Invalid CPF');
      expect(result.results[1].success).toBe(true);
    });

    it('should create candidate with userId as externalId when no CPF or externalId provided', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [{ userId: 'user-123', name: 'User with ID only' }],
      };

      const result = await useCase.execute(input);

      expect(result.results[0].success).toBe(true);

      const candidates = Array.from(mockCandidateRepo.candidates.values());
      expect(candidates).toHaveLength(1);
      expect(candidates[0].externalId).toBe('user-123');
    });

    it('should set default expiration to 7 days for new assignments', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [{ userId: 'user-1', cpf: '123.456.789-00', name: 'User 1' }],
      };

      const before = Date.now();
      await useCase.execute(input);
      const after = Date.now();

      const assignments = Array.from(mockAssignmentRepo.assignments.values());
      expect(assignments).toHaveLength(1);

      const assignment = assignments[0];
      const expectedMin = before + 7 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 7 * 24 * 60 * 60 * 1000;
      expect(assignment.expiresAt!.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(assignment.expiresAt!.getTime()).toBeLessThanOrEqual(expectedMax + 1000); // Allow 1s tolerance
    });

    it('should use provided name or userId as candidate name', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [
          { userId: 'user-with-name', name: 'Actual Name', cpf: '123.456.789-00' },
          { userId: 'user-without-name', cpf: '987.654.321-00' },
        ],
      };

      await useCase.execute(input);

      const candidates = Array.from(mockCandidateRepo.candidates.values());
      expect(candidates).toHaveLength(2);

      const candidateWithName = candidates.find((c) => c.cpf === '123.456.789-00');
      const candidateWithoutName = candidates.find((c) => c.cpf === '987.654.321-00');

      expect(candidateWithName?.name).toBe('Actual Name');
      expect(candidateWithoutName?.name).toBe('user-without-name');
    });
  });

  describe('event publishing', () => {
    it('should publish bulk_completed event with correct summary', async () => {
      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [
          { userId: 'user-1', cpf: '123.456.789-00', name: 'User 1' },
          { userId: 'user-2', cpf: '987.654.321-00', name: 'User 2' },
          { userId: 'user-3', cpf: '111.222.333-00', name: 'User 3' },
        ],
      };

      await useCase.execute(input);

      const events = mockEventBus.getEvents('evaluation.bulk_completed');
      expect(events).toHaveLength(1);

      const eventData = events[0].event as any;
      expect(eventData.totalUsers).toBe(3);
      expect(eventData.successful).toBe(3);
      expect(eventData.failed).toBe(0);
      expect(eventData.timestamp).toBeDefined();
    });

    it('should include failed count in bulk_completed event when errors occur', async () => {
      // Make the candidate repository throw an error for specific CPFs
      const originalCreate = mockCandidateRepo.create.bind(mockCandidateRepo);
      mockCandidateRepo.create = async (data: any) => {
        if (data.cpf?.startsWith('error')) {
          throw new Error('Invalid CPF');
        }
        return originalCreate(data);
      };

      const input = {
        examId: 'exam-1',
        workspaceId: 'workspace-1',
        users: [
          { userId: 'user-1', cpf: 'error.1', name: 'Error User' },
          { userId: 'user-2', cpf: '123.456.789-00', name: 'Good User' },
          { userId: 'user-3', cpf: 'error.2', name: 'Another Error' },
        ],
      };

      await useCase.execute(input);

      const events = mockEventBus.getEvents('evaluation.bulk_completed');
      const eventData = events[0].event as any;
      expect(eventData.totalUsers).toBe(3);
      expect(eventData.successful).toBe(1);
      expect(eventData.failed).toBe(2);
    });
  });
});
