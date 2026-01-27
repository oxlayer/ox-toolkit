import authApi from './api/authApi';
import type {
  OnboardingLead,
  UpdateOnboardingLeadInput,
} from '../types';

export const onboardingLeadsService = {
  getAll: async (): Promise<OnboardingLead[]> => {
    const response = await authApi.get('/onboarding-leads');
    return response.data;
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
