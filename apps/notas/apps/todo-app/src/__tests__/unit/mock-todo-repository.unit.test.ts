/**
 * Unit Tests for Mock Todo Repository
 *
 * Tests the mock repository to ensure all methods work correctly.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MockTodoRepository } from '../../test/mocks/mock-todo-repository';
import { createTodoBuilder } from '../../test/builders/todo.builder';

describe('MockTodoRepository', () => {
  let repo: MockTodoRepository;

  beforeEach(() => {
    repo = new MockTodoRepository();
  });

  describe('seed', () => {
    it('should seed todos into repository', async () => {
      const todos = [
        createTodoBuilder().withId('todo-1').build(),
        createTodoBuilder().withId('todo-2').build(),
      ];

      repo.seed(todos);

      expect(await repo.findById('todo-1')).not.toBeNull();
      expect(await repo.findById('todo-2')).not.toBeNull();
    });

    it('should overwrite existing todos with same ID', async () => {
      const original = createTodoBuilder().withId('todo-1').withTitle('Original').build();
      const updated = createTodoBuilder().withId('todo-1').withTitle('Updated').build();

      repo.seed([original]);
      repo.seed([updated]);

      const found = await repo.findById('todo-1');
      expect(found?.title).toBe('Updated');
    });
  });

  describe('clear', () => {
    it('should clear all todos', async () => {
      repo.seed([createTodoBuilder().withId('todo-1').build()]);

      repo.clear();

      expect(await repo.findById('todo-1')).toBeNull();
      expect(await repo.findAll()).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('should find existing todo by ID', async () => {
      const todo = createTodoBuilder().withId('todo-1').build();
      repo.seed([todo]);

      const found = await repo.findById('todo-1');

      expect(found).toEqual(todo);
    });

    it('should return null for non-existent todo', async () => {
      const found = await repo.findById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      repo.seed([
        createTodoBuilder().withId('todo-1').withTitle('Task 1').pending().withUserId('user-1').build(),
        createTodoBuilder().withId('todo-2').withTitle('Task 2').completed().withUserId('user-1').build(),
        createTodoBuilder().withId('todo-3').withTitle('Task 3').pending().withUserId('user-2').build(),
        createTodoBuilder().withId('todo-4').withTitle('Search Match').pending().withUserId('user-1').build(),
      ]);
    });

    it('should return all todos when no filters', async () => {
      const todos = await repo.findAll();

      expect(todos).toHaveLength(4);
    });

    it('should filter by status', async () => {
      const todos = await repo.findAll({ status: 'pending' });

      expect(todos).toHaveLength(3);
      expect(todos.every(t => t.status === 'pending')).toBe(true);
    });

    it('should filter by userId', async () => {
      const todos = await repo.findAll({ userId: 'user-1' });

      expect(todos).toHaveLength(3);
      expect(todos.every(t => t.userId === 'user-1')).toBe(true);
    });

    it('should filter by search term in title', async () => {
      const todos = await repo.findAll({ search: 'Match' });

      expect(todos).toHaveLength(1);
      expect(todos[0].title).toContain('Match');
    });

    it('should filter by search term in description', async () => {
      const todoWithDesc = createTodoBuilder()
        .withId('todo-5')
        .withTitle('Hidden')
        .withDescription('Searchable Content')
        .build();
      repo.seed([todoWithDesc]);

      const todos = await repo.findAll({ search: 'Searchable' });

      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe('todo-5');
    });

    it('should combine multiple filters', async () => {
      const todos = await repo.findAll({ status: 'pending', userId: 'user-1' });

      expect(todos).toHaveLength(2);
      expect(todos.every(t => t.status === 'pending' && t.userId === 'user-1')).toBe(true);
    });

    it('should handle case-insensitive search', async () => {
      const todos = await repo.findAll({ search: 'TASK' });

      expect(todos).toHaveLength(3); // All titles start with 'Task'
    });
  });

  describe('findByUser', () => {
    it('should find todos by user ID', async () => {
      repo.seed([
        createTodoBuilder().withId('todo-1').withUserId('user-1').build(),
        createTodoBuilder().withId('todo-2').withUserId('user-2').build(),
      ]);

      const user1Todos = await repo.findByUser('user-1');

      expect(user1Todos).toHaveLength(1);
      expect(user1Todos[0].userId).toBe('user-1');
    });

    it('should return empty array for user with no todos', async () => {
      const todos = await repo.findByUser('non-existent-user');

      expect(todos).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a new todo', async () => {
      const todo = createTodoBuilder().withId('todo-1').build();

      await repo.create(todo);

      const found = await repo.findById('todo-1');
      expect(found).toEqual(todo);
    });

    it('should allow creating multiple todos', async () => {
      const todo1 = createTodoBuilder().withId('todo-1').build();
      const todo2 = createTodoBuilder().withId('todo-2').build();

      await repo.create(todo1);
      await repo.create(todo2);

      expect(await repo.findAll()).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update an existing todo', async () => {
      const original = createTodoBuilder().withId('todo-1').withTitle('Original').build();
      repo.seed([original]);

      const updated = createTodoBuilder().withId('todo-1').withTitle('Updated').build();
      await repo.update(updated);

      const found = await repo.findById('todo-1');
      expect(found?.title).toBe('Updated');
    });

    it('should create todo if it does not exist', async () => {
      const todo = createTodoBuilder().withId('new-todo').build();

      await repo.update(todo);

      const found = await repo.findById('new-todo');
      expect(found).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an existing todo', async () => {
      repo.seed([createTodoBuilder().withId('todo-1').build()]);

      await repo.delete('todo-1');

      expect(await repo.findById('todo-1')).toBeNull();
    });

    it('should handle deleting non-existent todo gracefully', async () => {
      // Should not throw
      await repo.delete('non-existent');

      expect(await repo.findAll()).toHaveLength(0);
    });
  });

  describe('count', () => {
    beforeEach(() => {
      repo.seed([
        createTodoBuilder().withId('todo-1').pending().withUserId('user-1').build(),
        createTodoBuilder().withId('todo-2').pending().withUserId('user-1').build(),
        createTodoBuilder().withId('todo-3').completed().withUserId('user-2').build(),
      ]);
    });

    it('should count all todos when no filters', async () => {
      const count = await repo.count();

      expect(count).toBe(3);
    });

    it('should count todos with filters', async () => {
      const pendingCount = await repo.count({ status: 'pending' });
      const user1Count = await repo.count({ userId: 'user-1' });

      expect(pendingCount).toBe(2);
      expect(user1Count).toBe(2);
    });

    it('should count with combined filters', async () => {
      const count = await repo.count({ status: 'pending', userId: 'user-1' });

      expect(count).toBe(2);
    });

    it('should return zero when no todos match', async () => {
      const count = await repo.count({ userId: 'non-existent' });

      expect(count).toBe(0);
    });

    it('should count with search filter', async () => {
      repo.seed([createTodoBuilder().withId('todo-4').withTitle('Special Todo').build()]);

      const count = await repo.count({ search: 'Special' });

      expect(count).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty repository', async () => {
      expect(await repo.findAll()).toHaveLength(0);
      expect(await repo.count()).toBe(0);
      expect(await repo.findById('any')).toBeNull();
    });

    it('should handle search with no matches', async () => {
      repo.seed([createTodoBuilder().withId('todo-1').build()]);

      const todos = await repo.findAll({ search: 'NonExistentTerm' });

      expect(todos).toHaveLength(0);
    });

    it('should handle todos without description in search', async () => {
      repo.seed([createTodoBuilder().withId('todo-1').withTitle('Only Title').build()]);

      const todos = await repo.findAll({ search: 'Only' });

      expect(todos).toHaveLength(1);
    });
  });
});
