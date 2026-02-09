/**
 * Organizations Routes
 *
 * Hono routes that delegate to the OrganizationsController
 */

import { Hono } from 'hono';
import type { AppContainer } from '../../infrastructure/di/container.js';
import { getContainer } from '../../infrastructure/di/container.js';

const routes = new Hono();

/**
 * Convert Headers object to plain object for Hono
 */
function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

/**
 * Wire up routes to controller
 */
export function setupOrganizationsRoutes(app: Hono, container: AppContainer) {
  const controller = container.organizationsController;

  // GET /organizations - List all organizations
  app.get('/organizations', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.list();
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // POST /organizations - Create organization
  app.post('/organizations', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.create(request);
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // GET /organizations/:id - Get organization by ID
  app.get('/organizations/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.getById(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // PATCH /organizations/:id - Update organization
  app.patch('/organizations/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.update(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // DELETE /organizations/:id - Delete organization
  app.delete('/organizations/:id', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.delete(request, { id: c.req.param('id') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });

  // GET /organizations/by-slug/:slug - Get organization by slug
  app.get('/organizations/by-slug/:slug', async (c) => {
    const request = new Request(c.req.raw);
    const response = await controller.getBySlug(request, { slug: c.req.param('slug') });
    return c.body(response.body, response.status as any, headersToObject(response.headers));
  });
}
