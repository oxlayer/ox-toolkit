import { useAuth } from "../contexts/AuthContext";

// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_BASE_URL;

interface FetchOptions extends RequestInit {
	params?: Record<string, string>;
}

type ApiData = Record<string, unknown>;

export function useApi() {
	const { token, updateToken } = useAuth();

	const fetchWithAuth = async <T>(
		endpoint: string,
		options: FetchOptions = {},
	): Promise<T> => {
		const { params, headers, ...rest } = options;

		// Build URL with query parameters if provided
		let url = `${API_BASE_URL}${endpoint}`;
		if (params) {
			const queryParams = new URLSearchParams();
			for (const [key, value] of Object.entries(params)) {
				if (value === undefined || value === null) {
					continue;
				}
				queryParams.append(key, value);
			}
			url = `${url}?${queryParams.toString()}`;
		}

		// Prepare headers with authentication
		// Don't set Content-Type for FormData - browser will set it with boundary
		const defaultHeaders: HeadersInit = {
			Authorization: `Bearer ${token}`,
		};

		// Only add Content-Type for non-FormData requests
		if (!(rest.body instanceof FormData)) {
			defaultHeaders["Content-Type"] = "application/json";
		}

		const response = await fetch(url, {
			...rest,
			headers: {
				...defaultHeaders,
				...headers,
			},
		});

		// Check for refreshed token in response headers
		const refreshedToken = response.headers.get('X-Refreshed-Token');
		if (refreshedToken) {
			// Update token using AuthContext method (updates both localStorage and state)
			updateToken(refreshedToken);
		}

		// Handle response
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				errorData?.message ||
				`API Error: ${response.status} ${response.statusText}`,
			);
		}

		// Parse response if it has content and is not empty
		if (response.status !== 204) {
			// Check if response has content
			const contentLength = response.headers.get('content-length');
			const hasContent = contentLength && parseInt(contentLength, 10) > 0;

			// For DELETE operations or empty responses, don't try to parse JSON
			if (rest.method === 'DELETE' || !hasContent) {
				return {} as T;
			}

			// Try to parse JSON, but handle empty responses gracefully
			try {
				const text = await response.text();
				if (!text.trim()) {
					return {} as T;
				}
				return JSON.parse(text) as T;
			} catch (error) {
				// If JSON parsing fails but response was successful, return empty object
				console.warn('Failed to parse JSON response, returning empty object:', error);
				return {} as T;
			}
		}

		return {} as T;
	};

	return {
		get: <T>(endpoint: string, options?: FetchOptions) =>
			fetchWithAuth<T>(endpoint, { method: "GET", ...options }),

		post: <T>(endpoint: string, data?: ApiData | FormData, options?: FetchOptions) => {
			const isFormData = data instanceof FormData;
			return fetchWithAuth<T>(endpoint, {
				method: "POST",
				body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
				...options,
			});
		},

		put: <T>(endpoint: string, data?: ApiData, options?: FetchOptions) =>
			fetchWithAuth<T>(endpoint, {
				method: "PUT",
				body: data ? JSON.stringify(data) : undefined,
				...options,
			}),

		patch: <T>(endpoint: string, data?: ApiData, options?: FetchOptions) =>
			fetchWithAuth<T>(endpoint, {
				method: "PATCH",
				body: data ? JSON.stringify(data) : undefined,
				...options,
			}),

		delete: <T>(endpoint: string, options?: FetchOptions) =>
			fetchWithAuth<T>(endpoint, { method: "DELETE", ...options }),
	};
}
