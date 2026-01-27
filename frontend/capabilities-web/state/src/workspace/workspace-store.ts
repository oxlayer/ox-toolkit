/**
 * @oxlayer/capabilities-web-state/workspace
 *
 * Local workspace store using Legend-State for local-first persistence.
 */

import { observable } from '@legendapp/state';
import { synced } from '@legendapp/state/sync';
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage';
import type {
  LocalWorkspace,
  WorkspaceType,
  WorkspaceFlags,
} from '../types';

/**
 * Default feature flags for each workspace type
 */
const DEFAULT_FLAGS: Record<WorkspaceType, WorkspaceFlags> = {
  personal: {
    features: {
      contacts: false,
      companies: false,
      deals: false,
      candidates: false,
      positions: false,
      pipeline: false,
    },
  },
  crm: {
    features: {
      contacts: true,
      companies: true,
      deals: true,
      candidates: false,
      positions: false,
      pipeline: true,
    },
  },
  recruiting: {
    features: {
      contacts: false,
      companies: false,
      deals: false,
      candidates: true,
      positions: true,
      pipeline: true,
    },
  },
};

/**
 * Local workspaces observable
 *
 * Uses localStorage for persistence with the key 'oxlayer_local_workspaces'.
 * No server sync - workspace list is managed locally only.
 *
 * @example
 * ```ts
 * import { localWorkspaces$ } from '@oxlayer/capabilities-state/workspace';
 *
 * // Get all local workspaces
 * const workspaces = localWorkspaces$.get();
 *
 * // Add a new workspace
 * localWorkspaces$[localWorkspaces$.length].set({
 *   id: 'local_ws_123',
 *   name: 'My Workspace',
 *   type: 'personal',
 *   // ... other fields
 * });
 * ```
 */
export const localWorkspaces$ = observable<LocalWorkspace[]>(
  synced({
    initial: [],
    persist: {
      name: 'oxlayer_local_workspaces',
      plugin: ObservablePersistLocalStorage,
      retrySync: true,
    },
    // No server sync for workspace list - local-only management
    get: undefined,
    set: undefined,
  })
);

/**
 * Current workspace ID observable
 *
 * Persists the currently selected workspace ID to localStorage.
 *
 * @example
 * ```ts
 * import { currentWorkspaceId$ } from '@oxlayer/capabilities-state/workspace';
 *
 * // Get current workspace ID
 * const currentId = currentWorkspaceId$.get();
 *
 * // Set current workspace
 * currentWorkspaceId$.set('workspace_id');
 * ```
 */
export const currentWorkspaceId$ = observable<string | null>(
  synced({
    initial: null,
    persist: {
      name: 'oxlayer_current_workspace',
      plugin: ObservablePersistLocalStorage,
    },
    get: undefined,
    set: undefined,
  })
);

/**
 * Get the default flags for a workspace type
 */
export function getDefaultFlags(type: WorkspaceType): WorkspaceFlags {
  return DEFAULT_FLAGS[type];
}

/**
 * Generate a unique local workspace ID
 */
export function generateLocalWorkspaceId(): string {
  return `local_ws_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Create a new local workspace object
 */
export function createLocalWorkspaceObject(data: {
  name: string;
  type: WorkspaceType;
  ownerId: string;
  icon?: string;
  color?: string;
}): LocalWorkspace {
  const existingWorkspaces = localWorkspaces$.get();
  const workspace: LocalWorkspace = {
    id: generateLocalWorkspaceId(),
    name: data.name.trim(),
    type: data.type,
    ownerId: data.ownerId,
    flags: getDefaultFlags(data.type),
    settings: {},
    icon: data.icon,
    color: data.color,
    orderIndex: existingWorkspaces.length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isLocalOnly: true,
  };
  return workspace;
}

/**
 * Add a workspace to the local workspaces list
 */
export function addLocalWorkspace(workspace: LocalWorkspace): void {
  const workspaces = localWorkspaces$.get();
  localWorkspaces$.set([...workspaces, workspace]);
}

/**
 * Update a workspace in the local workspaces list
 */
export function updateLocalWorkspace(
  id: string,
  updates: Partial<Omit<LocalWorkspace, 'id' | 'createdAt' | 'orderIndex'>>
): boolean {
  const workspaces = localWorkspaces$.get();
  const index = workspaces.findIndex((ws) => ws.id === id);

  if (index === -1) {
    return false;
  }

  const updated = {
    ...workspaces[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  localWorkspaces$.set([
    ...workspaces.slice(0, index),
    updated,
    ...workspaces.slice(index + 1),
  ]);

  return true;
}

/**
 * Delete a workspace from the local workspaces list
 */
export function deleteLocalWorkspace(id: string): boolean {
  const workspaces = localWorkspaces$.get();
  const filtered = workspaces.filter((ws) => ws.id !== id);

  if (filtered.length === workspaces.length) {
    return false;
  }

  localWorkspaces$.set(filtered);

  // Reset current workspace if it was the deleted one
  if (currentWorkspaceId$.get() === id) {
    const first = filtered[0];
    currentWorkspaceId$.set(first?.id || null);
  }

  return true;
}

/**
 * Get a workspace by ID
 */
export function getLocalWorkspace(id: string): LocalWorkspace | undefined {
  const workspaces = localWorkspaces$.get();
  return workspaces.find((ws) => ws.id === id);
}

/**
 * Get the current workspace
 */
export function getCurrentWorkspace(): LocalWorkspace | undefined {
  const currentId = currentWorkspaceId$.get();
  if (!currentId) {
    return undefined;
  }
  return getLocalWorkspace(currentId);
}
