/**
 * OpenAPI Configuration
 */

import { z } from 'zod';

/**
 * OpenAPI specification for Alo Manager API
 */
export const aloManagerApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Alo Manager API',
    description: 'API for managing establishments, users, delivery men, and service providers in the Alo platform',
    version: '1.0.0',
    contact: {
      name: 'Alo Support',
      email: 'support@acme.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // Establishment
      Establishment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          ownerId: { type: 'integer' },
          image: { type: 'string' },
          primaryColor: { type: 'string' },
          secondaryColor: { type: 'string' },
          lat: { type: 'number' },
          long: { type: 'number' },
          locationString: { type: 'string' },
          maxDistanceDelivery: { type: 'integer' },
          establishmentTypeId: { type: 'integer' },
          whatsapp: { type: 'string' },
          instagram: { type: 'string' },
          website: { type: 'string' },
          googleBusinessUrl: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateEstablishment: {
        type: 'object',
        required: ['name', 'horarioFuncionamento', 'description', 'ownerId'],
        properties: {
          name: { type: 'string' },
          horarioFuncionamento: { type: 'string' },
          description: { type: 'string' },
          ownerId: { type: 'integer' },
          image: { type: 'string' },
          primaryColor: { type: 'string' },
          secondaryColor: { type: 'string' },
          lat: { type: 'number' },
          long: { type: 'number' },
          locationString: { type: 'string' },
          maxDistanceDelivery: { type: 'integer' },
          establishmentTypeId: { type: 'integer' },
          whatsapp: { type: 'string' },
          instagram: { type: 'string' },
          website: { type: 'string' },
          googleBusinessUrl: { type: 'string' },
        },
      },
      // User
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          establishmentId: { type: 'integer' },
          role: { type: 'string', enum: ['admin', 'manager', 'staff'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateUser: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          establishmentId: { type: 'integer' },
          role: { type: 'string', enum: ['admin', 'manager', 'staff'] },
        },
      },
      // Delivery Man
      DeliveryMan: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          establishmentId: { type: 'integer' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateDeliveryMan: {
        type: 'object',
        required: ['name', 'email', 'password', 'phone'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          phone: { type: 'string' },
          establishmentId: { type: 'integer' },
        },
      },
      // Service Provider
      ServiceProvider: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          categoryId: { type: 'integer' },
          document: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' },
          available: { type: 'boolean' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateServiceProvider: {
        type: 'object',
        required: ['name', 'email', 'password', 'phone', 'categoryId', 'document', 'address', 'city', 'state', 'zipCode'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          phone: { type: 'string' },
          categoryId: { type: 'integer' },
          document: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' },
          available: { type: 'boolean' },
        },
      },
      // Onboarding Lead
      OnboardingLead: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          userType: { type: 'string', enum: ['provider', 'company'] },
          categoryId: { type: 'integer' },
          establishmentTypeId: { type: 'integer' },
          document: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string' },
          termsAccepted: { type: 'boolean' },
          privacyAccepted: { type: 'boolean' },
          status: { type: 'string', enum: ['new', 'contacted', 'converted', 'rejected'] },
          contactedAt: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      // Common
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Bad request - invalid input or parameters',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Bad request' },
                message: { type: 'string', example: 'Invalid input provided' },
              },
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation failed - request body or query parameters are invalid',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Validation failed' },
                details: {
                  type: 'object',
                  additionalProperties: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  example: {
                    name: ['Name is required'],
                    email: ['Invalid email format'],
                  },
                },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: 'Unauthorized - authentication required or failed',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Unauthorized' },
                message: { type: 'string', example: 'Authentication required' },
              },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string', example: 'Not Found' },
                message: { type: 'string', example: 'Resource not found' },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    // Health check
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        description: 'Check if the API and its dependencies are running',
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string' },
                    services: {
                      type: 'object',
                      properties: {
                        database: { type: 'boolean' },
                        redis: { type: 'boolean' },
                        eventBus: { type: 'boolean' },
                      },
                    },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Establishments
    '/api/establishments': {
      get: {
        tags: ['Establishments'],
        summary: 'List establishments',
        description: 'Get a paginated list of establishments with optional filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'ownerId', in: 'query', schema: { type: 'integer' }, description: 'Filter by owner ID' },
          { name: 'establishmentTypeId', in: 'query', schema: { type: 'integer' }, description: 'Filter by establishment type ID' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in name or description' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Limit number of results' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Offset for pagination' },
        ],
        responses: {
          '200': {
            description: 'List of establishments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    establishments: { type: 'array', items: { $ref: '#/components/schemas/Establishment' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
      post: {
        tags: ['Establishments'],
        summary: 'Create establishment',
        description: 'Create a new establishment',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateEstablishment' },
              example: {
                name: 'My Restaurant',
                horarioFuncionamento: 'Mon-Fri 9AM-10PM',
                description: 'A great place to eat',
                ownerId: 1,
                primaryColor: '#FF5733',
                secondaryColor: '#33FF57',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Establishment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    establishment: { $ref: '#/components/schemas/Establishment' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/establishments/{id}': {
      get: {
        tags: ['Establishments'],
        summary: 'Get establishment by ID',
        description: 'Get a single establishment by its ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Establishment ID' },
        ],
        responses: {
          '200': {
            description: 'Establishment details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    establishment: { $ref: '#/components/schemas/Establishment' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Establishments'],
        summary: 'Update establishment',
        description: 'Update an existing establishment',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Establishment ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  horarioFuncionamento: { type: 'string' },
                  description: { type: 'string' },
                  image: { type: 'string' },
                  primaryColor: { type: 'string' },
                  secondaryColor: { type: 'string' },
                  lat: { type: 'number' },
                  long: { type: 'number' },
                  locationString: { type: 'string' },
                  maxDistanceDelivery: { type: 'integer' },
                  establishmentTypeId: { type: 'integer' },
                  whatsapp: { type: 'string' },
                  instagram: { type: 'string' },
                  website: { type: 'string' },
                  googleBusinessUrl: { type: 'string' },
                  openData: { type: 'object' },
                },
              },
              example: {
                name: 'Updated Restaurant Name',
                description: 'Updated description',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Establishment updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    establishment: { $ref: '#/components/schemas/Establishment' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Establishments'],
        summary: 'Delete establishment',
        description: 'Delete an establishment by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Establishment ID' },
        ],
        responses: {
          '200': {
            description: 'Establishment deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    // Users
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'List users',
        description: 'Get a paginated list of users with optional filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'establishmentId', in: 'query', schema: { type: 'integer' }, description: 'Filter by establishment ID' },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['admin', 'manager', 'staff'] }, description: 'Filter by role' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in name or email' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Limit number of results' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Offset for pagination' },
        ],
        responses: {
          '200': {
            description: 'List of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create user',
        description: 'Create a new user',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateUser' },
              example: {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'securepassword',
                establishmentId: 1,
                role: 'manager',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        description: 'Get a single user by their ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'User ID' },
        ],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        description: 'Update an existing user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'User ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  establishmentId: { type: 'integer' },
                  role: { type: 'string', enum: ['admin', 'manager', 'staff'] },
                  isActive: { type: 'boolean' },
                },
              },
              example: {
                name: 'Updated Name',
                role: 'admin',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        description: 'Delete a user by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'User ID' },
        ],
        responses: {
          '200': {
            description: 'User deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    // Delivery Men
    '/api/delivery-men': {
      get: {
        tags: ['Delivery Men'],
        summary: 'List delivery men',
        description: 'Get a paginated list of delivery men with optional filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'establishmentId', in: 'query', schema: { type: 'integer' }, description: 'Filter by establishment ID' },
          { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Filter by active status' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in name or email' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Limit number of results' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Offset for pagination' },
        ],
        responses: {
          '200': {
            description: 'List of delivery men',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deliveryMen: { type: 'array', items: { $ref: '#/components/schemas/DeliveryMan' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
      post: {
        tags: ['Delivery Men'],
        summary: 'Create delivery man',
        description: 'Create a new delivery man',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDeliveryMan' },
              example: {
                name: 'Delivery Person',
                email: 'delivery@example.com',
                password: 'securepassword',
                phone: '+1234567890',
                establishmentId: 1,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Delivery man created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deliveryMan: { $ref: '#/components/schemas/DeliveryMan' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/delivery-men/{id}': {
      get: {
        tags: ['Delivery Men'],
        summary: 'Get delivery man by ID',
        description: 'Get a single delivery man by their ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Delivery man ID' },
        ],
        responses: {
          '200': {
            description: 'Delivery man details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deliveryMan: { $ref: '#/components/schemas/DeliveryMan' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Delivery Men'],
        summary: 'Update delivery man',
        description: 'Update an existing delivery man',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Delivery man ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  establishmentId: { type: 'integer' },
                  isActive: { type: 'boolean' },
                },
              },
              example: {
                name: 'Updated Name',
                isActive: true,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Delivery man updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    deliveryMan: { $ref: '#/components/schemas/DeliveryMan' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Delivery Men'],
        summary: 'Delete delivery man',
        description: 'Delete a delivery man by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Delivery man ID' },
        ],
        responses: {
          '200': {
            description: 'Delivery man deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    // Service Providers
    '/api/service-providers': {
      get: {
        tags: ['Service Providers'],
        summary: 'List service providers',
        description: 'Get a paginated list of service providers with optional filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'categoryId', in: 'query', schema: { type: 'integer' }, description: 'Filter by category ID' },
          { name: 'city', in: 'query', schema: { type: 'string' }, description: 'Filter by city' },
          { name: 'state', in: 'query', schema: { type: 'string' }, description: 'Filter by state' },
          { name: 'available', in: 'query', schema: { type: 'boolean' }, description: 'Filter by availability' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in name or email' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Limit number of results' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Offset for pagination' },
        ],
        responses: {
          '200': {
            description: 'List of service providers',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    serviceProviders: { type: 'array', items: { $ref: '#/components/schemas/ServiceProvider' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
      post: {
        tags: ['Service Providers'],
        summary: 'Create service provider',
        description: 'Create a new service provider',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateServiceProvider' },
              example: {
                name: 'Service Provider Name',
                email: 'provider@example.com',
                password: 'securepassword',
                phone: '+1234567890',
                categoryId: 1,
                document: '12345678900',
                address: '123 Main St',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234-567',
                available: true,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Service provider created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    serviceProvider: { $ref: '#/components/schemas/ServiceProvider' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/service-providers/{id}': {
      get: {
        tags: ['Service Providers'],
        summary: 'Get service provider by ID',
        description: 'Get a single service provider by their ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Service provider ID' },
        ],
        responses: {
          '200': {
            description: 'Service provider details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    serviceProvider: { $ref: '#/components/schemas/ServiceProvider' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Service Providers'],
        summary: 'Update service provider',
        description: 'Update an existing service provider',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Service provider ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  categoryId: { type: 'integer' },
                  document: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zipCode: { type: 'string' },
                  available: { type: 'boolean' },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  isActive: { type: 'boolean' },
                },
              },
              example: {
                name: 'Updated Name',
                available: false,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Service provider updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    serviceProvider: { $ref: '#/components/schemas/ServiceProvider' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Service Providers'],
        summary: 'Delete service provider',
        description: 'Delete a service provider by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Service provider ID' },
        ],
        responses: {
          '200': {
            description: 'Service provider deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    // Onboarding Leads
    '/public/onboarding-leads': {
      post: {
        tags: ['Onboarding'],
        summary: 'Create public onboarding lead',
        description: 'Create a new onboarding lead (public endpoint, no auth required)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userType', 'name', 'email', 'phone', 'termsAccepted', 'privacyAccepted'],
                properties: {
                  userType: { type: 'string', enum: ['provider', 'company'] },
                  categoryId: { type: 'integer' },
                  establishmentTypeId: { type: 'integer' },
                  document: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  termsAccepted: { type: 'boolean' },
                  privacyAccepted: { type: 'boolean' },
                },
              },
              example: {
                userType: 'company',
                name: 'Business Owner',
                email: 'owner@example.com',
                phone: '+1234567890',
                establishmentTypeId: 1,
                termsAccepted: true,
                privacyAccepted: true,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Onboarding lead created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    onboardingLead: { $ref: '#/components/schemas/OnboardingLead' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/api/onboarding-leads': {
      get: {
        tags: ['Onboarding'],
        summary: 'List onboarding leads',
        description: 'Get a paginated list of onboarding leads with optional filters',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['new', 'contacted', 'converted', 'rejected'] }, description: 'Filter by status' },
          { name: 'userType', in: 'query', schema: { type: 'string', enum: ['provider', 'company'] }, description: 'Filter by user type' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search in name or email' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Limit number of results' },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 }, description: 'Offset for pagination' },
        ],
        responses: {
          '200': {
            description: 'List of onboarding leads',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    onboardingLeads: { type: 'array', items: { $ref: '#/components/schemas/OnboardingLead' } },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
      post: {
        tags: ['Onboarding'],
        summary: 'Create onboarding lead',
        description: 'Create a new onboarding lead (protected endpoint)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userType', 'name', 'email', 'phone', 'termsAccepted', 'privacyAccepted'],
                properties: {
                  userType: { type: 'string', enum: ['provider', 'company'] },
                  categoryId: { type: 'integer' },
                  establishmentTypeId: { type: 'integer' },
                  document: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  termsAccepted: { type: 'boolean' },
                  privacyAccepted: { type: 'boolean' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Onboarding lead created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    onboardingLead: { $ref: '#/components/schemas/OnboardingLead' },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/onboarding-leads/{id}': {
      get: {
        tags: ['Onboarding'],
        summary: 'Get onboarding lead by ID',
        description: 'Get a single onboarding lead by their ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Onboarding lead ID' },
        ],
        responses: {
          '200': {
            description: 'Onboarding lead details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    onboardingLead: { $ref: '#/components/schemas/OnboardingLead' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Onboarding'],
        summary: 'Update onboarding lead',
        description: 'Update an existing onboarding lead',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Onboarding lead ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['new', 'contacted', 'converted', 'rejected'] },
                  contactedAt: { type: 'string', format: 'date-time' },
                  notes: { type: 'string' },
                },
              },
              example: {
                status: 'contacted',
                notes: 'Called the lead, interested in the platform',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Onboarding lead updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    onboardingLead: { $ref: '#/components/schemas/OnboardingLead' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Onboarding'],
        summary: 'Delete onboarding lead',
        description: 'Delete an onboarding lead by ID',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Onboarding lead ID' },
        ],
        responses: {
          '200': {
            description: 'Onboarding lead deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
  tags: [
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'Establishments', description: 'Establishment management' },
    { name: 'Users', description: 'User management' },
    { name: 'Delivery Men', description: 'Delivery personnel management' },
    { name: 'Service Providers', description: 'Service provider management' },
    { name: 'Onboarding', description: 'Onboarding lead management' },
    { name: 'Auth', description: 'Authentication endpoints' },
  ],
};

// Alias for easier import
export const aloApiSpec = aloManagerApiSpec;
