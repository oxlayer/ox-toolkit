/**
 * Workspaces Controller
 *
 * Handles workspace CRUD operations and switching.
 * Workspaces are the core organizing unit - each has a type (personal, crm, recruiting)
 * which determines which features are available.
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type {
  GetWorkspacesUseCase,
  CreateWorkspaceUseCase,
  UpdateWorkspaceUseCase,
  DeleteWorkspaceUseCase,
  SwitchWorkspaceUseCase,
} from '../use-cases/index.js';
import type { AppResult } from '@oxlayer/snippets/use-cases';

/**
 * Create Workspace Schema
 */
const createWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['personal', 'crm', 'recruiting']),
  icon: z.string().optional(),
  color: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

/**
 * Update Workspace Schema
 */
const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  flags: z.object({
    features: z.record(z.boolean()),
  }).optional(),
  settings: z.record(z.unknown()).optional(),
});

/**
 * Switch Workspace Schema
 */
const switchWorkspaceSchema = z.object({
  workspaceId: z.string(),
});

/**
 * Convert Zod errors to Record<string, string[]>
 */
function formatZodErrors(errors: z.ZodIssue[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const error of errors) {
    const field = error.path.join('.');
    if (!formatted[field]) {
      formatted[field] = [];
    }
    formatted[field].push(error.message);
  }
  return formatted;
}

/**
 * Workspace Output Interface
 */
interface WorkspaceOutput {
  id: string;
  name: string;
  type: 'personal' | 'crm' | 'recruiting';
  flags: {
    features: {
      contacts: boolean;
      companies: boolean;
      deals: boolean;
      candidates: boolean;
      positions: boolean;
      pipeline: boolean;
    };
  };
  settings: Record<string, unknown>;
  icon?: string;
  color?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workspaces Controller
 */
export class WorkspacesController extends BaseController {
  constructor(
    private getWorkspacesUseCase: GetWorkspacesUseCase,
    private createWorkspaceUseCase: CreateWorkspaceUseCase,
    private updateWorkspaceUseCase: UpdateWorkspaceUseCase,
    private deleteWorkspaceUseCase: DeleteWorkspaceUseCase,
    private switchWorkspaceUseCase: SwitchWorkspaceUseCase
  ) {
    super();
  }

  /**
   * GET /api/workspaces
   *
   * List all workspaces for the current user
   */
  async getWorkspaces(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;

    const result = await this.getWorkspacesUseCase.execute(userId);

    if (!result.success || !result.data) {
      return this.badRequest(result.error?.message || 'Failed to fetch workspaces');
    }

    return this.ok({ workspaces: result.data });
  }

  /**
   * GET /api/workspaces/default
   *
   * Get or create the default workspace for the current user
   */
  async getDefaultWorkspace(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;

    const result = await this.getWorkspacesUseCase.executeGetDefault(userId);

    if (!result.success || !result.data) {
      return this.badRequest(result.error?.message || 'Failed to get default workspace');
    }

    return this.ok(result.data);
  }

  /**
   * POST /api/workspaces
   *
   * Create a new workspace
   */
  async createWorkspace(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;

    const body = await c.req.json();
    const input = createWorkspaceSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.createWorkspaceUseCase.execute({
      ...input.data,
      ownerId: userId,
    });

    if (!result.success || !result.data) {
      return this.badRequest(result.error?.message || 'Failed to create workspace');
    }

    return this.created(result.data);
  }

  /**
   * PATCH /api/workspaces/:id
   *
   * Update a workspace
   */
  async updateWorkspace(c: Context): Promise<Response> {
    const id = c.req.param('id');

    const body = await c.req.json();
    const input = updateWorkspaceSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateWorkspaceUseCase.execute(id, input.data);

    if (!result.success || !result.data) {
      return this.badRequest(result.error?.message || 'Failed to update workspace');
    }

    return this.ok(result.data);
  }

  /**
   * DELETE /api/workspaces/:id
   *
   * Delete a workspace
   */
  async deleteWorkspace(c: Context): Promise<Response> {
    const id = c.req.param('id');

    const result = await this.deleteWorkspaceUseCase.execute(id);

    if (!result.success || !result.data) {
      return this.badRequest(result.error?.message || 'Failed to delete workspace');
    }

    return this.ok(result.data);
  }

  /**
   * POST /api/workspaces/:id/switch
   *
   * Switch to a different workspace (sets it as active)
   */
  async switchWorkspace(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;
    const workspaceId = c.req.param('id');

    const result = await this.switchWorkspaceUseCase.execute(workspaceId, userId);

    if (!result.success || !result.data) {
      return this.badRequest(result.error?.message || 'Failed to switch workspace');
    }

    return this.ok(result.data);
  }

  /**
   * GET /api/workspaces/:id
   *
   * Get a single workspace by ID
   */
  async getWorkspace(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    // Use getWorkspaces and filter by id
    const result = await this.getWorkspacesUseCase.execute(userId);

    if (!result.success || !result.data) {
      return this.badRequest(result.error?.message || 'Failed to fetch workspace');
    }

    const workspace = result.data.find((w: any) => w.id === id);

    if (!workspace) {
      return this.notFound('Workspace not found');
    }

    return this.ok({ workspace });
  }
}
