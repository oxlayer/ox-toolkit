import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { serviceProvidersApi } from '@/lib/api'
import type {
  ServiceProvider,
  CreateServiceProviderInput,
  ServiceProviderCategory,
  CreateServiceCategoryInput,
  ServiceCatalogItem,
  CreateCatalogItemInput,
} from '@/types'

/**
 * Query keys for service providers
 */
export const serviceProviderKeys = {
  all: ['service-providers'] as const,
  lists: () => [...serviceProviderKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...serviceProviderKeys.lists(), filters] as const,
  details: () => [...serviceProviderKeys.all, 'detail'] as const,
  detail: (id: number) => [...serviceProviderKeys.details(), id] as const,
  categories: () => [...serviceProviderKeys.all, 'categories'] as const,
  catalog: (providerId: number) => [...serviceProviderKeys.all, 'catalog', providerId] as const,
}

/**
 * Hook to fetch all service providers
 */
export function useServiceProviders(): UseQueryResult<ServiceProvider[]> {
  return useQuery({
    queryKey: serviceProviderKeys.lists(),
    queryFn: serviceProvidersApi.getAll,
  })
}

/**
 * Hook to fetch a single service provider by ID
 */
export function useServiceProvider(id: number): UseQueryResult<ServiceProvider> {
  return useQuery({
    queryKey: serviceProviderKeys.detail(id),
    queryFn: () => serviceProvidersApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a service provider
 */
export function useCreateServiceProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateServiceProviderInput) => serviceProvidersApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.lists() })
    },
  })
}

/**
 * Hook to update a service provider
 */
export function useUpdateServiceProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateServiceProviderInput> }) =>
      serviceProvidersApi.update(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to delete a service provider
 */
export function useDeleteServiceProvider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceProvidersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.lists() })
    },
  })
}

/**
 * Hook to toggle service provider availability
 */
export function useToggleServiceProviderAvailability() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, available }: { id: number; available: boolean }) =>
      serviceProvidersApi.update(id, { available }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to fetch service provider categories
 */
export function useServiceCategories(): UseQueryResult<ServiceProviderCategory[]> {
  return useQuery({
    queryKey: serviceProviderKeys.categories(),
    queryFn: serviceProvidersApi.getCategories,
  })
}

/**
 * Hook to create a service category
 */
export function useCreateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateServiceCategoryInput) => serviceProvidersApi.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.categories() })
    },
  })
}

/**
 * Hook to update a service category
 */
export function useUpdateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateServiceCategoryInput> }) =>
      serviceProvidersApi.updateCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.categories() })
    },
  })
}

/**
 * Hook to delete a service category
 */
export function useDeleteServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceProvidersApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceProviderKeys.categories() })
    },
  })
}

/**
 * Hook to fetch service catalog for provider
 */
export function useServiceCatalog(providerId: number): UseQueryResult<ServiceCatalogItem[]> {
  return useQuery({
    queryKey: serviceProviderKeys.catalog(providerId),
    queryFn: () => serviceProvidersApi.getCatalog(providerId),
    enabled: !!providerId,
  })
}

/**
 * Hook to create a catalog item
 */
export function useCreateCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCatalogItemInput) => serviceProvidersApi.createCatalogItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
    },
  })
}

/**
 * Hook to update a catalog item
 */
export function useUpdateCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateCatalogItemInput> }) =>
      serviceProvidersApi.updateCatalogItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
    },
  })
}

/**
 * Hook to delete a catalog item
 */
export function useDeleteCatalogItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => serviceProvidersApi.deleteCatalogItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
    },
  })
}

/**
 * Hook to toggle catalog item active status
 */
export function useToggleCatalogItemActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      serviceProvidersApi.updateCatalogItem(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-providers'] })
    },
  })
}
