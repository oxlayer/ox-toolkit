#!/usr/bin/env node
/**
 * Generate release version in YYYY_MM_DD_NNN format
 *
 * This script generates a monotonic, date-based version number that:
 * - Is deterministic and sortable
 * - Allows multiple releases per day (NNN = daily increment)
 * - Provides easy rollback capability
 * - Creates a clean audit trail
 * - Syncs with GitHub releases to avoid conflicts
 *
 * Usage:
 *   node scripts/sdk-release/generate-version.ts
 *
 * Output:
 *   2025_02_08_001
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

interface VersionState {
  lastVersion: string;
  lastDate: string;
  count: number;
}

function getCurrentDateStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}_${month}_${day}`;
}

/**
 * Get the highest version number for today from GitHub releases
 * Returns 0 if no releases exist for today
 */
function getLatestIncrementForToday(datePrefix: string): number {
  try {
    // Get all tags matching today's date pattern
    const tags = execSync(
      `git tag -l "${datePrefix}_*" --sort=-v:refname`,
      { encoding: 'utf-8' }
    ).trim().split('\n').filter(Boolean);

    if (tags.length === 0) {
      return 0;
    }

    // Extract increment numbers and find the highest
    const increments = tags
      .map(tag => {
        const match = tag.match(/_(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => n > 0);

    return increments.length > 0 ? Math.max(...increments) : 0;
  } catch (e) {
    // If git command fails, return 0
    return 0;
  }
}

function generateVersion(): string {
  const stateFile = join(process.cwd(), '.github', 'release-state.json');
  const currentDateStr = getCurrentDateStr();

  let state: VersionState = {
    lastVersion: '',
    lastDate: '',
    count: 0,
  };

  // Load existing state if available
  if (existsSync(stateFile)) {
    try {
      const content = readFileSync(stateFile, 'utf-8');
      state = JSON.parse(content);
    } catch (e) {
      // If file is corrupted, start fresh
      state = { lastVersion: '', lastDate: '', count: 0 };
    }
  }

  // Check if we're on the same day
  if (state.lastDate === currentDateStr) {
    state.count++;
  } else {
    // New day, reset counter
    state.count = 1;
  }

  // IMPORTANT: Check GitHub for existing releases with today's date
  // This handles cases where local state is out of sync with remote
  const gitIncrement = getLatestIncrementForToday(currentDateStr);
  if (gitIncrement > 0) {
    // Use the higher of: local state + 1, or GitHub's latest + 1
    state.count = Math.max(state.count, gitIncrement + 1);
  }

  // Generate version string
  const version = `${currentDateStr}_${String(state.count).padStart(3, '0')}`;

  // Update state
  state.lastVersion = version;
  state.lastDate = currentDateStr;

  // Ensure directory exists
  const stateDir = join(process.cwd(), '.github');
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }

  // Save state
  writeFileSync(stateFile, JSON.stringify(state, null, 2));

  return version;
}

// Generate and output version
const version = generateVersion();
console.log(version);

// Also output as JSON for easier parsing in workflows
if (process.argv.includes('--json')) {
  console.error(JSON.stringify({ version }));
}
