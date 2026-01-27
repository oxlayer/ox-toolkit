import { api } from '../api/client';

// ============================================================================
// TYPES
// ============================================================================

export type WorkspaceType = 'personal' | 'crm' | 'recruiting';

export interface WorkspaceFlags {
  features: {
    contacts: boolean;
    companies: boolean;
    deals: boolean;
    candidates: boolean;
    positions: boolean;
    pipeline: boolean;
  };
}

export interface Workspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  flags: WorkspaceFlags;
  settings: Record<string, unknown>;
  icon?: string;
  color?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  type: WorkspaceType;
  icon?: string;
  color?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  icon?: string;
  color?: string;
  flags?: Partial<WorkspaceFlags['features']>;
}

// Backend API response format
interface BackendWorkspaceResponse {
  id: string;
  name: string;
  type: WorkspaceType;
  owner_id: string;
  flags: WorkspaceFlags;
  settings: Record<string, unknown>;
  icon?: string;
  color?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

interface BackendListResponse<T> {
  success: boolean;
  data: T[];
}

interface BackendSingleResponse<T> {
  success: boolean;
  data: T;
}

// ============================================================================
// TRANSFORMERS
// ============================================================================

function transformBackendWorkspace(backendWorkspace: BackendWorkspaceResponse): Workspace {
  return {
    id: backendWorkspace.id,
    name: backendWorkspace.name,
    type: backendWorkspace.type,
    ownerId: backendWorkspace.owner_id,
    flags: backendWorkspace.flags,
    settings: backendWorkspace.settings,
    icon: backendWorkspace.icon,
    color: backendWorkspace.color,
    orderIndex: backendWorkspace.orderIndex,
    createdAt: backendWorkspace.createdAt,
    updatedAt: backendWorkspace.updatedAt,
  };
}

// ============================================================================
// WORKSPACE API
// ============================================================================

export const workspacesApi = {
  /**
   * Get all workspaces for the current user
   */
  getAll: async () => {
    const result = await api.get<BackendListResponse<BackendWorkspaceResponse>>('/workspaces');
    if (!result || !result.data) return [];
    return result.data.map(transformBackendWorkspace);
  },

  /**
   * Get the default workspace for the current user
   * This will create a personal workspace if none exists
   */
  getDefault: async () => {
    const result = await api.get<BackendSingleResponse<BackendWorkspaceResponse>>('/workspaces/default');
    if (!result || !result.data) throw new Error('Failed to get default workspace');
    return transformBackendWorkspace(result.data);
  },

  /**
   * Get a single workspace by ID
   */
  getById: async (id: string) => {
    const result = await api.get<BackendSingleResponse<BackendWorkspaceResponse>>(`/workspaces/${id}`);
    if (!result || !result.data) throw new Error('Workspace not found');
    return transformBackendWorkspace(result.data);
  },

  /**
   * Create a new workspace
   */
  create: async (input: CreateWorkspaceInput) => {
    const result = await api.post<BackendSingleResponse<BackendWorkspaceResponse>>('/workspaces', input);
    if (!result || !result.data) throw new Error('Failed to create workspace');
    return transformBackendWorkspace(result.data);
  },

  /**
   * Update a workspace
   */
  update: async (id: string, input: UpdateWorkspaceInput) => {
    const result = await api.patch<BackendSingleResponse<BackendWorkspaceResponse>>(`/workspaces/${id}`, input);
    if (!result || !result.data) throw new Error('Failed to update workspace');
    return transformBackendWorkspace(result.data);
  },

  /**
   * Delete a workspace
   */
  delete: (id: string) =>
    api.delete<void>(`/workspaces/${id}`),

  /**
   * Switch to a different workspace (sets it as default)
   */
  switch: async (id: string) => {
    const result = await api.post<BackendSingleResponse<BackendWorkspaceResponse>>(`/workspaces/${id}/switch`, {});
    if (!result || !result.data) throw new Error('Failed to switch workspace');
    return transformBackendWorkspace(result.data);
  },
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceQueryKeys.all, 'list'] as const,
  list: () => [...workspaceQueryKeys.lists()] as const,
  details: () => [...workspaceQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceQueryKeys.details(), id] as const,
  default: () => [...workspaceQueryKeys.all, 'default'] as const,
};
