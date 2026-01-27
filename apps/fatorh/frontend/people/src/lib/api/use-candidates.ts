import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api-client';
import type { Candidate, NewCandidate, CandidateWithExamCount } from '@/types/admin';

/**
 * Candidates API hook
 * Provides CRUD operations for candidates
 */
export function useCandidates(workspaceId?: string, examId?: string) {
  const queryClient = useQueryClient();

  // List candidates (optionally filtered by workspace or exam)
  const list = useQuery({
    queryKey: ['candidates', workspaceId, examId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (workspaceId) params.append('workspaceId', workspaceId);
      if (examId) params.append('examId', examId);
      const queryString = params.toString();
      return api.get<CandidateWithExamCount[]>(`/api/candidates${queryString ? `?${queryString}` : ''}`);
    },
    enabled: true,
  });

  // Get candidate by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['candidates', id],
      queryFn: () => api.get<CandidateWithExamCount>(`/api/candidates/${id}`),
      enabled: !!id,
    });
  };

  // Create candidate
  const create = useMutation({
    mutationFn: (data: NewCandidate) => api.post<Candidate>('/api/candidates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Candidate created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Update candidate
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Candidate> }) =>
      api.patch<Candidate>(`/api/candidates/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      queryClient.invalidateQueries({ queryKey: ['candidates', variables.id] });
      toast.success('Candidate updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Delete candidate
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Candidate deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    candidates: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    getById,
    create,
    update,
    remove,
  };
}
