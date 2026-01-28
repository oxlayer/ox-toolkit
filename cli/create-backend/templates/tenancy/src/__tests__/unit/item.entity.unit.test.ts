/**
 * Item Entity Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import { ItemBuilder } from '../../test/builders/item.builder';
import { testItems } from '../../test/fixtures/items.fixture';

describe('Item Entity', () => {
  describe('creation', () => {
    it('should create a valid item', () => {
      const item = new ItemBuilder().build();
      expect(item).toBeDefined();
      expect(item.id).toBeGreaterThanOrEqual(1);
      expect(item.name).toBeDefined();
      expect(item.createdAt).toBeInstanceOf(Date);
    });

    it('should create item with custom name', () => {
      const item = new ItemBuilder()
        .withName('Custom Item')
        .build();
      expect(item.name).toBe('Custom Item');
    });

    it('should create item with description', () => {
      const item = new ItemBuilder()
        .withDescription('A custom description')
        .build();
      expect(item.description).toBe('A custom description');
    });
  });

  describe('builder', () => {
    it('should build with all properties', () => {
      const item = new ItemBuilder()
        .withId(1)
        .withName('Full Item')
        .withDescription('A complete item')
        .build();
      expect(item.id).toBe(1);
      expect(item.name).toBe('Full Item');
      expect(item.description).toBe('A complete item');
    });
  });

  describe('fixtures', () => {
    it('should provide valid test item', () => {
      expect(testItems.valid).toBeDefined();
      expect(testItems.valid.name).toBe('Test Item');
    });
  });
});
