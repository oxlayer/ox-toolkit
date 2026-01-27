/**
 * Workspace Context
 *
 * Manages workspace state across the application.
 * Provides workspace switching and feature flag access.
 * Uses the new generic @oxlayer/capabilities-web-state API.
 * Uses offline-first storage with SQLite (OPFS) + localStorage + API sync.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Workspace, WorkspaceType } from './api';
import { workspacesApi, workspaceQueryKeys } from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkspaceDataKey,
  sqliteStorage,
  getOfflineStorage,
  flushStorage
} from '@oxlayer/capabilities-web-state';

// ============================================================================
// STORAGE KEYS
// ============================================================================

const LOCAL_WORKSPACES_KEY = 'oxlayer_local_workspaces';
const CURRENT_WORKSPACE_ID_KEY = 'oxlayer_current_workspace';
const TOKEN_KEY = 'todo_app_token';

// ============================================================================
// TYPES
// ============================================================================

// Define local workspace type (app-specific, not from the package)
export interface LocalWorkspace {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  flags: {
    features: {
      contacts: boolean;
      companies: boolean;
      deals: boolean;
      candidates: boolean;
      positions: boolean;
      pipeline: boolean;
    };
  };
  settings: Record<string, unknown>;
  icon?: string;
  color?: string;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  isLocalOnly: boolean;
  lastSyncedAt?: string;
}

interface WorkspaceContextValue {
  // Current workspace (can be local or server)
  currentWorkspace: Workspace | LocalWorkspace | null;
  workspaces: (Workspace | LocalWorkspace)[];
  isLoading: boolean;
  error: Error | null;

  // Onboarding
  showOnboarding: boolean;
  dismissOnboarding: () => void;

  // Actions
  switchWorkspace: (id: string) => Promise<void>;
  createWorkspace: (data: { name: string; type: WorkspaceType; icon?: string; color?: string }) => Promise<Workspace | LocalWorkspace>;
  updateWorkspace: (id: string, data: { name?: string; icon?: string; color?: string }) => Promise<void>;
  updateWorkspaceFeatures: (id: string, features: Partial<Workspace['flags']['features']>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  // Local workspace actions
  createLocalWorkspace: (data: { name: string; type: WorkspaceType; ownerId: string; icon?: string; color?: string }) => Promise<LocalWorkspace>;

  // Feature flag helpers
  hasFeature: (feature: keyof Workspace['flags']['features']) => boolean;
  isPersonal: () => boolean;
  isCrm: () => boolean;
  isRecruiting: () => boolean;

  // Check if workspace is local
  isLocalWorkspace: (id: string) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

// ============================================================================
// CONSTANTS
// ============================================================================

// Default flags per workspace type
const DEFAULT_FLAGS: Record<WorkspaceType, LocalWorkspace['flags']> = {
  personal: {
    features: { contacts: false, companies: false, deals: false, candidates: false, positions: false, pipeline: false }
  },
  crm: {
    features: { contacts: true, companies: true, deals: true, candidates: false, positions: false, pipeline: true }
  },
  recruiting: {
    features: { contacts: false, companies: false, deals: false, candidates: true, positions: true, pipeline: true }
  },
};

// ============================================================================
// STORAGE HELPERS - using capabilities-web offline-storage API
// ============================================================================

// Get offline storage instance with multi-source strategy
const offlineStorage = getOfflineStorage({ sqlite: sqliteStorage });

async function getLocalWorkspaces(): Promise<LocalWorkspace[]> {
  // Try offline storage first (SQLite + localStorage wrapper)
  const result = await offlineStorage.getItem<string>(LOCAL_WORKSPACES_KEY);
  console.log('[WorkspaceProvider] getLocalWorkspaces', { key: LOCAL_WORKSPACES_KEY, count: result.data?.length || 0, source: result.source });
  if (result.data) {
    try {
      return JSON.parse(result.data);
    } catch {
      // Invalid JSON, try fallback
    }
  }

  // Fallback to direct localStorage read
  try {
    const localData = localStorage.getItem(LOCAL_WORKSPACES_KEY);
    if (localData) {
      const parsed = JSON.parse(localData);
      console.log('[WorkspaceProvider] Loaded from localStorage fallback:', parsed.length);
      return parsed;
    }
  } catch (e) {
    console.warn('[WorkspaceProvider] Failed to read from localStorage fallback:', e);
  }

  return [];
}

async function saveLocalWorkspaces(workspaces: LocalWorkspace[]): Promise<void> {
  await offlineStorage.setItem(LOCAL_WORKSPACES_KEY, workspaces);
  // Also write directly to localStorage as fallback for critical data
  try {
    localStorage.setItem(LOCAL_WORKSPACES_KEY, JSON.stringify(workspaces));
    console.log('[WorkspaceProvider] Saved workspaces to localStorage fallback:', workspaces.length);
  } catch (e) {
    console.warn('[WorkspaceProvider] Failed to save to localStorage fallback:', e);
  }
}

async function getCurrentWorkspaceId(): Promise<string | null> {
  const result = await offlineStorage.getItem<string>(CURRENT_WORKSPACE_ID_KEY);
  return result.data;
}

async function setCurrentWorkspaceId(id: string | null): Promise<void> {
  if (id) {
    await offlineStorage.setItem(CURRENT_WORKSPACE_ID_KEY, id);
  } else {
    await offlineStorage.removeItem(CURRENT_WORKSPACE_ID_KEY);
  }
}

async function getToken(): Promise<string | null> {
  const result = await offlineStorage.getItem<string>(TOKEN_KEY);
  return result.data;
}

function generateLocalWorkspaceId(): string {
  return `local_ws_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const queryClient = useQueryClient();

  // SQLite storage ready state
  const [storageReady, setStorageReady] = useState(false);

  // Local state for current workspace ID (initialize from localStorage as fallback)
  const initialWorkspaceId = typeof localStorage !== 'undefined'
    ? localStorage.getItem(CURRENT_WORKSPACE_ID_KEY)
    : null;
  console.log('[WorkspaceProvider] Initializing with initialWorkspaceId:', initialWorkspaceId);
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<string | null>(() => initialWorkspaceId);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Get auth state from token
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch server workspaces (only if authenticated)
  const { data: serverWorkspaces = [], isLoading: isLoadingServer, error: serverError } = useQuery({
    queryKey: workspaceQueryKeys.list(),
    queryFn: workspacesApi.getAll,
    enabled: isAuthenticated, // Only fetch if logged in
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Local workspaces state (loaded from offline-first storage)
  const [localWorkspaces, setLocalWorkspaces] = useState<LocalWorkspace[]>([]);

  // Initialize storage and load initial data
  useEffect(() => {
    let mounted = true;

    console.log('[WorkspaceProvider] Starting storage initialization...');

    async function init() {
      try {
        console.log('[WorkspaceProvider] Calling sqliteStorage.init()...');

        // Initialize SQLite WASM storage with timeout fallback
        // Note: offlineStorage wraps sqliteStorage, so we init SQLite directly
        const initPromise = sqliteStorage.init();
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Storage init timeout')), 1000)
        );

        try {
          await Promise.race([initPromise, timeoutPromise]);
          console.log('[WorkspaceProvider] Storage initialized successfully');
        } catch (timeoutError) {
          console.log('[WorkspaceProvider] Storage init timed out, using fallback');
          // Continue - storage will use localStorage fallback
        }

        if (!mounted) return;

        console.log('[WorkspaceProvider] Storage ready, loading data...');

        // Load current workspace ID
        const savedWorkspaceId = await getCurrentWorkspaceId();
        console.log('[WorkspaceProvider] Saved workspace ID:', savedWorkspaceId);
        setCurrentWorkspaceIdState(savedWorkspaceId);

        // Load local workspaces
        const workspaces = await getLocalWorkspaces();
        console.log('[WorkspaceProvider] Loaded local workspaces:', workspaces.length);
        setLocalWorkspaces(workspaces);

        // Load auth state from token
        const token = await getToken();
        console.log('[WorkspaceProvider] Token found:', !!token);
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setIsAuthenticated(payload.actor_type === 'user');
          } catch {
            setIsAuthenticated(false);
          }
        }

        setStorageReady(true);
        console.log('[WorkspaceProvider] Storage ready');
      } catch (error) {
        console.error('[WorkspaceProvider] Failed to initialize storage:', error);
        // Still mark as ready so the app works with fallback
        if (mounted) {
          setStorageReady(true);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Merge local and server workspaces
  const allWorkspaces = useMemo(() => {
    if (isAuthenticated) {
      // When logged in AND server workspaces are loaded: server workspaces + local-only workspaces
      // While loading server workspaces, just show local workspaces
      if (isLoadingServer) {
        return localWorkspaces;
      }
      return [
        ...serverWorkspaces,
        ...localWorkspaces.filter((ws) => ws.isLocalOnly),
      ];
    }
    // When anonymous: only local workspaces
    return localWorkspaces;
  }, [serverWorkspaces, localWorkspaces, isAuthenticated, isLoadingServer]);

  // Check if we're still loading initial data
  const isLoadingInitialData = isAuthenticated && isLoadingServer;

  // Set current workspace when data loads, or show onboarding if no workspaces
  useEffect(() => {
    if (!storageReady) return;
    // Don't run while still loading server data
    if (isLoadingInitialData) return;

    console.log('[WorkspaceProvider] useEffect', {
      allWorkspacesCount: allWorkspaces.length,
      currentWorkspaceId,
      showOnboarding,
      isLoadingInitialData,
      allWorkspaceIds: allWorkspaces.map(w => w.id)
    });

    // Check if current workspace ID actually exists in the list
    const currentWorkspaceExists = currentWorkspaceId && allWorkspaces.some(w => w.id === currentWorkspaceId);

    if (allWorkspaces.length === 0 && !showOnboarding) {
      // ALWAYS show onboarding if there are no workspaces
      console.log('[WorkspaceProvider] No workspaces found, showing onboarding');
      setShowOnboarding(true);
      setCurrentWorkspaceId(null); // Clear any invalid workspace ID
    } else if (allWorkspaces.length > 0 && !currentWorkspaceId) {
      // Find workspace with orderIndex 0 (default) or use first one
      const defaultWs = allWorkspaces.find((w) => w.orderIndex === 0) || allWorkspaces[0];
      const id = defaultWs?.id || null;
      console.log('[WorkspaceProvider] Setting current workspace', { id, defaultWs });
      // Note: setCurrentWorkspaceId is now async but we don't await to avoid blocking
      setCurrentWorkspaceId(id).catch(console.error);
    } else if (currentWorkspaceId && !currentWorkspaceExists && !showOnboarding) {
      // Saved workspace ID doesn't exist in the list, clear it and show onboarding
      console.log('[WorkspaceProvider] Saved workspace not found, clearing and showing onboarding');
      setCurrentWorkspaceId(null).catch(console.error);
      setShowOnboarding(true);
    }
  }, [allWorkspaces, currentWorkspaceId, showOnboarding, storageReady, isLoadingInitialData]);

  // Current workspace object (can be local or server)
  const currentWorkspace = useMemo(() => {
    if (!currentWorkspaceId) return null;
    return allWorkspaces.find((w) => w.id === currentWorkspaceId) || null;
  }, [allWorkspaces, currentWorkspaceId]);

  // Is workspace loading?
  const isLoading = !storageReady || (isAuthenticated && isLoadingServer);

  // Merge errors
  const error = serverError;

  // Switch workspace
  const switchWorkspace = useCallback(async (id: string) => {
    const isLocal = localWorkspaces.some((ws) => ws.id === id);

    if (!isLocal && isAuthenticated) {
      // Server workspace - call API
      await workspacesApi.switch(id);
    }

    // Update current workspace ID
    await setCurrentWorkspaceId(id);
    setCurrentWorkspaceIdState(id);
  }, [localWorkspaces, isAuthenticated]);

  // Create server workspace
  const createMutation = useMutation({
    mutationFn: workspacesApi.create,
    onSuccess: async (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.default() });
      // Auto-switch to new workspace and dismiss onboarding
      await setCurrentWorkspaceId(newWorkspace.id);
      setCurrentWorkspaceIdState(newWorkspace.id);
      setShowOnboarding(false);
    },
  });

  // Create local workspace
  const createLocalWorkspace = useCallback(async (data: {
    name: string;
    type: WorkspaceType;
    ownerId: string;
    icon?: string;
    color?: string;
  }): Promise<LocalWorkspace> => {
    const workspaces = await getLocalWorkspaces();

    const newWorkspace: LocalWorkspace = {
      id: generateLocalWorkspaceId(),
      name: data.name,
      type: data.type,
      ownerId: data.ownerId,
      flags: DEFAULT_FLAGS[data.type],
      settings: {},
      icon: data.icon,
      color: data.color,
      orderIndex: workspaces.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocalOnly: true,
    };

    workspaces.push(newWorkspace);
    await saveLocalWorkspaces(workspaces);

    // Flush to ensure data is persisted before continuing
    // This is critical for onboarding - we need the workspace to survive page reload
    try {
      await flushStorage({ sqlite: sqliteStorage });
      console.log('[WorkspaceProvider] Flushed storage after creating workspace');
    } catch (error) {
      console.warn('[WorkspaceProvider] Failed to flush storage:', error);
    }

    setLocalWorkspaces(workspaces); // Update state

    // Set as current and dismiss onboarding
    await setCurrentWorkspaceId(newWorkspace.id);
    setCurrentWorkspaceIdState(newWorkspace.id);
    setShowOnboarding(false);

    return newWorkspace;
  }, []);

  // Create workspace (server or local based on auth)
  const createWorkspace = useCallback(async (data: {
    name: string;
    type: WorkspaceType;
    icon?: string;
    color?: string;
  }) => {
    if (isAuthenticated) {
      return createMutation.mutateAsync(data);
    } else {
      // Get owner ID from anonymous session
      const token = await getToken();
      let ownerId = 'anonymous';

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          ownerId = payload.actor_id || 'anonymous';
        } catch {
          // Use default
        }
      }

      return createLocalWorkspace({
        ...data,
        ownerId,
      });
    }
  }, [isAuthenticated, createMutation, createLocalWorkspace]);

  // Update workspace mutation (server only)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; icon?: string; color?: string } }) =>
      workspacesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.default() });
    },
  });

  // Update workspace (handles both local and server)
  const updateWorkspace = useCallback(async (id: string, data: { name?: string; icon?: string; color?: string }) => {
    const isLocal = localWorkspaces.some((ws) => ws.id === id);

    if (isLocal) {
      // Update local workspace
      const workspaces = await getLocalWorkspaces();
      const index = workspaces.findIndex((ws) => ws.id === id);
      if (index !== -1) {
        workspaces[index] = {
          ...workspaces[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        await saveLocalWorkspaces(workspaces);
        setLocalWorkspaces(workspaces); // Update state
      }
    } else {
      // Update server workspace
      await updateMutation.mutateAsync({ id, data });
    }
  }, [localWorkspaces, updateMutation]);

  // Update workspace features (handles both local and server)
  const updateWorkspaceFeatures = useCallback(async (id: string, features: Partial<Workspace['flags']['features']>) => {
    const isLocal = localWorkspaces.some((ws) => ws.id === id);

    if (isLocal) {
      // Update local workspace features
      const workspaces = await getLocalWorkspaces();
      const index = workspaces.findIndex((ws) => ws.id === id);
      if (index !== -1) {
        workspaces[index] = {
          ...workspaces[index],
          flags: {
            ...workspaces[index].flags,
            features: {
              ...workspaces[index].flags.features,
              ...features,
            },
          },
          updatedAt: new Date().toISOString(),
        };
        await saveLocalWorkspaces(workspaces);
        setLocalWorkspaces(workspaces); // Update state
      }
    } else {
      // For server workspaces, we'd need to call the API
      // For now, just log that this needs to be implemented for server workspaces
      console.warn('[updateWorkspaceFeatures] Server workspace feature update not yet implemented');
    }
  }, [localWorkspaces]);

  // Delete workspace mutation (server only)
  const deleteMutation = useMutation({
    mutationFn: workspacesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.default() });
    },
  });

  // Delete workspace (handles both local and server)
  const deleteWorkspace = useCallback(async (id: string) => {
    const isLocal = localWorkspaces.some((ws) => ws.id === id);

    if (isLocal) {
      // Delete local workspace
      const workspaces = await getLocalWorkspaces();
      const filtered = workspaces.filter((ws) => ws.id !== id);
      await saveLocalWorkspaces(filtered);
      setLocalWorkspaces(filtered); // Update state

      // Also delete workspace data
      const dataKey = getWorkspaceDataKey(id);
      await offlineStorage.removeItem(dataKey);

      // Clear current if deleted
      if (currentWorkspaceId === id) {
        const remaining = filtered.length > 0 ? filtered[0].id : null;
        await setCurrentWorkspaceId(remaining);
        setCurrentWorkspaceIdState(remaining);
      }
    } else {
      // Delete server workspace
      await deleteMutation.mutateAsync(id);
    }
  }, [localWorkspaces, deleteMutation, currentWorkspaceId]);

  // Feature flag helpers
  const hasFeature = useCallback((feature: keyof Workspace['flags']['features']): boolean => {
    return currentWorkspace?.flags.features[feature] ?? false;
  }, [currentWorkspace]);

  const isPersonal = useCallback((): boolean => {
    return currentWorkspace?.type === 'personal';
  }, [currentWorkspace]);

  const isCrm = useCallback((): boolean => {
    return currentWorkspace?.type === 'crm';
  }, [currentWorkspace]);

  const isRecruiting = useCallback((): boolean => {
    return currentWorkspace?.type === 'recruiting';
  }, [currentWorkspace]);

  // Check if workspace is local
  const isLocalWorkspace = useCallback((id: string): boolean => {
    return localWorkspaces.some((ws) => ws.id === id);
  }, [localWorkspaces]);

  // Context value
  const value = useMemo<WorkspaceContextValue>(() => ({
    currentWorkspace,
    workspaces: allWorkspaces,
    isLoading,
    error: error as Error | null,
    showOnboarding,
    dismissOnboarding: () => setShowOnboarding(false),
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    updateWorkspaceFeatures,
    deleteWorkspace,
    createLocalWorkspace,
    hasFeature,
    isPersonal,
    isCrm,
    isRecruiting,
    isLocalWorkspace,
  }), [
    currentWorkspace,
    allWorkspaces,
    isLoading,
    error,
    showOnboarding,
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    updateWorkspaceFeatures,
    deleteWorkspace,
    createLocalWorkspace,
    hasFeature,
    isPersonal,
    isCrm,
    isRecruiting,
    isLocalWorkspace,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

// ============================================================================
// FEATURE GUARD COMPONENT
// ============================================================================

interface FeatureGuardProps {
  feature: keyof Workspace['flags']['features'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGuard({ feature, children, fallback = null }: FeatureGuardProps) {
  const { hasFeature } = useWorkspace();

  if (!hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
