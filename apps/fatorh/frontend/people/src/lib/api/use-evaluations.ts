import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../api-client';
import type { EvaluationResult } from '@/types/admin';

export interface EvaluationResultWithCandidate extends EvaluationResult {
  candidateId: string;
  userId?: string; // For frontend compatibility
}

export interface ListEvaluationResultsResponse {
  results: EvaluationResultWithCandidate[];
  total: number;
}

/**
 * Evaluations API hook
 * Provides operations for evaluating candidates
 */
export function useEvaluations() {
  // Bulk evaluate candidates
  const bulkEvaluate = useMutation({
    mutationFn: (data: { examId: string; cpf: string }) =>
      api.post<EvaluationResult>('/api/evaluations/bulk', data),
    onSuccess: () => {
      toast.success('Evaluation completed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
      throw error;
    },
  });

  // Get evaluation by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['evaluations', id],
      queryFn: () => api.get<EvaluationResult>(`/api/evaluations/${id}`),
      enabled: !!id,
    });
  };

  // Get evaluation by exam and CPF
  const getByExamAndCpf = (examId: string, cpf: string) => {
    return useQuery({
      queryKey: ['evaluations', examId, cpf],
      queryFn: () =>
        api.get<EvaluationResult>(`/api/evaluations/by-exam-cpf?examId=${examId}&cpf=${cpf}`),
      enabled: !!examId && !!cpf,
    });
  };

  // List evaluation results with filters
  const listResults = (filters: {
    examId?: string;
    candidateId?: string;
    assignmentId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters.examId) queryParams.append('examId', filters.examId);
    if (filters.candidateId) queryParams.append('candidateId', filters.candidateId);
    if (filters.assignmentId) queryParams.append('assignmentId', filters.assignmentId);

    const queryString = queryParams.toString();

    return useQuery({
      queryKey: ['evaluation-results', filters],
      queryFn: () =>
        api.get<ListEvaluationResultsResponse>(`/api/evaluations/results${queryString ? `?${queryString}` : ''}`),
      enabled: !!(filters.examId || filters.candidateId || filters.assignmentId),
    });
  };

  return {
    bulkEvaluate,
    getById,
    getByExamAndCpf,
    listResults,
  };
}
