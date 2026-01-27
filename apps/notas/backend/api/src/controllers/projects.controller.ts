/**
 * Projects Controller
 */

import { BaseController } from '@oxlayer/foundation-http-kit';
import type { Context } from 'hono';
import { z } from 'zod';
import type {
  CreateProjectUseCase,
  GetProjectsUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase,
} from '../use-cases/index.js';

/**
 * Create Project Schema
 */
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  icon: z.string().optional(),
});

/**
 * Update Project Schema
 */
const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  icon: z.string().optional(),
  order: z.number().int().min(0).optional(),
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

export class ProjectsController extends BaseController {
  constructor(
    private createProjectUseCase: CreateProjectUseCase,
    private getProjectsUseCase: GetProjectsUseCase,
    private updateProjectUseCase: UpdateProjectUseCase,
    private deleteProjectUseCase: DeleteProjectUseCase
  ) {
    super();
  }

  /**
   * GET /api/projects - List projects
   */
  async getProjects(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;

    const result = await this.getProjectsUseCase.execute({
      filters: { userId },
    });

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to fetch projects');
    }

    return this.ok({ projects: result.data?.items || [] });
  }

  /**
   * GET /api/projects/:id - Get a single project
   */
  async getProjectById(c: Context): Promise<Response> {
    const id = c.req.param('id');
    const userId = c.get('userId') as string;

    const result = await this.getProjectsUseCase.execute({
      filters: { userId },
    });

    if (!result.success || !result.data) {
      return this.badRequest('Failed to fetch projects');
    }

    const project = result.data.items.find((p: any) => p.id === id);

    if (!project) {
      return this.notFound('Project not found');
    }

    return this.ok({ project });
  }

  /**
   * POST /api/projects - Create a new project
   */
  async createProject(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;

    const body = await c.req.json();
    const input = createProjectSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.createProjectUseCase.execute({
      ...input.data,
      userId,
    });

    if (!result.success) {
      return this.badRequest(result.error?.message || 'Failed to create project');
    }

    return this.created({ project: result.data });
  }

  /**
   * PATCH /api/projects/:id - Update a project
   */
  async updateProject(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const body = await c.req.json();
    const input = updateProjectSchema.safeParse(body);

    if (!input.success) {
      return this.validationError(formatZodErrors(input.error.errors));
    }

    const result = await this.updateProjectUseCase.execute({
      id,
      ...input.data,
      userId,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Project not found');
      }
      return this.badRequest(result.error?.message || 'Failed to update project');
    }

    return this.ok({ project: result.data });
  }

  /**
   * DELETE /api/projects/:id - Delete a project
   */
  async deleteProject(c: Context): Promise<Response> {
    const userId = c.get('userId') as string;
    const id = c.req.param('id');

    const result = await this.deleteProjectUseCase.execute({
      id,
      userId,
    });

    if (!result.success) {
      if (result.error?.code === 'NOT_FOUND') {
        return this.notFound(result.error.message || 'Project not found');
      }
      return this.badRequest(result.error?.message || 'Failed to delete project');
    }

    return this.ok({ message: 'Project deleted successfully' });
  }

  /**
   * GET /api/projects/:id/sections - Get sections for a project
   */
  async getProjectSections(c: Context): Promise<Response> {
    const projectId = c.req.param('id');

    // This will be handled by the sections controller
    return this.ok({ sections: [] });
  }
}
