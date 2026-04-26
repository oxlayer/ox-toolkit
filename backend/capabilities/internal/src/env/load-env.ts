import type { EnvSchema, EnvVar, LoadedEnv, OptionalEnvVar, EnvSchemaShorthandDefinition } from './types.js';
import { Parsers } from './types.js';

/**
 * Load and validate environment variables from a schema
 *
 * Validates all env vars at startup, failing fast if any are missing or invalid.
 * Returns a frozen object with parsed values.
 *
 * @param schema - Environment schema to validate against
 * @returns Loaded and validated environment
 * @throws {EnvValidationError} If validation fails
 *
 * @example
 * ```ts
 * import { loadEnv } from '@oxlayer/capabilities-internal/env';
 * import { rabbitmqEnv } from '@oxlayer/capabilities-adapters-rabbitmq/env';
 * import { telemetryEnv } from '@oxlayer/capabilities-telemetry/env';
 *
 * const appEnvSchema = mergeEnvSchemas(rabbitmqEnv, telemetryEnv);
 * export const ENV = loadEnv(appEnvSchema);
 * ```
 */
export function loadEnv<T extends EnvSchema>(schema: T): LoadedEnv<T> {
  const errors: string[] = [];
  const result: Record<string, unknown> = {};

  // Track which keys were checked (for duplicates)
  const checkedKeys = new Set<string>();

  for (const key in schema) {
    const def = schema[key] as EnvVar;

    // Check for duplicate definitions
    if (checkedKeys.has(def.name)) {
      errors.push(`Duplicate env definition: ${def.name}`);
      continue;
    }
    checkedKeys.add(def.name);

    const raw = process.env[def.name];

    // Check if required env is missing or empty
    const isEmpty = raw === undefined || raw === '';

    if (def.required && isEmpty) {
      errors.push(`Missing required env: ${def.name}`);
      continue;
    }

    // Use default for optional env
    if (isEmpty && !def.required) {
      result[def.name] = (def as OptionalEnvVar).default;
      continue;
    }

    // Parse the value
    try {
      result[def.name] = def.parse(raw!);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Invalid value for env: ${def.name} (${message})`);
    }
  }

  if (errors.length > 0) {
    throw Object.assign(new Error(`Environment validation failed:\n${errors.join('\n')}`), {
      name: 'EnvValidationError',
      errors,
    });
  }

  return Object.freeze(result) as LoadedEnv<T>;
}

/**
 * Merge multiple env schemas into one
 *
 * Later schemas override earlier ones for duplicate keys.
 *
 * @param schemas - Environment schemas to merge
 * @returns Merged environment schema
 *
 * @example
 * ```ts
 * const appEnvSchema = mergeEnvSchemas(
 *   rabbitmqEnv,
 *   telemetryEnv,
 *   postgresEnv
 * );
 * ```
 */
export function mergeEnvSchemas(...schemas: EnvSchema[]): EnvSchema {
  return Object.assign({}, ...schemas);
}

/**
 * Validate env schema without loading
 *
 * Useful for CI/CD or documentation generation.
 *
 * @param schema - Environment schema to validate
 * @returns Object with valid flag and errors
 *
 * @example
 * ```ts
 * import { validateSchema } from '@oxlayer/capabilities-internal/env';
 * import { appEnvSchema } from './env';
 *
 * const check = validateSchema(appEnvSchema);
 * if (!check.valid) {
 *   console.error(check.errors);
 *   process.exit(1);
 * }
 * ```
 */
export function validateSchema(schema: EnvSchema): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const key in schema) {
    const def = schema[key];

    // Check for valid parse function
    if (typeof def.parse !== 'function') {
      errors.push(`Env ${def.name}: parse must be a function`);
    }

    // Check optional vars have default
    if (!def.required && 'default' in def) {
      if ((def as OptionalEnvVar).default === undefined) {
        errors.push(`Env ${def.name}: optional vars must have a default value`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate .env.example file content from schema
 *
 * @param schema - Environment schema
 * @returns String content for .env.example file
 *
 * @example
 * ```ts
 * import { generateEnvExample } from '@oxlayer/capabilities-internal/env';
 * import { appEnvSchema } from './env';
 *
 * const example = generateEnvExample(appEnvSchema);
 * await fs.writeFile('.env.example', example);
 * ```
 */
export function generateEnvExample(schema: EnvSchema): string {
  const lines: string[] = [];

  lines.push('# Environment Variables');
  lines.push('# Generated from env schema - do not edit manually');
  lines.push('');

  const defs = Object.values(schema);

  // Sort by name
  defs.sort((a, b) => a.name.localeCompare(b.name));

  for (const def of defs) {
    lines.push(`# ${def.description || 'No description'}`);
    lines.push(`# ${def.required ? 'Required' : `Optional (default: ${(def as OptionalEnvVar).default})`}`);
    if (def.example) {
      lines.push(`# Example: ${def.example}`);
    }
    lines.push(`${def.name}=`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * List all required env vars from schema
 *
 * @param schema - Environment schema
 * @returns Array of required env var names
 */
export function listRequiredEnvs(schema: EnvSchema): string[] {
  return Object.values(schema)
    .filter((def) => def.required)
    .map((def) => def.name);
}

/**
 * List all optional env vars from schema
 *
 * @param schema - Environment schema
 * @returns Array of optional env var names with their defaults
 */
export function listOptionalEnvs(schema: EnvSchema): Array<{ name: string; default: unknown }> {
  return Object.values(schema)
    .filter((def) => !def.required)
    .map((def) => ({
      name: def.name,
      default: (def as OptionalEnvVar).default,
    }));
}

/**
 * Define an environment schema using a simple shorthand syntax
 *
 * Converts a simple object definition into a full EnvSchema with proper types.
 * This is the recommended way to define environment schemas.
 *
 * @param definition - Simple object with env var names as keys
 * @returns A properly typed EnvSchema
 *
 * @example
 * ```ts
 * import { defineEnvSchema } from '@oxlayer/capabilities-internal';
 *
 * export const myEnv = defineEnvSchema({
 *   API_KEY: {
 *     description: "API key for external service",
 *     required: true,
 *   },
 *   API_URL: {
 *     description: "API base URL",
 *     required: false,
 *     default: "https://api.example.com",
 *   },
 *   PORT: {
 *     description: "Server port",
 *     required: false,
 *     default: "3000",
 *     parse: Parsers.number,
 *   },
 * });
 * ```
 */
export function defineEnvSchema<T extends EnvSchemaShorthandDefinition>(
  definition: T
): EnvSchema {
  const schema: EnvSchema = {};

  for (const [key, def] of Object.entries(definition)) {
    const required = def.required ?? true;

    schema[key] = {
      name: key,
      required,
      description: def.description,
      example: def.example,
      parse: def.parse ?? Parsers.string,
      ...(required ? {} : { default: def.default ?? '' }),
    } as EnvVar;
  }

  return schema;
}
