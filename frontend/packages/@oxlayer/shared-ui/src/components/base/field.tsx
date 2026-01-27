"use client";

import { Field as FieldPrimitive } from "@base-ui/react/field";

import { cn } from "../../lib/utils";

function Field({ className, ...props }: FieldPrimitive.Root.Props) {
  return (
    <FieldPrimitive.Root
      className={cn("flex flex-col items-start gap-2", className)}
      data-slot="field"
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: FieldPrimitive.Label.Props) {
  return (
    <FieldPrimitive.Label
      className={cn(
        "inline-flex items-center gap-2 text-xs/relaxed text-secondary-foreground/50 font-mono uppercase",
        className
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: FieldPrimitive.Description.Props) {
  return (
    <FieldPrimitive.Description
      className={cn("text-muted-foreground text-xs", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

function FieldError({ className, ...props }: FieldPrimitive.Error.Props) {
  return (
    <FieldPrimitive.Error
      className={cn("text-destructive-foreground text-xs", className)}
      data-slot="field-error"
      {...props}
    />
  );
}

function FieldErrorList({
  errors,
  className,
}: {
  errors?: Array<{ message?: string } | string> | unknown;
  className?: string;
}) {
  if (!errors) return null;

  const errorArray = Array.isArray(errors) ? errors : [];
  if (errorArray.length === 0) return null;

  const errorMessages = errorArray
    .map(error => {
      if (typeof error === "string") return error;
      if (error && typeof error === "object" && "message" in error) {
        return typeof error.message === "string" ? error.message : undefined;
      }
      return undefined;
    })
    .filter((msg): msg is string => Boolean(msg));

  if (errorMessages.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {errorMessages.map((message, index) => (
        <FieldError key={index}>{message}</FieldError>
      ))}
    </div>
  );
}

const FieldControl = FieldPrimitive.Control;
const FieldValidity = FieldPrimitive.Validity;

export {
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldErrorList,
  FieldLabel,
  FieldValidity,
};
