"use client";

import { cn, Badge, type BadgeProps } from "@oxlayer/shared-ui";

interface BadgeTechProps extends Omit<BadgeProps, "variant"> {
  children: React.ReactNode;
}

export function BadgeTech({ children, className, ...props }: BadgeTechProps) {
  return (
    <Badge
      className={cn(
        "rounded-none border-muted-foreground/30 bg-muted/20 text-[10px] font-mono uppercase tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}
