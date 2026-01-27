import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[999px] border border-transparent h-6 px-[calc(--spacing(2)-1px)] pt-px text-[10px]/5 font-mono font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='size-'])]:size-3 [&_svg]:pointer-events-none [&_svg]:shrink-0 [button,a&]:cursor-pointer [button,a&]:pointer-coarse:after:absolute [button,a&]:pointer-coarse:after:size-full [button,a&]:pointer-coarse:after:min-h-11 [button,a&]:pointer-coarse:after:min-w-11",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [button,a&]:hover:bg-primary/90",
        destructive: "bg-destructive text-white [button,a&]:hover:bg-destructive/90",
        error: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
        info: "bg-info/8 text-info-foreground dark:bg-info/16",
        outline:
          "border-border bg-transparent dark:bg-input/32 [button,a&]:hover:bg-accent/50 dark:[button,a&]:hover:bg-input/48",
        secondary: "bg-secondary text-secondary-foreground [button,a&]:hover:bg-secondary/90",
        success: "bg-success/8 text-success-foreground dark:bg-success/16",
        warning: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
      },
    },
  }
);

export interface BadgeProps extends useRender.ComponentProps<"span"> {
  variant?: VariantProps<typeof badgeVariants>["variant"];
}

function Badge({ className, variant, render, ...props }: BadgeProps) {
  const defaultProps = {
    className: cn(badgeVariants({ className, variant })),
    "data-slot": "badge",
  };

  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(defaultProps, props),
    ...(render !== undefined ? { render } : {}),
  });
}

function BadgeDot({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("-mt-px size-1.5 rounded-full bg-current/50", className)}
      data-slot="badge-dot"
      {...props}
    />
  );
}

function BadgeButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "ml-1 rounded-md p-0.5 outline-none ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      data-slot="badge-button"
      {...props}
    />
  );
}

export { Badge, BadgeButton, BadgeDot, badgeVariants };
