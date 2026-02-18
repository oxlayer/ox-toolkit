/**
 * Lock Manager for Global OxLayer Infrastructure Service
 * Handles concurrency locking to prevent race conditions
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { pid } from 'process';

export class LockManager {
  constructor(private readonly lockFile: string) {}

  /**
   * Acquire exclusive lock on registry
   * Throws if lock is held by another process
   */
  acquireLock(): void {
    if (existsSync(this.lockFile)) {
      const lockPid = parseInt(readFileSync(this.lockFile, 'utf-8').trim());

      // Check if the locking process is still running
      try {
        process.kill(lockPid, 0); // Signal 0 checks if process exists
        throw new Error(
          `Registry is locked by process ${lockPid}. ` +
          `If this is stale, remove: ${this.lockFile}`
        );
      } catch {
        // Process doesn't exist, lock is stale
        console.warn(`⚠ Found stale lock from process ${lockPid}, removing...`);
        this.releaseLock();
      }
    }

    // Write current PID to lock file
    writeFileSync(this.lockFile, pid.toString(), { mode: 0o600 });
  }

  /**
   * Release registry lock
   */
  releaseLock(): void {
    if (existsSync(this.lockFile)) {
      try {
        const lockPid = readFileSync(this.lockFile, 'utf-8').trim();
        if (lockPid === pid.toString()) {
          // Only remove lock if we own it
          unlinkSync(this.lockFile);
        }
      } catch {
        // Ignore errors
      }
    }
  }

  /**
   * Execute callback with lock held
   */
  async withLock<T>(callback: () => Promise<T>): Promise<T> {
    this.acquireLock();
    try {
      return await callback();
    } finally {
      this.releaseLock();
    }
  }
}
