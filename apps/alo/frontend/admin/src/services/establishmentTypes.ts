import authApi from './api/authApi';
import type { EstablishmentType, CreateEstablishmentTypeInput } from '../types';

export const establishmentTypesService = {
  getAll: async (): Promise<EstablishmentType[]> => {
    const response = await authApi.get('/establishment-types');
    return response.data;
  },

  getById: async (id: number): Promise<EstablishmentType> => {
    const response = await authApi.get(`/establishment-types/${id}`);
    return response.data;
  },

  create: async (data: CreateEstablishmentTypeInput): Promise<EstablishmentType> => {
    const response = await authApi.post('/establishment-types', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateEstablishmentTypeInput>): Promise<EstablishmentType> => {
    const response = await authApi.put(`/establishment-types/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/establishment-types/${id}`);
  },
};
