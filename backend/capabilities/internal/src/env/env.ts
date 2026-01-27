/**
 * Environment variable utilities
 */

type RequiredEnvVar<T, R extends boolean | undefined> = R extends false
  ? T | undefined
  : T;

/**
 * Get an environment variable value with optional validation
 *
 * @param key - The environment variable key
 * @param options - Options for handling missing values
 * @returns The environment variable value
 * @throws Error if the variable is required but not set
 *
 * @example
 * ```ts
 * // Required - throws if not set
 * const dbUrl = getEnvVar('DATABASE_URL');
 *
 * // Required with default - returns string
 * const port = getEnvVar('PORT', { default: '3000' });
 *
 * // Optional - returns undefined if not set
 * const feature = getEnvVar('FEATURE_FLAG', { required: false });
 * ```
 */
export function getEnvVar(key: string): string;
export function getEnvVar<
  const T extends string | undefined,
  R extends boolean | undefined = undefined
>(
  key: string,
  options: { default: T; required?: R }
): RequiredEnvVar<NonNullable<T>, R>;
export function getEnvVar<R extends boolean | undefined = undefined>(
  key: string,
  options: { required?: R }
): RequiredEnvVar<string, R>;
export function getEnvVar(
  key: string,
  options: { default?: string; required?: boolean } = {}
): string | undefined {
  const { default: defaultValue, required = true } = options;

  const value = process.env[key];

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    if (required) {
      throw new Error(`Required environment variable '${key}' is not set`);
    }

    return undefined;
  }

  return value;
}

/**
 * Get an environment variable as a number
 *
 * @param key - The environment variable key
 * @param options - Options for handling missing/invalid values
 * @returns The environment variable value as a number
 * @throws Error if the variable is required but not set, or cannot be parsed as a number
 *
 * @example
 * ```ts
 * const port = getEnvVarAsNumber('PORT', { default: 3000 });
 * ```
 */
export function getEnvVarAsNumber(key: string): number;
export function getEnvVarAsNumber<
  const T extends number | undefined,
  R extends boolean | undefined = undefined
>(
  key: string,
  options: { default: T; required?: R }
): RequiredEnvVar<NonNullable<T>, R>;
export function getEnvVarAsNumber<R extends boolean | undefined = undefined>(
  key: string,
  options: { required?: R }
): RequiredEnvVar<number, R>;
export function getEnvVarAsNumber(
  key: string,
  options: { default?: number; required?: boolean } = {}
): number | undefined {
  const value = getEnvVar(key, {
    ...options,
    default: options.default?.toString(),
  });

  if (value === undefined) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(
      `Environment variable '${key}' is not a valid number: ${value}`
    );
  }

  return parsed;
}

/**
 * Get an environment variable as a boolean
 *
 * Accepts: 'true', '1', 'yes' (case-insensitive) as true
 * Accepts: 'false', '0', 'no' (case-insensitive) as false
 *
 * @param key - The environment variable key
 * @param options - Options for handling missing/invalid values
 * @returns The environment variable value as a boolean
 *
 * @example
 * ```ts
 * const debug = getEnvVarAsBoolean('DEBUG', { default: false });
 * ```
 */
export function getEnvVarAsBoolean(key: string): boolean;
export function getEnvVarAsBoolean<
  const T extends boolean | undefined,
  R extends boolean | undefined = undefined
>(
  key: string,
  options: { default: T; required?: R }
): RequiredEnvVar<NonNullable<T>, R>;
export function getEnvVarAsBoolean<R extends boolean | undefined = undefined>(
  key: string,
  options: { required?: R }
): RequiredEnvVar<boolean, R>;
export function getEnvVarAsBoolean(
  key: string,
  options: { default?: boolean; required?: boolean } = {}
): boolean | undefined {
  const value = getEnvVar(key, {
    ...options,
    default: options.default?.toString(),
    required: false,
  });

  if (value === undefined) {
    return options.default;
  }

  const normalized = value.toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  throw new Error(
    `Environment variable '${key}' is not a valid boolean: ${value}`
  );
}

/**
 * Get an environment variable as a JSON object
 *
 * @param key - The environment variable key
 * @param options - Options for handling missing/invalid values
 * @returns The environment variable value parsed as JSON
 * @throws Error if the variable is required but not set, or cannot be parsed as JSON
 *
 * @example
 * ```ts
 * const config = getEnvVarAsJson('CONFIG', { default: {} });
 * ```
 */
export function getEnvVarAsJson<const T>(
  key: string
): T;
export function getEnvVarAsJson<
  const T,
  R extends boolean | undefined = undefined
>(
  key: string,
  options: { default: T; required?: R }
): RequiredEnvVar<T, R>;
export function getEnvVarAsJson<
  const T,
  R extends boolean | undefined = undefined
>(
  key: string,
  options: { required?: R }
): RequiredEnvVar<T, R>;
export function getEnvVarAsJson<const T>(
  key: string,
  options: { default?: T; required?: boolean } = {}
): T | undefined {
  const value = getEnvVar(key, {
    ...options,
    default:
      options.default !== undefined
        ? JSON.stringify(options.default)
        : undefined,
    required: false,
  });

  if (value === undefined) {
    return options.default;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    throw new Error(
      `Environment variable '${key}' is not valid JSON: ${value}`
    );
  }
}
