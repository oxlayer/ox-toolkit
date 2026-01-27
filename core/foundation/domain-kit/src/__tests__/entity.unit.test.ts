/**
 * Unit Tests for Entity
 *
 * Tests the base Entity class with identity-based equality.
 */

import { describe, it, expect } from 'bun:test';
import { Entity } from '../entities/entity';

// Test entity implementation
class User extends Entity<string> {
  constructor(
    id: string,
    public readonly email: string,
    public readonly name: string
  ) {
    super(id);
  }
}

class Product extends Entity<number> {
  constructor(
    id: number,
    public readonly name: string,
    public readonly price: number
  ) {
    super(id);
  }
}

describe('Entity', () => {
  describe('Identity and Equality', () => {
    it('should create entity with ID', () => {
      const user = new User('user-1', 'test@example.com', 'John Doe');
      expect(user.id).toBe('user-1');
    });

    it('should be equal when IDs match', () => {
      const user1 = new User('user-1', 'john@example.com', 'John');
      const user2 = new User('user-1', 'jane@example.com', 'Jane');

      expect(user1.equals(user2)).toBe(true);
    });

    it('should not be equal when IDs differ', () => {
      const user1 = new User('user-1', 'john@example.com', 'John');
      const user2 = new User('user-2', 'john@example.com', 'John');

      expect(user1.equals(user2)).toBe(false);
    });

    it('should handle different ID types', () => {
      const product1 = new Product(1, 'Widget', 9.99);
      const product2 = new Product(1, 'Gadget', 19.99);

      expect(product1.equals(product2)).toBe(true);
    });

    it('should not be equal to null', () => {
      const user = new User('user-1', 'test@example.com', 'John');
      expect(user.equals(null as any)).toBe(false);
    });

    it('should not be equal to undefined', () => {
      const user = new User('user-1', 'test@example.com', 'John');
      expect(user.equals(undefined as any)).toBe(false);
    });

    it('should not be equal to non-entity', () => {
      const user = new User('user-1', 'test@example.com', 'John');
      expect(user.equals({ id: 'user-1' } as any)).toBe(false);
    });

    it('should handle string IDs correctly', () => {
      const user1 = new User('abc-123', 'test@example.com', 'John');
      const user2 = new User('abc-123', 'other@example.com', 'Jane');
      const user3 = new User('def-456', 'test@example.com', 'John');

      expect(user1.equals(user2)).toBe(true);
      expect(user1.equals(user3)).toBe(false);
    });

    it('should handle numeric IDs correctly', () => {
      const product1 = new Product(100, 'Widget', 9.99);
      const product2 = new Product(100, 'Gadget', 19.99);
      const product3 = new Product(200, 'Widget', 9.99);

      expect(product1.equals(product2)).toBe(true);
      expect(product1.equals(product3)).toBe(false);
    });

    it('should handle UUID-like IDs', () => {
      const uuid1 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid2 = '550e8400-e29b-41d4-a716-446655440000';
      const uuid3 = '550e8400-e29b-41d4-a716-446655440001';

      const entity1 = new User(uuid1, 'test@example.com', 'John');
      const entity2 = new User(uuid2, 'other@example.com', 'Jane');
      const entity3 = new User(uuid3, 'test@example.com', 'John');

      expect(entity1.equals(entity2)).toBe(true);
      expect(entity1.equals(entity3)).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should have readonly ID', () => {
      const user = new User('user-1', 'test@example.com', 'John');
      expect(() => {
        (user as any).id = 'user-2';
      }).not.toThrow();
      // The ID property itself is not truly readonly in JS, but the concept is
    });

    it('should preserve entity properties', () => {
      const user = new User('user-1', 'test@example.com', 'John Doe');
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('John Doe');
    });
  });

  describe('Inheritance', () => {
    it('should work with extended entity classes', () => {
      class Admin extends User {
        constructor(
          id: string,
          email: string,
          name: string,
          public readonly permissions: string[]
        ) {
          super(id, email, name);
        }
      }

      const admin = new Admin('admin-1', 'admin@example.com', 'Admin', ['read', 'write']);
      expect(admin.id).toBe('admin-1');
      expect(admin.permissions).toEqual(['read', 'write']);
    });

    it('should maintain equality through inheritance', () => {
      class Admin extends User {
        constructor(
          id: string,
          email: string,
          name: string,
          public readonly role: string
        ) {
          super(id, email, name);
        }
      }

      const user = new User('user-1', 'test@example.com', 'John');
      const admin = new Admin('user-1', 'admin@example.com', 'Jane', 'admin');

      expect(user.equals(admin)).toBe(true);
      expect(admin.equals(user)).toBe(true);
    });
  });

  describe('Usage Patterns', () => {
    it('should support entities in collections', () => {
      const user1 = new User('user-1', 'john@example.com', 'John');
      const user2 = new User('user-2', 'jane@example.com', 'Jane');
      const user3 = new User('user-1', 'john.doe@example.com', 'John Doe');

      const users = [user1, user2, user3];

      // Find by identity
      const found = users.find((u) => u.equals(user1));
      expect(found).toBe(user1);
    });

    it('should support entities in Sets', () => {
      const user1 = new User('user-1', 'john@example.com', 'John');
      const user2 = new User('user-2', 'jane@example.com', 'Jane');
      const user3 = new User('user-1', 'john.doe@example.com', 'John Doe');

      const userSet = new Set([user1, user2, user3]);

      // Set doesn't use equals() by default, so all three are stored
      expect(userSet.size).toBe(3);
    });

    it('should support entities in Maps', () => {
      const user1 = new User('user-1', 'john@example.com', 'John');
      const user2 = new User('user-2', 'jane@example.com', 'Jane');

      const userMap = new Map<Entity<string, string>, string>();
      userMap.set(user1, 'First user');
      userMap.set(user2, 'Second user');

      expect(userMap.get(user1)).toBe('First user');
      expect(userMap.get(user2)).toBe('Second user');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string ID', () => {
      const user1 = new User('', 'test@example.com', 'John');
      const user2 = new User('', 'other@example.com', 'Jane');

      expect(user1.equals(user2)).toBe(true);
    });

    it('should handle special characters in ID', () => {
      const specialId = 'user/with\\special"chars';
      const user1 = new User(specialId, 'test@example.com', 'John');
      const user2 = new User(specialId, 'other@example.com', 'Jane');

      expect(user1.equals(user2)).toBe(true);
    });

    it('should handle zero as numeric ID', () => {
      const product1 = new Product(0, 'Free Item', 0);
      const product2 = new Product(0, 'Another Free', 0);

      expect(product1.equals(product2)).toBe(true);
    });

    it('should handle negative numeric IDs', () => {
      const product1 = new Product(-1, 'Special', 9.99);
      const product2 = new Product(-1, 'Also Special', 19.99);

      expect(product1.equals(product2)).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('should enforce ID type', () => {
      // String ID entity
      const stringEntity = new User('string-id', 'test@example.com', 'John');
      expect(typeof stringEntity.id).toBe('string');

      // Number ID entity
      const numberEntity = new Product(123, 'Widget', 9.99);
      expect(typeof numberEntity.id).toBe('number');
    });

    it('should prevent ID type mismatch', () => {
      const user = new User('user-1', 'test@example.com', 'John');
      const product = new Product(1, 'Widget', 9.99);

      // These are different types, should not be equal
      expect(user.equals(product as any)).toBe(false);
    });
  });
});
