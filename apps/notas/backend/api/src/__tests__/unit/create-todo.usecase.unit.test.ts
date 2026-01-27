/**
 * Unit Tests for CreateTodo Use Case
 *
 * Tests the create todo use case with mocked dependencies.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { CreateTodoUseCase } from '../../use-cases/create-todo.usecase';
import { MockTodoRepository, MockEventBus, MockDomainEventEmitter, MockBusinessMetricEmitter } from '../../test/mocks';
import type { AppResult } from '@oxlayer/snippets/use-cases';

describe('CreateTodoUseCase', () => {
  let useCase: CreateTodoUseCase;
  let mockRepo: MockTodoRepository;
  let mockEventBus: MockEventBus;
  let mockClickhouse: MockDomainEventEmitter;

  beforeEach(() => {
    mockRepo = new MockTodoRepository();
    mockEventBus = new MockEventBus();
    mockClickhouse = new MockDomainEventEmitter();
    const mockBusinessMetrics = new MockBusinessMetricEmitter();
    useCase = new CreateTodoUseCase(mockRepo, mockEventBus, mockClickhouse, mockBusinessMetrics);
  });

  // Helper to narrow result type
  function assertSuccess<T>(result: AppResult<T>): asserts result is { success: true; data: T } {
    expect(result.success).toBe(true);
  }

  it('should create a new todo successfully', async () => {
    const input = {
      title: 'New Todo',
      description: 'Test description',
      userId: 'user-1',
    };

    const result = await useCase.execute(input);
    assertSuccess(result);

    expect(result.data).toMatchObject({
      id: expect.any(String),
      title: 'New Todo',
      description: 'Test description',
      status: 'pending',
      createdAt: expect.any(Date),
    });
  });

  it('should save todo to repository', async () => {
    const input = {
      title: 'New Todo',
      userId: 'user-1',
    };

    const result = await useCase.execute(input);
    assertSuccess(result);

    const saved = await mockRepo.findById(result.data.id);
    expect(saved).toBeDefined();
    expect(saved?.title).toBe('New Todo');
  });

  it('should publish Todo.Created event', async () => {
    const input = {
      title: 'New Todo',
      description: 'Test description',
      userId: 'user-1',
      dueDate: new Date('2024-12-31'),
    };

    const result = await useCase.execute(input);
    assertSuccess(result);

    expect(mockEventBus.wasPublished('Todo.Created')).toBe(true);
    expect(mockEventBus.count('Todo.Created')).toBe(1);

    const events = mockEventBus.getEvents('Todo.Created');
    expect(events[0].event).toMatchObject({
      eventType: 'Todo.Created',
      payload: {
        aggregateId: result.data.id,
        userId: 'user-1',
        title: 'New Todo',
        description: 'Test description',
        dueDate: new Date('2024-12-31'),
      },
    });
  });

  it('should create todo with due date', async () => {
    const dueDate = new Date('2024-12-31');
    const input = {
      title: 'Todo with Due Date',
      userId: 'user-1',
      dueDate,
    };

    const result = await useCase.execute(input);
    assertSuccess(result);

    expect(result.data.dueDate).toEqual(dueDate);

    const saved = await mockRepo.findById(result.data.id);
    expect(saved?.dueDate).toEqual(dueDate);
  });

  it('should create todo without optional fields', async () => {
    const input = {
      title: 'Simple Todo',
      userId: 'user-1',
    };

    const result = await useCase.execute(input);
    assertSuccess(result);

    expect(result.data.description).toBeUndefined();
    expect(result.data.dueDate).toBeUndefined();
  });
});
