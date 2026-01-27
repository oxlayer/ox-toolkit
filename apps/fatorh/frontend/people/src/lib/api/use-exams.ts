import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api-client';
import type { Exam, NewExam } from '@/types/admin';

/**
 * Exams API hook
 * Provides CRUD operations for exams
 */
export function useExams(filters?: { workspaceId?: string }) {
  const queryClient = useQueryClient();

  // List exams (optionally filtered)
  const list = useQuery({
    queryKey: ['exams', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.workspaceId) params.append('workspaceId', filters.workspaceId);
      const queryString = params.toString();
      return api.get<Exam[]>(`/api/exams${queryString ? `?${queryString}` : ''}`);
    },
    enabled: true,
  });

  // Get exam by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['exams', id],
      queryFn: () => api.get<Exam>(`/api/exams/${id}`),
      enabled: !!id,
    });
  };

  // Get exam with questions
  const getWithQuestions = (id: string) => {
    return useQuery({
      queryKey: ['exams', id, 'questions'],
      queryFn: () => api.get<Exam & { questions: unknown[] }>(`/api/exams/${id}/questions`),
      enabled: !!id,
    });
  };

  // Create exam
  const create = useMutation({
    mutationFn: (data: NewExam) => api.post<{ examId: string }>('/api/exams', data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam created successfully');
      return result;
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Update exam
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exam> }) =>
      api.patch<Exam>(`/api/exams/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams', variables.id] });
      toast.success('Exam updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Delete exam
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/exams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Exam deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    exams: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    getById,
    getWithQuestions,
    create,
    update,
    remove,
  };
}
