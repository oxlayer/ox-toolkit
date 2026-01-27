import { useQuery } from '@tanstack/react-query';
import { api } from '../api-client';

export interface Answer {
  id: string;
  assignmentId: string;
  candidateId: string;
  examId: string;
  questionId: string;
  s3Url: string;
  duration: number;
  contentType: string;
  fileSize: number;
  isValid: boolean;
  transcription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListAnswersResponse {
  answers: Answer[];
  total: number;
  limit?: number;
  offset?: number;
}

/**
 * Answers API hook
 * Provides operations for fetching answer data
 */
export function useAnswers() {
  // List answers with filters
  const list = (filters: {
    examId?: string;
    candidateId?: string;
    assignmentId?: string;
    questionId?: string;
    isValid?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters.examId) queryParams.append('examId', filters.examId);
    if (filters.candidateId) queryParams.append('candidateId', filters.candidateId);
    if (filters.assignmentId) queryParams.append('assignmentId', filters.assignmentId);
    if (filters.questionId) queryParams.append('questionId', filters.questionId);
    if (filters.isValid !== undefined) queryParams.append('isValid', String(filters.isValid));
    if (filters.limit) queryParams.append('limit', String(filters.limit));
    if (filters.offset) queryParams.append('offset', String(filters.offset));

    const queryString = queryParams.toString();

    return useQuery({
      queryKey: ['answers', filters],
      queryFn: () => api.get<ListAnswersResponse>(`/api/answers${queryString ? `?${queryString}` : ''}`),
      enabled: true,
    });
  };

  // Get answer by ID
  const getById = (id: string) => {
    return useQuery({
      queryKey: ['answers', id],
      queryFn: () => api.get<Answer>(`/api/answers/${id}`),
      enabled: !!id,
    });
  };

  return {
    list,
    getById,
  };
}
