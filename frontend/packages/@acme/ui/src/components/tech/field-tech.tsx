"use client";

import React from "react";
import { cn } from "@oxlayer/shared-ui/lib";
import { LabelTech, type LabelTechProps } from "./label-tech";
import { InputTech, type InputTechProps } from "./input-tech";

interface FieldTechProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function FieldTech({ className, children, ...props }: FieldTechProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} data-slot="field-tech" {...props}>
      {children}
    </div>
  );
}

function FieldTechLabel({ className, ...props }: LabelTechProps) {
  return <LabelTech className={cn("mb-0.5", className)} {...props} />;
}

function FieldTechControl(props: InputTechProps) {
  return <InputTech {...props} />;
}

interface FieldTechDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FieldTechDescription({ className, ...props }: FieldTechDescriptionProps) {
  return (
    <p
      className={cn("font-mono text-[10px] text-stone-500 uppercase tracking-wide", className)}
      data-slot="field-tech-description"
      {...props}
    />
  );
}

interface FieldTechErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {}

function FieldTechError({ className, ...props }: FieldTechErrorProps) {
  return (
    <p
      className={cn("font-mono text-xs text-red-500", className)}
      data-slot="field-tech-error"
      {...props}
    />
  );
}

export { FieldTech, FieldTechLabel, FieldTechControl, FieldTechDescription, FieldTechError };

export type { FieldTechProps, FieldTechDescriptionProps, FieldTechErrorProps };
