/**
 * Bulk Evaluate Use Case
 *
 * Business logic for bulk evaluating candidates for an exam.
 */

import { generateId } from '@oxlayer/foundation-domain-kit';
import type { EventBus } from '../../config/rabbitmq.config.js';
import type { ICandidateRepository } from '../../repositories/candidates/candidate.repository.interface.js';
import type { IExamAssignmentRepository } from '../../repositories/exam-assignments/exam-assignment.repository.interface.js';
import type { IAnswerRepository } from '../../repositories/answers/answer.repository.interface.js';
import type { IEvaluationResultRepository } from '../../repositories/evaluation-results/evaluation-result.repository.interface.js';
import { Candidate, ExamAssignment, Answer, EvaluationResult, CreateCandidateInput } from '../../domain/evaluations/index.js';

export interface BulkEvaluateInput {
  examId: string;
  users: Array<{
    userId: string;
    cpf?: string;
    name?: string;
    email?: string;
    externalId?: string;
  }>;
  workspaceId: string;
}

export interface BulkEvaluateOutput {
  success: boolean;
  results: Array<{
    userId: string;
    success: boolean;
    message: string;
    assignmentId?: string;
  }>;
}

/**
 * Bulk Evaluate Use Case
 */
export class BulkEvaluateUseCase {
  constructor(
    private candidateRepository: ICandidateRepository,
    private examAssignmentRepository: IExamAssignmentRepository,
    private answerRepository: IAnswerRepository,
    private evaluationResultRepository: IEvaluationResultRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Execute the use case
   */
  async execute(input: BulkEvaluateInput): Promise<BulkEvaluateOutput> {
    const results: BulkEvaluateOutput['results'] = [];

    for (const user of input.users) {
      try {
        // Find or create candidate
        let candidate: Candidate;

        if (user.cpf) {
          // Try to find by CPF
          const existingByCpf = await this.candidateRepository.findByCpf(user.cpf);
          if (existingByCpf) {
            candidate = existingByCpf;
          } else {
            // Create new candidate with CPF
            candidate = await this.candidateRepository.create({
              id: generateId(),
              workspaceId: input.workspaceId,
              name: user.name || user.userId,
              email: user.email,
              cpf: user.cpf,
              externalId: user.externalId,
            });
          }
        } else if (user.externalId) {
          // Try to find by external ID
          const existingByExternalId = await this.candidateRepository.findByExternalId(user.externalId);
          if (existingByExternalId) {
            candidate = existingByExternalId;
          } else {
            // Create new candidate with external ID
            candidate = await this.candidateRepository.create({
              id: generateId(),
              workspaceId: input.workspaceId,
              name: user.name || user.userId,
              email: user.email,
              externalId: user.externalId,
            });
          }
        } else {
          // Create new candidate with user ID as external ID
          candidate = await this.candidateRepository.create({
            id: generateId(),
            workspaceId: input.workspaceId,
            name: user.name || user.userId,
            email: user.email,
            externalId: user.userId,
          });
        }

        // Check for existing assignment
        const existingAssignments = await this.examAssignmentRepository.findByExamId(input.examId);
        const existingAssignment = existingAssignments.find(
          (a) => a.candidateId === candidate.id && (a.status === 'pending' || a.status === 'in_progress')
        );

        let assignmentId: string;

        if (existingAssignment) {
          assignmentId = existingAssignment.id;
        } else {
          // Create new assignment
          const assignment = await this.examAssignmentRepository.create({
            candidateId: candidate.id,
            examId: input.examId,
            // Default expiration: 7 days from now
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });

          assignmentId = assignment.id;

          // Publish assignment event
          await this.eventBus.publish(
            'globex.events',
            'exam.assigned',
            {
              assignmentId: assignment.id,
              examId: input.examId,
              candidateId: candidate.id,
              candidateName: candidate.name,
              workspaceId: input.workspaceId,
            }
          );
        }

        results.push({
          userId: user.userId,
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

    // Publish bulk evaluation event
    await this.eventBus.publish(
      'globex.events',
      'evaluation.bulk_completed',
      {
        examId: input.examId,
        workspaceId: input.workspaceId,
        totalUsers: input.users.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        timestamp: new Date().toISOString(),
      }
    );

    return {
      success: true,
      results,
    };
  }
}
