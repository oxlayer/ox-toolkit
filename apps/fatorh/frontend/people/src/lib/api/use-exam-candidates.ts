import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, validateArrayResponse } from '../api-client';
import type { ExamCandidate, NewExamCandidate } from '@/types/admin';

/**
 * Exam Candidates API hook
 * Provides CRUD operations for exam candidates
 */
export function useExamCandidates() {
  const queryClient = useQueryClient();

  // List all exam candidates (can be filtered by exam or user using the methods below)
  const list = useQuery({
    queryKey: ['examCandidates'],
    queryFn: async () => {
      const data = await api.get<ExamCandidate[]>('/api/exam-candidates');
      return validateArrayResponse(data, 'ExamCandidate', 'list exam-candidates').map((c: any) => ({
        ...c,
        invitedAt: new Date(c.invitedAt),
        completedAt: c.completedAt ? new Date(c.completedAt) : null,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      }));
    },
    enabled: true, // Fetches all exam candidates for the current workspace
  });

  // List by exam ID
  const listByExamId = (examId: string) => {
    return useQuery({
      queryKey: ['examCandidates', 'exam', examId],
      queryFn: async () => {
        const data = await api.get<ExamCandidate[]>(`/api/exam-candidates?examId=${examId}`);
        return validateArrayResponse(data, 'ExamCandidate', 'listByExamId exam-candidates').map((c: any) => ({
          ...c,
          invitedAt: new Date(c.invitedAt),
          completedAt: c.completedAt ? new Date(c.completedAt) : null,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
      },
      enabled: !!examId,
    });
  };

  // List by user ID
  const listByUserId = (userId: string) => {
    return useQuery({
      queryKey: ['examCandidates', 'user', userId],
      queryFn: async () => {
        const data = await api.get<ExamCandidate[]>(`/api/exam-candidates?userId=${userId}`);
        return validateArrayResponse(data, 'ExamCandidate', 'listByUserId exam-candidates').map((c: any) => ({
          ...c,
          invitedAt: new Date(c.invitedAt),
          completedAt: c.completedAt ? new Date(c.completedAt) : null,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
      },
      enabled: !!userId,
    });
  };

  // Get exam candidate by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['examCandidates', id],
      queryFn: async () => {
        const data = await api.get<any>(`/api/exam-candidates/${id}`);
        return {
          ...data,
          invitedAt: new Date(data.invitedAt),
          completedAt: data.completedAt ? new Date(data.completedAt) : null,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
        };
      },
      enabled: !!id,
    });
  };

  // Create exam candidate
  const create = useMutation({
    mutationFn: (data: NewExamCandidate) => api.post<ExamCandidate>('/api/exam-candidates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCandidates'] });
      toast.success('Exam candidate created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Remove exam candidate
  const remove = useMutation({
    mutationFn: (id: string) => api.delete<ExamCandidate>(`/api/exam-candidates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examCandidates'] });
      toast.success('Exam candidate removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    examCandidates: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    listByExamId,
    listByUserId,
    getById,
    create,
    remove,
  };
}
