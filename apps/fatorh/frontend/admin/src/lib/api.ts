import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE_URL || '/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // Get token from localStorage (set by Keycloak)
  const token = localStorage.getItem('kc_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API types
export interface OwnerUser {
  email: string;
  firstName: string;
  lastName: string;
  temporaryPassword: string;
}

export interface Workspace {
  id?: string; // Auto-generated if not provided
  name: string; // Normalized name (lowercase alphanumeric with hyphens)
  alias: string; // Display name (original name without normalization)
  domainAliases?: string[];
}

export interface ProvisionTenantRequest {
  realmId: string;
  displayName: string;
  owner: OwnerUser;
  workspaces: Workspace[];
}

export interface ProvisionTenantResponse {
  success: boolean;
  message: string;
  results: {
    realm: any;
    databases: Array<{
      workspaceId: string;
      database: string;
      status: string;
      migrations?: string;
      error?: string;
      migrationError?: string;
    }>;
  };
}

export interface TenantDatabase {
  database: string;
  realmId: string;
  workspaceId: string;
  workspaceName: string;
  dbUser?: string; // Tenant database user (without password for security)
  enabled: boolean;
  status: string;
}

export interface RotateCredentialsRequest {
  workspaceId: string;
  newPassword?: string; // If not provided, password will be auto-generated
}

export interface RotateCredentialsResponse {
  success: boolean;
  message: string;
  workspaceId: string;
  dbUser: string;
  passwordGenerated: boolean; // true if auto-generated, false if provided by user
}

export interface TenantOrganization {
  id: string;
  realmId: string;
  workspaceId: string;
  workspaceName: string;
  keycloakOrganizationId?: string;
  name: string;
  alias?: string;
  ownerAssigned: boolean;
  ownerUsername?: string;
  status: 'pending' | 'created' | 'failed';
  lastError?: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  realmId: string;
  realmName: string;
  displayName: string;
  enabled: boolean;
  ownerId: string;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  databases: TenantDatabase[];
  organizations?: TenantOrganization[];
  provisionedAt: string;
  settings?: {
    organizationsEnabled?: boolean;
  };
}

export interface ListTenantsResponse {
  success: boolean;
  tenants: Tenant[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  roles: string[];
}

export interface ListUsersResponse {
  success: boolean;
  realm: string;
  realmExists: boolean;
  users: User[];
}

export interface ProvisionOrganizationRequest {
  name: string;
  domainAliases?: string[];
  rootManagerEmail: string;
  rootManagerFirstName: string;
  rootManagerLastName: string;
  rootManagerPassword: string;
}

export interface ProvisionOrganizationResponse {
  success: boolean;
  message: string;
  organization: {
    id: string;
    keycloakId?: string;
    name: string;
    realmId: string;
    realmName: string;
    databaseName: string;
    domainAliases: string[];
    rootManagerEmail: string;
  };
}

// API functions
export async function provisionTenant(data: ProvisionTenantRequest): Promise<ProvisionTenantResponse> {
  const response = await api.post('/admin/tenants/provision', data);
  return response.data;
}

export async function listTenants(): Promise<ListTenantsResponse> {
  const response = await api.get('/admin/tenants');
  return response.data;
}

export async function getTenant(realmId: string): Promise<{ success: boolean; tenant: Tenant }> {
  const response = await api.get(`/admin/tenants/${realmId}`);
  return response.data;
}

export async function createDatabase(realm: string, workspaceId: string): Promise<any> {
  const response = await api.post('/admin/databases/create', { realm, workspaceId });
  return response.data;
}

export async function migrateDatabase(realm: string, workspaceId: string): Promise<any> {
  const response = await api.post('/admin/databases/migrate', { realm, workspaceId });
  return response.data;
}

export async function listUsers(realm: string): Promise<ListUsersResponse> {
  const response = await api.get('/admin/users', { params: { realm } });
  return response.data;
}

export async function provisionOrganization(data: ProvisionOrganizationRequest): Promise<ProvisionOrganizationResponse> {
  const response = await api.post('/organizations/provision', data);
  return response.data;
}

export interface RetryOrganizationResponse {
  success: boolean;
  message: string;
  results: {
    attempted: number;
    succeeded: Array<{
      id: string;
      name: string;
      keycloakOrganizationId: string;
    }>;
    failed: Array<{
      id: string;
      name: string;
      error: string;
    }>;
  };
}

export async function retryOrganizations(realmId: string, workspaceId?: string): Promise<RetryOrganizationResponse> {
  const response = await api.post(`/admin/tenants/${realmId}/organizations/retry`, workspaceId ? { workspaceId } : {});
  return response.data;
}

// Delete and recreate functions
export async function deleteTenant(realmId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/admin/tenants/${realmId}`);
  return response.data;
}

export async function deleteRealm(realmId: string): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`/admin/tenants/${realmId}/realm`);
  return response.data;
}

export async function deleteDatabase(realmId: string, workspaceId?: string): Promise<{ success: boolean; deleted: Array<{ workspaceId: string; database: string }> }> {
  const response = await api.delete('/admin/databases', { data: { realmId, workspaceId } });
  return response.data;
}

export async function recreateRealm(realmId: string): Promise<{ success: boolean; message: string; realm: any }> {
  const response = await api.post(`/admin/tenants/${realmId}/realm/recreate`);
  return response.data;
}

export async function recreateDatabase(realmId: string, workspaceId: string): Promise<{ success: boolean; message: string; database: string; status: string }> {
  const response = await api.post('/admin/databases/recreate', { realmId, workspaceId });
  return response.data;
}

export async function rotateCredentials(data: RotateCredentialsRequest): Promise<RotateCredentialsResponse> {
  const response = await api.post('/admin/databases/rotate-credentials', data);
  return response.data;
}
