/**
 * CLI types
 */

/**
 * CLI options
 */
export interface CliOptions {
  config: string;
  env?: string;
  envFile?: string;
  dryRun?: boolean;
  diff?: boolean;
  idempotent?: boolean;
  force?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

/**
 * Init command options
 */
export interface InitOptions {
  output: string;
  type?: 'shared' | 'dedicated' | 'full';
}

/**
 * Validate result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  code?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  path: string;
  message: string;
}
