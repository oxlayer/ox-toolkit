/**
 * Exam Candidates Controller
 *
 * HTTP handlers for exam candidate endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { AddExamCandidateUseCase } from '../../use-cases/exam-candidates/add-exam-candidate.use-case.js';
import type { GetExamCandidateUseCase } from '../../use-cases/exam-candidates/get-exam-candidate.use-case.js';
import type { RemoveExamCandidateUseCase } from '../../use-cases/exam-candidates/remove-exam-candidate.use-case.js';

/**
 * Add Exam Candidate Schema
 */
const addExamCandidateSchema = z.object({
  examId: z.string().uuid().describe('Exam ID'),
  userId: z.string().uuid().describe('User/Candidate ID'),
  workspaceId: z.string().uuid().describe('Workspace ID (required - user may belong to multiple workspaces)'),
});

/**
 * List Exam Candidates Query Schema
 */
const listExamCandidatesQuerySchema = z.object({
  examId: z.string().uuid().optional().describe('Filter by exam ID'),
  userId: z.string().uuid().optional().describe('Filter by user/candidate ID'),
});

/**
 * Exam Candidates Controller
 */
export class ExamCandidatesController extends BaseController {
  constructor(
    private addExamCandidateUseCase: AddExamCandidateUseCase,
    private getExamCandidateUseCase: GetExamCandidateUseCase,
    private removeExamCandidateUseCase: RemoveExamCandidateUseCase
  ) {
    super();
  }

  /**
   * POST /api/exam-candidates - Add a candidate to an exam
   */
  async add(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = addExamCandidateSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      // Get user info from auth payload for auto-creating candidate
      const authPayload = c.get('authPayload');
      const userName = authPayload?.name || authPayload?.given_name
        ? [authPayload.given_name, authPayload.family_name].filter(Boolean).join(' ')
        : undefined;
      const userEmail = authPayload?.email;

      const result = await this.addExamCandidateUseCase.execute({
        examId: input.data.examId,
        userId: input.data.userId,
        workspaceId: input.data.workspaceId,
        userName,
        userEmail,
      });

      return this.created({
        message: 'Exam candidate created successfully',
        examCandidate: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/exam-candidates/:id - Get exam candidate by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid exam candidate ID');
      }

      const result = await this.getExamCandidateUseCase.execute({ id });

      return this.ok({
        message: 'Exam candidate retrieved successfully',
        examCandidate: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/exam-candidates - List exam candidates
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listExamCandidatesQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.getExamCandidateUseCase.execute({
        examId: query.data.examId,
        userId: query.data.userId,
      });

      return this.ok({
        message: 'Exam candidates retrieved successfully',
        examCandidates: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/exam-candidates/:id - Remove an exam candidate
   */
  async remove(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid exam candidate ID');
      }

      const result = await this.removeExamCandidateUseCase.execute({ id });

      return this.ok({
        message: 'Exam candidate removed successfully',
        examCandidate: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }
}