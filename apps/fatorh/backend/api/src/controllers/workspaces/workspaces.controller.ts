/**
 * Workspaces Controller
 *
 * HTTP handlers for workspace endpoints using Hono and BaseController.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type { CreateWorkspaceUseCase } from '../../../use-cases/workspaces/create-workspace.use-case.js';
import type { GetWorkspaceUseCase } from '../../../use-cases/workspaces/get-workspace.use-case.js';
import type { ListWorkspacesUseCase } from '../../../use-cases/workspaces/list-workspaces.use-case.js';
import type { UpdateWorkspaceUseCase } from '../../../use-cases/workspaces/update-workspace.use-case.js';
import type { DeleteWorkspaceUseCase } from '../../../use-cases/workspaces/delete-workspace.use-case.js';

/**
 * Create Workspace Schema
 */
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).regex(/^[a-z0-9][a-z0-9\s-]*[a-z0-9]$/, 'Workspace name must be lowercase with no special characters (hyphens and spaces allowed)').describe('Workspace name'),
  description: z.string().optional().describe('Workspace description'),
  organizationId: z.string().uuid().optional().describe('Organization ID (optional - workspace can be at realm level)'),
  // Provisioning fields (optional - if provided, will provision database)
  realmId: z.string().optional().describe('Realm ID for database provisioning'),
  domainAliases: z.array(z.string()).optional().describe('Custom domain aliases'),
  rootManagerEmail: z.string().email().optional().describe('Root manager/owner email'),
});

/**
 * Update Workspace Schema
 */
const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Workspace name'),
  description: z.string().optional().describe('Workspace description'),
});

/**
 * List Workspaces Query Schema
 */
const listWorkspacesQuerySchema = z.object({
  organizationId: z.string().uuid().optional().describe('Filter by organization ID'),
  limit: z.string().transform(Number).optional().describe('Limit results'),
  offset: z.string().transform(Number).optional().describe('Offset results'),
});

/**
 * Workspaces Controller
 */
export class WorkspacesController extends BaseController {
  constructor(
    private createWorkspaceUseCase: CreateWorkspaceUseCase,
    private getWorkspaceUseCase: GetWorkspaceUseCase,
    private listWorkspacesUseCase: ListWorkspacesUseCase,
    private updateWorkspaceUseCase: UpdateWorkspaceUseCase,
    private deleteWorkspaceUseCase: DeleteWorkspaceUseCase
  ) {
    super();
  }

  /**
   * POST /api/workspaces - Create a new workspace
   */
  async create(c: Context): Promise<Response> {
    try {
      const body = await c.req.json();
      const input = createWorkspaceSchema.safeParse(body);

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.createWorkspaceUseCase.execute(input.data);

      return this.created({
        message: 'Workspace created successfully',
        workspace: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/workspaces/:id - Get workspace by ID
   */
  async getById(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid workspace ID');
      }

      const workspace = await this.getWorkspaceUseCase.execute({ id });

      if (!workspace) {
        return this.notFound('Workspace not found');
      }

      return this.ok({
        message: 'Workspace retrieved successfully',
        workspace,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * GET /api/workspaces - List workspaces
   */
  async list(c: Context): Promise<Response> {
    try {
      const query = listWorkspacesQuerySchema.safeParse(c.req.query());

      if (!query.success) {
        return this.validationError(query.error.flatten().fieldErrors);
      }

      const result = await this.listWorkspacesUseCase.execute({
        organizationId: query.data.organizationId,
        limit: query.data.limit,
        offset: query.data.offset,
      });

      // Return workspaces array directly (frontend expects array, not wrapped object)
      return c.json(result.workspaces);
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * PATCH /api/workspaces/:id - Update a workspace
   */
  async update(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const input = updateWorkspaceSchema.safeParse(body);

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid workspace ID');
      }

      if (!input.success) {
        return this.validationError(input.error.flatten().fieldErrors);
      }

      const result = await this.updateWorkspaceUseCase.execute({
        id,
        ...input.data,
      });

      return this.ok({
        message: 'Workspace updated successfully',
        workspace: result,
      });
    } catch (error) {
      return this.error(error);
    }
  }

  /**
   * DELETE /api/workspaces/:id - Delete a workspace (soft delete)
   */
  async delete(c: Context): Promise<Response> {
    try {
      const id = c.req.param('id');

      if (!id || !z.string().uuid().safeParse(id).success) {
        return this.badRequest('Invalid workspace ID');
      }

      await this.deleteWorkspaceUseCase.execute({ id });

      return this.ok({
        message: 'Workspace deleted successfully',
      });
    } catch (error) {
      return this.error(error);
    }
  }
}
