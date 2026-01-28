/**
 * Item Fixtures
 *
 * Pre-defined test data for Items.
 */

import type { Item } from '../../domain/item.js';

export const testItems = {
  valid: {
    id: 1,
    name: 'Test Item',
    description: 'A test item',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Item,

  minimal: {
    id: 2,
    name: 'Minimal Item',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as Item,

  createInput: {
    name: 'New Item',
    description: 'A new item',
  },
};
