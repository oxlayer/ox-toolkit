/**
 * API Client Context Provider
 *
 * Provides the React Query client to the app
 */

import { QueryClient } from "@tanstack/react-query";
import { createContext, useContext } from "react";

const ApiClientContext = createContext<QueryClient | null>(null);

export interface ApiClientProviderProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

export function ApiClientProvider({
  children,
  queryClient,
}: ApiClientProviderProps) {
  return (
    <ApiClientContext.Provider value={queryClient}>
      {children}
    </ApiClientContext.Provider>
  );
}

export function useApiClient() {
  const context = useContext(ApiClientContext);
  if (!context) {
    throw new Error("useApiClient must be used within ApiClientProvider");
  }
  return context;
}
