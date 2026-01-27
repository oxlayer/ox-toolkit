/**
 * OpenAPI configuration for FatorH API
 */

import type { OpenAPISpec } from '@oxlayer/capabilities-openapi';
import { ENV } from './app.config.js';

/**
 * Admin API schemas
 */
const tenantDatabaseSchema = {
  type: 'object',
  properties: {
    database: {
      type: 'string',
      description: 'Database name (format: workspace_{realm}_{workspaceId})',
    },
    realm: {
      type: 'string',
      description: 'Keycloak realm ID',
    },
    workspaceId: {
      type: 'string',
      description: 'Workspace ID',
    },
  },
  required: ['database', 'realm', 'workspaceId'],
} as const;

const workspaceInputSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Workspace ID',
    },
    name: {
      type: 'string',
      description: 'Workspace name',
    },
    organizationId: {
      type: 'string',
      format: 'uuid',
      description: 'Organization ID',
    },
  },
  required: ['id', 'name', 'organizationId'],
} as const;

const provisionTenantRequestSchema = {
  type: 'object',
  properties: {
    realmId: {
      type: 'string',
      description: 'Keycloak realm ID (format: realm-{client-name})',
      example: 'realm-acme',
    },
    displayName: {
      type: 'string',
      description: 'Display name for the client/tenant',
      example: 'Acme',
    },
    workspaces: {
      type: 'array',
      items: workspaceInputSchema,
      description: 'List of workspaces to provision databases for',
    },
  },
  required: ['realmId', 'displayName', 'workspaces'],
} as const;

const databaseResultSchema = {
  type: 'object',
  properties: {
    workspaceId: {
      type: 'string',
      description: 'Workspace ID',
    },
    database: {
      type: 'string',
      description: 'Database name',
    },
    status: {
      type: 'string',
      enum: ['created', 'migrated', 'failed'],
      description: 'Database creation/migration status',
    },
    migrations: {
      type: 'string',
      description: 'Migration status message',
      nullable: true,
    },
    error: {
      type: 'string',
      description: 'Error message if failed',
      nullable: true,
    },
    migrationError: {
      type: 'string',
      description: 'Migration error message if failed',
      nullable: true,
    },
  },
  required: ['workspaceId', 'database', 'status'],
} as const;

const provisionTenantResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: 'Whether provisioning succeeded',
    },
    message: {
      type: 'string',
      description: 'Status message',
    },
    results: {
      type: 'object',
      properties: {
        realm: {
          type: 'object',
          description: 'Keycloak realm details',
        },
        databases: {
          type: 'array',
          items: databaseResultSchema,
          description: 'Database provisioning results for each workspace',
        },
      },
    },
  },
  required: ['success', 'message'],
} as const;

const listTenantsResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
    },
    tenants: {
      type: 'array',
      items: tenantDatabaseSchema,
    },
  },
  required: ['success', 'tenants'],
} as const;

const createDatabaseRequestSchema = {
  type: 'object',
  properties: {
    realm: {
      type: 'string',
      description: 'Keycloak realm ID',
      example: 'realm-acme',
    },
    workspaceId: {
      type: 'string',
      format: 'uuid',
      description: 'Workspace ID',
    },
  },
  required: ['realm', 'workspaceId'],
} as const;

const createDatabaseResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
    },
    message: {
      type: 'string',
    },
    database: {
      type: 'string',
      description: 'Database name',
    },
  },
  required: ['success', 'message'],
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
 * Exam schema
 */
const examSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the exam',
    },
    workspaceId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the workspace this exam belongs to',
    },
    examName: {
      type: 'string',
      description: 'Name of the exam',
    },
    durationMinutes: {
      type: 'integer',
      description: 'Duration of the exam in minutes',
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the exam was created',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when the exam was last updated',
    },
  },
  required: ['id', 'workspaceId', 'examName', 'durationMinutes', 'createdAt', 'updatedAt'],
} as const;

/**
 * Evaluation result schema
 */
const evaluationResultSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Unique identifier for the evaluation result',
    },
    assignmentId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the exam assignment',
    },
    candidateId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the candidate',
    },
    examId: {
      type: 'string',
      format: 'uuid',
      description: 'ID of the exam',
    },
    overallScore: {
      type: 'number',
      format: 'float',
      description: 'Overall score achieved (0-100)',
    },
    completionStatus: {
      type: 'string',
      enum: ['completed', 'partial', 'failed'],
      description: 'Status of the evaluation',
    },
    transcriptions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionId: {
            type: 'string',
            format: 'uuid',
          },
          text: {
            type: 'string',
          },
          confidence: {
            type: 'number',
            format: 'float',
          },
        },
      },
    },
    analysisResults: {
      type: 'array',
      items: {
        type: 'object',
      },
    },
    processedAt: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp when processing completed',
    },
  },
  required: ['id', 'assignmentId', 'candidateId', 'examId'],
} as const;

/**
 * OpenAPI specification for FatorH API
 */
export const globexApiSpec: OpenAPISpec = {
  openapi: '3.1.0',
  info: {
    title: 'FatorH API',
    description: `API for FatorH - an exam evaluation system with AI-powered transcription and analysis.

## Features

- **PostgreSQL**: Reliable data persistence
- **Redis Caching**: High-performance caching layer
- **RabbitMQ Events**: Event-driven architecture
- **Keycloak Authentication**: JWT-based security

## Authentication

Protected API endpoints require authentication via JWT tokens.

Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\``,
    version: ENV.SERVICE_VERSION,
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
      name: 'Authentication',
      description: 'Token generation and authentication endpoints',
    },
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Admin',
      description: 'Platform administration - tenant and realm provisioning (requires platform-admin role)',
    },
    {
      name: 'Workspaces',
      description: 'Workspace management endpoints',
    },
    {
      name: 'Exams',
      description: 'Exam management endpoints',
    },
    {
      name: 'Questions',
      description: 'Question management endpoints',
    },
    {
      name: 'Answers',
      description: 'Answer management endpoints',
    },
    {
      name: 'Evaluations',
      description: 'Evaluation and analysis endpoints',
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
                    service: {
                      type: 'string',
                      example: 'globex-api',
                    },
                    version: {
                      type: 'string',
                      example: '1.0.0',
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
    '/api/admin/tenants': {
      get: {
        tags: ['Admin'],
        summary: 'List all tenant databases',
        description: 'List all provisioned tenant databases across all realms. Requires platform-admin role.',
        operationId: 'listTenants',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'List of tenant databases',
            content: {
              'application/json': {
                schema: listTenantsResponseSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized - Missing or invalid token',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '403': {
            description: 'Forbidden - Requires platform-admin role',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/admin/realms/provision': {
      post: {
        tags: ['Admin'],
        summary: 'Provision a new Keycloak realm',
        description: 'Create a new Keycloak realm for a B2B client. Requires platform-admin role.',
        operationId: 'provisionRealm',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  realmId: {
                    type: 'string',
                    description: 'Realm ID (format: realm-{client-name})',
                    example: 'realm-acme',
                  },
                  displayName: {
                    type: 'string',
                    description: 'Display name for the client',
                    example: 'Acme',
                  },
                },
                required: ['realmId', 'displayName'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Realm provisioned successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    realm: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        realm: { type: 'string' },
                        displayName: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '403': {
            description: 'Forbidden - Requires platform-admin role',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/admin/databases/create': {
      post: {
        tags: ['Admin'],
        summary: 'Create tenant database',
        description: 'Create a new PostgreSQL database for a workspace. Requires platform-admin role.',
        operationId: 'createDatabase',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: createDatabaseRequestSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Database created successfully',
            content: {
              'application/json': {
                schema: createDatabaseResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '403': {
            description: 'Forbidden - Requires platform-admin role',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/admin/databases/migrate': {
      post: {
        tags: ['Admin'],
        summary: 'Run database migrations',
        description: 'Run Drizzle migrations on a tenant database. Requires platform-admin role.',
        operationId: 'migrateDatabase',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: createDatabaseRequestSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Migrations completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    migrations: {
                      type: 'string',
                      description: 'Migration results',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '403': {
            description: 'Forbidden - Requires platform-admin role',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/admin/tenants/provision': {
      post: {
        tags: ['Admin'],
        summary: 'Provision a complete tenant',
        description: 'Full tenant provisioning: creates realm, databases, and runs migrations for all workspaces. Requires platform-admin role.',
        operationId: 'provisionTenant',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: provisionTenantRequestSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Tenant provisioned successfully',
            content: {
              'application/json': {
                schema: provisionTenantResponseSchema,
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '403': {
            description: 'Forbidden - Requires platform-admin role',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/exams': {
      post: {
        tags: ['Exams'],
        summary: 'Create exam',
        description: 'Create a new exam with questions',
        operationId: 'createExam',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  examName: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 255,
                    description: 'Name of the exam',
                  },
                  durationMinutes: {
                    type: 'integer',
                    minimum: 1,
                    default: 30,
                    description: 'Duration in minutes',
                  },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        priority: {
                          type: 'integer',
                          minimum: 1,
                          description: 'Order priority of the question',
                        },
                        text: {
                          type: 'string',
                          minLength: 1,
                          description: 'Question text',
                        },
                        type: {
                          type: 'string',
                          enum: ['text', 'audio'],
                          description: 'Question type',
                        },
                      },
                    },
                  },
                },
                required: ['examName', 'questions'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Exam created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    exam: examSchema,
                  },
                  required: ['exam'],
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
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      get: {
        tags: ['Exams'],
        summary: 'List exams',
        description: 'Retrieve a list of exams, optionally filtered by workspace',
        operationId: 'listExams',
        security: [{ bearerAuth: [] }],
        parameters: [],
        responses: {
          '200': {
            description: 'List of exams',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    exams: {
                      type: 'array',
                      items: examSchema,
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/exams/{id}': {
      get: {
        tags: ['Exams'],
        summary: 'Get exam by ID',
        description: 'Retrieve a single exam with its questions',
        operationId: 'getExamById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Exam ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Exam found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    exam: examSchema,
                  },
                  required: ['exam'],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Exam not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/evaluations/bulk': {
      post: {
        tags: ['Evaluations'],
        summary: 'Bulk evaluate candidates',
        description: 'Process audio answers for multiple candidates using AI transcription and analysis',
        operationId: 'bulkEvaluate',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  examId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the exam to evaluate',
                  },
                  candidateIds: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'uuid',
                    },
                    description: 'List of candidate IDs to evaluate',
                  },
                },
                required: ['examId', 'candidateIds'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Evaluation started successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    evaluations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          evaluationId: {
                            type: 'string',
                            format: 'uuid',
                          },
                          candidateId: {
                            type: 'string',
                            format: 'uuid',
                          },
                          status: {
                            type: 'string',
                            enum: ['pending', 'in_progress', 'completed', 'failed'],
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/evaluations/{id}': {
      get: {
        tags: ['Evaluations'],
        summary: 'Get evaluation result',
        description: 'Retrieve the evaluation result for a specific exam assignment',
        operationId: 'getEvaluationById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Evaluation result ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Evaluation result found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    evaluation: evaluationResultSchema,
                  },
                  required: ['evaluation'],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Evaluation not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/workspaces': {
      post: {
        tags: ['Workspaces'],
        summary: 'Create workspace',
        description: 'Create a new workspace',
        operationId: 'createWorkspace',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'organizationId'],
                properties: {
                  name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 255,
                    description: 'Workspace name',
                  },
                  description: {
                    type: 'string',
                    description: 'Workspace description',
                  },
                  organizationId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'Organization ID',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Workspace created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    workspace: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string' },
                      description: { type: 'string', nullable: true },
                      organizationId: { type: 'string', format: 'uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                    },
                  },
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
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      get: {
        tags: ['Workspaces'],
        summary: 'List workspaces',
        description: 'Retrieve a list of workspaces',
        operationId: 'listWorkspaces',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'organizationId',
            in: 'query',
            description: 'Filter by organization ID',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Limit results',
            schema: { type: 'integer', default: 50 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Offset results',
            schema: { type: 'integer', default: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'List of workspaces',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    workspaces: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          name: { type: 'string' },
                          description: { type: 'string', nullable: true },
                          organizationId: { type: 'string', format: 'uuid' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/workspaces/{id}': {
      get: {
        tags: ['Workspaces'],
        summary: 'Get workspace by ID',
        description: 'Retrieve a single workspace',
        operationId: 'getWorkspaceById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Workspace ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Workspace found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    workspace: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        organizationId: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Workspace not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      patch: {
        tags: ['Workspaces'],
        summary: 'Update workspace',
        description: 'Update a workspace',
        operationId: 'updateWorkspace',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Workspace ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 255,
                    description: 'Workspace name',
                  },
                  description: {
                    type: 'string',
                    description: 'Workspace description',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Workspace updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    workspace: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        organizationId: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Workspace not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      delete: {
        tags: ['Workspaces'],
        summary: 'Delete workspace',
        description: 'Delete a workspace (soft delete)',
        operationId: 'deleteWorkspace',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Workspace ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Workspace deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Workspace not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/questions': {
      post: {
        tags: ['Questions'],
        summary: 'Create question',
        description: 'Create a new question',
        operationId: 'createQuestion',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['examId', 'priority', 'text', 'type'],
                properties: {
                  examId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the exam',
                  },
                  priority: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Question priority/order',
                  },
                  text: {
                    type: 'string',
                    minLength: 1,
                    description: 'Question text',
                  },
                  type: {
                    type: 'string',
                    enum: ['text', 'audio'],
                    description: 'Question type',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Question created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    question: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        examId: { type: 'string', format: 'uuid' },
                        priority: { type: 'integer' },
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'audio'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      get: {
        tags: ['Questions'],
        summary: 'List questions',
        description: 'Retrieve a list of questions',
        operationId: 'listQuestions',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'examId',
            in: 'query',
            description: 'Filter by exam ID',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'type',
            in: 'query',
            description: 'Filter by type',
            schema: { type: 'string', enum: ['text', 'audio'] },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Limit results',
            schema: { type: 'integer', default: 50 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Offset results',
            schema: { type: 'integer', default: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'List of questions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    questions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          examId: { type: 'string', format: 'uuid' },
                          priority: { type: 'integer' },
                          text: { type: 'string' },
                          type: { type: 'string', enum: ['text', 'audio'] },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/questions/{id}': {
      get: {
        tags: ['Questions'],
        summary: 'Get question by ID',
        description: 'Retrieve a single question',
        operationId: 'getQuestionById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Question ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Question found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    question: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        examId: { type: 'string', format: 'uuid' },
                        priority: { type: 'integer' },
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'audio'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Question not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      patch: {
        tags: ['Questions'],
        summary: 'Update question',
        description: 'Update a question',
        operationId: 'updateQuestion',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Question ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  priority: {
                    type: 'integer',
                    minimum: 1,
                    description: 'Question priority/order',
                  },
                  text: {
                    type: 'string',
                    minLength: 1,
                    description: 'Question text',
                  },
                  type: {
                    type: 'string',
                    enum: ['text', 'audio'],
                    description: 'Question type',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Question updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    question: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        examId: { type: 'string', format: 'uuid' },
                        priority: { type: 'integer' },
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['text', 'audio'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Question not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      delete: {
        tags: ['Questions'],
        summary: 'Delete question',
        description: 'Delete a question',
        operationId: 'deleteQuestion',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Question ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Question deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Question not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/answers': {
      post: {
        tags: ['Answers'],
        summary: 'Create answer',
        description: 'Create a new answer (candidate response to a question)',
        operationId: 'createAnswer',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['assignmentId', 'candidateId', 'examId', 'questionId', 's3Url', 'duration', 'contentType', 'fileSize'],
                properties: {
                  assignmentId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the exam assignment',
                  },
                  candidateId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the candidate',
                  },
                  examId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the exam',
                  },
                  questionId: {
                    type: 'string',
                    format: 'uuid',
                    description: 'ID of the question',
                  },
                  s3Url: {
                    type: 'string',
                    format: 'uri',
                    description: 'S3 URL for audio file',
                  },
                  duration: {
                    type: 'number',
                    format: 'float',
                    description: 'Duration in seconds',
                  },
                  contentType: {
                    type: 'string',
                    description: 'Content type (e.g., audio/mp3)',
                  },
                  fileSize: {
                    type: 'number',
                    description: 'File size in bytes',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Answer created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    answer: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        assignmentId: { type: 'string', format: 'uuid' },
                        candidateId: { type: 'string', format: 'uuid' },
                        examId: { type: 'string', format: 'uuid' },
                        questionId: { type: 'string', format: 'uuid' },
                        s3Url: { type: 'string' },
                        duration: { type: 'number', format: 'float' },
                        contentType: { type: 'string' },
                        fileSize: { type: 'number' },
                        isValid: { type: 'boolean' },
                        transcription: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      get: {
        tags: ['Answers'],
        summary: 'List answers',
        description: 'Retrieve a list of answers',
        operationId: 'listAnswers',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'assignmentId',
            in: 'query',
            description: 'Filter by assignment ID',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'candidateId',
            in: 'query',
            description: 'Filter by candidate ID',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'examId',
            in: 'query',
            description: 'Filter by exam ID',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'questionId',
            in: 'query',
            description: 'Filter by question ID',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'isValid',
            in: 'query',
            description: 'Filter by validity',
            schema: { type: 'boolean' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Limit results',
            schema: { type: 'integer', default: 50 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Offset results',
            schema: { type: 'integer', default: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'List of answers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    answers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          assignmentId: { type: 'string', format: 'uuid' },
                          candidateId: { type: 'string', format: 'uuid' },
                          examId: { type: 'string', format: 'uuid' },
                          questionId: { type: 'string', format: 'uuid' },
                          s3Url: { type: 'string' },
                          duration: { type: 'number', format: 'float' },
                          contentType: { type: 'string' },
                          fileSize: { type: 'number' },
                          isValid: { type: 'boolean' },
                          transcription: { type: 'string', nullable: true },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                    total: { type: 'integer' },
                    limit: { type: 'integer' },
                    offset: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
    '/api/answers/{id}': {
      get: {
        tags: ['Answers'],
        summary: 'Get answer by ID',
        description: 'Retrieve a single answer',
        operationId: 'getAnswerById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Answer ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Answer found',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    answer: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        assignmentId: { type: 'string', format: 'uuid' },
                        candidateId: { type: 'string', format: 'uuid' },
                        examId: { type: 'string', format: 'uuid' },
                        questionId: { type: 'string', format: 'uuid' },
                        s3Url: { type: 'string' },
                        duration: { type: 'number', format: 'float' },
                        contentType: { type: 'string' },
                        fileSize: { type: 'number' },
                        isValid: { type: 'boolean' },
                        transcription: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Answer not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      patch: {
        tags: ['Answers'],
        summary: 'Update answer',
        description: 'Update an answer (e.g., add transcription or mark as valid)',
        operationId: 'updateAnswer',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Answer ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  transcription: {
                    type: 'string',
                    description: 'Transcribed text',
                  },
                  isValid: {
                    type: 'boolean',
                    description: 'Whether the answer is valid',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Answer updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    answer: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        assignmentId: { type: 'string', format: 'uuid' },
                        candidateId: { type: 'string', format: 'uuid' },
                        examId: { type: 'string', format: 'uuid' },
                        questionId: { type: 'string', format: 'uuid' },
                        s3Url: { type: 'string' },
                        duration: { type: 'number', format: 'float' },
                        contentType: { type: 'string' },
                        fileSize: { type: 'number' },
                        isValid: { type: 'boolean' },
                        transcription: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Answer not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
      delete: {
        tags: ['Answers'],
        summary: 'Delete answer',
        description: 'Delete an answer',
        operationId: 'deleteAnswer',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            description: 'Answer ID',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Answer deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
          '404': {
            description: 'Answer not found',
            content: {
              'application/json': {
                schema: errorSchema,
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: errorSchema,
      Exam: examSchema,
      EvaluationResult: evaluationResultSchema,
      Workspace: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique identifier for the workspace' },
          name: { type: 'string', description: 'Workspace name' },
          description: { type: 'string', nullable: true, description: 'Workspace description' },
          organizationId: { type: 'string', format: 'uuid', description: 'ID of the organization' },
          createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the workspace was created' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the workspace was last updated' },
        },
      },
      Question: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique identifier for the question' },
          examId: { type: 'string', format: 'uuid', description: 'ID of the exam this question belongs to' },
          priority: { type: 'integer', description: 'Order priority of the question' },
          text: { type: 'string', description: 'Question text' },
          type: { type: 'string', enum: ['text', 'audio'], description: 'Question type' },
          createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the question was created' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the question was last updated' },
        },
      },
      Answer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Unique identifier for the answer' },
          assignmentId: { type: 'string', format: 'uuid', description: 'ID of the exam assignment' },
          candidateId: { type: 'string', format: 'uuid', description: 'ID of the candidate' },
          examId: { type: 'string', format: 'uuid', description: 'ID of the exam' },
          questionId: { type: 'string', format: 'uuid', description: 'ID of the question' },
          s3Url: { type: 'string', description: 'S3 URL for audio file' },
          duration: { type: 'number', format: 'float', description: 'Duration in seconds' },
          contentType: { type: 'string', description: 'Content type (e.g., audio/mp3)' },
          fileSize: { type: 'number', description: 'File size in bytes' },
          isValid: { type: 'boolean', description: 'Whether the answer is valid' },
          transcription: { type: 'string', nullable: true, description: 'Transcribed text' },
          createdAt: { type: 'string', format: 'date-time', description: 'Timestamp when the answer was created' },
          updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp when the answer was last updated' },
        },
      },
    },
    schemas: {
      Error: errorSchema,
      Exam: examSchema,
      EvaluationResult: evaluationResultSchema,
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token for authentication',
      },
    },
  },
};
