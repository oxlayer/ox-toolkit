import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { ordersApi, serviceProvidersApi, establishmentsApi } from '@/lib/api'
import type { EstablishmentOrder, ServiceProvider, Establishment } from '@/types'

/**
 * Query keys for orders
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
}

/**
 * Hook to fetch all orders
 */
export function useOrders(): UseQueryResult<EstablishmentOrder[]> {
  return useQuery({
    queryKey: orderKeys.lists(),
    queryFn: ordersApi.getAll,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  })
}

/**
 * Hook to fetch orders by establishment
 */
export function useOrdersByEstablishment(establishmentId: number): UseQueryResult<EstablishmentOrder[]> {
  return useQuery({
    queryKey: ['orders', 'establishment', establishmentId],
    queryFn: () => ordersApi.getByEstablishment(establishmentId),
    enabled: !!establishmentId,
    refetchInterval: 10000,
  })
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string): UseQueryResult<EstablishmentOrder> {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to fetch service provider orders
 */
export function useServiceProviderOrders(providerId?: number): UseQueryResult<EstablishmentOrder[]> {
  return useQuery({
    queryKey: ['service-provider-orders', providerId],
    queryFn: () => providerId ? serviceProvidersApi.getOrders(providerId) : Promise.resolve([]),
    refetchInterval: 10000,
  })
}

/**
 * Hook to update order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus({ id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ['service-provider-orders'] })
    },
  })
}

/**
 * Hook to delete an order
 */
export function useDeleteOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ordersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
    },
  })
}

/**
 * Hook to fetch orders with filters (for dashboard)
 */
export function useOrdersDashboard() {
  const establishments = useQuery({
    queryKey: ['establishments'],
    queryFn: establishmentsApi.getAll,
  })

  const providers = useQuery({
    queryKey: ['service-providers'],
    queryFn: serviceProvidersApi.getAll,
  })

  return {
    establishments: establishments.data ?? [],
    providers: providers.data ?? [],
  }
}
