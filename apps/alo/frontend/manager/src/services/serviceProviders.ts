import authApi from './api/authApi';
import type {
  ServiceProvider,
  CreateServiceProviderInput,
  ServiceProviderCategory,
  CreateServiceCategoryInput,
  ServiceCatalogItem,
  CreateCatalogItemInput,
  ServiceProviderOrder,
} from '../types';

// Categories
export const serviceCategoriesService = {
  getAll: async (): Promise<ServiceProviderCategory[]> => {
    const response = await authApi.get('/service-categories');
    return response.data;
  },

  getById: async (id: number): Promise<ServiceProviderCategory> => {
    const response = await authApi.get(`/service-categories/${id}`);
    return response.data;
  },

  create: async (data: CreateServiceCategoryInput): Promise<ServiceProviderCategory> => {
    const response = await authApi.post('/service-categories', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateServiceCategoryInput>): Promise<ServiceProviderCategory> => {
    const response = await authApi.put(`/service-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/service-categories/${id}`);
  },
};

// Service Providers
export const serviceProvidersService = {
  getAll: async (): Promise<ServiceProvider[]> => {
    const response = await authApi.get('/service-providers');
    return response.data;
  },

  getById: async (id: number): Promise<ServiceProvider> => {
    const response = await authApi.get(`/service-providers/${id}`);
    return response.data;
  },

  create: async (data: CreateServiceProviderInput): Promise<ServiceProvider> => {
    const response = await authApi.post('/service-providers', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateServiceProviderInput>): Promise<ServiceProvider> => {
    const response = await authApi.put(`/service-providers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/service-providers/${id}`);
  },

  toggleAvailability: async (id: number, available: boolean): Promise<ServiceProvider> => {
    const response = await authApi.patch(`/service-providers/${id}/availability`, { available });
    return response.data;
  },
};

// Service Catalog Items
export const serviceCatalogService = {
  getByProvider: async (providerId: number): Promise<ServiceCatalogItem[]> => {
    const response = await authApi.get(`/service-providers/${providerId}/catalog`);
    return response.data;
  },

  getById: async (id: number): Promise<ServiceCatalogItem> => {
    const response = await authApi.get(`/service-catalog/${id}`);
    return response.data;
  },

  create: async (data: CreateCatalogItemInput): Promise<ServiceCatalogItem> => {
    const response = await authApi.post('/service-catalog', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateCatalogItemInput>): Promise<ServiceCatalogItem> => {
    const response = await authApi.put(`/service-catalog/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/service-catalog/${id}`);
  },

  toggleActive: async (id: number, active: boolean): Promise<ServiceCatalogItem> => {
    const response = await authApi.patch(`/service-catalog/${id}/active`, { active });
    return response.data;
  },
};

// Service Provider Orders
export const serviceProviderOrdersService = {
  getAll: async (providerId?: number): Promise<ServiceProviderOrder[]> => {
    const url = providerId ? `/service-orders?provider_id=${providerId}` : '/service-orders';
    const response = await authApi.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<ServiceProviderOrder> => {
    const response = await authApi.get(`/service-orders/${id}`);
    return response.data;
  },

  updateStatus: async (id: number, status: string): Promise<ServiceProviderOrder> => {
    const response = await authApi.patch(`/service-orders/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await authApi.delete(`/service-orders/${id}`);
  },
};
