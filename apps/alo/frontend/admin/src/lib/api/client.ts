import axios from 'axios'
import { getToken, waitForInit, login } from '../keycloak'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:80'

/**
 * Create an axios instance with base configuration
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
    // Wait for Keycloak to be initialized before making requests
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
        // Token expired or invalid - trigger Keycloak login redirect
        console.log('[API] 401 Unauthorized, triggering Keycloak login...')
        // Wait for Keycloak initialization before calling login
        await waitForInit()
        await login()
      }
      return Promise.reject(error)
    }
  )

  return client
}

/**
 * Default API client for manager portal
 */
export const apiClient = createApiClient('/api')
