#!/usr/bin/env node
/**
 * Generate release version in YYYY_MM_DD_NNN format
 *
 * This script generates a monotonic, date-based version number that:
 * - Is deterministic and sortable
 * - Allows multiple releases per day (NNN = daily increment)
 * - Provides easy rollback capability
 * - Creates a clean audit trail
 *
 * Usage:
 *   node scripts/sdk-release/generate-version.ts
 *
 * Output:
 *   2025_02_08_001
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

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
