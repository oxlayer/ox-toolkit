"use client";

import type * as React from "react";
import { cn } from "@oxlayer/shared-ui/lib";

export interface LabelTechProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

function LabelTech({ className, required, children, ...props }: LabelTechProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-stone-400",
        className
      )}
      data-slot="label-tech"
      {...props}
    >
      {children}
      {required && <span className="text-lime-500">*</span>}
    </label>
  );
}

export { LabelTech };
