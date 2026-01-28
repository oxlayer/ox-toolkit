import { apiClient } from './client'
import type {
  OnboardingLead,
  UpdateOnboardingLeadInput,
  OnboardingLeadStatus,
  OnboardingLeadUserType,
} from '@/types'

/**
 * Onboarding Leads API
 */
export const onboardingLeadsApi = {
  /**
   * Get all onboarding leads
   */
  getAll: async (): Promise<OnboardingLead[]> => {
    const { data } = await apiClient.get<OnboardingLead[]>('/onboarding-leads')
    return data
  },

  /**
   * Get onboarding lead by ID
   */
  getById: async (id: number): Promise<OnboardingLead> => {
    const { data } = await apiClient.get<OnboardingLead>(`/onboarding-leads/${id}`)
    return data
  },

  /**
   * Get leads by status
   */
  getByStatus: async (status: OnboardingLeadStatus): Promise<OnboardingLead[]> => {
    const { data } = await apiClient.get<OnboardingLead[]>('/onboarding-leads', {
      params: { status },
    })
    return data
  },

  /**
   * Get leads by user type
   */
  getByUserType: async (userType: OnboardingLeadUserType): Promise<OnboardingLead[]> => {
    const { data } = await apiClient.get<OnboardingLead[]>('/onboarding-leads', {
      params: { user_type: userType },
    })
    return data
  },

  /**
   * Update onboarding lead
   */
  update: async (id: number, input: UpdateOnboardingLeadInput): Promise<OnboardingLead> => {
    const { data } = await apiClient.put<OnboardingLead>(`/onboarding-leads/${id}`, input)
    return data
  },

  /**
   * Delete onboarding lead
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/onboarding-leads/${id}`)
  },
}
