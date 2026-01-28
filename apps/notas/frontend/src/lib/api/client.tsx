import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../auth';

const API_BASE = import.meta.env.VITE_PUBLIC_API_BASE_URL + '/api';

// ============================================================================
// API CLIENT
// ============================================================================

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(
    statusCode: number,
    message: string,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

// Token provider function - can be set from auth context
let tokenProvider: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(provider: (() => Promise<string | null>) | null) {
  tokenProvider = provider;
}

async function getAuthToken(): Promise<string | null> {
  if (tokenProvider) {
    return await tokenProvider();
  }
  return null;
}

async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    signal,
  } = options;

  console.log('[apiRequest] Starting request:', { method, endpoint, body });

  const token = await getAuthToken();
  console.log('[apiRequest] Token:', token ? 'exists' : 'none');

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;
  console.log('[apiRequest] Full URL:', url);

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  console.log('[apiRequest] Response status:', response.status, response.statusText);

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');

  if (!contentType || !contentType.includes('application/json')) {
    if (!response.ok) {
      throw new ApiError(response.status, 'An error occurred');
    }
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    console.error('[apiRequest] Error response:', data);
    throw new ApiError(
      response.status,
      data.message || data.error || 'An error occurred',
      data
    );
  }

  console.log('[apiRequest] Success response:', data);
  return data;
}

// ============================================================================
// CONVENIENCE METHODS
// ============================================================================

export const api = {
  get: <T,>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T,>(endpoint: string, body: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T,>(endpoint: string, body: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T,>(endpoint: string, options?: Omit<ApiRequestOptions, 'method'>) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiError };

// ============================================================================
// API PROVIDER
// ============================================================================

/**
 * ApiProvider component that connects the API client to the auth context.
 * This must be placed inside AuthProvider to work.
 */
export function ApiProvider({ children }: { children: ReactNode }) {
  const { getAuthToken } = useAuth();
  const getAuthTokenRef = useRef(getAuthToken);

  // Keep the ref updated without triggering effect
  getAuthTokenRef.current = getAuthToken;

  useEffect(() => {
    // Set up a stable token provider that uses the ref
    const tokenProvider = async () => {
      return await getAuthTokenRef.current();
    };

    setAuthTokenProvider(tokenProvider);

    // Clean up when the component unmounts
    return () => {
      setAuthTokenProvider(null);
    };
    // Empty deps - only run on mount/unmount
  }, []);

  return <>{children}</>;
}
