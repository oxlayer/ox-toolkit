import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, validateArrayResponse } from '../api-client';
import type { Tag, NewTag } from '@/types/admin';

/**
 * Tags API hook
 * Provides CRUD operations for tags
 */
export function useTags(workspaceId?: string, filters?: { key?: string; value?: string }) {
  const queryClient = useQueryClient();

  // List tags (optionally filtered)
  const list = useQuery({
    queryKey: ['tags', workspaceId, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (filters?.key) params.append('key', filters.key);
      if (filters?.value) params.append('value', filters.value);
      const queryString = params.toString();
      return api.get<Tag[]>(`/api/tags${queryString ? `?${queryString}` : ''}`);
    },
    enabled: true,
    select: (data) => validateArrayResponse(data, 'Tag', 'list tags').map((tag: any) => ({
      ...tag,
      createdAt: new Date(tag.createdAt),
      updatedAt: new Date(tag.updatedAt),
    })),
  });

  // Get tag by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['tags', id],
      queryFn: () => api.get<Tag>(`/api/tags/${id}`),
      enabled: !!id,
      select: (data: any) => ({
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      }),
    });
  };

  // Get primary tags
  const getPrimary = () => {
    return useQuery({
      queryKey: ['tags', 'primary', workspaceId],
      queryFn: () => {
        const params = workspaceId ? `?workspaceId=${workspaceId}&isPrimary=true` : '?isPrimary=true';
        return api.get<Tag[]>(`/api/tags${params}`);
      },
      enabled: true,
      select: (data) => validateArrayResponse(data, 'Tag', 'getPrimary tags').map((tag: any) => ({
        ...tag,
        createdAt: new Date(tag.createdAt),
        updatedAt: new Date(tag.updatedAt),
      })),
    });
  };

  // Get tag keys (unique values)
  const getKeys = () => {
    return useQuery({
      queryKey: ['tags', 'keys', workspaceId],
      queryFn: () => {
        const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
        return api.get<string[]>(`/api/tags/keys${params}`);
      },
      enabled: true,
    });
  };

  // Get tag values for a specific key
  const getValuesByKey = (key: string) => {
    return useQuery({
      queryKey: ['tags', 'values', key, workspaceId],
      queryFn: () => {
        const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
        return api.get<string[]>(`/api/tags/values/${key}${params}`);
      },
      enabled: !!key,
    });
  };

  // Create tag
  const create = useMutation({
    mutationFn: (data: NewTag) => api.post<Tag>('/api/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Update tag
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) =>
      api.patch<Tag>(`/api/tags/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tags', variables.id] });
      toast.success('Tag updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Delete tag
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    tags: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    getById,
    getPrimary,
    getKeys,
    getValuesByKey,
    create,
    update,
    remove,
  };
}
