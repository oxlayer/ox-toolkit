/**
 * Evaluations Controller
 *
 * HTTP handlers for evaluation endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { AssignExamUseCase } from '../../../use-cases/exam-assignments/assign-exam.use-case.js';
import type { BulkEvaluateUseCase } from '../../../use-cases/evaluations/bulk-evaluate.use-case.js';
import type { GetEvaluationUseCase } from '../../../use-cases/evaluations/get-evaluation.use-case.js';
import type { ListEvaluationResultsUseCase } from '../../../use-cases/evaluations/list-evaluation-results.use-case.js';

/**
 * Bulk Evaluate Schema
 */
const bulkEvaluateSchema = z.object({
  exam_id: z.string().uuid().describe('Exam ID'),
  users: z.array(
    z.object({
      user_id: z.string().uuid().describe('User ID'),
      cpf: z.string().optional().describe('User CPF'),
      name: z.string().optional().describe('User name'),
      email: z.string().email().optional().describe('User email'),
      externalId: z.string().optional().describe('External ID'),
    })
  ).min(1).describe('Array of users to evaluate'),
});

/**
 * Get Evaluation by Exam and CPF Schema
 */
const getByExamCpfSchema = z.object({
  exam_id: z.string().uuid().describe('Exam ID'),
  cpf: z.string().describe('User CPF'),
});

/**
 * Evaluations Controller
 */
export class EvaluationsController extends BaseController {
  constructor(
    private assignExamUseCase: AssignExamUseCase,
    private bulkEvaluateUseCase: BulkEvaluateUseCase,
    private getEvaluationUseCase: GetEvaluationUseCase,
    private listEvaluationResultsUseCase: ListEvaluationResultsUseCase
  ) {
    super();
  }

  /**
   * POST /api/evaluations/bulk - Bulk evaluate users for an exam
   */
  async bulkEvaluate(c: Context): Promise<Response> {
    try {
      const workspaceId = c.req.header('x-workspace-id');
      const body = await c.req.json();
      const input = bulkEvaluateSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.bulkEvaluateUseCase.execute({
        examId: input.data.exam_id,
        users: input.data.users,
        workspaceId: workspaceId || input.data.exam_id, // Fallback to exam_id
      });

      return this.ok(result);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/evaluations/:id - Get evaluation by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid evaluation ID');
      }

      const evaluation = await this.getEvaluationUseCase.execute({ id });

      if (!evaluation) {
        return this.notFound('Evaluation not found');
      }

      return this.ok({ evaluation });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/evaluations/by-exam-cpf - Get evaluation by exam and CPF
   */
  async getByExamAndCpf(c: Context): Promise<Response> {
    try {
      const query = getByExamCpfSchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      // TODO: Implement by exam and CPF lookup
      // For now, return an error
      return this.badRequest('Not implemented yet');
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/evaluations/results - List evaluation results with filters
   */
  async list(c: Context): Promise<Response> {
    try {
      const examId = c.req.query('examId');
      const candidateId = c.req.query('candidateId');
      const assignmentId = c.req.query('assignmentId');

      const result = await this.listEvaluationResultsUseCase.execute({
        examId,
        candidateId,
        assignmentId,
      });

      return this.ok({
        results: result.results,
        total: result.total,
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
