import type { Context, Next } from 'hono';

/**
 * Mark a route as public, bypassing authentication
 * This is a pass-through middleware that can be used to explicitly mark routes as public
 */
export function publicRoute() {
  return async (c: Context, next: Next) => {
    c.set('isAuthenticated', false);
    c.set('authStrategy', 'none');
    return next();
  };
}

/**
 * Check if a route should be public based on path patterns
 */
export function isPublicRoute(path: string, publicPaths: string[]): boolean {
  return publicPaths.some(publicPath => path.startsWith(publicPath));
}
