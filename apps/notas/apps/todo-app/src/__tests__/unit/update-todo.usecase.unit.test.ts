/**
 * Unit Tests for UpdateTodo Use Case
 *
 * Tests the update todo use case with various scenarios.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { UpdateTodoUseCase } from '../../use-cases/update-todo.usecase';
import { MockTodoRepository, MockEventBus, MockDomainEventEmitter, MockBusinessMetricEmitter } from '../../test/mocks';
import { createTodoBuilder } from '../../test/builders/todo.builder';
import type { AppResult } from '@oxlayer/snippets/use-cases';

describe('UpdateTodoUseCase', () => {
  let useCase: UpdateTodoUseCase;
  let mockRepo: MockTodoRepository;
  let mockEventBus: MockEventBus;
  let mockClickhouse: MockDomainEventEmitter;

  beforeEach(() => {
    mockRepo = new MockTodoRepository();
    mockEventBus = new MockEventBus();
    mockClickhouse = new MockDomainEventEmitter();
    const mockBusinessMetrics = new MockBusinessMetricEmitter();
    useCase = new UpdateTodoUseCase(mockRepo, mockEventBus, mockClickhouse, mockBusinessMetrics);
  });

  // Helper to narrow result type
  function assertSuccess<T>(result: AppResult<T>): asserts result is { success: true; data: T } {
    expect(result.success).toBe(true);
  }

  function assertError<T>(result: AppResult<T>): asserts result is { success: false; error: { code: string; message: string } } {
    expect(result.success).toBe(false);
  }

  it('should update todo title', async () => {
    const existingTodo = createTodoBuilder().build();
    mockRepo.seed([existingTodo]);

    const result = await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
      title: 'Updated Title',
    });

    assertSuccess(result);
    expect(result.data.title).toBe('Updated Title');

    const updated = await mockRepo.findById(existingTodo.id);
    expect(updated?.title).toBe('Updated Title');
  });

  it('should update todo description', async () => {
    const existingTodo = createTodoBuilder().build();
    mockRepo.seed([existingTodo]);

    const result = await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
      description: 'Updated description',
    });

    assertSuccess(result);
    expect(result.data.description).toBe('Updated description');
  });

  it('should mark todo as completed', async () => {
    const existingTodo = createTodoBuilder().pending().build();
    mockRepo.seed([existingTodo]);

    const result = await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
      status: 'completed',
    });

    assertSuccess(result);
    expect(result.data.status).toBe('completed');
    expect(result.data.completedAt).toBeInstanceOf(Date);

    const updated = await mockRepo.findById(existingTodo.id);
    expect(updated?.status).toBe('completed');
    expect(updated?.completedAt).toBeDefined();
  });

  it('should publish Todo.Updated event', async () => {
    const existingTodo = createTodoBuilder().build();
    mockRepo.seed([existingTodo]);

    await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
      title: 'Updated Title',
    });

    expect(mockEventBus.wasPublished('Todo.Updated')).toBe(true);

    const events = mockEventBus.getEvents('Todo.Updated');
    expect(events[0].event).toMatchObject({
      eventType: 'Todo.Updated',
      payload: {
        aggregateId: existingTodo.id,
        userId: existingTodo.userId,
        changes: { title: 'Updated Title' },
      },
    });
  });

  it('should return not found for non-existent todo', async () => {
    const result = await useCase.execute({
      id: 'non-existent',
      userId: 'user-1',
      title: 'Updated',
    });

    assertError(result);
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('should not update when no changes provided', async () => {
    const existingTodo = createTodoBuilder().build();
    mockRepo.seed([existingTodo]);

    const result = await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
    });

    assertSuccess(result);
    // No event should be published when no changes
    expect(mockEventBus.count('Todo.Updated')).toBe(0);
  });

  it('should update multiple fields at once', async () => {
    const existingTodo = createTodoBuilder().build();
    mockRepo.seed([existingTodo]);

    const dueDate = new Date('2024-12-31');
    const result = await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
      title: 'New Title',
      description: 'New Description',
      status: 'in_progress',
      dueDate,
    });

    assertSuccess(result);
    expect(result.data.title).toBe('New Title');
    expect(result.data.description).toBe('New Description');
    expect(result.data.status).toBe('in_progress');
    expect(result.data.dueDate).toEqual(dueDate);
  });
});
