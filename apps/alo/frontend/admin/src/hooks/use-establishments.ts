import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { establishmentsApi } from '@/lib/api'
import type { Establishment, CreateEstablishmentInput } from '@/types'

/**
 * Query keys for establishments
 */
export const establishmentKeys = {
  all: ['establishments'] as const,
  lists: () => [...establishmentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...establishmentKeys.lists(), filters] as const,
  details: () => [...establishmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...establishmentKeys.details(), id] as const,
}

/**
 * Hook to fetch all establishments
 */
export function useEstablishments(): UseQueryResult<Establishment[]> {
  return useQuery({
    queryKey: establishmentKeys.lists(),
    queryFn: establishmentsApi.getAll,
  })
}

/**
 * Hook to fetch a single establishment by ID
 */
export function useEstablishment(id: number): UseQueryResult<Establishment> {
  return useQuery({
    queryKey: establishmentKeys.detail(id),
    queryFn: () => establishmentsApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create an establishment
 */
export function useCreateEstablishment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEstablishmentInput) => establishmentsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: establishmentKeys.lists() })
    },
  })
}

/**
 * Hook to update an establishment
 */
export function useUpdateEstablishment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateEstablishmentInput> }) =>
      establishmentsApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: establishmentKeys.lists() })
      queryClient.invalidateQueries({ queryKey: establishmentKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to delete an establishment
 */
export function useDeleteEstablishment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => establishmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: establishmentKeys.lists() })
    },
  })
}
