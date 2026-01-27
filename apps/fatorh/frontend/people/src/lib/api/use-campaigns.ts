import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api-client';
import type { WhatsAppCampaign, NewWhatsAppCampaign } from '@/types/admin';

/**
 * WhatsApp Campaigns API hook
 * Provides CRUD operations for WhatsApp campaigns
 */
export function useCampaigns(examId?: string) {
  const queryClient = useQueryClient();

  // List campaigns (optionally filtered by exam)
  const list = useQuery({
    queryKey: ['campaigns', examId],
    queryFn: () => {
      const params = examId ? `?examId=${examId}` : '';
      return api.get<WhatsAppCampaign[]>(`/api/campaigns${params}`);
    },
    enabled: true,
  });

  // Get campaign by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['campaigns', id],
      queryFn: () => api.get<WhatsAppCampaign>(`/api/campaigns/${id}`),
      enabled: !!id,
    });
  };

  // Create campaign
  const create = useMutation({
    mutationFn: (data: NewWhatsAppCampaign) => api.post<WhatsAppCampaign>('/api/campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Update campaign
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WhatsAppCampaign> }) =>
      api.patch<WhatsAppCampaign>(`/api/campaigns/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] });
      toast.success('Campaign updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Delete campaign
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/campaigns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    campaigns: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    getById,
    create,
    update,
    remove,
  };
}
