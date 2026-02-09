/**
 * API Client
 *
 * HTTP client for communicating with the control panel API
 */

/// <reference path="../../vite-env.d.ts" />

import type {
  Organization,
  Developer,
  License,
  ApiKey,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  CreateDeveloperInput,
  CreateLicenseInput,
  CreateApiKeyInput,
  PaginatedResponse,
  ApiError,
} from '@/types';

const API_BASE_URL = import.meta.env?.VITE_API_URL || '/api';

/**
 * Generic API error class
 */
export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public errors: ApiError[]
  ) {
    super('API request failed');
    this.name = 'ApiRequestError';
  }
}

/**
 * Parse error response
 */
function parseErrorResponse(response: Response): Promise<ApiError[]> {
  return response.json().then((data) => {
    if (data.errors) {
      return data.errors;
    }
    if (data.message) {
      return [{ message: data.message }];
    }
    return [{ message: 'An unknown error occurred' }];
  });
}

/**
 * Make an API request
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errors = await parseErrorResponse(response);
    throw new ApiRequestError(response.status, errors);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Organizations API
 */
export const organizationsApi = {
  /**
   * List all organizations
   */
  list: () => request<PaginatedResponse<Organization>>('/organizations'),

  /**
   * Get an organization by ID
   */
  get: (id: string) =>
    request<{ data: Organization }>(`/organizations/${id}`),

  /**
   * Get an organization by slug
   */
  getBySlug: (slug: string) =>
    request<{ data: Organization }>(`/organizations/by-slug/${slug}`),

  /**
   * Create a new organization
   */
  create: (data: CreateOrganizationInput) =>
    request<{ data: Organization }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update an organization
   */
  update: (id: string, data: UpdateOrganizationInput) =>
    request<{ data: Organization }>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an organization
   */
  delete: (id: string) =>
    request<void>(`/organizations/${id}`, { method: 'DELETE' }),
};

/**
 * Developers API
 */
export const developersApi = {
  /**
   * List developers by organization
   */
  listByOrganization: (organizationId: string) =>
    request<PaginatedResponse<Developer>>(
      `/organizations/${organizationId}/developers`
    ),

  /**
   * Get a developer by ID
   */
  get: (id: string) =>
    request<{ data: Developer }>(`/developers/${id}`),

  /**
   * Create a new developer
   */
  create: (organizationId: string, data: Omit<CreateDeveloperInput, 'organizationId'>) =>
    request<{ data: Developer }>(`/organizations/${organizationId}/developers`, {
      method: 'POST',
      body: JSON.stringify({ organizationId, ...data }),
    }),

  /**
   * Update a developer
   */
  update: (id: string, data: Partial<Developer>) =>
    request<{ data: Developer }>(`/developers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a developer
   */
  delete: (id: string) =>
    request<void>(`/developers/${id}`, { method: 'DELETE' }),
};

/**
 * Licenses API
 */
export const licensesApi = {
  /**
   * List licenses by organization
   */
  listByOrganization: (organizationId: string) =>
    request<PaginatedResponse<License>>(
      `/organizations/${organizationId}/licenses`
    ),

  /**
   * Get a license by ID
   */
  get: (id: string) => request<{ data: License }>(`/licenses/${id}`),

  /**
   * Create a new license
   */
  create: (organizationId: string, data: Omit<CreateLicenseInput, 'organizationId'>) =>
    request<{ data: License }>(`/organizations/${organizationId}/licenses`, {
      method: 'POST',
      body: JSON.stringify({ organizationId, ...data }),
    }),

  /**
   * Update a license
   */
  update: (id: string, data: Partial<License>) =>
    request<{ data: License }>(`/licenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Delete a license
   */
  delete: (id: string) => request<void>(`/licenses/${id}`, { method: 'DELETE' }),

  /**
   * Activate a license
   */
  activate: (id: string) =>
    request<{ data: License }>(`/licenses/${id}/activate`, { method: 'POST' }),

  /**
   * Suspend a license
   */
  suspend: (id: string) =>
    request<{ data: License }>(`/licenses/${id}/suspend`, { method: 'POST' }),

  /**
   * Revoke a license
   */
  revoke: (id: string) =>
    request<{ data: License }>(`/licenses/${id}/revoke`, { method: 'POST' }),

  /**
   * Add package to license
   */
  addPackage: (id: string, packageType: string) =>
    request<{ data: License }>(`/licenses/${id}/packages`, {
      method: 'POST',
      body: JSON.stringify({ package: packageType }),
    }),

  /**
   * Remove package from license
   */
  removePackage: (id: string, packageType: string) =>
    request<{ data: License }>(`/licenses/${id}/packages/${packageType}`, {
      method: 'DELETE',
    }),

  /**
   * Update capability limits
   */
  updateCapability: (id: string, capability: string, limits: Record<string, unknown>) =>
    request<{ data: License }>(`/licenses/${id}/capabilities/${capability}`, {
      method: 'PUT',
      body: JSON.stringify({ limits }),
    }),

  /**
   * Remove capability from license
   */
  removeCapability: (id: string, capability: string) =>
    request<{ data: License }>(`/licenses/${id}/capabilities/${capability}`, {
      method: 'DELETE',
    }),
};

/**
 * API Keys API
 */
export const apiKeysApi = {
  /**
   * List API keys by organization
   */
  listByOrganization: (organizationId: string) =>
    request<PaginatedResponse<ApiKey>>(
      `/organizations/${organizationId}/api-keys`
    ),

  /**
   * List API keys by developer
   */
  listByDeveloper: (developerId: string) =>
    request<PaginatedResponse<ApiKey>>(`/developers/${developerId}/api-keys`),

  /**
   * List API keys by license
   */
  listByLicense: (licenseId: string) =>
    request<PaginatedResponse<ApiKey>>(`/licenses/${licenseId}/api-keys`),

  /**
   * Get an API key by ID
   */
  get: (id: string) => request<{ data: ApiKey }>(`/api-keys/${id}`),

  /**
   * Create a new API key
   */
  create: (organizationId: string, data: Omit<CreateApiKeyInput, 'organizationId'>) =>
    request<{ data: ApiKey & { rawKey: string } }>(
      `/organizations/${organizationId}/api-keys`,
      {
        method: 'POST',
        body: JSON.stringify({ organizationId, ...data }),
      }
    ),

  /**
   * Update an API key
   */
  update: (id: string, data: Partial<ApiKey>) =>
    request<{ data: ApiKey }>(`/api-keys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  /**
   * Delete an API key
   */
  delete: (id: string) => request<void>(`/api-keys/${id}`, { method: 'DELETE' }),

  /**
   * Revoke an API key
   */
  revoke: (id: string) =>
    request<{ data: ApiKey }>(`/api-keys/${id}/revoke`, { method: 'POST' }),
};

/**
 * Control Panel API
 */
export const controlPanelApi = {
  organizations: organizationsApi,
  developers: developersApi,
  licenses: licensesApi,
  apiKeys: apiKeysApi,
};

export default controlPanelApi;
