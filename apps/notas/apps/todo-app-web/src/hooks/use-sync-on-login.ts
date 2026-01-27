/**
 * Sync-on-Login Hook
 *
 * Promotes local anonymous user data to server when they log in.
 * Handles merge of local todos/projects/sections with server data.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import { projectsApi, projectQueryKeys } from '@/lib/api/projects';
import { getWorkspaceDataKey } from '@oxlayer/capabilities-web-state';
import type { CreateTodoInput, CreateProjectInput } from '@/types';

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

interface LegacyWorkspaceData {
  workspaceId: string;
  todos: TodoEntity[];
  projects: ProjectEntity[];
  sections: unknown[];
  settings: Record<string, unknown>;
}

interface SyncOptions {
  /**
   * Strategy for handling conflicts
   * - 'local': Keep local data, discard server
   * - 'server': Use server data, discard local
   * - 'merge': Merge both (default)
   */
  conflictStrategy?: 'local' | 'server' | 'merge';
  /**
   * Whether to delete local data after successful sync
   */
  cleanupAfterSync?: boolean;
}

/**
 * Get workspace data from localStorage (app-specific implementation)
 */
function getWorkspaceData(workspaceId: string): LegacyWorkspaceData | null {
  const dataKey = getWorkspaceDataKey(workspaceId);
  const dataStr = localStorage.getItem(dataKey);

  if (!dataStr) return null;

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
        sections: (entities.sections as unknown[]) || [],
        settings: data.settings || {},
      };
    } else {
      // Legacy flat structure
      return data as LegacyWorkspaceData;
    }
  } catch (error) {
    console.error('Failed to parse workspace data:', error);
    return null;
  }
}

/**
 * Hook that automatically syncs local data to server on login
 */
export function useSyncOnLogin(options: SyncOptions = {}) {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const {
    cleanupAfterSync = true,
  } = options;

  useEffect(() => {
    const syncLocalData = async () => {
      // Only sync when:
      // 1. User is authenticated
      // 2. Has a current workspace
      // 3. Workspace is local (created while anonymous)
      if (!isAuthenticated || !currentWorkspace) {
        return;
      }

      // Check if this is a local workspace
      const isLocal = isLocalWorkspace(currentWorkspace);
      if (!isLocal) {
        console.log('[useSyncOnLogin] Workspace is not local, skipping sync');
        return;
      }

      console.log('[useSyncOnLogin] Starting sync for local workspace:', currentWorkspace.id);

      try {
        // Get local data
        const localData = getWorkspaceData(currentWorkspace.id);

        if (!localData) {
          console.log('[useSyncOnLogin] No local data to sync');
          return;
        }

        const syncResults = {
          todosSynced: 0,
          projectsSynced: 0,
          todosFailed: 0,
          projectsFailed: 0,
        };

        // Sync projects first (todos may reference them)
        for (const project of localData.projects || []) {
          try {
            const projectInput: CreateProjectInput = {
              name: project.name,
              color: project.color,
              icon: project.icon,
            };
            await projectsApi.create(projectInput);
            syncResults.projectsSynced++;
            console.log('[useSyncOnLogin] Synced project:', project.name);
          } catch (error) {
            syncResults.projectsFailed++;
            console.error('[useSyncOnLogin] Failed to sync project:', project, error);
          }
        }

        // Sync todos
        for (const todo of localData.todos || []) {
          try {
            const todoInput: CreateTodoInput = {
              title: todo.title,
              description: todo.description ?? undefined,
              priority: todo.priority as any,
              dueDate: todo.dueDate ?? undefined,
              projectId: todo.projectId ?? undefined,
              sectionId: todo.sectionId ?? undefined,
            };
            await todosApi.create(todoInput);
            syncResults.todosSynced++;
            console.log('[useSyncOnLogin] Synced todo:', todo.title);
          } catch (error) {
            syncResults.todosFailed++;
            console.error('[useSyncOnLogin] Failed to sync todo:', todo, error);
          }
        }

        console.log('[useSyncOnLogin] Sync complete:', syncResults);

        // Invalidate queries to refresh from server
        queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });

        // Optionally cleanup local data after sync
        if (cleanupAfterSync) {
          console.log('[useSyncOnLogin] Cleaning up local data after sync');
          const dataKey = getWorkspaceDataKey(currentWorkspace.id);
          // Clear local data but keep the workspace
          localStorage.setItem(dataKey, JSON.stringify({
            workspaceId: currentWorkspace.id,
            entities: {
              todos: [],
              projects: [],
              sections: [],
            },
            settings: {},
          }));
        }

      } catch (error) {
        console.error('[useSyncOnLogin] Sync failed:', error);
      }
    };

    syncLocalData();
  }, [isAuthenticated, currentWorkspace, queryClient, cleanupAfterSync]);
}

/**
 * Check if a workspace is local (created while anonymous)
 */
function isLocalWorkspace(workspace: { id: string; isLocalOnly?: boolean } | null): boolean {
  if (!workspace) return false;
  // Check for isLocalOnly flag (LocalWorkspace type)
  if ('isLocalOnly' in workspace && workspace.isLocalOnly) {
    return true;
  }
  // Check ID prefixes
  return workspace.id.startsWith('local_ws_') || workspace.id.startsWith('imported_');
}

/**
 * Manual sync function for triggering sync on demand
 */
export async function syncLocalWorkspaceToServer(
  workspaceId: string,
  _options: SyncOptions = {}
): Promise<{ success: boolean; synced: number; failed: number }> {
  const localData = getWorkspaceData(workspaceId);

  if (!localData) {
    return { success: false, synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  // Sync projects
  for (const project of localData.projects || []) {
    try {
      await projectsApi.create({
        name: project.name,
        color: project.color,
        icon: project.icon,
      });
      synced++;
    } catch {
      failed++;
    }
  }

  // Sync todos
  for (const todo of localData.todos || []) {
    try {
      await todosApi.create({
        title: todo.title,
        description: todo.description ?? undefined,
        priority: todo.priority as any,
        dueDate: todo.dueDate ?? undefined,
        projectId: todo.projectId ?? undefined,
        sectionId: todo.sectionId ?? undefined,
      });
      synced++;
    } catch {
      failed++;
    }
  }

  return { success: failed === 0, synced, failed };
}
