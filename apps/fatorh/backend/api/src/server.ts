/**
 * Server Entry Point for ox-globex-api
 *
 * Uses Bun.serve with Hono for high-performance HTTP server
 */

import 'dotenv/config';
import { initDatabase } from './db/init.js';
import { main as appMain } from './app.js';

/**
 * Start the server
 */
async function start() {
  // Initialize database (create if not exists)
  await initDatabase();

  // Start the app (which includes telemetry, container, and server)
  await appMain();
}

// Start the server
start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
