import authApi from './api/authApi';
import type { User, CreateUserInput, DeliveryMan, CreateDeliveryManInput } from '../types';

export const usersService = {
  getAll: async (): Promise<User[]> => {
    const response = await authApi.get('/users');
    return response.data;
  },

  getById: async (id: number): Promise<User> => {
    const response = await authApi.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: CreateUserInput): Promise<User> => {
    const response = await authApi.post('/users', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateUserInput>): Promise<User> => {
    const response = await authApi.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/users/${id}`);
  },
};

export const deliveryMenService = {
  getAll: async (): Promise<DeliveryMan[]> => {
    const response = await authApi.get('/deliverymen');
    return response.data;
  },

  getById: async (id: number): Promise<DeliveryMan> => {
    const response = await authApi.get(`/deliverymen/${id}`);
    return response.data;
  },

  create: async (data: CreateDeliveryManInput): Promise<DeliveryMan> => {
    const response = await authApi.post('/deliverymen', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateDeliveryManInput>): Promise<DeliveryMan> => {
    const response = await authApi.put(`/deliverymen/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/deliverymen/${id}`);
  },
};
