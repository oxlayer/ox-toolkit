import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api-client';
import type { Template, NewTemplate, TemplateType } from '@/types/admin';

/**
 * Templates API hook
 * Provides CRUD operations for templates
 */
export function useTemplates(workspaceId?: string, type?: TemplateType) {
  const queryClient = useQueryClient();

  // List templates (optionally filtered)
  const list = useQuery({
    queryKey: ['templates', workspaceId, type],
    queryFn: () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (type) params.append('type', type);
      const queryString = params.toString();
      return api.get<Template[]>(`/api/templates${queryString ? `?${queryString}` : ''}`);
    },
    enabled: true,
  });

  // Get template by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['templates', id],
      queryFn: () => api.get<Template>(`/api/templates/${id}`),
      enabled: !!id,
    });
  };

  // Create template
  const create = useMutation({
    mutationFn: (data: NewTemplate) => api.post<Template>('/api/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Update template
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Template> }) =>
      api.patch<Template>(`/api/templates/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates', variables.id] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Delete template
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    templates: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    getById,
    create,
    update,
    remove,
  };
}
