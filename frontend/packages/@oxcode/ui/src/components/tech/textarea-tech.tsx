"use client";

import React, { forwardRef } from "react";
import { motion } from "motion/react";
import { tv, type VariantProps } from "tailwind-variants";
import { TechCorner } from "./tech-decorations";

const textareaTech = tv({
  slots: {
    wrapper: "relative inline-flex w-full group",
    textarea: [
      "w-full bg-stone-900/80 border border-stone-800 text-stone-200 placeholder:text-stone-600",
      "font-mono text-sm transition-colors outline-none resize-none",
      "focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20",
      "disabled:opacity-50 disabled:cursor-not-allowed",
    ],
  },
  variants: {
    size: {
      sm: {
        textarea: "px-3 py-2 text-xs min-h-[80px]",
      },
      default: {
        textarea: "px-4 py-3 text-sm min-h-[120px]",
      },
      lg: {
        textarea: "px-4 py-4 text-base min-h-[160px]",
      },
    },
    variant: {
      default: {
        textarea: "",
      },
      error: {
        textarea: "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20",
      },
    },
  },
  defaultVariants: {
    size: "default",
    variant: "default",
  },
});

const transition = { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const };

function AnimatedCorners() {
  return (
    <>
      <motion.div
        initial={{ opacity: 0.5 }}
        variants={{ hover: { opacity: 1 } }}
        transition={transition}
        className="absolute top-0 left-0"
      >
        <TechCorner
          position="top-left"
          className="border-stone-700 group-focus-within:border-lime-500/50"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0.5 }}
        variants={{ hover: { opacity: 1 } }}
        transition={transition}
        className="absolute bottom-0 right-0"
      >
        <TechCorner
          position="bottom-right"
          className="border-stone-700 group-focus-within:border-lime-500/50"
        />
      </motion.div>
    </>
  );
}

type TextareaTechVariants = VariantProps<typeof textareaTech>;

export interface TextareaTechProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">, TextareaTechVariants {
  wrapperClassName?: string;
  showCorners?: boolean;
}

const TextareaTech = forwardRef<HTMLTextAreaElement, TextareaTechProps>(
  (
    {
      className,
      wrapperClassName,
      size = "default",
      variant = "default",
      showCorners = true,
      ...props
    },
    ref
  ) => {
    const styles = textareaTech({ size, variant });
    return (
      <motion.div
        initial="initial"
        whileHover="hover"
        className={styles.wrapper({ className: wrapperClassName })}
      >
        <textarea ref={ref} className={styles.textarea({ className })} {...props} />
        {showCorners && <AnimatedCorners />}
      </motion.div>
    );
  }
);

TextareaTech.displayName = "TextareaTech";

export { TextareaTech, textareaTech };
