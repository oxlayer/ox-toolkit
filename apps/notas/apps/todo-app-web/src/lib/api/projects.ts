import { api } from './client';
import type {
  Project,
  Section,
  CreateProjectInput,
  CreateSectionInput,
} from '@/types';

// ============================================================================
// PROJECTS API
// ============================================================================

export const projectsApi = {
  /**
   * Get all projects
   */
  getAll: () =>
    api.get<{ projects: Project[] }>('/projects'),

  /**
   * Get a single project by ID
   */
  getById: (id: string) =>
    api.get<{ project: Project }>(`/projects/${id}`),

  /**
   * Create a new project
   */
  create: (input: CreateProjectInput) =>
    api.post<{ project: Project }>('/projects', input),

  /**
   * Update a project
   */
  update: (id: string, input: Partial<CreateProjectInput>) =>
    api.patch<{ project: Project }>(`/projects/${id}`, input),

  /**
   * Delete a project
   */
  delete: (id: string) =>
    api.delete<void>(`/projects/${id}`),

  /**
   * Get sections for a project
   */
  getSections: (projectId: string) =>
    api.get<{ sections: Section[] }>(`/sections?projectId=${projectId}`),
};

// ============================================================================
// SECTIONS API
// ============================================================================

export const sectionsApi = {
  /**
   * Get all sections for a project
   */
  getAll: (projectId: string) =>
    api.get<{ sections: Section[] }>(`/sections?projectId=${projectId}`),

  /**
   * Create a new section
   */
  create: (input: CreateSectionInput) =>
    api.post<{ section: Section }>('/sections', input),

  /**
   * Update a section
   */
  update: (id: string, input: Partial<CreateSectionInput>) =>
    api.patch<{ section: Section }>(`/sections/${id}`, input),

  /**
   * Delete a section
   */
  delete: (id: string) =>
    api.delete<void>(`/sections/${id}`),
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const projectQueryKeys = {
  all: ['projects'] as const,
  lists: () => [...projectQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...projectQueryKeys.all, 'detail', id] as const,
};

export const sectionQueryKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionQueryKeys.all, 'list'] as const,
  list: (projectId: string) => [...sectionQueryKeys.lists(), projectId] as const,
  detail: (id: string) => [...sectionQueryKeys.all, 'detail', id] as const,
};
