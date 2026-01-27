/**
 * Create Establishment Use Case Unit Tests
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { CreateEstablishmentUseCase } from '../../use-cases/establishments/create-establishment.usecase';
import { MockEstablishmentRepository } from '../../test/mocks/mock-establishment.repository';
import { EstablishmentBuilder } from '../../test/builders/establishment.builder';
import { Result } from '@oxlayer/foundation-domain-kit';

describe('CreateEstablishmentUseCase', () => {
  let mockRepo: MockEstablishmentRepository;
  let useCase: CreateEstablishmentUseCase;

  beforeEach(() => {
    mockRepo = new MockEstablishmentRepository();
    useCase = new CreateEstablishmentUseCase(mockRepo);
  });

  describe('execute', () => {
    it('should create establishment with valid data', async () => {
      const input = new EstablishmentBuilder().buildCreateInput();

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(input.name);
      expect(result.data?.id).toBeDefined();
    });

    it('should fail with missing name', async () => {
      const input = {
        name: '',
        horarioFuncionamento: '9AM-10PM',
        ownerId: 1,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with missing ownerId', async () => {
      const input = {
        name: 'Test Restaurant',
        horarioFuncionamento: '9AM-10PM',
        ownerId: 0,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
    });

    it('should store created establishment in repository', async () => {
      const input = new EstablishmentBuilder().buildCreateInput();

      await useCase.execute(input);

      const created = await mockRepo.findById(input.id || 1);
      expect(created).not.toBeNull();
      expect(created?.name).toBe(input.name);
    });

    it('should assign unique IDs to multiple establishments', async () => {
      const input = new EstablishmentBuilder().buildCreateInput();

      const result1 = await useCase.execute({ ...input, name: 'Restaurant 1' });
      const result2 = await useCase.execute({ ...input, name: 'Restaurant 2' });
      const result3 = await useCase.execute({ ...input, name: 'Restaurant 3' });

      expect(result1.data?.id).not.toBe(result2.data?.id);
      expect(result2.data?.id).not.toBe(result3.data?.id);
      expect(result1.data?.id).not.toBe(result3.data?.id);
    });
  });
});
