import {
  createElement,
  forwardRef,
  type ComponentPropsWithoutRef,
  type ComponentPropsWithRef,
  type ComponentType,
  type ElementType,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from "react";

import { cn } from "./utils";
import { extendVariants } from "./cva";

type VariantsFunction = (props?: Record<string, unknown>) => string;

/** Base wrapper props type - must include children */
type BaseWrapperProps = { children: ReactNode };

type WrapperBaseOptions<TProps, TExtended extends object> = {
  /** Display name for React DevTools */
  displayName: string;
  /** data-slot attribute value */
  dataSlot?: string;
  /** Custom classes - static string OR function for dynamic className */
  className?: string | ((props: TProps & TExtended) => string);
  /** Default props to apply */
  defaultProps?: Partial<TProps & TExtended>;
  /** Keys of custom props to filter out before passing to Component */
  customPropKeys?: (keyof TExtended)[];
};

/**
 * Unified options for creating component wrappers.
 * Always forwards ref for consistent API.
 */
type WrapperOptions<
  TProps,
  TExtended extends object = object,
  TWrapperProps extends BaseWrapperProps = BaseWrapperProps,
> = WrapperBaseOptions<TProps, TExtended> &
  (
    | {
        /** No wrapper component */
        wrapper?: undefined;
        wrapperProps?: never;
      }
    | {
        /** Wrapper component to wrap the output */
        wrapper: ComponentType<TWrapperProps>;
        /** Props to pass to wrapper (excluding children) */
        wrapperProps: Omit<TWrapperProps, "children">;
      }
  );

/**
 * Extract props type from a component, excluding ref
 */
type PropsOf<C extends ElementType> = ComponentPropsWithoutRef<C>;

/**
 * Extract props type from a component, including ref
 */
type PropsWithRefOf<C extends ElementType> = ComponentPropsWithRef<C>;

/**
 * Extract the ref type from a component using conditional type inference.
 * Falls back to unknown for components without typed refs.
 */
type RefOf<C extends ElementType> =
  ComponentPropsWithRef<C> extends RefAttributes<infer R> ? R : unknown;

/**
 * Creates a unified wrapper component that always forwards ref.
 * Handles all common patterns: simple passthrough, styling, and extended props.
 *
 * @example
 * // Simple passthrough (props inferred from component)
 * export const AccordionItem = createWrapper(UIAccordionItem, {
 *   displayName: "AccordionItem",
 * });
 *
 * @example
 * // With className override
 * export const Avatar = createWrapper(UIAvatar, {
 *   displayName: "Avatar",
 *   className: "rounded-full",
 * });
 *
 * @example
 * // With explicit types (when wrapping primitives)
 * export const AlertDialogTrigger = createWrapper<
 *   HTMLButtonElement,
 *   AlertDialogPrimitive.Trigger.Props
 * >(AlertDialogPrimitive.Trigger, {
 *   displayName: "AlertDialogTrigger",
 *   dataSlot: "alert-dialog-trigger",
 * });
 *
 * @example
 * // With custom props (extended)
 * export const AlertDialogFooter = createWrapper<
 *   HTMLDivElement,
 *   ComponentProps<"div">,
 *   { variant?: "default" | "bare" }
 * >("div", {
 *   displayName: "AlertDialogFooter",
 *   defaultProps: { variant: "default" },
 *   customPropKeys: ["variant"],
 *   className: ({ variant }) => cn(
 *     "flex gap-2 px-6",
 *     variant === "default" && "border-t bg-muted/50 py-4"
 *   ),
 * });
 */

// Overload 1: Explicit types (TRef, TProps) - use when wrapping primitives or need ref typing
function createWrapper<
  TRef,
  TProps extends object,
  TExtended extends object = object,
  TWrapperProps extends BaseWrapperProps = BaseWrapperProps,
>(
  Component: ElementType,
  options: WrapperOptions<TProps, TExtended, TWrapperProps>
): ForwardRefExoticComponent<TProps & TExtended & RefAttributes<TRef>>;

// Overload 2: Infer props from component - use when wrapping UI components
function createWrapper<
  C extends ElementType,
  TExtended extends object = object,
  TWrapperProps extends BaseWrapperProps = BaseWrapperProps,
>(
  Component: C,
  options: WrapperOptions<PropsOf<C>, TExtended, TWrapperProps>
): ForwardRefExoticComponent<PropsOf<C> & TExtended & RefAttributes<RefOf<C>>>;

// Implementation
function createWrapper(
  Component: ElementType,
  options: WrapperOptions<any, any, any>
): ForwardRefExoticComponent<any> {
  const {
    displayName,
    dataSlot,
    className: customClassName,
    defaultProps,
    customPropKeys,
  } = options;

  const Wrapper = forwardRef<unknown, object>((props, ref) => {
    const mergedProps = { ...defaultProps, ...props };
    const { className, ...rest } = mergedProps as object & { className?: string };

    // Calculate final className
    let finalClassName: string | undefined;
    if (typeof customClassName === "function") {
      finalClassName = cn(customClassName(mergedProps), className);
    } else if (customClassName) {
      finalClassName = cn(customClassName, className);
    } else {
      finalClassName = className;
    }

    // Filter out custom props before passing to Component
    let baseProps: Record<string, unknown> = rest;
    if (customPropKeys && customPropKeys.length > 0) {
      const keysToFilter = new Set(customPropKeys as string[]);
      baseProps = Object.fromEntries(
        Object.entries(rest).filter(([key]) => !keysToFilter.has(key))
      );
    }

    const finalProps = {
      ...baseProps,
      ref,
      ...(finalClassName && { className: finalClassName }),
      ...(dataSlot && { "data-slot": dataSlot }),
    };

    const content = createElement(Component, finalProps);
    if (options.wrapper) {
      return createElement(options.wrapper, {
        ...options.wrapperProps,
        children: content,
      });
    }

    return content;
  });

  Wrapper.displayName = displayName;
  return Wrapper as ForwardRefExoticComponent<any>;
}

/**
 * Options for variant wrappers (cva-based components)
 */
type VariantWrapperOptions<
  TProps,
  TVariantProps extends string,
  TExtendedProps extends object = object,
> = {
  /** Display name for React DevTools */
  displayName: string;
  /** UI component's variants function */
  uiVariants: VariantsFunction;
  /** Custom overrides cva function */
  customOverrides: VariantsFunction;
  /** Keys that are variant props (passed to both variants fn and component) */
  variantKeys: TVariantProps[];
  /** Default props to apply */
  defaultProps?: Partial<Omit<TProps, keyof TExtendedProps> & TExtendedProps>;
};

/**
 * Creates a wrapper for cva-based components using extendVariants pattern.
 * Automatically computes className from variant props and passes them to the component.
 * Supports extending prop types via the TExtendedProps generic.
 * Always forwards refs for consistency with createWrapper.
 *
 * @example
 * // Basic usage
 * export const Alert = createVariantWrapper(UIAlert, {
 *   displayName: "Alert",
 *   uiVariants: uiAlertVariants,
 *   customOverrides,
 *   variantKeys: ["variant"],
 * });
 *
 * @example
 * // With extended prop types
 * type ExtendedSize = "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm" | "icon-xs" | "icon-lg";
 *
 * export const Button = createVariantWrapper<
 *   typeof UIButton,
 *   "variant" | "size",
 *   { size?: ExtendedSize | null }
 * >(UIButton, {
 *   displayName: "Button",
 *   uiVariants: uiButtonVariants,
 *   customOverrides,
 *   variantKeys: ["variant", "size"],
 *   defaultProps: { size: "sm" },
 * });
 */
function createVariantWrapper<
  C extends ElementType,
  TVariantProps extends string,
  TExtendedProps extends object = object,
>(Component: C, options: VariantWrapperOptions<PropsOf<C>, TVariantProps, TExtendedProps>) {
  const { displayName, uiVariants, customOverrides, variantKeys, defaultProps } = options;
  const combinedVariants = extendVariants(uiVariants, customOverrides);

  // Extended props type: base props with overridden keys replaced
  type ExtendedComponentProps = Omit<PropsOf<C>, keyof TExtendedProps> & TExtendedProps;

  const Wrapper = forwardRef<RefOf<C>, ExtendedComponentProps>((props, ref) => {
    const mergedProps = { ...defaultProps, ...props } as ExtendedComponentProps & {
      className?: string;
    };
    const { className, ...rest } = mergedProps;

    // Extract variant props for the variants function
    const variantProps = variantKeys.reduce(
      (acc, key) => {
        if (key in rest) {
          acc[key] = (rest as Record<string, unknown>)[key];
        }
        return acc;
      },
      {} as Record<string, unknown>
    );

    // Compute className using extendVariants
    const finalClassName =
      className === undefined
        ? combinedVariants(variantProps)
        : combinedVariants({ ...variantProps, className });

    const finalProps = {
      ...rest,
      ref,
      className: finalClassName,
    } as PropsWithRefOf<C>;

    return createElement(Component, finalProps);
  });

  Wrapper.displayName = displayName;
  return Wrapper as ForwardRefExoticComponent<ExtendedComponentProps & RefAttributes<RefOf<C>>>;
}

/**
 * Identity function for re-exporting components with type preservation.
 * Useful for grouping re-exports with explicit typing.
 *
 * @example
 * export const {
 *   AlertDialog,
 *   AlertDialogPortal,
 * } = reExport({
 *   AlertDialog: UIAlertDialog,
 *   AlertDialogPortal: UIAlertDialogPortal,
 * });
 */
function reExport<T extends Record<string, unknown>>(exports: T): T {
  return exports;
}

export {
  createWrapper,
  createVariantWrapper,
  reExport,
  type BaseWrapperProps,
  type WrapperOptions,
  type VariantWrapperOptions,
  type PropsOf,
  type PropsWithRefOf,
  type RefOf,
};
