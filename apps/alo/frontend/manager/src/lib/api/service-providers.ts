import { apiClient } from './client'
import type {
  ServiceProvider,
  CreateServiceProviderInput,
  ServiceProviderCategory,
  CreateServiceCategoryInput,
  ServiceCatalogItem,
  CreateCatalogItemInput,
  ServiceProviderOrder,
} from '@/types'

/**
 * Service Providers API
 */
export const serviceProvidersApi = {
  /**
   * Get all service providers
   */
  getAll: async (): Promise<ServiceProvider[]> => {
    const { data } = await apiClient.get<ServiceProvider[]>('/service-providers')
    return data
  },

  /**
   * Get service provider by ID
   */
  getById: async (id: number): Promise<ServiceProvider> => {
    const { data } = await apiClient.get<ServiceProvider>(`/service-providers/${id}`)
    return data
  },

  /**
   * Create a new service provider
   */
  create: async (input: CreateServiceProviderInput): Promise<ServiceProvider> => {
    const { data } = await apiClient.post<ServiceProvider>('/service-providers', input)
    return data
  },

  /**
   * Update a service provider
   */
  update: async (id: number, input: Partial<CreateServiceProviderInput>): Promise<ServiceProvider> => {
    const { data } = await apiClient.put<ServiceProvider>(`/service-providers/${id}`, input)
    return data
  },

  /**
   * Delete a service provider
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/service-providers/${id}`)
  },

  /**
   * Get service provider categories
   */
  getCategories: async (): Promise<ServiceProviderCategory[]> => {
    const { data } = await apiClient.get<ServiceProviderCategory[]>('/service-categories')
    return data
  },

  /**
   * Create service category
   */
  createCategory: async (input: CreateServiceCategoryInput): Promise<ServiceProviderCategory> => {
    const { data } = await apiClient.post<ServiceProviderCategory>('/service-categories', input)
    return data
  },

  /**
   * Update service category
   */
  updateCategory: async (id: number, input: Partial<CreateServiceCategoryInput>): Promise<ServiceProviderCategory> => {
    const { data } = await apiClient.put<ServiceProviderCategory>(`/service-categories/${id}`, input)
    return data
  },

  /**
   * Delete service category
   */
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/service-categories/${id}`)
  },

  /**
   * Get service catalog for provider
   */
  getCatalog: async (providerId: number): Promise<ServiceCatalogItem[]> => {
    const { data } = await apiClient.get<ServiceCatalogItem[]>(`/service-providers/${providerId}/catalog`)
    return data
  },

  /**
   * Create catalog item
   */
  createCatalogItem: async (input: CreateCatalogItemInput): Promise<ServiceCatalogItem> => {
    const { data } = await apiClient.post<ServiceCatalogItem>('/catalog-items', input)
    return data
  },

  /**
   * Update catalog item
   */
  updateCatalogItem: async (id: number, input: Partial<CreateCatalogItemInput>): Promise<ServiceCatalogItem> => {
    const { data } = await apiClient.put<ServiceCatalogItem>(`/catalog-items/${id}`, input)
    return data
  },

  /**
   * Delete catalog item
   */
  deleteCatalogItem: async (id: number): Promise<void> => {
    await apiClient.delete(`/catalog-items/${id}`)
  },

  /**
   * Get orders for service provider
   */
  getOrders: async (providerId: number): Promise<ServiceProviderOrder[]> => {
    const { data } = await apiClient.get<ServiceProviderOrder[]>(`/service-providers/${providerId}/orders`)
    return data
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: number, status: ServiceProviderOrder['status']): Promise<ServiceProviderOrder> => {
    const { data } = await apiClient.patch<ServiceProviderOrder>(`/service-provider-orders/${orderId}`, { status })
    return data
  },
}
