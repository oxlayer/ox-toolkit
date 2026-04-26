"use client";

import React, { forwardRef } from "react";
import { motion } from "motion/react";
import { tv, type VariantProps } from "tailwind-variants";
import { TechCorner } from "./tech-decorations";

const inputTech = tv({
  slots: {
    wrapper: "relative inline-flex w-full group",
    input: [
      "w-full bg-stone-500/10 border border-stone-800 text-stone-900 placeholder:text-stone-600",
      "font-mono text-sm transition-colors outline-none",
      "focus:border-green-500/10 focus:ring-1 focus:ring-green-500/10",
      "disabled:opacity-50 disabled:cursor-not-allowed",
    ],
  },
  variants: {
    size: {
      sm: {
        input: "px-3 py-2 text-xs",
      },
      default: {
        input: "px-4 py-3 text-sm",
      },
      lg: {
        input: "px-4 py-4 text-base",
      },
    },
    variant: {
      default: {
        input: "",
      },
      error: {
        input: "border-green-500/50 focus:border-green-500/70 focus:ring-green-500/10",
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
          className="border-stone-700 group-focus-within:border-green-500/50"
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
          className="border-stone-700 group-focus-within:border-green-500/50"
        />
      </motion.div>
    </>
  );
}

type InputTechVariants = VariantProps<typeof inputTech>;

export interface InputTechProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">, InputTechVariants {
  wrapperClassName?: string;
  showCorners?: boolean;
}

const InputTech = forwardRef<HTMLInputElement, InputTechProps>(
  (
    {
      className,
      wrapperClassName,
      size = "default",
      variant = "default",
      showCorners = true,
      type = "text",
      ...props
    },
    ref
  ) => {
    const styles = inputTech({ size, variant });

    return (
      <motion.div
        initial="initial"
        whileHover="hover"
        className={styles.wrapper({ className: wrapperClassName })}
      >
        <input ref={ref} type={type} className={styles.input({ className })} {...props} />
        {showCorners && <AnimatedCorners />}
      </motion.div>
    );
  }
);

InputTech.displayName = "InputTech";

export { InputTech, inputTech };
