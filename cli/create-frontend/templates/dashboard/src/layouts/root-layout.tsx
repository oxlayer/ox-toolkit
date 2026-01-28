/**
 * Root Layout
 *
 * Wraps all routes with AuthProvider and QueryClientProvider
 */

import { Outlet } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../lib/auth';
import { queryClient } from '../lib/query-client';

function RootLayoutContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="mt-2 text-muted-foreground">
            Please log in to access this application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <nav className="w-64 border-r border-border p-4">
          <h2 className="text-lg font-bold mb-4">{{PROJECT_NAME}}</h2>
          <ul className="space-y-2">
            <li>
              <a href="/" className="block px-3 py-2 rounded hover:bg-muted">
                Home
              </a>
            </li>
            <li>
              <a href="/dashboard" className="block px-3 py-2 rounded hover:bg-muted">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/settings" className="block px-3 py-2 rounded hover:bg-muted">
                Settings
              </a>
            </li>
          </ul>
        </nav>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
