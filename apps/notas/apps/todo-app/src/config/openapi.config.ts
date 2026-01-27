/**
 * OpenAPI configuration for Todo API
 */

import type { OpenAPISpec } from '@oxlayer/capabilities-openapi';

/**
 * Tenancy enabled flag - set to true for multi-tenant apps
 */
const TENANCY_ENABLED = false;

/**
 * Todo schema definition
 */
const todoSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'Unique identifier for the todo',
    },
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'Title of the todo',
    },
    description: {
      type: 'string',
      nullable: true,
      description: 'Detailed description of the todo',
    },
    status: {
      type: 'string',
      enum: ['pending', 'in_progress', 'completed'],
      description: 'Current status of the todo',
    },
    userId: {
      type: 'string',
      description: 'ID of the user who owns the todo',
    },
    dueDate: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'Due date for the todo (ISO 8601 format)',
    },
    completedAt: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'Timestamp when the todo was completed',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the todo was created',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the todo was last updated',
    },
  },
  required: ['id', 'title', 'status', 'userId', 'createdAt', 'updatedAt'],
} as const;

/**
 * Error response schema
 */
const errorSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'string',
      description: 'Error type',
    },
    message: {
      type: 'string',
      description: 'Detailed error message',
    },
    code: {
      type: 'string',
      description: 'Error code',
    },
  },
  required: ['error'],
} as const;

/**
 * CreateTodo request schema
 */
const createTodoRequest = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'Title of the todo',
    },
    description: {
      type: 'string',
      description: 'Detailed description of the todo',
    },
    dueDate: {
      type: 'string',
      format: 'date-time',
      description: 'Due date for the todo (ISO 8601 format)',
    },
  },
  required: ['title'],
} as const;

/**
 * UpdateTodo request schema
 */
const updateTodoRequest = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      minLength: 1,
      maxLength: 200,
      description: 'Title of the todo',
    },
    description: {
      type: 'string',
      description: 'Detailed description of the todo',
    },
    status: {
      type: 'string',
      enum: ['pending', 'in_progress', 'completed'],
      description: 'Current status of the todo',
    },
    dueDate: {
      type: 'string',
      format: 'date-time',
      description: 'Due date for the todo (ISO 8601 format)',
    },
  },
} as const;

/**
 * Full OpenAPI specification for Todo API
 */
export const todoApiSpec: OpenAPISpec = {
  openapi: '3.1.0',
  info: {
    title: 'Todo API',
    description: `A complete CRUD API for managing todos with the following features:

- **PostgreSQL**: Reliable data persistence
- **Redis Caching**: High-performance caching layer
- **RabbitMQ Events**: Event-driven architecture
${TENANCY_ENABLED ? '- **Multi-Tenancy**: Full tenant isolation' : '- **Single-Tenant**: Simple B2C application'}

## Authentication

Protected API endpoints require authentication via JWT tokens.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

${TENANCY_ENABLED ? `## Multi-Tenancy

The API automatically isolates data by tenant. The tenant ID is extracted from the JWT token and used for all database queries.` : `## Public vs Protected Routes

- **Public routes** (\`/public/*\`): No authentication required
- **Protected routes** (\`/api/*\`): JWT authentication required`}`,
    version: '1.0.0',
    contact: {
      name: 'OxLayer',
      url: 'https://github.com/oxlayer/oxlayer',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Authentication',
      description: 'Token generation endpoints',
    },
    {
      name: 'Public',
      description: 'Public endpoints (no authentication required)',
    },
    {
      name: 'Todos',
      description: 'Todo management endpoints (authentication required)',
    },
    {
      name: 'Projects',
      description: 'Project management endpoints (authentication required)',
    },
    {
      name: 'Sections',
      description: 'Section management endpoints (authentication required)',
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check the health status of the API and its dependencies',
        operationId: 'getHealth',
        security: [],
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      example: 'ok',
                    },
                    services: {
                      type: 'object',
                      properties: {
                        database: {
                          type: 'boolean',
                        },
                        redis: {
                          type: 'boolean',
                        },
                        eventBus: {
                          type: 'boolean',
                        },
                      },
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/todos': {
      get: {
        tags: ['Todos'],
        summary: 'List todos',
        description: 'Retrieve a list of todos for the authenticated user. Supports filtering by status and text search.',
        operationId: 'getTodos',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'status',
            in: 'query',
            description: 'Filter todos by status',
            schema: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
            },
            required: false,
          },
          {
            name: 'search',
            in: 'query',
            description: 'Search todos by title or description',
            schema: {
              type: 'string',
            },
            required: false,
          },
        ],
        responses: {
          '200': {
            description: 'List of todos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    todos: {
                      type: 'array',
                      items: todoSchema,
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      post: {
        tags: ['Todos'],
        summary: 'Create todo',
        description: 'Create a new todo for the authenticated user',
        operationId: 'createTodo',
        security: [
          {
            bearerAuth: [],
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: createTodoRequest,
              examples: {
                minimal: {
                  summary: 'Minimal todo',
                  value: {
                    title: 'Buy groceries',
                  },
                },
                full: {
                  summary: 'Complete todo',
                  value: {
                    title: 'Complete project documentation',
                    description: 'Write comprehensive API documentation with examples',
                    dueDate: '2026-01-20T10:00:00Z',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Todo created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    todo: todoSchema,
                  },
                  required: ['todo'],
                },
              },
            },
          },
          '400': {
            description: 'Bad request - Validation error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/todos/{id}': {
      get: {
        tags: ['Todos'],
        summary: 'Get todo by ID',
        description: 'Retrieve a single todo by its ID',
        operationId: 'getTodoById',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Todo ID',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Todo found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    todo: todoSchema,
                  },
                  required: ['todo'],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Todo not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      patch: {
        tags: ['Todos'],
        summary: 'Update todo',
        description: 'Update an existing todo. All fields are optional.',
        operationId: 'updateTodo',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Todo ID',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: updateTodoRequest,
              examples: {
                updateStatus: {
                  summary: 'Update status',
                  value: {
                    status: 'in_progress',
                  },
                },
                updateAll: {
                  summary: 'Update all fields',
                  value: {
                    title: 'Updated title',
                    description: 'Updated description',
                    status: 'in_progress',
                    dueDate: '2026-01-25T10:00:00Z',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Todo updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    todo: todoSchema,
                  },
                  required: ['todo'],
                },
              },
            },
          },
          '400': {
            description: 'Bad request - Validation error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Todo not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      delete: {
        tags: ['Todos'],
        summary: 'Delete todo',
        description: 'Delete a todo by its ID',
        operationId: 'deleteTodo',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Todo ID',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Todo deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      example: 'Todo deleted successfully',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Todo not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/todos/{id}/complete': {
      patch: {
        tags: ['Todos'],
        summary: 'Complete todo',
        description: 'Mark a todo as completed',
        operationId: 'completeTodo',
        security: [
          {
            bearerAuth: [],
          },
        ],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Todo ID',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Todo marked as completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    todo: todoSchema,
                  },
                  required: ['todo'],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Todo not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects',
        description: 'Retrieve a list of projects for the authenticated user',
        operationId: 'getProjects',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of projects',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    projects: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Project' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create project',
        description: 'Create a new project for the authenticated user',
        operationId: 'createProject',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Project created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    project: { $ref: '#/components/schemas/Project' },
                  },
                  required: ['project'],
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
    },
    '/api/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get project by ID',
        description: 'Retrieve a single project by its ID',
        operationId: 'getProjectById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Project ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Project found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    project: { $ref: '#/components/schemas/Project' },
                  },
                  required: ['project'],
                },
              },
            },
          },
          '404': {
            description: 'Project not found',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
      patch: {
        tags: ['Projects'],
        summary: 'Update project',
        description: 'Update an existing project',
        operationId: 'updateProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Project ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProjectRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Project updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    project: { $ref: '#/components/schemas/Project' },
                  },
                  required: ['project'],
                },
              },
            },
          },
          '404': {
            description: 'Project not found',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete project',
        description: 'Delete a project by its ID',
        operationId: 'deleteProject',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Project ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Project deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Project deleted successfully' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Project not found',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
    },
    '/api/sections': {
      get: {
        tags: ['Sections'],
        summary: 'List sections',
        description: 'Retrieve a list of sections, optionally filtered by project',
        operationId: 'getSections',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'projectId',
            in: 'query',
            description: 'Filter sections by project ID',
            schema: { type: 'string' },
            required: false,
          },
        ],
        responses: {
          '200': {
            description: 'List of sections',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sections: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Section' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Sections'],
        summary: 'Create section',
        description: 'Create a new section',
        operationId: 'createSection',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateSectionRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Section created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    section: { $ref: '#/components/schemas/Section' },
                  },
                  required: ['section'],
                },
              },
            },
          },
        },
      },
    },
    '/api/sections/{id}': {
      get: {
        tags: ['Sections'],
        summary: 'Get section by ID',
        description: 'Retrieve a single section by its ID',
        operationId: 'getSectionById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Section ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Section found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    section: { $ref: '#/components/schemas/Section' },
                  },
                  required: ['section'],
                },
              },
            },
          },
          '404': {
            description: 'Section not found',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
      patch: {
        tags: ['Sections'],
        summary: 'Update section',
        description: 'Update an existing section',
        operationId: 'updateSection',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Section ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateSectionRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Section updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    section: { $ref: '#/components/schemas/Section' },
                  },
                  required: ['section'],
                },
              },
            },
          },
          '404': {
            description: 'Section not found',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
      delete: {
        tags: ['Sections'],
        summary: 'Delete section',
        description: 'Delete a section by its ID',
        operationId: 'deleteSection',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Section ID',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Section deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Section deleted successfully' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Section not found',
            content: {
              'application/json': { schema: errorSchema },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Todo: todoSchema,
      Error: errorSchema,
      CreateTodoRequest: createTodoRequest,
      UpdateTodoRequest: updateTodoRequest,
      Project: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the project',
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Name of the project',
          },
          color: {
            type: 'string',
            pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
            description: 'Hex color code (e.g., #FF0000)',
          },
          icon: {
            type: 'string',
            description: 'Icon name or emoji',
          },
          isInbox: {
            type: 'boolean',
            description: 'Whether this is the default Inbox project',
          },
          order: {
            type: 'number',
            description: 'Display order',
          },
          userId: {
            type: 'string',
            description: 'ID of the user who owns the project',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the project was created',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the project was last updated',
          },
        },
        required: ['id', 'name', 'isInbox', 'order', 'userId', 'createdAt', 'updatedAt'],
      },
      Section: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique identifier for the section',
          },
          projectId: {
            type: 'string',
            description: 'ID of the project this section belongs to',
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Name of the section',
          },
          order: {
            type: 'number',
            description: 'Display order',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the section was created',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the section was last updated',
          },
        },
        required: ['id', 'projectId', 'name', 'order', 'createdAt', 'updatedAt'],
      },
      CreateProjectRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Name of the project',
          },
          color: {
            type: 'string',
            pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
            description: 'Hex color code (e.g., #FF0000)',
          },
          icon: {
            type: 'string',
            description: 'Icon name or emoji',
          },
        },
        required: ['name'],
      },
      UpdateProjectRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Name of the project',
          },
          color: {
            type: 'string',
            pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
            description: 'Hex color code (e.g., #FF0000)',
          },
          icon: {
            type: 'string',
            description: 'Icon name or emoji',
          },
          order: {
            type: 'number',
            minimum: 0,
            description: 'Display order',
          },
        },
      },
      CreateSectionRequest: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'ID of the project this section belongs to',
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Name of the section',
          },
        },
        required: ['projectId', 'name'],
      },
      UpdateSectionRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Name of the section',
          },
          order: {
            type: 'number',
            minimum: 0,
            description: 'Display order',
          },
        },
      },
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: TENANCY_ENABLED
          ? 'JWT token with optional tenant_id claim for multi-tenant access'
          : 'JWT token for authentication',
      },
    },
  },
};
