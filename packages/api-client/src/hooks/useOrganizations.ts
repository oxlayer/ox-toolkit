/**
 * React Query hooks for Organizations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../fetcher.js';

// Types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: 'starter' | 'professional' | 'enterprise' | 'custom';
  maxDevelopers: number;
  maxProjects: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  tier?: 'starter' | 'professional' | 'enterprise' | 'custom';
  maxDevelopers?: number;
  maxProjects?: number;
}

export interface UpdateOrganizationInput {
  name?: string;
  tier?: 'starter' | 'professional' | 'enterprise' | 'custom';
  maxDevelopers?: number;
  maxProjects?: number;
}

// Query keys
export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: string) => [...organizationKeys.lists(), { filters }] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
};

// Hooks
export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Organization[]; meta?: any }>('/v1/organizations');
      return response.data;
    },
  });
}

export function useOrganization(id: string) {
  return useQuery({
    queryKey: organizationKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Organization }>(`/v1/organizations/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizationInput) => {
      const response = await apiClient.post<{ data: Organization }>('/v1/organizations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateOrganizationInput }) => {
      const response = await apiClient.patch<{ data: Organization }>(`/v1/organizations/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/v1/organizations/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
}
