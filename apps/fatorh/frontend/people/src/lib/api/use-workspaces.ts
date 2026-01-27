import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api-client';
import type { Workspace } from '@/types/organization';

export interface NewWorkspace {
  name: string;
  description?: string;
  organizationId?: string; // Optional - workspace can be at realm level
  // Provisioning fields (optional)
  realmId?: string;
  domainAliases?: string[];
  rootManagerEmail?: string;
}

/**
 * Workspace API hook
 * Provides CRUD operations for workspaces
 */
export function useWorkspaces(organizationId?: string) {
  const queryClient = useQueryClient();

  // List workspaces (optionally filtered by organization)
  const list = useQuery({
    queryKey: ['workspaces', organizationId],
    queryFn: () => {
      const params = organizationId ? `?organizationId=${organizationId}` : '';
      return api.get<Workspace[]>(`/api/workspaces${params}`);
    },
    enabled: true,
  });

  // Get workspace by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['workspaces', id],
      queryFn: () => api.get<Workspace>(`/api/workspaces/${id}`),
      enabled: !!id,
    });
  };

  // Create workspace
  const create = useMutation({
    mutationFn: (data: NewWorkspace) =>
      api.post<Workspace>('/api/workspaces', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Update workspace
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workspace> }) =>
      api.patch<Workspace>(`/api/workspaces/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Delete workspace
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/workspaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    workspaces: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    getById,
    create,
    update,
    remove,
  };
}
