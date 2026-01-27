import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

type VariantsFunction = (props?: Record<string, unknown>) => string;

/**
 * Extends UI variants with custom overrides using tailwind-merge.
 * Use this to wrap components from `ui/` with custom styling in `custom/`.
 * Supports extending prop types via the TExtendedProps generic.
 *
 * @example
 * ```ts
 * // Basic usage
 * export const alertVariants = extendVariants(uiAlertVariants, customOverrides);
 *
 * // With extended prop types (e.g., adding "xs" size)
 * type ExtendedSize = "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm" | "icon-xs" | "icon-lg";
 *
 * export const buttonVariants = extendVariants<
 *   typeof uiButtonVariants,
 *   { size?: ExtendedSize | null }
 * >(uiButtonVariants, customOverrides);
 * ```
 */
function extendVariants<T extends VariantsFunction, TExtendedProps extends object = object>(
  uiVariants: T,
  customOverrides: VariantsFunction
) {
  type ExtendedParams = Omit<NonNullable<Parameters<T>[0]>, keyof TExtendedProps> &
    TExtendedProps & { className?: string };

  return (props?: ExtendedParams) => {
    const { className, ...variantProps } = props || {};
    return cn(
      uiVariants(variantProps as Parameters<T>[0]),
      customOverrides(variantProps),
      className
    );
  };
}

export { cva, extendVariants, type VariantProps };
