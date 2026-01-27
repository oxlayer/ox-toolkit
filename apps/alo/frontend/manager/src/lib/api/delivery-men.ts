import { apiClient } from './client'
import type { DeliveryMan, CreateDeliveryManInput } from '@/types'

/**
 * Delivery Men API
 */
export const deliveryMenApi = {
  /**
   * Get all delivery men
   */
  getAll: async (): Promise<DeliveryMan[]> => {
    const { data } = await apiClient.get<DeliveryMan[]>('/deliverymen')
    return data
  },

  /**
   * Get delivery man by ID
   */
  getById: async (id: number): Promise<DeliveryMan> => {
    const { data } = await apiClient.get<DeliveryMan>(`/deliverymen/${id}`)
    return data
  },

  /**
   * Create a new delivery man
   */
  create: async (input: CreateDeliveryManInput): Promise<DeliveryMan> => {
    const { data } = await apiClient.post<DeliveryMan>('/deliverymen', input)
    return data
  },

  /**
   * Update a delivery man
   */
  update: async (id: number, input: Partial<CreateDeliveryManInput>): Promise<DeliveryMan> => {
    const { data } = await apiClient.put<DeliveryMan>(`/deliverymen/${id}`, input)
    return data
  },

  /**
   * Delete a delivery man
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/deliverymen/${id}`)
  },
}
