import { W as WorkspaceData } from '../types-B56Eq8pd.js';
import * as _legendapp_state from '@legendapp/state';
import { Observable } from '@legendapp/state';

/**
 * Get the storage key for a workspace's data
 */
declare function getWorkspaceDataKey(workspaceId: string): string;
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
declare function createWorkspaceDataStore<T extends Record<string, unknown> = Record<string, unknown>>(workspaceId: string, options: {
    initialEntities: T;
    isAuthenticated?: boolean;
    getRemoteData?: () => Promise<WorkspaceData<T> | null>;
    setRemoteData?: (data: WorkspaceData<T>) => Promise<void>;
}): Observable<WorkspaceData<T>>;
/**
 * Get or create a workspace data store
 *
 * @template T - The shape of the entities object (domain-specific)
 *
 * @param workspaceId - The workspace ID
 * @param options - Options for creating the store
 * @returns The workspace data observable
 */
declare function getWorkspaceDataStore<T extends Record<string, unknown> = Record<string, unknown>>(workspaceId: string, options?: {
    initialEntities: T;
    isAuthenticated?: boolean;
    getRemoteData?: () => Promise<WorkspaceData<T> | null>;
    setRemoteData?: (data: WorkspaceData<T>) => Promise<void>;
}): any;
/**
 * Delete a workspace data store
 *
 * @param workspaceId - The workspace ID
 */
declare function deleteWorkspaceDataStore(workspaceId: string): void;
/**
 * Get sync state for a workspace data store
 *
 * @param workspaceId - The workspace ID
 * @returns The sync state observable
 */
declare function getWorkspaceDataSyncState(workspaceId: string): Observable<_legendapp_state.ObservableSyncState> | undefined;
/**
 * Active workspace data store
 *
 * This observable points to the data store of the currently active workspace.
 * It is updated when switching workspaces.
 */
declare const activeWorkspaceData$: Observable<WorkspaceData<Record<string, unknown>> | null>;
/**
 * Switch the active workspace data store
 *
 * @template T - The shape of the entities object (domain-specific)
 *
 * @param workspaceId - The workspace ID to switch to
 * @param options - Options for creating the store if it doesn't exist
 */
declare function switchActiveWorkspaceData<T extends Record<string, unknown> = Record<string, unknown>>(workspaceId: string, options?: {
    initialEntities: T;
    isAuthenticated?: boolean;
    getRemoteData?: () => Promise<WorkspaceData<T> | null>;
    setRemoteData?: (data: WorkspaceData<T>) => Promise<void>;
}): void;
/**
 * Check if a workspace data store exists
 *
 * @param workspaceId - The workspace ID
 * @returns True if the store exists
 */
declare function hasWorkspaceDataStore(workspaceId: string): boolean;
/**
 * Get all workspace IDs that have data stores
 *
 * @returns Array of workspace IDs
 */
declare function getWorkspaceDataStoreIds(): string[];

export { WorkspaceData, activeWorkspaceData$, createWorkspaceDataStore, deleteWorkspaceDataStore, getWorkspaceDataKey, getWorkspaceDataStore, getWorkspaceDataStoreIds, getWorkspaceDataSyncState, hasWorkspaceDataStore, switchActiveWorkspaceData };
