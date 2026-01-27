import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { usersApi, deliveryMenApi } from '@/lib/api'
import type { User, CreateUserInput, DeliveryMan, CreateDeliveryManInput } from '@/types'

/**
 * Query keys for users
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
}

/**
 * Query keys for delivery men
 */
export const deliveryManKeys = {
  all: ['delivery-men'] as const,
  lists: () => [...deliveryManKeys.all, 'list'] as const,
  details: () => [...deliveryManKeys.all, 'detail'] as const,
  detail: (id: number) => [...deliveryManKeys.details(), id] as const,
}

/**
 * Hook to fetch all users
 */
export function useUsers(): UseQueryResult<User[]> {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: usersApi.getAll,
  })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: number): UseQueryResult<User> {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateUserInput> }) =>
      usersApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Hook to fetch all delivery men
 */
export function useDeliveryMen(): UseQueryResult<DeliveryMan[]> {
  return useQuery({
    queryKey: deliveryManKeys.lists(),
    queryFn: deliveryMenApi.getAll,
  })
}

/**
 * Hook to fetch a single delivery man by ID
 */
export function useDeliveryMan(id: number): UseQueryResult<DeliveryMan> {
  return useQuery({
    queryKey: deliveryManKeys.detail(id),
    queryFn: () => deliveryMenApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a delivery man
 */
export function useCreateDeliveryMan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateDeliveryManInput) => deliveryMenApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryManKeys.lists() })
    },
  })
}

/**
 * Hook to update a delivery man
 */
export function useUpdateDeliveryMan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateDeliveryManInput> }) =>
      deliveryMenApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: deliveryManKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deliveryManKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to delete a delivery man
 */
export function useDeleteDeliveryMan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deliveryMenApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deliveryManKeys.lists() })
    },
  })
}
