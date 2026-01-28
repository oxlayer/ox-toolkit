import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { establishmentsApi } from '@/lib/api'
import type { EstablishmentType, CreateEstablishmentTypeInput } from '@/types'

/**
 * Query keys for establishment types
 */
export const establishmentTypeKeys = {
  all: ['establishment-types'] as const,
  lists: () => [...establishmentTypeKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...establishmentTypeKeys.lists(), filters] as const,
  details: () => [...establishmentTypeKeys.all, 'detail'] as const,
  detail: (id: number) => [...establishmentTypeKeys.details(), id] as const,
}

/**
 * Hook to fetch all establishment types
 */
export function useEstablishmentTypes(): UseQueryResult<EstablishmentType[]> {
  return useQuery({
    queryKey: establishmentTypeKeys.lists(),
    queryFn: establishmentsApi.getTypes,
  })
}

/**
 * Hook to fetch a single establishment type by ID
 */
export function useEstablishmentType(id: number): UseQueryResult<EstablishmentType> {
  return useQuery({
    queryKey: establishmentTypeKeys.detail(id),
    queryFn: () => establishmentsApi.getTypes().then(types => types.find(t => t.id === id)!),
    enabled: !!id,
  })
}

/**
 * Hook to create an establishment type
 */
export function useCreateEstablishmentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEstablishmentTypeInput) => establishmentsApi.createType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: establishmentTypeKeys.lists() })
    },
  })
}

/**
 * Hook to update an establishment type
 */
export function useUpdateEstablishmentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateEstablishmentTypeInput> }) =>
      establishmentsApi.updateType(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: establishmentTypeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: establishmentTypeKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to delete an establishment type
 */
export function useDeleteEstablishmentType() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => establishmentsApi.deleteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: establishmentTypeKeys.lists() })
    },
  })
}
