/**
 * Environment variable substitution
 */

/**
 * Substitute environment variables in a string
 * Supports: ${VAR}, ${VAR:-default}, ${VAR:?error}
 */
export function substituteEnv(str: string, env: Record<string, string | undefined> = process.env): string {
  return str.replace(/\$\{([^}:]+)(?::-([^}]*))?(?::\?([^}]*))?\}/g, (match, varName, defaultValue, errorMessage) => {
    if (errorMessage) {
      // Custom error message
      if (!(varName in env)) {
        throw new Error(errorMessage || `Required environment variable ${varName} is not set`);
      }
    }

    const value = env[varName];

    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      if (errorMessage === undefined) {
        throw new Error(`Environment variable ${varName} is not set and no default provided`);
      }
    }

    return value || '';
  });
}

/**
 * Substitute environment variables in an object recursively
 */
export function substituteEnvInObject<T>(obj: T, env: Record<string, string | undefined> = process.env): T {
  if (typeof obj === 'string') {
    return substituteEnv(obj, env) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => substituteEnvInObject(item, env)) as T;
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvInObject(value, env);
    }
    return result as T;
  }

  return obj;
}
