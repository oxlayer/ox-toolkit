import authApi from './api/authApi';
import type { Establishment, CreateEstablishmentInput } from '../types';

export const establishmentsService = {
  getAll: async (): Promise<Establishment[]> => {
    const response = await authApi.get('/establishments');
    return response.data;
  },

  getById: async (id: number): Promise<Establishment> => {
    const response = await authApi.get(`/establishments/${id}`);
    return response.data;
  },

  create: async (data: CreateEstablishmentInput): Promise<Establishment> => {
    const response = await authApi.post('/establishments', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateEstablishmentInput>): Promise<Establishment> => {
    const response = await authApi.put(`/establishments/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/establishments/${id}`);
  },
};
