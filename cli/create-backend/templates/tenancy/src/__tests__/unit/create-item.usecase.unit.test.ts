/**
 * Create Item Use Case Unit Tests
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { CreateItemUseCase } from '../../use-cases/create-item.usecase';
import { MockItemRepository } from '../../test/mocks/mock-item.repository';
import { ItemBuilder } from '../../test/builders/item.builder';

describe('CreateItemUseCase', () => {
  let mockRepo: MockItemRepository;
  let useCase: CreateItemUseCase;

  beforeEach(() => {
    mockRepo = new MockItemRepository();
    useCase = new CreateItemUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should create item with valid data', async () => {
      const input = new ItemBuilder().buildCreateInput();
      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe(input.name);
    });

    it('should fail with missing name', async () => {
      const result = await useCase.execute({ name: '' });

      expect(result.success).toBe(false);
    });

    it('should store created item in repository', async () => {
      const input = new ItemBuilder().buildCreateInput();
      await useCase.execute(input);

      const created = await mockRepo.findById(input.id || 1);
      expect(created).not.toBeNull();
      expect(created?.name).toBe(input.name);
    });
  });
});
