/**
 * Unit Tests for DeleteTodo Use Case
 *
 * Tests the delete todo use case with various scenarios.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { DeleteTodoUseCase } from '../../use-cases/delete-todo.usecase';
import { MockTodoRepository, MockEventBus, MockDomainEventEmitter, MockBusinessMetricEmitter } from '../../test/mocks';
import { createTodoBuilder } from '../../test/builders/todo.builder';
import type { AppResult } from '@oxlayer/snippets/use-cases';

describe('DeleteTodoUseCase', () => {
  let useCase: DeleteTodoUseCase;
  let mockRepo: MockTodoRepository;
  let mockEventBus: MockEventBus;
  let mockClickhouse: MockDomainEventEmitter;

  beforeEach(() => {
    mockRepo = new MockTodoRepository();
    mockEventBus = new MockEventBus();
    mockClickhouse = new MockDomainEventEmitter();
    const mockBusinessMetrics = new MockBusinessMetricEmitter();
    useCase = new DeleteTodoUseCase(mockRepo, mockEventBus, mockClickhouse, mockBusinessMetrics);
  });

  // Helper to narrow result type
  function assertSuccess<T>(result: AppResult<T>): asserts result is { success: true; data: T } {
    expect(result.success).toBe(true);
  }

  function assertError<T>(result: AppResult<T>): asserts result is { success: false; error: { code: string; message: string } } {
    expect(result.success).toBe(false);
  }

  it('should delete a todo successfully', async () => {
    const existingTodo = createTodoBuilder().build();
    mockRepo.seed([existingTodo]);

    const result = await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
    });

    assertSuccess(result);
    expect(result.data.deleted).toBe(true);

    const deleted = await mockRepo.findById(existingTodo.id);
    expect(deleted).toBeNull();
  });

  it('should publish Todo.Deleted event', async () => {
    const existingTodo = createTodoBuilder().build();
    mockRepo.seed([existingTodo]);

    await useCase.execute({
      id: existingTodo.id,
      userId: existingTodo.userId,
    });

    expect(mockEventBus.wasPublished('Todo.Deleted')).toBe(true);

    const events = mockEventBus.getEvents('Todo.Deleted');
    expect(events[0].event).toMatchObject({
      eventType: 'Todo.Deleted',
      payload: {
        aggregateId: existingTodo.id,
        userId: existingTodo.userId,
      },
    });
  });

  it('should return not found for non-existent todo', async () => {
    const result = await useCase.execute({
      id: 'non-existent',
      userId: 'user-1',
    });

    assertError(result);
    expect(result.error.code).toBe('NOT_FOUND');
  });
});
