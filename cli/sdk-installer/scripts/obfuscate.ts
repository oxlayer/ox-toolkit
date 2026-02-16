import { obfuscate } from 'javascript-obfuscator';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '../dist');
const inputFile = join(distDir, 'cli.js');

const sourceCode = readFileSync(inputFile, 'utf8');

// Safe obfuscation config - NO runtime performance loss
const obfuscationResult = obfuscate(sourceCode, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'mangled',
  ignoreImports: true, // Don't mangle import statements
  numbersToExpressions: false, // Expensive at runtime
  renameGlobals: false, // Breaks things
  renameProperties: false, // Can break, expensive
  selfDefending: false, // Runtime overhead
  simplify: true, // Safe - improves optimization
  splitStrings: false, // Runtime overhead
  stringArray: false, // Major runtime overhead
  target: 'node',
  transformObjectKeys: true, // Safe obfuscation
  unicodeEscapeSequence: true, // Safe obfuscation
});

writeFileSync(inputFile, obfuscationResult.getObfuscatedCode());
console.log('✓ Obfuscated dist/cli.js');
