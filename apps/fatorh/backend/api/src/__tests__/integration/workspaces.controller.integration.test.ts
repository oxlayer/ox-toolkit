/**
 * Integration Tests for Workspaces Controller
 *
 * Tests the full HTTP request/response flow for Workspace CRUD operations.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Hono } from 'hono';
import { WorkspacesController } from '../../controllers/workspaces/workspaces.controller.js';
import { MockWorkspaceRepository } from '../../test/mocks';
import { createWorkspaceBuilder } from '../../test/builders';

// Test constants with valid UUIDs
const TEST_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const TEST_ORGANIZATION_ID = '550e8400-e29b-41d4-a716-446655440002';
const TEST_ORGANIZATION_2_ID = '550e8400-e29b-41d4-a716-446655440003';

// Mock use cases
class MockCreateWorkspaceUseCase {
  constructor(private workspaceRepo: MockWorkspaceRepository) {}

  async execute(input: any) {
    return this.workspaceRepo.create({
      id: crypto.randomUUID(),
      ...input,
    });
  }
}

class MockGetWorkspaceUseCase {
  constructor(private workspaceRepo: MockWorkspaceRepository) {}

  async execute(input: any) {
    return this.workspaceRepo.findById(input.id);
  }
}

class MockListWorkspacesUseCase {
  constructor(private workspaceRepo: MockWorkspaceRepository) {}

  async execute(input: any) {
    return this.workspaceRepo.list(input);
  }
}

class MockUpdateWorkspaceUseCase {
  constructor(private workspaceRepo: MockWorkspaceRepository) {}

  async execute(input: any) {
    return this.workspaceRepo.update(input.id, {
      name: input.name,
      description: input.description,
    });
  }
}

class MockDeleteWorkspaceUseCase {
  constructor(private workspaceRepo: MockWorkspaceRepository) {}

  async execute(input: any) {
    await this.workspaceRepo.softDelete(input.id);
  }
}

describe('Workspaces Controller Integration Tests', () => {
  let app: Hono;
  let mockWorkspaceRepo: MockWorkspaceRepository;
  let controller: WorkspacesController;

  beforeEach(() => {
    mockWorkspaceRepo = new MockWorkspaceRepository();

    // Create use cases with mocks
    const createWorkspaceUseCase = new MockCreateWorkspaceUseCase(mockWorkspaceRepo);
    const getWorkspaceUseCase = new MockGetWorkspaceUseCase(mockWorkspaceRepo);
    const listWorkspacesUseCase = new MockListWorkspacesUseCase(mockWorkspaceRepo);
    const updateWorkspaceUseCase = new MockUpdateWorkspaceUseCase(mockWorkspaceRepo);
    const deleteWorkspaceUseCase = new MockDeleteWorkspaceUseCase(mockWorkspaceRepo);

    controller = new WorkspacesController(
      createWorkspaceUseCase as any,
      getWorkspaceUseCase as any,
      listWorkspacesUseCase as any,
      updateWorkspaceUseCase as any,
      deleteWorkspaceUseCase as any
    );

    // Create Hono app
    app = new Hono();

    // Setup routes
    app.post('/api/workspaces', (c) => controller.create(c));
    app.get('/api/workspaces', (c) => controller.list(c));
    app.get('/api/workspaces/:id', (c) => controller.getById(c));
    app.patch('/api/workspaces/:id', (c) => controller.update(c));
    app.delete('/api/workspaces/:id', (c) => controller.delete(c));
  });

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', async () => {
      const requestBody = {
        name: 'Test Workspace',
        description: 'A test workspace',
        organizationId: TEST_ORGANIZATION_ID,
      };

      const response = await app.request('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Workspace created successfully');
      expect(data.workspace.id).toBeDefined();
      expect(data.workspace.name).toBe('Test Workspace');
      expect(data.workspace.description).toBe('A test workspace');
      expect(data.workspace.organizationId).toBe(TEST_ORGANIZATION_ID);
    });

    it('should return 422 for missing name', async () => {
      const requestBody = {
        description: 'A test workspace',
        organizationId: TEST_ORGANIZATION_ID,
      };

      const response = await app.request('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should create workspace without description', async () => {
      const requestBody = {
        name: 'Minimal Workspace',
        organizationId: TEST_ORGANIZATION_ID,
      };

      const response = await app.request('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workspace.name).toBe('Minimal Workspace');
      // When description is not provided, Zod sets it to undefined
      expect(data.workspace.description).toBeUndefined();
    });
  });

  describe('GET /api/workspaces/:id', () => {
    it('should return workspace by ID', async () => {
      const workspace = createWorkspaceBuilder()
        .withId(TEST_WORKSPACE_ID)
        .withName('Test Workspace')
        .withDescription('Test description')
        .withOrganizationId(TEST_ORGANIZATION_ID)
        .build();

      await mockWorkspaceRepo.save(workspace);

      const response = await app.request(`/api/workspaces/${TEST_WORKSPACE_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Workspace retrieved successfully');
      expect(data.workspace.id).toBe(TEST_WORKSPACE_ID);
      expect(data.workspace.name).toBe('Test Workspace');
    });

    it('should return 404 for non-existent workspace', async () => {
      const response = await app.request('/api/workspaces/550e8400-e29b-41d4-a716-446655449999');
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for invalid workspace ID', async () => {
      const response = await app.request('/api/workspaces/not-a-uuid');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/workspaces', () => {
    it('should return empty array when no workspaces exist', async () => {
      const response = await app.request('/api/workspaces');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.workspaces).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return all workspaces', async () => {
      await mockWorkspaceRepo.save(
        createWorkspaceBuilder().withId(TEST_WORKSPACE_ID).withName('Workspace 1').withOrganizationId(TEST_ORGANIZATION_ID).build()
      );
      await mockWorkspaceRepo.save(
        createWorkspaceBuilder().withId(TEST_ORGANIZATION_2_ID).withName('Workspace 2').withOrganizationId(TEST_ORGANIZATION_ID).build()
      );

      const response = await app.request('/api/workspaces');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workspaces).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter by organization ID', async () => {
      await mockWorkspaceRepo.save(
        createWorkspaceBuilder().withId(TEST_WORKSPACE_ID).withName('Workspace 1').withOrganizationId(TEST_ORGANIZATION_ID).build()
      );
      await mockWorkspaceRepo.save(
        createWorkspaceBuilder().withId(TEST_ORGANIZATION_2_ID).withName('Workspace 2').withOrganizationId(TEST_ORGANIZATION_2_ID).build()
      );

      const response = await app.request(`/api/workspaces?organizationId=${TEST_ORGANIZATION_ID}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workspaces).toHaveLength(1);
      expect(data.workspaces[0].organizationId).toBe(TEST_ORGANIZATION_ID);
    });

    it('should paginate results', async () => {
      // Create 5 workspaces
      for (let i = 1; i <= 5; i++) {
        await mockWorkspaceRepo.save(
          createWorkspaceBuilder()
            .withId(crypto.randomUUID())
            .withName(`Workspace ${i}`)
            .withOrganizationId(TEST_ORGANIZATION_ID)
            .build()
        );
      }

      const response = await app.request('/api/workspaces?limit=2&offset=1');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workspaces).toHaveLength(2);
      expect(data.total).toBe(5);
      expect(data.limit).toBe(2);
      expect(data.offset).toBe(1);
    });
  });

  describe('PATCH /api/workspaces/:id', () => {
    it('should update workspace name', async () => {
      const workspace = createWorkspaceBuilder()
        .withId(TEST_WORKSPACE_ID)
        .withName('Original Name')
        .withDescription('Original description')
        .withOrganizationId(TEST_ORGANIZATION_ID)
        .build();

      await mockWorkspaceRepo.save(workspace);

      const requestBody = {
        name: 'Updated Name',
      };

      const response = await app.request(`/api/workspaces/${TEST_WORKSPACE_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Workspace updated successfully');
      expect(data.workspace.name).toBe('Updated Name');
      expect(data.workspace.description).toBe('Original description');
    });

    it('should update workspace description', async () => {
      const workspace = createWorkspaceBuilder()
        .withId(TEST_WORKSPACE_ID)
        .withName('Test Workspace')
        .withDescription('Original description')
        .withOrganizationId(TEST_ORGANIZATION_ID)
        .build();

      await mockWorkspaceRepo.save(workspace);

      const requestBody = {
        description: 'Updated description',
      };

      const response = await app.request(`/api/workspaces/${TEST_WORKSPACE_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.workspace.description).toBe('Updated description');
    });

    it('should return 404 for non-existent workspace', async () => {
      const requestBody = {
        name: 'Updated Name',
      };

      const response = await app.request('/api/workspaces/550e8400-e29b-41d4-a716-446655449999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/workspaces/:id', () => {
    it('should soft delete workspace', async () => {
      const workspace = createWorkspaceBuilder()
        .withId(TEST_WORKSPACE_ID)
        .withName('Test Workspace')
        .withOrganizationId(TEST_ORGANIZATION_ID)
        .build();

      await mockWorkspaceRepo.save(workspace);

      const response = await app.request(`/api/workspaces/${TEST_WORKSPACE_ID}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Workspace deleted successfully');

      // Verify workspace is soft deleted
      const deleted = await mockWorkspaceRepo.findById(TEST_WORKSPACE_ID);
      expect(deleted).toBeNull(); // Soft deleted workspaces are filtered out
    });

    it('should return 404 for non-existent workspace', async () => {
      const response = await app.request('/api/workspaces/550e8400-e29b-41d4-a716-446655449999', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});
