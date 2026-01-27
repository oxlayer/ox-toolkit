"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import * as React from "react";

import { cn } from "../../lib/utils";

function Collapsible({
  asChild,
  children,
  className,
  ...props
}: CollapsiblePrimitive.Root.Props & {
  asChild?: boolean;
}) {
  if (asChild && React.isValidElement<Record<string, unknown>>(children)) {
    return (
      <CollapsiblePrimitive.Root
        data-slot="collapsible"
        {...(className !== undefined ? { className } : {})}
        render={children}
        {...props}
      />
    );
  }
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      {...(className !== undefined ? { className } : {})}
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Root>
  );
}

function CollapsibleTrigger({
  asChild,
  children,
  className,
  ...props
}: CollapsiblePrimitive.Trigger.Props & {
  asChild?: boolean;
}) {
  if (asChild && React.isValidElement<Record<string, unknown>>(children)) {
    return (
      <CollapsiblePrimitive.Trigger
        data-slot="collapsible-trigger"
        className={cn("cursor-pointer", className)}
        render={children}
        {...props}
      />
    );
  }
  return (
    <CollapsiblePrimitive.Trigger
      className={cn("cursor-pointer", className)}
      data-slot="collapsible-trigger"
      {...props}
    >
      {children}
    </CollapsiblePrimitive.Trigger>
  );
}

function CollapsiblePanel({ className, ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel
      className={cn(
        "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 data-ending-style:h-0 data-starting-style:h-0",
        className
      )}
      data-slot="collapsible-panel"
      {...props}
    />
  );
}

export {
  Collapsible,
  CollapsiblePanel as CollapsibleContent,
  CollapsiblePanel,
  CollapsibleTrigger,
};
