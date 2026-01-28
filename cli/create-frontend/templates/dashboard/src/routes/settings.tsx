/**
 * Settings Route
 */

import { createRoute } from 'react-router';
import { Button } from '../../components/button';
import { useAuth } from '../../lib/auth';

export const SettingsRoute = createRoute({
  getParentRoute: () => import('../routes'),
  path: '/settings',
  component: Settings,
});

function Settings() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="max-w-md">
        <div className="bg-surface-raised rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">User Profile</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd>{user?.name || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd>{user?.email || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Username</dt>
              <dd>{user?.username || 'N/A'}</dd>
            </div>
          </dl>
          <div className="mt-6 pt-6 border-t border-border">
            <Button variant="destructive" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
