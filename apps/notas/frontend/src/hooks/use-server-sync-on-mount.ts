/**
 * Server Sync on Mount
 *
 * When authenticated, fetch data from API and sync to localStorage.
 * This ensures the server is the source of truth for authenticated users.
 *
 * Flow:
 * 1. On mount, if authenticated, fetch todos/projects/sections from API
 * 2. Sync fetched data to localStorage for offline support
 * 3. This runs once on mount (useEffect with empty deps)
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import { projectsApi, projectQueryKeys } from '@/lib/api/projects';
import { getWorkspaceDataKey } from '@oxlayer/capabilities-web-state';
import { useQueryClient } from '@tanstack/react-query';

interface WorkspaceData {
  workspaceId: string;
  entities: {
    todos: unknown[];
    projects: unknown[];
    sections: unknown[];
  };
  settings: Record<string, unknown>;
}

/**
 * Hook to sync server data to localStorage on mount
 *
 * This ensures that when a user refreshes the page while authenticated,
 * the latest data from the server is synced to localStorage for offline use.
 */
export function useServerSyncOnMount() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncFromServer = async () => {
      // Only sync when authenticated with a workspace
      if (!isAuthenticated || !currentWorkspace || hasSynced.current) {
        return;
      }

      // Skip sync if this is a local-only workspace
      if (currentWorkspace.isLocalOnly || currentWorkspace.id.startsWith('local_ws_')) {
        console.log('[useServerSyncOnMount] Skipping local workspace:', currentWorkspace.id);
        return;
      }

      console.log('[useServerSyncOnMount] Fetching data from server for workspace:', currentWorkspace.id);

      try {
        // Fetch all data in parallel
        const [todosResponse, projectsResponse] = await Promise.all([
          todosApi.getAll().catch(e => {
            console.error('[useServerSyncOnMount] Failed to fetch todos:', e);
            return null;
          }),
          projectsApi.getAll().catch(e => {
            console.error('[useServerSyncOnMount] Failed to fetch projects:', e);
            return null;
          }),
        ]);

        const workspaceData: WorkspaceData = {
          workspaceId: currentWorkspace.id,
          entities: {
            todos: todosResponse?.todos || [],
            projects: projectsResponse?.projects || [],
            sections: [], // Sections are per-project, fetched separately
          },
          settings: {},
        };

        // Save to localStorage
        const dataKey = getWorkspaceDataKey(currentWorkspace.id);
        localStorage.setItem(dataKey, JSON.stringify(workspaceData));

        console.log('[useServerSyncOnMount] Synced to localStorage:', {
          todos: workspaceData.entities.todos.length,
          projects: workspaceData.entities.projects.length,
        });

        // Trigger storage update to re-render components
        window.dispatchEvent(new CustomEvent('oxlayer-storage-update', {
          detail: { workspaceId: currentWorkspace.id }
        }));

        // Invalidate queries to ensure fresh data
        queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });

      } catch (error) {
        console.error('[useServerSyncOnMount] Sync failed:', error);
      } finally {
        hasSynced.current = true;
      }
    };

    syncFromServer();
  }, [isAuthenticated, currentWorkspace?.id]);
}

/**
 * Hook to manually trigger server sync
 *
 * Can be called by user action (pull-to-refresh, sync button, etc.)
 */
export function useManualServerSync() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const syncFromServer = async () => {
    if (!isAuthenticated || !currentWorkspace) {
      console.warn('[useManualServerSync] Not authenticated or no workspace');
      return { success: false, error: 'Not authenticated' };
    }

    if (currentWorkspace.isLocalOnly || currentWorkspace.id.startsWith('local_ws_')) {
      return { success: false, error: 'Local workspace' };
    }

    console.log('[useManualServerSync] Manual sync from server');

    try {
      const [todosResponse, projectsResponse] = await Promise.all([
        todosApi.getAll(),
        projectsApi.getAll(),
      ]);

      const workspaceData: WorkspaceData = {
        workspaceId: currentWorkspace.id,
        entities: {
          todos: todosResponse.todos || [],
          projects: projectsResponse.projects || [],
          sections: [],
        },
        settings: {},
      };

      const dataKey = getWorkspaceDataKey(currentWorkspace.id);
      localStorage.setItem(dataKey, JSON.stringify(workspaceData));

      // Trigger reactivity
      window.dispatchEvent(new CustomEvent('oxlayer-storage-update', {
        detail: { workspaceId: currentWorkspace.id }
      }));

      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });

      return {
        success: true,
        todos: workspaceData.entities.todos.length,
        projects: workspaceData.entities.projects.length,
      };
    } catch (error) {
      console.error('[useManualServerSync] Sync failed:', error);
      return { success: false, error };
    }
  };

  return { syncFromServer };
}
