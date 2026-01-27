/**
 * API Adapters for Intent Sync Engine
 *
 * Registers the app's API functions with the generic sync engine.
 * The sync engine calls these adapters to deliver intents to the server.
 *
 * "Business code never talks about sync. It only declares intent + policy."
 *
 * @example
 * ```tsx
 * import { useEffect } from 'react';
 * import { registerTodoApiAdapters } from '@/lib/sync/api-adapters';
 *
 * function App() {
 *   useEffect(() => {
 *     // Register adapters once on app init
 *     registerTodoApiAdapters();
 *   }, []);
 *
 *   return <YourApp />;
 * }
 * ```
 */

import {
  registerApiAdapter,
  unregisterApiAdapter,
  registerApiAdapters,
  type ApiAdapter,
} from '@oxlayer/capabilities-web-state';
import { todosApi } from '@/lib/api/todos';
import { projectsApi, sectionsApi } from '@/lib/api/projects';
import type { CreateTodoInput, UpdateTodoInput, CreateProjectInput, UpdateProjectInput, CreateSectionInput, UpdateSectionInput } from '@/types';

// ============================================================================
// TODO ADAPTER
// ============================================================================

/**
 * Todo task API adapter
 *
 * Handles create, update, delete operations for todos.
 */
const todoTaskAdapter: ApiAdapter = {
  create: async (payload) => {
    const result = await todosApi.create(payload as CreateTodoInput);
    return {
      id: result.id,
      data: result,
    };
  },

  update: async (id, payload) => {
    const result = await todosApi.update(id, payload as UpdateTodoInput);
    return {
      data: result,
    };
  },

  delete: async (id) => {
    await todosApi.delete(id);
  },
};

// ============================================================================
// PROJECT ADAPTER
// ============================================================================

/**
 * Project API adapter
 *
 * Handles create, update, delete operations for projects.
 */
const todoProjectAdapter: ApiAdapter = {
  create: async (payload) => {
    const result = await projectsApi.create(payload as CreateProjectInput);
    return {
      id: result.project.id,
      data: result,
    };
  },

  update: async (id, payload) => {
    const result = await projectsApi.update(id, payload as UpdateProjectInput);
    return {
      data: result,
    };
  },

  delete: async (id) => {
    await projectsApi.delete(id);
  },
};

// ============================================================================
// SECTION ADAPTER
// ============================================================================

/**
 * Section API adapter
 *
 * Handles create, update, delete operations for sections.
 */
const todoSectionAdapter: ApiAdapter = {
  create: async (payload) => {
    // payload includes projectId for sections
    const input = payload as CreateSectionInput & { orderIndex?: number };
    const result = await sectionsApi.create(input);
    return {
      id: result.section.id,
      data: result,
    };
  },

  update: async (id, payload) => {
    const result = await sectionsApi.update(id, payload as UpdateSectionInput);
    return {
      data: result,
    };
  },

  delete: async (id) => {
    await sectionsApi.delete(id);
  },
};

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register all todo app API adapters with the sync engine
 *
 * Call this once during app initialization.
 *
 * After registration, the sync engine will:
 * - Automatically sync pending intents when online
 * - Retry failed intents based on policy
 * - Update intent status (local → queued → sending → acknowledged → confirmed)
 *
 * @example
 * ```tsx
 * // In App.tsx or main.tsx
 * import { registerTodoApiAdapters } from '@/lib/sync/api-adapters';
 *
 * useEffect(() => {
 *   registerTodoApiAdapters();
 * }, []);
 * ```
 */
export function registerTodoApiAdapters() {
  // Register individual adapters
  registerApiAdapter('todo', 'task', todoTaskAdapter);
  registerApiAdapter('todo', 'project', todoProjectAdapter);
  registerApiAdapter('todo', 'section', todoSectionAdapter);

  console.log('[TodoApiAdapters] Registered API adapters for sync engine');
}

/**
 * Unregister all todo app API adapters
 *
 * Call this when cleaning up (e.g., on logout).
 */
export function unregisterTodoApiAdapters() {
  unregisterApiAdapter('todo', 'task');
  unregisterApiAdapter('todo', 'project');
  unregisterApiAdapter('todo', 'section');

  console.log('[TodoApiAdapters] Unregistered API adapters');
}

/**
 * Get all adapters as a map for bulk registration
 *
 * Alternative registration method using registerApiAdapters().
 */
export const todoApiAdapters = {
  'todo.task': todoTaskAdapter,
  'todo.project': todoProjectAdapter,
  'todo.section': todoSectionAdapter,
};

/**
 * Bulk register all adapters at once
 *
 * @example
 * ```tsx
 * import { registerApiAdapters, todoApiAdapters } from '@/lib/sync/api-adapters';
 *
 * useEffect(() => {
 *   registerApiAdapters(todoApiAdapters);
 * }, []);
 * ```
 */
export function registerAllAdapters() {
  registerApiAdapters(todoApiAdapters);
  console.log('[TodoApiAdapters] Registered all API adapters using bulk registration');
}
