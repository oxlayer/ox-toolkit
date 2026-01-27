/**
 * Offline-first mutation hooks
 *
 * Handles create/update/delete operations for both anonymous and authenticated users
 * - Anonymous: Updates localStorage directly
 * - Authenticated: Updates server API
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import { projectsApi, projectQueryKeys } from '@/lib/api/projects';
import { sectionsApi, sectionQueryKeys } from '@/lib/api/projects';
import { getWorkspaceDataKey } from '@oxlayer/capabilities-web-state';
import type { Todo, Project, Section, CreateTodoInput, UpdateTodoInput, CreateProjectInput, UpdateProjectInput, CreateSectionInput, UpdateSectionInput } from '@/types';

interface TodoEntity {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  priority: number;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  projectId?: string | null;
  sectionId?: string | null;
  isLocalOnly?: boolean;
  pendingSync?: boolean;
  syncStatus?: 'local' | 'queued' | 'sending' | 'acknowledged' | 'confirmed' | 'failed';
  syncError?: string;
}

interface ProjectEntity {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  isLocalOnly?: boolean;
}

interface SectionEntity {
  id: string;
  name: string;
  orderIndex: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  isLocalOnly?: boolean;
}

interface LegacyWorkspaceData {
  workspaceId: string;
  todos: TodoEntity[];
  projects: ProjectEntity[];
  sections: SectionEntity[];
  settings: Record<string, unknown>;
}

// ============================================================================
// HELPERS
// ============================================================================

function getWorkspaceData(workspaceId: string): LegacyWorkspaceData {
  const dataKey = getWorkspaceDataKey(workspaceId);
  const dataStr = localStorage.getItem(dataKey);

  if (!dataStr) {
    return {
      workspaceId,
      todos: [],
      projects: [],
      sections: [],
      settings: {},
    };
  }

  try {
    const data = JSON.parse(dataStr);

    // Handle both new (nested entities) and legacy (flat) structures
    if ('entities' in data) {
      // New structure with nested entities
      const entities = (data as { entities: Record<string, unknown> }).entities;
      return {
        workspaceId,
        todos: (entities.todos as TodoEntity[]) || [],
        projects: (entities.projects as ProjectEntity[]) || [],
        sections: (entities.sections as SectionEntity[]) || [],
        settings: data.settings || {},
      };
    } else {
      // Legacy flat structure
      return data as LegacyWorkspaceData;
    }
  } catch (error) {
    console.error('Failed to parse workspace data:', error);
    return {
      workspaceId,
      todos: [],
      projects: [],
      sections: [],
      settings: {},
    };
  }
}

function saveWorkspaceData(workspaceId: string, data: LegacyWorkspaceData): void {
  const dataKey = getWorkspaceDataKey(workspaceId);
  localStorage.setItem(dataKey, JSON.stringify(data));
}

function generateLocalId(prefix: string): string {
  return `local_${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================================
// TODO MUTATIONS
// ============================================================================

/**
 * Create todo (offline-first)
 */
export function useOfflineCreateTodo() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTodoInput) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        // Server: Use API
        return await todosApi.create(input);
      } else {
        // Local: Update localStorage
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);

        const newTodo: TodoEntity = {
          id: generateLocalId('todo'),
          title: input.title,
          description: input.description,
          completed: false, // new todos are not completed by default
          priority: input.priority || 1,
          dueDate: input.dueDate,
          projectId: input.projectId,
          sectionId: input.sectionId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspaceId,
          isLocalOnly: true,
          syncStatus: 'local',
        };

        data.todos.push(newTodo);
        saveWorkspaceData(workspaceId, data);

        return newTodo as Todo;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      }
    },
  });
}

/**
 * Update todo (offline-first)
 */
export function useOfflineUpdateTodo() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTodoInput }) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        // Server: Use API
        return await todosApi.update(id, updates);
      } else {
        // Local: Update localStorage
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);
        const index = data.todos.findIndex((t) => t.id === id);

        if (index === -1) {
          throw new Error(`Todo ${id} not found`);
        }

        data.todos[index] = {
          ...data.todos[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        saveWorkspaceData(workspaceId, data);

        return data.todos[index] as Todo;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      }
    },
  });
}

/**
 * Toggle todo completion (offline-first)
 */
export function useOfflineToggleTodo() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (todo: Todo) => {
      const updates = { completed: !todo.completed };
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await todosApi.update(todo.id, updates);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);
        const index = data.todos.findIndex((t) => t.id === todo.id);

        if (index !== -1) {
          data.todos[index] = {
            ...data.todos[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
          saveWorkspaceData(workspaceId, data);
        }

        return { ...todo, ...updates };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      }
    },
  });
}

/**
 * Delete todo (offline-first)
 */
export function useOfflineDeleteTodo() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await todosApi.delete(id);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);
        data.todos = data.todos.filter((t) => t.id !== id);
        saveWorkspaceData(workspaceId, data);
        return { success: true };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      }
    },
  });
}

// ============================================================================
// PROJECT MUTATIONS
// ============================================================================

/**
 * Create project (offline-first)
 */
export function useOfflineCreateProject() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await projectsApi.create(input);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);

        const newProject: ProjectEntity = {
          id: generateLocalId('project'),
          name: input.name,
          color: input.color,
          icon: input.icon,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspaceId,
          isLocalOnly: true,
        };

        data.projects.push(newProject);
        saveWorkspaceData(workspaceId, data);

        // Transform ProjectEntity to Project (add missing properties)
        return {
          ...newProject,
          isInbox: false,
          order: 0,
        } as Project;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      }
    },
  });
}

/**
 * Update project (offline-first)
 */
export function useOfflineUpdateProject() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateProjectInput }) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await projectsApi.update(id, updates);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);
        const index = data.projects.findIndex((p) => p.id === id);

        if (index === -1) {
          throw new Error(`Project ${id} not found`);
        }

        const updatedProject = {
          ...data.projects[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        data.projects[index] = updatedProject;

        saveWorkspaceData(workspaceId, data);

        // Transform ProjectEntity to Project (add missing properties)
        return {
          ...updatedProject,
          isInbox: false,
          order: 0,
        } as Project;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      }
    },
  });
}

/**
 * Delete project (offline-first)
 */
export function useOfflineDeleteProject() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await projectsApi.delete(id);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);
        data.projects = data.projects.filter((p) => p.id !== id);
        saveWorkspaceData(workspaceId, data);
        return { success: true };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
      }
    },
  });
}

// ============================================================================
// SECTION MUTATIONS
// ============================================================================

/**
 * Create section (offline-first)
 */
export function useOfflineCreateSection() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSectionInput & { orderIndex?: number }) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await sectionsApi.create(input);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);

        const newSection: SectionEntity = {
          id: generateLocalId('section'),
          name: input.name,
          orderIndex: input.orderIndex || 0,
          projectId: input.projectId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workspaceId,
          isLocalOnly: true,
        };

        data.sections.push(newSection);
        saveWorkspaceData(workspaceId, data);

        // Transform SectionEntity to Section (orderIndex -> order)
        return {
          ...newSection,
          order: newSection.orderIndex,
        } as Section;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: sectionQueryKeys.lists() });
      }
    },
  });
}

/**
 * Update section (offline-first)
 */
export function useOfflineUpdateSection() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSectionInput }) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await sectionsApi.update(id, updates);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);
        const index = data.sections.findIndex((s) => s.id === id);

        if (index === -1) {
          throw new Error(`Section ${id} not found`);
        }

        const updatedSection = {
          ...data.sections[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        data.sections[index] = updatedSection;

        saveWorkspaceData(workspaceId, data);

        // Transform SectionEntity to Section (orderIndex -> order)
        return {
          ...updatedSection,
          order: updatedSection.orderIndex,
        } as Section;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: sectionQueryKeys.lists() });
      }
    },
  });
}

/**
 * Delete section (offline-first)
 */
export function useOfflineDeleteSection() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)) {
        return await sectionsApi.delete(id);
      } else {
        const workspaceId = currentWorkspace?.id || 'default';
        const data = getWorkspaceData(workspaceId);
        data.sections = data.sections.filter((s) => s.id !== id);
        saveWorkspaceData(workspaceId, data);
        return { success: true };
      }
    },
    onSuccess: () => {
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: sectionQueryKeys.lists() });
      }
    },
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if workspace is a local workspace
 */
function isLocalWorkspace(workspace: { id: string; isLocalOnly?: boolean } | null): boolean {
  if (!workspace) return false;
  // Check if it has the isLocalOnly flag (LocalWorkspace type)
  if ('isLocalOnly' in workspace && workspace.isLocalOnly) {
    return true;
  }
  // Check if ID starts with local_ws prefix
  return workspace.id.startsWith('local_ws_') || workspace.id.startsWith('imported_');
}
