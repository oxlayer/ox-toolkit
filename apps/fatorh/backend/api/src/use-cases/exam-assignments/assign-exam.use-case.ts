/**
 * Assign Exam Use Case
 *
 * Business logic for assigning an exam to a candidate.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { EventBus } from '../../config/rabbitmq.config.js';
import type { IExamAssignmentRepository } from '../../repositories/exam-assignments/exam-assignment.repository.interface.js';
import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';
import type { IExamRepository } from '../../repositories/exams/exam.repository.interface.js';
import { ExamAssignment, CreateExamAssignmentInput } from '../../domain/evaluations/index.js';

export interface AssignExamInput {
  candidateId: string;
  examId: string;
  expiresAt?: Date;
}

export interface AssignExamOutput {
  assignmentId: string;
  candidateId: string;
  examId: string;
  status: string;
  assignedAt: Date;
  expiresAt?: Date;
}

/**
 * Assign Exam Use Case
 */
export class AssignExamUseCase {
  constructor(
    private examAssignmentRepository: IExamAssignmentRepository,
    private candidateRepository: ICandidateRepository,
    private examRepository: IExamRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: AssignExamInput): Promise<AssignExamOutput> {
    // Validate candidate exists
    const candidate = await this.candidateRepository.findById(input.candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    // Validate exam exists
    const exam = await this.examRepository.findById(input.examId);
    if (!exam) {
      throw new Error('Exam not found');
    }

    // Check if candidate has a pending or in-progress assignment for this exam
    const existingAssignments = await this.examAssignmentRepository.findByExamId(input.examId);
    const pendingAssignment = existingAssignments.find(
      (a) => a.candidateId === input.candidateId && (a.status === 'pending' || a.status === 'in_progress')
    );

    if (pendingAssignment) {
      throw new Error('Candidate already has a pending or in-progress assignment for this exam');
    }

    // Create assignment
    const assignment = ExamAssignment.create({
      id: generateId(),
      candidateId: input.candidateId,
      examId: input.examId,
      expiresAt: input.expiresAt,
    });

    // Save to database
    const savedAssignment = await this.examAssignmentRepository.create({
      candidateId: assignment.candidateId,
      examId: assignment.examId,
      expiresAt: assignment.expiresAt,
    });

    // Publish domain event
    await this.eventBus.publish(
      'globex.events',
      'exam.assigned',
      {
        assignmentId: assignment.id,
        examId: assignment.examId,
        examName: exam.examName,
        candidateId: assignment.candidateId,
        candidateName: candidate.name,
        workspaceId: exam.workspaceId,
        assignedAt: assignment.assignedAt.toISOString(),
        expiresAt: assignment.expiresAt?.toISOString(),
      }
    );

    return {
      assignmentId: savedAssignment.id,
      candidateId: savedAssignment.candidateId,
      examId: savedAssignment.examId,
      status: savedAssignment.status,
      assignedAt: savedAssignment.assignedAt,
      expiresAt: savedAssignment.expiresAt,
    };
  }
}
