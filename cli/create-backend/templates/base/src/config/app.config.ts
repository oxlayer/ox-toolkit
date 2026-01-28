/**
 * App Configuration
 */

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || {{PORT}},
  HOST: process.env.HOST || '0.0.0.0',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
} as const;
