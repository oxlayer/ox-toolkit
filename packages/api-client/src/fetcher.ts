/**
 * API Client Configuration
 *
 * Centralized fetcher for the generated API client
 */

import axios, { type AxiosInstance } from 'axios';

// Get API URL from environment or use default
export const API_URL = import.meta.env?.VITE_API_URL ||
                      process.env?.VITE_API_URL ||
                      process.env?.API_URL ||
                      'http://localhost:3001';

// Create axios instance with default config
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Version of this client package
export const CLIENT_VERSION = '0.0.1';

/**
 * Check if the backend API version is compatible with this client
 */
export async function checkApiVersion(): Promise<{
  compatible: boolean;
  apiVersion: string;
  minClientVersion: string;
  message?: string;
}> {
  try {
    const response = await apiClient.get('/version');
    const { version: apiVersion, minClientVersion } = response.data;

    const isCompatible = semver.gte(CLIENT_VERSION, minClientVersion);

    if (!isCompatible) {
      return {
        compatible: false,
        apiVersion,
        minClientVersion,
        message: `API version ${apiVersion} requires client version >= ${minClientVersion}. Current client version: ${CLIENT_VERSION}`,
      };
    }

    return {
      compatible: true,
      apiVersion,
      minClientVersion,
    };
  } catch (error) {
    // If version endpoint doesn't exist or fails, warn but don't fail
    console.warn('Could not check API version:', error);
    return {
      compatible: true,
      apiVersion: 'unknown',
      minClientVersion: '0.0.0',
    };
  }
}

// Simple semver comparison (minimal implementation)
const semver = {
  gte: (version1: string, version2: string): boolean => {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      if (num1 > num2) return true;
      if (num1 < num2) return false;
    }
    return true;
  },
};
