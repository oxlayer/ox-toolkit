/**
 * Database Schema
 *
 * This file defines the database schema using Drizzle ORM.
 * Replace this with your actual schema definition.
 */

import { pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Items table
 * Example table - replace with your actual tables
 */
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * SQL for creating the items table
 * Used for migrations
 */
export const createItemsTableSQL = `
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
`;

/**
 * Combined SQL string for all tables
 */
export const createTableSQLString = `
${createItemsTableSQL}
`;

/**
 * Add your tables below this line
 */

// export const yourTable = pgTable('your_table', {
//   id: serial('id').primaryKey(),
//   // ...
// });
