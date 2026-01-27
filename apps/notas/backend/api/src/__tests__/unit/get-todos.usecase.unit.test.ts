/**
 * Unit Tests for GetTodos Use Case
 *
 * Tests the get todos use case with various filters.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { GetTodosUseCase } from '../../use-cases/get-todos.usecase';
import { MockTodoRepository } from '../../test/mocks';
import { createTodoBuilder } from '../../test/builders/todo.builder';
import type { AppResult } from '@oxlayer/snippets/use-cases';

describe('GetTodosUseCase', () => {
  let useCase: GetTodosUseCase;
  let mockRepo: MockTodoRepository;

  beforeEach(() => {
    mockRepo = new MockTodoRepository();
    useCase = new GetTodosUseCase(mockRepo);

    // Seed test data
    mockRepo.seed([
      createTodoBuilder().withId('todo-1').withTitle('Todo 1').pending().withUserId('user-1').build(),
      createTodoBuilder().withId('todo-2').withTitle('Todo 2').inProgress().withUserId('user-1').build(),
      createTodoBuilder().withId('todo-3').withTitle('Todo 3').completed().withUserId('user-1').build(),
      createTodoBuilder().withId('todo-4').withTitle('Todo 4').pending().withUserId('user-2').build(),
      createTodoBuilder().withId('todo-5').withTitle('Search Match').pending().withUserId('user-1').build(),
    ]);
  });

  // Helper to narrow result type
  function assertSuccess<T>(result: AppResult<T>): asserts result is { success: true; data: T } {
    expect(result.success).toBe(true);
  }

  it('should return all todos', async () => {
    const result = await useCase.execute({});
    assertSuccess(result);

    expect(result.data.items).toHaveLength(5);
    expect(result.data.total).toBe(5);
  });

  it('should filter todos by status', async () => {
    const result = await useCase.execute({
      filters: { status: 'pending' },
    });
    assertSuccess(result);

    expect(result.data.items).toHaveLength(3);
    expect(result.data.items.every((t) => t.status === 'pending')).toBe(true);
  });

  it('should filter todos by user', async () => {
    const result = await useCase.execute({
      userId: 'user-2',
    });
    assertSuccess(result);

    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0].id).toBe('todo-4');
  });

  it('should filter todos by search term', async () => {
    const result = await useCase.execute({
      filters: { search: 'Search' },
    });
    assertSuccess(result);

    expect(result.data.items).toHaveLength(1);
    expect(result.data.items[0].title).toContain('Search');
  });

  it('should apply multiple filters', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      filters: {
        status: 'pending',
      },
    });
    assertSuccess(result);

    expect(result.data.items.length).toBeGreaterThan(0);
    expect(result.data.items.every((t) => t.status === 'pending' && t.userId === 'user-1')).toBe(true);
  });

  it('should return empty array when no todos match', async () => {
    const result = await useCase.execute({
      userId: 'user-2',
      filters: { status: 'completed' },
    });
    assertSuccess(result);

    expect(result.data.items).toHaveLength(0);
  });

  it('should map todos to output format', async () => {
    const result = await useCase.execute({});
    assertSuccess(result);

    expect(result.data.items[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      status: expect.any(String),
      userId: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
