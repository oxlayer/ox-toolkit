/**
 * @oxlayer/capabilities-web-state/data
 *
 * Per-workspace data store using Legend-State for local-first persistence.
 *
 * Generic workspace data management - apps define their own entity types.
 */

import { observable, syncState, Observable } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import type { WorkspaceData } from '../types';

/**
 * Registry of all workspace data stores
 * Using `any` to work around Legend-State's complex observable typing
 */
const workspaceDataStores: Map<string, any> = new Map();

/**
 * Storage key prefix for workspace data
 */
const WORKSPACE_DATA_PREFIX = 'oxlayer_workspace_data_';

/**
 * Get the storage key for a workspace's data
 */
export function getWorkspaceDataKey(workspaceId: string): string {
  return `${WORKSPACE_DATA_PREFIX}${workspaceId}`;
}

/**
 * Create a workspace data store
 *
 * Each workspace has its own isolated data store that persists to localStorage.
 * Sync is conditional - only enabled when authenticated.
 *
 * @template T - The shape of the entities object (domain-specific)
 *
 * @param workspaceId - The workspace ID
 * @param initialEntities - Initial entities structure
 * @param isAuthenticated - Whether the user is authenticated (enables sync)
 * @param getRemoteData - Optional function to fetch data from server
 * @param setRemoteData - Optional function to sync data to server
 * @returns The workspace data observable
 *
 * @example
 * ```ts
 * // Todo app
 * interface TodoEntities {
 *   todos: TodoEntity[];
 *   projects: ProjectEntity[];
 *   sections: SectionEntity[];
 * }
 *
 * const store = createWorkspaceDataStore<TodoEntities>('ws_123', {
 *   initialEntities: {
 *     todos: [],
 *     projects: [],
 *     sections: [],
 *   },
 *   isAuthenticated: true,
 *   getRemoteData: async () => {
 *     const response = await fetch(`/api/workspaces/ws_123/data`);
 *     return await response.json();
 *   },
 *   setRemoteData: async (data) => {
 *     await fetch(`/api/workspaces/ws_123/data`, {
 *       method: 'POST',
 *       body: JSON.stringify(data),
 *     });
 *   },
 * });
 * ```
 */
export function createWorkspaceDataStore<T extends Record<string, unknown> = Record<string, unknown>>(
  workspaceId: string,
  options: {
    initialEntities: T;
    isAuthenticated?: boolean;
    getRemoteData?: () => Promise<WorkspaceData<T> | null>;
    setRemoteData?: (data: WorkspaceData<T>) => Promise<void>;
  }
) {
  const { initialEntities, isAuthenticated = false, getRemoteData, setRemoteData } = options;

  const store$ = observable<WorkspaceData<T>>(
    synced({
      initial: {
        workspaceId,
        entities: initialEntities,
        settings: {},
      },
      persist: {
        name: getWorkspaceDataKey(workspaceId),
        plugin: ObservablePersistLocalStorage,
        retrySync: true,
      },
      // Conditional sync: only sync to server if authenticated
      get: isAuthenticated && getRemoteData
        ? async () => {
            try {
              const remoteData = await getRemoteData();
              return remoteData || {
                workspaceId,
                entities: initialEntities,
                settings: {},
              };
            } catch (error) {
              console.error(`Failed to fetch workspace data for ${workspaceId}:`, error);
              // Return undefined to keep local data
              return undefined;
            }
          }
        : undefined,
      set: isAuthenticated && setRemoteData
        ? async (params: { value: WorkspaceData<T> | undefined }) => {
            if (!params.value) return;
            try {
              await setRemoteData(params.value);
            } catch (error) {
              console.error(`Failed to sync workspace data for ${workspaceId}:`, error);
              throw error;
            }
          }
        : undefined,
    })
  );

  // Register the store
  workspaceDataStores.set(workspaceId, store$);

  return store$;
}

/**
 * Get or create a workspace data store
 *
 * @template T - The shape of the entities object (domain-specific)
 *
 * @param workspaceId - The workspace ID
 * @param options - Options for creating the store
 * @returns The workspace data observable
 */
export function getWorkspaceDataStore<T extends Record<string, unknown> = Record<string, unknown>>(
  workspaceId: string,
  options?: {
    initialEntities: T;
    isAuthenticated?: boolean;
    getRemoteData?: () => Promise<WorkspaceData<T> | null>;
    setRemoteData?: (data: WorkspaceData<T>) => Promise<void>;
  }
) {
  if (!workspaceDataStores.has(workspaceId)) {
    if (!options?.initialEntities) {
      throw new Error(`Workspace data store for ${workspaceId} does not exist. Provide initialEntities to create it.`);
    }
    return createWorkspaceDataStore<T>(workspaceId, options);
  }
  return workspaceDataStores.get(workspaceId)!;
}

/**
 * Delete a workspace data store
 *
 * @param workspaceId - The workspace ID
 */
export function deleteWorkspaceDataStore(workspaceId: string): void {
  workspaceDataStores.delete(workspaceId);
  // Clear the persisted data
  localStorage.removeItem(getWorkspaceDataKey(workspaceId));
}

/**
 * Get sync state for a workspace data store
 *
 * @param workspaceId - The workspace ID
 * @returns The sync state observable
 */
export function getWorkspaceDataSyncState(workspaceId: string) {
  const store = workspaceDataStores.get(workspaceId);
  if (!store) {
    return undefined;
  }
  return syncState(store);
}

/**
 * Active workspace data store
 *
 * This observable points to the data store of the currently active workspace.
 * It is updated when switching workspaces.
 */
export const activeWorkspaceData$ = observable<WorkspaceData<Record<string, unknown>> | null>(null);

/**
 * Switch the active workspace data store
 *
 * @template T - The shape of the entities object (domain-specific)
 *
 * @param workspaceId - The workspace ID to switch to
 * @param options - Options for creating the store if it doesn't exist
 */
export function switchActiveWorkspaceData<T extends Record<string, unknown> = Record<string, unknown>>(
  workspaceId: string,
  options?: {
    initialEntities: T;
    isAuthenticated?: boolean;
    getRemoteData?: () => Promise<WorkspaceData<T> | null>;
    setRemoteData?: (data: WorkspaceData<T>) => Promise<void>;
  }
): void {
  const dataStore = getWorkspaceDataStore<T>(workspaceId, options);
  activeWorkspaceData$.set(dataStore.get() ?? null);
}

/**
 * Check if a workspace data store exists
 *
 * @param workspaceId - The workspace ID
 * @returns True if the store exists
 */
export function hasWorkspaceDataStore(workspaceId: string): boolean {
  return workspaceDataStores.has(workspaceId);
}

/**
 * Get all workspace IDs that have data stores
 *
 * @returns Array of workspace IDs
 */
export function getWorkspaceDataStoreIds(): string[] {
  return Array.from(workspaceDataStores.keys());
}
