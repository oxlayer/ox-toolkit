/**
 * Generate a unique ID for entities
 *
 * Uses crypto.randomUUID() when available, falls back to a timestamp-based approach.
 */
export function generateId(): string {
  // Use the built-in crypto.randomUUID() if available (Node.js 19+, modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random string for older environments
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}
