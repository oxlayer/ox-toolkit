import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { onboardingLeadsApi } from '@/lib/api'
import type { OnboardingLead, UpdateOnboardingLeadInput, OnboardingLeadStatus } from '@/types'

/**
 * Query keys for onboarding leads
 */
export const onboardingLeadKeys = {
  all: ['onboarding-leads'] as const,
  lists: () => [...onboardingLeadKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...onboardingLeadKeys.lists(), filters] as const,
  details: () => [...onboardingLeadKeys.all, 'detail'] as const,
  detail: (id: number) => [...onboardingLeadKeys.details(), id] as const,
}

/**
 * Hook to fetch all onboarding leads
 */
export function useOnboardingLeads(): UseQueryResult<OnboardingLead[]> {
  return useQuery({
    queryKey: onboardingLeadKeys.lists(),
    queryFn: onboardingLeadsApi.getAll,
  })
}

/**
 * Hook to fetch leads by status
 */
export function useOnboardingLeadsByStatus(status: OnboardingLeadStatus): UseQueryResult<OnboardingLead[]> {
  return useQuery({
    queryKey: onboardingLeadKeys.list({ status }),
    queryFn: () => onboardingLeadsApi.getByStatus(status),
  })
}

/**
 * Hook to fetch a single onboarding lead by ID
 */
export function useOnboardingLead(id: number): UseQueryResult<OnboardingLead> {
  return useQuery({
    queryKey: onboardingLeadKeys.detail(id),
    queryFn: () => onboardingLeadsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to update an onboarding lead
 */
export function useUpdateOnboardingLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateOnboardingLeadInput }) =>
      onboardingLeadsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: onboardingLeadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: onboardingLeadKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to delete an onboarding lead
 */
export function useDeleteOnboardingLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => onboardingLeadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingLeadKeys.lists() })
    },
  })
}

/**
 * Hook to get new leads count
 */
export function useNewLeadsCount(): UseQueryResult<number> {
  const { data: leads } = useOnboardingLeads()
  const count = leads?.filter((l) => l.status === 'new').length ?? 0

  return useQuery({
    queryKey: [...onboardingLeadKeys.lists(), 'new-count'],
    queryFn: () => Promise.resolve(count),
    initialData: count,
  })
}
