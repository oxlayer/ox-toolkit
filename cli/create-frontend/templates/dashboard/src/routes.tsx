/**
 * App Routes
 *
 * React Router v7 configuration with nested routes
 */

import { createRouter, createRoute, createRootRoute } from 'react-router';
import { IndexRoute } from './routes/index';
import { DashboardRoute } from './routes/dashboard';
import { SettingsRoute } from './routes/settings';
import { RootLayout } from './layouts/root-layout';

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute(IndexRoute);
const dashboardRoute = createRoute(DashboardRoute);
const settingsRoute = createRoute(SettingsRoute);

const tree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  settingsRoute,
]);

export const router = createRouter({ routeTree: tree });
