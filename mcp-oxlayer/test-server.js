#!/usr/bin/env node

/**
 * Test script for MCP OxLayer server
 * Run this with: node test-server.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCP() {
  console.log('🧪 Testing MCP OxLayer Server\n');

  // Start the MCP server
  const server = spawn('node', [join(__dirname, 'dist/index.js')], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  let requestId = 1;

  function sendRequest(method, params = {}) {
    const request = {
      jsonrpc: '2.0',
      id: requestId++,
      method,
      params
    };
    console.log(`📤 Sending: ${method}`);
    server.stdin.write(JSON.stringify(request) + '\n');
  }

  // Wait a bit for server to start
  await new Promise(r => setTimeout(r, 500));

  // Test 1: List tools
  console.log('\n--- Test 1: List Tools ---');
  sendRequest('tools/list');

  // Wait for response
  await new Promise(r => setTimeout(r, 1000));

  // Test 2: List resources
  console.log('\n--- Test 2: List Resources ---');
  sendRequest('resources/list');

  await new Promise(r => setTimeout(r, 1000));

  // Test 3: Call get_template_pattern tool
  console.log('\n--- Test 3: Get Entity Template ---');
  sendRequest('tools/call', {
    name: 'get_template_pattern',
    arguments: {
      pattern: 'entity'
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Test 4: Call get_best_practices tool
  console.log('\n--- Test 4: Get XSS Best Practice ---');
  sendRequest('tools/call', {
    name: 'get_best_practices',
    arguments: {
      topic: 'xss'
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  // Test 5: Call list_capabilities tool
  console.log('\n--- Test 5: List Capabilities ---');
  sendRequest('tools/call', {
    name: 'list_capabilities',
    arguments: {}
  });

  await new Promise(r => setTimeout(r, 1000));

  // Test 6: Search docs
  console.log('\n--- Test 6: Search for "CrudEntityTemplate" ---');
  sendRequest('tools/call', {
    name: 'search_docs',
    arguments: {
      query: 'CrudEntityTemplate',
      docs: 'ddd-pattern'
    }
  });

  // Read responses
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.result) {
          if (response.result.tools) {
            console.log(`✅ Found ${response.result.tools.length} tools`);
            response.result.tools.forEach(t => console.log(`   - ${t.name}`));
          } else if (response.result.resources) {
            console.log(`✅ Found ${response.result.resources.length} resources`);
            response.result.resources.forEach(r => console.log(`   - ${r.name}`));
          } else if (response.result.content) {
            const content = response.result.content[0]?.text || '';
            const preview = content.substring(0, 150);
            console.log(`✅ Got response (${content.length} chars):`);
            console.log(`   ${preview}${content.length > 150 ? '...' : ''}`);
          }
        }
        if (response.error) {
          console.error(`❌ Error: ${response.error.message}`);
        }
      } catch {
        // Skip non-JSON lines (server logs)
      }
    }
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  // Cleanup after tests
  setTimeout(() => {
    console.log('\n\n✅ Tests complete!');
    server.kill();
  }, 5000);
}

testMCP().catch(console.error);
