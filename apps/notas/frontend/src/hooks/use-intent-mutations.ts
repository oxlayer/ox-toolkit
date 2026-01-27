/**
 * Intent-First Mutation Hooks
 *
 * Business code never talks about sync, retry, or offline.
 * It only declares intent + policy.
 *
 * "UI reacts to intent, not to HTTP. HTTP is just one transport."
 *
 * These hooks ALWAYS:
 * 1. Record intent (immediate, local-first)
 * 2. Update local state (optimistic)
 * 3. Let sync engine handle server communication
 *
 * The sync engine is responsible for:
 * - Checking if user is authenticated
 * - Sending to server when online + authenticated
 * - Queueing when offline
 * - Updating delivery status
 */

import { useMutation } from '@tanstack/react-query';
import { useWorkspace } from '@/lib/workspace';
import {
  recordIntent,
  getEntityIntentStatus,
} from '@oxlayer/capabilities-web-state';
import { IntentPresets } from '@oxlayer/capabilities-web-state';
import { getWorkspaceDataKey } from '@oxlayer/capabilities-web-state';
import { triggerStorageUpdate } from '@/hooks/use-offline-data';
import type { CreateTodoInput, UpdateTodoInput, CreateProjectInput, UpdateProjectInput, CreateSectionInput, UpdateSectionInput, Todo } from '@/types';
import type { DeliveryStatus } from '@oxlayer/capabilities-web-state';

// ============================================================================
// TYPES
// ============================================================================

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
  syncStatus?: DeliveryStatus;
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

    if ('entities' in data) {
      const entities = (data as { entities: Record<string, unknown> }).entities;
      return {
        workspaceId,
        todos: (entities.todos as TodoEntity[]) || [],
        projects: (entities.projects as ProjectEntity[]) || [],
        sections: (entities.sections as SectionEntity[]) || [],
        settings: data.settings || {},
      };
    } else {
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
// TODO INTENT MUTATIONS
// ============================================================================

/**
 * Create todo using intent-first approach
 *
 * ALWAYS records intent → updates local state → sync engine handles server
 *
 * @example
 * ```tsx
 * const createTodo = useIntentCreateTodo();
 *
 * createTodo.mutate({
 *   title: 'Buy milk',
 *   description: 'Get 2% milk',
 *   completed: false,
 * });
 * ```
 */
export function useIntentCreateTodo() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (input: CreateTodoInput) => {
      console.log('[useIntentCreateTodo] mutationFn called', { input, currentWorkspace });
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;
      const tempId = generateLocalId('todo');

      console.log('[useIntentCreateTodo] Recording intent', { workspaceId, tempId, input });

      // 1. Record the intent (sync engine handles server delivery)
      recordIntent<CreateTodoInput>(workspaceId, {
        domain: 'todo',
        type: 'create',
        entityType: 'task',
        entityId: tempId,
        payload: input,
        policy: IntentPresets.optimistic,
      });

      console.log('[useIntentCreateTodo] Intent recorded, updating local state');

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);

      const newTodo: TodoEntity = {
        id: tempId,
        title: input.title,
        description: input.description,
        completed: false,  // New todos start as incomplete
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

      // 3. Trigger reactivity - notify all listeners that workspace data changed
      triggerStorageUpdate(workspaceId);

      console.log('[useIntentCreateTodo] Local state updated', { newTodo, totalTodos: data.todos.length });

      // 4. Return the optimistic result
      return newTodo;
    },
  });
}

/**
 * Update todo using intent-first approach
 *
 * ALWAYS records intent → sync engine decides when/if to send to server
 */
export function useIntentUpdateTodo() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTodoInput }) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;

      // 1. Record intent
      recordIntent<UpdateTodoInput>(workspaceId, {
        domain: 'todo',
        type: 'update',
        entityType: 'task',
        entityId: id,
        payload: updates,
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);
      const index = data.todos.findIndex((t) => t.id === id);

      if (index === -1) {
        throw new Error(`Todo ${id} not found`);
      }

      data.todos[index] = {
        ...data.todos[index],
        ...updates,
        updatedAt: new Date().toISOString(),
        syncStatus: 'queued',
      };

      saveWorkspaceData(workspaceId, data);
      triggerStorageUpdate(workspaceId);

      return data.todos[index];
    },
  });
}

/**
 * Toggle todo completion using intent-first approach
 */
export function useIntentToggleTodo() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (todo: Todo) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;
      const updates = { completed: !todo.completed };

      // 1. Record intent
      recordIntent<typeof updates>(workspaceId, {
        domain: 'todo',
        type: 'update',
        entityType: 'task',
        entityId: todo.id,
        payload: updates,
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);
      const index = data.todos.findIndex((t) => t.id === todo.id);

      if (index !== -1) {
        data.todos[index] = {
          ...data.todos[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          syncStatus: 'queued',
        };
        saveWorkspaceData(workspaceId, data);
        triggerStorageUpdate(workspaceId);
      }

      return { ...todo, ...updates };
    },
  });
}

/**
 * Delete todo using intent-first approach
 */
export function useIntentDeleteTodo() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;

      // 1. Record intent
      recordIntent(workspaceId, {
        domain: 'todo',
        type: 'delete',
        entityType: 'task',
        entityId: id,
        payload: {},
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);
      data.todos = data.todos.filter((t) => t.id !== id);
      saveWorkspaceData(workspaceId, data);
      triggerStorageUpdate(workspaceId);

      return { success: true };
    },
  });
}

// ============================================================================
// PROJECT INTENT MUTATIONS
// ============================================================================

/**
 * Create project using intent-first approach
 */
export function useIntentCreateProject() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;
      const tempId = generateLocalId('project');

      // 1. Record intent
      recordIntent<CreateProjectInput>(workspaceId, {
        domain: 'todo',
        type: 'create',
        entityType: 'project',
        entityId: tempId,
        payload: input,
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);

      const newProject: ProjectEntity = {
        id: tempId,
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
      triggerStorageUpdate(workspaceId);

      return newProject;
    },
  });
}

/**
 * Update project using intent-first approach
 */
export function useIntentUpdateProject() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateProjectInput }) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;

      // 1. Record intent
      recordIntent<UpdateProjectInput>(workspaceId, {
        domain: 'todo',
        type: 'update',
        entityType: 'project',
        entityId: id,
        payload: updates,
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);
      const index = data.projects.findIndex((p) => p.id === id);

      if (index === -1) {
        throw new Error(`Project ${id} not found`);
      }

      data.projects[index] = {
        ...data.projects[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveWorkspaceData(workspaceId, data);
      triggerStorageUpdate(workspaceId);

      return data.projects[index];
    },
  });
}

/**
 * Delete project using intent-first approach
 */
export function useIntentDeleteProject() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;

      // 1. Record intent
      recordIntent(workspaceId, {
        domain: 'todo',
        type: 'delete',
        entityType: 'project',
        entityId: id,
        payload: {},
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);
      data.projects = data.projects.filter((p) => p.id !== id);
      saveWorkspaceData(workspaceId, data);
      triggerStorageUpdate(workspaceId);

      return { success: true };
    },
  });
}

// ============================================================================
// SECTION INTENT MUTATIONS
// ============================================================================

/**
 * Create section using intent-first approach
 */
export function useIntentCreateSection() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (input: CreateSectionInput & { projectId: string }) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;
      const tempId = generateLocalId('section');

      // 1. Record intent
      recordIntent<Omit<CreateSectionInput, 'sectionId'> & { projectId: string }>(workspaceId, {
        domain: 'todo',
        type: 'create',
        entityType: 'section',
        entityId: tempId,
        payload: input,
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);

      const newSection: SectionEntity = {
        id: tempId,
        name: input.name,
        orderIndex: 0,
        projectId: input.projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workspaceId,
        isLocalOnly: true,
      };

      data.sections.push(newSection);
      saveWorkspaceData(workspaceId, data);
      triggerStorageUpdate(workspaceId);

      return newSection;
    },
  });
}

/**
 * Update section using intent-first approach
 */
export function useIntentUpdateSection() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateSectionInput }) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;

      // 1. Record intent
      recordIntent<UpdateSectionInput>(workspaceId, {
        domain: 'todo',
        type: 'update',
        entityType: 'section',
        entityId: id,
        payload: updates,
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);
      const index = data.sections.findIndex((s) => s.id === id);

      if (index === -1) {
        throw new Error(`Section ${id} not found`);
      }

      data.sections[index] = {
        ...data.sections[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveWorkspaceData(workspaceId, data);
      triggerStorageUpdate(workspaceId);

      return data.sections[index];
    },
  });
}

/**
 * Delete section using intent-first approach
 */
export function useIntentDeleteSection() {
  const { currentWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!currentWorkspace?.id) {
        throw new Error('No active workspace');
      }

      const workspaceId = currentWorkspace.id;

      // 1. Record intent
      recordIntent(workspaceId, {
        domain: 'todo',
        type: 'delete',
        entityType: 'section',
        entityId: id,
        payload: {},
        policy: IntentPresets.optimistic,
      });

      // 2. Optimistic update to local state
      const data = getWorkspaceData(workspaceId);
      data.sections = data.sections.filter((s) => s.id !== id);
      saveWorkspaceData(workspaceId, data);
      triggerStorageUpdate(workspaceId);

      return { success: true };
    },
  });
}

// ============================================================================
// HOOKS FOR INTENT STATUS
// ============================================================================

/**
 * Get sync status for an entity
 *
 * Returns the delivery status (WhatsApp-style ticks)
 *
 * @example
 * ```tsx
 * const status = useEntityIntentStatus(todo.id);
 * // Returns: 'local' | 'queued' | 'sending' | 'acknowledged' | 'confirmed' | 'failed'
 * ```
 */
export function useEntityIntentStatus(entityId: string): DeliveryStatus | undefined {
  const { currentWorkspace } = useWorkspace();

  if (currentWorkspace?.id) {
    return getEntityIntentStatus(currentWorkspace.id, entityId);
  }

  return undefined;
}
