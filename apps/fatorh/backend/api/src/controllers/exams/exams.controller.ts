/**
 * Exams Controller
 *
 * HTTP handlers for exam endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateExamUseCase } from '../../../use-cases/exams/create-exam.use-case.js';
import type { GetExamUseCase } from '../../../use-cases/exams/get-exam.use-case.js';
import type { ListExamsUseCase } from '../../../use-cases/exams/list-exams.use-case.js';
import type { DeleteExamUseCase } from '../../../use-cases/exams/delete-exam.use-case.js';
import type { UpdateExamUseCase } from '../../../use-cases/exams/update-exam.use-case.js';

/**
 * Create Exam Schema
 */
const createExamSchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID'),
  examName: z.string().min(1).describe('Exam name'),
  durationMinutes: z.number().int().min(1).max(120).optional().describe('Duration in minutes'),
  questions: z.array(
    z.object({
      priority: z.number().describe('Question priority/order'),
      text: z.string().describe('Question text'),
      type: z.enum(['text', 'audio']).describe('Question type'),
    })
  ).min(1).describe('Array of questions'),
});

/**
 * List Exams Query Schema
 */
const listExamsQuerySchema = z.object({
  workspaceId: z.string().uuid().optional().describe('Filter by workspace ID'),
});

/**
 * Update Exam Schema
 */
const updateExamSchema = z.object({
  examName: z.string().min(1).optional().describe('Exam name'),
  durationMinutes: z.number().int().min(1).max(120).optional().describe('Duration in minutes'),
});

/**
 * Exams Controller
 */
export class ExamsController extends BaseController {
  constructor(
    private createExamUseCase: CreateExamUseCase,
    private getExamUseCase: GetExamUseCase,
    private listExamsUseCase: ListExamsUseCase,
    private deleteExamUseCase: DeleteExamUseCase,
    private updateExamUseCase: UpdateExamUseCase
  ) {
    super();
  }

  /**
   * POST /api/exams - Create a new exam
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createExamSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.createExamUseCase.execute(input.data);

      return this.created({
        message: 'Exam created successfully',
        examId: result.examId,
        questionIds: result.questionIds,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/exams/:id - Get exam by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid exam ID');
      }

      const exam = await this.getExamUseCase.execute({ id });

      if (!exam) {
        return this.notFound('Exam not found');
      }

      return this.ok({
        message: 'Exam retrieved successfully',
        exam,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/exams/:id/questions - Get exam with questions
   */
  async getWithQuestions(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid exam ID');
      }

      const result = await this.getExamUseCase.execute({ id });

      if (!result) {
        return this.notFound('Exam not found');
      }

      return this.ok({
        message: 'Exam retrieved successfully',
        examId: result.id,
        examName: result.examName,
        durationMinutes: result.durationMinutes,
        questions: result.questions,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/exams - List exams
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listExamsQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const exams = await this.listExamsUseCase.execute({
        workspaceId: query.data.workspaceId,
      });

      // Return exams array directly (frontend expects array, not wrapped object)
      return c.json(exams);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/exams/:id - Delete an exam
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid exam ID');
      }

      const result = await this.deleteExamUseCase.execute({ id });

      return this.ok({
        message: 'Exam deleted successfully',
        exam: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/exams/:id - Update an exam
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateExamSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid exam ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.updateExamUseCase.execute({
        id,
        ...input.data,
      });

      return this.ok({
        message: 'Exam updated successfully',
        exam: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
