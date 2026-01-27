/**
 * Environment variable contract types
 *
 * Defines the schema for environment variable declarations.
 * Each package declares its env requirements using these types.
 * The app aggregates schemas and validates once at boot.
 */

/**
 * Required environment variable definition
 */
export type RequiredEnvVar<T = string> = {
  /**
   * Environment variable name
   */
  name: string;
  /**
   * Whether this variable is required
   */
  required: true;
  /**
   * Parse function to convert string value to desired type
   */
  parse: (raw: string) => T;
  /**
   * Description for documentation
   */
  description?: string;
  /**
   * Example value for documentation
   */
  example?: string;
};

/**
 * Optional environment variable definition with default
 */
export type OptionalEnvVar<T = string> = {
  /**
   * Environment variable name
   */
  name: string;
  /**
   * Whether this variable is required
   */
  required: false;
  /**
   * Parse function to convert string value to desired type
   */
  parse: (raw: string) => T;
  /**
   * Default value if env var is not set
   */
  default: T;
  /**
   * Description for documentation
   */
  description?: string;
  /**
   * Example value for documentation
   */
  example?: string;
};

/**
 * Environment variable definition (required or optional)
 */
export type EnvVar<T = string> = RequiredEnvVar<T> | OptionalEnvVar<T>;

/**
 * Environment schema - a record of env var definitions
 */
export type EnvSchema = Record<string, EnvVar<any>>;

/**
 * Loaded and validated environment
 */
export type LoadedEnv<T extends EnvSchema> = {
  [K in keyof T]: T[K] extends EnvVar<infer V> ? V : never;
};

/**
 * Shorthand definition for defineEnvSchema helper
 */
export type EnvSchemaShorthandDefinition = {
  [key: string]: {
    description?: string;
    required?: boolean;
    default?: string;
    example?: string;
    parse?: (raw: string) => unknown;
  };
};

/**
 * Environment validation error
 */
export class EnvValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Environment validation failed:\n${errors.join('\n')}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Common parsers for environment variables
 */
export const Parsers = {
  /**
   * Parse as string
   */
  string: (raw: string): string => raw,

  /**
   * Parse as number
   */
  number: (raw: string): number => {
    const num = Number(raw);
    if (isNaN(num)) {
      throw new Error(`Invalid number: ${raw}`);
    }
    return num;
  },

  /**
   * Parse as boolean (true/false)
   */
  boolean: (raw: string): boolean => {
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    throw new Error(`Invalid boolean: ${raw} (expected: true/false or 1/0)`);
  },

  /**
   * Parse as JSON
   */
  json: <T = unknown>(raw: string): T => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`Invalid JSON: ${raw}`);
    }
  },

  /**
   * Parse as array (comma-separated)
   */
  array: (raw: string, separator = ','): string[] => {
    return raw.split(separator).map((s) => s.trim()).filter(Boolean);
  },

  /**
   * Parse as enum
   */
  enum: <T extends string>(values: readonly T[]) => {
    return (raw: string): T => {
      if (values.includes(raw as T)) {
        return raw as T;
      }
      throw new Error(`Invalid enum value: ${raw} (expected: ${values.join(', ')})`);
    };
  },

  /**
   * Parse as URL
   */
  url: (raw: string): URL => {
    try {
      return new URL(raw);
    } catch {
      throw new Error(`Invalid URL: ${raw}`);
    }
  },

  /**
   * Parse with validation
   */
  withValidation: <T>(parser: (raw: string) => T, validator: (value: T) => void | boolean) => {
    return (raw: string): T => {
      const value = parser(raw);
      const valid = validator(value);
      if (valid === false) {
        throw new Error(`Validation failed for: ${raw}`);
      }
      return value;
    };
  },
};
