"use client";

import { motion } from "motion/react";
import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import { cn, Button } from "@oxlayer/shared-ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MotionButton: any = motion.create(Button);

const buttonTech = tv({
  slots: {
    button: ["relative rounded-none font-mono uppercase tracking-wider transition-colors"],
  },
  variants: {
    variant: {
      outline: {
        button: "border border-muted-foreground/30 bg-transparent hover:bg-muted/10",
      },
      solid: {
        button: "border-0 bg-primary text-primary-foreground font-bold hover:bg-primary/90",
      },
    },
    size: {
      xs: {
        button: [
          "min-h-6 gap-1 tracking-tight text-[11px] px-[calc(--spacing(2)-1px)] py-[calc(--spacing(1)-1px)]",
        ],
      },
      sm: {
        button: [
          "min-h-9 gap-1.5 text-xs px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(1)-1px)]",
        ],
      },
      default: {
        button: ["min-h-8 px-[calc(--spacing(3)-1px)] py-[calc(--spacing(1.5)-1px)] text-sm"],
      },
      lg: {
        button: ["min-h-9 px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2)-1px)] text-sm"],
      },
      xl: {
        button: ["min-h-10 px-[calc(--spacing(4)-1px)] py-[calc(--spacing(2)-1px)] text-base"],
      },
    },
  },
  compoundVariants: [
    {
      variant: "solid",
      size: "xs",
      class: {
        button:
          "[clip-path:polygon(6px_0,100%_0,100%_calc(100%-6px),calc(100%-6px)_100%,0_100%,0_6px)]",
      },
    },
    {
      variant: "solid",
      size: "sm",
      class: {
        button:
          "[clip-path:polygon(8px_0,100%_0,100%_calc(100%-8px),calc(100%-8px)_100%,0_100%,0_8px)]",
      },
    },
    {
      variant: "solid",
      size: "default",
      class: {
        button:
          "[clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]",
      },
    },
    {
      variant: "solid",
      size: "lg",
      class: {
        button:
          "[clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)]",
      },
    },
    {
      variant: "solid",
      size: "xl",
      class: {
        button:
          "[clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)]",
      },
    },
  ],
  defaultVariants: {
    variant: "outline",
    size: "sm",
  },
});

const cornerSizes = {
  xs: "6px",
  sm: "8px",
  default: "10px",
  lg: "12px",
  xl: "14px",
} as const;

const transition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const };

interface AnimatedCornersProps {
  variant: "outline" | "solid";
  size: keyof typeof cornerSizes;
}

function AnimatedCorners({ variant, size }: AnimatedCornersProps) {
  const cornerSize = cornerSizes[size];
  const color = variant === "outline" ? "bg-foreground" : "bg-primary/80";

  if (variant === "solid") {
    return (
      <>
        {/* Top Left */}
        <motion.div
          initial={{ height: 0 }}
          variants={{ hover: { height: cornerSize } }}
          transition={transition}
          className={cn("absolute left-0 top-0 w-px origin-top", color)}
        />
        <motion.div
          initial={{ width: 0 }}
          variants={{ hover: { width: cornerSize } }}
          transition={transition}
          className={cn("absolute left-0 top-0 h-px origin-left", color)}
        />
        {/* Bottom Right */}
        <motion.div
          initial={{ height: 0 }}
          variants={{ hover: { height: cornerSize } }}
          transition={transition}
          className={cn("absolute right-0 bottom-0 w-px origin-bottom", color)}
        />
        <motion.div
          initial={{ width: 0 }}
          variants={{ hover: { width: cornerSize } }}
          transition={transition}
          className={cn("absolute right-0 bottom-0 h-px origin-right", color)}
        />
      </>
    );
  }

  return (
    <>
      {/* Top Left */}
      <motion.div
        initial={{ height: 0 }}
        variants={{ hover: { height: cornerSize } }}
        transition={transition}
        className={cn("absolute left-0 top-0 w-px origin-top", color)}
      />
      <motion.div
        initial={{ width: 0 }}
        variants={{ hover: { width: cornerSize } }}
        transition={transition}
        className={cn("absolute left-0 top-0 h-px origin-left", color)}
      />
      {/* Top Right */}
      <motion.div
        initial={{ height: 0 }}
        variants={{ hover: { height: cornerSize } }}
        transition={transition}
        className={cn("absolute right-0 top-0 w-px origin-top", color)}
      />
      <motion.div
        initial={{ width: 0 }}
        variants={{ hover: { width: cornerSize } }}
        transition={transition}
        className={cn("absolute right-0 top-0 h-px origin-right", color)}
      />
      {/* Bottom Left */}
      <motion.div
        initial={{ height: 0 }}
        variants={{ hover: { height: cornerSize } }}
        transition={transition}
        className={cn("absolute left-0 bottom-0 w-px origin-bottom", color)}
      />
      <motion.div
        initial={{ width: 0 }}
        variants={{ hover: { width: cornerSize } }}
        transition={transition}
        className={cn("absolute left-0 bottom-0 h-px origin-left", color)}
      />
      {/* Bottom Right */}
      <motion.div
        initial={{ height: 0 }}
        variants={{ hover: { height: cornerSize } }}
        transition={transition}
        className={cn("absolute right-0 bottom-0 w-px origin-bottom", color)}
      />
      <motion.div
        initial={{ width: 0 }}
        variants={{ hover: { width: cornerSize } }}
        transition={transition}
        className={cn("absolute right-0 bottom-0 h-px origin-right", color)}
      />
    </>
  );
}

type ButtonTechVariants = VariantProps<typeof buttonTech>;

type MotionButtonStyle = React.ComponentProps<typeof MotionButton>["style"];

export interface ButtonTechProps
  extends
  Omit<
    React.ComponentProps<typeof Button>,
    | "variant"
    | "size"
    | "style"
    | "onAnimationStart"
    | "onAnimationEnd"
    | "onAnimationIteration"
    | "onDragStart"
    | "onDrag"
    | "onDragEnd"
  >,
  ButtonTechVariants {
  style?: MotionButtonStyle;
}

export function ButtonTech({
  children,
  className,
  size = "sm",
  variant = "outline",
  style,
  ...props
}: ButtonTechProps) {
  const styles = buttonTech({ variant, size });

  return (
    <MotionButton
      initial="initial"
      whileHover="hover"
      variant="ghost"
      size={size}
      className={styles.button({ className: cn("tracking-tight", className) })}
      {...(style !== undefined ? { style } : {})}
      {...props}
    >
      {children}
      <AnimatedCorners variant={variant} size={size ?? "sm"} />
    </MotionButton>
  );
}
