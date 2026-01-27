/**
 * Candidates Controller
 *
 * HTTP handlers for candidate endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateCandidateUseCase } from '../../use-cases/candidates/create-candidate.use-case.js';
import type { GetCandidateUseCase } from '../../use-cases/candidates/get-candidate.use-case.js';
import type { ListCandidatesUseCase } from '../../use-cases/candidates/list-candidates.use-case.js';
import type { UpdateCandidateUseCase } from '../../use-cases/candidates/update-candidate.use-case.js';
import type { DeleteCandidateUseCase } from '../../use-cases/candidates/delete-candidate.use-case.js';

/**
 * Create Candidate Schema
 */
const createCandidateSchema = z.object({
  workspaceId: z.string().uuid().describe('Workspace ID'),
  name: z.string().min(1).max(255).describe('Candidate name'),
  email: z.string().email().optional().describe('Candidate email'),
  cpf: z.string().length(11).optional().describe('CPF (Brazilian tax ID)'),
  externalId: z.string().optional().describe('External system ID'),
});

/**
 * Update Candidate Schema
 */
const updateCandidateSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Candidate name'),
  email: z.string().email().optional().describe('Candidate email'),
  cpf: z.string().length(11).optional().describe('CPF (Brazilian tax ID)'),
  externalId: z.string().optional().describe('External system ID'),
});

/**
 * List Candidates Query Schema
 */
const listCandidatesQuerySchema = z.object({
  workspaceId: z.string().uuid().optional().describe('Filter by workspace ID'),
  examId: z.string().uuid().optional().describe('Filter by exam ID'),
});

/**
 * Candidates Controller
 */
export class CandidatesController extends BaseController {
  constructor(
    private createCandidateUseCase: CreateCandidateUseCase,
    private getCandidateUseCase: GetCandidateUseCase,
    private listCandidatesUseCase: ListCandidatesUseCase,
    private updateCandidateUseCase: UpdateCandidateUseCase,
    private deleteCandidateUseCase: DeleteCandidateUseCase
  ) {
    super();
  }

  /**
   * POST /api/candidates - Create a new candidate
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createCandidateSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.createCandidateUseCase.execute(input.data);

      return this.created({
        message: 'Candidate created successfully',
        candidateId: result.candidateId,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/candidates/:id - Get candidate by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid candidate ID');
      }

      const candidate = await this.getCandidateUseCase.execute({ id });

      return this.ok({
        message: 'Candidate retrieved successfully',
        candidate,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/candidates - List candidates
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listCandidatesQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.listCandidatesUseCase.execute({
        workspaceId: query.data.workspaceId,
        examId: query.data.examId,
      });

      // Return candidates array directly (frontend expects array, not wrapped object)
      return c.json(result.candidates);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/candidates/:id - Update a candidate
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateCandidateSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid candidate ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const candidate = await this.updateCandidateUseCase.execute({
        id,
        ...input.data,
      });

      return this.ok({
        message: 'Candidate updated successfully',
        candidate,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/candidates/:id - Delete a candidate
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid candidate ID');
      }

      await this.deleteCandidateUseCase.execute({ id });

      return this.ok({
        message: 'Candidate deleted successfully',
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
