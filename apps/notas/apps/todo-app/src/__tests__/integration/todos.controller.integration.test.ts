/**
 * Integration Tests for Todos Controller
 *
 * Tests the full HTTP request/response flow.
 */

import { describe, beforeEach, it, expect } from 'bun:test';
import { Hono } from 'hono';
import { TodosController } from '../../controllers/todos.controller';
import { CreateTodoUseCase, GetTodosUseCase, UpdateTodoUseCase, DeleteTodoUseCase } from '../../use-cases';
import { MockTodoRepository, MockEventBus, MockDomainEventEmitter, MockBusinessMetricEmitter } from '../../test/mocks';
import { createTodoBuilder } from '../../test/builders/todo.builder';

describe('Todos Controller Integration Tests', () => {
  let app: Hono;
  let mockRepo: MockTodoRepository;
  let mockEventBus: MockEventBus;
  let mockClickhouse: MockDomainEventEmitter;
  let controller: TodosController;

  beforeEach(() => {
    mockRepo = new MockTodoRepository();
    mockEventBus = new MockEventBus();
    mockClickhouse = new MockDomainEventEmitter();
    const mockBusinessMetrics = new MockBusinessMetricEmitter();

    // Create use cases with mocks
    const createTodoUseCase = new CreateTodoUseCase(
      mockRepo,
      mockEventBus,
      mockClickhouse,
      mockBusinessMetrics
    );
    const getTodosUseCase = new GetTodosUseCase(mockRepo);
    const updateTodoUseCase = new UpdateTodoUseCase(
      mockRepo,
      mockEventBus,
      mockClickhouse,
      mockBusinessMetrics
    );
    const deleteTodoUseCase = new DeleteTodoUseCase(
      mockRepo,
      mockEventBus,
      mockClickhouse,
      mockBusinessMetrics
    );

    controller = new TodosController(
      createTodoUseCase,
      getTodosUseCase,
      updateTodoUseCase,
      deleteTodoUseCase
    );

    // Create Hono app
    app = new Hono();

    // Mock auth middleware context
    app.use('*', async (c, next) => {
      c.set('userId', 'user-1');
      await next();
    });

    // Setup routes
    app.get('/api/todos', (c) => controller.getTodos(c));
    app.get('/api/todos/:id', (c) => controller.getTodoById(c));
    app.post('/api/todos', (c) => controller.createTodo(c));
    app.patch('/api/todos/:id', (c) => controller.updateTodo(c));
    app.delete('/api/todos/:id', (c) => controller.deleteTodo(c));
    app.patch('/api/todos/:id/complete', (c) => controller.completeTodo(c));
  });

  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const response = await app.request('/api/todos');
      const data = await response.json() as { todos: unknown[] };

      expect(response.status).toBe(200);
      expect(data.todos).toEqual([]);
    });

    it('should return all todos for user', async () => {
      mockRepo.seed([
        createTodoBuilder().withId('todo-1').withTitle('Todo 1').withUserId('user-1').build(),
        createTodoBuilder().withId('todo-2').withTitle('Todo 2').withUserId('user-1').build(),
      ]);

      const response = await app.request('/api/todos');
      const data = await response.json() as { todos: unknown[] };

      expect(response.status).toBe(200);
      expect(data.todos).toHaveLength(2);
    });

    it('should filter by status query param', async () => {
      mockRepo.seed([
        createTodoBuilder().withId('todo-1').pending().withUserId('user-1').build(),
        createTodoBuilder().withId('todo-2').completed().withUserId('user-1').build(),
      ]);

      const response = await app.request('/api/todos?status=pending');
      const data = await response.json() as { todos: Array<{ status: string }> };

      expect(response.status).toBe(200);
      expect(data.todos).toHaveLength(1);
      expect(data.todos[0].status).toBe('pending');
    });
  });

  describe('GET /api/todos/:id', () => {
    it('should return 404 for non-existent todo', async () => {
      const response = await app.request('/api/todos/non-existent');
      const data = await response.json() as { error?: string };

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('should return todo by id', async () => {
      const todo = createTodoBuilder().withId('todo-1').withTitle('Test Todo').withUserId('user-1').build();
      mockRepo.seed([todo]);

      const response = await app.request('/api/todos/todo-1');
      const data = await response.json() as { todo: { id: string; title: string } };

      expect(response.status).toBe(200);
      expect(data.todo.id).toBe('todo-1');
      expect(data.todo.title).toBe('Test Todo');
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const requestBody = {
        title: 'New Todo',
        description: 'Test description',
      };

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as {
        todo: { title: string; description: string; id: string };
      };

      expect(response.status).toBe(201);
      expect(data.todo.title).toBe('New Todo');
      expect(data.todo.description).toBe('Test description');
      expect(data.todo.id).toBeDefined();
    });

    it('should return 422 for invalid input', async () => {
      const requestBody = {
        title: '', // Invalid: empty title
      };

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(422);
    });

    it('should create todo with due date', async () => {
      const requestBody = {
        title: 'Todo with Due Date',
        dueDate: new Date('2024-12-31').toISOString(),
      };

      const response = await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as { todo: { dueDate: string } };

      expect(response.status).toBe(201);
      expect(data.todo.dueDate).toBeDefined();
    });
  });

  describe('PATCH /api/todos/:id', () => {
    it('should update todo title', async () => {
      const todo = createTodoBuilder().withId('todo-1').withUserId('user-1').build();
      mockRepo.seed([todo]);

      const requestBody = {
        title: 'Updated Title',
      };

      const response = await app.request('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as { todo: { title: string } };

      expect(response.status).toBe(200);
      expect(data.todo.title).toBe('Updated Title');
    });

    it('should mark todo as completed', async () => {
      const todo = createTodoBuilder().withId('todo-1').pending().withUserId('user-1').build();
      mockRepo.seed([todo]);

      const requestBody = {
        status: 'completed',
      };

      const response = await app.request('/api/todos/todo-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json() as {
        todo: { status: string; completedAt: string };
      };

      expect(response.status).toBe(200);
      expect(data.todo.status).toBe('completed');
      expect(data.todo.completedAt).toBeDefined();
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await app.request('/api/todos/non-existent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/todos/:id/complete', () => {
    it('should mark todo as completed', async () => {
      const todo = createTodoBuilder().withId('todo-1').pending().withUserId('user-1').build();
      mockRepo.seed([todo]);

      const response = await app.request('/api/todos/todo-1/complete', {
        method: 'PATCH',
      });

      const data = await response.json() as {
        todo: { status: string; completedAt: string };
      };

      expect(response.status).toBe(200);
      expect(data.todo.status).toBe('completed');
      expect(data.todo.completedAt).toBeDefined();
    });

    it('should publish Todo.Completed event', async () => {
      const todo = createTodoBuilder().withId('todo-1').pending().withUserId('user-1').build();
      mockRepo.seed([todo]);

      await app.request('/api/todos/todo-1/complete', {
        method: 'PATCH',
      });

      expect(mockEventBus.wasPublished('Todo.Completed')).toBe(true);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete todo', async () => {
      const todo = createTodoBuilder().withId('todo-1').withUserId('user-1').build();
      mockRepo.seed([todo]);

      const response = await app.request('/api/todos/todo-1', {
        method: 'DELETE',
      });

      const data = await response.json() as { message: string };

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();

      const deleted = await mockRepo.findById('todo-1');
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent todo', async () => {
      const response = await app.request('/api/todos/non-existent', {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });

    it('should publish Todo.Deleted event', async () => {
      const todo = createTodoBuilder().withId('todo-1').withUserId('user-1').build();
      mockRepo.seed([todo]);

      await app.request('/api/todos/todo-1', {
        method: 'DELETE',
      });

      expect(mockEventBus.wasPublished('Todo.Deleted')).toBe(true);
    });
  });

  describe('Event Publishing', () => {
    it('should publish events for all operations', async () => {
      // Create
      await app.request('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Todo' }),
      });
      expect(mockEventBus.count('Todo.Created')).toBe(1);

      // Update
      const response = await app.request('/api/todos', {
        method: 'GET',
      });
      const { todos } = await response.json() as { todos: Array<{ id: string }> };
      const todoId = todos[0].id;

      await app.request(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      });
      expect(mockEventBus.count('Todo.Updated')).toBeGreaterThan(0);

      // Complete
      await app.request(`/api/todos/${todoId}/complete`, {
        method: 'PATCH',
      });
      expect(mockEventBus.count('Todo.Completed')).toBeGreaterThan(0);

      // Delete
      await app.request(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });
      expect(mockEventBus.count('Todo.Deleted')).toBeGreaterThan(0);
    });
  });

  describe('GET /public/todos (Public Endpoint)', () => {
    beforeEach(() => {
      // Setup public route (no auth middleware)
      app.get('/public/todos', (c) => controller.getAllTodosPublic(c));
    });

    it('should return all todos from all users', async () => {
      mockRepo.seed([
        createTodoBuilder().withId('todo-1').withTitle('User 1 Todo').withUserId('user-1').pending().build(),
        createTodoBuilder().withId('todo-2').withTitle('User 2 Todo').withUserId('user-2').inProgress().build(),
        createTodoBuilder().withId('todo-3').withTitle('User 3 Todo').withUserId('user-3').completed().build(),
      ]);

      const response = await app.request('/public/todos');
      const data = await response.json() as {
        todos: unknown[];
        meta: { total: number; public: boolean; authentication: string };
      };

      expect(response.status).toBe(200);
      expect(data.todos).toHaveLength(3);
      expect(data.meta.total).toBe(3);
      expect(data.meta.public).toBe(true);
      expect(data.meta.authentication).toBe('none');
    });

    it('should return empty array when no todos exist', async () => {
      const response = await app.request('/public/todos');
      const data = await response.json() as {
        todos: unknown[];
        meta: { total: number };
      };

      expect(response.status).toBe(200);
      expect(data.todos).toEqual([]);
      expect(data.meta.total).toBe(0);
    });

    it('should filter by status query parameter', async () => {
      mockRepo.seed([
        createTodoBuilder().withId('todo-1').withTitle('Pending Todo').withUserId('user-1').pending().build(),
        createTodoBuilder().withId('todo-2').withTitle('Completed Todo').withUserId('user-2').completed().build(),
        createTodoBuilder().withId('todo-3').withTitle('Another Pending').withUserId('user-3').pending().build(),
      ]);

      const response = await app.request('/public/todos?status=pending');
      const data = await response.json() as {
        todos: Array<{ status: string }>;
        meta: { total: number };
      };

      expect(response.status).toBe(200);
      expect(data.todos).toHaveLength(2);
      expect(data.todos.every((t) => t.status === 'pending')).toBe(true);
      expect(data.meta.total).toBe(2);
    });

    it('should filter by search query parameter', async () => {
      mockRepo.seed([
        createTodoBuilder().withId('todo-1').withTitle('Important Task').withUserId('user-1').build(),
        createTodoBuilder().withId('todo-2').withTitle('Regular Todo').withUserId('user-2').build(),
        createTodoBuilder().withId('todo-3').withTitle('Important Meeting').withUserId('user-3').build(),
      ]);

      const response = await app.request('/public/todos?search=Important');
      const data = await response.json() as {
        todos: Array<{ title: string }>;
        meta: { total: number };
      };

      expect(response.status).toBe(200);
      expect(data.todos).toHaveLength(2);
      expect(data.todos.every((t) => t.title.includes('Important'))).toBe(true);
      expect(data.meta.total).toBe(2);
    });

    it('should combine multiple filters', async () => {
      mockRepo.seed([
        createTodoBuilder().withId('todo-1').withTitle('Work Task').withUserId('user-1').pending().build(),
        createTodoBuilder().withId('todo-2').withTitle('Work Meeting').withUserId('user-2').completed().build(),
        createTodoBuilder().withId('todo-3').withTitle('Personal Task').withUserId('user-3').pending().build(),
      ]);

      const response = await app.request('/public/todos?status=pending&search=Work');
      const data = await response.json() as {
        todos: Array<{ title: string; status: string }>;
        meta: { total: number };
      };

      expect(response.status).toBe(200);
      expect(data.todos).toHaveLength(1);
      expect(data.todos[0].title).toBe('Work Task');
      expect(data.todos[0].status).toBe('pending');
      expect(data.meta.total).toBe(1);
    });

    it('should return validation error for invalid query parameters', async () => {
      const response = await app.request('/public/todos?status=invalid-status');
      const data = await response.json() as { error?: string };

      expect(response.status).toBe(422);
      expect(data.error).toBeDefined();
    });

    it('should work without authentication', async () => {
      mockRepo.seed([
        createTodoBuilder().withId('todo-1').withTitle('Public Todo').withUserId('any-user').build(),
      ]);

      // Request without setting userId in context
      const response = await app.request('/public/todos');
      const data = await response.json() as {
        todos: Array<{ title: string }>;
        meta: { public: boolean; authentication: string };
      };

      expect(response.status).toBe(200);
      expect(data.todos).toHaveLength(1);
      expect(data.todos[0].title).toBe('Public Todo');
      expect(data.meta.public).toBe(true);
      expect(data.meta.authentication).toBe('none');
    });
  });
});
