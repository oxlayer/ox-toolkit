/**
 * Questions Controller
 *
 * HTTP handlers for question endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateQuestionUseCase } from '../../../use-cases/questions/create-question.use-case.js';
import type { GetQuestionUseCase } from '../../../use-cases/questions/get-question.use-case.js';
import type { ListQuestionsUseCase } from '../../../use-cases/questions/list-questions.use-case.js';
import type { UpdateQuestionUseCase } from '../../../use-cases/questions/update-question.use-case.js';
import type { DeleteQuestionUseCase } from '../../../use-cases/questions/delete-question.use-case.js';

/**
 * Create Question Schema
 */
const createQuestionSchema = z.object({
  examId: z.string().uuid().describe('Exam ID'),
  order: z.number().int().min(1).optional().describe('Question order (alias for priority)'),
  priority: z.number().int().min(1).optional().describe('Question priority/order'),
  text: z.string().min(1).describe('Question text'),
  type: z.enum(['text', 'audio', 'technical', 'behavioral', 'situational']).optional().describe('Question type - can be presentation format (text/audio) or category (technical/behavioral/situational)'),
  weight: z.string().optional().describe('Question category/weight (technical/behavioral/situational)'),
});

/**
 * Update Question Schema
 */
const updateQuestionSchema = z.object({
  order: z.number().int().min(1).optional().describe('Question order (alias for priority)'),
  priority: z.number().int().min(1).optional().describe('Question priority/order'),
  text: z.string().min(1).optional().describe('Question text'),
  type: z.enum(['text', 'audio', 'technical', 'behavioral', 'situational']).optional().describe('Question type - can be presentation format (text/audio) or category (technical/behavioral/situational)'),
  weight: z.string().optional().describe('Question category/weight (technical/behavioral/situational)'),
});

/**
 * List Questions Query Schema
 */
const listQuestionsQuerySchema = z.object({
  examId: z.string().uuid().optional().describe('Filter by exam ID'),
  type: z.enum(['text', 'audio']).optional().describe('Filter by type'),
  limit: z.string().transform(Number).optional().describe('Limit results'),
  offset: z.string().transform(Number).optional().describe('Offset results'),
});

/**
 * Questions Controller
 */
export class QuestionsController extends BaseController {
  constructor(
    private createQuestionUseCase: CreateQuestionUseCase,
    private getQuestionUseCase: GetQuestionUseCase,
    private listQuestionsUseCase: ListQuestionsUseCase,
    private updateQuestionUseCase: UpdateQuestionUseCase,
    private deleteQuestionUseCase: DeleteQuestionUseCase
  ) {
    super();
  }

  /**
   * POST /api/questions - Create a new question
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createQuestionSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      // Map frontend fields to backend fields:
      // - order -> priority
      // - type (technical/behavioral/situational) -> weight
      // - Default type (presentation format) to 'text'
      const priority = input.data.priority ?? input.data.order;
      const weight = input.data.weight;
      const type = input.data.type; // text/audio presentation format

      // If frontend sends 'type' as technical/behavioral/situational, treat it as weight
      const questionType = input.data.type;
      const isCategoryType = questionType && ['technical', 'behavioral', 'situational'].includes(questionType);

      const result = await this.createQuestionUseCase.execute({
        examId: input.data.examId,
        priority,
        text: input.data.text,
        type: isCategoryType ? 'text' : (type ?? 'text'),
        weight: isCategoryType ? questionType : (weight ?? 'medium'),
      });

      return this.created({
        message: 'Question created successfully',
        question: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/questions/:id - Get question by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid question ID');
      }

      const question = await this.getQuestionUseCase.execute({ id });

      if (!question) {
        return this.notFound('Question not found');
      }

      return this.ok({
        message: 'Question retrieved successfully',
        question,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/questions - List questions
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listQuestionsQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.listQuestionsUseCase.execute({
        examId: query.data.examId,
        type: query.data.type,
        limit: query.data.limit,
        offset: query.data.offset,
      });

      // Return questions array directly (frontend expects array, not wrapped object)
      return c.json(result.questions);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/questions/:id - Update a question
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateQuestionSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid question ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      // Map frontend fields to backend fields:
      // - order -> priority
      // - type (technical/behavioral/situational) -> weight
      const priority = input.data.priority ?? input.data.order;
      const weight = input.data.weight;
      const type = input.data.type;

      // If frontend sends 'type' as technical/behavioral/situational, treat it as weight
      const questionType = input.data.type;
      const isCategoryType = questionType && ['technical', 'behavioral', 'situational'].includes(questionType);

      const updateData: any = {
        priority,
      };
      if (input.data.text !== undefined) updateData.text = input.data.text;
      if (isCategoryType) {
        updateData.weight = questionType;
      } else if (weight !== undefined) {
        updateData.weight = weight;
      }
      if (!isCategoryType && type !== undefined) {
        updateData.type = type;
      }

      const result = await this.updateQuestionUseCase.execute({
        id,
        ...updateData,
      });

      return this.ok({
        message: 'Question updated successfully',
        question: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/questions/:id - Delete a question
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid question ID');
      }

      await this.deleteQuestionUseCase.execute({ id });

      return this.ok({
        message: 'Question deleted successfully',
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
