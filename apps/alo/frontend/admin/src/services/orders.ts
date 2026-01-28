import { createApiClient } from '../lib/api/client';
import type { EstablishmentOrder, UpdateOrderStatusRequest } from '../types';

const orderApi = createApiClient('/api/order');

export const ordersService = {
  // Get all orders (or filter by establishment)
  getAll: async (establishmentId?: number): Promise<EstablishmentOrder[]> => {
    const url = establishmentId
      ? `/establishments/${establishmentId}/orders`
      : '/orders';
    const response = await orderApi.get(url);
    return response.data;
  },

  // Get orders by establishment ID
  getByEstablishmentId: async (establishmentId: number): Promise<EstablishmentOrder[]> => {
    const response = await orderApi.get(`/establishments/${establishmentId}/orders`);
    return response.data;
  },

  // Get orders by phone number
  getByPhone: async (phone: string): Promise<EstablishmentOrder[]> => {
    const response = await orderApi.get(`/orders/phone/${encodeURIComponent(phone)}`);
    return response.data;
  },

  // Get orders by establishment ID and phone
  getByEstablishmentIdAndPhone: async (establishmentId: number, phone: string): Promise<EstablishmentOrder[]> => {
    const response = await orderApi.get(`/establishments/${establishmentId}/orders/phone/${encodeURIComponent(phone)}`);
    return response.data;
  },

  // Update order status
  updateStatus: async (id: string, status: string): Promise<void> => {
    await orderApi.patch(`/orders/${id}/status`, { status });
  },
};
