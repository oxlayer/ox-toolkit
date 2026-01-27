import type { Context, Next } from 'hono';
import type { ScalarConfig, OpenAPISpec } from './types.js';
import { defaultSpec } from './default-spec.js';

/**
 * Scalar API documentation middleware for Hono
 * Serves the Scalar documentation UI
 */
export function scalarMiddleware(config: ScalarConfig = {}) {
  const {
    title = 'API Documentation',
    specUrl = '/openapi.json',
    path = '/docs',
  } = config;

  return async (c: Context, next: Next) => {
    // Only respond to docs path
    if (c.req.path === path && c.req.method === 'GET') {
      const html = generateScalarHtml({
        title,
        specUrl,
      });
      return c.html(html);
    }

    await next();
  };
}

/**
 * Generate the Scalar HTML documentation page
 */
function generateScalarHtml(options: {
  title: string;
  specUrl: string;
}): string {
  const { title, specUrl } = options;

  return `<!DOCTYPE html>
<html>
  <head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 0;
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      #scalar-container {
        flex: 1;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="scalar-container"></div>
    <script id="api-reference" data-url="${specUrl}"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}

/**
 * Middleware to serve the OpenAPI JSON specification
 */
export function openApiSpecMiddleware(spec: Partial<OpenAPISpec> = {}, config: ScalarConfig = {}) {
  const {
    title = 'API Documentation',
    description = 'Interactive API documentation',
    version = '1.0.0',
    path = '/openapi.json',
  } = config;

  const fullSpec: OpenAPISpec = {
    openapi: '3.1.0',
    info: {
      title,
      description,
      version,
    },
    ...spec,
  };

  return async (c: Context, next: Next) => {
    // Only respond to spec path
    if (c.req.path === path && c.req.method === 'GET') {
      return c.json(fullSpec);
    }

    await next();
  };
}

/**
 * Helper to create a default OpenAPI spec
 */
export function createOpenAPISpec(overrides: Partial<OpenAPISpec> = {}): OpenAPISpec {
  return {
    ...defaultSpec,
    ...overrides,
  };
}
