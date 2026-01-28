/**
 * Main App Component
 */

import { useAuth } from './lib/auth';
import { Button } from './components/button';
import { Card, CardHeader, CardTitle, CardContent } from './components/card';

export function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please log in to access this application.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{{PROJECT_NAME}}</h1>
            <p className="mt-2 text-muted-foreground">
              Welcome, {user?.name || user?.username}!
            </p>
          </div>
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{user?.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">User ID</dt>
                  <dd className="font-mono text-xs">{user?.id || 'N/A'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This template includes React 19, Vite, Tailwind CSS v4, ESLint, and Keycloak authentication.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}