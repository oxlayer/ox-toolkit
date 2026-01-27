import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api-client';
import type { Question, NewQuestion } from '@/types/admin';

/**
 * Map backend question format to frontend format
 * Backend: type = presentation format (text/audio), weight = category (technical/behavioral/situational), priority = order
 * Frontend: type = category, weight = difficulty (high/medium/low), order = priority
 */
function mapBackendToFrontend(question: any): Question {
  return {
    id: question.id,
    examId: question.examId,
    text: question.text,
    type: question.weight || 'technical', // Backend 'weight' is the category
    weight: 'medium', // Default to medium since backend doesn't track difficulty
    order: question.priority, // Backend 'priority' is the order
    createdAt: new Date(question.createdAt),
    updatedAt: new Date(question.updatedAt),
  };
}

/**
 * Questions API hook
 * Provides CRUD operations for questions
 */
export function useQuestions(examId?: string) {
  const queryClient = useQueryClient();

  // List questions (optionally filtered by exam)
  const list = useQuery({
    queryKey: ['questions', examId],
    queryFn: async () => {
      if (examId) {
        const data = await api.get<any[]>('/api/questions', { params: { examId } });
        return data.map(mapBackendToFrontend);
      }
      const data = await api.get<any[]>('/api/questions');
      return data.map(mapBackendToFrontend);
    },
    enabled: true,
  });

  // Get question by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['questions', id],
      queryFn: async () => {
        const data = await api.get<any>(`/api/questions/${id}`);
        return mapBackendToFrontend(data);
      },
      enabled: !!id,
    });
  };

  // Create question
  const create = useMutation({
    mutationFn: (data: NewQuestion) => {
      // Map frontend fields to backend format:
      // Frontend 'type' (category: technical/behavioral/situational) → Backend 'weight'
      // Frontend 'order' → Backend 'priority'
      // Backend 'type' is presentation format (text/audio) - default to 'text'
      const payload = {
        examId: data.examId,
        text: data.text,
        type: 'text' as const, // Presentation format - default to text
        weight: data.type, // Frontend 'type' is the category
        priority: data.order, // Frontend 'order' maps to backend 'priority'
      };
      return api.post<Question>('/api/questions', payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Update question
  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Question> }) => {
      // Map frontend fields to backend format
      const payload: any = {};
      if (data.text !== undefined) payload.text = data.text;
      if (data.type !== undefined) payload.weight = data.type; // Frontend 'type' maps to backend 'weight'
      if (data.order !== undefined) payload.priority = data.order; // Frontend 'order' maps to backend 'priority'
      // Note: Frontend 'weight' (difficulty) is not sent to backend as it's not tracked there
      return api.patch<Question>(`/api/questions/${id}`, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions', variables.id] });
      toast.success('Question updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Delete question
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Question deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  return {
    questions: list.data || [],
    isLoading: list.isLoading,
    error: list.error,
    refetch: list.refetch,
    getById,
    create,
    update,
    remove,
  };
}
