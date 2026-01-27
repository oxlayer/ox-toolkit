/**
 * Database Seed Script
 *
 * Run this to seed sample todos:
 * pnpm run db:seed
 */

import { createPostgresConnection } from '../config/postgres.config.js';
import { Todo } from './schema.js';

async function seed() {
  console.log('🌱 Seeding database with sample todos...');

  const pg = createPostgresConnection();

  try {
    // Clear existing todos
    await pg.sql`DELETE FROM todos`;
    console.log('✅ Cleared existing todos');

    // Seed sample todos (remove tenantId as it's not in the current schema)
    const sampleTodos = [
      {
        id: 'todo_001',
        title: 'Learn OxLayer Framework',
        description: 'Explore the foundation and capabilities',
        status: 'in_progress' as const,
        userId: 'user_001',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
      {
        id: 'todo_002',
        title: 'Build CRUD App',
        description: 'Create a Todo app with Keycloak, PostgreSQL, Redis, and RabbitMQ',
        status: 'pending' as const,
        userId: 'user_001',
      },
      {
        id: 'todo_003',
        title: 'Setup Multi-Tenancy',
        description: 'Configure tenant isolation with RLS',
        status: 'pending' as const,
        userId: 'user_001',
      },
      {
        id: 'todo_004',
        title: 'Deploy to Production',
        description: 'Deploy the app with Docker and Kubernetes',
        status: 'pending' as const,
        userId: 'user_001',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    ];

    for (const todo of sampleTodos) {
      await pg.db.insert(Todo).values(todo);
    }

    console.log(`✅ Inserted ${sampleTodos.length} sample todos`);
    console.log('');
    console.log('Sample todos:');
    sampleTodos.forEach((todo) => {
      console.log(`  - ${todo.title} (${todo.status})`);
    });
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pg.close();
  }
}

seed();
