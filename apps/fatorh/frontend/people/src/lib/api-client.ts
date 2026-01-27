import { getToken, waitForInit } from './keycloak';
import { env } from './env';
import type { Workspace } from '@/types/organization';

// Store current workspace ID for header injection
let currentWorkspaceId: string | null = null;

/**
 * Set the current workspace for API requests
 * This will be included as x-workspace-id header in all subsequent requests
 */
export function setCurrentWorkspace(workspace: Workspace | null): void {
  currentWorkspaceId = workspace?.id || null;
}

/**
 * Get the current workspace ID
 */
export function getCurrentWorkspaceId(): string | null {
  return currentWorkspaceId;
}

/**
 * API Error class for typed error handling
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Base fetch wrapper with auth and workspace headers
 * Automatically injects JWT token and workspace ID headers
 * Handles common error scenarios
 */
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  // Wait for Keycloak to be initialized before making requests
  await waitForInit();

  const token = getToken();
  console.log("token", token)

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add workspace header if set
  if (currentWorkspaceId) {
    headers['x-workspace-id'] = currentWorkspaceId;
  }

  const url = `${env.VITE_PUBLIC_API_BASE_URL}${endpoint}`;

  console.log("headers", headers)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle auth errors
    if (response.status === 401) {
      // Token expired or invalid - trigger logout
      window.dispatchEvent(new CustomEvent('keycloak-logout-required'));
      throw new ApiError(401, 'Authentication required');
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = 'An error occurred';

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('keycloak-logout-required'));
      }

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(response.status, errorMessage);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors
    throw new ApiError(0, 'Network error. Please check your connection.');
  }
}

/**
 * Typed API helpers for common HTTP methods
 */
export const api = {
  get: <T>(endpoint: string) =>
    apiFetch(endpoint).then(async r => {
      const data = await r.json();
      console.log(`[API GET] ${endpoint}:`, data);
      return data as T;
    }),

  post: <T>(endpoint: string, data: unknown) =>
    apiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(async r => {
      const responseData = await r.json();
      console.log(`[API POST] ${endpoint}:`, responseData);
      return responseData as T;
    }),

  patch: <T>(endpoint: string, data: unknown) =>
    apiFetch(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(async r => {
      const responseData = await r.json();
      console.log(`[API PATCH] ${endpoint}:`, responseData);
      return responseData as T;
    }),

  put: <T>(endpoint: string, data: unknown) =>
    apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }).then(async r => {
      const responseData = await r.json();
      console.log(`[API PUT] ${endpoint}:`, responseData);
      return responseData as T;
    }),

  delete: (endpoint: string) =>
    apiFetch(endpoint, { method: 'DELETE' }),
};

/**
 * Validate that response is an array, logging detailed error if not
 * This helps debug when API returns an error object instead of expected array
 */
function validateArrayResponse<T>(data: unknown, expectedType: string, context?: string): T[] {
  if (!Array.isArray(data)) {
    console.error('╔════════════════════════════════════════════════════════════════');
    console.error('║ API RESPONSE VALIDATION ERROR: Expected array, got object');
    console.error('║─────────────────────────────────────────────────────────────────');
    console.error(`║ Expected Type:  ${expectedType}`);
    if (context) console.error(`║ Context:       ${context}`);
    console.error('║─────────────────────────────────────────────────────────────────');
    console.error('║ Received Data:');
    console.error('║', JSON.stringify(data, null, 2));
    console.error('║─────────────────────────────────────────────────────────────────');
    console.error(`║ Stack Trace:   ${new Error().stack}`);
    console.error('╚════════════════════════════════════════════════════════════════');
    return [];
  }
  return data as T[];
}

/**
 * Validate that response is an object with expected data field, logging detailed error if not
 * For responses that wrap data in { data: [...] } or similar
 */
function validateObjectResponse<T>(
  data: unknown,
  dataKey: string,
  expectedType: string,
  context?: string
): T[] {
  console.log(`[validateObjectResponse] Checking for "${dataKey}" in response`, { context, data });

  // If data is already an array, return it (some endpoints return arrays directly)
  if (Array.isArray(data)) {
    return data as T[];
  }

  // If data is an object, try to extract the data field
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;

    if (dataKey in obj) {
      const extracted = obj[dataKey];
      if (Array.isArray(extracted)) {
        return extracted as T[];
      }
      console.error(`[validateObjectResponse] Found "${dataKey}" but it's not an array:`, extracted);
    } else {
      console.error(`[validateObjectResponse] Object doesn't contain "${dataKey}". Available keys:`, Object.keys(obj));
    }
  }

  console.error('╔════════════════════════════════════════════════════════════════');
  console.error('║ API RESPONSE VALIDATION ERROR: Expected object with array data');
  console.error('║─────────────────────────────────────────────────────────────────');
  console.error(`║ Expected:      { ${dataKey}: [${expectedType}] }`);
  if (context) console.error(`║ Context:       ${context}`);
  console.error('║─────────────────────────────────────────────────────────────────');
  console.error('║ Received Data:');
  console.error('║', JSON.stringify(data, null, 2));
  console.error('║─────────────────────────────────────────────────────────────────');
  console.error(`║ Stack Trace:   ${new Error().stack}`);
  console.error('╚════════════════════════════════════════════════════════════════');
  return [];
}

// Export validation helpers for use in hooks
export { validateArrayResponse, validateObjectResponse };
