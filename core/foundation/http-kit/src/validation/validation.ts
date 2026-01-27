import type { z } from 'zod';

/**
 * Validation error detail
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationErrorDetail[] };

/**
 * Create a validation error response
 */
export function validationErrorResponse(errors: ValidationErrorDetail[]): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Validation failed',
      details: errors,
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Validate data against a Zod schema (framework-agnostic)
 *
 * @example
 * ```ts
 * const schema = z.object({ name: z.string() });
 * const result = validate(schema, { name: 'John' });
 * if (result.success) {
 *   console.log(result.data.name);
 * } else {
 *   console.log(result.errors);
 * }
 * ```
 */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(data);

  if (!result.success) {
    const zodError = result.error as z.ZodError;
    const errors: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}

/**
 * Validate data and throw Response on failure
 *
 * @throws Response with 400 status on validation failure
 */
export function validateOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  const result = validate(schema, data);

  if (!result.success) {
    throw validationErrorResponse(result.errors);
  }

  return result.data;
}
