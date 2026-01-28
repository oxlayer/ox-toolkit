import axios from 'axios'
import { getToken, waitForInit, login } from './keycloak'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

/**
 * Create axios instance with base configuration
 */
export function createApiClient(basePath: string = '') {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${basePath}`,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Add auth token to requests
  client.interceptors.request.use(async (config) => {
    await waitForInit()

    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Handle response errors
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        console.log('[API] 401 Unauthorized, triggering Keycloak login...')
        await waitForInit()
        await login()
      }
      return Promise.reject(error)
    }
  )

  return client
}

/**
 * Default API client
 */
export const apiClient = createApiClient()

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Typed API helpers
 */
export const api = {
  get: <T>(endpoint: string) =>
    apiClient.get<T>(endpoint).then((r) => r.data),

  post: <T>(endpoint: string, data: unknown) =>
    apiClient.post<T>(endpoint, data).then((r) => r.data),

  patch: <T>(endpoint: string, data: unknown) =>
    apiClient.patch<T>(endpoint, data).then((r) => r.data),

  put: <T>(endpoint: string, data: unknown) =>
    apiClient.put<T>(endpoint, data).then((r) => r.data),

  delete: (endpoint: string) =>
    apiClient.delete(endpoint).then((r) => r.data),
}
