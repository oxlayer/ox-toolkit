/**
 * Configuration
 *
 * Application configuration for the control panel API
 */

export interface Config {
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  };
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint?: string;
  };
  env: 'development' | 'staging' | 'production';
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new Error(`Missing required environment variable: ${name}`);
    }
    return defaultValue;
  }
  return value;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }
  return num;
}

function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return value === 'true' || value === '1';
}

export const config: Config = {
  port: getEnvNumber('PORT', 3001),
  host: getEnvVar('HOST', '0.0.0.0'),
  env: (getEnvVar('NODE_ENV', 'development') as Config['env']),
  database: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: getEnvNumber('DB_PORT', 5432),
    database: getEnvVar('DB_NAME', 'oxlayer_control_panel'),
    user: getEnvVar('DB_USER', 'postgres'),
    password: getEnvVar('DB_PASSWORD', 'postgres'),
    ssl: getEnvBoolean('DB_SSL', false),
  },
  r2: process.env.R2_ACCOUNT_ID ? {
    accountId: getEnvVar('R2_ACCOUNT_ID'),
    accessKeyId: getEnvVar('R2_ACCESS_KEY_ID'),
    secretAccessKey: getEnvVar('R2_SECRET_ACCESS_KEY'),
    bucketName: getEnvVar('R2_BUCKET_NAME'),
    endpoint: process.env.R2_ENDPOINT,
  } : undefined,
};

export default config;
