/**
 * Index Route
 */

import { createRoute } from 'react-router';

export const IndexRoute = createRoute({
  getParentRoute: () => import('../routes'),
  path: '/',
  component: Index,
});

function Index() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to {{PROJECT_NAME}}</h1>
      <p className="mt-4 text-muted-foreground">
        This is the home page. Navigate using the sidebar.
      </p>
    </div>
  );
}
