/**
 * Answers Controller
 *
 * HTTP handlers for answer endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateAnswerUseCase } from '../../../use-cases/answers/create-answer.use-case.js';
import type { GetAnswerUseCase } from '../../../use-cases/answers/get-answer.use-case.js';
import type { ListAnswersUseCase } from '../../../use-cases/answers/list-answers.use-case.js';
import type { UpdateAnswerUseCase } from '../../../use-cases/answers/update-answer.use-case.js';
import type { DeleteAnswerUseCase } from '../../../use-cases/answers/delete-answer.use-case.js';

/**
 * Create Answer Schema
 */
const createAnswerSchema = z.object({
  assignmentId: z.string().uuid().describe('Assignment ID'),
  candidateId: z.string().uuid().describe('Candidate ID'),
  examId: z.string().uuid().describe('Exam ID'),
  questionId: z.string().uuid().describe('Question ID'),
  s3Url: z.string().url().describe('S3 URL for audio file'),
  duration: z.number().positive().describe('Duration in seconds'),
  contentType: z.string().describe('Content type (e.g., audio/mp3)'),
  fileSize: z.number().positive().describe('File size in bytes'),
});

/**
 * Update Answer Schema
 */
const updateAnswerSchema = z.object({
  transcription: z.string().optional().describe('Transcribed text'),
  isValid: z.boolean().optional().describe('Whether the answer is valid'),
});

/**
 * List Answers Query Schema
 */
const listAnswersQuerySchema = z.object({
  assignmentId: z.string().uuid().optional().describe('Filter by assignment ID'),
  candidateId: z.string().uuid().optional().describe('Filter by candidate ID'),
  examId: z.string().uuid().optional().describe('Filter by exam ID'),
  questionId: z.string().uuid().optional().describe('Filter by question ID'),
  isValid: z.string().transform((v) => v === 'true').optional().describe('Filter by validity'),
  limit: z.string().transform(Number).optional().describe('Limit results'),
  offset: z.string().transform(Number).optional().describe('Offset results'),
});

/**
 * Answers Controller
 */
export class AnswersController extends BaseController {
  constructor(
    private createAnswerUseCase: CreateAnswerUseCase,
    private getAnswerUseCase: GetAnswerUseCase,
    private listAnswersUseCase: ListAnswersUseCase,
    private updateAnswerUseCase: UpdateAnswerUseCase,
    private deleteAnswerUseCase: DeleteAnswerUseCase
  ) {
    super();
  }

  /**
   * POST /api/answers - Create a new answer
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createAnswerSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.createAnswerUseCase.execute(input.data);

      return this.created({
        message: 'Answer created successfully',
        answer: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/answers/:id - Get answer by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid answer ID');
      }

      const answer = await this.getAnswerUseCase.execute({ id });

      if (!answer) {
        return this.notFound('Answer not found');
      }

      return this.ok({
        message: 'Answer retrieved successfully',
        answer,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/answers - List answers
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listAnswersQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.listAnswersUseCase.execute({
        assignmentId: query.data.assignmentId,
        candidateId: query.data.candidateId,
        examId: query.data.examId,
        questionId: query.data.questionId,
        isValid: query.data.isValid,
        limit: query.data.limit,
        offset: query.data.offset,
      });

      return this.ok({
        answers: result.answers,
        total: result.total,
        limit: query.data.limit ?? 50,
        offset: query.data.offset ?? 0,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/answers/:id - Update an answer
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateAnswerSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid answer ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.updateAnswerUseCase.execute({
        id,
        ...input.data,
      });

      return this.ok({
        message: 'Answer updated successfully',
        answer: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/answers/:id - Delete an answer
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid answer ID');
      }

      await this.deleteAnswerUseCase.execute({ id });

      return this.ok({
        message: 'Answer deleted successfully',
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
