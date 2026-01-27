import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

// Types from backend (keep in sync with backend types)
export enum TimeRange {
  ONE_HOUR = 'one_hour',
  NINE_HOURS = 'nine_hours',
  ONE_DAY = 'one_day',
  THREE_DAYS = 'three_days',
  SEVEN_DAYS = 'seven_days',
  THIRTY_DAYS = 'thirty_days'
}

export enum TraceStatus {
  SUCCESS = 'completed',
  ERROR = 'error',
  WORKING = 'working',
  UNKNOWN = 'unknown'
}

export enum LLMCallStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

// Subscription Info Interface
export interface SubscriptionInfo {
  isFreePlan: boolean;
  hasMoreData: boolean;
  limits: {
    monthlyLimit: number;
    retentionDays: number;
  };
}

export interface TimeSeriesDataPoint {
  time: string; // ISO timestamp
  success: number;
  error: number;
  working: number;
  unknown: number;
  total: number;
}

export interface LLMCallDataPoint {
  time: string;
  success: number;
  error: number;
  total: number;
  successRate: number; // Percentage
}

export interface TraceCountsSummary {
  totalTraces: number;
  successRate: number;
  errorRate: number;
  workingRate: number;
  unknownRate: number;
}

export interface LLMCallSummary {
  totalCalls: number;
  successCount: number;
  errorCount: number;
  overallSuccessRate: number;
  averageCallsPerHour: number;
}

export interface TraceCountsResponse {
  timeRange: TimeRange;
  granularity: string;
  data: TimeSeriesDataPoint[];
  summary: TraceCountsSummary;
  subscription?: SubscriptionInfo;
}

export interface LLMCallRatesResponse {
  timeRange: TimeRange;
  granularity: string;
  data: LLMCallDataPoint[];
  summary: LLMCallSummary;
  subscription?: SubscriptionInfo;
}

export interface TraceCountsFilters {
  timeRange: TimeRange;
  projectId: string;
  includeStatus?: TraceStatus[];
  tags?: string[];
}

export interface LLMCallRatesFilters {
  timeRange: TimeRange;
  projectId: string;
  tags?: string[];
}

export interface LLMCostFilters {
  timeRange: TimeRange;
  projectId: string;
  tags?: string[];
}

export interface UserCostFilters {
  timeRange: TimeRange;
  projectId: string;
  tags?: string[];
}

// LLM Cost Types
export interface LLMCostDataPoint {
  time: string;
  totalCost: number;
  modelCosts: Array<{
    modelName: string;
    totalCost: number;
    inputCost: number;
    outputCost: number;
    tokens: number;
  }>;
}

export interface ModelCostSummary {
  modelName: string;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  totalTokens: number;
  percentage: number;
}

export interface LLMCostSummary {
  totalCost: number;
  totalTokens: number;
  averageCostPerToken: number;
  modelBreakdown: ModelCostSummary[];
}

export interface LLMCostResponse {
  timeRange: TimeRange;
  granularity: string;
  data: LLMCostDataPoint[];
  summary: LLMCostSummary;
  subscription?: SubscriptionInfo;
}

// User Cost Types
export interface UserCostDataPoint {
    userId: string;
    totalCost: number;
    inputCost: number;
    outputCost: number;
    totalTokens: number;
    callCount: number;
    averageCostPerCall: number;
    topModels: Array<{
        modelName: string;
        cost: number;
        percentage: number;
    }>;
}

export interface UserCostSummary {
  totalUsers: number;
  totalCost: number;
  averageCostPerUser: number;
  topUsers: UserCostDataPoint[];
  costDistribution: {
    median: number;
    p95: number;
    p99: number;
  };
}

export interface UserCostResponse {
  timeRange: TimeRange;
  data: UserCostDataPoint[];
  summary: UserCostSummary;
  subscription?: SubscriptionInfo;
}

// Hook for fetching trace counts chart data
export const useTraceCountsChart = (filters: TraceCountsFilters) => {
  const api = useApi();

  return useQuery({
    queryKey: ['trace-counts', filters],
    queryFn: async (): Promise<TraceCountsResponse> => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        projectId: filters.projectId,
        ...(filters.tags?.length && { tags: filters.tags.join(',') }),
        ...(filters.includeStatus?.length && { includeStatus: filters.includeStatus.join(',') }),
      });

      try {
        const response = await api.get<TraceCountsResponse>(`/analytics/trace-counts?${params.toString()}`);
        return response;
      } catch (error: any) {
        // Check for subscription upgrade required error
        if (error?.response?.status === 403 && error?.response?.data?.errorCode === 'SUBSCRIPTION_UPGRADE_REQUIRED') {
          throw {
            ...error,
            isSubscriptionError: true,
            requiredPlan: error.response.data.requiredPlan
          };
        }
        throw error;
      }
    },
    enabled: !!filters.projectId,
    refetchInterval: 60000, // 1 minute
  });
};

export const useLLMCallRatesChart = (filters: LLMCallRatesFilters) => {
  const api = useApi();

  return useQuery({
    queryKey: ['llm-call-rates', filters],
    queryFn: async (): Promise<LLMCallRatesResponse> => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        projectId: filters.projectId,
        ...(filters.tags?.length && { tags: filters.tags.join(',') }),
      });

      try {
        const response = await api.get<LLMCallRatesResponse>(`/analytics/llm-call-rates?${params.toString()}`);
        return response;
      } catch (error: any) {
        // Check for subscription upgrade required error
        if (error?.response?.status === 403 && error?.response?.data?.errorCode === 'SUBSCRIPTION_UPGRADE_REQUIRED') {
          throw {
            ...error,
            isSubscriptionError: true,
            requiredPlan: error.response.data.requiredPlan
          };
        }
        throw error;
      }
    },
    enabled: !!filters.projectId,
    refetchInterval: 60000, // 1 minute
  });
};

export const useLLMCostChart = (filters: LLMCostFilters) => {
  const api = useApi();

  return useQuery({
    queryKey: ['llm-cost', filters],
    queryFn: async (): Promise<LLMCostResponse> => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        projectId: filters.projectId,
        ...(filters.tags?.length && { tags: filters.tags.join(',') }),
      });

      try {
        const response = await api.get<LLMCostResponse>(`/analytics/llm-costs?${params.toString()}`);
        return response;
      } catch (error: any) {
        // Check for subscription upgrade required error
        if (error?.response?.status === 403 && error?.response?.data?.errorCode === 'SUBSCRIPTION_UPGRADE_REQUIRED') {
          throw {
            ...error,
            isSubscriptionError: true,
            requiredPlan: error.response.data.requiredPlan
          };
        }
        throw error;
      }
    },
    enabled: !!filters.projectId,
    refetchInterval: 60000, // 1 minute
  });
};

export const useUserCostChart = (filters: UserCostFilters) => {
  const api = useApi();

  return useQuery({
    queryKey: ['user-cost', filters],
    queryFn: async (): Promise<UserCostResponse> => {
      const params = new URLSearchParams({
        timeRange: filters.timeRange,
        projectId: filters.projectId,
        ...(filters.tags?.length && { tags: filters.tags.join(',') }),
      });

      try {
        const response = await api.get<UserCostResponse>(`/analytics/user-costs?${params.toString()}`);
        return response;
      } catch (error: any) {
        // Check for subscription upgrade required error
        if (error?.response?.status === 403 && error?.response?.data?.errorCode === 'SUBSCRIPTION_UPGRADE_REQUIRED') {
          throw {
            ...error,
            isSubscriptionError: true,
            requiredPlan: error.response.data.requiredPlan
          };
        }
        throw error;
      }
    },
    enabled: !!filters.projectId,
    refetchInterval: 60000, // 1 minute
  });
}; 
