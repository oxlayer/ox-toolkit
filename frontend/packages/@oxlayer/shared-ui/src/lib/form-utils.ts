import { compact } from "es-toolkit/array";
import { isString } from "es-toolkit/compat";

/**
 * Formats form field errors into a displayable string.
 * Resolution order:
 * 1) string inputs are returned as-is
 * 2) error objects prefer `message`, then `name`, then `code`
 * 3) otherwise returns a safe String(err) value when available
 * 4) finally falls back to JSON.stringify or "Unknown error"
 *
 * The first available value per entry is used, then compacted and joined.
 */
export function formatFieldErrors(errors: unknown[]): string {
  const messages = errors.map(err => {
    if (isString(err)) return err;

    if (err && typeof err === "object") {
      const record = err as Record<string, unknown>;

      const preferredValue =
        (typeof record.message === "string" && record.message) ||
        (typeof record.name === "string" && record.name) ||
        (record.code !== undefined ? String(record.code) : undefined);

      if (preferredValue) return preferredValue;

      const stringValue = (() => {
        try {
          const value = String(err);
          return value === "[object Object]" ? undefined : value;
        } catch {
          return undefined;
        }
      })();

      if (stringValue) return stringValue;

      try {
        return JSON.stringify(err);
      } catch {
        return "Unknown error";
      }
    }
    return String(err);
  });

  return compact(messages).join(", ");
}
