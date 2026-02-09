#!/usr/bin/env node
/**
 * Generate OpenAPI Spec
 *
 * This script starts the Hono app, extracts the OpenAPI spec,
 * and saves it to the api-spec directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the API version and built app
const { API_VERSION, default: app } = await import('../dist/index.js');

// Get the OpenAPI document from Hono
let spec = app.getOpenAPIDocument?.();

if (!spec) {
  console.error('❌ Could not extract OpenAPI spec from app');
  process.exit(1);
}

// Ensure spec has required fields
if (!spec.info) {
  spec.info = {
    version: API_VERSION,
    title: 'OxLayer Control Panel API',
    description: 'API for managing SDK distribution',
  };
}

if (!spec.openapi) {
  spec.openapi = '3.1.0';
}

// Create output directory
const outputDir = path.resolve(__dirname, '../api-spec');
fs.mkdirSync(outputDir, { recursive: true });

// Write the spec
const outputPath = path.join(outputDir, 'doc.json');
fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

console.log(`✅ OpenAPI spec generated: ${outputPath}`);
console.log(`📦 API version: ${spec.info.version}`);
console.log(`📄 ${spec.info.title}`);
console.log(`📊 ${Object.keys(spec.paths || {}).length} endpoints`);
