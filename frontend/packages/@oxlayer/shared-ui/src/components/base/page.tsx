"use client";

import type * as React from "react";

import { cn } from "../../lib/utils";
import { ScrollArea } from "./scroll-area";

function Page({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col h-full", className)} data-slot="page" {...props} />;
}

function PageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("shrink-0 space-y-2 px-6 pt-6", className)}
      data-slot="page-header"
      {...props}
    />
  );
}

function PageTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-xl font-semibold tracking-tight", className)}
      data-slot="page-title"
      {...props}
    />
  );
}

function PageDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-sm text-muted-foreground", className)}
      data-slot="page-description"
      {...props}
    />
  );
}

function PageContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className={cn("p-6", className)} data-slot="page-content" {...props}>
        {children}
      </div>
    </ScrollArea>
  );
}

function PageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("shrink-0 flex items-center px-6 pb-6", className)}
      data-slot="page-footer"
      {...props}
    />
  );
}

export { Page, PageContent, PageDescription, PageFooter, PageHeader, PageTitle };
