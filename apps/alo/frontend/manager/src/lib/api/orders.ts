import { apiClient } from './client'
import type { EstablishmentOrder, UpdateOrderStatusRequest } from '@/types'

/**
 * Orders API
 */
export const ordersApi = {
  /**
   * Get all orders
   */
  getAll: async (): Promise<EstablishmentOrder[]> => {
    const { data } = await apiClient.get<EstablishmentOrder[]>('/orders')
    return data
  },

  /**
   * Get order by ID
   */
  getById: async (id: string): Promise<EstablishmentOrder> => {
    const { data } = await apiClient.get<EstablishmentOrder>(`/orders/${id}`)
    return data
  },

  /**
   * Get orders by establishment
   */
  getByEstablishment: async (establishmentId: number): Promise<EstablishmentOrder[]> => {
    const { data } = await apiClient.get<EstablishmentOrder[]>(`/establishments/${establishmentId}/orders`)
    return data
  },

  /**
   * Update order status
   */
  updateStatus: async (input: UpdateOrderStatusRequest): Promise<EstablishmentOrder> => {
    const { data } = await apiClient.patch<EstablishmentOrder>(`/orders/${input.id}`, { status: input.status })
    return data
  },

  /**
   * Delete an order
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/orders/${id}`)
  },
}
