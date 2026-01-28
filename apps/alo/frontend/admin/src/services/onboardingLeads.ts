import { createApiClient } from '../lib/api/client';
import type {
  OnboardingLead,
  UpdateOnboardingLeadInput,
} from '../types';

const authApi = createApiClient('/api');

export const onboardingLeadsService = {
  getAll: async (): Promise<OnboardingLead[]> => {
    const response = await authApi.get('/onboarding-leads');
    return (response.data as any).data;
  },

  getById: async (id: number): Promise<OnboardingLead> => {
    const response = await authApi.get(`/onboarding-leads/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateOnboardingLeadInput): Promise<OnboardingLead> => {
    const response = await authApi.put(`/onboarding-leads/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/onboarding-leads/${id}`);
  },
};
