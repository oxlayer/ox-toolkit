/**
 * Offline-first data hooks using TanStack Query
 *
 * For anonymous users: Uses localStorage
 * For authenticated users: Uses server API
 * On login: Promotes local data to server with merge
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useWorkspace } from '@/lib/workspace';
import { todosApi, todoQueryKeys } from '@/lib/api/todos';
import { projectsApi, projectQueryKeys } from '@/lib/api/projects';
import { sectionsApi, sectionQueryKeys } from '@/lib/api/projects';
import { getWorkspaceDataKey } from '@oxlayer/capabilities-web-state';
import type { Todo, Section } from '@/types';

// ============================================================================
// LOCAL STORAGE REACTIVE EVENT SYSTEM
// ============================================================================

const STORAGE_UPDATE_EVENT = 'oxlayer-storage-update';

/**
 * Trigger a storage update event for a specific workspace
 * This causes all hooks listening to that workspace to re-fetch
 */
export function triggerStorageUpdate(workspaceId: string) {
  window.dispatchEvent(new CustomEvent(STORAGE_UPDATE_EVENT, { detail: { workspaceId } }));
}

/**
 * Hook that listens for storage update events and increments version
 */
function useStorageUpdateListener(workspaceId: string | undefined) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!workspaceId) return;

    const handleStorageUpdate = (e: Event) => {
      const event = e as CustomEvent<{ workspaceId: string }>;
      if (event.detail.workspaceId === workspaceId) {
        setVersion(v => v + 1);
      }
    };

    window.addEventListener(STORAGE_UPDATE_EVENT, handleStorageUpdate);
    return () => window.removeEventListener(STORAGE_UPDATE_EVENT, handleStorageUpdate);
  }, [workspaceId]);

  return version;
}

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

function isLocalWorkspace(workspace: { id: string; isLocalOnly?: boolean } | null): boolean {
  if (!workspace) return false;
  if ('isLocalOnly' in workspace && workspace.isLocalOnly) {
    return true;
  }
  return workspace.id.startsWith('local_ws_') || workspace.id.startsWith('imported_');
}

// ============================================================================
// TODOS
// ============================================================================

/**
 * Offline-first todos hook
 * - Anonymous: Uses localStorage
 * - Authenticated: Uses server API
 */
export function useOfflineTodos() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // Listen for storage update events (reactive to localStorage changes)
  const storageVersion = useStorageUpdateListener(currentWorkspace?.id);

  // Server query (only when authenticated and workspace is not local)
  const serverQuery = useQuery({
    queryKey: todoQueryKeys.list(),
    queryFn: () => todosApi.getAll(),
    enabled: !!(isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)),
    staleTime: 1000 * 60, // 1 minute
  });

  // Local data from localStorage (reactive to storageVersion)
  const localData = useMemo(() => {
    if (!currentWorkspace?.id) {
      return { todos: [], projects: [], sections: [] };
    }
    return getWorkspaceData(currentWorkspace.id);
  }, [currentWorkspace?.id, storageVersion]);

  // Use server data when authenticated with server workspace, local data otherwise
  const todos: Todo[] = (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace))
    ? (serverQuery.data || [])
    : localData.todos.map(t => ({
        ...t,
        description: t.description ?? undefined,
        priority: t.priority as 1 | 2 | 3 | 4,
        dueDate: t.dueDate ?? undefined,
        projectId: t.projectId ?? undefined,
        sectionId: t.sectionId ?? undefined,
      }));

  return {
    todos,
    isLoading: isAuthenticated ? serverQuery.isLoading : false,
    error: isAuthenticated ? serverQuery.error : null,
    isLocal: !isAuthenticated || isLocalWorkspace(currentWorkspace),
  };
}

/**
 * Offline-first todo by ID
 */
export function useOfflineTodo(id: string) {
  const { todos, isLoading } = useOfflineTodos();
  const todo = todos?.find((t) => t.id === id);

  return {
    todo: todo || null,
    isLoading,
  };
}

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * Offline-first projects hook
 */
export function useOfflineProjects() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // Listen for storage update events
  const storageVersion = useStorageUpdateListener(currentWorkspace?.id);

  // Server query (only when authenticated and workspace is not local)
  const serverQuery = useQuery({
    queryKey: projectQueryKeys.lists(),
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.projects;
    },
    enabled: !!(isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace)),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Local data from localStorage (reactive to storageVersion)
  const localData = useMemo(() => {
    if (!currentWorkspace?.id) {
      return { projects: [] };
    }
    const data = getWorkspaceData(currentWorkspace.id);
    return { projects: data.projects || [] };
  }, [currentWorkspace?.id, storageVersion]);

  // Use server data when authenticated with server workspace, local data otherwise
  const projects = (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace))
    ? (serverQuery.data || [])
    : (localData.projects || []);

  return {
    projects,
    isLoading: isAuthenticated ? serverQuery.isLoading : false,
    error: isAuthenticated ? serverQuery.error : null,
    isLocal: !isAuthenticated || isLocalWorkspace(currentWorkspace),
  };
}

/**
 * Offline-first project by ID
 */
export function useOfflineProject(id: string) {
  const { projects, isLoading } = useOfflineProjects();
  const project = projects?.find((p) => p.id === id);

  return {
    project: project || null,
    isLoading,
  };
}

// ============================================================================
// SECTIONS
// ============================================================================

/**
 * Offline-first sections hook
 */
export function useOfflineSections(projectId: string) {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();

  // Listen for storage update events
  const storageVersion = useStorageUpdateListener(currentWorkspace?.id);

  // Server query (only when authenticated and workspace is not local)
  const serverQuery = useQuery({
    queryKey: sectionQueryKeys.list(projectId),
    queryFn: async () => {
      const response = await sectionsApi.getAll(projectId);
      return response.sections;
    },
    enabled: !!(isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace) && projectId),
    staleTime: 5 * 60 * 1000,
  });

  // Local data from localStorage (reactive to storageVersion)
  const localData = useMemo(() => {
    if (!currentWorkspace?.id) {
      return { sections: [] };
    }
    const data = getWorkspaceData(currentWorkspace.id);
    return { sections: data.sections || [] };
  }, [currentWorkspace?.id, storageVersion, projectId]);

  // Use server data when authenticated with server workspace, local data otherwise
  const sections: Section[] = (isAuthenticated && currentWorkspace && !isLocalWorkspace(currentWorkspace))
    ? (serverQuery.data || [])
    : (localData.sections || []).map(s => ({
        ...s,
        order: s.orderIndex,
      }));

  return {
    sections,
    isLoading: isAuthenticated ? serverQuery.isLoading : false,
    error: isAuthenticated ? serverQuery.error : null,
    isLocal: !isAuthenticated || isLocalWorkspace(currentWorkspace),
  };
}

// ============================================================================
// SYNC ON LOGIN
// ============================================================================

/**
 * Hook to sync local data to server on login
 * Promotes anonymous user's local data to server
 */
export function useSyncOnLogin() {
  const { isAuthenticated } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncLocalData = async () => {
      if (!isAuthenticated || !currentWorkspace) return;

      // Only sync if workspace was local (created while anonymous)
      if (!isLocalWorkspace(currentWorkspace)) return;

      console.log('[useSyncOnLogin] Syncing local workspace to server:', currentWorkspace.id);

      // Get local data
      const localData = getWorkspaceData(currentWorkspace.id);

      // Sync todos to server
      for (const todo of localData.todos) {
        try {
          await todosApi.create({
            title: todo.title,
            description: todo.description ?? undefined,
            priority: todo.priority as any,
            dueDate: todo.dueDate ?? undefined,
            projectId: todo.projectId ?? undefined,
            sectionId: todo.sectionId ?? undefined,
          });
        } catch (error) {
          console.error('[useSyncOnLogin] Failed to sync todo:', todo, error);
        }
      }

      // Sync projects to server
      for (const project of localData.projects) {
        try {
          await projectsApi.create({
            name: project.name,
            color: project.color,
            icon: project.icon,
          });
        } catch (error) {
          console.error('[useSyncOnLogin] Failed to sync project:', project, error);
        }
      }

      // Invalidate queries to refresh from server
      queryClient.invalidateQueries({ queryKey: todoQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });

      console.log('[useSyncOnLogin] Sync complete');
    };

    syncLocalData();
  }, [isAuthenticated, currentWorkspace]);
}
