/**
 * API Client Configuration
 *
 * Custom axios instance with base URL and interceptors
 */

import axios from "axios";
import type {
  RequestConfig,
  ResponseConfig,
  ResponseErrorConfig,
} from "@kubb/plugin-client/clients/axios";

// Re-export types for generated hooks
export type { RequestConfig, ResponseConfig, ResponseErrorConfig };

// Default base URL - can be overridden via environment variable or client config
const API_BASE_URL = import.meta.env?.VITE_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_PUBLIC_API_URL is not defined");
}

/**
 * Custom axios instance for API requests
 */
export const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor to add auth token if available
 */
client.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor for error handling
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

/**
 * Default config for the client
 */
let defaultConfig: Partial<RequestConfig> = {};

/**
 * Wrapper function that matches the Kubb client interface
 */
async function fetchImpl<TData, TDataVariables = unknown>(
  config: RequestConfig<TDataVariables>,
): Promise<ResponseConfig<TData>> {
  const mergedConfig = { ...defaultConfig, ...config };
  // Pass all config properties directly to axios
  const response = await client.request<TData>(mergedConfig as any);
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
}

// Type the fetch function to match Kubb's client interface
export type FetchClient = <
  TResponseData,
  _TError = unknown,
  TRequestData = unknown,
>(
  config: RequestConfig<TRequestData>,
) => Promise<ResponseConfig<TResponseData>>;

const fetchFunction: FetchClient & {
  getConfig: () => Partial<RequestConfig>;
  setConfig: (config: Partial<RequestConfig>) => Partial<RequestConfig>;
} = fetchImpl as any;

fetchFunction.getConfig = (): Partial<RequestConfig> => defaultConfig;

fetchFunction.setConfig = (
  config: Partial<RequestConfig>,
): Partial<RequestConfig> => {
  defaultConfig = { ...defaultConfig, ...config };
  return defaultConfig;
};

// Export fetch as the default export (for generated hooks)
export default fetchFunction;

// Also export as named export (for direct imports)
export { fetchFunction as fetch };
